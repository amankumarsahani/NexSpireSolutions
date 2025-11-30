const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const AnalyticsController = require('../controllers/analytics.controller');

router.use(auth);

router.get('/dashboard', AnalyticsController.getDashboard);

module.exports = router;
