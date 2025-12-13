-- Email Templates Table
-- Stores custom email templates that can be managed from admin panel

CREATE TABLE IF NOT EXISTS email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL COMMENT 'Template identifier e.g. inquiry-notification',
    subject VARCHAR(255) COMMENT 'Default email subject line',
    html_content TEXT NOT NULL COMMENT 'HTML template content',
    description VARCHAR(500) COMMENT 'Admin description of template purpose',
    variables JSON COMMENT 'Available template variables with descriptions',
    category ENUM('notification', 'marketing', 'transactional', 'system') DEFAULT 'notification',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
