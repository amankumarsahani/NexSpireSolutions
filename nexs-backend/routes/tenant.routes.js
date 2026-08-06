const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

// Stats
router.get('/stats', tenantController.getStats);

// Public lookup (for frontend API discovery) - might be made public later
router.get('/lookup/:slug', tenantController.getTenantBySlug);

// CRUD
router.get('/', tenantController.getAllTenants);
router.get('/:id', tenantController.getTenant);
router.post('/', tenantController.createTenant);
router.patch('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

// PM2 Logs
router.get('/:id/logs', tenantController.getLogs);

// AI consumption and rating feedback for one tenant. Admin-side because the
// spend is ours until AI is billed — a tenant has no use for it.
router.get('/:id/ai-usage', tenantController.getAiUsage);
router.get('/:id/ai-insights', tenantController.getAiInsights);
router.post('/:id/ai-insights/:insightId/rate', tenantController.rateAiInsight);

// Full Delete (removes all resources)
router.delete('/:id/full-delete', tenantController.fullDeleteTenant);

// Custom Domain Setup
router.post('/:id/custom-domain', tenantController.setupCustomDomain);

// DNS Repair (fixes Cloudflare Error 1014 — re-attaches Pages custom domains and waits for active)
router.post('/:id/repair-dns', tenantController.repairDns);

// Database Migration (runs core + industry migrations for this tenant's DB)
router.post('/:id/migrate', tenantController.runMigration);

// Process Management
router.post('/:id/provision', tenantController.provisionTenant);
router.post('/:id/start', tenantController.startTenant);
router.post('/:id/stop', tenantController.stopTenant);
router.post('/:id/restart', tenantController.restartTenant);

// Trial Management
router.post('/:id/end-trial', tenantController.endTrialAndRequestPayment);

// Payment Management
router.post('/:id/send-payment-link', tenantController.sendPaymentLink);
router.post('/:id/send-billing-invoice', tenantController.sendBillingInvoice);
router.post('/:id/mark-paid', tenantController.markPaid);

// Agreement
router.post('/:id/send-agreement', tenantController.sendAgreement);

module.exports = router;

