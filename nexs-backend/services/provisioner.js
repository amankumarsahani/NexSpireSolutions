/**
 * Tenant Provisioner Service
 * Handles automated provisioning of new tenant instances:
 * - Database creation and migration
 * - PM2 process management
 * - Cloudflare DNS configuration
 * - Registry service registration (for mobile app lookup)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const execAsync = promisify(exec);
const fs = require('fs').promises; // Keep fs.promises for async operations
const path = require('path');
const axios = require('axios'); // Added axios
const { pool } = require('../config/database');
const TenantModel = require('../models/tenant.model');
const ServerModel = require('../models/server.model'); // Added ServerModel
const EmailService = require('./email.service');
const { deriveSupportSecret } = require('../utils/supportSecret');

function deriveTenantJwtSecret(rootSecret, tenantSlug) {
    if (!rootSecret || String(rootSecret).length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters before provisioning tenants');
    }

    const normalizedSlug = String(tenantSlug || '')
        .trim()
        .toLowerCase()
        .replace(/^nexcrm_/, '')
        .replace(/_/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    if (!normalizedSlug) {
        throw new Error('Tenant slug is required to derive a tenant signing secret');
    }

    return crypto
        .createHmac('sha256', String(rootSecret))
        .update(`napcrm:tenant:${normalizedSlug}:v1`)
        .digest('base64url');
}

class Provisioner {
    constructor() {
        // Paths - adjust based on your server setup
        this.nexcrmBackendPath = process.env.NEXCRM_BACKEND_PATH || '/var/www/html/napcrm-backend';
        this.migrationsPath = path.join(__dirname, '../database/migrations');

        // Database fallbacks
        this.dbHost = process.env.DB_HOST || 'localhost';
        this.dbPort = process.env.DB_PORT || 3306;
        this.dbUser = process.env.DB_USER || 'root';
        this.dbPass = process.env.DB_PASSWORD || '';

        // Cloudflare config
        this.cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
        this.cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
        this.cfDomain = process.env.NEXCRM_DOMAIN || 'napnix.in';
        this.cfPagesUrl = process.env.NEXCRM_PAGES_URL || 'napcrm-frontend.pages.dev';
        this.cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        this.cfPagesProject = process.env.NEXCRM_PAGES_PROJECT || 'napcrm-frontend';

        // Registry service config
        this.registryUrl = process.env.REGISTRY_URL || 'http://localhost:4000';
        this.registryApiKey = process.env.REGISTRY_API_KEY;

        // Log configuration status
        console.log('[Provisioner] Configuration:');
        console.log(`  - DB Host: ${this.dbHost}, Port: ${this.dbPort}, User: ${this.dbUser}`);
        console.log(`  - CF API Token: ${this.cfApiToken ? 'SET' : 'NOT SET'}`);
        console.log(`  - SMTP configured: ${process.env.SMTP_HOST ? 'YES' : 'NO'}`);
    }

    /**
     * Execute command on a specific server (local or remote via SSH)
     */
    async executeOnServer(server, command) {
        if (server.is_primary) {
            console.log(`[Provisioner] Executing locally: ${command}`);
            return execAsync(command);
        } else {
            const sshTarget = this.getServerSshTarget(server);
            // Use SSH over Cloudflare Tunnel if no public IP
            // Assumes ~/.ssh/config is set up to use cloudflared for this hostname
            const sshCmd = `ssh -o BatchMode=yes ${sshTarget} \"${command.replace(/\"/g, '\\\\"')}\"`;
            console.log(`[Provisioner] Executing remotely on ${server.name}: ${sshCmd}`);
            return execAsync(sshCmd);
        }
    }

    getServerSshTarget(server = {}) {
        if (!server.hostname) {
            throw new Error('Server hostname is required for remote execution');
        }

        if (server.hostname.includes('@') || !server.ssh_user) {
            return server.hostname;
        }

        return `${server.ssh_user}@${server.hostname}`;
    }

    getServerDbPort(server = {}) {
        return Number(server.db_port || this.dbPort || 3306);
    }

    getServerBackendPath(server = {}) {
        return server.nexcrm_backend_path || this.nexcrmBackendPath;
    }

    getServerEcosystemConfigPath(server = {}) {
        return server.ecosystem_config_path || '/var/www/html/ecosystem.config.js';
    }

    getServerTunnelConfigPath(server = {}) {
        return server.cloudflare_config_path || server.cf_config_path || '/etc/cloudflared/config.yml';
    }

    quoteShellArg(value) {
        return `'${String(value ?? '').replace(/'/g, `'\\''`)}'`;
    }

    buildMysqlCliPrefix(server = {}) {
        const dbHost = server.db_host || this.dbHost;
        const dbPort = this.getServerDbPort(server);
        const dbUser = server.db_user || this.dbUser;
        const dbPass = server.db_password || this.dbPass;

        return [
            `MYSQL_PWD=${this.quoteShellArg(dbPass)}`,
            'mysql',
            '-h',
            this.quoteShellArg(dbHost),
            '-P',
            this.quoteShellArg(dbPort),
            '-u',
            this.quoteShellArg(dbUser)
        ].join(' ');
    }

    buildTenantEcosystemApp(tenant, port, server) {
        const processName = `tenant-${tenant.slug}`;
        const backendPath = this.getServerBackendPath(server);
        const dbSlug = tenant.slug.replace(/-/g, '_');
        const dbPass = server.db_password || this.dbPass;
        const tenantJwtSecret = deriveTenantJwtSecret(process.env.JWT_SECRET, tenant.slug);
        // Per-tenant support secret so no shared key lives on tenant servers.
        const supportSecret = deriveSupportSecret(tenant.slug);

        const industry = tenant.industry_type || 'general';
        // Only the `school` industry reads this. 'college' turns on semesters, subject
        // credits, SGPA/CGPA and the backlog register on the same schema.
        const academicMode = industry === 'school' ? (tenant.academic_mode || 'school') : null;
        const academicArg = academicMode ? ` --academic-mode ${academicMode}` : '';

        return {
            name: processName,
            cwd: backendPath,
            script: 'server.js',
            args: `--port ${port} --db nexcrm_${dbSlug} --industry ${industry} --plan ${tenant.plan_slug || 'starter'}${academicArg}`,
            env: {
                PORT: port,
                DB_HOST: server.db_host || this.dbHost,
                DB_PORT: this.getServerDbPort(server),
                DB_NAME: `nexcrm_${dbSlug}`,
                DB_USER: server.db_user || this.dbUser,
                DB_PASSWORD: dbPass,
                TENANT_ID: tenant.id,
                TENANT_SLUG: tenant.slug,
                JWT_SECRET: tenantJwtSecret,
                TENANT_JWT_SECRET: tenantJwtSecret,
                INDUSTRY_TYPE: industry,
                PLAN_SLUG: tenant.plan_slug || 'starter',
                // Support desk: tenant CRM forwards tickets back to this master API,
                // authenticating with its own derived secret (never a shared key).
                NEXS_BACKEND_URL: process.env.NEXS_BACKEND_URL || process.env.API_URL || 'http://localhost:5000',
                SUPPORT_TENANT_SECRET: supportSecret,
                ...(academicMode ? { ACADEMIC_MODE: academicMode } : {})
            }
        };
    }

    buildEcosystemMutationCommand(ecosystemPath, operation, payload) {
        const payloadBase64 = require('node:buffer').Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

        return `node - "${ecosystemPath}" "${operation}" "${payloadBase64}" <<'EOFNODE'
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const ecosystemPath = process.argv[2];
const operation = process.argv[3];
const payload = JSON.parse(Buffer.from(process.argv[4], 'base64').toString('utf8'));
const sandbox = { module: { exports: {} }, exports: {} };

let currentConfig = { apps: [] };
if (fs.existsSync(ecosystemPath)) {
  const source = fs.readFileSync(ecosystemPath, 'utf8');
  vm.runInNewContext(source, sandbox, { filename: ecosystemPath });
  currentConfig = sandbox.module.exports || sandbox.exports || currentConfig;
}

if (!currentConfig || typeof currentConfig !== 'object' || Array.isArray(currentConfig)) {
  throw new Error('ecosystem.config.js must export an object');
}

const apps = Array.isArray(currentConfig.apps) ? currentConfig.apps : [];
let nextApps;

if (operation === 'upsert') {
  nextApps = apps.filter((app) => app && app.name !== payload.name);
  nextApps.push(payload);
} else if (operation === 'remove') {
  nextApps = apps.filter((app) => app && app.name !== payload.processName);
} else {
  throw new Error(\`Unsupported ecosystem mutation: \${operation}\`);
}

const nextConfig = { ...currentConfig, apps: nextApps };
const nextSource = 'module.exports = ' + JSON.stringify(nextConfig, null, 2) + ';\\n';
vm.runInNewContext(nextSource, { module: { exports: {} }, exports: {} }, { filename: ecosystemPath });

const tmpPath = path.join(os.tmpdir(), \`ecosystem.\${Date.now()}.\${process.pid}.js\`);
fs.writeFileSync(tmpPath, nextSource, 'utf8');
console.log(tmpPath);
EOFNODE`;
    }

    /**
     * Full tenant provisioning flow
     */
    async provisionTenant(tenant, preferredServerId = null, options = {}) {
        const { id, name, slug, email, industry_type, plan_slug } = tenant;
        let currentStep = 'select_server';
        const setStep = async (step, extra = {}) => {
            currentStep = step;
            await TenantModel.update(id, {
                provision_step: step,
                provision_error: null,
                ...extra
            });
        };

        console.log(`[Provisioner] Starting provisioning for: ${slug}`);

        try {
            await setStep('select_server', {
                process_status: 'starting',
                provisioning_started_at: new Date(),
                provisioning_completed_at: null
            });

            // 0. Select Server
            let server;
            if (preferredServerId) {
                server = await ServerModel.findById(preferredServerId);
            } else {
                server = await ServerModel.getBestServer();
            }

            if (!server) {
                throw new Error('No available servers for provisioning');
            }

            console.log(`[Provisioner] Provisioning tenant "${tenant.name}" on server "${server.name}"`);

            // 1. Allocate port
            await setStep('allocate_port');
            let port;
            if (options.skipPortAllocation && options.assignedPort) {
                port = options.assignedPort;
                console.log(`[Provisioner] Using pre-allocated port: ${port}`);
            } else {
                port = await TenantModel.allocatePort(id, server.id);
                console.log(`[Provisioner] Allocated port: ${port}`);
            }

            // Update tenant with assigned server (duplicate update if already done but safe)
            await TenantModel.update(id, { server_id: server.id });

            // 2. Create database
            const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
            const processName = `tenant-${slug}`;

            await setStep('create_database');
            if (!options.skipDbCreation) {
                await this.createDatabase(dbName, server);
                console.log(`[Provisioner] Created database: ${dbName}`);
            } else {
                console.log(`[Provisioner] Database creation skipped (assumed pre-created): ${dbName}`);
            }

            // Persist recoverable infrastructure immediately. Later failures must not
            // hide the already-created database or cause a retry to allocate a new port.
            await TenantModel.updateProcessInfo(id, {
                assigned_port: port,
                db_name: dbName,
                process_name: processName,
                process_status: 'starting'
            });

            // 3. Run migrations on new database (base + industry-specific)
            await setStep('migrations');
            await this.runMigrations(dbName, industry_type, server);
            console.log(`[Provisioner] Migrations complete (industry: ${industry_type})`);

            // 3b. Seed industry master data. A school with no academic session cannot have a
            // class, so it cannot have a student, so every screen is an empty state. Seeding
            // is what makes the tenant usable on day one.
            await setStep('industry_seed');
            await this.seedIndustryMasters(dbName, industry_type, tenant.academic_mode, server);

            // 4. Create admin user in tenant DB
            await setStep('tenant_admin');
            const adminPassword = await this.createTenantAdmin(dbName, email, name, server);
            console.log(`[Provisioner] Admin user created`);

            // 4b. Create Napnix super admin in tenant DB (for support access)
            await setStep('support_admin');
            await this.createNapnixSuperAdmin(dbName, server);
            console.log(`[Provisioner] Napnix super admin added`);

            // 4c. Seed initial settings (company
            // 5. Seed settings
            await setStep('settings');
            await this.seedInitialSettings(dbName, tenant, server);
            console.log(`[Provisioner] Initial settings seeded`);

            // 5b. Provision default SES-backed mailbox addresses (support@/sales@/notifications@
            // <slug>.mail.napnix.in). No per-tenant AWS/DNS work needed — the parent mail
            // domain is verified once in SES, so any address under it just works.
            await setStep('mailboxes');
            await this.createDefaultEmailAddresses(dbName, slug, server);
            console.log(`[Provisioner] Default email addresses created`);

            // 5. Update tenant record with process info and admin password
            await TenantModel.updateProcessInfo(id, {
                assigned_port: port,
                db_name: dbName,
                process_name: processName,
                process_status: 'starting'
            });

            // Store admin password for later retrieval
            await this.storeAdminPassword(id, adminPassword);

            // 6. Add Cloudflare DNS routes (API + Frontend)
            await setStep('dns');
            let cfRouteId = null;
            if (this.cfApiToken && this.cfZoneId) {
                // API subdomain (tenant-crm-api.domain -> tunnel)
                cfRouteId = await this.addCloudflareRoute(slug, port, server);
                await TenantModel.updateCfDnsRecordId(id, cfRouteId);
                console.log(`[Provisioner] Cloudflare API route added`);

                // Frontend subdomain (tenant-crm.domain -> Cloudflare Pages)
                await this.addCloudflareFrontendRoute(slug);
                console.log(`[Provisioner] Cloudflare frontend route added`);
            }

            // 6.1 Handle Custom Domain if present
            if (tenant.custom_domain) {
                await this.setupCustomDomain(tenant, server.cloudflare_tunnel_id);
                console.log(`[Provisioner] Custom domain setup for ${tenant.custom_domain}`);
            }

            // 7. Start PM2 process (with industry and plan for feature config)
            await setStep('start_process');
            await this.startProcess(tenant, port, server);
            await TenantModel.updateProcessStatus(id, 'running');
            console.log(`[Provisioner] PM2 process started`);

            // 7.1 Tunnel config already updated by addCloudflareRoute in step 6
            // No duplicate call needed here

            // 8. Register with registry service (for mobile app lookup)
            await setStep('registry');
            const apiSubdomain = `${slug}-crm-api.${this.cfDomain}`;
            await this.registerWithRegistry({
                email,
                tenant_slug: slug,
                tenant_name: name,
                subdomain: apiSubdomain,
                industry: industry_type
            });
            console.log(`[Provisioner] Registered with registry service`);

            // 9. Add storefront DNS (slug.domain -> Cloudflare Pages for storefront)
            await setStep('storefront_dns');
            if (this.cfApiToken && this.cfZoneId) {
                await this.addStorefrontRoute(slug);
                console.log(`[Provisioner] Cloudflare storefront route added`);
            }

            // 10. Send welcome email with credentials
            try {
                await EmailService.sendTenantWelcomeEmail({
                    name,
                    email,
                    password: adminPassword,
                    slug,
                    industry: industry_type
                });
                console.log(`[Provisioner] Welcome email sent to ${email}`);
            } catch (emailError) {
                console.warn(`[Provisioner] Could not send welcome email:`, emailError.message);
            }

            const completedAt = new Date();
            const completedTenant = await TenantModel.findById(id);
            const completionUpdate = {
                process_status: 'running',
                provision_step: 'ready',
                provision_error: null,
                provisioning_completed_at: completedAt
            };

            // A trial starts when the tenant first becomes usable, not when its
            // master row is created. Preserve the originally requested duration,
            // and never extend it on a later re-provision.
            if (
                completedTenant
                && !completedTenant.provisioning_completed_at
                && completedTenant.status === 'trial'
            ) {
                const originalStart = new Date(completedTenant.created_at).getTime();
                const originalEnd = new Date(completedTenant.trial_ends_at).getTime();
                const requestedDuration = originalEnd - originalStart;
                const trialDuration = Number.isFinite(requestedDuration) && requestedDuration > 0
                    ? requestedDuration
                    : 14 * 24 * 60 * 60 * 1000;
                completionUpdate.trial_ends_at = new Date(completedAt.getTime() + trialDuration);
            }

            await TenantModel.update(id, completionUpdate);

            return {
                port,
                dbName,
                processName,
                subdomain: `${slug}.${this.cfDomain}`,
                adminPassword,
                cfRouteId
            };

        } catch (error) {
            console.error(`[Provisioner] Error:`, error);
            await TenantModel.update(id, {
                process_status: 'error',
                provision_step: currentStep,
                provision_error: error.message,
                provisioning_completed_at: null
            });
            throw error;
        }
    }

    /**
     * Create new database for tenant
     */
    async createDatabase(dbName, serverOrHost = 'localhost', dbUser = null, dbPassword = null) {
        const isServerObject = serverOrHost && typeof serverOrHost === 'object';
        const server = isServerObject ? serverOrHost : null;
        const targetHost = server ? (server.db_host || this.dbHost) : (serverOrHost || this.dbHost);
        const targetPort = server ? this.getServerDbPort(server) : Number(this.dbPort || 3306);
        const targetUser = server ? (server.db_user || this.dbUser) : (dbUser || this.dbUser);
        const targetPass = server ? (server.db_password || this.dbPass) : (dbPassword || this.dbPass);
        const sql = `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${targetUser}'@'localhost'; FLUSH PRIVILEGES;`;

        if (server && !server.is_primary) {
            await this.executeOnServer(server, `${this.buildMysqlCliPrefix(server)} -e ${this.quoteShellArg(sql)}`);
            return;
        }

        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: targetHost,
            port: targetPort,
            user: targetUser,
            password: targetPass,
            multipleStatements: true
        });

        try {
            await connection.query(sql);
        } finally {
            await connection.end();
        }
    }

    /**
     * Where an industry's DDL lives, in priority order.
     *
     * Canonical (new industries, starting with `school`):
     *   <nexcrm-backend>/database/migrations/<industry>/sql/*.sql
     * That same folder is executed by nexcrm-backend's own migration runner via thin .js
     * wrappers, so a newly provisioned tenant and an existing migrated tenant get a byte-
     * identical schema. One file, one schema.
     *
     * Legacy (every pre-existing industry): nexs-backend/database/migrations/industry/<industry>/*.sql
     * kept as a fallback so nothing regresses. New industries should not add files there.
     */
    getIndustrySqlDirs(industryType, server) {
        const backendPath = this.getServerBackendPath(server);

        return [
            path.join(backendPath, 'database', 'migrations', industryType, 'sql'),
            path.join(this.migrationsPath, 'industry', industryType)
        ];
    }

    /**
     * Run migrations on tenant database
     */
    async runMigrations(dbName, industryType = 'general', server = { is_primary: true }) {
        const schemaFile = path.join(this.migrationsPath, 'nexcrm_base_schema.sql');
        const hasIndustry = industryType && industryType !== 'general';

        if (server.is_primary) {
            const tenantPool = require('mysql2/promise').createPool({
                host: server.db_host || this.dbHost,
                port: this.getServerDbPort(server),
                user: server.db_user || this.dbUser,
                password: server.db_password || this.dbPass,
                database: dbName,
                multipleStatements: true
            });

            try {
                const sql = await fs.readFile(schemaFile, 'utf8');
                await tenantPool.query(sql);

                if (hasIndustry) {
                    // First directory that actually has .sql files wins. Never both — running
                    // canonical and legacy DDL over the same DB is how schemas drift.
                    for (const dir of this.getIndustrySqlDirs(industryType, server)) {
                        let sqlFiles = [];
                        try {
                            const files = await fs.readdir(dir);
                            sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
                        } catch (e) {
                            continue; // directory does not exist
                        }

                        if (sqlFiles.length === 0) continue;

                        console.log(`[Provisioner] Industry DDL: ${dir} (${sqlFiles.length} files)`);
                        for (const file of sqlFiles) {
                            const industrySql = await fs.readFile(path.join(dir, file), 'utf8');
                            await tenantPool.query(industrySql);
                        }
                        break;
                    }
                }
            } finally {
                await tenantPool.end();
            }
        } else {
            const remotePath = this.getServerBackendPath(server);
            const mysqlPrefix = this.buildMysqlCliPrefix(server);

            // Base schema is read from the remote box's own checkout, as before.
            const remoteMigrations = path.join(remotePath, 'database/migrations');
            const baseSchema = path.join(remoteMigrations, 'nexcrm_base_schema.sql');
            const cmd = `${mysqlPrefix} ${this.quoteShellArg(dbName)} < ${this.quoteShellArg(baseSchema)}`;
            await this.executeOnServer(server, cmd);

            if (hasIndustry) {
                // Same precedence as the primary path, resolved shell-side: canonical dir on the
                // remote nexcrm-backend checkout, else the legacy industry dir.
                const canonicalDir = path.posix.join(
                    remotePath.replace(/\\/g, '/'), 'database', 'migrations', industryType, 'sql'
                );
                const legacyDir = path.posix.join(
                    remotePath.replace(/\\/g, '/'), 'database', 'migrations', 'industry', industryType
                );

                const industryCmd =
                    `DIR=""; ` +
                    `if ls ${canonicalDir}/*.sql >/dev/null 2>&1; then DIR=${canonicalDir}; ` +
                    `elif ls ${legacyDir}/*.sql >/dev/null 2>&1; then DIR=${legacyDir}; fi; ` +
                    `if [ -n "$DIR" ]; then for f in $DIR/*.sql; do ${mysqlPrefix} ${this.quoteShellArg(dbName)} < "$f"; done; fi`;

                await this.executeOnServer(server, industryCmd);
            }
        }
    }

    /**
     * Seed an industry's master data straight after migrations.
     *
     * The seed lives in nexcrm-backend (`database/seeds/<industry>.js`) because that is the
     * repo that owns the tenant schema. Keeping a second copy here is how the schema and the
     * seed drift apart. Seeding is best-effort: a tenant that provisions with an empty
     * academic setup is recoverable (the admin fills it in), so a seed failure must not
     * abort a provision that has already created the database and the DNS.
     */
    async seedIndustryMasters(dbName, industryType, academicMode, server = { is_primary: true }) {
        if (industryType !== 'school') {
            return; // other industries seed nothing yet
        }

        const mode = academicMode || 'school';
        const backendPath = this.getServerBackendPath(server);

        try {
            if (server.is_primary) {
                const seedPath = path.join(backendPath, 'database', 'seeds', 'school.js');
                // eslint-disable-next-line import/no-dynamic-require, global-require
                const { seedSchool } = require(seedPath);

                const connection = await require('mysql2/promise').createConnection({
                    host: server.db_host || this.dbHost,
                    port: this.getServerDbPort(server),
                    user: server.db_user || this.dbUser,
                    password: server.db_password || this.dbPass,
                    database: dbName,
                });

                try {
                    const result = await seedSchool(connection, mode);
                    console.log(`[Provisioner] School masters seeded (${mode}):`, JSON.stringify(result.created));
                } finally {
                    await connection.end();
                }
            } else {
                const cmd = `cd ${this.quoteShellArg(backendPath)} && node database/seeds/school.js `
                    + `--db ${this.quoteShellArg(dbName)} --mode ${this.quoteShellArg(mode)}`;
                await this.executeOnServer(server, cmd);
                console.log(`[Provisioner] School masters seeded on remote (${mode})`);
            }
        } catch (error) {
            console.warn(`[Provisioner] School seeding failed (tenant is still usable, admin must set up manually): ${error.message}`);
        }
    }

    /**
     * Create admin user in tenant database
     */
    async createTenantAdmin(dbName, email, name, server = { is_primary: true }) {
        const bcrypt = require('bcryptjs');
        const password = this.generatePassword();
        const hash = await bcrypt.hash(password, 10);

        if (server.is_primary) {
            const tenantPool = require('mysql2/promise').createPool({
                host: server.db_host || this.dbHost,
                port: this.getServerDbPort(server),
                user: server.db_user || this.dbUser,
                password: server.db_password || this.dbPass,
                database: dbName
            });

            try {
                await tenantPool.query(
                    `INSERT INTO users (email, password, first_name, last_name, role, status) 
                     VALUES (?, ?, ?, '', 'admin', 'active')`,
                    [email, hash, name.split(' ')[0]]
                );
            } finally {
                await tenantPool.end();
            }
        } else {
            const sql = `INSERT INTO users (email, password, first_name, last_name, role, status) VALUES ('${email}', '${hash}', '${name.split(' ')[0]}', '', 'admin', 'active')`;
            const cmd = `${this.buildMysqlCliPrefix(server)} ${this.quoteShellArg(dbName)} -e ${this.quoteShellArg(sql)}`;
            await this.executeOnServer(server, cmd);
        }

        return password;
    }

    /**
     * Generate random password
     */
    generatePassword() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Create Napnix super admin in tenant database (for support access)
     */
    async createNapnixSuperAdmin(dbName, server = { is_primary: true }) {
        const bcrypt = require('bcryptjs');
        const superAdminEmail = process.env.NAPNIX_ADMIN_EMAIL || 'admin@napnix.in';
        const superAdminPassword = process.env.NAPNIX_ADMIN_PASSWORD || 'Napnix@2024!';
        const hash = await bcrypt.hash(superAdminPassword, 10);

        if (server.is_primary) {
            const tenantPool = require('mysql2/promise').createPool({
                host: server.db_host || this.dbHost,
                port: this.getServerDbPort(server),
                user: server.db_user || this.dbUser,
                password: server.db_password || this.dbPass,
                database: dbName
            });

            try {
                await tenantPool.query(
                    `INSERT INTO users (email, password, first_name, last_name, role, status) 
                     VALUES (?, ?, 'Napnix', 'Admin', 'admin', 'active')
                     ON DUPLICATE KEY UPDATE password = ?, role = 'admin'`,
                    [superAdminEmail, hash, hash]
                );
            } finally {
                await tenantPool.end();
            }
        } else {
            const sql = `INSERT INTO users (email, password, first_name, last_name, role, status) VALUES ('${superAdminEmail}', '${hash}', 'Napnix', 'Admin', 'admin', 'active') ON DUPLICATE KEY UPDATE password = '${hash}', role = 'admin'`;
            const cmd = `${this.buildMysqlCliPrefix(server)} ${this.quoteShellArg(dbName)} -e ${this.quoteShellArg(sql)}`;
            await this.executeOnServer(server, cmd);
        }
    }

    /**
     * Seed initial settings for a new tenant
     */
    async seedInitialSettings(dbName, tenantData, server = { is_primary: true }) {
        const slug = tenantData.slug || dbName.replace('nexcrm_', '');
        const domain = this.cfDomain || 'napnix.in';

        const settings = [
            { key: 'company_name', value: tenantData.name },
            { key: 'email', value: tenantData.email },
            { key: 'industry', value: tenantData.industry_type || 'general' },
            { key: 'timezone', value: 'Asia/Kolkata' },
            { key: 'currency', value: 'INR' },
            { key: 'date_format', value: 'YYYY-MM-DD' },
            { key: 'storefront_url', value: `https://${slug}.${domain}` },
            { key: 'crm_url', value: `https://${slug}-crm.${domain}` },
            { key: 'api_url', value: `https://${slug}-crm-api.${domain}` }
        ];

        if (server.is_primary) {
            const tenantPool = require('mysql2/promise').createPool({
                host: server.db_host || this.dbHost,
                port: this.getServerDbPort(server),
                user: server.db_user || this.dbUser,
                password: server.db_password || this.dbPass,
                database: dbName
            });

            try {
                for (const setting of settings) {
                    await tenantPool.query(
                        'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)',
                        [setting.key, setting.value]
                    );
                }

                // Fix: Force update industry if it's stuck on 'general'
                if (tenantData.industry_type && tenantData.industry_type !== 'general') {
                    await tenantPool.query(
                        "UPDATE settings SET setting_value = ? WHERE setting_key = 'industry' AND setting_value = 'general'",
                        [tenantData.industry_type]
                    );
                }

                console.log(`[Provisioner] Initial settings seeded for ${tenantData.name}`);
            } catch (error) {
                console.warn(`[Provisioner] Could not seed settings locally: ${error.message}`);
            } finally {
                await tenantPool.end();
            }
        } else {
            try {
                for (const setting of settings) {
                    const sql = `INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('${setting.key}', '${setting.value}')`;
                    const cmd = `${this.buildMysqlCliPrefix(server)} ${this.quoteShellArg(dbName)} -e ${this.quoteShellArg(sql)}`;
                    await this.executeOnServer(server, cmd);
                }

                // Fix: Force update industry if it's stuck on 'general'
                if (tenantData.industry_type && tenantData.industry_type !== 'general') {
                    const sql = `UPDATE settings SET setting_value = '${tenantData.industry_type}' WHERE setting_key = 'industry' AND setting_value = 'general'`;
                    const cmd = `${this.buildMysqlCliPrefix(server)} ${this.quoteShellArg(dbName)} -e ${this.quoteShellArg(sql)}`;
                    await this.executeOnServer(server, cmd);
                }

                console.log(`[Provisioner] Initial settings seeded for ${tenantData.name} on remote server ${server.name}`);
            } catch (error) {
                console.warn(`[Provisioner] Could not seed settings remotely on ${server.name}: ${error.message}`);
            }
        }
    }

    /**
     * Create the tenant's default SES-backed mailbox identities.
     *
     * Best-effort like seedIndustryMasters — a tenant that provisions without these
     * rows is still usable (admin can add addresses later from Settings), so a
     * failure here must not abort a provision that has already created the DB, DNS,
     * and PM2 process.
     */
    async createDefaultEmailAddresses(dbName, slug, server = { is_primary: true }) {
        const mailDomain = process.env.SES_MAIL_DOMAIN || 'mail.napnix.in';
        const addresses = [
            { address: `support@${slug}.${mailDomain}`, type: 'support', label: 'Support' },
            { address: `sales@${slug}.${mailDomain}`, type: 'sales', label: 'Sales' },
            { address: `notifications@${slug}.${mailDomain}`, type: 'notifications', label: 'Notifications' }
        ];

        try {
            if (server.is_primary) {
                const tenantPool = require('mysql2/promise').createPool({
                    host: server.db_host || this.dbHost,
                    port: this.getServerDbPort(server),
                    user: server.db_user || this.dbUser,
                    password: server.db_password || this.dbPass,
                    database: dbName
                });

                try {
                    for (const [index, addr] of addresses.entries()) {
                        await tenantPool.query(
                            `INSERT IGNORE INTO email_addresses (address, address_type, label, is_default)
                             VALUES (?, ?, ?, ?)`,
                            [addr.address, addr.type, addr.label, index === 0 ? 1 : 0]
                        );
                    }
                } finally {
                    await tenantPool.end();
                }
            } else {
                for (const [index, addr] of addresses.entries()) {
                    const sql = `INSERT IGNORE INTO email_addresses (address, address_type, label, is_default) `
                        + `VALUES ('${addr.address}', '${addr.type}', '${addr.label}', ${index === 0 ? 1 : 0})`;
                    const cmd = `${this.buildMysqlCliPrefix(server)} ${this.quoteShellArg(dbName)} -e ${this.quoteShellArg(sql)}`;
                    await this.executeOnServer(server, cmd);
                }
            }
        } catch (error) {
            console.warn(`[Provisioner] Could not create default email addresses for ${slug}: ${error.message}`);
        }
    }

    /**
     * Sync tenant settings (name, email, industry) to tenant DB
     * Used when tenant details are updated in Admin Panel
     */
    async syncTenantSettings(tenant, server) {
        if (!tenant || !server) return;
        const dbName = `nexcrm_${tenant.slug.replace(/-/g, '_')}`;

        const updates = [
            { key: 'company_name', value: tenant.name },
            { key: 'email', value: tenant.email },
            { key: 'industry', value: tenant.industry_type || 'general' }
        ];

        console.log(`[Provisioner] Syncing settings for ${tenant.slug}...`);

        if (server.is_primary) {
            const tenantPool = require('mysql2/promise').createPool({
                host: server.db_host || this.dbHost,
                port: this.getServerDbPort(server),
                user: server.db_user || this.dbUser,
                password: server.db_password || this.dbPass,
                database: dbName
            });

            try {
                for (const update of updates) {
                    await tenantPool.query(
                        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) 
                         ON DUPLICATE KEY UPDATE setting_value = ?`,
                        [update.key, update.value, update.value]
                    );
                }
                console.log(`[Provisioner] Settings synced locally for ${tenant.slug}`);
            } catch (error) {
                console.warn(`[Provisioner] Failed to sync settings locally: ${error.message}`);
            } finally {
                await tenantPool.end();
            }
        } else {
            try {
                for (const update of updates) {
                    const sql = `INSERT INTO settings (setting_key, setting_value) VALUES ('${update.key}', '${update.value}') ON DUPLICATE KEY UPDATE setting_value = '${update.value}'`;
                    const cmd = `${this.buildMysqlCliPrefix(server)} ${this.quoteShellArg(dbName)} -e ${this.quoteShellArg(sql)}`;
                    await this.executeOnServer(server, cmd);
                }
                console.log(`[Provisioner] Settings synced remotely for ${tenant.slug}`);
            } catch (error) {
                console.warn(`[Provisioner] Failed to sync settings remotely: ${error.message}`);
            }
        }
    }

    /**
     * Store admin password in tenant record for later retrieval
     */
    async storeAdminPassword(tenantId, password) {
        try {
            await pool.query('UPDATE tenants SET admin_password = ? WHERE id = ?', [password, tenantId]);
        } catch (error) {
            console.warn(`[Provisioner] Could not store admin password: ${error.message}`);
        }
    }

    /**
     * Add Cloudflare DNS record for tenant API
     */
    async addCloudflareRoute(slug, port, server) {
        if (!this.cfApiToken || !this.cfZoneId) {
            console.warn('[Provisioner] Cloudflare not configured, skipping DNS setup');
            return null;
        }
        try {
            const subdomain = `${slug}-crm-api`;
            const hostname = `${subdomain}.${this.cfDomain}`;
            const tunnelId = server.cloudflare_tunnel_id || process.env.CLOUDFLARE_TUNNEL_ID;

            if (!tunnelId) {
                console.error('[Provisioner] Missing Tunnel ID for server:', server.name);
                throw new Error('Cloudflare Tunnel ID is not configured for this server');
            }

            // Create DNS record (CNAME to Cloudflare Tunnel)
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'CNAME',
                        name: subdomain,
                        content: `${tunnelId}.cfargotunnel.com`,
                        proxied: true
                    })
                }
            );

            const data = await response.json();
            if (!data.success) {
                console.error('[Provisioner] Cloudflare DNS record creation failed:', data.errors);
                throw new Error(data.errors[0].message);
            }

            // Update Cloudflare Tunnel configuration on the target server
            // Pass slug (not full hostname) — updateTunnelConfig constructs the hostname
            await this.updateTunnelConfig(slug, port, server);

            console.log(`[Provisioner] Cloudflare route added: ${hostname}`);
            return data.result.id;
        } catch (error) {
            console.error(`[Provisioner] Cloudflare route setup failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add Cloudflare DNS record for frontend (tenant-crm.domain -> Pages)
     * AND attach the custom domain to Pages project
     */
    async addCloudflareFrontendRoute(slug) {
        if (!this.cfApiToken || !this.cfZoneId || !this.cfPagesUrl) {
            console.warn('[Provisioner] Cloudflare Pages config not set, skipping frontend DNS');
            return null;
        }

        const customDomain = `${slug}-crm.${this.cfDomain}`;
        let dnsRecordId = null;

        try {
            // Step 1: Claim the hostname on the Pages project before creating DNS.
            if (this.cfAccountId && this.cfPagesProject) {
                const attached = await this.attachDomainToPages(customDomain);
                if (!attached) {
                    console.warn(`[Provisioner] Skipping frontend DNS until Pages domain attachment succeeds: ${customDomain}`);
                    return null;
                }
            } else {
                console.warn('[Provisioner] Pages account/project not set, manual domain attachment required');
                return null;
            }

            // Step 2: Create DNS CNAME record after Pages owns the hostname.
            const dnsResponse = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'CNAME',
                        name: customDomain,
                        content: this.cfPagesUrl,
                        proxied: true,
                        ttl: 1
                    })
                }
            );

            const dnsData = await dnsResponse.json();

            if (!dnsData.success) {
                const alreadyExists = dnsData.errors?.some(e => e.code === 81053);
                if (alreadyExists) {
                    console.log(`[Provisioner] Frontend DNS already exists: ${customDomain}`);
                } else {
                    console.error('[Provisioner] Frontend DNS error:', dnsData.errors);
                    return null;
                }
            } else {
                dnsRecordId = dnsData.result?.id || null;
                console.log(`[Provisioner] DNS record created: ${customDomain}`);
            }

            return dnsRecordId;

        } catch (error) {
            console.warn('[Provisioner] Frontend DNS error:', error.message);
            return null;
        }
    }

    /**
     * Attach custom domain to Cloudflare Pages project
     */
    async attachDomainToPages(domain) {
        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.cfAccountId}/pages/projects/${this.cfPagesProject}/domains`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: domain })
                }
            );

            const data = await response.json();

            if (data.success) {
                console.log(`[Provisioner] Domain attached to Pages: ${domain}`);
                const active = await this.waitForPagesDomainActive(this.cfAccountId, this.cfPagesProject, domain);
                if (!active) {
                    console.warn(`[Provisioner] Pages domain ${domain} did not reach active state — DNS creation skipped`);
                    return false;
                }
                return true;
            }

            // Treat "already added" (code 8000018) as success — still wait for active
            const alreadyExists = data.errors?.some(e => e.code === 8000018);
            if (alreadyExists) {
                console.log(`[Provisioner] Pages domain ${domain} already attached to ${this.cfPagesProject}`);
                const active = await this.waitForPagesDomainActive(this.cfAccountId, this.cfPagesProject, domain);
                if (!active) {
                    console.warn(`[Provisioner] Pages domain ${domain} is attached but not active yet — DNS creation skipped`);
                    return false;
                }
                return true;
            }

            console.error('[Provisioner] Pages domain attachment error:', data.errors);
            return false;

        } catch (error) {
            console.warn('[Provisioner] Pages domain attachment error:', error.message);
            return false;
        }
    }

    /**
     * Add Cloudflare DNS record for storefront (slug.domain -> Storefront Pages)
     */
    async addStorefrontRoute(slug) {
        if (!this.cfApiToken || !this.cfZoneId) {
            console.warn('[Provisioner] Cloudflare not configured, skipping storefront DNS');
            return null;
        }

        const storefrontDomain = `${slug}.${this.cfDomain}`;
        const storefrontPagesUrl = process.env.NEXCRM_STOREFRONT_PAGES_URL || 'napcrm-storefront.pages.dev';
        const storefrontProject = process.env.NEXCRM_STOREFRONT_PROJECT || 'napcrm-storefront';
        let dnsRecordId = null;

        try {
            // Claim the hostname on the Storefront Pages project before creating DNS.
            if (this.cfAccountId && storefrontProject) {
                const attached = await this.attachCustomDomainToPages(
                    this.cfAccountId,
                    storefrontProject,
                    storefrontDomain
                );
                if (!attached) {
                    console.warn(`[Provisioner] Skipping storefront DNS until Pages domain attachment succeeds: ${storefrontDomain}`);
                    return null;
                }
            } else {
                console.warn('[Provisioner] Missing cfAccountId or storefrontProject for Pages attachment');
                return null;
            }

            // Create DNS CNAME record for storefront after Pages owns the hostname.
            const dnsResponse = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'CNAME',
                        name: storefrontDomain,
                        content: storefrontPagesUrl,
                        proxied: true,
                        ttl: 1
                    })
                }
            );

            const dnsData = await dnsResponse.json();

            if (!dnsData.success) {
                const alreadyExists = dnsData.errors?.some(e => e.code === 81053);
                if (alreadyExists) {
                    console.log(`[Provisioner] Storefront DNS already exists: ${storefrontDomain}`);
                } else {
                    console.error('[Provisioner] Storefront DNS error:', dnsData.errors);
                    return null;
                }
            } else {
                dnsRecordId = dnsData.result?.id || null;
                console.log(`[Provisioner] Storefront DNS created: ${storefrontDomain}`);
            }

            return dnsRecordId;

        } catch (error) {
            console.warn('[Provisioner] Storefront DNS error:', error.message);
            return null;
        }
    }
    /**
     * Update ecosystem.config.js to include new tenant
     * This ensures the tenant process restarts on system reboot
     */
    async updateEcosystemConfig(tenant, port, server = { is_primary: true }) {
        const ecosystemPath = this.getServerEcosystemConfigPath(server);
        const processName = `tenant-${tenant.slug}`;

        try {
            const appConfig = this.buildTenantEcosystemApp(tenant, port, server);
            const mutationCommand = this.buildEcosystemMutationCommand(ecosystemPath, 'upsert', appConfig);
            const { stdout } = await this.executeOnServer(server, mutationCommand);
            const tmpPath = stdout.trim().split('\n').pop();

            if (!tmpPath) {
                throw new Error(`Failed to prepare rewritten ecosystem config for ${processName}`);
            }

            const backupAndMoveCmd = [
                `if [ -f "${ecosystemPath}" ]; then sudo cp "${ecosystemPath}" "${ecosystemPath}.bak"; fi`,
                `sudo mv "${tmpPath}" "${ecosystemPath}"`
            ].join('\n');

            await this.executeOnServer(server, backupAndMoveCmd);
            console.log(`[Provisioner] Upserted ${processName} in ecosystem.config.js on server ${server.name}`);
        } catch (error) {
            console.warn(`[Provisioner] Could not update ecosystem.config.js on ${server.name}:`, error.message);
        }
    }

    /**
     * Setup Custom Domains for a tenant (CRM, Storefront, API)
     * @param {Object} tenant - Tenant object with id, slug, assigned_port, server_id
     * @param {Object} domains - { crm: string, storefront: string, api: string }
     */
    async setupCustomDomain(tenant, domains) {
        console.log(`[Provisioner] Setting up custom domains for tenant ${tenant.slug}...`, domains);

        const results = {
            crm: { success: false, domain: domains.crm, cnameTarget: null },
            storefront: { success: false, domain: domains.storefront, cnameTarget: null }
        };

        try {
            // 1. CRM Domain - Attach to Pages (nexcrm-frontend)
            if (domains.crm) {
                console.log(`[Provisioner] Attaching CRM domain: ${domains.crm}`);
                const crmSuccess = await this.attachDomainToPages(domains.crm);
                results.crm.success = crmSuccess;
                results.crm.cnameTarget = this.cfPagesUrl; // nexcrm-frontend.pages.dev
            }

            // 2. Storefront Domain - Attach to Storefront Pages project
            if (domains.storefront) {
                console.log(`[Provisioner] Attaching Storefront domain: ${domains.storefront}`);
                const storefrontProject = process.env.NEXCRM_STOREFRONT_PROJECT || 'napcrm-storefront';
                const storefrontSuccess = await this.attachCustomDomainToPages(
                    this.cfAccountId,
                    storefrontProject,
                    domains.storefront
                );
                results.storefront.success = storefrontSuccess;
                results.storefront.cnameTarget = `${storefrontProject}.pages.dev`;
            }

            // API always stays on {slug}-crm-api.napnix.in (managed via Cloudflare Tunnel)
            // No custom API domain support — Tunnel requires Cloudflare-proxied DNS which external domains don't have

            return {
                success: results.crm.success || results.storefront.success,
                results
            };

        } catch (error) {
            console.error(`[Provisioner] Custom domain setup failed: ${error.message}`);
            throw error;
        }
    }

    async attachCustomDomainToPages(accountId, projectName, domain) {
        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: domain })
                }
            );
            const data = await response.json();
            if (data.success) {
                // Wait for CF to activate the domain before DNS is created.
                // Without this, DNS CNAME created immediately after POST causes Error 1014
                // (CNAME Cross-User Banned) because CF edge hasn't propagated ownership yet.
                const active = await this.waitForPagesDomainActive(accountId, projectName, domain);
                if (!active) {
                    console.warn(`[Provisioner] Pages domain ${domain} did not reach active state — DNS creation skipped`);
                    return false;
                }
                return true;
            }

            // Treat "already added" (code 8000018) as success — still wait for active
            const alreadyExists = data.errors?.some(e => e.code === 8000018);
            if (alreadyExists) {
                console.log(`[Provisioner] Pages domain ${domain} already attached to ${projectName}`);
                const active = await this.waitForPagesDomainActive(accountId, projectName, domain);
                if (!active) {
                    console.warn(`[Provisioner] Pages domain ${domain} is attached but not active yet — DNS creation skipped`);
                    return false;
                }
                return true;
            }

            console.error(`[Provisioner] Pages domain attachment error:`, data.errors);
            return false;
        } catch (error) {
            console.error(`[Provisioner] Cloudflare Pages domain attachment failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Poll until Pages reports the custom domain as active.
     * CF Pages API returns success immediately but propagation takes 5-30s.
     * Creating a CNAME DNS record before the domain is active causes Error 1014.
     */
    async waitForPagesDomainActive(accountId, projectName, domain, maxWaitMs = 60000) {
        const interval = 4000;
        const deadline = Date.now() + maxWaitMs;

        while (Date.now() < deadline) {
            try {
                const res = await fetch(
                    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}`,
                    { headers: { 'Authorization': `Bearer ${this.cfApiToken}` } }
                );
                const data = await res.json();
                const status = data.result?.status;
                console.log(`[Provisioner] Pages domain ${domain} status: ${status}`);
                if (status === 'active') return true;
                if (status === 'blocked' || status === 'error') {
                    console.error(`[Provisioner] Pages domain ${domain} in terminal error state: ${status}`);
                    return false;
                }
            } catch (e) {
                console.warn(`[Provisioner] Pages domain status check error: ${e.message}`);
            }
            await new Promise(r => setTimeout(r, interval));
        }

        console.warn(`[Provisioner] Pages domain ${domain} did not become active within ${maxWaitMs / 1000}s`);
        return false;
    }
    // NOTE: updateTunnelConfig is defined below (near line 1373)
    // It takes (slug, port, server, customDomain) and constructs hostname as {slug}-crm-api.{domain}

    /**
     * Start PM2 process for tenant
     */
    async startProcess(tenant, port, server) {
        const { slug } = tenant;
        const processName = `tenant-${slug}`;

        try {
            // Path structure for tenant backend on target server
            const backendPath = this.getServerBackendPath(server);

            // Environment variables for tenant
            const dbPass = server.db_password || this.dbPass;
            const dbUser = server.db_user || this.dbUser;
            const dbHost = server.db_host || this.dbHost;
            const dbPort = this.getServerDbPort(server);

            const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
            const tenantJwtSecret = deriveTenantJwtSecret(process.env.JWT_SECRET, slug);
            const supportSecret = deriveSupportSecret(slug);
            const academicMode = tenant.industry_type === 'school'
                ? (tenant.academic_mode || 'school')
                : null;
            const academicArg = academicMode ? ` --academic-mode ${academicMode}` : '';

            // Build env block — passed via PM2 JSON config so credentials are reliable
            // regardless of what .env file exists in nexcrm-backend directory
            const envBlock = {
                PORT: port,
                DB_HOST: dbHost,
                DB_PORT: dbPort,
                DB_NAME: dbName,
                DB_USER: dbUser,
                DB_PASSWORD: dbPass,
                JWT_SECRET: tenantJwtSecret,
                TENANT_JWT_SECRET: tenantJwtSecret,
                TENANT_ID: tenant.id,
                TENANT_SLUG: slug,
                INDUSTRY_TYPE: tenant.industry_type || 'general',
                PLAN_SLUG: tenant.plan_slug || 'starter',
                ...(academicMode ? { ACADEMIC_MODE: academicMode } : {}),
                NODE_ENV: process.env.NODE_ENV || 'production',
                SMTP_HOST: process.env.SMTP_HOST || '',
                SMTP_PORT: process.env.SMTP_PORT || '',
                SMTP_USER: process.env.SMTP_USER || '',
                SMTP_PASS: process.env.SMTP_PASS || '',
                SMTP_FROM: process.env.SMTP_FROM || '',
                FRONTEND_URL: process.env.NEXCRM_FRONTEND_URL || '',
                STOREFRONT_URL: `https://${slug}.${this.cfDomain || 'napnix.in'}`,
                NEXS_BACKEND_URL: process.env.NEXS_BACKEND_URL || process.env.API_URL || 'http://localhost:5000',
                SUPPORT_TENANT_SECRET: supportSecret,
                // Lead Sources (Google Sheets) — same OAuth app + handoff secret
                // as nexs-backend's own .env, so every tenant can complete the
                // centralized Google OAuth flow without per-tenant setup.
                GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
                GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
                INTERNAL_OAUTH_KEY: process.env.INTERNAL_OAUTH_KEY || ''
            };

            // Write a temporary PM2 JSON config to inject env block reliably
            // Plain `pm2 start script` does not pass env vars — use config file instead
            const tmpConfig = `/tmp/pm2-tenant-${slug}.json`;
            const pm2AppConfig = JSON.stringify({
                apps: [{
                    name: processName,
                    cwd: backendPath,
                    script: 'server.js',
                    args: `--port ${port} --db ${dbName} --slug ${slug} --industry ${tenant.industry_type || 'general'} --plan ${tenant.plan_slug || 'starter'}${academicArg}`,
                    env: envBlock,
                    max_memory_restart: '300M',
                    restart_delay: 3000,
                    max_restarts: 5
                }]
            });

            // Delete any existing errored/stopped process first
            try {
                await this.executeOnServer(server, `pm2 delete ${processName} 2>/dev/null || true`);
            } catch (_e) { /* ignore if doesn't exist */ }

            // Write config and start
            await this.executeOnServer(server, `cat > ${tmpConfig} << 'EOFCONFIG'\n${pm2AppConfig}\nEOFCONFIG`);
            await this.executeOnServer(server, `pm2 start ${tmpConfig}`);
            await this.executeOnServer(server, `rm -f ${tmpConfig}`);

            // Persist PM2 list and update ecosystem.config.js on target server
            await this.executeOnServer(server, 'pm2 save');
            await this.updateEcosystemConfig(tenant, port, server);

            console.log(`[Provisioner] PM2 process "${processName}" started on port ${port} on server ${server.name}`);

            // Update tenant status
            await TenantModel.update(tenant.id, {
                process_name: processName,
                process_status: 'running',
                assigned_port: port,
                db_name: dbName
            });
        } catch (error) {
            console.error(`[Provisioner] PM2 process start failed: ${error.message}`);
            throw error;
        }
    }


    /**
     * Stop PM2 process for tenant
     */
    async stopProcess(tenant) {
        const server = await ServerModel.findById(tenant.server_id);
        const processName = tenant.process_name || `tenant-${tenant.slug}`;
        if (!server) return;
        try {
            await this.executeOnServer(server, `pm2 stop ${processName} && pm2 save`);
        } catch (error) {
            console.warn(`[Provisioner] PM2 stop error on ${server.name}:`, error.message);
        }
    }

    /**
     * Restart PM2 process for tenant
     */
    async restartProcess(tenant) {
        const server = await ServerModel.findById(tenant.server_id);
        const processName = tenant.process_name || `tenant-${tenant.slug}`;
        if (!server) return;
        try {
            await this.executeOnServer(server, `pm2 restart ${processName} && pm2 save`);
        } catch (error) {
            console.error(`[Provisioner] PM2 restart error on ${server.name}:`, error.message);
            throw error;
        }
    }

    /**
     * Delete PM2 process for tenant
     */
    async deleteProcess(tenant) {
        const server = await ServerModel.findById(tenant.server_id);
        const processName = tenant.process_name || `tenant-${tenant.slug}`;
        if (!server) return;
        try {
            await this.executeOnServer(server, `pm2 delete ${processName} && pm2 save`);
        } catch (error) {
            console.warn(`[Provisioner] PM2 delete error on ${server.name}:`, error.message);
        }
    }

    /**
     * Remove Cloudflare DNS record
     */
    async removeCloudflareRoute(recordId) {
        if (!this.cfApiToken || !this.cfZoneId || !recordId) {
            return;
        }

        try {
            await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records/${recordId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`
                    }
                }
            );
        } catch (error) {
            console.warn('[Provisioner] Could not remove DNS record:', error.message);
        }
    }

    /**
     * Register email with registry service (for mobile app lookup)
     */
    async registerWithRegistry(data) {
        if (!this.registryUrl || !this.registryApiKey) {
            console.log('[Provisioner] Registry service not configured, skipping registration');
            return;
        }

        const { email, tenant_slug, tenant_name, subdomain, industry } = data;

        try {
            const response = await fetch(`${this.registryUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.registryApiKey
                },
                body: JSON.stringify({
                    email,
                    tenant_slug,
                    tenant_name,
                    subdomain,
                    api_url: `https://${subdomain}`,
                    frontend_url: `https://${tenant_slug}-crm.${this.cfDomain}`,
                    industry: industry || 'general'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[Provisioner] Registry registration failed:', errorText);
            }
        } catch (error) {
            console.warn('[Provisioner] Could not register with registry:', error.message);
            // Don't throw - provisioning can succeed without registry
        }
    }

    /**
     * Register additional user email with registry service
     */
    async registerUserWithRegistry(email, tenant) {
        if (!this.registryUrl || !this.registryApiKey) {
            return;
        }

        const subdomain = `${tenant.slug}-crm-api.${this.cfDomain}`;

        try {
            await fetch(`${this.registryUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.registryApiKey
                },
                body: JSON.stringify({
                    email,
                    tenant_slug: tenant.slug,
                    tenant_name: tenant.name,
                    subdomain,
                    api_url: `https://${subdomain}`,
                    frontend_url: `https://${tenant.slug}-crm.${this.cfDomain}`,
                    industry: tenant.industry_type || 'general'
                })
            });
        } catch (error) {
            console.warn('[Provisioner] Could not register user with registry:', error.message);
        }
    }

    /**
     * Unregister all emails for a tenant from registry service
     * Called during tenant deletion to clean up registry entries
     */
    async unregisterFromRegistry(tenantSlug) {
        if (!this.registryUrl || !this.registryApiKey) {
            console.log('[Provisioner] Registry service not configured, skipping unregistration');
            return false;
        }

        try {
            const response = await fetch(`${this.registryUrl}/unregister-tenant/${tenantSlug}`, {
                method: 'DELETE',
                headers: {
                    'X-API-Key': this.registryApiKey
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log(`[Provisioner] Unregistered ${data.deleted} emails from registry for tenant: ${tenantSlug}`);
                return true;
            } else {
                console.warn('[Provisioner] Registry unregistration failed:', data.error || 'Unknown error');
                return false;
            }
        } catch (error) {
            console.warn('[Provisioner] Could not unregister from registry:', error.message);
            return false;
        }
    }

    /**
     * Get PM2 logs for a tenant process
     */
    async getProcessLogs(tenant, lines = 100) {
        const server = await ServerModel.findById(tenant.server_id);
        const processName = tenant.process_name || `tenant-${tenant.slug}`;
        if (!server) return { logs: 'Server not found', processName, timestamp: new Date().toISOString() };

        try {
            const { stdout: outLogs } = await this.executeOnServer(
                server,
                `pm2 logs ${processName} --nostream --lines ${lines} 2>&1 || echo "No logs available"`
            );
            return {
                logs: outLogs,
                processName,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn(`[Provisioner] Could not get PM2 logs from ${server.name}:`, error.message);
            return {
                logs: `Error fetching logs: ${error.message}`,
                processName,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Remove Cloudflare frontend DNS record (tenant-crm.domain)
     */
    async removeCloudflareFrontendRoute(slug) {
        if (!this.cfApiToken || !this.cfZoneId) {
            return null;
        }

        const hostname = `${slug}-crm.${this.cfDomain}`;

        try {
            // First, find the DNS record ID
            const searchResponse = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records?name=${hostname}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`
                    }
                }
            );

            const searchData = await searchResponse.json();

            if (!searchData.success || !searchData.result.length) {
                console.log(`[Provisioner] Frontend DNS record not found: ${hostname}`);
                return null;
            }

            const recordId = searchData.result[0].id;

            // Delete the record
            await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records/${recordId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`
                    }
                }
            );

            console.log(`[Provisioner] Removed frontend DNS: ${hostname}`);
            return recordId;

        } catch (error) {
            console.warn('[Provisioner] Could not remove frontend DNS:', error.message);
            return null;
        }
    }

    /**
     * Remove Cloudflare storefront DNS record (slug.domain)
     */
    async removeStorefrontRoute(slug) {
        if (!this.cfApiToken || !this.cfZoneId) {
            return null;
        }

        const hostname = `${slug}.${this.cfDomain}`;

        try {
            // Find the DNS record ID
            const searchResponse = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records?name=${hostname}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`
                    }
                }
            );

            const searchData = await searchResponse.json();

            if (!searchData.success || !searchData.result.length) {
                console.log(`[Provisioner] Storefront DNS record not found: ${hostname}`);
                return null;
            }

            const recordId = searchData.result[0].id;

            // Delete the record
            await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.cfZoneId}/dns_records/${recordId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`
                    }
                }
            );

            console.log(`[Provisioner] Removed storefront DNS: ${hostname}`);
            return recordId;

        } catch (error) {
            console.warn('[Provisioner] Could not remove storefront DNS:', error.message);
            return null;
        }
    }

    /**
     * Remove custom domain from Cloudflare Pages project
     */
    async removeDomainFromPages(domain, project = null) {
        if (!this.cfApiToken || !this.cfAccountId) {
            return false;
        }

        const projectName = project || this.cfPagesProject;

        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.cfAccountId}/pages/projects/${projectName}/domains/${domain}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.cfApiToken}`
                    }
                }
            );

            const data = await response.json();

            if (data.success) {
                console.log(`[Provisioner] Removed domain from Pages: ${domain}`);
                return true;
            }

            console.warn('[Provisioner] Could not remove domain from Pages:', data.errors);
            return false;

        } catch (error) {
            console.warn('[Provisioner] Pages domain removal error:', error.message);
            return false;
        }
    }

    /**
     * Remove from tunnel config
     */
    async removeFromTunnelConfig(slug, server, customDomain = null) {
        try {
            const tunnelConfigPath = this.getServerTunnelConfigPath(server);
            const hostname = customDomain || `${slug}-crm-api.${this.cfDomain}`;

            const { stdout: config } = await this.executeOnServer(server, `cat ${tunnelConfigPath}`);
            const lines = config.split('\n');
            const newLines = [];
            let skipNext = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(`hostname: ${hostname}`)) {
                    skipNext = true;
                    continue;
                }
                if (skipNext && lines[i].trim().startsWith('service:')) {
                    skipNext = false;
                    continue;
                }
                newLines.push(lines[i]);
            }

            const updatedConfig = newLines.join('\n');
            const tmpFile = `/tmp/tunnel_rm_${slug}.yml`;
            await this.executeOnServer(server, `echo "${updatedConfig.replace(/"/g, '\\"')}" > ${tmpFile} && sudo mv ${tmpFile} ${tunnelConfigPath}`);
            await this.executeOnServer(server, 'sudo systemctl restart cloudflared');

            console.log(`[Provisioner] Removed ${hostname} from tunnel config on ${server.name}`);
            return true;
        } catch (error) {
            console.warn(`[Provisioner] Could not update tunnel config on ${server.name}:`, error.message);
            return false;
        }
    }

    /**
     * Remove tenant from ecosystem.config.js
     */
    async removeFromEcosystemConfig(processName, server) {
        try {
            const ecosystemPath = this.getServerEcosystemConfigPath(server);
            const mutationCommand = this.buildEcosystemMutationCommand(ecosystemPath, 'remove', { processName });
            const { stdout } = await this.executeOnServer(server, mutationCommand);
            const tmpPath = stdout.trim().split('\n').pop();

            if (!tmpPath) {
                throw new Error(`Failed to prepare rewritten ecosystem config for ${processName}`);
            }

            const backupAndMoveCmd = [
                `if [ -f "${ecosystemPath}" ]; then sudo cp "${ecosystemPath}" "${ecosystemPath}.bak"; fi`,
                `sudo mv "${tmpPath}" "${ecosystemPath}"`
            ].join('\n');

            await this.executeOnServer(server, backupAndMoveCmd);
            console.log(`[Provisioner] Removed ${processName} from ecosystem.config.js on ${server.name}`);
            return true;
        } catch (error) {
            console.warn(`[Provisioner] Could not update ecosystem.config.js on ${server.name}:`, error.message);
            return false;
        }
    }

    /**
     * Publish a tunnel ingress rule to the Cloudflare edge (remotely-managed tunnel).
     *
     * The tunnel on this account is dashboard/remotely-managed ("cloudflared" type):
     * cloudflared pulls its ingress from Cloudflare, so editing the on-server
     * config.yml has NO effect. The route must be written through the tunnel
     * configurations API. Requires the API token to have Account → Cloudflare
     * Tunnel → Edit permission.
     */
    async upsertRemoteTunnelIngress(tunnelId, hostname, service) {
        if (!this.cfAccountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is not configured');
        const base = `https://api.cloudflare.com/client/v4/accounts/${this.cfAccountId}/cfd_tunnel/${tunnelId}/configurations`;
        const headers = {
            'Authorization': `Bearer ${this.cfApiToken}`,
            'Content-Type': 'application/json'
        };

        const getRes = await fetch(base, { headers });
        const getData = await getRes.json();
        if (!getData.success) {
            const msg = getData.errors?.[0]?.message || 'unknown error';
            throw new Error(`fetch tunnel config failed: ${msg}`);
        }

        const config = (getData.result && getData.result.config) || {};
        const ingress = Array.isArray(config.ingress) ? config.ingress : [];

        if (ingress.some(rule => rule.hostname === hostname)) {
            console.log(`[Provisioner] Remote tunnel already routes ${hostname} — skipping`);
            return;
        }

        // Insert before the catch-all (the ingress entry without a hostname).
        const catchAllIndex = ingress.findIndex(rule => !rule.hostname);
        const newRule = { hostname, service };
        if (catchAllIndex === -1) ingress.push(newRule);
        else ingress.splice(catchAllIndex, 0, newRule);

        const putRes = await fetch(base, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ config: { ...config, ingress } })
        });
        const putData = await putRes.json();
        if (!putData.success) {
            const msg = putData.errors?.[0]?.message || 'unknown error';
            throw new Error(`publish tunnel config failed: ${msg}`);
        }
    }

    /**
     * Update Cloudflare tunnel config.
     *
     * Primary path: publish to the remote (dashboard-managed) tunnel via API.
     * Fallback: legacy on-server config.yml edit — only meaningful for a
     * locally-managed tunnel; a remotely-managed tunnel ignores it.
     */
    async updateTunnelConfig(slug, port, server, customDomain = null) {
        const hostname = customDomain || `${slug}-crm-api.${this.cfDomain}`;
        const service = `http://localhost:${port}`;
        const tunnelId = server.cloudflare_tunnel_id || process.env.CLOUDFLARE_TUNNEL_ID;

        // Preferred: write the route to the Cloudflare edge (works for the
        // remotely-managed tunnel this account uses).
        if (this.cfAccountId && tunnelId) {
            try {
                await this.upsertRemoteTunnelIngress(tunnelId, hostname, service);
                console.log(`[Provisioner] Remote tunnel ingress published: ${hostname} -> ${service}`);
                return;
            } catch (error) {
                console.error(`[Provisioner] Remote tunnel ingress update failed (${error.message}). Falling back to on-server config.yml (only effective for a locally-managed tunnel).`);
            }
        }

        try {
            const configPath = this.getServerTunnelConfigPath(server);

            // Read current config from target server
            const { stdout: currentConfig } = await this.executeOnServer(server, `cat ${configPath}`);

            // Check if this hostname already exists in the config — skip if so
            if (currentConfig.includes(`hostname: ${hostname}`)) {
                console.log(`[Provisioner] Tunnel config already has ${hostname} — skipping`);
                return;
            }

            // Simple string manipulation to add new ingress rule before the catch-all
            const lines = currentConfig.split('\n');
            const matchIndex = lines.findIndex(line => /service:\s*http_status:404/.test(line));

            if (matchIndex !== -1) {
                const catchAllLine = lines[matchIndex];
                // Capture leading whitespace (indentation)
                const indentation = catchAllLine.match(/^(\s*)/)[0];

                // Construct new rule with matching indentation
                // We assume standard structure: "- hostname: ... \n    service: ..."
                // If the parent list item has 'N' spaces, the 'service' key usually has 'N+2' or 'N+4' spaces
                // But the 'ingress' items usually start with the dashes aligned.

                // Let's assume the catch-all line is "- service: http_status:404"
                // If so, the indentation is the spaces before the dash.
                // But often it is "  - service: http_status:404"

                const newRule = `${indentation}- hostname: ${hostname}\n${indentation}  service: ${service}`;

                lines.splice(matchIndex, 0, newRule);
                const updatedConfig = lines.join('\n');

                // Write back to target server (needs sudo)
                const echoCmd = `echo "${updatedConfig.replace(/"/g, '\\"')}" | sudo tee ${configPath} > /dev/null`;
                await this.executeOnServer(server, echoCmd);

                // VERIFICATION: Read it back to ensure it stuck (permissions check)
                const { stdout: verifyConfig } = await this.executeOnServer(server, `cat ${configPath}`);
                if (!verifyConfig.includes(hostname)) {
                    console.error(`[Provisioner] CRITICAL: Tunnel config verification failed! Written config did not contain ${hostname}. Check SUDO permissions.`);
                } else {
                    console.log(`[Provisioner] Verified tunnel config contains ${hostname}`);
                    // Restart cloudflared on target server
                    await this.executeOnServer(server, 'sudo systemctl restart cloudflared');
                    console.log(`[Provisioner] Cloudflare Tunnel config updated and valid on server ${server.name} for ${hostname}`);
                }
            } else {
                console.error(`[Provisioner] CRITICAL: Could not find catch-all rule (http_status:404) in ${configPath}. Tunnel update skipped for ${hostname}.`);
            }
        } catch (error) {
            // Critical: Don't throw here, just log invalid tunnel update. 
            // This prevents "Failed to create tenant" if tunnel restart fails/times out
            console.warn(`[Provisioner] Failed to update Tunnel config (non-fatal): ${error.message}`);
        }
    }

    /**
     * Drop tenant database
     */
    async dropDatabase(dbName, server = { is_primary: true }) {
        try {
            if (server.is_primary) {
                await pool.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
            } else {
                const sql = `DROP DATABASE IF EXISTS \`${dbName}\``;
                const cmd = `${this.buildMysqlCliPrefix(server)} -e ${this.quoteShellArg(sql)}`;
                await this.executeOnServer(server, cmd);
            }
            console.log(`[Provisioner] Dropped database: ${dbName} on ${server.name || 'primary'}`);
            return true;
        } catch (error) {
            console.error('[Provisioner] Could not drop database:', error.message);
            return false;
        }
    }

    /**
     * Create database
     */

    /**
     * Full cleanup - remove all tenant resources
     */
    async fullCleanup(tenant, options = {}) {
        const { dropDb = false } = options;
        const server = await ServerModel.findById(tenant.server_id) || { is_primary: true, name: 'primary' };
        const results = {
            pm2Deleted: false,
            apiDnsRemoved: false,
            frontendDnsRemoved: false,
            storefrontDnsRemoved: false,
            pagesDomainsRemoved: false,
            tunnelConfigUpdated: false,
            ecosystemUpdated: false,
            databaseDropped: false,
            registryCleanedUp: false,
            storageCleanedUp: false
        };

        const processName = tenant.process_name || `tenant-${tenant.slug}`;
        console.log(`[Provisioner] Starting full cleanup for: ${tenant.slug} on ${server.name}`);

        // Execute all steps independently - failing one should not stop others
        try { await this.deleteProcess(tenant); results.pm2Deleted = true; } catch (e) { console.warn('PM2 cleanup error:', e.message); }

        try {
            if (server.is_primary) {
                const uploadsDir = path.join(this.nexcrmBackendPath, 'uploads');
                const tenantDir = path.join(uploadsDir, tenant.slug);
                if (require('fs').existsSync(tenantDir)) {
                    require('fs').rmSync(tenantDir, { recursive: true, force: true });
                    results.storageCleanedUp = true;
                }
            } else {
                const remoteDir = path.join(this.getServerBackendPath(server), 'uploads', tenant.slug);
                await this.executeOnServer(server, `sudo rm -rf ${remoteDir}`);
                results.storageCleanedUp = true;
            }
        } catch (e) { console.warn('Storage cleanup error:', e.message); }

        if (tenant.cf_dns_record_id) { try { await this.removeCloudflareRoute(tenant.cf_dns_record_id); results.apiDnsRemoved = true; } catch (e) { console.warn('API DNS cleanup error:', e.message); } }
        try { await this.removeCloudflareFrontendRoute(tenant.slug); results.frontendDnsRemoved = true; } catch (e) { console.warn('Frontend DNS cleanup error:', e.message); }
        try { await this.removeStorefrontRoute(tenant.slug); results.storefrontDnsRemoved = true; } catch (e) { console.warn('Storefront DNS cleanup error:', e.message); }

        try {
            const frontendDomain = `${tenant.slug}-crm.${this.cfDomain}`;
            const storefrontDomain = `${tenant.slug}.${this.cfDomain}`;
            const storefrontProject = process.env.NEXCRM_STOREFRONT_PROJECT || 'napcrm-storefront';
            await this.removeDomainFromPages(frontendDomain, this.cfPagesProject);
            await this.removeDomainFromPages(storefrontDomain, storefrontProject);
            results.pagesDomainsRemoved = true;
        } catch (e) { console.warn('Pages domain cleanup error:', e.message); }

        try { await this.removeFromTunnelConfig(tenant.slug, server); results.tunnelConfigUpdated = true; } catch (e) { console.warn('Tunnel config cleanup error:', e.message); }
        if (tenant.custom_domain) { try { await this.removeFromTunnelConfig(tenant.slug, server, tenant.custom_domain); } catch (e) { console.warn('Custom domain tunnel cleanup error:', e.message); } }

        try { await this.removeFromEcosystemConfig(processName, server); results.ecosystemUpdated = true; } catch (e) { console.warn('Ecosystem cleanup error:', e.message); }
        if (dropDb && tenant.db_name) { try { await this.dropDatabase(tenant.db_name, server); results.databaseDropped = true; } catch (e) { console.warn('DB drop error:', e.message); } }
        try { const unregistered = await this.unregisterFromRegistry(tenant.slug); results.registryCleanedUp = unregistered; } catch (e) { console.warn('Registry cleanup error:', e.message); }

        return results;
    }
}

module.exports = Provisioner;
