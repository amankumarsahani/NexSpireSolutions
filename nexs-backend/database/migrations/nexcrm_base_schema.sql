-- NexCRM Base Schema
-- This schema is applied to each tenant's database during provisioning
-- Last Updated: 2026-01-11
-- STANDARD: All column names use snake_case

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('admin', 'manager', 'sales_operator', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    avatar_url VARCHAR(500),
    department VARCHAR(100),
    position VARCHAR(100),
    bio TEXT,
    join_date DATE,
    timezone VARCHAR(50) DEFAULT NULL COMMENT 'IANA timezone identifier (e.g., Asia/Kolkata)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contact_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    status ENUM('new', 'contacted', 'qualified', 'negotiation', 'won', 'lost') DEFAULT 'new',
    lead_source VARCHAR(100),
    estimated_value DECIMAL(15,2),
    score INT DEFAULT 0,
    notes TEXT,
    assigned_to INT,
    customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    company VARCHAR(255),
    address TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    status ENUM('active', 'inactive', 'churned') DEFAULT 'active',
    source VARCHAR(100),
    notes TEXT,
    total_value DECIMAL(15,2) DEFAULT 0,
    assigned_to INT,
    converted_from_lead INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (converted_from_lead) REFERENCES leads(id) ON DELETE SET NULL
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INT,
    status ENUM('pending', 'in_progress', 'completed', 'on_hold', 'cancelled', 'draft', 'active') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    progress INT DEFAULT 0,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- INQUIRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT,
    source VARCHAR(100),
    status ENUM('new', 'contacted', 'resolved', 'spam', 'converted', 'in_progress', 'closed') DEFAULT 'new',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    related_type VARCHAR(50),
    related_id INT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_related (related_type, related_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    html_content TEXT,
    type VARCHAR(50) DEFAULT 'custom',
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default system email templates
INSERT IGNORE INTO email_templates (name, subject, html_content, type, is_active, is_system) VALUES
('Customer Verification', 'Verify Your Email Address', '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;"><div style="text-align: center; margin-bottom: 32px;"><div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 28px;">✓</span></div></div><h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center;">Welcome{{#first_name}}, {{first_name}}{{/first_name}}!</h1><p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Thank you for creating an account. Please verify your email address to complete your registration.</p><div style="text-align: center; margin: 32px 0;"><a href="{{verification_url}}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">Verify Email Address</a></div><p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 16px; text-align: center;">This link will expire in 24 hours.</p></div>', 'customer_verification', TRUE, TRUE),

('Guest Welcome', 'Your Account Has Been Created', '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;"><h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center;">Welcome{{#first_name}}, {{first_name}}{{/first_name}}!</h1><p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Thank you for your order! We''ve created an account for you.</p><div style="text-align: center; margin: 32px 0;"><a href="{{verification_url}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify & Set Password</a></div></div>', 'guest_welcome', TRUE, TRUE),

('Password Reset', 'Reset Your Password', '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;"><h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center;">Password Reset Request</h1><p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">Click the button below to create a new password:</p><div style="text-align: center; margin: 32px 0;"><a href="{{reset_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a></div><p style="color: #64748b; font-size: 14px; text-align: center;">This link will expire in 1 hour.</p></div>', 'password_reset', TRUE, TRUE),

('Order Confirmation', 'Order Confirmed - #{{order_number}}', '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;"><h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center;">Order Confirmed!</h1><p style="color: #475569; font-size: 16px; text-align: center;">Hi {{customer_name}}, thank you for your order!</p><div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;"><p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">Order Number</p><p style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">{{order_number}}</p></div><div style="text-align: center;"><a href="{{track_url}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600;">Track Your Order</a></div></div>', 'order_confirmation', TRUE, TRUE);


-- ============================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    template_id INT,
    subject VARCHAR(500),
    html_content TEXT,
    recipients_type ENUM('all_customers', 'all_leads', 'segment', 'manual') DEFAULT 'all_customers',
    recipients_filter JSON,
    status ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'failed') DEFAULT 'draft',
    scheduled_at DATETIME,
    sent_at DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- EMAIL CAMPAIGN LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaign_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    status ENUM('pending', 'sent', 'opened', 'clicked', 'bounced', 'failed') DEFAULT 'pending',
    sent_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
    UNIQUE KEY unique_recipient (campaign_id, recipient_email),
    INDEX idx_campaign (campaign_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- DOCUMENT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS document_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content LONGTEXT,
    type VARCHAR(50) DEFAULT 'custom',
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    workload INT DEFAULT 0,
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    join_date DATE,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- ASSIGNMENT TRACKER (for round-robin)
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_tracker (
    entity_type VARCHAR(50) PRIMARY KEY,
    last_assigned_user_id INT,
    last_assigned_index INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
);

-- Default settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('company_name', 'My Store'),
('primary_color', '#3b82f6'),
('secondary_color', '#10b981'),
('currency', 'INR'),
('currency_symbol', '₹'),
('industry', 'general'),
('timezone', 'UTC');

-- ============================================
-- ROLE PERMISSIONS TABLE (RBAC)
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('admin', 'manager', 'sales_operator', 'user') NOT NULL UNIQUE,
    permissions JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default role permissions (format: module -> array of actions)
INSERT IGNORE INTO role_permissions (role, permissions) VALUES
('admin', '{"dashboard":["read"],"employees":["create","read","update","delete"],"users":["create","read","update","delete"],"inquiries":["create","read","update","delete"],"leads":["create","read","update","delete"],"clients":["create","read","update","delete"],"projects":["create","read","update","delete"],"communications":["create","read","update","delete"],"automation":["create","read","update","delete"],"products":["create","read","update","delete"],"orders":["create","read","update","delete"],"properties":["create","read","update","delete"],"viewings":["create","read","update","delete"],"patients":["create","read","update","delete"],"appointments":["create","read","update","delete"],"settings":["create","read","update","delete"],"reports":["read"]}'),
('manager', '{"dashboard":["read"],"employees":["read","update"],"users":[],"inquiries":["create","read","update"],"leads":["create","read","update"],"clients":["create","read","update"],"projects":["create","read","update"],"communications":["create","read","update"],"automation":["read"],"products":["create","read","update"],"orders":["create","read","update"],"reports":["read"]}'),
('sales_operator', '{"dashboard":["read"],"employees":[],"users":[],"inquiries":["read","update"],"leads":["create","read","update"],"clients":["read","update"],"communications":["read"],"orders":["read","update"]}'),
('user', '{"dashboard":["read"],"employees":[],"users":[],"inquiries":["read"],"leads":["read"],"clients":["read"],"communications":[]}');

-- ============================================
-- CMS - BANNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS banners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image VARCHAR(500),
    link VARCHAR(500),
    position VARCHAR(50) DEFAULT 'home_hero',
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position (position),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- CMS - STATIC PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS static_pages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- CMS - BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT,
    featured_image VARCHAR(500),
    author_id INT,
    category VARCHAR(100),
    tags JSON,
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- CMS - HOMEPAGE SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS homepage_sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    content JSON,
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- CMS - SECTIONS TABLE (for homepage categories, deals, collections etc)
-- ============================================
CREATE TABLE IF NOT EXISTS cms_sections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    section_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    subtitle TEXT,
    items JSON,
    position INT DEFAULT 0,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (section_type),
    INDEX idx_position (position),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- AUTOMATION - WORKFLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    trigger_type VARCHAR(50),
    canvas_data JSON,
    settings JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_trigger (trigger_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUTOMATION - WORKFLOW EXECUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_executions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    trigger_type VARCHAR(50),
    trigger_data JSON,
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workflow (workflow_id),
    INDEX idx_status (status),
    INDEX idx_started (started_at),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUTOMATION - WORKFLOW NODE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_node_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    execution_id INT NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    node_name VARCHAR(255),
    input_data JSON,
    output_data JSON,
    status ENUM('pending', 'running', 'success', 'failed', 'skipped') DEFAULT 'pending',
    error_message TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    INDEX idx_execution (execution_id),
    INDEX idx_node (node_id),
    INDEX idx_status (status),
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUTOMATION - WORKFLOW VARIABLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_variables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    value JSON,
    scope ENUM('workflow', 'global') DEFAULT 'workflow',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_var (workflow_id, name),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTIFICATIONS - PUSH TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS push_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    expo_push_token VARCHAR(255) NOT NULL,
    platform ENUM('expo', 'ios', 'android', 'web') DEFAULT 'expo',
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_token (expo_push_token),
    INDEX idx_user_id (user_id),
    INDEX idx_active_tokens (is_active, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    audience ENUM('all', 'leads', 'customers', 'team') DEFAULT 'all',
    link VARCHAR(500),
    data JSON,
    sent_by INT,
    recipients_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sent_at (sent_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    lead_updates BOOLEAN DEFAULT TRUE,
    new_inquiries BOOLEAN DEFAULT TRUE,
    task_reminders BOOLEAN DEFAULT TRUE,
    team_messages BOOLEAN DEFAULT FALSE,
    order_updates BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- MIGRATIONS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHAT TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('department', 'project', 'custom', 'dm') DEFAULT 'custom',
    avatar_url VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (type)
);

CREATE TABLE IF NOT EXISTS chat_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP NULL,
    UNIQUE KEY unique_member (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    sender_id INT,
    content TEXT,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_group_time (group_id, created_at)
);

-- ============================================
-- CHAT CHANNELS TABLES (alternative naming - used by some routes)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_channels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    type ENUM('channel', 'dm') DEFAULT 'channel',
    created_by INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_channel_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    channel_id INT NOT NULL,
    user_id INT NOT NULL,
    last_read_at TIMESTAMP NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_member (channel_id, user_id),
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add channel_id reference to chat_messages for chat_channels system
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS channel_id INT AFTER id;

-- Default chat channels
INSERT IGNORE INTO chat_channels (name, description, type, is_default) VALUES 
('General', 'General discussion for all team members', 'channel', TRUE),
('Sales Team', 'Sales team discussions and updates', 'channel', FALSE),
('Support', 'Customer support discussions', 'channel', FALSE);

-- ============================================
-- SMTP ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS smtp_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT DEFAULT 587,
    secure BOOLEAN DEFAULT FALSE,
    auth_user VARCHAR(255),
    auth_pass VARCHAR(500),
    from_email VARCHAR(255),
    from_name VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    daily_limit INT DEFAULT 500,
    sent_today INT DEFAULT 0,
    last_reset DATE,
    status ENUM('active', 'inactive', 'error') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- E-COMMERCE: PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    compare_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    category VARCHAR(100),
    brand VARCHAR(100),
    stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    quantity INT DEFAULT 0,
    supplier_margin DECIMAL(10,2),
    weight DECIMAL(8,2),
    dimensions VARCHAR(50),
    images LONGTEXT,
    vendor_id INT,
    status TINYINT NOT NULL DEFAULT 0 COMMENT '0=draft,1=active,2=archived,3=out_of_stock',
    is_featured TINYINT(1) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sku (sku),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured),
    INDEX idx_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: CUSTOMERS TABLE (Storefront Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255),
    reset_expires DATETIME,
    verification_token VARCHAR(255),
    verification_expires DATETIME,
    email_verified BOOLEAN DEFAULT FALSE,
    unsubscribed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_reset_token (reset_token),
    INDEX idx_verification_token (verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: CUSTOMER ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_default (customer_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT,
    customer_id INT,
    guest_email VARCHAR(255),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(20),
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax DECIMAL(15,2) DEFAULT 0,
    shipping DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    coupon_code VARCHAR(50),
    coupon_discount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    shipping_address TEXT,
    billing_address TEXT,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(255),
    product_image VARCHAR(500),
    quantity INT DEFAULT 1,
    price DECIMAL(15,2),
    total DECIMAL(15,2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: REFUND TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS refund_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT,
    status ENUM('pending', 'processing', 'processed', 'failed') DEFAULT 'pending',
    refund_method VARCHAR(50),
    reference_number VARCHAR(100),
    processed_at DATETIME,
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    description TEXT,
    type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(15,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    usage_limit INT DEFAULT NULL,
    per_user_limit INT DEFAULT 1,
    used_count INT DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    applies_to ENUM('all', 'products', 'categories') DEFAULT 'all',
    product_ids JSON,
    category_ids JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: COUPON USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    order_id INT,
    customer_id INT,
    discount_amount DECIMAL(10,2),
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    INDEX idx_coupon (coupon_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: FLASH SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS flash_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10,2),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: FLASH SALE PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS flash_sale_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flash_sale_id INT NOT NULL,
    product_id INT NOT NULL,
    sale_price DECIMAL(10,2),
    quantity_limit INT,
    sold_count INT DEFAULT 0,
    FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_flash_sale (flash_sale_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: VENDORS TABLE (Marketplace)
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    company_name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    logo VARCHAR(500),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    bank_ifsc VARCHAR(20),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_sales DECIMAL(15,2) DEFAULT 0,
    status ENUM('pending', 'approved', 'active', 'inactive', 'rejected', 'suspended') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: VENDOR PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    commission DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    period_start DATE,
    period_end DATE,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    processed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor (vendor_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: PRODUCT CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(500),
    parent_id INT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: PRODUCT REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    client_id INT,
    customer_id INT,
    customer_name VARCHAR(100),
    customer_email VARCHAR(255),
    rating INT NOT NULL DEFAULT 5,
    title VARCHAR(200),
    review TEXT,
    pros TEXT,
    cons TEXT,
    status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_status (status),
    INDEX idx_approved (is_approved),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: SHIPPING PROVIDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    logo VARCHAR(500),
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    api_endpoint VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: SHIPPING RATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    per_kg_rate DECIMAL(10,2) DEFAULT 0,
    min_weight DECIMAL(8,2) DEFAULT 0,
    max_weight DECIMAL(8,2),
    delivery_days VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES shipping_providers(id) ON DELETE SET NULL,
    INDEX idx_provider (provider_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: DELIVERY ZONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    pincodes JSON,
    states JSON,
    cities JSON,
    is_serviceable BOOLEAN DEFAULT TRUE,
    cod_available BOOLEAN DEFAULT TRUE,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    free_delivery_above DECIMAL(10,2),
    estimated_days VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_serviceable (is_serviceable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: SHIPMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    provider_id INT,
    tracking_number VARCHAR(100),
    awb_number VARCHAR(100),
    status ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'rto', 'cancelled') DEFAULT 'pending',
    weight DECIMAL(8,2),
    dimensions VARCHAR(100),
    shipping_cost DECIMAL(10,2),
    estimated_delivery DATE,
    actual_delivery DATE,
    pickup_address TEXT,
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES shipping_providers(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_tracking (tracking_number),
    INDEX idx_awb (awb_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- E-COMMERCE: SHIPMENT TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipment_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_id INT NOT NULL,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_data JSON,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    INDEX idx_shipment (shipment_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default shipping providers
INSERT IGNORE INTO shipping_providers (name, code, is_active) VALUES
('Manual / Self Delivery', 'manual', TRUE),
('Delhivery', 'delhivery', FALSE),
('Shiprocket', 'shiprocket', FALSE),
('Blue Dart', 'bluedart', FALSE),
('DTDC', 'dtdc', FALSE),
('India Post', 'indiapost', FALSE);

-- Default delivery zones
INSERT IGNORE INTO delivery_zones (name, is_serviceable, cod_available, delivery_charge, free_delivery_above, estimated_days) VALUES
('Local (Same City)', TRUE, TRUE, 30.00, 500.00, '1-2 days'),
('Metro Cities', TRUE, TRUE, 50.00, 1000.00, '2-3 days'),
('Rest of India', TRUE, TRUE, 80.00, 1500.00, '4-7 days'),
('Remote Areas', TRUE, FALSE, 150.00, 2000.00, '7-10 days');
