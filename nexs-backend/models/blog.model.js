const { pool } = require('../config/database');

const BlogModel = {
    // Get all published blogs
    async findAll(filters = {}) {
        let query = 'SELECT * FROM blogs WHERE 1=1';
        const params = [];

        if (filters.status && filters.status !== 'all') {
            query += ' AND status = ?';
            params.push(filters.status);
        } else if (!filters.status) {
            // Default to published only for public access if not specified
            query += " AND status = 'published'";
        }
        // 'all' = no status filter (admin sees everything)

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

        const limit = parseInt(filters.limit) || 10;
        const page = parseInt(filters.page) || 1;
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        return rows.map(r => this._mapRow(r));
    },

    async count(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM blogs WHERE 1=1';
        const params = [];

        if (filters.status && filters.status !== 'all') {
            query += ' AND status = ?';
            params.push(filters.status);
        } else if (!filters.status) {
            query += " AND status = 'published'";
        }

        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }

        if (filters.search) {
            query += ' AND (title LIKE ? OR excerpt LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    },

    // Get blog by slug (for public view)
    async findBySlug(slug) {
        const [rows] = await pool.query(
            "SELECT * FROM blogs WHERE slug = ? AND status = 'published'",
            [slug]
        );
        return this._mapRow(rows[0]);
    },

    // Helper to map DB row to frontend object
    _mapRow(row) {
        if (!row) return null;
        return {
            ...row,
            keywords: typeof row.keywords === 'string' ? JSON.parse(row.keywords || '[]') : (row.keywords || []),
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || [])
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
            meta_description = '',
            content,
            category,
            author,
            image_url,
            og_image = '',
            image_alt = '',
            featured = false,
            status = 'draft',
            read_time,
            keywords = [],
            tags = []
        } = blogData;

        const keywordsJson = JSON.stringify(keywords);
        const tagsJson = JSON.stringify(tags);

        const [result] = await pool.query(
            `INSERT INTO blogs 
            (title, slug, excerpt, meta_description, content, category, author, image_url, og_image, image_alt, featured, status, read_time, keywords, tags)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                slug,
                excerpt,
                meta_description,
                content,
                category,
                author,
                image_url,
                og_image,
                image_alt,
                featured,
                status,
                read_time,
                keywordsJson,
                tagsJson
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
            'meta_description': 'meta_description',
            'content': 'content',
            'category': 'category',
            'author': 'author',
            'image_url': 'image_url',
            'og_image': 'og_image',
            'image_alt': 'image_alt',
            'featured': 'featured',
            'read_time': 'read_time',
            'status': 'status',
            'view_count': 'view_count'
        };

        // Handle standard fields
        Object.keys(fieldMap).forEach(key => {
            if (blogData[key] !== undefined) {
                updates.push(`${fieldMap[key]} = ?`);
                values.push(blogData[key]);
            }
        });

        // Handle special fields

        if (blogData.keywords !== undefined) {
            updates.push('keywords = ?');
            values.push(JSON.stringify(blogData.keywords));
        }

        if (blogData.tags !== undefined) {
            updates.push('tags = ?');
            values.push(JSON.stringify(blogData.tags));
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
            "SELECT DISTINCT category FROM blogs WHERE category IS NOT NULL AND status = 'published'"
        );
        return rows.map(r => r.category);
    },

    async incrementViewCount(id) {
        await pool.query('UPDATE blogs SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?', [id]);
    },

    async findRelated(blogId, category, keywords = [], limit = 3) {
        const [rows] = await pool.query(
            `SELECT id, title, slug, excerpt, image_url, category, author, read_time, created_at, keywords, tags, view_count
             FROM blogs 
             WHERE id != ? AND status = 'published'
             ORDER BY 
                (category = ?) * 5 +
                COALESCE(view_count, 0) * 0.01
             DESC
             LIMIT ?`,
            [blogId, category, limit + 5]
        );

        if (!keywords || keywords.length === 0) {
            return rows.slice(0, limit).map(r => this._mapRow(r));
        }

        const scored = rows.map(row => {
            const mapped = this._mapRow(row);
            const rowKeywords = [...(mapped.keywords || []), ...(mapped.tags || [])].map(k => k.toLowerCase());
            const queryKeywords = keywords.map(k => k.toLowerCase());
            let overlapScore = 0;
            for (const qk of queryKeywords) {
                for (const rk of rowKeywords) {
                    if (rk.includes(qk) || qk.includes(rk)) {
                        overlapScore += 1;
                    }
                }
            }
            const categoryBonus = mapped.category === category ? 5 : 0;
            return { ...mapped, _score: overlapScore + categoryBonus };
        });

        scored.sort((a, b) => b._score - a._score);
        return scored.slice(0, limit).map(({ _score, ...rest }) => rest);
    },

    async getAllTags() {
        const [rows] = await pool.query(
            "SELECT tags FROM blogs WHERE tags IS NOT NULL AND status = 'published'"
        );
        const tagSet = new Set();
        for (const row of rows) {
            const parsed = typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []);
            parsed.forEach(t => tagSet.add(t));
        }
        return [...tagSet].sort();
    }
};

module.exports = BlogModel;
