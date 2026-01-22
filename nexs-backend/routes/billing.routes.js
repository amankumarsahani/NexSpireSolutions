const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { auth, isAdmin } = require('../middleware/auth');

// All billing routes require admin authentication
router.use(auth);
router.use(isAdmin);

// Subscription management
router.post('/subscriptions', billingController.createSubscription);
router.get('/subscriptions/:tenantId', billingController.getSubscription);
router.post('/subscriptions/:tenantId/cancel', billingController.cancelSubscription);
router.post('/subscriptions/:tenantId/pause', billingController.pauseSubscription);
router.post('/subscriptions/:tenantId/resume', billingController.resumeSubscription);

// Payment history
router.get('/payments/:tenantId', billingController.getPaymentHistory);

// Billing stats
router.post('/payment-link', billingController.createPaymentLink); // New endpoint to generate Stripe payment link

module.exports = router;
