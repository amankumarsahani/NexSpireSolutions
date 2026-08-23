-- Per-tenant Meta App secret for webhook signature verification.
--
-- One Meta App serving every tenant (Tech Provider / Embedded Signup) signs
-- inbound webhooks with OUR app secret, which is what META_APP_SECRET checks.
-- A tenant who brings their OWN Meta App signs with THEIRS — so the global check
-- rejected every one of their messages with "signature mismatch" and dropped it.
-- Outbound worked, inbound silently did not, which is the worst way for an
-- integration to be broken.
--
-- app_secret is stored with the same encryptToken() scheme as meta_token.
-- NULL means "this number is on our app", so existing rows keep working unchanged.
ALTER TABLE whatsapp_phone_registry
    ADD COLUMN app_mode ENUM('platform','tenant') NOT NULL DEFAULT 'platform' AFTER tenant_api_url,
    ADD COLUMN app_secret TEXT DEFAULT NULL AFTER app_mode,
    ADD COLUMN waba_id VARCHAR(64) DEFAULT NULL AFTER app_secret,
    ADD COLUMN last_inbound_at DATETIME DEFAULT NULL AFTER waba_id,
    ADD COLUMN last_forward_error VARCHAR(500) DEFAULT NULL AFTER last_inbound_at;

-- Durable retry for tenant fan-out.
--
-- Meta retries a webhook only while we return non-200, and we must return 200
-- immediately or it backs off the whole app. So once we ack, delivery to the
-- tenant is our problem alone: a tenant process restarting during a deploy used
-- to lose every message that arrived in that window, with no trace.
CREATE TABLE IF NOT EXISTS whatsapp_forward_queue (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    meta_phone_id   VARCHAR(64) NOT NULL,
    tenant_api_url  VARCHAR(255) NOT NULL,
    payload         JSON NOT NULL,
    attempts        INT NOT NULL DEFAULT 0,
    next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_error      VARCHAR(500) DEFAULT NULL,
    status          ENUM('pending','delivered','failed') NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wfq_due (status, next_attempt_at),
    INDEX idx_wfq_phone (meta_phone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
