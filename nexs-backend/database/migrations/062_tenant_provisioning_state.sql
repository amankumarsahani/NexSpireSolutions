-- Persist background provisioning progress and failure details so the admin UI
-- can present a recoverable state instead of a generic process_status=error.
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS provision_step VARCHAR(64) NULL AFTER process_status;

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS provision_error TEXT NULL AFTER provision_step;

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS provisioning_started_at DATETIME NULL AFTER provision_error;

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS provisioning_completed_at DATETIME NULL AFTER provisioning_started_at;
