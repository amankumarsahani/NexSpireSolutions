const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/client.controller');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get statistics
router.get('/stats', ClientController.getStats);

// CRUD routes
router.get('/', ClientController.getAll);
router.get('/:id', ClientController.getById);
router.get('/:id/payments', ClientController.getPayments);
router.get('/:id/activities', ClientController.getActivities);
router.post('/', ClientController.create);
router.put('/:id', ClientController.update);
router.delete('/:id', ClientController.delete);

module.exports = router;
