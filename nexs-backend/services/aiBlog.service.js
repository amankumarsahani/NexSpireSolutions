/**
 * AI Blog Service
 * Handles AI-powered blog content generation with Unsplash images
 * For NexSpire Solutions Admin Panel
 */

const axios = require('axios');
const AIService = require('./ai.service');
const db = require('../config/database');

class AIBlogService {
    constructor() {
        this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || null;
        // Use Groq (Llama) by default to avoid Gemini rate limits
        this.defaultModel = 'llama-3.3-70b-versatile';
    }

    /**
     * Generate a blog topic using AI
     * @param {string} niche - Blog niche/category
     * @param {string} customPrompt - Optional custom prompt
     * @returns {Promise<{topic: string, keywords: string[], imageQuery: string, outline: string[]}>}
     */
    async pickTopic(niche, customPrompt = null) {
        const defaultPrompt = `You are a professional content strategist. Generate a unique, engaging blog topic for the "${niche}" niche.

Return your response as JSON in this exact format:
{
    "topic": "The full blog title",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "imageQuery": "2-3 word search query for finding a relevant header image",
    "outline": ["Section 1 title", "Section 2 title", "Section 3 title"]
}

Requirements:
- Topic should be SEO-friendly and engaging
- Keywords should be relevant for search optimization
- Image query should be generic enough to find good stock photos
- Outline should have 3-5 sections

Return ONLY the JSON, no markdown or explanation.`;

        const prompt = customPrompt || defaultPrompt;
        const response = await AIService.generateContent(prompt, 'You are a JSON-only response bot.', this.defaultModel);

        try {
            let cleaned = response.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
            }
            return JSON.parse(cleaned);
        } catch (e) {
            return {
                topic: response.substring(0, 100),
                keywords: [niche],
                imageQuery: niche,
                outline: ['Introduction', 'Main Content', 'Conclusion']
            };
        }
    }

    /**
     * Generate full blog content using AI
     * @param {object} topicData - Data from pickTopic
     * @param {object} config - Blog config (wordCount, tone)
     * @returns {Promise<{title: string, excerpt: string, content: string, imageQuery: string}>}
     */
    async writeBlog(topicData, config = {}) {
        const { topic, keywords = [], outline = [], imageQuery } = topicData;
        const { wordCount = 1000, tone = 'professional' } = config;

        const prompt = `Write a complete blog article about: "${topic}"

Guidelines:
- Word count: approximately ${wordCount} words
- Tone: ${tone}
- Keywords to include naturally: ${keywords.join(', ')}
- Follow this outline: ${outline.join(', ')}

Format requirements:
- Start with an engaging introduction
- Use proper HTML formatting (h2, h3, p, ul, li tags)
- Include a compelling conclusion with a call-to-action
- Do NOT include the main title (h1) - just the content

Return ONLY the HTML content, no markdown code blocks.`;

        const content = await AIService.generateContent(prompt,
            'You are a professional blog writer. Return clean HTML content only, no markdown formatting.', this.defaultModel);

        let cleanContent = content.trim();
        if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/```html?\n?/g, '').replace(/```$/g, '').trim();
        }

        const excerptMatch = cleanContent.match(/<p>(.*?)<\/p>/);
        const excerpt = excerptMatch
            ? excerptMatch[1].replace(/<[^>]+>/g, '').substring(0, 160) + '...'
            : topic.substring(0, 160);

        return {
            title: topic,
            excerpt,
            content: cleanContent,
            imageQuery: imageQuery || keywords[0] || topic.split(' ').slice(0, 2).join(' ')
        };
    }

    /**
     * Fetch a relevant image from Unsplash
     * @param {string} query - Search query
     * @param {string} accessKey - Optional Unsplash access key
     * @returns {Promise<{url: string, credit: string, link: string}>}
     */
    async fetchUnsplashImage(query, accessKey = null) {
        const key = accessKey || this.unsplashAccessKey || process.env.UNSPLASH_ACCESS_KEY;

        if (!key) {
            console.warn('[AIBlogService] No Unsplash API key configured, using placeholder');
            return {
                url: `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop`,
                credit: 'Unsplash',
                link: 'https://unsplash.com'
            };
        }

        try {
            const response = await axios.get('https://api.unsplash.com/search/photos', {
                params: { query, per_page: 1, orientation: 'landscape' },
                headers: { 'Authorization': `Client-ID ${key}` }
            });

            if (response.data.results && response.data.results.length > 0) {
                const photo = response.data.results[0];
                return {
                    url: photo.urls.regular,
                    credit: photo.user.name,
                    link: photo.links.html
                };
            }

            return {
                url: `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop`,
                credit: 'Unsplash',
                link: 'https://unsplash.com'
            };
        } catch (error) {
            console.error('[AIBlogService] Unsplash fetch error:', error.message);
            return {
                url: `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop`,
                credit: 'Unsplash',
                link: 'https://unsplash.com'
            };
        }
    }

    /**
     * Create URL-safe slug from title
     */
    slugify(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 60);
    }

    /**
     * Calculate estimated read time
     */
    calculateReadTime(content) {
        const text = content.replace(/<[^>]+>/g, '');
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    }

    /**
     * Post blog to NexSpire Solutions database
     * @param {object} blogData - Complete blog data
     * @returns {Promise<object>} Created blog
     */
    async postBlog(blogData) {
        const { title, excerpt, content, image, category, author, status } = blogData;

        const slug = this.slugify(title);
        const readTime = this.calculateReadTime(content);

        try {
            const [result] = await db.query(
                `INSERT INTO blogs (title, slug, excerpt, content, image, category, author, status, read_time, featured)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, slug, excerpt, content, image || '', category || 'General', author || 'AI Writer', status || 'draft', readTime, false]
            );

            console.log(`[AIBlogService] Blog created: ${title} (ID: ${result.insertId})`);
            return { id: result.insertId, slug, title };
        } catch (error) {
            console.error('[AIBlogService] Post blog error:', error.message);
            throw new Error(`Failed to post blog: ${error.message}`);
        }
    }
}

module.exports = new AIBlogService();
