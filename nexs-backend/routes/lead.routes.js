const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/lead.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/stats', LeadController.getStats);
router.get('/', LeadController.getAll);
router.get('/:id', LeadController.getById);
router.post('/', LeadController.create);
router.put('/:id', LeadController.update);
router.delete('/:id', LeadController.delete);
router.post('/:id/comments', LeadController.addComment);
router.get('/:id/comments', LeadController.getComments);

// Note routes
router.get('/:id/notes', LeadController.getNotes);
router.post('/:id/notes', LeadController.createNote);

// Conversion routes
router.post('/:id/convert', LeadController.convertToClient);
router.put('/:id/score', LeadController.updateScore);

module.exports = router;
