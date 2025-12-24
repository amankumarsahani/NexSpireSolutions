const { pool } = require('../config/database');

const DashboardController = {
  async getStats(req, res) {
    try {
      // 1. Get Project Stats (Revenue & Active)
      // Assuming 'projects' table has 'status' and 'budget'/'value'
      // Adjust table/column names based on actual schema if needed. 
      // Based on file list, I saw project.model.js, so 'projects' table likely exists.
      const [projectStats] = await pool.query(`
        SELECT 
          COUNT(*) as totalProjects,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as activeProjects,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedProjects,
          SUM(budget) as totalRevenue 
        FROM projects
      `);

      // 2. Get Lead Stats with Status Breakdown
      const [leadRows] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(estimatedValue) as totalValue,
          status,
          COUNT(status) as count
        FROM leads
        GROUP BY status WITH ROLLUP
      `);

      // Process lead rows to get total and breakdown
      const leadStats = leadRows.reduce((acc, row) => {
        if (!row.status) { // Rollup total
          acc.total = row.total;
          acc.totalValue = row.totalValue;
        } else {
          acc.byStatus[row.status] = row.count;
          if (row.status === 'new') acc.newLeads = row.count;
          if (row.status === 'won') acc.wonLeads = row.count;
          if (row.status === 'qualified') acc.qualified = row.count;
        }
        return acc;
      }, { byStatus: {}, total: 0, totalValue: 0, newLeads: 0, wonLeads: 0, qualified: 0 });

      // 3. Get Inquiry Stats with Status Breakdown
      const [inquiryRows] = await pool.query(`
        SELECT status, COUNT(*) as count FROM inquiries GROUP BY status
      `);

      const inquiryStats = {
        total: 0,
        byStatus: {},
        pendingInquiries: 0
      };

      inquiryRows.forEach(row => {
        inquiryStats.byStatus[row.status] = row.count;
        inquiryStats.total += row.count;
        if (row.status === 'pending') inquiryStats.pendingInquiries = row.count;
      });

      const stats = {
        revenue: projectStats[0].totalRevenue || 0,
        activeProjects: projectStats[0].activeProjects || 0,

        // Lead Stats
        totalLeads: leadStats.total,
        newLeads: leadStats.newLeads,
        wonLeads: leadStats.wonLeads,
        qualifiedLeads: leadStats.qualified,
        leadTotalValue: leadStats.totalValue,
        leadsByStatus: leadStats.byStatus,

        // Inquiry Stats
        totalInquiries: inquiryStats.total,
        pendingInquiries: inquiryStats.pendingInquiries,
        inquiriesByStatus: inquiryStats.byStatus
      };

      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  },

  async getRecentActivity(req, res) {
    try {
      // Fetch recent leads
      const [recentLeads] = await pool.query(`
        SELECT id, contactName as name, company, status, estimatedValue as value, score 
        FROM leads 
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      res.json({ recentLeads });
    } catch (error) {
      console.error('Dashboard activity error:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  }
};

module.exports = DashboardController;
