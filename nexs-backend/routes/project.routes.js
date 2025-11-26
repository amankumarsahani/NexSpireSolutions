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
router.post('/:id/tasks', auth, ProjectController.createTask);

module.exports = router;
