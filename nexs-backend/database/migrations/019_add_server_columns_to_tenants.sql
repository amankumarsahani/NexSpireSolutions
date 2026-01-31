-- Add Server and Custom Domain Support to Tenants Table
-- NexSpireSolutions Admin Database
-- IDEMPOTENT MIGRATION - Safe to run multiple times

-- =====================================================
-- 1. Add columns to tenants table (ignore if exists)
-- =====================================================

-- Add server_id column
ALTER TABLE tenants ADD COLUMN server_id INT DEFAULT NULL;
-- Will fail silently if column exists - handled by migration runner

-- Add custom_domain column
ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(255) DEFAULT NULL;

-- Add custom_domain_verified column
ALTER TABLE tenants ADD COLUMN custom_domain_verified BOOLEAN DEFAULT FALSE;

-- Add custom_domain_dns_record_id column
ALTER TABLE tenants ADD COLUMN custom_domain_dns_record_id VARCHAR(100) DEFAULT NULL;

-- =====================================================
-- 2. Add indexes (IF NOT EXISTS supported in MariaDB 10.5+)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_server ON tenants(server_id);
CREATE INDEX IF NOT EXISTS idx_custom_domain ON tenants(custom_domain);

-- =====================================================
-- 3. Add server_id column to port_allocation
-- =====================================================
ALTER TABLE port_allocation ADD COLUMN server_id INT NOT NULL DEFAULT 1;

-- =====================================================
-- 4. Assign existing tenants to primary server
-- =====================================================
UPDATE tenants SET server_id = (SELECT id FROM servers WHERE is_primary = TRUE LIMIT 1) WHERE server_id IS NULL;
UPDATE port_allocation SET server_id = (SELECT id FROM servers WHERE is_primary = TRUE LIMIT 1) WHERE server_id = 1;
