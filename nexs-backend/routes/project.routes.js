const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/project.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/stats', ProjectController.getStats);
router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);
router.post('/', ProjectController.create);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);

// Task routes
router.get('/:id/tasks', ProjectController.getTasks);
router.post('/:id/tasks', ProjectController.createTask);
router.get('/:id/tasks/stats', ProjectController.getTaskStats);
router.put('/:id/tasks/:taskId', ProjectController.updateTask);
router.delete('/:id/tasks/:taskId', ProjectController.deleteTask);

module.exports = router;
