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

    async bulkCreate(leadsData) {
        if (!leadsData || leadsData.length === 0) return { count: 0, skipped: 0 };

        // 1. Filter out leads without email or contactName
        const validLeads = leadsData.filter(l => l.email && l.contactName);
        if (validLeads.length === 0) return { count: 0, skipped: leadsData.length };

        // 2. Check for existing emails
        const emails = validLeads.map(l => l.email);
        const [existingRows] = await pool.query(
            'SELECT email FROM leads WHERE email IN (?)',
            [emails]
        );
        const existingEmails = new Set(existingRows.map(r => r.email));

        // 3. Filter valid leads that are NOT in existingEmails
        const newLeads = validLeads.filter(l => !existingEmails.has(l.email));

        if (newLeads.length === 0) {
            return { count: 0, skipped: leadsData.length };
        }

        // 4. Construct Bulk Insert
        const values = [];
        const placeholders = newLeads.map(lead => {
            const { contactName, email, phone, company, leadSource, status = 'new', estimatedValue, notes, assignedTo, score = 0 } = lead;
            values.push(contactName, email, phone, company, leadSource, status, estimatedValue, notes, assignedTo, score);
            return '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        }).join(', ');

        const query = `INSERT INTO leads (contactName, email, phone, company, leadSource, status, estimatedValue, notes, assignedTo, score) VALUES ${placeholders}`;

        const [result] = await pool.query(query, values);

        return {
            count: result.affectedRows,
            skipped: leadsData.length - result.affectedRows
        };
    },

    async findAll(filters = {}) {
        let query = 'SELECT l.*, u.firstName, u.lastName FROM leads l LEFT JOIN users u ON l.assignedTo = u.id WHERE 1=1';
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

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
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
