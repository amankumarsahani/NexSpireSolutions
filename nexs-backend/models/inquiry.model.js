const db = require('../config/database');

class InquiryModel {
    // Get all inquiries with pagination
    static async findAll(page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const [rows] = await db.query(
            'SELECT * FROM inquiries ORDER BY createdAt DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return rows;
    }

    // Get inquiry by ID
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM inquiries WHERE id = ?', [id]);
        return rows[0];
    }

    // Create new inquiry
    static async create(inquiryData) {
        const { name, email, phone, company, message } = inquiryData;
        const [result] = await db.query(
            'INSERT INTO inquiries (name, email, phone, company, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, company || null, message]
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
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolvedCount
            FROM inquiries
        `);
        return stats[0];
    }
}

module.exports = InquiryModel;
