const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Razorpay webhook - no auth required (uses signature verification)
router.post('/razorpay', express.json(), webhookController.handleWebhook);

module.exports = router;
