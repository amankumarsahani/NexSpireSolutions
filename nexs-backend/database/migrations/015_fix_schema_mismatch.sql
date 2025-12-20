-- Fix schema mismatches
-- Run this on the server to align database with code

-- =============================================
-- Fix clients table - add companyName column
-- =============================================
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS companyName VARCHAR(255);

UPDATE clients SET companyName = name WHERE companyName IS NULL;

-- =============================================
-- Fix inquiries table - add timestamps
-- =============================================
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

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
