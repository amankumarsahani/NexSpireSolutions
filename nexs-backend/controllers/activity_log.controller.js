const ActivityLogModel = require('../models/activity_log.model');

const ActivityLogController = {
    async getAll(req, res) {
        try {
            const logs = await ActivityLogModel.findAll(req.query);
            res.json({ logs });
        } catch (error) {
            console.error('Get activity logs error:', error);
            res.status(500).json({ error: 'Failed to fetch activity logs' });
        }
    },

    // Helper to log activity from other controllers
    async logActivity(req, action, entityType, entityId, details = {}) {
        try {
            await ActivityLogModel.create({
                userId: req.user ? req.user.id : null,
                action,
                entityType,
                entityId,
                details,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (error) {
            console.error('Failed to create activity log:', error);
            // Don't throw, logging failure shouldn't block main action
        }
    }
};

module.exports = ActivityLogController;
