const ServerModel = require('../models/server.model');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const sanitizeServer = (server) => {
    if (!server) return server;
    const { db_password, ...safeServer } = server;
    return {
        ...safeServer,
        has_db_password: Boolean(db_password)
    };
};

class ServerController {
    /**
     * List all servers
     */
    async getAllServers(req, res) {
        try {
            const servers = await ServerModel.getStats();
            res.json({ success: true, data: servers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get server details
     */
    async getServerById(req, res) {
        try {
            const server = await ServerModel.findById(req.params.id);
            if (!server) {
                return res.status(404).json({ success: false, message: 'Server not found' });
            }
            res.json({ success: true, data: sanitizeServer(server) });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Create new server
     */
    async createServer(req, res) {
        try {
            if (!req.body.name || !req.body.hostname) {
                return res.status(400).json({
                    success: false,
                    message: 'Server name and hostname are required'
                });
            }

            const serverId = await ServerModel.create(req.body);
            const server = await ServerModel.findById(serverId);
            res.status(201).json({
                success: true,
                data: sanitizeServer(server)
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update server
     */
    async updateServer(req, res) {
        try {
            const server = await ServerModel.update(req.params.id, req.body);
            if (!server) {
                return res.status(404).json({ success: false, message: 'Server not found' });
            }
            res.json({
                success: true,
                data: sanitizeServer(server)
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Test SSH connectivity to server
     */
    async testConnection(req, res) {
        try {
            const server = await ServerModel.findById(req.params.id);
            if (!server) {
                return res.status(404).json({ success: false, message: 'Server not found' });
            }

            if (server.is_primary) {
                return res.json({ success: true, message: 'Primary server is always connected' });
            }

            const quoteShellArg = (value) => `'${String(value ?? '').replace(/'/g, `'\\''`)}'`;
            const sshTarget = server.hostname.includes('@') || !server.ssh_user
                ? server.hostname
                : `${server.ssh_user}@${server.hostname}`;
            const backendPath = server.nexcrm_backend_path || process.env.NEXCRM_BACKEND_PATH || '/var/www/html/napcrm-backend';
            const ecosystemPath = server.ecosystem_config_path || '/var/www/html/ecosystem.config.js';
            const dbHost = server.db_host || 'localhost';
            const dbPort = Number(server.db_port || process.env.DB_PORT || 3306);
            const dbUser = server.db_user || process.env.DB_USER || 'root';
            const dbPassword = server.db_password || process.env.DB_PASSWORD || '';

            const remoteChecks = [
                'pm2 -v',
                `test -d ${quoteShellArg(backendPath)}`,
                `test -f ${quoteShellArg(ecosystemPath)}`,
                'command -v cloudflared >/dev/null',
                `((command -v rc-service >/dev/null 2>&1 && rc-service cloudflared status >/dev/null 2>&1) || `
                    + `(command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet cloudflared))`,
                `MYSQL_PWD=${quoteShellArg(dbPassword)} mysql -h ${quoteShellArg(dbHost)} -P ${quoteShellArg(dbPort)} -u ${quoteShellArg(dbUser)} -e ${quoteShellArg('SELECT 1')}`
            ].join(' && ');

            const { stdout } = await execFileAsync('ssh', [
                '-o', 'BatchMode=yes',
                '-o', 'ConnectTimeout=5',
                sshTarget,
                remoteChecks
            ]);
            const pm2Version = stdout.split(/\r?\n/).map(line => line.trim()).find(Boolean) || 'unknown';

            res.json({
                success: true,
                message: 'Connection successful',
                checks: {
                    ssh: true,
                    pm2: true,
                    backendPath,
                    ecosystemPath,
                    cloudflared: true,
                    database: `${dbHost}:${dbPort}`
                },
                version: pm2Version
            });
        } catch (error) {
            const safeError = String(error.stderr || '').trim()
                || 'One or more SSH, PM2, cloudflared, path, or database checks failed';
            res.status(500).json({
                success: false,
                message: 'Connection failed',
                error: safeError
            });
        }
    }
}

module.exports = new ServerController();
