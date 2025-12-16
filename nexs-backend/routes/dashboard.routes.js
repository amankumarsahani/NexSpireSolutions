const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { auth } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(auth);

router.get('/stats', DashboardController.getStats);
router.get('/recent', DashboardController.getRecentActivity);

module.exports = router;
