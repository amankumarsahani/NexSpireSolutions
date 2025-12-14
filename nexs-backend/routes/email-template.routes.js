const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/email-template.controller');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all templates
router.get('/', emailTemplateController.getAllTemplates);

// Get statistics
router.get('/stats', emailTemplateController.getStats);

// Get template by ID
router.get('/:id', emailTemplateController.getTemplateById);

// Create new template
router.post('/', emailTemplateController.createTemplate);

// Preview template
router.post('/:id/preview', emailTemplateController.previewTemplate);

// Update template
router.put('/:id', emailTemplateController.updateTemplate);

// Delete template
router.delete('/:id', emailTemplateController.deleteTemplate);

// Send email
router.post('/send', emailTemplateController.sendEmail);

module.exports = router;

