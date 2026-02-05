const { pool } = require('../config/database');

const BlogModel = {
    // Get all published blogs
    async findAll(filters = {}) {
        let query = 'SELECT * FROM blogs WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND published = ?';
            // Map 'published' -> 1, others (draft) -> 0
            params.push(filters.status === 'published' ? 1 : 0);
        } else {
            // Default to published only for public access if not specified
            query += ' AND published = 1';
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
        return rows.map(r => this._mapRow(r));
    },

    // Get blog by slug (for public view)
    async findBySlug(slug) {
        const [rows] = await pool.query(
            'SELECT * FROM blogs WHERE slug = ? AND published = 1',
            [slug]
        );
        return this._mapRow(rows[0]);
    },

    // Helper to map DB row to frontend object
    _mapRow(row) {
        if (!row) return null;
        return {
            ...row,
            image: row.image_url,
            status: row.published ? 'published' : 'draft',
            // keywords is usually parsed by mysql2 if column type is JSON, but generic fallback:
            keywords: typeof row.keywords === 'string' ? JSON.parse(row.keywords || '[]') : (row.keywords || [])
        };
    },



    // Get blog by ID (for admin)
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
        return this._mapRow(rows[0]);
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
            read_time,
            keywords = []
        } = blogData;

        // Map frontend/service fields to DB columns
        // status: 'published' -> published: true (1)
        const isPublished = status === 'published';
        const keywordsJson = JSON.stringify(keywords);

        const [result] = await pool.query(
            `INSERT INTO blogs 
            (title, slug, excerpt, content, category, author, image_url, featured, published, read_time, keywords)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                slug,
                excerpt,
                content,
                category,
                author,
                image,           // Maps to image_url
                featured,
                isPublished,     // Maps to published
                read_time,
                keywordsJson
            ]
        );

        return result.insertId;
    },

    // Update blog
    async update(id, blogData) {
        const updates = [];
        const values = [];

        // Field mapping configuration
        const fieldMap = {
            'title': 'title',
            'slug': 'slug',
            'excerpt': 'excerpt',
            'content': 'content',
            'category': 'category',
            'author': 'author',
            'image': 'image_url', // Map image -> image_url
            'featured': 'featured',
            'read_time': 'read_time'
        };

        // Handle standard fields
        Object.keys(fieldMap).forEach(key => {
            if (blogData[key] !== undefined) {
                updates.push(`${fieldMap[key]} = ?`);
                values.push(blogData[key]);
            }
        });

        // Handle special fields
        if (blogData.status !== undefined) {
            updates.push('published = ?');
            values.push(blogData.status === 'published');
        }

        if (blogData.keywords !== undefined) {
            updates.push('keywords = ?');
            values.push(JSON.stringify(blogData.keywords));
        }

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
            'SELECT DISTINCT category FROM blogs WHERE category IS NOT NULL AND published = 1'
        );
        return rows.map(r => r.category);
    }
};

module.exports = BlogModel;
