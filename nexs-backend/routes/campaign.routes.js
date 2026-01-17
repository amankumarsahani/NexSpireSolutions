const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Dashboard stats
router.get('/stats', campaignController.getDashboardStats);

// Get available templates
router.get('/templates', campaignController.getTemplates);

// Campaign CRUD
router.get('/', campaignController.getAllCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.post('/', campaignController.createCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Campaign actions
router.post('/:id/send', campaignController.startCampaign);
router.post('/:id/pause', campaignController.pauseCampaign);
router.post('/:id/resume', campaignController.resumeCampaign);

// Campaign analytics
router.get('/:id/stats', campaignController.getCampaignStats);
router.get('/:id/recipients', campaignController.getCampaignRecipients);

module.exports = router;
