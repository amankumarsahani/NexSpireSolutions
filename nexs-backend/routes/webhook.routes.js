const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Razorpay webhook - no auth required (uses signature verification)
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

module.exports = router;
