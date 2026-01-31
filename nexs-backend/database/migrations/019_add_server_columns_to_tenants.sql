-- Add Server and Custom Domain Support to Tenants Table
-- NexSpireSolutions Admin Database
-- IDEMPOTENT MIGRATION - Safe to run multiple times

-- Helper: Drop foreign key constraint if it exists (using prepared statement)
-- For fk_tenants_server on tenants table
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tenants' 
    AND CONSTRAINT_NAME = 'fk_tenants_server'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @drop_fk_sql = IF(@fk_exists > 0, 'ALTER TABLE tenants DROP FOREIGN KEY fk_tenants_server', 'SELECT 1');
PREPARE stmt FROM @drop_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1. Add columns to tenants table (IF NOT EXISTS pattern using stored procedure)
-- Add server_id column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'server_id');
SET @add_col_sql = IF(@col_exists = 0, 'ALTER TABLE tenants ADD COLUMN server_id INT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @add_col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add custom_domain column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'custom_domain');
SET @add_col_sql = IF(@col_exists = 0, 'ALTER TABLE tenants ADD COLUMN custom_domain VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @add_col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add custom_domain_verified column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'custom_domain_verified');
SET @add_col_sql = IF(@col_exists = 0, 'ALTER TABLE tenants ADD COLUMN custom_domain_verified BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @add_col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add custom_domain_dns_record_id column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'custom_domain_dns_record_id');
SET @add_col_sql = IF(@col_exists = 0, 'ALTER TABLE tenants ADD COLUMN custom_domain_dns_record_id VARCHAR(100) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @add_col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on server_id if not exists
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND INDEX_NAME = 'idx_server');
SET @add_idx_sql = IF(@idx_exists = 0, 'ALTER TABLE tenants ADD INDEX idx_server (server_id)', 'SELECT 1');
PREPARE stmt FROM @add_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on custom_domain if not exists
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND INDEX_NAME = 'idx_custom_domain');
SET @add_idx_sql = IF(@idx_exists = 0, 'ALTER TABLE tenants ADD INDEX idx_custom_domain (custom_domain)', 'SELECT 1');
PREPARE stmt FROM @add_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add foreign key constraint to servers table
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tenants' 
    AND CONSTRAINT_NAME = 'fk_tenants_server'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @add_fk_sql = IF(@fk_exists = 0, 'ALTER TABLE tenants ADD CONSTRAINT fk_tenants_server FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @add_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Update port_allocation to be server-aware
-- First, drop existing foreign key if it exists
SET @fk_name = (
    SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'port_allocation' 
    AND COLUMN_NAME = 'tenant_id' 
    AND REFERENCED_TABLE_NAME = 'tenants'
    LIMIT 1
);
SET @drop_fk_sql = IF(@fk_name IS NOT NULL, CONCAT('ALTER TABLE port_allocation DROP FOREIGN KEY ', @fk_name), 'SELECT 1');
PREPARE stmt FROM @drop_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if port_allocation has the old single-column PRIMARY KEY (just port)
-- If so, drop it and recreate with (server_id, port)
SET @pk_col_count = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'port_allocation' 
    AND CONSTRAINT_NAME = 'PRIMARY'
);
SET @has_server_id_in_pk = (
    SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'port_allocation' 
    AND CONSTRAINT_NAME = 'PRIMARY'
    AND COLUMN_NAME = 'server_id'
);

-- Add server_id column to port_allocation if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'port_allocation' AND COLUMN_NAME = 'server_id');
SET @add_col_sql = IF(@col_exists = 0, 'ALTER TABLE port_allocation ADD COLUMN server_id INT NOT NULL DEFAULT 1 AFTER port', 'SELECT 1');
PREPARE stmt FROM @add_col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Only modify primary key if server_id is not already part of it
SET @modify_pk_sql = IF(@has_server_id_in_pk = 0 AND @pk_col_count > 0, 'ALTER TABLE port_allocation DROP PRIMARY KEY, ADD PRIMARY KEY (server_id, port)', 'SELECT 1');
PREPARE stmt FROM @modify_pk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Re-add foreign key to tenants if not exists
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'port_allocation' 
    AND CONSTRAINT_NAME = 'fk_port_tenant'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @add_fk_sql = IF(@fk_exists = 0, 'ALTER TABLE port_allocation ADD CONSTRAINT fk_port_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @add_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Assign existing tenants to primary server
UPDATE tenants SET server_id = (SELECT id FROM servers WHERE is_primary = TRUE LIMIT 1) WHERE server_id IS NULL;
UPDATE port_allocation SET server_id = (SELECT id FROM servers WHERE is_primary = TRUE LIMIT 1) WHERE server_id = 1;
