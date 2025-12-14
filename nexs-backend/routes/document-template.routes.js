const express = require('express');
const router = express.Router();
const documentTemplateController = require('../controllers/document-template.controller');
const { auth, isAdmin, isSalesOperator } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all templates - sales operators and admin can access
router.get('/', isSalesOperator, documentTemplateController.getAll);

// Get template by ID - sales operators and admin can access
router.get('/:id', isSalesOperator, documentTemplateController.getById);

// Create new template - admin only
router.post('/', isAdmin, documentTemplateController.create);

// Update template - admin only
router.put('/:id', isAdmin, documentTemplateController.update);

// Delete template - admin only
router.delete('/:id', isAdmin, documentTemplateController.delete);

// Preview rendered template - sales operators and admin can access
router.post('/:id/preview', isSalesOperator, documentTemplateController.preview);

// Send document via email - sales operators and admin can access
router.post('/send', isSalesOperator, documentTemplateController.sendDocument);

module.exports = router;
