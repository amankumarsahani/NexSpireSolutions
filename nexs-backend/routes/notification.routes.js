const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { auth } = require('../middleware/auth');

router.use(auth); // Protect all notification routes

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/mark-all-read', NotificationController.markAllRead);
router.put('/:id/read', NotificationController.markRead);
router.delete('/:id', NotificationController.delete);

module.exports = router;
