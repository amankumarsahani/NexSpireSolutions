-- Add score column to leads table 
-- Skip if column already exists (error will be caught by migration runner)
ALTER TABLE leads ADD COLUMN score INT DEFAULT 0
