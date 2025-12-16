const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/lead.controller');
const { auth, isAdmin, isSalesOperator } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/stats', LeadController.getStats);
router.post('/bulk-create', isSalesOperator, LeadController.bulkCreate);

// Assignable users - admin only
router.get('/assignable-users', isAdmin, LeadController.getAssignableUsers);

// CRUD - sales operators can access their assigned leads
router.get('/', isSalesOperator, LeadController.getAll);
router.get('/:id', isSalesOperator, LeadController.getById);
router.post('/', isSalesOperator, LeadController.create);
router.put('/:id', isSalesOperator, LeadController.update);
router.delete('/:id', isAdmin, LeadController.delete);

// Comments
router.post('/:id/comments', isSalesOperator, LeadController.addComment);
router.get('/:id/comments', isSalesOperator, LeadController.getComments);

// Notes
router.get('/:id/notes', isSalesOperator, LeadController.getNotes);
router.post('/:id/notes', isSalesOperator, LeadController.createNote);

// Conversion and scoring
router.post('/:id/convert', isSalesOperator, LeadController.convertToClient);
router.put('/:id/score', isSalesOperator, LeadController.updateScore);

// Assignment - admin only
router.patch('/:id/assign', isAdmin, LeadController.assignLead);

module.exports = router;

