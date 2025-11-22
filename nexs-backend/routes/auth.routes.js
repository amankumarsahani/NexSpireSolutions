const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/signup', AuthController.signup);
router.post('/signin', AuthController.signin);

// Protected routes
router.get('/me', auth, AuthController.getMe);
router.post('/logout', auth, AuthController.logout);

module.exports = router;
