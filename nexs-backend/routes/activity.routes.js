const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity.controller');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/', ActivityController.create);
router.get('/:entityType/:entityId', ActivityController.getByEntity);

module.exports = router;
