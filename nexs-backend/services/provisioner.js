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
const execAsync = promisify(exec);
const fs = require('fs').promises; // Keep fs.promises for async operations
const path = require('path');
const axios = require('axios'); // Added axios
const { pool } = require('../config/database');
const TenantModel = require('../models/tenant.model');
const ServerModel = require('../models/server.model'); // Added ServerModel
const EmailService = require('./email.service');

class Provisioner {
    constructor() {
        // Paths - adjust based on your server setup
        this.nexcrmBackendPath = process.env.NEXCRM_BACKEND_PATH || '/var/www/nexcrm-backend';
        this.migrationsPath = path.join(__dirname, '../database/migrations');

        // Cloudflare config
        this.cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
        this.cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
        // this.cfTunnelId = process.env.CLOUDFLARE_TUNNEL_ID; // Removed, now per-server
        this.cfDomain = process.env.NEXCRM_DOMAIN || 'nexspiresolutions.co.in';
        this.cfPagesUrl = process.env.NEXCRM_PAGES_URL || 'nexcrm-frontend.pages.dev';
        this.cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID; // For Pages API
        this.cfPagesProject = process.env.NEXCRM_PAGES_PROJECT || 'nexcrm-frontend';

        // Registry service config (for mobile app lookup)
        this.registryUrl = process.env.REGISTRY_URL || 'http://localhost:4000';
        this.registryApiKey = process.env.REGISTRY_API_KEY;

        // Cloudflare tunnel config path // Removed, now per-server
        // this.cfConfigPath = process.env.CF_CONFIG_PATH || '/etc/cloudflared/config.yml';

        // Log configuration status
        console.log('[Provisioner] Configuration:');
        console.log(`  - CF API Token: ${this.cfApiToken ? 'SET' : 'NOT SET'}`);
        console.log(`  - CF Zone ID: ${this.cfZoneId ? 'SET' : 'NOT SET'}`);
        console.log(`  - CF Account ID: ${this.cfAccountId ? 'SET' : 'NOT SET (required for Pages domains)'}`);
        console.log(`  - CF Pages Project: ${this.cfPagesProject}`);
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
            // Use SSH over Cloudflare Tunnel if no public IP
            // Assumes ~/.ssh/config is set up to use cloudflared for this hostname
            const sshCmd = `ssh -o BatchMode=yes ${server.hostname} "${command.replace(/"/g, '\\"')}"`;
            console.log(`[Provisioner] Executing remotely on ${server.name}: ${sshCmd}`);
            return execAsync(sshCmd);
        }
    }

    /**
     * Full tenant provisioning flow
     */
    async provisionTenant(tenant, preferredServerId = null) {
        const { id, name, slug, email, industry_type, plan_slug } = tenant;

        console.log(`[Provisioner] Starting provisioning for: ${slug}`);

        try {
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
            const port = await TenantModel.allocatePort(id, server.id);
            console.log(`[Provisioner] Allocated port: ${port}`);

            // Update tenant with assigned server
            await TenantModel.update(id, { server_id: server.id });

            // 2. Create database
            const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
            const dbHost = server.db_host || 'localhost';
            await this.createDatabase(dbName, dbHost, server.db_user, server.db_password);
            console.log(`[Provisioner] Created database: ${dbName}`);

            // 3. Run migrations on new database (base + industry-specific)
            await this.runMigrations(dbName, industry_type, server);
            console.log(`[Provisioner] Migrations complete (industry: ${industry_type})`);

            // 4. Create admin user in tenant DB
            const adminPassword = await this.createTenantAdmin(dbName, email, name, server);
            console.log(`[Provisioner] Admin user created`);

            // 4b. Create NexSpire super admin in tenant DB (for support access)
            await this.createNexSpireSuperAdmin(dbName, server);
            console.log(`[Provisioner] NexSpire super admin added`);

            // 4c. Seed initial settings (company
            // 5. Seed settings
            await this.seedInitialSettings(dbName, tenant, server);
            console.log(`[Provisioner] Initial settings seeded`);

            // 5. Update tenant record with process info and admin password
            const processName = `tenant-${slug}`;
            await TenantModel.updateProcessInfo(id, {
                assigned_port: port,
                db_name: dbName,
                process_name: processName,
                process_status: 'stopped'
            });

            // Store admin password for later retrieval
            await this.storeAdminPassword(id, adminPassword);

            // 6. Add Cloudflare DNS routes (API + Frontend)
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
            await this.startProcess(tenant, port, server);
            await TenantModel.updateProcessStatus(id, 'running');
            console.log(`[Provisioner] PM2 process started`);

            // 8. Register with registry service (for mobile app lookup)
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
            await TenantModel.updateProcessStatus(id, 'error');
            throw error;
        }
    }

    /**
     * Create new database for tenant
     */
    async createDatabase(dbName, dbHost = 'localhost', dbUser = null, dbPassword = null) {
        // If it's a remote server, we might need a different pool or execute command via SSH
        // For now, if dbHost is not localhost, we assume root pool can reach it or we use SSH

        if (dbHost === 'localhost' || dbHost === '127.0.0.1') {
            await pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            const user = dbUser || process.env.DB_USER || 'nexcrm';
            const host = process.env.DB_HOST || 'localhost';
            await pool.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${user}'@'${host}'`);
            await pool.query('FLUSH PRIVILEGES');
        } else {
            // Remote DB creation via SSH (mysql -e)
            const cmd = `mysql -u${dbUser} -p${dbPassword} -e "CREATE DATABASE IF NOT EXISTS \\\`${dbName}\\\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON \\\`${dbName}\\\`.* TO '${dbUser}'@'%'; FLUSH PRIVILEGES;"`;
            // We need a server object here to execute on.
            // Let's refine this to take the server object instead of individual params.
        }
    }

    /**
     * Run migrations on tenant database
     */
    async runMigrations(dbName, industryType = 'general', server = { is_primary: true }) {
        const schemaFile = path.join(this.migrationsPath, 'nexcrm_base_schema.sql');

        if (server.is_primary) {
            // Local migration using pool
            const tenantPool = require('mysql2/promise').createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: dbName,
                multipleStatements: true
            });

            try {
                const sql = await fs.readFile(schemaFile, 'utf8');
                await tenantPool.query(sql);

                if (industryType && industryType !== 'general') {
                    const industryMigrationsPath = path.join(this.migrationsPath, 'industry', industryType);
                    try {
                        const files = await fs.readdir(industryMigrationsPath);
                        const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
                        for (const file of sqlFiles) {
                            const sql = await fs.readFile(path.join(industryMigrationsPath, file), 'utf8');
                            await tenantPool.query(sql);
                        }
                    } catch (e) { /* ignore if no dir */ }
                }
            } finally {
                await tenantPool.end();
            }
        } else {
            // Remote migration via SSH
            // Transfer migration files first or use a shared mount
            // For now, assume migrations are synced to all servers at /var/www/nexs-backend/database/migrations
            const remotePath = '/var/www/nexs-backend/database/migrations';
            const cmd = `mysql -u${server.db_user} -p${server.db_password} ${dbName} < ${path.join(remotePath, 'nexcrm_base_schema.sql')}`;
            await this.executeOnServer(server, cmd);

            if (industryType && industryType !== 'general') {
                const industryCmd = `for f in ${path.join(remotePath, 'industry', industryType)}/*.sql; do mysql -u${server.db_user} -p${server.db_password} ${dbName} < "$f"; done`;
                await this.executeOnServer(server, industryCmd);
            }
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
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
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
            const cmd = `mysql -u${server.db_user} -p${server.db_password} ${dbName} -e "${sql}"`;
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
     * Create NexSpire super admin in tenant database (for support access)
     */
    async createNexSpireSuperAdmin(dbName) {
        const bcrypt = require('bcryptjs');
        const superAdminEmail = process.env.NEXSPIRE_ADMIN_EMAIL || 'admin@nexspiresolutions.co.in';
        const superAdminPassword = process.env.NEXSPIRE_ADMIN_PASSWORD || 'NexSpire@2024!';
        const hash = await bcrypt.hash(superAdminPassword, 10);

        const tenantPool = require('mysql2/promise').createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName
        });

        try {
            await tenantPool.query(
                `INSERT INTO users (email, password, first_name, last_name, role, status) 
                 VALUES (?, ?, 'NexSpire', 'Admin', 'admin', 'active')
                 ON DUPLICATE KEY UPDATE password = ?, role = 'admin'`,
                [superAdminEmail, hash, hash]
            );
        } catch (error) {
            console.warn(`[Provisioner] Could not create NexSpire admin: ${error.message}`);
        }

        await tenantPool.end();
    }

    /**
     * Seed initial settings for a new tenant
     */
    async seedInitialSettings(dbName, tenantData, server = { is_primary: true }) {
        const settings = [
            { key: 'company_name', value: tenantData.name },
            { key: 'company_email', value: tenantData.email },
            { key: 'industry_type', value: tenantData.industry_type || 'general' },
            { key: 'timezone', value: 'Asia/Kolkata' },
            { key: 'currency', value: 'INR' },
            { key: 'date_format', value: 'YYYY-MM-DD' }
        ];

        if (server.is_primary) {
            const tenantPool = require('mysql2/promise').createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: dbName
            });

            try {
                for (const setting of settings) {
                    await tenantPool.query(
                        'INSERT INTO settings (`key`, `value`, `group`) VALUES (?, ?, ?)',
                        [setting.key, setting.value, 'general']
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
                    const sql = `INSERT INTO settings (\\\`key\\\`, \\\`value\\\`, \\\`group\\\`) VALUES ('${setting.key}', '${setting.value}', 'general')`;
                    const cmd = `mysql -u${server.db_user} -p${server.db_password} ${dbName} -e "${sql}"`;
                    await this.executeOnServer(server, cmd);
                }
                console.log(`[Provisioner] Initial settings seeded for ${tenantData.name} on remote server ${server.name}`);
            } catch (error) {
                console.warn(`[Provisioner] Could not seed settings remotely on ${server.name}: ${error.message}`);
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
            const tunnelId = server.cloudflare_tunnel_id;

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
            await this.updateTunnelConfig(hostname, port, server);

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

        try {
            // Step 1: Create DNS CNAME record
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
                console.error('[Provisioner] Frontend DNS error:', dnsData.errors);
                return null;
            }

            console.log(`[Provisioner] DNS record created: ${customDomain}`);

            // Step 2: Attach domain to Cloudflare Pages project
            if (this.cfAccountId && this.cfPagesProject) {
                await this.attachDomainToPages(customDomain);
            } else {
                console.warn('[Provisioner] Pages account/project not set, manual domain attachment required');
            }

            return dnsData.result.id;

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
                    body: JSON.stringify({
                        name: domain
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                console.error('[Provisioner] Pages domain attachment error:', data.errors);
                return false;
            }

            console.log(`[Provisioner] Domain attached to Pages: ${domain}`);
            return true;

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
        const storefrontPagesUrl = process.env.NEXCRM_STOREFRONT_PAGES_URL || 'nexcrm-storefront.pages.dev';
        const storefrontProject = process.env.NEXCRM_STOREFRONT_PROJECT || 'nexcrm-storefront';

        try {
            // Create DNS CNAME record for storefront
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
                // Check if record already exists
                if (dnsData.errors?.[0]?.code === 81053) {
                    console.log(`[Provisioner] Storefront DNS already exists: ${storefrontDomain}`);
                    return null;
                }
                console.error('[Provisioner] Storefront DNS error:', dnsData.errors);
                return null;
            }

            console.log(`[Provisioner] Storefront DNS created: ${storefrontDomain}`);

            // Attach domain to storefront Pages project
            if (this.cfAccountId && storefrontProject) {
                try {
                    const pagesResponse = await fetch(
                        `https://api.cloudflare.com/client/v4/accounts/${this.cfAccountId}/pages/projects/${storefrontProject}/domains`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${this.cfApiToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ name: storefrontDomain })
                        }
                    );
                    const pagesData = await pagesResponse.json();

                    if (!pagesData.success) {
                        console.error(`[Provisioner] Storefront Pages domain error:`, pagesData.errors);
                    } else {
                        console.log(`[Provisioner] Storefront domain attached to Pages: ${storefrontDomain}`);
                    }
                } catch (e) {
                    console.warn('[Provisioner] Could not attach storefront domain to Pages:', e.message);
                }
            } else {
                console.warn('[Provisioner] Missing cfAccountId or storefrontProject for Pages attachment');
            }

            return dnsData.result.id;

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
        const ecosystemPath = server.ecosystem_config_path || '/var/www/html/ecosystem.config.js';
        const processName = `tenant-${tenant.slug}`;
        const backendPath = server.nexcrm_backend_path || '/var/www/nexcrm-backend';

        try {
            // Read current config
            const { stdout: configContent } = await this.executeOnServer(server, `cat ${ecosystemPath}`);

            // Check if already exists
            if (configContent.includes(`name: "${processName}"` || configContent.includes(`name: '${processName}'`))) {
                console.log(`[Provisioner] Ecosystem config already has ${processName}`);
                return;
            }

            // Create new app entry
            const newApp = `    {
      name: "${processName}",
      cwd: "${backendPath}",
      script: "server.js",
      args: "--port ${port} --db nexcrm_${tenant.slug.replace(/-/g, '_')} --industry ${tenant.industry_type || 'general'}"
    }`;

            // Naive insertion: replace the last ] with , newApp ]
            // This assumes a simple ecosystem.config.js structure
            const newConfig = configContent.trim().replace(/\]\s*\}\s*;?\s*$/, `,\n${newApp}\n  ]\n};`);

            // Write back to server
            // Using a temp file and moving it is safer
            const tmpFile = `/tmp/ecosystem_${tenant.slug}.js`;
            await this.executeOnServer(server, `echo "${newConfig.replace(/"/g, '\\"')}" > ${tmpFile} && sudo mv ${tmpFile} ${ecosystemPath}`);

            console.log(`[Provisioner] Added ${processName} to ecosystem.config.js on server ${server.name}`);

        } catch (error) {
            console.warn(`[Provisioner] Could not update ecosystem.config.js on ${server.name}:`, error.message);
        }
    }

    /**
     * Setup Custom Domain for a tenant (Frontend via Pages)
     */
    async setupCustomDomain(tenant, customDomain) {
        console.log(`[Provisioner] Setting up custom domain "${customDomain}" for tenant ${tenant.slug}...`);

        try {
            const isInternalDomain = customDomain.endsWith(this.cfDomain);
            let dnsRecordId = null;

            // 1. If it's OUR subdomain (internal), create DNS record
            if (isInternalDomain) {
                if (this.cfApiToken && this.cfZoneId) {
                    // This logic remains for subdomains like "special.nexspiresolutions.co.in"
                    // But typically users want external domains like "crm.mybrand.com"
                    // ... implementation skipped for brevity as this is rare for "custom" domain feature
                }
            }

            // 2. Attach usage to Cloudflare Pages (Frontend)
            // This is the primary action for custom domains
            let pagesAttached = false;
            if (this.cfAccountId && this.cfPagesProject) {
                pagesAttached = await this.attachDomainToPages(customDomain);
            }

            // 3. Return instructions
            return {
                success: pagesAttached,
                domain: customDomain,
                cnameTarget: this.cfPagesUrl, // e.g., nexcrm-frontend.pages.dev
                verificationNeeded: !isInternalDomain
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
            return data.success;
        } catch (error) {
            console.error(`[Provisioner] Cloudflare Pages domain attachment failed: ${error.message}`);
            return false;
        }
    }
    /**
     * Update Cloudflare tunnel config on target server
     */
    async updateTunnelConfig(hostname, port, server = { is_primary: true }) {
        try {
            const tunnelConfigPath = server.cloudflare_config_path || '/etc/cloudflared/config.yml';
            const { stdout: config } = await this.executeOnServer(server, `cat ${tunnelConfigPath}`);

            const hostname = `${slug}-crm-api.${this.cfDomain}`;

            // Check if entry already exists
            if (config.includes(hostname)) {
                console.log(`[Provisioner] Tunnel config already has entry for ${hostname}`);
                return;
            }

            // Insert new route before catch-all
            const newRoute = `  - hostname: ${hostname}\n    service: http://localhost:${port}\n`;

            // Find the catch-all and insert before it
            const newConfig = config.replace(
                '  - service: http_status:404',
                newRoute + '  - service: http_status:404'
            );

            const tmpFile = `/tmp/tunnel_${slug}.yml`;
            await this.executeOnServer(server, `echo "${newConfig.replace(/"/g, '\\"')}" > ${tmpFile} && sudo mv ${tmpFile} ${tunnelConfigPath}`);

            console.log(`[Provisioner] Tunnel config updated on server ${server.name}`);

            // Restart cloudflared AFTER a delay
            const restartCmd = 'sudo systemctl restart cloudflared';
            setTimeout(async () => {
                try {
                    await this.executeOnServer(server, restartCmd);
                    console.log(`[Provisioner] Cloudflared restarted on server ${server.name}`);
                } catch (err) {
                    console.warn(`[Provisioner] cloudflared restart failed on ${server.name}:`, err.message);
                }
            }, 5000);

        } catch (error) {
            console.warn(`[Provisioner] Could not update tunnel config on ${server.name}:`, error.message);
        }
    }

    /**
     * Start PM2 process for tenant
     */
    async startProcess(tenant, port, server) {
        const { slug } = tenant;
        const processName = `tenant-${slug}`;

        try {
            // Path structure for tenant backend on target server
            const backendPath = server.nexcrm_backend_path || '/var/www/nexcrm-backend';

            // Environment variables for tenant
            const envVars = `TENANT_ID=${tenant.id} TENANT_SLUG=${slug} PORT=${port} DB_NAME=nexcrm_${slug} DB_USER=${server.db_user || 'root'} DB_PASSWORD='${server.db_password}'`;

            // Start process using PM2 on target server
            await this.executeOnServer(server, `cd ${backendPath} && ${envVars} pm2 start server.js --name "${processName}"`);

            // Persist PM2 list and update ecosystem.config.js on target server
            await this.executeOnServer(server, 'pm2 save');
            await this.updateEcosystemConfig(slug, port, server);

            console.log(`[Provisioner] PM2 process "${processName}" started on port ${port} on server ${server.name}`);

            // Update tenant status
            await TenantModel.update(tenant.id, {
                process_name: processName,
                process_status: 'running',
                assigned_port: port
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
            const tunnelConfigPath = server.cloudflare_config_path || '/etc/cloudflared/config.yml';
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
            const ecosystemPath = server.ecosystem_config_path || '/var/www/html/ecosystem.config.js';
            const { stdout: configContent } = await this.executeOnServer(server, `cat ${ecosystemPath}`);

            const regex = new RegExp(`\\s*,?\\s*\\{[^}]*name:\\s*"${processName}"[^}]*\\}`, 'g');
            let newContent = configContent.replace(regex, '');
            newContent = newContent.replace(/,(\s*,)+/g, ',').replace(/\[\s*,/g, '[');

            const tmpFile = `/tmp/ecosystem_rm_${processName}.js`;
            await this.executeOnServer(server, `echo "${newContent.replace(/"/g, '\\"')}" > ${tmpFile} && sudo mv ${tmpFile} ${ecosystemPath}`);

            console.log(`[Provisioner] Removed ${processName} from ecosystem.config.js on ${server.name}`);
            return true;
        } catch (error) {
            console.warn(`[Provisioner] Could not update ecosystem.config.js on ${server.name}:`, error.message);
            return false;
        }
    }

    /**
     * Update Cloudflare tunnel config
     */
    async updateTunnelConfig(slug, port, server, customDomain = null) {
        try {
            const configPath = server.cf_config_path || '/etc/cloudflared/config.yml';
            const hostname = customDomain || `${slug}-crm-api.${this.cfDomain}`;
            const service = `http://localhost:${port}`;

            // Read current config from target server
            const { stdout: currentConfig } = await this.executeOnServer(server, `cat ${configPath}`);

            // Simple string manipulation to add new ingress rule before the catch-all
            // A more robust approach would be parsing YAML, but since it's a fixed format:
            const lines = currentConfig.split('\n');
            const catchAllIndex = lines.findIndex(line => line.includes('service: http_status:404'));

            if (catchAllIndex !== -1) {
                const newRule = `  - hostname: ${hostname}\n    service: ${service}`;
                lines.splice(catchAllIndex, 0, newRule);

                const updatedConfig = lines.join('\n');

                // Write back to target server (needs sudo)
                await this.executeOnServer(server, `echo "${updatedConfig.replace(/"/g, '\\"')}" | sudo tee ${configPath} > /dev/null`);

                // Restart cloudflared on target server
                await this.executeOnServer(server, 'sudo systemctl restart cloudflared');
                console.log(`[Provisioner] Cloudflare Tunnel config updated on server ${server.name} for ${hostname}`);
            }
        } catch (error) {
            console.warn(`[Provisioner] Failed to update Tunnel config: ${error.message}`);
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
                const cmd = `mysql -u${server.db_user} -p${server.db_password} -e "DROP DATABASE IF EXISTS \\\`${dbName}\\\`"`;
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
     * Drop tenant database
     */
    async createDatabase(dbName, dbHost = 'localhost', dbUser = 'root', dbPassword = '') {
        try {
            // Using mysql connection to run CREATE DATABASE
            // Note: This assumes the Admin API server can reach the target server's DB
            // If DB is local to target server and not exposed, we might need to run via SSH
            const connection = await pool.getConnection();
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            connection.release();
            console.log(`[Provisioner] Database "${dbName}" created successfully on ${dbHost}`);
        } catch (error) {
            console.error(`[Provisioner] Database creation failed: ${error.message}`);
            throw error;
        }
    }

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

        try { await this.deleteProcess(tenant); results.pm2Deleted = true; } catch (e) { /* ignore */ }

        // Cleanup storage (local to the server where uploads are, assuming primary or shared mount)
        try {
            if (server.is_primary) {
                const uploadsDir = path.join(this.nexcrmBackendPath, 'uploads');
                const tenantDir = path.join(uploadsDir, tenant.slug);
                if (require('fs').existsSync(tenantDir)) {
                    require('fs').rmSync(tenantDir, { recursive: true, force: true });
                    results.storageCleanedUp = true;
                }
            } else {
                const remoteDir = path.join(server.nexcrm_backend_path || '/var/www/nexcrm-backend', 'uploads', tenant.slug);
                await this.executeOnServer(server, `sudo rm -rf ${remoteDir}`);
                results.storageCleanedUp = true;
            }
        } catch (e) { /* ignore */ }

        if (tenant.cf_dns_record_id) { try { await this.removeCloudflareRoute(tenant.cf_dns_record_id); results.apiDnsRemoved = true; } catch (e) { /* ignore */ } }
        try { await this.removeCloudflareFrontendRoute(tenant.slug); results.frontendDnsRemoved = true; } catch (e) { /* ignore */ }
        try { await this.removeStorefrontRoute(tenant.slug); results.storefrontDnsRemoved = true; } catch (e) { /* ignore */ }

        try {
            const frontendDomain = `${tenant.slug}-crm.${this.cfDomain}`;
            const storefrontDomain = `${tenant.slug}.${this.cfDomain}`;
            const storefrontProject = process.env.NEXCRM_STOREFRONT_PROJECT || 'nexcrm-storefront';
            await this.removeDomainFromPages(frontendDomain, this.cfPagesProject);
            await this.removeDomainFromPages(storefrontDomain, storefrontProject);
            results.pagesDomainsRemoved = true;
        } catch (e) { /* ignore */ }

        try { await this.removeFromTunnelConfig(tenant.slug, server); results.tunnelConfigUpdated = true; } catch (e) { /* ignore */ }
        if (tenant.custom_domain) { try { await this.removeFromTunnelConfig(tenant.slug, server, tenant.custom_domain); } catch (e) { /* ignore */ } }

        try { await this.removeFromEcosystemConfig(processName, server); results.ecosystemUpdated = true; } catch (e) { /* ignore */ }
        if (dropDb && tenant.db_name) { try { await this.dropDatabase(tenant.db_name, server); results.databaseDropped = true; } catch (e) { /* ignore */ } }
        try { const unregistered = await this.unregisterFromRegistry(tenant.slug); results.registryCleanedUp = unregistered; } catch (e) { /* ignore */ }

        return results;
    }
}


