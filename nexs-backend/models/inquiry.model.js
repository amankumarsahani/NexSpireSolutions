const db = require('../config/database');

class InquiryModel {
    // Get all inquiries with pagination (includes assigned user info)
    static async findAll(page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const [rows] = await db.query(
            `SELECT i.*, u.firstName as assignedFirstName, u.lastName as assignedLastName, u.email as assignedEmail
             FROM inquiries i
             LEFT JOIN users u ON i.assignedTo = u.id
             ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows;
    }

    // Get inquiries by assignee (for sales operators)
    static async findByAssignee(userId, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const [rows] = await db.query(
            `SELECT i.*, u.firstName as assignedFirstName, u.lastName as assignedLastName
             FROM inquiries i
             LEFT JOIN users u ON i.assignedTo = u.id
             WHERE i.assignedTo = ?
             ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        return rows;
    }

    // Get inquiry by ID
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT i.*, u.firstName as assignedFirstName, u.lastName as assignedLastName
             FROM inquiries i
             LEFT JOIN users u ON i.assignedTo = u.id
             WHERE i.id = ?`,
            [id]
        );
        return rows[0];
    }

    // Create new inquiry with assignment
    static async create(inquiryData) {
        const { name, email, phone, company, message, assignedTo } = inquiryData;
        const [result] = await db.query(
            'INSERT INTO inquiries (name, email, phone, company, message, assignedTo) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone || null, company || null, message, assignedTo || null]
        );
        return result.insertId;
    }

    // Update inquiry status
    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE inquiries SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows;
    }

    // Update inquiry assignee
    static async updateAssignee(id, assignedTo) {
        const [result] = await db.query(
            'UPDATE inquiries SET assignedTo = ? WHERE id = ?',
            [assignedTo, id]
        );
        return result.affectedRows;
    }

    // Delete inquiry
    static async delete(id) {
        const [result] = await db.query('DELETE FROM inquiries WHERE id = ?', [id]);
        return result.affectedRows;
    }

    // Get stats
    static async getStats() {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newCount,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contactedCount,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedCount,
                SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as convertedCount
            FROM inquiries
        `);
        return stats[0];
    }

    // Get stats for a specific user (their assigned inquiries only)
    static async getStatsByUser(userId) {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newCount,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contactedCount,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedCount,
                SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as convertedCount
            FROM inquiries
            WHERE assignedTo = ?
        `, [userId]);
        return stats[0];
    }
}

module.exports = InquiryModel;


