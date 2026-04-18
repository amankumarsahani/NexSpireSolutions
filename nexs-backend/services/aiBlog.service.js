/**
 * AI Blog Service
 * Handles AI-powered blog content generation with Unsplash images
 * For NexSpire Solutions Admin Panel
 */

const axios = require('axios');
const AIService = require('./ai.service');
const db = require('../config/database');
const BlogModel = require('../models/blog.model');
const SEOIndexingService = require('./seoIndexing.service');

// Diverse fallback images for when Unsplash is unavailable
const FALLBACK_IMAGES = [
    { url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=630&fit=crop', credit: 'Andrew Neel' },
    { url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=630&fit=crop', credit: 'Luca Bravo' },
    { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop', credit: 'Alexandre Debiève' },
    { url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=630&fit=crop', credit: 'Ilya Pavlov' },
    { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=630&fit=crop', credit: 'Headway' },
    { url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=630&fit=crop', credit: 'Annie Spratt' },
    { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop', credit: 'Marvin Meyer' },
    { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop', credit: 'Carlos Muza' },
    { url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=630&fit=crop', credit: 'Campaign Creators' },
    { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop', credit: 'Annie Spratt' },
    { url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=630&fit=crop', credit: 'Adi Goldstein' },
    { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=630&fit=crop', credit: 'Austin Distel' },
];

// Writing style variations to prevent repetitive content
const WRITING_STYLES = [
    { format: 'listicle', tone: 'conversational', instruction: 'Write as a numbered listicle. Be direct and opinionated about each point. Share what actually works based on experience.' },
    { format: 'case-study', tone: 'analytical', instruction: 'Write as a case study. Tell a real story with specific details, numbers, and what went wrong before things worked. Be honest about failures too.' },
    { format: 'how-to-guide', tone: 'friendly-expert', instruction: 'Write as a practical guide from someone who has done this many times. Skip the theory — give step-by-step instructions with tips from experience.' },
    { format: 'opinion-piece', tone: 'candid', instruction: 'Write as an opinion piece. Take a strong stance. Disagree with popular advice if needed. Back your opinion with evidence but do not be afraid to be direct.' },
    { format: 'deep-dive', tone: 'thorough', instruction: 'Write as a detailed exploration. Cover angles others miss. Explain the "why" behind things, not just the "what". Be the expert friend explaining over coffee.' },
    { format: 'storytelling', tone: 'narrative', instruction: 'Write using storytelling. Start with a real scenario someone would face. Weave the teaching points through the narrative. Make the reader feel like they are reading a story, not a textbook.' },
    { format: 'comparison', tone: 'balanced', instruction: 'Write as an honest comparison. Do not sit on the fence — give your actual recommendation at the end. Acknowledge tradeoffs openly.' },
    { format: 'lessons-learned', tone: 'reflective', instruction: 'Write as lessons learned from real experience. Share mistakes, surprises, and what you would do differently. Be vulnerable and honest.' },
];

// Hook variations for topic generation
const TOPIC_ANGLES = [
    'a specific case study with real numbers',
    'a contrarian take that challenges common wisdom',
    'a practical step-by-step tutorial',
    'a comparison between two popular approaches',
    'mistakes and lessons learned from failures',
    'a beginner-friendly explainer with analogies',
    'an expert interview or roundup format',
    'emerging trends that most people haven\'t noticed yet',
    'a behind-the-scenes look at how something actually works',
    'a data-driven analysis with statistics and benchmarks',
];

class AIBlogService {
    constructor() {
        this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || null;
        this.defaultModel = 'llama-3.3-70b-versatile';
        this._usedFallbackIndex = 0;
    }

    async getExistingTitles(limit = 30) {
        try {
            const [rows] = await db.query(
                'SELECT title FROM blogs ORDER BY created_at DESC LIMIT ?',
                [limit]
            );
            return rows.map(r => r.title);
        } catch (e) {
            return [];
        }
    }

    async getExistingBlogLinks(limit = 15) {
        try {
            const [rows] = await db.query(
                "SELECT title, slug FROM blogs WHERE status = 'published' ORDER BY created_at DESC LIMIT ?",
                [limit]
            );
            return rows.map(r => ({ title: r.title, url: `/blog/${r.slug}` }));
        } catch (e) {
            return [];
        }
    }

    /**
     * Generate a blog topic using AI
     * @param {string} niche - Blog niche/category
     * @param {string} customPrompt - Optional custom prompt
     * @param {string} model - Optional AI model to use
     * @returns {Promise<{topic: string, keywords: string[], imageQuery: string, outline: string[]}>}
     */
    async pickTopic(niche, customPrompt = null, model = null) {
        const existingTitles = await this.getExistingTitles();
        const angle = TOPIC_ANGLES[Math.floor(Math.random() * TOPIC_ANGLES.length)];
        const randomSeed = Math.random().toString(36).substring(2, 8);

        let avoidSection = '';
        if (existingTitles.length > 0) {
            avoidSection = `
CRITICAL — DO NOT repeat these existing topics (or anything similar):
${existingTitles.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

Your topic MUST be distinctly different from ALL of the above.`;
        }

        const defaultPrompt = `You are a senior content strategist at a digital agency. Generate a blog topic for the "${niche}" niche that sounds like it was pitched by a human writer, not generated by AI.

Angle for this article: ${angle}
Uniqueness seed: ${randomSeed}
${avoidSection}

STRICT RULES:
- NEVER use the ampersand character. Write "and" instead.
- NEVER use generic AI-sounding titles like "The Future of X", "How X is Transforming Y", "Revolutionizing", "Unlocking", "Unleashing", "The Power of", "A Deep Dive", "A Comprehensive Guide", "Everything You Need to Know".
- The title should sound like something a real journalist or blogger would write. Think blog post titles you would actually click on.
- Focus on: specific stories, practical advice, honest opinions, real numbers, or surprising findings.

Return your response as JSON in this exact format:
{
    "topic": "A natural, human-sounding blog title without ampersands",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "imageQuery": "specific 2-4 word visual scene description",
    "outline": ["Section 1 title", "Section 2 title", "Section 3 title", "Section 4 title"]
}

Requirements:
- Topic: SEO-friendly but reads like a human wrote it. Use "and" never the ampersand symbol.
- Keywords: 4-5 diverse long-tail keywords
- Image query: describe the actual scene (e.g., "person coding laptop" not "technology")
- Outline: 4-6 sections with specific, descriptive titles. No "Introduction" or "Conclusion".

Return ONLY the JSON, no markdown or explanation.`;

        const prompt = customPrompt || defaultPrompt;
        const useModel = model || this.defaultModel;
        const response = await AIService.generateContent(prompt,
            `You are a JSON-only response bot. Write titles that sound human, not AI-generated. Never use the ampersand symbol — always write "and". Seed: ${randomSeed}`,
            useModel
        );

        try {
            let cleaned = response.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
            }
            const parsed = JSON.parse(cleaned);
            parsed.topic = (parsed.topic || '').replace(/&/g, 'and').replace(/\u2014/g, ',').replace(/\u2013/g, '-');
            return parsed;
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
     * @param {object} config - Blog config (wordCount, tone, model)
     * @returns {Promise<{title: string, excerpt: string, content: string, imageQuery: string}>}
     */
    async writeBlog(topicData, config = {}) {
        const { topic, keywords = [], outline = [], imageQuery } = topicData;
        const { wordCount = 1000, tone = null, model = null } = config;

        const style = WRITING_STYLES[Math.floor(Math.random() * WRITING_STYLES.length)];
        const effectiveTone = tone || style.tone;
        const randomSeed = Math.random().toString(36).substring(2, 8);

        const existingLinks = await this.getExistingBlogLinks();
        let internalLinkSection = '';
        if (existingLinks.length > 0) {
            internalLinkSection = `
INTERNAL LINKING: Naturally link to 2-3 of these existing articles where relevant (use HTML anchor tags):
${existingLinks.map(l => `- "${l.title}" -> ${l.url}`).join('\n')}
Only link where it makes contextual sense. Do not force links.`;
        }

        const prompt = `Write a blog article about: "${topic}"

WRITING STYLE: ${style.format.toUpperCase()}
${style.instruction}

YOUR VOICE: Write like a real person sharing their knowledge, not like an AI generating content. Imagine you are a ${effectiveTone} blogger who has personal experience with this topic. Use first person occasionally ("I have seen", "in my experience", "we found that"). Be opinionated. Have a point of view.

BANNED WORDS AND PHRASES (NEVER USE THESE):
- The ampersand symbol — always write "and" instead
- The em dash character (—) — use a comma, period, or colon instead
- "In today's fast-paced world" or "In the ever-evolving landscape" or "In the digital age"
- "Game-changer", "game changer"
- "Leverage", "leveraging"
- "Dive in", "dive deep", "deep dive", "let's dive"
- "Unlock", "unlocking", "unleash", "unleashing"
- "Revolutionize", "revolutionizing", "transforming"
- "Comprehensive guide", "ultimate guide"
- "It's worth noting", "It's important to note"
- "Navigating the complexities"
- "Robust", "seamless", "cutting-edge", "state-of-the-art"
- "Harness the power", "the power of"
- "Look no further"
- "At the end of the day"
- "Without further ado"
- "In conclusion"

Guidelines:
- Word count: approximately ${wordCount} words
- Tone: ${effectiveTone}
- Keywords to weave in naturally: ${keywords.join(', ')}
- Follow this outline: ${outline.join(' > ')}

Content Rules:
- **Opening**: ${this._getRandomOpening()} Get to the point fast. No throat-clearing.
- **Body**:
    - Short paragraphs, 2-4 sentences each. Real blogs do not have long paragraphs.
    - Use <strong> sparingly — only for genuinely important terms, max 2-3 per section.
    - Include 2 or more lists (<ul> or <ol>) but keep list items concise.
    - Use <h2> for main sections, <h3> for subsections.
    - Back up claims with specific examples, numbers, or named references.
    - Vary sentence length. Mix short punchy sentences with longer explanatory ones.
    - ${this._getRandomContentDirective()}
- **Closing**: Give one concrete next step the reader can take. No fluff.

Technical Constraints:
- Return ONLY HTML body content (no <html>, <head>, <body> tags).
- Do NOT include the H1 title.
- Use HTML tags (<strong>, <h2>, <em>, <blockquote>), NOT markdown.
- CRITICAL: <p> tags for ALL paragraphs. No <br> for spacing.
- Proper heading hierarchy: <h2> then <h3>.
- NEVER use the ampersand character anywhere in the output. Write "and" instead.
${internalLinkSection}`;

        const useModel = model || this.defaultModel;
        const content = await AIService.generateContent(prompt,
            `You are a human blogger, not an AI. Write like you are talking to a friend who is interested in this topic. Use casual transitions, personal opinions, and real-world references. Never use the ampersand symbol — write "and" instead. Avoid every word on the banned list. Seed: ${randomSeed}`,
            useModel
        );

        let cleanContent = content.trim();
        if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/```html?\n?/g, '').replace(/```$/g, '').trim();
        }
        // Strip ampersands that slip through — preserve HTML entities like &amp; &lt; &gt; &nbsp;
        cleanContent = cleanContent.replace(/&(?!amp;|lt;|gt;|nbsp;|quot;|#\d+;|#x[0-9a-fA-F]+;)/g, 'and');
        cleanContent = cleanContent.replace(/\u2014/g, ',').replace(/\u2013/g, '-');

        const excerptMatch = cleanContent.match(/<p>(.*?)<\/p>/);
        const excerpt = excerptMatch
            ? excerptMatch[1].replace(/<[^>]+>/g, '').substring(0, 160) + '...'
            : topic.substring(0, 160);

        let metaDescription = '';
        let tags = [];
        let imageAlt = '';
        try {
            const metaPrompt = `Given this blog title and excerpt, generate:
1. A meta description (max 155 chars) optimized for Google search results. Make it compelling to click. Do NOT use ampersands.
2. 5-8 tags (single words or short phrases) for content categorization.
3. An image alt text (max 120 chars) describing a photo that would fit this article.

Title: "${topic}"
Excerpt: "${excerpt}"
Keywords: ${keywords.join(', ')}

Return ONLY JSON:
{"metaDescription": "...", "tags": ["tag1", "tag2"], "imageAlt": "..."}`;

            const metaResponse = await AIService.generateContent(metaPrompt,
                'You are a JSON-only SEO specialist. Never use ampersands. Return only valid JSON.',
                useModel
            );

            let metaCleaned = metaResponse.trim();
            if (metaCleaned.startsWith('```')) {
                metaCleaned = metaCleaned.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
            }
            const metaParsed = JSON.parse(metaCleaned);
            metaDescription = (metaParsed.metaDescription || '').replace(/&/g, 'and').substring(0, 155);
            tags = metaParsed.tags || [];
            imageAlt = (metaParsed.imageAlt || '').replace(/&/g, 'and').substring(0, 120);
        } catch (e) {
            metaDescription = excerpt.substring(0, 155);
            tags = keywords.slice(0, 5);
            imageAlt = `Illustration for ${topic}`.substring(0, 120);
        }

        return {
            title: topic,
            excerpt,
            metaDescription,
            tags,
            imageAlt,
            content: cleanContent,
            imageQuery: imageQuery || keywords[0] || topic.split(' ').slice(0, 3).join(' ')
        };
    }

    /**
     * Get a random opening style directive
     */
    _getRandomOpening() {
        const openings = [
            'Start with a surprising statistic or data point.',
            'Open with a short real-world anecdote or scenario.',
            'Begin with a bold, provocative statement or question.',
            'Start by describing a common problem your reader faces right now.',
            'Open with a "what if" hypothetical that hooks curiosity.',
            'Begin with a brief quote from an industry expert.',
            'Start with a counterintuitive fact that challenges assumptions.',
            'Open by painting a vivid before/after picture.',
        ];
        return openings[Math.floor(Math.random() * openings.length)];
    }

    /**
     * Get a random content directive for variety
     */
    _getRandomContentDirective() {
        const directives = [
            'Include a "Pro Tip" or "Expert Insight" callout using <blockquote>.',
            'Add a brief comparison table or pros/cons list.',
            'Include a "Common Mistake" warning section.',
            'Add a quick-reference checklist near the end.',
            'Include a "By the Numbers" section with 3-4 relevant statistics.',
            'Add a "Real Example" sidebar using <blockquote> with a case study.',
            'Include a "Quick Win" section with something the reader can do in 5 minutes.',
            'Add a "Myth vs Reality" comparison for one common misconception.',
        ];
        return directives[Math.floor(Math.random() * directives.length)];
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
            console.warn('[AIBlogService] No Unsplash API key configured, using random fallback');
            return this._getRandomFallbackImage();
        }

        try {
            // Fetch multiple results and pick randomly for variety
            const randomPage = Math.floor(Math.random() * 5) + 1;
            const response = await axios.get('https://api.unsplash.com/search/photos', {
                params: {
                    query,
                    per_page: 15,
                    page: randomPage,
                    orientation: 'landscape',
                    content_filter: 'high'
                },
                headers: { 'Authorization': `Client-ID ${key}` },
                timeout: 10000
            });

            const results = response.data.results || [];
            if (results.length > 0) {
                // Pick a random photo from results
                const photo = results[Math.floor(Math.random() * results.length)];
                return {
                    url: photo.urls.regular,
                    credit: photo.user.name,
                    link: photo.links.html
                };
            }

            // If specific query returns nothing, try a broader query
            const fallbackQuery = query.split(' ')[0];
            if (fallbackQuery !== query) {
                const fallbackResponse = await axios.get('https://api.unsplash.com/search/photos', {
                    params: { query: fallbackQuery, per_page: 10, orientation: 'landscape' },
                    headers: { 'Authorization': `Client-ID ${key}` },
                    timeout: 10000
                });
                const fallbackResults = fallbackResponse.data.results || [];
                if (fallbackResults.length > 0) {
                    const photo = fallbackResults[Math.floor(Math.random() * fallbackResults.length)];
                    return {
                        url: photo.urls.regular,
                        credit: photo.user.name,
                        link: photo.links.html
                    };
                }
            }

            return this._getRandomFallbackImage();
        } catch (error) {
            console.error('[AIBlogService] Unsplash fetch error:', error.message);
            return this._getRandomFallbackImage();
        }
    }

    /**
     * Get a random fallback image (never the same one twice in a row)
     */
    _getRandomFallbackImage() {
        let index;
        do {
            index = Math.floor(Math.random() * FALLBACK_IMAGES.length);
        } while (index === this._usedFallbackIndex && FALLBACK_IMAGES.length > 1);
        this._usedFallbackIndex = index;

        const img = FALLBACK_IMAGES[index];
        return {
            url: img.url,
            credit: img.credit,
            link: 'https://unsplash.com'
        };
    }

    /**
     * Create URL-safe slug from title with unique suffix
     */
    slugify(title) {
        const baseSlug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);

        const suffix = Date.now().toString(36);
        return `${baseSlug}-${suffix}`;
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
        const { title, excerpt, content, image, category, author, status,
                metaDescription, tags, imageAlt } = blogData;

        const slug = this.slugify(title);
        const readTime = this.calculateReadTime(content);

        try {
            const resultId = await BlogModel.create({
                title,
                slug,
                excerpt,
                meta_description: metaDescription || '',
                content,
                image_url: image || '',
                og_image: image || '',
                image_alt: imageAlt || '',
                category: category || 'General',
                author: author || 'Content Writer',
                status: status || 'draft',
                read_time: readTime,
                featured: false,
                keywords: blogData.keywords || [],
                tags: tags || []
            });

            console.log(`[AIBlogService] Blog created: ${title} (ID: ${resultId})`);

            if (status === 'published' || status === 'draft') {
                SEOIndexingService.notifyBlogPublished(slug).catch(() => {});
            }

            return { id: resultId, slug, title };
        } catch (error) {
            console.error('[AIBlogService] Post blog error:', error.message);
            throw new Error(`Failed to post blog: ${error.message}`);
        }
    }
}

module.exports = new AIBlogService();
