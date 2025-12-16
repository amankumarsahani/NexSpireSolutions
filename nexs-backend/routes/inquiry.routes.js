const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller');
const { auth, isAdmin, isSalesOperator } = require('../middleware/auth');

// Public route - create inquiry (for contact form)
router.post('/', inquiryController.createInquiry);

// Protected routes - sales operators and admin can access
router.get('/', auth, isSalesOperator, inquiryController.getAllInquiries);
router.get('/stats', auth, isSalesOperator, inquiryController.getStats);
router.get('/assignable-users', auth, isAdmin, inquiryController.getAssignableUsers);
router.get('/:id', auth, isSalesOperator, inquiryController.getInquiryById);
router.patch('/:id/status', auth, isSalesOperator, inquiryController.updateInquiryStatus);
router.post('/:id/convert-to-lead', auth, isSalesOperator, inquiryController.convertToLead);
router.patch('/:id/assign', auth, isAdmin, inquiryController.assignInquiry);
router.delete('/:id', auth, isAdmin, inquiryController.deleteInquiry);

module.exports = router;

