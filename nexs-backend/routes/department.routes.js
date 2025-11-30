const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/department.controller');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get statistics (admin only)
router.get('/stats', isAdmin, DepartmentController.getStats);

// CRUD routes
router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);
router.post('/', isAdmin, DepartmentController.create);
router.put('/:id', isAdmin, DepartmentController.update);
router.delete('/:id', isAdmin, DepartmentController.delete);

module.exports = router;
