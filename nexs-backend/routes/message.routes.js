const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/message.controller');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get statistics
router.get('/stats', MessageController.getStats);

// Inbox & Outbox
router.get('/inbox', MessageController.getInbox);
router.get('/outbox', MessageController.getOutbox);
router.get('/unread-count', MessageController.getUnreadCount);

// Conversation with specific user
router.get('/conversation/:userId', MessageController.getConversation);

// Message operations
router.get('/:id', MessageController.getById);
router.post('/', MessageController.send);
router.put('/:id/read', MessageController.markAsRead);
router.put('/read-all', MessageController.markAllAsRead);
router.delete('/:id', MessageController.delete);

module.exports = router;
