const express = require('express');
const router = express.Router();
const {
    analyzeSite,
    getClientReports,
    getReport,
    getAllReports,
    deleteReport
} = require('../controllers/seo.controller');

// POST /api/seo/analyze - Run SEO audit on URL
router.post('/analyze', analyzeSite);

// GET /api/seo/reports - Get all reports
router.get('/reports', getAllReports);

// GET /api/seo/reports/:clientId - Get all audits for a specific client
router.get('/reports/:clientId', getClientReports);

// GET /api/seo/report/:id - Get specific audit report
router.get('/report/:id', getReport);

// DELETE /api/seo/report/:id - Delete audit
router.delete('/report/:id', deleteReport);

module.exports = router;
