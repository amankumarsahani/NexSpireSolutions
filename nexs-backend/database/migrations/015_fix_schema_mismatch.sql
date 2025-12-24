-- Fix schema mismatches
-- Run this on the server to align database with code

-- Fix clients table - add companyName column (ignore if exists)
ALTER TABLE clients ADD COLUMN companyName VARCHAR(255);

-- Fix inquiries table - add timestamps (ignore if exists)  
ALTER TABLE inquiries ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE inquiries ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Fix email_templates table - add type column (ignore if exists)
ALTER TABLE email_templates ADD COLUMN type VARCHAR(50) DEFAULT 'email';

-- Fix document_templates table - add timestamps (ignore if exists)
ALTER TABLE document_templates ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE document_templates ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
