const { pool } = require('../config/database');

class DepartmentModel {
    // Get all departments
    static async findAll(page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const [departments] = await pool.query(
            `SELECT d.*, 
                    CONCAT(u.firstName, ' ', u.lastName) as managerName,
                    COUNT(DISTINCT t.id) as teamCount
             FROM departments d
             LEFT JOIN users u ON d.managerId = u.id
             LEFT JOIN teams t ON t.departmentId = d.id
             GROUP BY d.id
             ORDER BY d.createdAt DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return departments;
    }

    static async findById(id) {
        const [departments] = await pool.query(
            `SELECT d.*, 
                    CONCAT(u.firstName, ' ', u.lastName) as managerName,
                    u.email as managerEmail,
                    COUNT(DISTINCT t.id) as teamCount
             FROM departments d
             LEFT JOIN users u ON d.managerId = u.id
             LEFT JOIN teams t ON t.departmentId = d.id
             WHERE d.id = ?
             GROUP BY d.id`,
            [id]
        );
        return departments[0];
    }

    // Create new department
    static async create(data) {
        const { name, description, managerId, budget } = data;
        const [result] = await pool.query(
            'INSERT INTO departments (name, description, managerId, budget) VALUES (?, ?, ?, ?)',
            [name, description, managerId, budget]
        );
        return result.insertId;
    }

    // Update department
    static async update(id, data) {
        const { name, description, managerId, budget } = data;
        const [result] = await pool.query(
            'UPDATE departments SET name = ?, description = ?, managerId = ?, budget = ? WHERE id = ?',
            [name, description, managerId, budget, id]
        );
        return result.affectedRows;
    }

    // Delete department
    static async delete(id) {
        const [result] = await pool.query('DELETE FROM departments WHERE id = ?', [id]);
        return result.affectedRows;
    }

    // Get department statistics
    static async getStats() {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(DISTINCT d.id) as total,
                COUNT(DISTINCT CASE WHEN d.budget > 0 THEN d.id END) as withBudget,
                SUM(d.budget) as totalBudget,
                COUNT(DISTINCT t.id) as totalTeams,
                COUNT(DISTINCT tm.userId) as totalMembers
            FROM departments d
            LEFT JOIN teams t ON t.departmentId = d.id
            LEFT JOIN team_members tm ON tm.teamId = t.id
        `);
        return stats[0];
    }

    // Get teams by department
    static async getTeamsByDepartment(departmentId) {
        const [teams] = await pool.query(
            `SELECT t.*, 
                    COUNT(DISTINCT tm.userId) as memberCount,
                    COUNT(DISTINCT p.id) as projectCount
             FROM teams t
             LEFT JOIN team_members tm ON tm.teamId = t.id
             LEFT JOIN projects p ON p.teamId = t.id
             WHERE t.departmentId = ?
             GROUP BY t.id
             ORDER BY t.name`,
            [departmentId]
        );
        return teams;
    }
}

module.exports = DepartmentModel;
