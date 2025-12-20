-- NexCRM Multi-Tenant Schema
-- Run on nexspire_solutions database

-- ============================================
-- PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_users INT NOT NULL DEFAULT 3,
    max_leads INT NOT NULL DEFAULT 500,
    max_clients INT NOT NULL DEFAULT 100,
    max_projects INT NOT NULL DEFAULT 50,
    max_email_templates INT NOT NULL DEFAULT 5,
    max_document_templates INT NOT NULL DEFAULT 3,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, max_users, max_leads, max_clients, max_projects, max_email_templates, max_document_templates, features) VALUES
('Starter', 'starter', 'Perfect for small teams getting started', 999, 9990, 3, 500, 100, 50, 5, 3, '{"email_sending": 500, "custom_domain": false, "api_access": false, "priority_support": false}'),
('Professional', 'professional', 'For growing businesses', 2499, 24990, 10, 2000, 500, 200, 20, 15, '{"email_sending": 2000, "custom_domain": true, "api_access": false, "priority_support": true}'),
('Enterprise', 'enterprise', 'For large organizations', 5999, 59990, 999, 99999, 99999, 99999, 999, 999, '{"email_sending": 10000, "custom_domain": true, "api_access": true, "priority_support": true}')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    logo_url VARCHAR(500),
    
    -- Process configuration
    assigned_port INT UNIQUE,
    db_name VARCHAR(100),
    process_name VARCHAR(100),
    process_status ENUM('stopped', 'starting', 'running', 'error') DEFAULT 'stopped',
    
    -- Cloudflare
    cf_dns_record_id VARCHAR(100),
    
    -- Industry/Features
    industry_type VARCHAR(50) DEFAULT 'general',
    custom_features JSON,
    
    -- Subscription
    plan_id INT DEFAULT 1,
    status ENUM('pending', 'trial', 'active', 'suspended', 'cancelled') DEFAULT 'pending',
    trial_ends_at DATETIME,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_subdomain (subdomain),
    INDEX idx_status (status),
    INDEX idx_plan (plan_id),
    
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

-- ============================================
-- PORT ALLOCATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS port_allocation (
    port INT PRIMARY KEY,
    tenant_id INT NULL,
    allocated_at TIMESTAMP NULL,
    
    INDEX idx_tenant (tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

-- Pre-allocate ports 3001-3050 for tenants
INSERT IGNORE INTO port_allocation (port) VALUES 
(3001),(3002),(3003),(3004),(3005),(3006),(3007),(3008),(3009),(3010),
(3011),(3012),(3013),(3014),(3015),(3016),(3017),(3018),(3019),(3020),
(3021),(3022),(3023),(3024),(3025),(3026),(3027),(3028),(3029),(3030),
(3031),(3032),(3033),(3034),(3035),(3036),(3037),(3038),(3039),(3040),
(3041),(3042),(3043),(3044),(3045),(3046),(3047),(3048),(3049),(3050);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'past_due', 'cancelled', 'expired') DEFAULT 'active',
    billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
    current_period_start DATE,
    current_period_end DATE,
    
    -- Payment provider
    razorpay_subscription_id VARCHAR(100),
    razorpay_customer_id VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    subscription_id INT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
    
    -- Payment provider
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    
    -- Invoice
    invoice_number VARCHAR(50),
    invoice_url VARCHAR(500),
    
    -- Metadata
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_razorpay (razorpay_payment_id),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- ============================================
-- TENANT USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    date DATE NOT NULL,
    users_count INT DEFAULT 0,
    leads_count INT DEFAULT 0,
    clients_count INT DEFAULT 0,
    projects_count INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    storage_mb INT DEFAULT 0,
    api_calls INT DEFAULT 0,
    
    UNIQUE KEY unique_tenant_date (tenant_id, date),
    INDEX idx_tenant (tenant_id),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
