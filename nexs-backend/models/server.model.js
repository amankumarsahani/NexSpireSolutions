const { pool } = require('../config/database');

class ServerModel {
    /**
     * Get all servers
     */
    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM servers ORDER BY is_primary DESC, name ASC');
        return rows;
    }

    /**
     * Get active servers for tenant allocation
     */
    static async findActive() {
        const [rows] = await pool.query('SELECT * FROM servers WHERE is_active = TRUE');
        return rows;
    }

    /**
     * Get server by ID
     */
    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM servers WHERE id = ?', [id]);
        return rows[0];
    }

    /**
     * Find the best server for a new tenant (least loaded)
     */
    static async getBestServer() {
        const [rows] = await pool.query(`
            SELECT s.*, COUNT(t.id) as tenant_count 
            FROM servers s 
            LEFT JOIN tenants t ON s.id = t.server_id 
            WHERE s.is_active = TRUE 
            GROUP BY s.id 
            ORDER BY tenant_count ASC 
            LIMIT 1
        `);
        return rows[0];
    }

    /**
     * Create new server
     */
    static async create(serverData) {
        const {
            name, hostname, ssh_user, cloudflare_tunnel_id,
            db_host, db_user, db_password, is_active, is_primary
        } = serverData;

        const [result] = await pool.query(`
            INSERT INTO servers (
                name, hostname, ssh_user, cloudflare_tunnel_id,
                db_host, db_user, db_password, is_active, is_primary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, hostname, ssh_user || 'admin', cloudflare_tunnel_id,
            db_host || 'localhost', db_user, db_password,
            is_active !== undefined ? is_active : true,
            is_primary !== undefined ? is_primary : false
        ]);

        return result.insertId;
    }

    /**
     * Update server
     */
    static async update(id, serverData) {
        const allowedFields = [
            'name', 'hostname', 'ssh_user', 'cloudflare_tunnel_id',
            'db_host', 'db_user', 'db_password', 'is_active', 'is_primary'
        ];
        const updates = [];
        const values = [];

        allowedFields.forEach(field => {
            if (serverData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(serverData[field]);
            }
        });

        if (updates.length === 0) return null;

        values.push(id);
        await pool.query(`UPDATE servers SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }

    /**
     * Get server stats (tenant distribution)
     */
    static async getStats() {
        const [rows] = await pool.query(`
            SELECT s.id, s.name, s.hostname, s.is_active, s.is_primary,
                   s.cloudflare_tunnel_id, s.ssh_user, s.db_host,
                   COUNT(t.id) as tenant_count,
                   SUM(CASE WHEN t.process_status = 'running' THEN 1 ELSE 0 END) as running_count
            FROM servers s
            LEFT JOIN tenants t ON s.id = t.server_id
            GROUP BY s.id
        `);
        return rows;
    }
}

module.exports = ServerModel;
