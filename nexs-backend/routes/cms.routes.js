const express = require('express');
const router = express.Router();
const CmsController = require('../controllers/cms.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes (if needed for fetching menu by storefront)
// router.get('/menu/:mode/public', CmsController.getMenu);

// Protected routes
router.get('/menu/:mode', protect, CmsController.getMenu);
router.post('/menu/:mode', protect, CmsController.addItem);
router.put('/menu/:mode', protect, CmsController.updateMenu);
router.delete('/menu/:mode/:id', protect, CmsController.deleteItem);

module.exports = router;
