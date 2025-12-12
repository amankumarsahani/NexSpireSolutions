const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/signup', AuthController.signup);
router.post('/signin', AuthController.signin);

// Protected routes
router.get('/me', auth, AuthController.getMe);
router.put('/profile', auth, AuthController.updateProfile);
router.put('/change-password', auth, AuthController.changePassword);
router.post('/logout', auth, AuthController.logout);

module.exports = router;
