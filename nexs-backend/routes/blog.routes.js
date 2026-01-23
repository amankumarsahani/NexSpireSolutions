const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const { auth } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// GET /api/blogs - Get all published blogs
router.get('/', blogController.getPublishedBlogs);

// GET /api/blogs/categories - Get all categories
router.get('/categories', blogController.getCategories);

// GET /api/blogs/slug/:slug - Get single blog by slug
router.get('/slug/:slug', blogController.getBlogBySlug);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// GET /api/blogs/admin/all - Get all blogs including drafts (admin)
router.get('/admin/all', auth, blogController.getAllBlogs);

// GET /api/blogs/admin/:id - Get blog by ID (admin)
router.get('/admin/:id', auth, blogController.getBlogById);

// POST /api/blogs - Create new blog (admin)
router.post('/', auth, blogController.createBlog);

// PUT /api/blogs/:id - Update blog (admin)
router.put('/:id', auth, blogController.updateBlog);

// DELETE /api/blogs/:id - Delete blog (admin)
router.delete('/:id', auth, blogController.deleteBlog);

module.exports = router;

