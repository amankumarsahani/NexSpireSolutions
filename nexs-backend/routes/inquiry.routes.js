const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller');
const { protect, authorize } = require('../middleware/auth');

// Public route - create inquiry (for contact form)
router.post('/', inquiryController.createInquiry);

// Protected routes - admin only
router.get('/', protect, authorize('admin'), inquiryController.getAllInquiries);
router.get('/stats', protect, authorize('admin'), inquiryController.getStats);
router.get('/:id', protect, authorize('admin'), inquiryController.getInquiryById);
router.patch('/:id/status', protect, authorize('admin'), inquiryController.updateInquiryStatus);
router.delete('/:id', protect, authorize('admin'), inquiryController.deleteInquiry);

module.exports = router;
