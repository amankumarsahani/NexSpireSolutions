-- Migration: 020_campaign_auto_enroll.sql
-- Description: Add auto-enroll feature to campaigns

-- Add auto_enroll column to email_campaigns
ALTER TABLE email_campaigns ADD COLUMN auto_enroll BOOLEAN DEFAULT FALSE;

-- Index for finding active auto-enroll campaigns quickly
CREATE INDEX idx_auto_enroll ON email_campaigns (auto_enroll, status, audience_type);

