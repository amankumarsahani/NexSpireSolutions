-- Migration: 028_campaign_preview_text_to_text.sql
-- Description: Change preview_text column from VARCHAR(255) to TEXT
-- This allows for longer preview text content in email campaigns

ALTER TABLE email_campaigns 
MODIFY COLUMN preview_text TEXT;
