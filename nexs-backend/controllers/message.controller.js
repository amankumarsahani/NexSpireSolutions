const MessageModel = require('../models/message.model');

const MessageController = {
    // Get inbox messages
    async getInbox(req, res) {
        try {
            const messages = await MessageModel.getInbox(req.user.id);

            res.json({
                success: true,
                count: messages.length,
                data: messages
            });
        } catch (error) {
            console.error('Get inbox error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch inbox',
                error: error.message
            });
        }
    },

    // Get outbox messages
    async getOutbox(req, res) {
        try {
            const messages = await MessageModel.getOutbox(req.user.id);

            res.json({
                success: true,
                count: messages.length,
                data: messages
            });
        } catch (error) {
            console.error('Get outbox error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch outbox',
                error: error.message
            });
        }
    },

    // Get unread count
    async getUnreadCount(req, res) {
        try {
            const count = await MessageModel.getUnreadCount(req.user.id);

            res.json({
                success: true,
                count
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch unread count',
                error: error.message
            });
        }
    },

    // Get message by ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const message = await MessageModel.getById(id);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            // Check if user is sender or recipient
            if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to view this message'
                });
            }

            // Auto-mark as read if recipient is viewing
            if (message.recipientId === req.user.id && !message.isRead) {
                await MessageModel.markAsRead(id);
                message.isRead = true;
            }

            res.json({
                success: true,
                data: message
            });
        } catch (error) {
            console.error('Get message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch message',
                error: error.message
            });
        }
    },

    // Get conversation with another user
    async getConversation(req, res) {
        try {
            const { userId } = req.params;
            const messages = await MessageModel.getConversation(req.user.id, userId);

            res.json({
                success: true,
                count: messages.length,
                data: messages
            });
        } catch (error) {
            console.error('Get conversation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch conversation',
                error: error.message
            });
        }
    },

    // Send a message
    async send(req, res) {
        try {
            const { recipientId, subject, message } = req.body;

            // Validation
            if (!recipientId || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Recipient and message are required'
                });
            }

            // Check if recipient exists
            const [users] = await require('../config/database').query(
                'SELECT id FROM users WHERE id = ?',
                [recipientId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Recipient not found'
                });
            }

            const newMessage = await MessageModel.create({
                senderId: req.user.id,
                recipientId,
                subject: subject || '(No Subject)',
                message
            });

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: newMessage
            });
        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send message',
                error: error.message
            });
        }
    },

    // Mark message as read
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const message = await MessageModel.getById(id);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            // Only recipient can mark as read
            if (message.recipientId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to mark this message'
                });
            }

            const updatedMessage = await MessageModel.markAsRead(id);

            res.json({
                success: true,
                message: 'Message marked as read',
                data: updatedMessage
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark message as read',
                error: error.message
            });
        }
    },

    // Mark all messages as read
    async markAllAsRead(req, res) {
        try {
            const count = await MessageModel.markAllAsRead(req.user.id);

            res.json({
                success: true,
                message: `${count} messages marked as read`,
                count
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark messages as read',
                error: error.message
            });
        }
    },

    // Delete message
    async delete(req, res) {
        try {
            const { id } = req.params;
            const message = await MessageModel.getById(id);

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            // Only sender or recipient can delete
            if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to delete this message'
                });
            }

            const deleted = await MessageModel.delete(id);

            if (deleted) {
                res.json({
                    success: true,
                    message: 'Message deleted successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete message'
                });
            }
        } catch (error) {
            console.error('Delete message error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete message',
                error: error.message
            });
        }
    },

    // Get message statistics
    async getStats(req, res) {
        try {
            const stats = await MessageModel.getStats(req.user.id);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get message stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch message statistics',
                error: error.message
            });
        }
    }
};

module.exports = MessageController;
