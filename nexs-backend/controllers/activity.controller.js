const ActivityModel = require('../models/activity.model');

class ActivityController {
    static async create(req, res) {
        try {
            const { entityType, entityId, type, summary, details } = req.body;
            const performedBy = req.user.id; // From auth middleware

            if (!entityType || !entityId || !type) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const activityId = await ActivityModel.create({
                entityType,
                entityId,
                type,
                summary,
                details,
                performedBy
            });

            res.status(201).json({ success: true, message: 'Activity logged', id: activityId });
        } catch (error) {
            console.error('Create activity error:', error);
            res.status(500).json({ success: false, message: 'Failed to log activity' });
        }
    }

    static async getByEntity(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const activities = await ActivityModel.getByEntity(entityType, entityId);
            res.json({ success: true, data: activities });
        } catch (error) {
            console.error('Get activities error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch activities' });
        }
    }
}

module.exports = ActivityController;
