-- Maps a Facebook Page id to the tenant that owns it, so the single central
-- Meta webhook (one Meta App serves every tenant) knows which tenant's
-- nexcrm-backend instance to forward a new lead to. Mirror of
-- whatsapp_phone_registry (056), but for Lead Ads instead of WhatsApp.
--
-- The Page access token lives here (encrypted) because the CENTRAL webhook is
-- what fetches the lead from the Graph API — it needs the page token, and the
-- tenant never sees it. Tokens are AES-256-GCM via services/secretStore.js.
CREATE TABLE IF NOT EXISTS meta_page_registry (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    page_id             VARCHAR(64) NOT NULL UNIQUE,
    page_name           VARCHAR(255) DEFAULT NULL,
    tenant_slug         VARCHAR(150) NOT NULL,
    tenant_api_url      VARCHAR(255) NOT NULL,
    page_token_encrypted TEXT DEFAULT NULL,
    status              ENUM('active','revoked') NOT NULL DEFAULT 'active',
    last_lead_at        TIMESTAMP NULL DEFAULT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_slug (tenant_slug)
);
