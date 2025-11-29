const pool = require('../config/database');

class Task {
    static async create(taskData) {
        const { projectId, name, description, assignedTo, dueDate, priority, status } = taskData;

        const query = `
            INSERT INTO tasks (project_id, name, description, assigned_to, due_date, priority, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            projectId,
            name,
            description || null,
            assignedTo || null,
            dueDate || null,
            priority || 'medium',
            status || 'todo'
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findByProjectId(projectId) {
        const query = `
            SELECT t.*, tm.name as assigned_to_name, tm.email as assigned_to_email
            FROM tasks t
            LEFT JOIN team_members tm ON t.assigned_to = tm.id
            WHERE t.project_id = $1
            ORDER BY t.created_at DESC
        `;

        const result = await pool.query(query, [projectId]);
        return result.rows;
    }

    static async findById(id) {
        const query = `
            SELECT t.*, tm.name as assigned_to_name
            FROM tasks t
            LEFT JOIN team_members tm ON t.assigned_to = tm.id
            WHERE t.id = $1
        `;

        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async update(id, taskData) {
        const { name, description, assignedTo, dueDate, priority, status } = taskData;

        const query = `
            UPDATE tasks
            SET name = $1,
                description = $2,
                assigned_to = $3,
                due_date = $4,
                priority = $5,
                status = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `;

        const values = [name, description, assignedTo, dueDate, priority, status, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        const query = 'DELETE FROM tasks WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async getStats(projectId) {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'todo') as todo,
                COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'done') as done
            FROM tasks
            WHERE project_id = $1
        `;

        const result = await pool.query(query, [projectId]);
        return result.rows[0];
    }
}

module.exports = Task;
