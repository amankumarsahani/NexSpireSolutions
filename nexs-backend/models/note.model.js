const pool = require('../config/database');

class Note {
    static async create(noteData) {
        const { leadId, content, category, authorId } = noteData;

        const query = `
            INSERT INTO notes (lead_id, content, category, author_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const values = [leadId, content, category || 'general', authorId];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findByLeadId(leadId) {
        const query = `
            SELECT n.*, u.first_name, u.last_name, u.email as author_email
            FROM notes n
            LEFT JOIN users u ON n.author_id = u.id
            WHERE n.lead_id = $1
            ORDER BY n.created_at DESC
        `;

        const result = await pool.query(query, [leadId]);
        return result.rows;
    }

    static async findById(id) {
        const query = `
            SELECT n.*, u.first_name, u.last_name
            FROM notes n
            LEFT JOIN users u ON n.author_id = u.id
            WHERE n.id = $1
        `;

        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async update(id, content) {
        const query = `
            UPDATE notes
            SET content = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [content, id]);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM notes WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = Note;
