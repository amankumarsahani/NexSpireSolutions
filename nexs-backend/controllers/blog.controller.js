const Blog = require('../models/blog.model');

// Get all published blogs (public)
exports.getPublishedBlogs = async (req, res) => {
    try {
        const { category } = req.query;

        let blogs;
        if (category && category !== 'All') {
            blogs = await Blog.getByCategory(category);
        } else {
            blogs = await Blog.getPublished();
        }

        res.json({
            success: true,
            data: blogs,
            count: blogs.length
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blogs',
            error: error.message
        });
    }
};

// Get single blog by slug (public)
exports.getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const blog = await Blog.getBySlug(slug);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Increment view count
        await Blog.incrementViews(blog.id);

        res.json({
            success: true,
            data: blog
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog',
            error: error.message
        });
    }
};

// Get all blogs including drafts (admin only)
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.getAll();
        res.json({
            success: true,
            data: blogs,
            count: blogs.length
        });
    } catch (error) {
        console.error('Error fetching all blogs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blogs',
            error: error.message
        });
    }
};

// Get blog by ID (admin only)
exports.getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.getById(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        res.json({
            success: true,
            data: blog
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog',
            error: error.message
        });
    }
};

// Create new blog (admin only)
exports.createBlog = async (req, res) => {
    try {
        const { title, slug, excerpt, content, category, author, image_url, tags, featured, published, read_time } = req.body;

        // Validate required fields
        if (!title || !content || !category || !author) {
            return res.status(400).json({
                success: false,
                message: 'Title, content, category, and author are required'
            });
        }

        // Generate slug if not provided
        const finalSlug = slug || title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const blog = await Blog.create({
            title,
            slug: finalSlug,
            excerpt,
            content,
            category,
            author,
            image_url,
            tags,
            featured: featured || false,
            published: published || false,
            read_time: read_time || '5 min read'
        });

        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            data: blog
        });
    } catch (error) {
        console.error('Error creating blog:', error);

        // Handle duplicate slug error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'A blog with this slug already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create blog',
            error: error.message
        });
    }
};

// Update blog (admin only)
exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blogData = req.body;

        // Check if blog exists
        const existingBlog = await Blog.getById(id);
        if (!existingBlog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        const updatedBlog = await Blog.update(id, blogData);

        res.json({
            success: true,
            message: 'Blog updated successfully',
            data: updatedBlog
        });
    } catch (error) {
        console.error('Error updating blog:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'A blog with this slug already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update blog',
            error: error.message
        });
    }
};

// Delete blog (admin only)
exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Blog.delete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        res.json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete blog',
            error: error.message
        });
    }
};

// Get categories (public)
exports.getCategories = async (req, res) => {
    try {
        const categories = await Blog.getCategories();
        res.json({
            success: true,
            data: ['All', ...categories]
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};
