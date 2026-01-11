const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const UserModel = {
    // Create new user
    async create(userData) {
        const { email, password, first_name, last_name, phone, role = 'user' } = userData;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO users (email, password, first_name, last_name, phone, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, first_name, last_name, phone, role]
        );

        return result.insertId;
    },

    // Find user by email
    async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    },

    // Find user by ID
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, email, first_name, last_name, phone, role, status, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    // Get all users
    async findAll(filters = {}) {
        let query = 'SELECT id, email, first_name, last_name, phone, role, status, created_at FROM users WHERE 1=1';
        const params = [];

        if (filters.role) {
            query += ' AND role = ?';
            params.push(filters.role);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Update user
    async update(id, userData) {
        const { first_name, last_name, phone, status } = userData;

        await pool.query(
            `UPDATE users SET first_name = ?, last_name = ?, phone = ?, status = ? WHERE id = ?`,
            [first_name, last_name, phone, status, id]
        );

        return this.findById(id);
    },

    // Delete user
    async delete(id) {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return true;
    },

    // Verify password
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
};

module.exports = UserModel;
