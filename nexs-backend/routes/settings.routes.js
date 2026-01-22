const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { auth, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/public', settingsController.getPublicSettings);

// All other routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

router.get('/', settingsController.getSettings);
router.post('/', settingsController.updateSettings);
router.post('/test-ai', settingsController.testAIConnection);

module.exports = router;
