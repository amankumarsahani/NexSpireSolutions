const BlogModel = require('../models/blog.model');

const BlogController = {
    // Get all blogs (public)
    async getAll(req, res) {
        try {
            const filters = {
                category: req.query.category,
                featured: req.query.featured === 'true' ? true : undefined,
                search: req.query.search,
                limit: req.query.limit,
                status: req.user ? req.query.status : 'published' // Admin can see drafts
            };

            const blogs = await BlogModel.findAll(filters);
            const categories = await BlogModel.getCategories();

            res.json({
                success: true,
                blogs,
                categories
            });
        } catch (error) {
            console.error('Get blogs error:', error);
            res.status(500).json({ error: 'Failed to fetch blogs' });
        }
    },

    // Get single blog by slug (public)
    async getBySlug(req, res) {
        try {
            const blog = await BlogModel.findBySlug(req.params.slug);

            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }

            res.json({ success: true, blog });
        } catch (error) {
            console.error('Get blog error:', error);
            res.status(500).json({ error: 'Failed to fetch blog' });
        }
    },

    // Get single blog by ID (admin)
    async getById(req, res) {
        try {
            const blog = await BlogModel.findById(req.params.id);

            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }

            res.json({ success: true, blog });
        } catch (error) {
            console.error('Get blog error:', error);
            res.status(500).json({ error: 'Failed to fetch blog' });
        }
    },

    // Create blog (admin)
    async create(req, res) {
        try {
            const { title, slug, excerpt, content, category, author, image, featured, status, read_time } = req.body;

            if (!title || !slug) {
                return res.status(400).json({ error: 'Title and slug are required' });
            }

            const blogId = await BlogModel.create({
                title,
                slug,
                excerpt,
                content,
                category,
                author,
                image,
                featured,
                status,
                read_time
            });

            const blog = await BlogModel.findById(blogId);

            res.status(201).json({
                success: true,
                message: 'Blog created successfully',
                blog
            });
        } catch (error) {
            console.error('Create blog error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'A blog with this slug already exists' });
            }
            res.status(500).json({ error: 'Failed to create blog' });
        }
    },

    // Update blog (admin)
    async update(req, res) {
        try {
            const blog = await BlogModel.findById(req.params.id);

            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }

            const updatedBlog = await BlogModel.update(req.params.id, req.body);

            res.json({
                success: true,
                message: 'Blog updated successfully',
                blog: updatedBlog
            });
        } catch (error) {
            console.error('Update blog error:', error);
            res.status(500).json({ error: 'Failed to update blog' });
        }
    },

    // Delete blog (admin)
    async delete(req, res) {
        try {
            const blog = await BlogModel.findById(req.params.id);

            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }

            await BlogModel.delete(req.params.id);

            res.json({
                success: true,
                message: 'Blog deleted successfully'
            });
        } catch (error) {
            console.error('Delete blog error:', error);
            res.status(500).json({ error: 'Failed to delete blog' });
        }
    }
};

module.exports = BlogController;
