-- Fix blogs table schema to align with blog.model.js expectations
-- The model expects 'published' (BOOLEAN) and 'image_url' columns
-- but the original migration created 'status' (ENUM) and 'image' columns

-- Add the 'published' column if it doesn't exist
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE AFTER featured;

-- Rename 'image' to 'image_url' if it exists
ALTER TABLE blogs CHANGE COLUMN image image_url VARCHAR(500);

-- Migrate existing 'status' values to 'published' column
UPDATE blogs SET published = (status = 'published') WHERE published IS NULL OR published = 0;

-- Add keywords column if not exists (used by model)
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS keywords JSON DEFAULT NULL AFTER read_time;

-- Add index on published column for query performance
CREATE INDEX IF NOT EXISTS idx_published ON blogs(published);
