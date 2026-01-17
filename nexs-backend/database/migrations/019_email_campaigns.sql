-- Migration: 019_email_campaigns.sql
-- Description: Email campaigns, queue, tracking, and SMTP rotation

-- ============================================
-- SMTP Accounts (for rotation to avoid quota exhaustion)
-- ============================================
CREATE TABLE IF NOT EXISTS smtp_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT DEFAULT 587,
    secure BOOLEAN DEFAULT FALSE,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    daily_limit INT DEFAULT 500,
    hourly_limit INT DEFAULT 50,
    sent_today INT DEFAULT 0,
    sent_this_hour INT DEFAULT 0,
    last_hour_reset DATETIME,
    last_day_reset DATE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Email Campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    preview_text VARCHAR(255),
    template_id INT,
    html_content LONGTEXT,
    text_content TEXT,
    status ENUM('draft', 'scheduled', 'sending', 'paused', 'completed', 'failed') DEFAULT 'draft',
    
    -- Audience targeting
    audience_type ENUM('all_leads', 'all_clients', 'filtered', 'custom') DEFAULT 'all_leads',
    audience_filter JSON,
    custom_emails TEXT,
    
    -- Scheduling
    scheduled_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    
    -- Rate limiting
    rate_limit_per_hour INT DEFAULT 50,
    delay_between_emails INT DEFAULT 3,
    
    -- Stats (denormalized for quick access)
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    bounced_count INT DEFAULT 0,
    unsubscribed_count INT DEFAULT 0,
    
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_at)
);

-- ============================================
-- Email Queue (for rate-limited sending)
-- ============================================
CREATE TABLE IF NOT EXISTS email_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    smtp_account_id INT,
    
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_type ENUM('lead', 'client', 'custom') DEFAULT 'lead',
    recipient_id INT,
    
    -- Personalization variables
    variables JSON,
    
    status ENUM('pending', 'sending', 'sent', 'failed', 'bounced', 'skipped') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    
    -- Timing
    scheduled_at DATETIME,
    sent_at DATETIME,
    next_retry_at DATETIME,
    
    -- Tracking
    tracking_id VARCHAR(64) UNIQUE,
    opened_at DATETIME,
    clicked_at DATETIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_campaign (campaign_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_at),
    INDEX idx_tracking (tracking_id),
    
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE
);

-- ============================================
-- Email Tracking Events
-- ============================================
CREATE TABLE IF NOT EXISTS email_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    queue_id INT NOT NULL,
    campaign_id INT NOT NULL,
    tracking_id VARCHAR(64) NOT NULL,
    
    event_type ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed') NOT NULL,
    
    -- Event details
    ip_address VARCHAR(45),
    user_agent TEXT,
    link_url TEXT,
    bounce_type VARCHAR(50),
    bounce_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_queue (queue_id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_tracking (tracking_id),
    INDEX idx_event (event_type)
);

-- ============================================
-- Unsubscribe List (global)
-- ============================================
CREATE TABLE IF NOT EXISTS email_unsubscribes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    campaign_id INT,
    reason ENUM('user_request', 'too_many_emails', 'not_relevant', 'spam', 'other') DEFAULT 'user_request',
    custom_reason TEXT,
    ip_address VARCHAR(45),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_email (email)
);

-- ============================================
-- Email Bounces (for auto-disable)
-- ============================================
CREATE TABLE IF NOT EXISTS email_bounces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    bounce_count INT DEFAULT 1,
    bounce_type ENUM('hard', 'soft') NOT NULL,
    last_bounce_reason TEXT,
    is_disabled BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_email (email)
);

-- ============================================
-- Insert default SMTP from environment (placeholder)
-- ============================================
INSERT INTO smtp_accounts (name, host, port, secure, username, password, from_name, from_email, daily_limit, hourly_limit, priority)
VALUES ('Primary SMTP', 'smtp.gmail.com', 587, FALSE, 'placeholder', 'placeholder', 'NexSpire Solutions', 'noreply@nexspiresolutions.co.in', 500, 50, 1)
ON DUPLICATE KEY UPDATE name = name;
