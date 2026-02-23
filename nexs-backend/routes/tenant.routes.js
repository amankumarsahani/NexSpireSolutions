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

// Full Delete (removes all resources)
router.delete('/:id/full-delete', tenantController.fullDeleteTenant);

// Custom Domain Setup
router.post('/:id/custom-domain', tenantController.setupCustomDomain);

// Process Management
router.post('/:id/provision', tenantController.provisionTenant);
router.post('/:id/start', tenantController.startTenant);
router.post('/:id/stop', tenantController.stopTenant);
router.post('/:id/restart', tenantController.restartTenant);

// Trial Management
router.post('/:id/end-trial', tenantController.endTrialAndRequestPayment);

module.exports = router;

