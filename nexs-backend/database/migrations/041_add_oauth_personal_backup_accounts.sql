ALTER TABLE backup_accounts
ADD COLUMN auth_type ENUM('service_account', 'oauth_personal') NOT NULL DEFAULT 'service_account' AFTER account_name,
ADD COLUMN oauth_client_id VARCHAR(255) NULL AFTER subject_email,
ADD COLUMN oauth_client_secret VARCHAR(255) NULL AFTER oauth_client_id,
ADD COLUMN oauth_refresh_token TEXT NULL AFTER oauth_client_secret;

ALTER TABLE backup_accounts
MODIFY COLUMN credentials_json JSON NULL;
