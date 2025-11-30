const { pool } = require('../config/database');

const ActivityLogModel = {
    async create(logData) {
        const { userId, action, entityType, entityId, details, ipAddress, userAgent } = logData;

        const [result] = await pool.query(
            `INSERT INTO activity_logs (userId, action, entityType, entityId, details, ipAddress, userAgent) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, entityType, entityId, JSON.stringify(details), ipAddress, userAgent]
        );

        return result.insertId;
    },

    async findAll(filters = {}) {
        let query = `
            SELECT l.*, CONCAT(u.firstName, ' ', u.lastName) as userName, u.email as userEmail
            FROM activity_logs l
            LEFT JOIN users u ON l.userId = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.userId) {
            query += ' AND l.userId = ?';
            params.push(filters.userId);
        }

        if (filters.action) {
            query += ' AND l.action = ?';
            params.push(filters.action);
        }

        if (filters.entityType) {
            query += ' AND l.entityType = ?';
            params.push(filters.entityType);
        }

        if (filters.startDate) {
            query += ' AND l.createdAt >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND l.createdAt <= ?';
            params.push(filters.endDate);
        }

        query += ' ORDER BY l.createdAt DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        } else {
            query += ' LIMIT 100';
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }
};

module.exports = ActivityLogModel;
