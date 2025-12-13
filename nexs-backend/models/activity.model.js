const pool = require('../config/database');

class ActivityModel {
    static async create(activityData) {
        const { entityType, entityId, type, summary, details, performedBy } = activityData;
        const query = `
      INSERT INTO activities (entityType, entityId, type, summary, details, performedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const [result] = await pool.execute(query, [entityType, entityId, type, summary, details, performedBy]);
        return result.insertId;
    }

    static async getByEntity(entityType, entityId) {
        const query = `
      SELECT a.*, u.firstName, u.lastName 
      FROM activities a
      LEFT JOIN users u ON a.performedBy = u.id
      WHERE a.entityType = ? AND a.entityId = ?
      ORDER BY a.createdAt DESC
    `;
        const [rows] = await pool.execute(query, [entityType, entityId]);
        return rows;
    }

    static async delete(id) {
        const query = 'DELETE FROM activities WHERE id = ?';
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows;
    }
}

module.exports = ActivityModel;
