const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller');
const { auth, isAdmin } = require('../middleware/auth');

// Public route - create inquiry (for contact form)
router.post('/', inquiryController.createInquiry);

// Protected routes - admin only
router.get('/', auth, isAdmin, inquiryController.getAllInquiries);
router.get('/stats', auth, isAdmin, inquiryController.getStats);
router.get('/:id', auth, isAdmin, inquiryController.getInquiryById);
router.patch('/:id/status', auth, isAdmin, inquiryController.updateInquiryStatus);
router.delete('/:id', auth, isAdmin, inquiryController.deleteInquiry);

module.exports = router;
