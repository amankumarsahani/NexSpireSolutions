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
const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');
const TenantModel = require('../models/tenant.model');
const EmailService = require('./email.service');

class Provisioner {
    constructor() {
        // Paths - adjust based on your server setup
        this.nexcrmBackendPath = process.env.NEXCRM_BACKEND_PATH || '/var/www/nexcrm-backend';
        this.migrationsPath = path.join(__dirname, '../database/migrations');

        // Cloudflare config
        this.cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
        this.cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
        this.cfTunnelId = process.env.CLOUDFLARE_TUNNEL_ID;
        this.cfDomain = process.env.NEXCRM_DOMAIN || 'nexspiresolutions.co.in';
        this.cfPagesUrl = process.env.NEXCRM_PAGES_URL || 'nexcrm-frontend.pages.dev';
        this.cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID; // For Pages API
        this.cfPagesProject = process.env.NEXCRM_PAGES_PROJECT || 'nexcrm-frontend';

        // Registry service config (for mobile app lookup)
        this.registryUrl = process.env.REGISTRY_URL || 'http://localhost:4000';
        this.registryApiKey = process.env.REGISTRY_API_KEY;

        // Cloudflare tunnel config path
        this.cfConfigPath = process.env.CF_CONFIG_PATH || '/etc/cloudflared/config.yml';

        // Log configuration status
        console.log('[Provisioner] Configuration:');
        console.log(`  - CF API Token: ${this.cfApiToken ? 'SET' : 'NOT SET'}`);
        console.log(`  - CF Zone ID: ${this.cfZoneId ? 'SET' : 'NOT SET'}`);
        console.log(`  - CF Account ID: ${this.cfAccountId ? 'SET' : 'NOT SET (required for Pages domains)'}`);
        console.log(`  - CF Pages Project: ${this.cfPagesProject}`);
        console.log(`  - SMTP configured: ${process.env.SMTP_HOST ? 'YES' : 'NO'}`);
    }

    /**
     * Full tenant provisioning flow
     */
    async provisionTenant(tenant) {
        const { id, name, slug, email, industry_type, plan_slug } = tenant;

        console.log(`[Provisioner] Starting provisioning for: ${slug}`);

        try {
            // 1. Allocate port
            const port = await TenantModel.allocatePort(id);
            console.log(`[Provisioner] Allocated port: ${port}`);

            // 2. Create database
            const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
            await this.createDatabase(dbName);
            console.log(`[Provisioner] Created database: ${dbName}`);

            // 3. Run migrations on new database (base + industry-specific)
            await this.runMigrations(dbName, industry_type);
            console.log(`[Provisioner] Migrations complete (industry: ${industry_type})`);

            // 4. Create admin user in tenant DB
            const adminPassword = await this.createTenantAdmin(dbName, email, name);
            console.log(`[Provisioner] Admin user created`);

            // 4b. Create NexSpire super admin in tenant DB (for support access)
            await this.createNexSpireSuperAdmin(dbName);
            console.log(`[Provisioner] NexSpire super admin added`);

            // 4c. Seed initial settings (company name, industry, colors, etc.)
            await this.seedInitialSettings(dbName, { name, email, industry_type });
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
                cfRouteId = await this.addCloudflareRoute(slug, port);
                await TenantModel.updateCfDnsRecordId(id, cfRouteId);
                console.log(`[Provisioner] Cloudflare API route added`);

                // Frontend subdomain (tenant-crm.domain -> Cloudflare Pages)
                await this.addCloudflareFrontendRoute(slug);
                console.log(`[Provisioner] Cloudflare frontend route added`);
            }

            // 7. Start PM2 process (with industry and plan for feature config)
            await this.startProcess({ slug, assigned_port: port, db_name: dbName, industry_type, plan_slug });
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
    async createDatabase(dbName) {
        // Use root/admin connection to create database
        await pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

        // Grant privileges (adjust user as needed)
        const dbUser = process.env.DB_USER || 'nexcrm';
        const dbHost = process.env.DB_HOST || 'localhost';
        await pool.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'${dbHost}'`);
        await pool.query('FLUSH PRIVILEGES');
    }

    /**
     * Run migrations on tenant database
     */
    async runMigrations(dbName, industryType = 'general') {
        // Get the base CRM schema migration
        const schemaFile = path.join(this.migrationsPath, 'nexcrm_base_schema.sql');

        // Create tenant database connection
        const tenantPool = require('mysql2/promise').createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName,
            multipleStatements: true
        });

        try {
            // 1. Run base schema
            try {
                const sql = await fs.readFile(schemaFile, 'utf8');
                await tenantPool.query(sql);
                console.log(`[Provisioner] Base schema migration complete`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.warn(`[Provisioner] Schema file not found: ${schemaFile}. Skipping base migrations.`);
                } else {
                    throw error;
                }
            }

            // 2. Run industry-specific migrations
            if (industryType && industryType !== 'general') {
                const industryMigrationsPath = path.join(this.migrationsPath, 'industry', industryType);
                try {
                    const files = await fs.readdir(industryMigrationsPath);
                    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

                    for (const file of sqlFiles) {
                        const filePath = path.join(industryMigrationsPath, file);
                        const sql = await fs.readFile(filePath, 'utf8');
                        await tenantPool.query(sql);
                        console.log(`[Provisioner] Industry migration complete: ${file}`);
                    }
                } catch (error) {
                    if (error.code === 'ENOENT') {
                        console.log(`[Provisioner] No industry migrations for: ${industryType}`);
                    } else {
                        console.warn(`[Provisioner] Industry migration error:`, error.message);
                    }
                }
            }

        } finally {
            await tenantPool.end();
        }
    }

    /**
     * Create admin user in tenant database
     */
    async createTenantAdmin(dbName, email, name) {
        const bcrypt = require('bcryptjs');
        const password = this.generatePassword();
        const hash = await bcrypt.hash(password, 10);

        const tenantPool = require('mysql2/promise').createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName
        });

        try {
            await tenantPool.query(
                `INSERT INTO users (email, password, firstName, lastName, role, status) 
                 VALUES (?, ?, ?, '', 'admin', 'active')`,
                [email, hash, name.split(' ')[0]]
            );
        } catch (error) {
            // Table might not exist yet if schema hasn't been created
            console.warn(`[Provisioner] Could not create admin user: ${error.message}`);
        }

        await tenantPool.end();

        // TODO: Send welcome email with credentials
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
                `INSERT INTO users (email, password, firstName, lastName, role, status) 
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
    async seedInitialSettings(dbName, tenantData) {
        const { name, email, industry_type } = tenantData;

        const tenantPool = require('mysql2/promise').createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName
        });

        try {
            const settings = [
                ['company_name', name],
                ['industry', industry_type || 'general'],
                ['email', email],
                ['currency', 'INR'],
                ['currency_symbol', '₹'],
                ['primary_color', '#3b82f6'],
                ['secondary_color', '#10b981']
            ];

            for (const [key, value] of settings) {
                await tenantPool.query(
                    `INSERT INTO settings (setting_key, setting_value) 
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [key, value]
                );
            }

            console.log(`[Provisioner] Initial settings seeded for ${name}`);
        } catch (error) {
            console.warn(`[Provisioner] Could not seed settings: ${error.message}`);
        }

        await tenantPool.end();
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
    async addCloudflareRoute(slug, port) {
        if (!this.cfApiToken || !this.cfZoneId) {
            console.warn('[Provisioner] Cloudflare not configured, skipping DNS setup');
            return null;
        }

        try {
            // Add CNAME record pointing to tunnel
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
                        name: `${slug}-crm-api.${this.cfDomain}`,
                        content: `${this.cfTunnelId}.cfargotunnel.com`,
                        proxied: true,
                        ttl: 1
                    })
                }
            );

            const data = await response.json();

            if (!data.success) {
                console.error('[Provisioner] Cloudflare DNS error:', data.errors);
                throw new Error('Failed to create DNS record');
            }

            // Update tunnel config
            await this.updateTunnelConfig(slug, port);

            return data.result.id;

        } catch (error) {
            console.error('[Provisioner] Cloudflare error:', error);
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
     * Update Cloudflare tunnel config
     */
    async updateTunnelConfig(slug, port) {
        try {
            // Read current config
            let config = await fs.readFile(this.cfConfigPath, 'utf8');

            const hostname = `${slug}-crm-api.${this.cfDomain}`;

            // Check if entry already exists
            if (config.includes(hostname)) {
                console.log(`[Provisioner] Tunnel config already has entry for ${hostname}`);
                return;
            }

            // Insert new route before catch-all
            const newRoute = `  - hostname: ${hostname}\n    service: http://localhost:${port}\n`;

            // Find the catch-all and insert before it
            config = config.replace(
                '  - service: http_status:404',
                newRoute + '  - service: http_status:404'
            );

            await fs.writeFile(this.cfConfigPath, config);
            console.log('[Provisioner] Tunnel config updated');

            // Restart cloudflared AFTER a longer delay to allow API response AND subsequent 
            // fetchData() calls to complete before tunnel restart breaks connections
            setTimeout(async () => {
                try {
                    await execAsync('sudo systemctl restart cloudflared');
                    console.log('[Provisioner] Cloudflared restarted (deferred)');
                } catch (err) {
                    console.warn('[Provisioner] Deferred cloudflared restart failed:', err.message);
                }
            }, 5000); // 5 second delay - gives time for response + fetchData()

        } catch (error) {
            console.warn('[Provisioner] Could not update tunnel config:', error.message);
            // Don't throw - DNS record is created, tunnel config can be updated manually
        }
    }

    /**
     * Start PM2 process for tenant
     */
    async startProcess(tenant) {
        const {
            slug,
            assigned_port,
            db_name,
            industry_type = 'general',
            plan_slug = 'starter'
        } = tenant;

        // --cwd ensures the process runs from the NexCRM directory so .env is found
        const cmd = `pm2 start ${this.nexcrmBackendPath}/server.js \
            --name "tenant-${slug}" \
            --cwd "${this.nexcrmBackendPath}" \
            --max-memory-restart 80M \
            -- \
            --port ${assigned_port} \
            --db ${db_name} \
            --industry ${industry_type} \
            --plan ${plan_slug}`;

        try {
            await execAsync(cmd);
            await execAsync('pm2 save');

            // Update ecosystem.config.js for reboot persistence
            await this.updateEcosystemConfig(tenant);
        } catch (error) {
            console.error('[Provisioner] PM2 start error:', error);
            throw error;
        }
    }

    /**
     * Update ecosystem.config.js to include new tenant
     * This ensures the tenant process restarts on system reboot
     */
    async updateEcosystemConfig(tenant) {
        const ecosystemPath = process.env.ECOSYSTEM_CONFIG_PATH || '/var/www/html/ecosystem.config.js';

        try {
            // Read current config
            let configContent = await fs.readFile(ecosystemPath, 'utf8');

            const processName = `tenant-${tenant.slug}`;

            // Check if already exists
            if (configContent.includes(`name: "${processName}"`)) {
                console.log(`[Provisioner] Ecosystem config already has ${processName}`);
                return;
            }

            // Create new app entry
            const newApp = `    {
      name: "${processName}",
      cwd: "${this.nexcrmBackendPath}",
      script: "server.js",
      args: "--port ${tenant.assigned_port} --db ${tenant.db_name} --industry ${tenant.industry_type || 'general'} --plan ${tenant.plan_slug || 'starter'}"
    }`;

            // Insert before the closing bracket of apps array
            // Find the last closing brace before "  ]"
            const insertPoint = configContent.lastIndexOf('    }') + 5;
            const beforeInsert = configContent.substring(0, insertPoint);
            const afterInsert = configContent.substring(insertPoint);

            configContent = beforeInsert + ',\n' + newApp + afterInsert;

            await fs.writeFile(ecosystemPath, configContent);
            console.log(`[Provisioner] Added ${processName} to ecosystem.config.js`);

        } catch (error) {
            console.warn('[Provisioner] Could not update ecosystem.config.js:', error.message);
            // Don't throw - PM2 process is already started and saved
        }
    }

    /**
     * Stop PM2 process for tenant
     */
    async stopProcess(tenant) {
        const processName = tenant.process_name || `tenant-${tenant.slug}`;

        try {
            await execAsync(`pm2 stop ${processName}`);
            await execAsync('pm2 save');
        } catch (error) {
            console.warn('[Provisioner] PM2 stop error:', error.message);
        }
    }

    /**
     * Restart PM2 process for tenant
     */
    async restartProcess(tenant) {
        const processName = tenant.process_name || `tenant-${tenant.slug}`;

        try {
            await execAsync(`pm2 restart ${processName}`);
            await execAsync('pm2 save');
        } catch (error) {
            console.error('[Provisioner] PM2 restart error:', error);
            throw error;
        }
    }

    /**
     * Delete PM2 process for tenant
     */
    async deleteProcess(tenant) {
        const processName = tenant.process_name || `tenant-${tenant.slug}`;

        try {
            await execAsync(`pm2 delete ${processName}`);
            await execAsync('pm2 save');
        } catch (error) {
            console.warn('[Provisioner] PM2 delete error:', error.message);
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
     * Get PM2 logs for a tenant process
     */
    async getProcessLogs(tenant, lines = 100) {
        const processName = tenant.process_name || `tenant-${tenant.slug}`;

        try {
            // Get both stdout and stderr logs
            const { stdout: outLogs } = await execAsync(
                `pm2 logs ${processName} --nostream --lines ${lines} 2>&1 || echo "No logs available"`
            );

            return {
                logs: outLogs,
                processName,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn('[Provisioner] Could not get PM2 logs:', error.message);
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
     * Remove tenant from ecosystem.config.js
     */
    async removeFromEcosystemConfig(processName) {
        const ecosystemPath = process.env.ECOSYSTEM_CONFIG_PATH || '/var/www/html/ecosystem.config.js';

        try {
            let configContent = await fs.readFile(ecosystemPath, 'utf8');

            // Find and remove the process block
            // Match the entire app object including surrounding formatting
            const regex = new RegExp(
                `\\s*,?\\s*\\{[^}]*name:\\s*"${processName}"[^}]*\\}`,
                'g'
            );

            const newContent = configContent.replace(regex, '');

            // Clean up any double commas that might result
            const cleanedContent = newContent.replace(/,(\s*,)+/g, ',').replace(/\[\s*,/g, '[');

            await fs.writeFile(ecosystemPath, cleanedContent);
            console.log(`[Provisioner] Removed ${processName} from ecosystem.config.js`);
            return true;

        } catch (error) {
            console.warn('[Provisioner] Could not update ecosystem.config.js:', error.message);
            return false;
        }
    }

    /**
     * Remove tenant route from Cloudflare tunnel config
     */
    async removeFromTunnelConfig(slug) {
        try {
            let config = await fs.readFile(this.cfConfigPath, 'utf8');

            const hostname = `${slug}-crm-api.${this.cfDomain}`;

            // Remove the route entry (hostname + service lines)
            const lines = config.split('\n');
            const newLines = [];
            let skipNext = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(`hostname: ${hostname}`)) {
                    skipNext = true; // Skip the next line (service line)
                    continue;
                }
                if (skipNext && lines[i].trim().startsWith('service:')) {
                    skipNext = false;
                    continue;
                }
                newLines.push(lines[i]);
            }

            await fs.writeFile(this.cfConfigPath, newLines.join('\n'));

            // Restart cloudflared
            await execAsync('sudo systemctl restart cloudflared');
            console.log(`[Provisioner] Removed ${hostname} from tunnel config`);
            return true;

        } catch (error) {
            console.warn('[Provisioner] Could not update tunnel config:', error.message);
            return false;
        }
    }

    /**
     * Drop tenant database
     */
    async dropDatabase(dbName) {
        try {
            await pool.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
            console.log(`[Provisioner] Dropped database: ${dbName}`);
            return true;
        } catch (error) {
            console.error('[Provisioner] Could not drop database:', error.message);
            return false;
        }
    }

    /**
     * Full cleanup - remove all tenant resources
     */
    async fullCleanup(tenant, options = {}) {
        const { dropDb = false } = options;
        const results = {
            pm2Deleted: false,
            apiDnsRemoved: false,
            frontendDnsRemoved: false,
            storefrontDnsRemoved: false,
            pagesDomainsRemoved: false,
            tunnelConfigUpdated: false,
            ecosystemUpdated: false,
            databaseDropped: false
        };

        const processName = tenant.process_name || `tenant-${tenant.slug}`;

        console.log(`[Provisioner] Starting full cleanup for: ${tenant.slug}`);

        // 1. Stop and delete PM2 process
        try {
            await this.deleteProcess(tenant);
            results.pm2Deleted = true;
        } catch (e) {
            console.warn('[Provisioner] PM2 delete failed:', e.message);
        }

        // 2. Remove API DNS record
        if (tenant.cf_dns_record_id) {
            try {
                await this.removeCloudflareRoute(tenant.cf_dns_record_id);
                results.apiDnsRemoved = true;
            } catch (e) {
                console.warn('[Provisioner] API DNS removal failed:', e.message);
            }
        }

        // 3. Remove frontend DNS record
        try {
            await this.removeCloudflareFrontendRoute(tenant.slug);
            results.frontendDnsRemoved = true;
        } catch (e) {
            console.warn('[Provisioner] Frontend DNS removal failed:', e.message);
        }

        // 4. Remove storefront DNS record
        try {
            await this.removeStorefrontRoute(tenant.slug);
            results.storefrontDnsRemoved = true;
        } catch (e) {
            console.warn('[Provisioner] Storefront DNS removal failed:', e.message);
        }

        // 5. Remove custom domains from Cloudflare Pages
        try {
            const frontendDomain = `${tenant.slug}-crm.${this.cfDomain}`;
            const storefrontDomain = `${tenant.slug}.${this.cfDomain}`;
            const storefrontProject = process.env.NEXCRM_STOREFRONT_PROJECT || 'nexcrm-storefront';

            await this.removeDomainFromPages(frontendDomain, this.cfPagesProject);
            await this.removeDomainFromPages(storefrontDomain, storefrontProject);
            results.pagesDomainsRemoved = true;
        } catch (e) {
            console.warn('[Provisioner] Pages domain removal failed:', e.message);
        }

        // 6. Remove from tunnel config
        try {
            await this.removeFromTunnelConfig(tenant.slug);
            results.tunnelConfigUpdated = true;
        } catch (e) {
            console.warn('[Provisioner] Tunnel config update failed:', e.message);
        }

        // 7. Remove from ecosystem.config.js
        try {
            await this.removeFromEcosystemConfig(processName);
            results.ecosystemUpdated = true;
        } catch (e) {
            console.warn('[Provisioner] Ecosystem config update failed:', e.message);
        }

        // 8. Drop database (optional)
        if (dropDb && tenant.db_name) {
            try {
                await this.dropDatabase(tenant.db_name);
                results.databaseDropped = true;
            } catch (e) {
                console.warn('[Provisioner] Database drop failed:', e.message);
            }
        }

        console.log(`[Provisioner] Full cleanup complete for: ${tenant.slug}`, results);
        return results;
    }
}

module.exports = new Provisioner();


