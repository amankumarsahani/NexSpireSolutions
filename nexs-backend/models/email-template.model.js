const { query } = require('../config/database');

/**
 * Email Template Model
 * Handles CRUD operations for email templates stored in database
 */
class EmailTemplateModel {
    /**
     * Find all templates
     * @param {Object} options - Query options
     * @returns {Promise<Array>} List of templates
     */
    static async findAll(options = {}) {
        const { category, isActive, type } = options;
        let sql = 'SELECT * FROM email_templates WHERE 1=1';
        const params = [];

        // Only add type filter if type is specified (may not have type column in older DBs)
        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (isActive !== undefined) {
            sql += ' AND is_active = ?';
            params.push(isActive);
        }

        sql += ' ORDER BY category ASC, name ASC';

        try {
            const [rows] = await query(sql, params);
            return rows.map(this.parseRow);
        } catch (error) {
            // If query fails (possibly due to missing type column), try without type filter
            if (type && error.code === 'ER_BAD_FIELD_ERROR') {
                console.log('Type column may not exist, retrying without type filter');
                let fallbackSql = 'SELECT * FROM email_templates WHERE 1=1';
                const fallbackParams = [];

                if (category) {
                    fallbackSql += ' AND category = ?';
                    fallbackParams.push(category);
                }

                if (isActive !== undefined) {
                    fallbackSql += ' AND is_active = ?';
                    fallbackParams.push(isActive);
                }

                fallbackSql += ' ORDER BY category ASC, name ASC';

                const [fallbackRows] = await query(fallbackSql, fallbackParams);
                return fallbackRows.map(this.parseRow);
            }
            throw error;
        }
    }

    /**
     * Find template by ID
     * @param {number} id - Template ID
     * @returns {Promise<Object|null>} Template or null
     */
    static async findById(id) {
        const [rows] = await query(
            'SELECT * FROM email_templates WHERE id = ?',
            [id]
        );
        return rows.length > 0 ? this.parseRow(rows[0]) : null;
    }

    /**
     * Find template by name
     * @param {string} name - Template name
     * @returns {Promise<Object|null>} Template or null
     */
    static async findByName(name) {
        const [rows] = await query(
            'SELECT * FROM email_templates WHERE name = ? AND is_active = true',
            [name]
        );
        return rows.length > 0 ? this.parseRow(rows[0]) : null;
    }

    /**
     * Create new template
     * @param {Object} data - Template data
     * @returns {Promise<number>} New template ID
     */
    static async create(data) {
        const {
            name,
            type = 'email',
            subject,
            html_content,
            description,
            variables,
            category = 'notification',
            is_active = true
        } = data;

        const [result] = await query(
            `INSERT INTO email_templates 
             (name, type, subject, html_content, description, variables, category, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                type,
                subject,
                html_content,
                description,
                JSON.stringify(variables || []),
                category,
                is_active
            ]
        );

        return result.insertId;
    }

    /**
     * Update template
     * @param {number} id - Template ID
     * @param {Object} data - Updated data
     * @returns {Promise<number>} Affected rows
     */
    static async update(id, data) {
        const fields = [];
        const params = [];

        const allowedFields = ['name', 'type', 'subject', 'html_content', 'description', 'variables', 'category', 'is_active'];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                params.push(field === 'variables' ? JSON.stringify(data[field]) : data[field]);
            }
        }

        if (fields.length === 0) return 0;

        params.push(id);

        const [result] = await query(
            `UPDATE email_templates SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        return result.affectedRows;
    }

    /**
     * Delete template
     * @param {number} id - Template ID
     * @returns {Promise<number>} Affected rows
     */
    static async delete(id) {
        const [result] = await query(
            'DELETE FROM email_templates WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    /**
     * Get template statistics
     * @returns {Promise<Object>} Stats
     */
    static async getStats() {
        try {
            // Try with type column first
            const [rows] = await query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN type = 'email' THEN 1 ELSE 0 END) as email,
                    SUM(CASE WHEN type = 'sms' THEN 1 ELSE 0 END) as sms,
                    SUM(CASE WHEN type = 'whatsapp' THEN 1 ELSE 0 END) as whatsapp,
                    SUM(CASE WHEN type = 'push' THEN 1 ELSE 0 END) as push,
                    SUM(CASE WHEN category = 'notification' THEN 1 ELSE 0 END) as notification,
                    SUM(CASE WHEN category = 'marketing' THEN 1 ELSE 0 END) as marketing,
                    SUM(CASE WHEN category = 'transactional' THEN 1 ELSE 0 END) as transactional,
                    SUM(CASE WHEN category = 'system' THEN 1 ELSE 0 END) as system
                FROM email_templates
            `);
            return rows[0];
        } catch (error) {
            // Fallback if type column doesn't exist
            console.log('Type column may not exist, using fallback stats query');
            const [rows] = await query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) as email,
                    0 as sms,
                    0 as whatsapp,
                    0 as push,
                    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN category = 'notification' THEN 1 ELSE 0 END) as notification,
                    SUM(CASE WHEN category = 'marketing' THEN 1 ELSE 0 END) as marketing,
                    SUM(CASE WHEN category = 'transactional' THEN 1 ELSE 0 END) as transactional,
                    SUM(CASE WHEN category = 'system' THEN 1 ELSE 0 END) as system
                FROM email_templates
            `);
            return rows[0];
        }
    }

    /**
     * Parse row data (handle JSON fields)
     * @param {Object} row - Database row
     * @returns {Object} Parsed template
     */
    static parseRow(row) {
        if (!row) return null;
        return {
            ...row,
            variables: typeof row.variables === 'string'
                ? JSON.parse(row.variables)
                : row.variables || []
        };
    }
}

module.exports = EmailTemplateModel;
