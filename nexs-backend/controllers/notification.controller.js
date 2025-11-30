const NotificationModel = require('../models/notification.model');

const NotificationController = {
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.id;
            const notifications = await NotificationModel.findByUserId(userId);
            res.json({ notifications });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    },

    markRead: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const success = await NotificationModel.markAsRead(id, userId);

            if (!success) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ error: 'Failed to update notification' });
        }
    },

    markAllRead: async (req, res) => {
        try {
            const userId = req.user.id;
            await NotificationModel.markAllAsRead(userId);
            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({ error: 'Failed to update notifications' });
        }
    },

    getUnreadCount: async (req, res) => {
        try {
            const userId = req.user.id;
            const count = await NotificationModel.getUnreadCount(userId);
            res.json({ count });
        } catch (error) {
            console.error('Error fetching unread count:', error);
            res.status(500).json({ error: 'Failed to fetch unread count' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const success = await NotificationModel.delete(id, userId);

            if (!success) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            res.json({ message: 'Notification deleted' });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({ error: 'Failed to delete notification' });
        }
    }
};

module.exports = NotificationController;
