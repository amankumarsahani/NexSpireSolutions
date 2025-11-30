const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/team.controller');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get statistics
router.get('/stats', TeamController.getStats);

// CRUD routes
router.get('/', TeamController.getAll);
router.get('/:id', TeamController.getById);
router.post('/', TeamController.create);
router.put('/:id', TeamController.update);
router.delete('/:id', TeamController.delete);

module.exports = router;
