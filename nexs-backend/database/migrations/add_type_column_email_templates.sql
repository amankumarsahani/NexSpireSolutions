-- Add missing 'type' column to email_templates table
-- The 'type' column distinguishes between email, sms, whatsapp, push notification templates

-- Add type column if it doesn't exist
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS type ENUM('email', 'sms', 'whatsapp', 'push', 'other') DEFAULT 'email' 
COMMENT 'Template type: email, sms, whatsapp, push, other'
AFTER name;

-- Update existing records to have type = 'email' if null
UPDATE email_templates SET type = 'email' WHERE type IS NULL;

SELECT 'Type column added successfully!' AS message;
