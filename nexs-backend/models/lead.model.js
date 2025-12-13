const { pool } = require('../config/database');

const LeadModel = {
    async create(leadData) {
        const { contactName, email, phone, company, leadSource, status = 'new', estimatedValue, notes, assignedTo, score = 0 } = leadData;

        const [result] = await pool.query(
            `INSERT INTO leads (contactName, email, phone, company, leadSource, status, estimatedValue, notes, assignedTo, score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [contactName, email, phone, company, leadSource, status, estimatedValue, notes, assignedTo, score]
        );

        return result.insertId;
    },

    async findAll(filters = {}) {
        let query = `SELECT l.*, u.firstName as assignedFirstName, u.lastName as assignedLastName, u.email as assignedEmail
                     FROM leads l LEFT JOIN users u ON l.assignedTo = u.id WHERE 1=1`;
        const params = [];

        if (filters.status) {
            query += ' AND l.status = ?';
            params.push(filters.status);
        }

        if (filters.assignedTo) {
            query += ' AND l.assignedTo = ?';
            params.push(filters.assignedTo);
        }

        if (filters.search) {
            query += ' AND (l.contactName LIKE ? OR l.company LIKE ? OR l.email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY l.createdAt DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findByAssignee(userId, filters = {}) {
        let query = `SELECT l.*, u.firstName as assignedFirstName, u.lastName as assignedLastName
                     FROM leads l LEFT JOIN users u ON l.assignedTo = u.id
                     WHERE l.assignedTo = ?`;
        const params = [userId];

        if (filters.status) {
            query += ' AND l.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY l.createdAt DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT l.*, u.firstName as assignedFirstName, u.lastName as assignedLastName
             FROM leads l LEFT JOIN users u ON l.assignedTo = u.id
             WHERE l.id = ?`,
            [id]
        );
        return rows[0];
    },

    async update(id, leadData) {
        // Dynamic update query generation
        const fields = [];
        const values = [];

        // Allowed fields for update
        const allowedFields = ['contactName', 'email', 'phone', 'company', 'leadSource', 'status', 'estimatedValue', 'notes', 'assignedTo', 'score'];

        for (const [key, value] of Object.entries(leadData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;

        await pool.query(query, values);

        return this.findById(id);
    },

    async delete(id) {
        await pool.query('DELETE FROM leads WHERE id = ?', [id]);
        return true;
    },

    async updateAssignee(id, assignedTo) {
        const [result] = await pool.query(
            'UPDATE leads SET assignedTo = ? WHERE id = ?',
            [assignedTo, id]
        );
        return result.affectedRows;
    },

    async getStats() {
        const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newLeads,
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
        SUM(estimatedValue) as totalValue
      FROM leads
    `);

        return stats[0];
    },

    // Get stats for a specific user (their assigned leads only)
    async getStatsByUser(userId) {
        const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newLeads,
        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost,
        SUM(estimatedValue) as totalValue
      FROM leads
      WHERE assignedTo = ?
    `, [userId]);

        return stats[0];
    },

    async addComment(leadId, comment) {
        const [result] = await pool.query(
            'INSERT INTO lead_comments (leadId, comment) VALUES (?, ?)',
            [leadId, comment]
        );
        return { id: result.insertId, leadId, comment, createdAt: new Date() };
    },

    async getComments(leadId) {
        const [rows] = await pool.query(
            'SELECT * FROM lead_comments WHERE leadId = ? ORDER BY createdAt DESC',
            [leadId]
        );
        return rows;
    }
};

module.exports = LeadModel;
