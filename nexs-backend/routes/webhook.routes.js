const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Stripe Webhook
// Handles /webhooks/stripe (standard)
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// Razorpay Webhook
// Handles /webhooks/razorpay
router.post('/razorpay', express.json(), webhookController.handleWebhook);

// WhatsApp Cloud API (Meta) — single webhook for every tenant's number.
// GET = Meta's one-time subscription verification handshake.
// POST = inbound message delivery, routed to the owning tenant via whatsapp_phone_registry.
router.get('/whatsapp-meta', webhookController.verifyWhatsAppMetaWebhook);
router.post('/whatsapp-meta', express.raw({ type: 'application/json' }), webhookController.handleWhatsAppMetaWebhook);

// Meta Lead Ads — single webhook for every tenant's Facebook Pages.
// GET = Meta's subscription verification handshake.
// POST = new lead delivery, routed to the owning tenant via meta_page_registry.
router.get('/meta-leads', webhookController.verifyMetaLeadsWebhook);
router.post('/meta-leads', express.raw({ type: 'application/json' }), webhookController.handleMetaLeadsWebhook);

module.exports = router;
