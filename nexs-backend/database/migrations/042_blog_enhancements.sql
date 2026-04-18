-- Blog enhancements: meta description, OG image, tags, view count, image alt text

-- Meta description for SEO (AI-generated)
ALTER TABLE blogs ADD COLUMN meta_description VARCHAR(320) DEFAULT NULL AFTER excerpt;

-- OG image (defaults to image_url but can be overridden)
ALTER TABLE blogs ADD COLUMN og_image VARCHAR(500) DEFAULT NULL AFTER image_url;

-- Tags (JSON array for cross-category discovery)
ALTER TABLE blogs ADD COLUMN tags JSON DEFAULT NULL AFTER keywords;

-- View count tracking
ALTER TABLE blogs ADD COLUMN view_count INT DEFAULT 0 AFTER tags;

-- Image alt text (AI-generated descriptive text)
ALTER TABLE blogs ADD COLUMN image_alt VARCHAR(500) DEFAULT NULL AFTER og_image;

-- Index for view count (popular posts queries)
CREATE INDEX idx_view_count ON blogs(view_count);

-- Index for tags (requires MySQL 8+ multi-valued index)
-- ALTER TABLE blogs ADD INDEX idx_tags ((CAST(tags AS CHAR(255) ARRAY)));
-- Skipping multi-valued index for MySQL 9 compatibility — use JSON_CONTAINS in queries
