const { pool } = require('../config/database');

class Blog {
    // Get all blogs (admin view - includes drafts)
    static async getAll() {
        const [rows] = await pool.query(
            `SELECT id, title, slug, excerpt, category, author, image_url, tags, 
                    featured, published, read_time, views, created_at, updated_at
             FROM blogs 
             ORDER BY created_at DESC`
        );
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
        }));
    }

    // Get published blogs only (public view)
    static async getPublished() {
        const [rows] = await pool.query(
            `SELECT id, title, slug, excerpt, category, author, image_url, tags, 
                    featured, read_time, views, created_at
             FROM blogs 
             WHERE published = TRUE
             ORDER BY featured DESC, created_at DESC`
        );
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
        }));
    }

    // Get by ID
    static async getById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM blogs WHERE id = ?`,
            [id]
        );
        if (rows.length === 0) return null;
        const blog = rows[0];
        blog.tags = typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags;
        return blog;
    }

    // Get by slug (public)
    static async getBySlug(slug) {
        const [rows] = await pool.query(
            `SELECT * FROM blogs WHERE slug = ? AND published = TRUE`,
            [slug]
        );
        if (rows.length === 0) return null;
        const blog = rows[0];
        blog.tags = typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags;
        return blog;
    }

    // Create new blog
    static async create(blogData) {
        const {
            title, slug, excerpt, content, category, author,
            image_url, tags, featured = false, published = false, read_time = '5 min read'
        } = blogData;

        const [result] = await pool.query(
            `INSERT INTO blogs (title, slug, excerpt, content, category, author, 
                               image_url, tags, featured, published, read_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, excerpt, content, category, author,
                image_url, JSON.stringify(tags || []), featured, published, read_time]
        );
        return { id: result.insertId, ...blogData };
    }

    // Update blog
    static async update(id, blogData) {
        const {
            title, slug, excerpt, content, category, author,
            image_url, tags, featured, published, read_time
        } = blogData;

        await pool.query(
            `UPDATE blogs SET 
                title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                excerpt = COALESCE(?, excerpt),
                content = COALESCE(?, content),
                category = COALESCE(?, category),
                author = COALESCE(?, author),
                image_url = COALESCE(?, image_url),
                tags = COALESCE(?, tags),
                featured = COALESCE(?, featured),
                published = COALESCE(?, published),
                read_time = COALESCE(?, read_time)
             WHERE id = ?`,
            [title, slug, excerpt, content, category, author,
                image_url, tags ? JSON.stringify(tags) : null, featured, published, read_time, id]
        );
        return this.getById(id);
    }

    // Delete blog
    static async delete(id) {
        const [result] = await pool.query(
            `DELETE FROM blogs WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    // Increment view count
    static async incrementViews(id) {
        await pool.query(
            `UPDATE blogs SET views = views + 1 WHERE id = ?`,
            [id]
        );
    }

    // Get by category
    static async getByCategory(category) {
        const [rows] = await pool.query(
            `SELECT id, title, slug, excerpt, category, author, image_url, tags, 
                    featured, read_time, views, created_at
             FROM blogs 
             WHERE published = TRUE AND category = ?
             ORDER BY created_at DESC`,
            [category]
        );
        return rows.map(row => ({
            ...row,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags
        }));
    }

    // Get categories
    static async getCategories() {
        const [rows] = await pool.query(
            `SELECT DISTINCT category FROM blogs WHERE published = TRUE ORDER BY category`
        );
        return rows.map(row => row.category);
    }
}

module.exports = Blog;
