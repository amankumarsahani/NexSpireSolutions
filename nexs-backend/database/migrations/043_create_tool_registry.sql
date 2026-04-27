-- Tool Registry System
-- Enables Nexspire platform to manage multiple tools (NexCRM, NexMail, etc.) per tenant

CREATE TABLE IF NOT EXISTS tools (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    slug            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50),
    version         VARCHAR(20) DEFAULT '1.0.0',
    status          ENUM('active','beta','deprecated','maintenance') DEFAULT 'active',
    base_url_pattern VARCHAR(255),
    health_endpoint VARCHAR(255),
    internal_api_url VARCHAR(255),
    config_schema   JSON,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tool_plans (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tool_id         INT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    description     TEXT,
    price_monthly   DECIMAL(10,2) DEFAULT 0.00,
    price_yearly    DECIMAL(10,2) DEFAULT 0.00,
    is_free         BOOLEAN DEFAULT FALSE,
    limits          JSON,
    features        JSON,
    sort_order      INT DEFAULT 0,
    status          ENUM('active','hidden','deprecated') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    INDEX idx_tool_id (tool_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_tools (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       INT NOT NULL,
    tool_id         INT NOT NULL,
    tool_plan_id    INT,
    status          ENUM('active','trial','suspended','cancelled') DEFAULT 'trial',
    provisioned_at  DATETIME,
    trial_ends_at   DATETIME,
    suspended_at    DATETIME,
    cancelled_at    DATETIME,
    config          JSON,
    usage_data      JSON,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tenant_tool (tenant_id, tool_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_plan_id) REFERENCES tool_plans(id) ON DELETE SET NULL,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_tool_id (tool_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed NexCRM as the first tool (retroactive)
INSERT IGNORE INTO tools (slug, name, description, icon, version, status, base_url_pattern, config_schema)
VALUES (
    'nexcrm',
    'NexCRM',
    'Customer Relationship Management with industry-specific modules, invoicing, workflows, and e-commerce storefront.',
    'briefcase',
    '2.0.0',
    'active',
    '{slug}-crm.nexspiresolutions.co.in',
    '{"industry_type": "string", "plan_id": "number"}'
);

-- Seed NexMail as the second tool
INSERT IGNORE INTO tools (slug, name, description, icon, version, status, base_url_pattern, health_endpoint, internal_api_url, config_schema)
VALUES (
    'nexmail',
    'NexMail',
    'Email marketing engine with campaigns, automations, contact management, template builder, and analytics.',
    'mail',
    '1.0.0',
    'active',
    '{slug}-mail.nexspiresolutions.co.in',
    'http://localhost:5050/health',
    'http://localhost:5050/api',
    '{"max_contacts": "number", "max_emails_per_month": "number", "ab_testing": "boolean", "automations": "boolean", "custom_domain": "boolean"}'
);

-- Seed NexMail plans
INSERT IGNORE INTO tool_plans (tool_id, name, slug, description, price_monthly, price_yearly, is_free, limits, features, sort_order)
VALUES
    ((SELECT id FROM tools WHERE slug = 'nexmail'), 'Free', 'nexmail-free', '1,000 contacts, 5,000 emails/month', 0.00, 0.00, TRUE,
     '{"max_contacts": 1000, "max_emails_per_month": 5000, "max_templates": 10, "max_lists": 5, "max_automations": 2, "max_smtp_accounts": 1}',
     '{"ab_testing": false, "throttle_controls": false, "send_windows": false, "crm_sync": false, "dynamic_segments": false, "contact_scoring": false, "smtp_rotation": false, "domain_throttling": false, "warmup_mode": false, "engagement_heatmap": false, "api_access": false, "priority_support": false}',
     1),
    ((SELECT id FROM tools WHERE slug = 'nexmail'), 'Growth', 'nexmail-growth', '5,000 contacts, 25,000 emails/month', 699.00, 7128.00, FALSE,
     '{"max_contacts": 5000, "max_emails_per_month": 25000, "max_templates": 25, "max_lists": 15, "max_automations": 5, "max_smtp_accounts": 2}',
     '{"ab_testing": false, "throttle_controls": true, "send_windows": false, "crm_sync": true, "dynamic_segments": false, "contact_scoring": false, "smtp_rotation": true, "domain_throttling": true, "warmup_mode": true, "engagement_heatmap": false, "api_access": false, "priority_support": false}',
     2),
    ((SELECT id FROM tools WHERE slug = 'nexmail'), 'Pro', 'nexmail-pro', '25,000 contacts, 100,000 emails/month', 1999.00, 20388.00, FALSE,
     '{"max_contacts": 25000, "max_emails_per_month": 100000, "max_templates": 100, "max_lists": -1, "max_automations": -1, "max_smtp_accounts": 5}',
     '{"ab_testing": true, "throttle_controls": true, "send_windows": true, "crm_sync": true, "dynamic_segments": true, "contact_scoring": true, "smtp_rotation": true, "domain_throttling": true, "warmup_mode": true, "engagement_heatmap": true, "api_access": true, "priority_support": true}',
     3),
    ((SELECT id FROM tools WHERE slug = 'nexmail'), 'Business', 'nexmail-business', '100,000 contacts, 500,000 emails/month', 4999.00, 50988.00, FALSE,
     '{"max_contacts": 100000, "max_emails_per_month": 500000, "max_templates": -1, "max_lists": -1, "max_automations": -1, "max_smtp_accounts": 10}',
     '{"ab_testing": true, "throttle_controls": true, "send_windows": true, "crm_sync": true, "dynamic_segments": true, "contact_scoring": true, "smtp_rotation": true, "domain_throttling": true, "warmup_mode": true, "reputation_monitoring": true, "engagement_heatmap": true, "api_access": true, "priority_support": true, "custom_onboarding": true}',
     4),
    ((SELECT id FROM tools WHERE slug = 'nexmail'), 'Enterprise', 'nexmail-enterprise', 'Unlimited everything with dedicated support', 0.00, 0.00, FALSE,
     '{"max_contacts": -1, "max_emails_per_month": -1, "max_templates": -1, "max_lists": -1, "max_automations": -1, "max_smtp_accounts": -1}',
     '{"ab_testing": true, "throttle_controls": true, "send_windows": true, "crm_sync": true, "dynamic_segments": true, "contact_scoring": true, "smtp_rotation": true, "domain_throttling": true, "warmup_mode": true, "reputation_monitoring": true, "engagement_heatmap": true, "api_access": true, "priority_support": true, "custom_onboarding": true, "dedicated_manager": true, "sla": "99.9%"}',
     5);
