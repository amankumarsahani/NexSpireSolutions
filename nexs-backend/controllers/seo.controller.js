const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const SEOAudit = require('../models/seo.model');

// Main SEO Analysis Controller
const analyzeSite = async (req, res) => {
    const { url, client_id } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const startTime = Date.now();

        // Fetch the website HTML
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000, // 15 second timeout
            maxRedirects: 5
        });

        const html = response.data;
        const loadTime = Date.now() - startTime;
        const pageSize = Buffer.byteLength(html, 'utf8') / 1024; // KB

        // Load HTML into cheerio
        const $ = cheerio.load(html);

        // Extract meta tags
        const metaData = extractMetaTags($);

        // Analyze headings
        const headingData = analyzeHeadings($);

        // Analyze images
        const imageData = analyzeImages($);

        // Analyze links
        const linkData = analyzeLinks($, url);

        // Check technical SEO
        const technicalData = checkTechnicalSEO(url, $, html);

        // Compile all data
        const seoData = {
            url,
            client_id: client_id || null,

            // Meta
            title: metaData.title,
            title_length: metaData.titleLength,
            meta_description: metaData.description,
            meta_description_length: metaData.descriptionLength,
            meta_keywords: metaData.keywords,

            // Headings
            h1_count: headingData.h1Count,
            h1_tags: headingData.h1Tags,
            h2_count: headingData.h2Count,
            h3_count: headingData.h3Count,

            // Images
            total_images: imageData.totalImages,
            images_without_alt: imageData.imagesWithoutAlt,

            // Links
            internal_links: linkData.internalLinks,
            external_links: linkData.externalLinks,
            broken_links: 0, // Will implement broken link checking later

            // Performance
            page_size_kb: Math.round(pageSize),
            load_time_ms: loadTime,

            // Technical
            has_ssl: technicalData.hasSSL,
            is_mobile_friendly: technicalData.isMobileFriendly,
            has_robots_txt: technicalData.hasRobotsTxt,
            has_sitemap: technicalData.hasSitemap,

            issues: [],
            recommendations: []
        };

        // Generate issues and recommendations
        const analysis = generateAnalysis(seoData);
        seoData.issues = analysis.issues;
        seoData.recommendations = analysis.recommendations;

        // Calculate SEO score
        seoData.seo_score = calculateScore(seoData);

        // Save to database
        const savedAudit = await SEOAudit.create(seoData);

        res.json({
            success: true,
            data: savedAudit
        });

    } catch (error) {
        console.error('SEO Analysis Error:', error.message);
        res.status(500).json({
            error: 'Failed to analyze website',
            message: error.message
        });
    }
};

// Extract meta tags
function extractMetaTags($) {
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';

    return {
        title,
        titleLength: title.length,
        description,
        descriptionLength: description.length,
        keywords
    };
}

// Analyze heading structure
function analyzeHeadings($) {
    const h1Tags = [];
    $('h1').each((i, el) => {
        h1Tags.push($(el).text().trim());
    });

    return {
        h1Count: h1Tags.length,
        h1Tags,
        h2Count: $('h2').length,
        h3Count: $('h3').length
    };
}

// Analyze images
function analyzeImages($) {
    const totalImages = $('img').length;
    const imagesWithoutAlt = $('img:not([alt]), img[alt=""]').length;

    return {
        totalImages,
        imagesWithoutAlt
    };
}

// Analyze links
function analyzeLinks($, baseUrl) {
    let internalLinks = 0;
    let externalLinks = 0;

    try {
        const baseHost = new URL(baseUrl).hostname;

        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');

            if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
                internalLinks++;
            } else if (href.startsWith('http')) {
                try {
                    const linkHost = new URL(href).hostname;
                    if (linkHost === baseHost) {
                        internalLinks++;
                    } else {
                        externalLinks++;
                    }
                } catch (e) {
                    // Invalid URL
                }
            }
        });
    } catch (error) {
        console.error('Link analysis error:', error);
    }

    return {
        internalLinks,
        externalLinks
    };
}

// Check technical SEO
function checkTechnicalSEO(url, $, html) {
    const hasSSL = url.startsWith('https://');

    // Check for viewport meta tag (mobile-friendly indicator)
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const isMobileFriendly = hasViewport;

    // Check for robots meta or robots.txt reference
    const hasRobotsMeta = $('meta[name="robots"]').length > 0;
    const hasRobotsTxt = html.includes('robots.txt') || hasRobotsMeta;

    // Check for sitemap reference
    const hasSitemapLink = $('link[rel="sitemap"]').length > 0 ||
        html.toLowerCase().includes('sitemap.xml');

    return {
        hasSSL,
        isMobileFriendly,
        hasRobotsTxt,
        hasSitemap: hasSitemapLink
    };
}

// Generate issues and recommendations
function generateAnalysis(data) {
    const issues = [];
    const recommendations = [];

    // Title analysis
    if (!data.title || data.title_length < 10) {
        issues.push({
            type: 'critical',
            category: 'Meta Tags',
            message: 'Missing or too short title tag',
            impact: 'High'
        });
        recommendations.push({
            priority: 'high',
            category: 'Meta Tags',
            action: 'Add a descriptive title between 50-60 characters',
            example: '<title>Your Page Title - Brand Name</title>'
        });
    } else if (data.title_length < 30) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: 'Title tag is too short',
            impact: 'Medium'
        });
        recommendations.push({
            priority: 'medium',
            category: 'Meta Tags',
            action: 'Expand your title to 50-60 characters for better SEO',
            example: 'Include relevant keywords and your brand name'
        });
    } else if (data.title_length > 70) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: 'Title tag is too long and may be truncated in search results',
            impact: 'Medium'
        });
        recommendations.push({
            priority: 'medium',
            category: 'Meta Tags',
            action: 'Shorten your title to 50-60 characters',
            example: 'Keep it concise and impactful'
        });
    }

    // Meta description analysis
    if (!data.meta_description || data.meta_description_length < 10) {
        issues.push({
            type: 'critical',
            category: 'Meta Tags',
            message: 'Missing meta description',
            impact: 'High'
        });
        recommendations.push({
            priority: 'high',
            category: 'Meta Tags',
            action: 'Add a compelling meta description (150-160 characters)',
            example: '<meta name="description" content="Your page description here">'
        });
    } else if (data.meta_description_length < 120) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: 'Meta description is too short',
            impact: 'Medium'
        });
        recommendations.push({
            priority: 'medium',
            category: 'Meta Tags',
            action: 'Expand your meta description to 150-160 characters',
            example: 'Make it compelling to improve click-through rate'
        });
    } else if (data.meta_description_length > 170) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: 'Meta description is too long',
            impact: 'Low'
        });
    }

    // H1 analysis
    if (data.h1_count === 0) {
        issues.push({
            type: 'critical',
            category: 'Headings',
            message: 'No H1 tag found',
            impact: 'High'
        });
        recommendations.push({
            priority: 'high',
            category: 'Headings',
            action: 'Add exactly one H1 tag to your page',
            example: '<h1>Your Main Page Heading</h1>'
        });
    } else if (data.h1_count > 1) {
        issues.push({
            type: 'warning',
            category: 'Headings',
            message: `Multiple H1 tags found (${data.h1_count})`,
            impact: 'Medium'
        });
        recommendations.push({
            priority: 'medium',
            category: 'Headings',
            action: 'Use only one H1 tag per page',
            example: 'Convert additional H1s to H2 or H3'
        });
    }

    // Image analysis
    if (data.images_without_alt > 0) {
        issues.push({
            type: data.images_without_alt > 5 ? 'warning' : 'info',
            category: 'Images',
            message: `${data.images_without_alt} images missing alt attributes`,
            impact: data.images_without_alt > 5 ? 'Medium' : 'Low'
        });
        recommendations.push({
            priority: data.images_without_alt > 5 ? 'medium' : 'low',
            category: 'Images',
            action: 'Add descriptive alt text to all images',
            example: '<img src="photo.jpg" alt="Descriptive text here">'
        });
    }

    // Technical SEO
    if (!data.has_ssl) {
        issues.push({
            type: 'critical',
            category: 'Technical',
            message: 'Website is not using HTTPS',
            impact: 'High'
        });
        recommendations.push({
            priority: 'high',
            category: 'Technical',
            action: 'Install SSL certificate and enable HTTPS',
            example: 'Use Let\'s Encrypt for free SSL'
        });
    }

    if (!data.is_mobile_friendly) {
        issues.push({
            type: 'warning',
            category: 'Technical',
            message: 'Missing viewport meta tag',
            impact: 'High'
        });
        recommendations.push({
            priority: 'high',
            category: 'Technical',
            action: 'Add viewport meta tag for mobile responsiveness',
            example: '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        });
    }

    // Page size
    if (data.page_size_kb > 1000) {
        issues.push({
            type: 'warning',
            category: 'Performance',
            message: 'Page size is large (>1MB)',
            impact: 'Medium'
        });
        recommendations.push({
            priority: 'medium',
            category: 'Performance',
            action: 'Optimize images and minify CSS/JS to reduce page size',
            example: 'Use image compression tools and CDN'
        });
    }

    // Link structure
    if (data.internal_links < 3) {
        issues.push({
            type: 'info',
            category: 'Links',
            message: 'Low internal linking',
            impact: 'Low'
        });
        recommendations.push({
            priority: 'low',
            category: 'Links',
            action: 'Add more internal links to improve site navigation',
            example: 'Link to related pages and content'
        });
    }

    return { issues, recommendations };
}

// Calculate SEO score (0-100)
function calculateScore(data) {
    let score = 100;

    // Title (max -20 points)
    if (!data.title || data.title_length < 10) score -= 20;
    else if (data.title_length < 30 || data.title_length > 70) score -= 10;

    // Meta description (max -15 points)
    if (!data.meta_description || data.meta_description_length < 10) score -= 15;
    else if (data.meta_description_length < 120 || data.meta_description_length > 170) score -= 8;

    // H1 (max -15 points)
    if (data.h1_count === 0) score -= 15;
    else if (data.h1_count > 1) score -= 10;

    // Images (max -10 points)
    if (data.total_images > 0) {
        const altRatio = 1 - (data.images_without_alt / data.total_images);
        score -= Math.round((1 - altRatio) * 10);
    }

    // SSL (max -20 points)
    if (!data.has_ssl) score -= 20;

    // Mobile-friendly (max -15 points)
    if (!data.is_mobile_friendly) score -= 15;

    // Page size (max -5 points)
    if (data.page_size_kb > 1000) score -= 5;
    else if (data.page_size_kb > 2000) score -= 10;

    return Math.max(0, Math.min(100, score));
}

// Get all audits for a client
const getClientReports = async (req, res) => {
    const { clientId } = req.params;

    try {
        const audits = await SEOAudit.getByClientId(clientId);
        res.json({
            success: true,
            data: audits
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch reports',
            message: error.message
        });
    }
};

// Get specific report
const getReport = async (req, res) => {
    const { id } = req.params;

    try {
        const audit = await SEOAudit.getById(id);

        if (!audit) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({
            success: true,
            data: audit
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch report',
            message: error.message
        });
    }
};

// Get all reports
const getAllReports = async (req, res) => {
    try {
        const audits = await SEOAudit.getAll();
        res.json({
            success: true,
            data: audits
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch reports',
            message: error.message
        });
    }
};

// Delete report
const deleteReport = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await SEOAudit.delete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete report',
            message: error.message
        });
    }
};

module.exports = {
    analyzeSite,
    getClientReports,
    getReport,
    getAllReports,
    deleteReport
};
