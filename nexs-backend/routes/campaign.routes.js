const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { auth } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    }
});

// All routes require authentication
router.use(auth);

// Dashboard stats
router.get('/stats', campaignController.getDashboardStats);

// Get available templates
router.get('/templates', campaignController.getTemplates);

// Parse uploaded email file (CSV/Excel)
router.post('/parse-emails', upload.single('file'), campaignController.parseEmailFile);

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
