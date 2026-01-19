const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimit');

// Public routes
router.post('/signup', authRateLimit, AuthController.signup);
router.post('/signin', authRateLimit, AuthController.signin);

// Protected routes
router.get('/me', auth, AuthController.getMe);
router.put('/profile', auth, AuthController.updateProfile);
router.put('/change-password', auth, AuthController.changePassword);
router.post('/logout', auth, AuthController.logout);

module.exports = router;
