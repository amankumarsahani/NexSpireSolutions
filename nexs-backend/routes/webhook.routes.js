const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Stripe Webhook
// Handles /webhooks/stripe (standard)
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// Razorpay Webhook
// Handles /webhooks/razorpay
router.post('/razorpay', express.json(), webhookController.handleWebhook);
