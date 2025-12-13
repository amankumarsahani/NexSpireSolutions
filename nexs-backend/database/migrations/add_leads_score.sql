-- Add score column to leads table if it doesn't exist

ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INT DEFAULT 0 AFTER estimatedValue
