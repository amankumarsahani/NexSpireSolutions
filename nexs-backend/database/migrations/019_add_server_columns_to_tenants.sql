-- Add Server and Custom Domain Support to Tenants Table
-- NexSpireSolutions Admin Database

-- 1. Add columns to tenants table
ALTER TABLE tenants 
ADD COLUMN server_id INT DEFAULT NULL AFTER cf_dns_record_id,
ADD COLUMN custom_domain VARCHAR(255) DEFAULT NULL AFTER server_id,
ADD COLUMN custom_domain_verified BOOLEAN DEFAULT FALSE AFTER custom_domain,
ADD COLUMN custom_domain_dns_record_id VARCHAR(100) DEFAULT NULL AFTER custom_domain_verified,
ADD INDEX idx_server (server_id),
ADD INDEX idx_custom_domain (custom_domain);

-- 2. Add foreign key constraint to servers table (created in previous migration)
ALTER TABLE tenants
ADD CONSTRAINT fk_tenants_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL;

-- 3. Update port_allocation to be server-aware
-- First, drop existing primary key and foreign keys to rebuild
ALTER TABLE port_allocation DROP FOREIGN KEY fk_port_tenant; -- Assuming this is the FK name, adjust if different
ALTER TABLE port_allocation DROP PRIMARY KEY;

-- Add server_id to port_allocation
ALTER TABLE port_allocation
ADD COLUMN server_id INT NOT NULL DEFAULT 1 AFTER port;

-- Set primary key to (server_id, port)
ALTER TABLE port_allocation ADD PRIMARY KEY (server_id, port);

-- Re-add foreign key to tenants
ALTER TABLE port_allocation 
ADD CONSTRAINT fk_port_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- 4. Assign existing tenants to primary server
UPDATE tenants SET server_id = (SELECT id FROM servers WHERE is_primary = TRUE LIMIT 1) WHERE server_id IS NULL;
UPDATE port_allocation SET server_id = (SELECT id FROM servers WHERE is_primary = TRUE LIMIT 1);
