-- Fix schema mismatches
-- Run this on the server to align database with code

-- =============================================
-- Fix clients table - add companyName column
-- =============================================
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS companyName VARCHAR(255) AFTER name;

UPDATE clients SET companyName = name WHERE companyName IS NULL;

-- =============================================
-- Fix inquiries table - add created_at if missing
-- =============================================
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER updated_at;

ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER status;

-- =============================================
-- Fix document_templates table - add timestamps
-- =============================================
ALTER TABLE document_templates 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE document_templates 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- =============================================
-- Show result
-- =============================================
SELECT 'Schema fixes applied!' as status;
