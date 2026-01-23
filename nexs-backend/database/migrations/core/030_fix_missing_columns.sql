-- Fix missing columns in various tables

-- Add priority column to smtp_accounts if missing
ALTER TABLE smtp_accounts ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

-- Add next_run_at column to workflow_executions if missing
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS next_run_at DATETIME DEFAULT NULL;

-- Add html_content column to email_templates if missing
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS html_content LONGTEXT;
