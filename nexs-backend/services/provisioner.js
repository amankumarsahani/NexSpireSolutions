/**
 * Tenant Provisioner Service
 * Handles automated provisioning of new tenant instances:
 * - Database creation and migration
 * - PM2 process management
 * - Cloudflare DNS configuration
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');
const TenantModel = require('../models/tenant.model');

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

        // Cloudflare tunnel config path
        this.cfConfigPath = process.env.CF_CONFIG_PATH || '/etc/cloudflared/config.yml';
    }

    /**
     * Full tenant provisioning flow
     */
    async provisionTenant(tenant) {
        const { id, name, slug, email, industry_type } = tenant;

        console.log(`[Provisioner] Starting provisioning for: ${slug}`);

        try {
            // 1. Allocate port
            const port = await TenantModel.allocatePort(id);
            console.log(`[Provisioner] Allocated port: ${port}`);

            // 2. Create database
            const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
            await this.createDatabase(dbName);
            console.log(`[Provisioner] Created database: ${dbName}`);

            // 3. Run migrations on new database
            await this.runMigrations(dbName);
            console.log(`[Provisioner] Migrations complete`);

            // 4. Create admin user in tenant DB
            const adminPassword = await this.createTenantAdmin(dbName, email, name);
            console.log(`[Provisioner] Admin user created`);

            // 5. Update tenant record with process info
            const processName = `tenant-${slug}`;
            await TenantModel.updateProcessInfo(id, {
                assigned_port: port,
                db_name: dbName,
                process_name: processName,
                process_status: 'stopped'
            });

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

            // 7. Start PM2 process
            await this.startProcess({ slug, assigned_port: port, db_name: dbName, industry_type });
            await TenantModel.updateProcessStatus(id, 'running');
            console.log(`[Provisioner] PM2 process started`);

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
    async runMigrations(dbName) {
        // Get the base CRM schema migration
        const schemaFile = path.join(this.migrationsPath, 'nexcrm_base_schema.sql');

        try {
            const sql = await fs.readFile(schemaFile, 'utf8');

            // Execute on tenant database
            const tenantPool = require('mysql2/promise').createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: dbName,
                multipleStatements: true
            });

            await tenantPool.query(sql);
            await tenantPool.end();

        } catch (error) {
            // If schema file doesn't exist yet, skip (we'll create it later)
            if (error.code === 'ENOENT') {
                console.warn(`[Provisioner] Schema file not found: ${schemaFile}. Skipping migrations.`);
                return;
            }
            throw error;
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

            // Restart cloudflared to apply changes (use sudo)
            await execAsync('sudo systemctl restart cloudflared');
            console.log('[Provisioner] Tunnel config updated and cloudflared restarted');

        } catch (error) {
            console.warn('[Provisioner] Could not update tunnel config:', error.message);
            // Don't throw - DNS record is created, tunnel config can be updated manually
        }
    }

    /**
     * Start PM2 process for tenant
     */
    async startProcess(tenant) {
        const { slug, assigned_port, db_name, industry_type = 'general' } = tenant;

        const cmd = `pm2 start ${this.nexcrmBackendPath}/server.js \
            --name "tenant-${slug}" \
            --max-memory-restart 80M \
            -- \
            --port ${assigned_port} \
            --db ${db_name} \
            --industry ${industry_type}`;

        try {
            await execAsync(cmd);
            await execAsync('pm2 save');
        } catch (error) {
            console.error('[Provisioner] PM2 start error:', error);
            throw error;
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
}

module.exports = new Provisioner();
