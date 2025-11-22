const { pool } = require('../config/database');

const ClientModel = {
    // Create new client
    async create(clientData) {
        const {
            companyName, contactName, email, phone, website,
            industry, address, city, country, status = 'prospect', notes, createdBy
        } = clientData;

        const [result] = await pool.query(
            `INSERT INTO clients (companyName, contactName, email, phone, website, industry, 
       address, city, country, status, notes, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyName, contactName, email, phone, website, industry, address, city, country, status, notes, createdBy]
        );

        return result.insertId;
    },

    // Get all clients with filters and pagination
    async findAll(filters = {}) {
        let query = 'SELECT * FROM clients WHERE 1=1';
        const params = [];

        // Filters
        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.industry) {
            query += ' AND industry = ?';
            params.push(filters.industry);
        }

        if (filters.search) {
            query += ' AND (companyName LIKE ? OR contactName LIKE ? OR email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Sorting
        const sortBy = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'DESC';
        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        // Pagination
        if (filters.limit) {
            const limit = parseInt(filters.limit);
            const offset = filters.page ? (parseInt(filters.page) - 1) * limit : 0;
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Get total count for pagination
    async count(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM clients WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.search) {
            query += ' AND (companyName LIKE ? OR contactName LIKE ? OR email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    },

    // Get client by ID
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
        return rows[0];
    },

    // Update client
    async update(id, clientData) {
        const {
            companyName, contactName, email, phone, website,
            industry, address, city, country, status, notes
        } = clientData;

        await pool.query(
            `UPDATE clients SET companyName = ?, contactName = ?, email = ?, phone = ?, 
       website = ?, industry = ?, address = ?, city = ?, country = ?, status = ?, notes = ? 
       WHERE id = ?`,
            [companyName, contactName, email, phone, website, industry, address, city, country, status, notes, id]
        );

        return this.findById(id);
    },

    // Delete client
    async delete(id) {
        await pool.query('DELETE FROM clients WHERE id = ?', [id]);
        return true;
    },

    // Get statistics
    async getStats() {
        const [statusCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'prospect' THEN 1 ELSE 0 END) as prospects,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM clients
    `);

        const [industryCounts] = await pool.query(`
      SELECT industry, COUNT(*) as count 
      FROM clients 
      WHERE industry IS NOT NULL 
      GROUP BY industry 
      ORDER BY count DESC 
      LIMIT 5
    `);

        return {
            ...statusCounts[0],
            topIndustries: industryCounts
        };
    }
};

module.exports = ClientModel;
