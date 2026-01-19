-- Migration: 020_add_company_to_queue.sql
-- Description: Add recipient_company to email_queue for personalization

ALTER TABLE email_queue 
ADD COLUMN recipient_company VARCHAR(255) AFTER recipient_name;
