const { pool } = require('../config/database');

const ProjectModel = {
    async create(projectData) {
        const { clientId, name, description, status = 'planning', budget, startDate, endDate, progress = 0, priority = 'medium', createdBy } = projectData;

        const [result] = await pool.query(
            `INSERT INTO projects (clientId, name, description, status, budget, startDate, endDate, progress, priority, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientId, name, description, status, budget, startDate, endDate, progress, priority, createdBy]
        );

        return result.insertId;
    },

    async findAll(filters = {}) {
        let query = `
      SELECT p.*, c.companyName as clientName 
      FROM projects p 
      LEFT JOIN clients c ON p.clientId = c.id 
      WHERE 1=1
    `;
        const params = [];

        if (filters.status) {
            query += ' AND p.status = ?';
            params.push(filters.status);
        }

        if (filters.clientId) {
            query += ' AND p.clientId = ?';
            params.push(filters.clientId);
        }

        if (filters.search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY p.createdAt DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await pool.query(`
      SELECT p.*, c.companyName as clientName 
      FROM projects p 
      LEFT JOIN clients c ON p.clientId = c.id 
      WHERE p.id = ?
    `, [id]);
        return rows[0];
    },

    async update(id, projectData) {
        const { clientId, name, description, status, budget, startDate, endDate, progress, priority } = projectData;

        await pool.query(
            `UPDATE projects SET clientId = ?, name = ?, description = ?, status = ?, 
       budget = ?, startDate = ?, endDate = ?, progress = ?, priority = ? WHERE id = ?`,
            [clientId, name, description, status, budget, startDate, endDate, progress, priority, id]
        );

        return this.findById(id);
    },

    async delete(id) {
        await pool.query('DELETE FROM projects WHERE id = ?', [id]);
        return true;
    },

    async getStats() {
        const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(budget) as totalBudget,
        AVG(progress) as avgProgress
      FROM projects
    `);

        return stats[0];
        return stats[0];
    },

    async getTasksByProjectId(projectId) {
        const [rows] = await pool.query(
            'SELECT * FROM tasks WHERE projectId = ? ORDER BY createdAt DESC',
            [projectId]
        );
        return rows;
    },

    async getDocumentsByProjectId(projectId) {
        const [rows] = await pool.query(
            'SELECT * FROM documents WHERE projectId = ? ORDER BY createdAt DESC',
            [projectId]
        );
        return rows;
    },

    async createTask(taskData) {
        const {
            projectId,
            title,
            description,
            status = 'todo',
            priority = 'medium',
            assignedTo = null,
            dueDate = null
        } = taskData;

        const [result] = await pool.query(
            `INSERT INTO tasks (projectId, title, description, status, priority, assignedTo, dueDate)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [projectId, title, description, status, priority, assignedTo, dueDate]
        );

        const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        return rows[0];
    },

    async updateTask(taskId, taskData) {
        const fields = [];
        const values = [];
        const allowed = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate'];

        allowed.forEach((field) => {
            if (taskData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(taskData[field]);
            }
        });

        if (!fields.length) {
            return null;
        }

        values.push(taskId);
        await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);

        const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        return rows[0];
    },

    async deleteTask(taskId) {
        const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
        return result.affectedRows > 0;
    }
};

module.exports = ProjectModel;
