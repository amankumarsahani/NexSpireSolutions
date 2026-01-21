const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

router.get('/', settingsController.getSettings);
router.post('/', settingsController.updateSettings);
router.post('/test-ai', settingsController.testAIConnection);

module.exports = router;
