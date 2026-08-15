const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expense.controller');
const { auth, isAdmin } = require('../middleware/auth');

router.use(auth);
router.use(isAdmin);

router.get('/stats', ctrl.getStats);
// People routes must stay above '/:id' or the id param swallows them.
router.get('/people', ctrl.listPeople);
router.post('/people', ctrl.createPerson);
router.delete('/people/:id', ctrl.deletePerson);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
router.post('/bulk-delete', ctrl.bulkDelete);

module.exports = router;
