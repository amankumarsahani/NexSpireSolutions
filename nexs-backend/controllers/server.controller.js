const ServerModel = require('../models/server.model');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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
            res.json({ success: true, data: server });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Create new server
     */
    async createServer(req, res) {
        try {
            const serverId = await ServerModel.create(req.body);
            const server = await ServerModel.findById(serverId);
            res.status(201).json({ success: true, data: server });
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
            res.json({ success: true, data: server });
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

            // Test SSH connectivity using cloudflared access command if no public IP
            // We use a simple command like 'pm2 -v' to check connectivity
            const testCmd = `ssh -o BatchMode=yes -o ConnectTimeout=5 ${server.hostname} "pm2 -v"`;

            const { stdout } = await execAsync(testCmd);
            res.json({
                success: true,
                message: 'Connection successful',
                version: stdout.trim()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Connection failed',
                error: error.message
            });
        }
    }
}

module.exports = new ServerController();
