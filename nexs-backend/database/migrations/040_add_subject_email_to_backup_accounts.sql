ALTER TABLE backup_accounts
ADD COLUMN subject_email VARCHAR(255) NULL AFTER folder_id;
