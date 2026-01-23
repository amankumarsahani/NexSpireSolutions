const { pool } = require('../config/database');

const BlogModel = {
    // Get all published blogs
    async findAll(filters = {}) {
        let query = 'SELECT * FROM blogs WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        } else {
            // Default to published only for public access
            query += ' AND status = "published"';
        }

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }

        if (filters.featured !== undefined) {
            query += ' AND featured = ?';
            params.push(filters.featured);
        }

        if (filters.search) {
            query += ' AND (title LIKE ? OR excerpt LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Get blog by slug (for public view)
    async findBySlug(slug) {
        const [rows] = await pool.query(
            'SELECT * FROM blogs WHERE slug = ? AND status = "published"',
            [slug]
        );
        return rows[0];
    },

    // Get blog by ID (for admin)
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
        return rows[0];
    },

    // Create blog
    async create(blogData) {
        const {
            title,
            slug,
            excerpt,
            content,
            category,
            author,
            image,
            featured = false,
            status = 'draft',
            read_time
        } = blogData;

        const [result] = await pool.query(
            `INSERT INTO blogs (title, slug, excerpt, content, category, author, image, featured, status, read_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, excerpt, content, category, author, image, featured, status, read_time]
        );

        return result.insertId;
    },

    // Update blog
    async update(id, blogData) {
        const allowedFields = ['title', 'slug', 'excerpt', 'content', 'category', 'author', 'image', 'featured', 'status', 'read_time'];
        const updates = [];
        const values = [];

        allowedFields.forEach(field => {
            if (blogData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(blogData[field]);
            }
        });

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id);
        await pool.query(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, values);

        return this.findById(id);
    },

    // Delete blog
    async delete(id) {
        await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
        return true;
    },

    // Get categories
    async getCategories() {
        const [rows] = await pool.query(
            'SELECT DISTINCT category FROM blogs WHERE category IS NOT NULL AND status = "published"'
        );
        return rows.map(r => r.category);
    }
};

module.exports = BlogModel;
