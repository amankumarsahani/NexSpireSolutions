const { pool } = require('../config/database');

const MessageModel = {
    // Get all messages for a user (inbox)
    async getInbox(userId) {
        try {
            const [rows] = await pool.query(
                `SELECT m.*, 
                u.firstName as senderFirstName, 
                u.lastName as senderLastName, 
                u.email as senderEmail
                FROM messages m
                JOIN users u ON m.senderId = u.id
                WHERE m.recipientId = ?
                ORDER BY m.createdAt DESC`,
                [userId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Get sent messages (outbox)
    async getOutbox(userId) {
        try {
            const [rows] = await pool.query(
                `SELECT m.*, 
                u.firstName as recipientFirstName, 
                u.lastName as recipientLastName, 
                u.email as recipientEmail
                FROM messages m
                JOIN users u ON m.recipientId = u.id
                WHERE m.senderId = ?
                ORDER BY m.createdAt DESC`,
                [userId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Get unread count
    async getUnreadCount(userId) {
        try {
            const [rows] = await pool.query(
                'SELECT COUNT(*) as count FROM messages WHERE recipientId = ? AND isRead = FALSE',
                [userId]
            );
            return rows[0].count;
        } catch (error) {
            throw error;
        }
    },

    // Get message by ID
    async getById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT m.*, 
                s.firstName as senderFirstName, 
                s.lastName as senderLastName, 
                s.email as senderEmail,
                r.firstName as recipientFirstName, 
                r.lastName as recipientLastName, 
                r.email as recipientEmail
                FROM messages m
                JOIN users s ON m.senderId = s.id
                JOIN users r ON m.recipientId = r.id
                WHERE m.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get conversation between two users
    async getConversation(user1Id, user2Id) {
        try {
            const [rows] = await pool.query(
                `SELECT m.*, 
                u.firstName as senderFirstName, 
                u.lastName as senderLastName
                FROM messages m
                JOIN users u ON m.senderId = u.id
                WHERE (m.senderId = ? AND m.recipientId = ?) 
                OR (m.senderId = ? AND m.recipientId = ?)
                ORDER BY m.createdAt ASC`,
                [user1Id, user2Id, user2Id, user1Id]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Send a message
    async create(messageData) {
        try {
            const {
                senderId,
                recipientId,
                subject,
                message
            } = messageData;

            const [result] = await pool.query(
                `INSERT INTO messages 
                (senderId, recipientId, subject, message) 
                VALUES (?, ?, ?, ?)`,
                [senderId, recipientId, subject, message]
            );

            return await this.getById(result.insertId);
        } catch (error) {
            throw error;
        }
    },

    // Mark message as read
    async markAsRead(id) {
        try {
            await pool.query(
                'UPDATE messages SET isRead = TRUE WHERE id = ?',
                [id]
            );
            return await this.getById(id);
        } catch (error) {
            throw error;
        }
    },

    // Mark all messages as read for a user
    async markAllAsRead(userId) {
        try {
            const [result] = await pool.query(
                'UPDATE messages SET isRead = TRUE WHERE recipientId = ? AND isRead = FALSE',
                [userId]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    },

    // Delete message
    async delete(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM messages WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Get message statistics
    async getStats(userId) {
        try {
            const [totalReceived] = await pool.query(
                'SELECT COUNT(*) as count FROM messages WHERE recipientId = ?',
                [userId]
            );

            const [totalSent] = await pool.query(
                'SELECT COUNT(*) as count FROM messages WHERE senderId = ?',
                [userId]
            );

            const [unreadCount] = await pool.query(
                'SELECT COUNT(*) as count FROM messages WHERE recipientId = ? AND isRead = FALSE',
                [userId]
            );

            const [recentMessages] = await pool.query(
                `SELECT m.*, 
                u.firstName as senderFirstName, 
                u.lastName as senderLastName
                FROM messages m
                JOIN users u ON m.senderId = u.id
                WHERE m.recipientId = ?
                ORDER BY m.createdAt DESC
                LIMIT 5`,
                [userId]
            );

            return {
                totalReceived: totalReceived[0].count,
                totalSent: totalSent[0].count,
                unread: unreadCount[0].count,
                recentMessages
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = MessageModel;
