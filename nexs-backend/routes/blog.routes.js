const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/blog.controller');
const BlogModel = require('../models/blog.model');
const { auth, optionalAuth } = require('../middleware/auth');
const db = require('../config/database');

router.get('/sitemap.xml', async (req, res) => {
    try {
        const siteUrl = process.env.WEBSITE_URL || process.env.FRONTEND_URL || 'https://nexspiresolutions.co.in';

        const [blogs] = await db.query(
            `SELECT slug, updated_at FROM blogs WHERE status = 'published' ORDER BY updated_at DESC`
        );

        const staticPages = [
            { loc: '/', priority: '1.0', changefreq: 'weekly' },
            { loc: '/about', priority: '0.8', changefreq: 'monthly' },
            { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
            { loc: '/services', priority: '0.8', changefreq: 'monthly' },
            { loc: '/services/web-development', priority: '0.7', changefreq: 'monthly' },
            { loc: '/services/app-development', priority: '0.7', changefreq: 'monthly' },
            { loc: '/services/crm-development', priority: '0.7', changefreq: 'monthly' },
            { loc: '/services/digital-marketing', priority: '0.7', changefreq: 'monthly' },
            { loc: '/services/seo-optimization', priority: '0.7', changefreq: 'monthly' },
            { loc: '/portfolio', priority: '0.7', changefreq: 'monthly' },
            { loc: '/blog', priority: '0.8', changefreq: 'daily' },
            { loc: '/nexcrm', priority: '0.8', changefreq: 'monthly' },
            { loc: '/nexcrm/pricing', priority: '0.7', changefreq: 'monthly' },
            { loc: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
            { loc: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
        ];

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const page of staticPages) {
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}${page.loc}</loc>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += `  </url>\n`;
        }

        for (const blog of blogs) {
            const lastmod = blog.updated_at
                ? new Date(blog.updated_at).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}/blog/${blog.slug}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.6</priority>\n`;
            xml += `  </url>\n`;
        }

        xml += '</urlset>';

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
});

router.get('/', optionalAuth, BlogController.getAll);
router.get('/tags', async (req, res) => {
    try {
        const tags = await BlogModel.getAllTags();
        res.json({ success: true, tags });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});
router.get('/slug/:slug', BlogController.getBySlug);

router.get('/:id', auth, BlogController.getById);
router.post('/', auth, BlogController.create);
router.put('/:id', auth, BlogController.update);
router.delete('/:id', auth, BlogController.delete);

module.exports = router;
