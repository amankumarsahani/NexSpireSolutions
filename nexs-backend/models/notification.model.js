const { pool } = require('../config/database');

const NotificationModel = {
    create: async (notificationData) => {
        const { userId, type, title, message } = notificationData;
        const query = 'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)';
        const [result] = await pool.execute(query, [userId, type, title, message]);
        return result.insertId;
    },

    findByUserId: async (userId) => {
        const query = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    },

    markAsRead: async (id, userId) => {
        const query = 'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?';
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    },

    markAllAsRead: async (userId) => {
        const query = 'UPDATE notifications SET is_read = TRUE WHERE user_id = ?';
        const [result] = await pool.execute(query, [userId]);
        return result.affectedRows;
    },

    getUnreadCount: async (userId) => {
        const query = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE';
        const [rows] = await pool.execute(query, [userId]);
        return rows[0].count;
    },

    delete: async (id, userId) => {
        const query = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }
};

module.exports = NotificationModel;
