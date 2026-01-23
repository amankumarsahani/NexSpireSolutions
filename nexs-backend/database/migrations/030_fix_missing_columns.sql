-- Fix missing columns in various tables

-- Add priority column to smtp_accounts
ALTER TABLE smtp_accounts ADD COLUMN priority INT DEFAULT 0;

-- Add next_run_at column to workflow_executions
ALTER TABLE workflow_executions ADD COLUMN next_run_at DATETIME DEFAULT NULL;

-- Add html_content column to email_templates
ALTER TABLE email_templates ADD COLUMN html_content LONGTEXT;

