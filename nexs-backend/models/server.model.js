const { pool } = require('../config/database');

class ServerModel {
    static normalizePortRange(portStart, portEnd) {
        const start = Number(portStart ?? 3001);
        const end = Number(portEnd ?? 3050);

        if (!Number.isInteger(start) || !Number.isInteger(end)) {
            throw new Error('Server port range must contain whole numbers');
        }
        if (start < 1024 || end > 65535 || start > end) {
            throw new Error('Server port range must be between 1024 and 65535');
        }
        if ((end - start) > 999) {
            throw new Error('Server port range cannot exceed 1000 ports');
        }

        return { start, end };
    }

    static async syncPortPool(connection, serverId, portStart, portEnd) {
        const { start, end } = this.normalizePortRange(portStart, portEnd);
        const [allocatedOutsideRange] = await connection.query(`
            SELECT port, tenant_id
            FROM port_allocation
            WHERE server_id = ?
              AND tenant_id IS NOT NULL
              AND (port < ? OR port > ?)
            LIMIT 1
        `, [serverId, start, end]);

        if (allocatedOutsideRange.length) {
            throw new Error(
                `Cannot change port range: port ${allocatedOutsideRange[0].port} `
                + `is assigned to tenant ${allocatedOutsideRange[0].tenant_id}`
            );
        }

        await connection.query(`
            DELETE FROM port_allocation
            WHERE server_id = ?
              AND tenant_id IS NULL
              AND (port < ? OR port > ?)
        `, [serverId, start, end]);

        const rows = [];
        for (let port = start; port <= end; port++) {
            rows.push([port, serverId]);
        }
        if (rows.length) {
            await connection.query(
                'INSERT IGNORE INTO port_allocation (port, server_id) VALUES ?',
                [rows]
            );
        }
    }

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
     * Resolve an explicitly selected server for new tenant allocation.
     * Inactive or full servers must not bypass the normal scheduler gate.
     */
    static async findAvailableById(id) {
        const [rows] = await pool.query(`
            SELECT s.*
            FROM servers s
            WHERE s.id = ?
              AND s.is_active = TRUE
              AND EXISTS (
                  SELECT 1
                  FROM port_allocation pa
                  WHERE pa.server_id = s.id
                    AND pa.tenant_id IS NULL
              )
            LIMIT 1
        `, [id]);
        return rows[0];
    }

    /**
     * Find the best server for a new tenant (least loaded)
     */
    static async getBestServer() {
        const [rows] = await pool.query(`
            SELECT s.*,
                   COALESCE(t.tenant_count, 0) AS tenant_count,
                   COALESCE(p.available_ports, 0) AS available_ports
            FROM servers s
            LEFT JOIN (
                SELECT server_id, COUNT(*) AS tenant_count
                FROM tenants
                GROUP BY server_id
            ) t ON s.id = t.server_id
            LEFT JOIN (
                SELECT server_id, SUM(tenant_id IS NULL) AS available_ports
                FROM port_allocation
                GROUP BY server_id
            ) p ON s.id = p.server_id
            WHERE s.is_active = TRUE
              AND COALESCE(p.available_ports, 0) > 0
            ORDER BY tenant_count ASC, available_ports DESC
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
            db_host, db_port, db_user, db_password,
            nexcrm_backend_path, ecosystem_config_path, cloudflare_config_path,
            port_start, port_end, is_active, is_primary
        } = serverData;
        const range = this.normalizePortRange(port_start, port_end);
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const [result] = await connection.query(`
                INSERT INTO servers (
                    name, hostname, ssh_user, cloudflare_tunnel_id,
                    db_host, db_port, db_user, db_password,
                    nexcrm_backend_path, ecosystem_config_path, cloudflare_config_path,
                    port_start, port_end, is_active, is_primary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, hostname, ssh_user || 'admin', cloudflare_tunnel_id,
                db_host || 'localhost', db_port || 3306, db_user, db_password,
                nexcrm_backend_path || null,
                ecosystem_config_path || null,
                cloudflare_config_path || null,
                range.start, range.end,
                is_active !== undefined ? is_active : false,
                is_primary !== undefined ? is_primary : false
            ]);

            await this.syncPortPool(connection, result.insertId, range.start, range.end);
            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update server
     */
    static async update(id, serverData) {
        const allowedFields = [
            'name', 'hostname', 'ssh_user', 'cloudflare_tunnel_id',
            'db_host', 'db_port', 'db_user', 'db_password',
            'nexcrm_backend_path', 'ecosystem_config_path', 'cloudflare_config_path',
            'port_start', 'port_end',
            'is_active', 'is_primary'
        ];
        const updates = [];
        const values = [];

        allowedFields.forEach(field => {
            if (serverData[field] !== undefined) {
                if (field === 'db_password' && serverData[field] === '') return;
                updates.push(`${field} = ?`);
                values.push(serverData[field]);
            }
        });

        if (updates.length === 0) return this.findById(id);
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const [existingRows] = await connection.query(
                'SELECT port_start, port_end FROM servers WHERE id = ? FOR UPDATE',
                [id]
            );
            if (!existingRows.length) {
                await connection.rollback();
                return null;
            }

            const range = this.normalizePortRange(
                serverData.port_start ?? existingRows[0].port_start,
                serverData.port_end ?? existingRows[0].port_end
            );

            values.push(id);
            await connection.query(
                `UPDATE servers SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
            await this.syncPortPool(connection, id, range.start, range.end);
            await connection.commit();
            return this.findById(id);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get server stats (tenant distribution)
     */
    static async getStats() {
        const [rows] = await pool.query(`
            SELECT s.id, s.name, s.hostname, s.is_active, s.is_primary,
                   s.cloudflare_tunnel_id, s.ssh_user, s.db_host, s.db_port,
                   s.nexcrm_backend_path, s.ecosystem_config_path, s.cloudflare_config_path,
                   s.port_start, s.port_end,
                   COUNT(t.id) as tenant_count,
                   SUM(CASE WHEN t.process_status = 'running' THEN 1 ELSE 0 END) as running_count,
                   (SELECT COUNT(*) FROM port_allocation pa
                    WHERE pa.server_id = s.id) AS total_ports,
                   (SELECT COUNT(*) FROM port_allocation pa
                    WHERE pa.server_id = s.id AND pa.tenant_id IS NULL) AS available_ports
            FROM servers s
            LEFT JOIN tenants t ON s.id = t.server_id
            GROUP BY s.id
        `);
        return rows;
    }
}

module.exports = ServerModel;
