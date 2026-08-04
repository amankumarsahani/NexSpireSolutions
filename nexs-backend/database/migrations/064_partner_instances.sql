-- Whitelabel partner sync subsystem (P1-01)
--
-- A partner runs a full, isolated deployment on its own server and Cloudflare
-- account. That instance pushes a snapshot of itself and its tenants up to this
-- master so we can see the fleet without needing inbound network access to it.
--
-- Two rules the schema exists to enforce:
--   1. partner_tenant_mirror is READ ONLY here. We never write into a partner
--      database from this panel. A sync outage degrades to stale data, never to
--      corruption.
--   2. Control flows back through partner_commands, which the instance polls on
--      its own heartbeat. That keeps every connection outbound from the partner,
--      so the partner server needs no open ports.
--
-- See nexcrm-agents/shared/whitelabel-execution-plan.md

CREATE TABLE IF NOT EXISTS partner_instances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',

    -- Where the partner instance lives
    base_domain VARCHAR(255),
    admin_url VARCHAR(255),

    -- Shared secret for the HMAC on every report. Verifying an HMAC needs the
    -- plaintext, so this cannot be a one-way hash; it is encrypted at rest with
    -- services/secretStore (AES-256-GCM, key from env). A dump of this table
    -- without the master key cannot be used to forge a partner's telemetry.
    sync_secret_enc VARCHAR(512) NOT NULL,

    -- Reported by the instance itself
    git_sha VARCHAR(40),
    app_version VARCHAR(40),
    edition VARCHAR(20),
    last_seen_at DATETIME,
    last_full_sync_at DATETIME,
    health_json JSON,

    -- Commercials. Ours only; never serialised to a partner.
    billing_model ENUM('revshare', 'wholesale', 'flat') DEFAULT 'wholesale',
    revshare_pct DECIMAL(5,2) DEFAULT NULL,
    wholesale_price_monthly DECIMAL(10,2) DEFAULT NULL,
    tenant_quota INT DEFAULT 25,

    -- Contacts
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status (status),
    INDEX idx_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Read-only projection of a partner's tenants. Never written to by anything
-- except the sync receiver.
CREATE TABLE IF NOT EXISTS partner_tenant_mirror (
    id INT PRIMARY KEY AUTO_INCREMENT,
    instance_id INT NOT NULL,
    tenant_slug VARCHAR(100) NOT NULL,

    name VARCHAR(255),
    status VARCHAR(30),
    plan_slug VARCHAR(50),
    industry_type VARCHAR(50),

    users INT DEFAULT 0,
    storage_mb INT DEFAULT 0,
    emails_sent_30d INT DEFAULT 0,
    api_calls_30d INT DEFAULT 0,

    custom_domain_crm VARCHAR(255),
    process_status VARCHAR(30),

    tenant_created_at DATETIME,
    last_active_at DATETIME,

    -- Set by a sweep when the owning instance stops reporting, so the UI can grey
    -- the row instead of presenting stale numbers as current.
    last_synced_at DATETIME,
    is_stale TINYINT(1) DEFAULT 0,

    UNIQUE KEY uq_instance_tenant (instance_id, tenant_slug),
    INDEX idx_instance (instance_id),
    INDEX idx_stale (is_stale),
    FOREIGN KEY (instance_id) REFERENCES partner_instances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Every accepted or rejected report. Also the audit trail for forged-signature
-- attempts, which is why failures are recorded rather than dropped.
CREATE TABLE IF NOT EXISTS partner_sync_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    instance_id INT NULL,
    instance_slug VARCHAR(100),
    kind ENUM('snapshot', 'event', 'command_ack') NOT NULL,
    ok TINYINT(1) NOT NULL,
    tenants_count INT DEFAULT 0,
    payload_bytes INT DEFAULT 0,
    error TEXT,
    remote_ip VARCHAR(45),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_instance_time (instance_id, received_at),
    INDEX idx_ok_time (ok, received_at),
    FOREIGN KEY (instance_id) REFERENCES partner_instances(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Outbound control. We enqueue; the instance picks the command up in its next
-- heartbeat response and acks on the following one. Idempotent by id.
CREATE TABLE IF NOT EXISTS partner_commands (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    instance_id INT NOT NULL,
    command ENUM(
        'suspend_tenant',
        'resume_tenant',
        'rotate_sync_secret',
        'run_migrations',
        'force_resync',
        'set_quota',
        'suspend_instance'
    ) NOT NULL,
    args JSON,
    status ENUM('pending', 'sent', 'acked', 'failed') DEFAULT 'pending',
    result TEXT,

    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    acked_at DATETIME NULL,

    INDEX idx_instance_status (instance_id, status),
    FOREIGN KEY (instance_id) REFERENCES partner_instances(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
