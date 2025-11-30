const { pool } = require('../config/database');

const AnalyticsController = {
    async getDashboard(req, res) {
        try {
            const [
                [teamRow],
                [clientRow],
                [projectRow],
                [leadRow]
            ] = await Promise.all([
                pool.query('SELECT COUNT(*) AS total FROM team_members'),
                pool.query('SELECT COUNT(*) AS total FROM clients'),
                pool.query(`
                    SELECT 
                        COUNT(*) AS total,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS inProgress,
                        SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) AS planning
                    FROM projects
                `),
                pool.query(`
                    SELECT 
                        COUNT(*) AS total,
                        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS won,
                        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS lost,
                        SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualified
                    FROM leads
                `)
            ]);

            res.json({
                team: teamRow[0] || { total: 0 },
                clients: clientRow[0] || { total: 0 },
                projects: projectRow[0] || { total: 0, completed: 0, inProgress: 0, planning: 0 },
                leads: leadRow[0] || { total: 0, won: 0, lost: 0, qualified: 0 }
            });
        } catch (error) {
            console.error('Analytics error:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
};

module.exports = AnalyticsController;
