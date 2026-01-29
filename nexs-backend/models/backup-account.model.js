const { pool } = require('../config/database');

class BackupAccountModel {
    /**
     * Get all backup accounts
     */
    static async findAll() {
        const [rows] = await pool.query('SELECT id, account_name, folder_id, is_active, usage_count FROM backup_accounts');
        return rows;
    }

    /**
     * Get account with secrets (internal use)
     */
    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM backup_accounts WHERE id = ?', [id]);
        return rows[0];
    }

    /**
     * Get the next account to use (load balance/rotation)
     */
    static async getNextAccount() {
        const [rows] = await pool.query(`
            SELECT * FROM backup_accounts 
            WHERE is_active = TRUE 
            ORDER BY usage_count ASC 
            LIMIT 1
        `);
        return rows[0];
    }

    /**
     * Increment usage count
     */
    static async incrementUsage(id) {
        await pool.query('UPDATE backup_accounts SET usage_count = usage_count + 1 WHERE id = ?', [id]);
    }

    /**
     * Create backup account
     */
    static async create(data) {
        const { account_name, credentials_json, folder_id } = data;
        const [result] = await pool.query(`
            INSERT INTO backup_accounts (account_name, credentials_json, folder_id)
            VALUES (?, ?, ?)
        `, [account_name, JSON.stringify(credentials_json), folder_id]);
        return result.insertId;
    }

    /**
     * Add backup history record
     */
    static async addHistory(data) {
        const { tenant_id, server_id, file_name, gdrive_file_id, backup_account_id, status, error_message, file_size_bytes } = data;
        const [result] = await pool.query(`
            INSERT INTO backup_history (
                tenant_id, server_id, file_name, gdrive_file_id, 
                backup_account_id, status, error_message, file_size_bytes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tenant_id, server_id, file_name, gdrive_file_id, backup_account_id, status, error_message, file_size_bytes]);
        return result.insertId;
    }

    /**
     * Get backups older than 15 days for a specific account
     */
    static async getExpiredBackups(days = 15) {
        const [rows] = await pool.query(`
            SELECT * FROM backup_history 
            WHERE status = 'success' 
            AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [days]);
        return rows;
    }

    /**
     * Delete history record (after GDrive deletion)
     */
    static async deleteHistory(id) {
        await pool.query('DELETE FROM backup_history WHERE id = ?', [id]);
    }
}

module.exports = BackupAccountModel;
