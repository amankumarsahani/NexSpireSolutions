const db = require('../config/database');

const SEOAudit = {
    // Create new SEO audit
    create: async (auditData) => {
        const query = `
            INSERT INTO seo_audits (
                client_id, url, seo_score,
                title, title_length, meta_description, meta_description_length, meta_keywords,
                h1_count, h1_tags, h2_count, h3_count,
                total_images, images_without_alt,
                internal_links, external_links, broken_links,
                page_size_kb, load_time_ms,
                has_ssl, is_mobile_friendly, has_robots_txt, has_sitemap,
                issues, recommendations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            auditData.client_id || null,
            auditData.url,
            auditData.seo_score,
            auditData.title,
            auditData.title_length,
            auditData.meta_description,
            auditData.meta_description_length,
            auditData.meta_keywords,
            auditData.h1_count,
            JSON.stringify(auditData.h1_tags || []),
            auditData.h2_count,
            auditData.h3_count,
            auditData.total_images,
            auditData.images_without_alt,
            auditData.internal_links,
            auditData.external_links,
            auditData.broken_links,
            auditData.page_size_kb,
            auditData.load_time_ms,
            auditData.has_ssl,
            auditData.is_mobile_friendly,
            auditData.has_robots_txt,
            auditData.has_sitemap,
            JSON.stringify(auditData.issues || []),
            JSON.stringify(auditData.recommendations || [])
        ];

        const [result] = await db.query(query, values);
        return { id: result.insertId, ...auditData };
    },

    // Get all audits for a client
    getByClientId: async (clientId) => {
        const query = `
            SELECT * FROM seo_audits 
            WHERE client_id = ? 
            ORDER BY created_at DESC
        `;

        const [results] = await db.query(query, [clientId]);

        return results.map(audit => ({
            ...audit,
            h1_tags: JSON.parse(audit.h1_tags || '[]'),
            issues: JSON.parse(audit.issues || '[]'),
            recommendations: JSON.parse(audit.recommendations || '[]')
        }));
    },

    // Get audit by ID
    getById: async (id) => {
        const query = 'SELECT * FROM seo_audits WHERE id = ?';

        const [results] = await db.query(query, [id]);

        if (results.length === 0) {
            return null;
        }

        return {
            ...results[0],
            h1_tags: JSON.parse(results[0].h1_tags || '[]'),
            issues: JSON.parse(results[0].issues || '[]'),
            recommendations: JSON.parse(results[0].recommendations || '[]')
        };
    },

    // Get all audits for a specific URL
    getByUrl: async (url) => {
        const query = `
            SELECT * FROM seo_audits 
            WHERE url = ? 
            ORDER BY created_at DESC
        `;

        const [results] = await db.query(query, [url]);

        return results.map(audit => ({
            ...audit,
            h1_tags: JSON.parse(audit.h1_tags || '[]'),
            issues: JSON.parse(audit.issues || '[]'),
            recommendations: JSON.parse(audit.recommendations || '[]')
        }));
    },

    // Get all audits
    getAll: async () => {
        const query = `
            SELECT sa.*, c.companyName as client_name
            FROM seo_audits sa
            LEFT JOIN clients c ON sa.client_id = c.id
            ORDER BY sa.created_at DESC
        `;

        const [results] = await db.query(query, []);

        return results.map(audit => ({
            ...audit,
            h1_tags: JSON.parse(audit.h1_tags || '[]'),
            issues: JSON.parse(audit.issues || '[]'),
            recommendations: JSON.parse(audit.recommendations || '[]')
        }));
    },

    // Delete audit
    delete: async (id) => {
        const query = 'DELETE FROM seo_audits WHERE id = ?';

        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = SEOAudit;
