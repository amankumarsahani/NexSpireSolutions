const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { auth, isAdmin } = require('../middleware/auth');

// Public routes (for pricing page)
router.get('/', planController.getAllPlans);
router.get('/:id', planController.getPlan);

// Admin only routes
router.use(auth);
router.use(isAdmin);

router.post('/', planController.createPlan);
router.patch('/:id', planController.updatePlan);
router.get('/admin/stats', planController.getStats);

module.exports = router;
