const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const UserModel = {
    // Create new user
    async create(userData) {
        const { email, password, firstName, lastName, phone, role = 'user', position, departmentId, joinDate, salary, address, emergencyContact, notes } = userData;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO users (email, password, firstName, lastName, phone, role, position, departmentId, joinDate, salary, address, emergencyContact, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, firstName, lastName, phone, role, position, departmentId, joinDate, salary, address, emergencyContact, notes]
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
            `SELECT u.*, d.name as departmentName 
             FROM users u 
             LEFT JOIN departments d ON u.departmentId = d.id 
             WHERE u.id = ?`,
            [id]
        );
        return rows[0];
    },

    // Get all users
    async findAll(filters = {}) {
        let query = `
            SELECT u.id, u.email, u.firstName, u.lastName, u.phone, u.role, u.status, u.position, u.departmentId, u.joinDate, d.name as departmentName, u.createdAt 
            FROM users u 
            LEFT JOIN departments d ON u.departmentId = d.id 
            WHERE 1=1
        `;
        const params = [];

        if (filters.role) {
            query += ' AND role = ?';
            params.push(filters.role);
        }

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY createdAt DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Update user
    async update(id, userData) {
        const { firstName, lastName, phone, status, position, departmentId, joinDate, salary, address, emergencyContact, notes } = userData;

        await pool.query(
            `UPDATE users SET firstName = ?, lastName = ?, phone = ?, status = ?, position = ?, departmentId = ?, joinDate = ?, salary = ?, address = ?, emergencyContact = ?, notes = ? WHERE id = ?`,
            [firstName, lastName, phone, status, position, departmentId, joinDate, salary, address, emergencyContact, notes, id]
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
