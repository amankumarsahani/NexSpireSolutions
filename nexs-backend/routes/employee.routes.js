const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employee.controller');
const { auth, isAdmin } = require('../middleware/auth');

router.use(auth);

// Only admins can manage employees
router.get('/', isAdmin, EmployeeController.getAll);
router.get('/:id', isAdmin, EmployeeController.getById);
router.post('/', isAdmin, EmployeeController.create);
router.put('/:id', isAdmin, EmployeeController.update);
router.delete('/:id', isAdmin, EmployeeController.delete);

module.exports = router;
