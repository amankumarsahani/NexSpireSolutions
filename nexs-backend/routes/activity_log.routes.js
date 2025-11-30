const express = require('express');
const router = express.Router();
const ActivityLogController = require('../controllers/activity_log.controller');
const { auth, isAdmin } = require('../middleware/auth');

router.use(auth);
router.use(isAdmin); // Only admins can view logs

router.get('/', ActivityLogController.getAll);

module.exports = router;
