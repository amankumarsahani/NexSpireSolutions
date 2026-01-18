const { pool } = require('../config/database');

class ActivityModel {
    static async create(activityData) {
        const { entityType, entityId, type, summary, details, performedBy } = activityData;
        const query = `
      INSERT INTO activities (entityType, entityId, type, summary, details, performedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const [result] = await pool.query(query, [entityType, entityId, type, summary, details, performedBy]);
        return result.insertId;
    }

    static async getByEntity(entityType, entityId) {
        const sql = `
      SELECT a.*, u.first_name, u.last_name 
      FROM activities a
      LEFT JOIN users u ON a.performedBy = u.id
      WHERE a.entityType = ? AND a.entityId = ?
      ORDER BY a.createdAt DESC
    `;
        const [rows] = await pool.query(sql, [entityType, entityId]);
        return rows;
    }

    static async delete(id) {
        const sql = 'DELETE FROM activities WHERE id = ?';
        const [result] = await pool.query(sql, [id]);
        return result.affectedRows;
    }
}

module.exports = ActivityModel;

