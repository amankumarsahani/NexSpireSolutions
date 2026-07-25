-- Compatibility migration for databases created before legal document
-- categories were changed from a closed ENUM to an extensible string.
ALTER TABLE legal_document_templates
    MODIFY COLUMN category VARCHAR(64) DEFAULT 'other';
