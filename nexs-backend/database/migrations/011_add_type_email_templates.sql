-- Add missing 'type' column to email_templates table
-- The 'type' column distinguishes between email, sms, whatsapp, push notification templates

-- Add type column (will fail if already exists, which is fine)
ALTER TABLE email_templates 
ADD COLUMN type ENUM('email', 'sms', 'whatsapp', 'push', 'other') DEFAULT 'email' 
COMMENT 'Template type: email, sms, whatsapp, push, other'
AFTER name
