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

module.exports = router;
