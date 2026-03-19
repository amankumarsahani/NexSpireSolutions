const { pool } = require('../config/database');

const ClientModel = {
    // Create new client
    async create(clientData) {
        const {
            companyName, contactName, name, email, phone, website,
            industry, address, company, status = 'active', notes, createdBy, assignedTo
        } = clientData;

        // Map frontend fields to actual DB columns
        // DB has: name, company, assignedTo (not companyName, contactName, createdBy, city, country)
        const dbName = name || contactName || companyName || '';
        const dbCompany = company || companyName || '';

        const [result] = await pool.query(
            `INSERT INTO clients (name, email, phone, company, address, website, industry, 
       status, notes, assignedTo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [dbName, email, phone, dbCompany, address, website, industry, status, notes, assignedTo || createdBy]
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
            query += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Sorting
        const sortBy = filters.sortBy || 'created_at';
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
            query += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ?)';
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
            companyName, contactName, name, email, phone, website,
            industry, address, company, status, notes
        } = clientData;

        // Map frontend fields to actual DB columns
        const dbName = name || contactName || companyName || '';
        const dbCompany = company || companyName || '';

        await pool.query(
            `UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, 
       website = ?, industry = ?, address = ?, status = ?, notes = ? 
       WHERE id = ?`,
            [dbName, email, phone, dbCompany, website, industry, address, status, notes, id]
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
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN status = 'churned' THEN 1 ELSE 0 END) as churned
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
