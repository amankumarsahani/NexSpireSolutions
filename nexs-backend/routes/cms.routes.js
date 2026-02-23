const express = require('express');
const router = express.Router();
const CmsController = require('../controllers/cms.controller');
const { auth } = require('../middleware/auth');

// Public routes (if needed for fetching menu by storefront)
// router.get('/menu/:mode/public', CmsController.getMenu);

// Protected routes
router.get('/menu/:mode', auth, CmsController.getMenu);
router.post('/menu/:mode', auth, CmsController.addItem);
router.put('/menu/:mode', auth, CmsController.updateMenu);
router.delete('/menu/:mode/:id', auth, CmsController.deleteItem);

module.exports = router;
