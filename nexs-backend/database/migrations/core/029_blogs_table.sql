-- Blogs table for dynamic blog management
CREATE TABLE IF NOT EXISTS blogs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Technology',
    author VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    tags JSON,
    featured BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    read_time VARCHAR(50) DEFAULT '5 min read',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_category (category),
    INDEX idx_published (published),
    INDEX idx_featured (featured),
    INDEX idx_created (created_at)
);

-- Seed with initial blog posts (from existing static data)
INSERT INTO blogs (title, slug, excerpt, content, category, author, image_url, tags, featured, published, read_time) VALUES
(
    'Top 10 AI Trends Shaping Business in 2026',
    'ai-trends-2026',
    'Explore the key AI trends shaping the future of global business, from predictive analytics to generative AI, and how to adopt them.',
    '# Top 10 AI Trends Shaping Business in 2026\n\nArtificial Intelligence continues to revolutionize how businesses operate...',
    'Technology',
    'Aman Kumar',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
    '["AI", "Machine Learning", "Business", "Trends"]',
    TRUE,
    TRUE,
    '5 min read'
),
(
    'React Native vs. Flutter: CEO''s Guide for 2026',
    'react-native-vs-flutter',
    'Deciding between React Native and Flutter? We compare performance, developer cost, and time-to-market to help you choose the right stack.',
    '# React Native vs. Flutter: CEO''s Guide for 2026\n\nChoosing the right mobile development framework is crucial...',
    'Mobile',
    'Kshitij Bhardwaj',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    '["React Native", "Flutter", "Mobile Development", "iOS", "Android"]',
    FALSE,
    TRUE,
    '8 min read'
),
(
    'Cost of Building a Custom CRM in 2026',
    'cost-of-custom-crm-2026',
    'How much does it cost to build a custom CRM? We break down the costs for MVPs, mid-sized, and enterprise solutions.',
    '# Cost of Building a Custom CRM in 2026\n\nCustom CRM development costs vary widely based on complexity...',
    'Enterprise',
    'Aman Kumar',
    'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800&q=80',
    '["CRM", "Enterprise", "Cost Analysis", "Software Development"]',
    FALSE,
    TRUE,
    '7 min read'
),
(
    'Migrating Legacy Monoliths to Microservices',
    'monolith-to-microservices',
    'Is your legacy monolith slowing you down? Learn the strategic risks and rewards of migrating to a microservices architecture.',
    '# Migrating Legacy Monoliths to Microservices\n\nModernizing legacy systems is essential for business agility...',
    'Cloud',
    'Aman Kumar',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    '["Microservices", "Cloud", "Architecture", "DevOps"]',
    FALSE,
    TRUE,
    '6 min read'
),
(
    'Why Your Business Needs a Progressive Web App (PWA)',
    'why-business-needs-pwa',
    'PWAs offer the best of mobile and web. Learn how they boost conversion rates, improve SEO, and cut development costs.',
    '# Why Your Business Needs a Progressive Web App (PWA)\n\nProgressive Web Apps combine the best of both worlds...',
    'Web',
    'Kshitij Bhardwaj',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    '["PWA", "Web Development", "Mobile", "SEO"]',
    FALSE,
    TRUE,
    '5 min read'
);
