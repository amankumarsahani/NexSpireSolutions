const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/blog.controller');
const { auth, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, BlogController.getAll);
router.get('/slug/:slug', BlogController.getBySlug);

// Admin routes (protected)
router.get('/:id', auth, BlogController.getById);
router.post('/', auth, BlogController.create);
router.put('/:id', auth, BlogController.update);
router.delete('/:id', auth, BlogController.delete);

module.exports = router;
