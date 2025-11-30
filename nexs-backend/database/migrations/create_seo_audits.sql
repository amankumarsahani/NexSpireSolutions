-- SEO Audits Table
-- Stores on-page SEO analysis results for client websites

CREATE TABLE IF NOT EXISTS seo_audits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NULL,
    url VARCHAR(500) NOT NULL,
    seo_score INT NOT NULL,
    
    -- Meta data
    title VARCHAR(255),
    title_length INT,
    meta_description TEXT,
    meta_description_length INT,
    meta_keywords TEXT,
    
    -- Headings
    h1_count INT,
    h1_tags JSON,
    h2_count INT,
    h3_count INT,
    
    -- Images
    total_images INT,
    images_without_alt INT,
    
    -- Links
    internal_links INT,
    external_links INT,
    broken_links INT,
    
    -- Performance
    page_size_kb INT,
    load_time_ms INT,
    
    -- Technical
    has_ssl BOOLEAN DEFAULT FALSE,
    is_mobile_friendly BOOLEAN DEFAULT FALSE,
    has_robots_txt BOOLEAN DEFAULT FALSE,
    has_sitemap BOOLEAN DEFAULT FALSE,
    
    -- Analysis data
    issues JSON,
    recommendations JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_client_audits ON seo_audits(client_id, created_at DESC);
CREATE INDEX idx_url_audits ON seo_audits(url, created_at DESC);
