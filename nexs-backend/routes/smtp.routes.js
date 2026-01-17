const express = require('express');
const router = express.Router();
const smtpController = require('../controllers/smtp.controller');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// SMTP Account CRUD
router.get('/', smtpController.getAllAccounts);
router.get('/:id', smtpController.getAccountById);
router.post('/', smtpController.createAccount);
router.put('/:id', smtpController.updateAccount);
router.delete('/:id', smtpController.deleteAccount);

// Test connection
router.post('/:id/test', smtpController.testConnection);

// Reset counters
router.post('/reset-counters', smtpController.resetCounters);

module.exports = router;
