-- Add template type support for email, SMS, WhatsApp and other templates
-- Run this migration to extend the email_templates table

-- Add type column
ALTER TABLE email_templates
ADD COLUMN type ENUM('email', 'sms', 'whatsapp', 'push', 'other') DEFAULT 'email' AFTER name;

-- Update existing templates to be email type
UPDATE email_templates SET type = 'email' WHERE type IS NULL;

-- Add index for type
CREATE INDEX idx_template_type ON email_templates(type);

-- Create view for easier querying
CREATE OR REPLACE VIEW templates_summary AS
SELECT 
    type,
    category,
    COUNT(*) as total,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active
FROM email_templates
GROUP BY type, category;
