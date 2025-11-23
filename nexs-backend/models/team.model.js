const { pool } = require('../config/database');

const TeamModel = {
    // Get all team members
    async getAll(filters = {}) {
        try {
            let query = 'SELECT * FROM team_members WHERE 1=1';
            const params = [];

            // Apply filters
            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.department) {
                query += ' AND department = ?';
                params.push(filters.department);
            }

            query += ' ORDER BY createdAt DESC';

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Get team member by ID
    async getById(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM team_members WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get team member by email
    async getByEmail(email) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM team_members WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Create new team member
    async create(teamData) {
        try {
            const {
                name,
                email,
                phone,
                position,
                department,
                workload = 0,
                status = 'active',
                joinDate
            } = teamData;

            const [result] = await pool.query(
                `INSERT INTO team_members 
                (name, email, phone, position, department, workload, status, joinDate) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone, position, department, workload, status, joinDate]
            );

            return await this.getById(result.insertId);
        } catch (error) {
            throw error;
        }
    },

    // Update team member
    async update(id, teamData) {
        try {
            const updates = [];
            const values = [];

            // Build dynamic update query
            const allowedFields = ['name', 'email', 'phone', 'position', 'department', 'workload', 'status', 'joinDate'];

            allowedFields.forEach(field => {
                if (teamData[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(teamData[field]);
                }
            });

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(id);

            await pool.query(
                `UPDATE team_members SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            return await this.getById(id);
        } catch (error) {
            throw error;
        }
    },

    // Delete team member
    async delete(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM team_members WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Get team statistics
    async getStats() {
        try {
            const [totalCount] = await pool.query(
                'SELECT COUNT(*) as total FROM team_members'
            );

            const [statusBreakdown] = await pool.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM team_members
                GROUP BY status
            `);

            const [departmentBreakdown] = await pool.query(`
                SELECT 
                    department,
                    COUNT(*) as count,
                    AVG(workload) as avgWorkload
                FROM team_members
                WHERE department IS NOT NULL
                GROUP BY department
                ORDER BY count DESC
            `);

            const [recentMembers] = await pool.query(
                'SELECT * FROM team_members ORDER BY createdAt DESC LIMIT 5'
            );

            return {
                total: totalCount[0].total,
                byStatus: statusBreakdown,
                byDepartment: departmentBreakdown,
                recentMembers
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = TeamModel;
