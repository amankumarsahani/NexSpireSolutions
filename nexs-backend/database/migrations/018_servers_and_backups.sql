-- Servers and Backup Systems Migration
-- NexSpireSolutions Admin Database

-- 1. Create servers table for multi-server tracking
CREATE TABLE IF NOT EXISTS servers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255) NOT NULL,           -- e.g., ssh2.nexspiresolutions.co.in
    ssh_user VARCHAR(100) DEFAULT 'admin',
    cloudflare_tunnel_id VARCHAR(100),
    db_host VARCHAR(255) DEFAULT 'localhost',
    db_user VARCHAR(100),
    db_password VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create backup_accounts table for Google Drive account management
CREATE TABLE IF NOT EXISTS backup_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_name VARCHAR(100) NOT NULL,
    credentials_json JSON NOT NULL,          -- Google Service Account key
    folder_id VARCHAR(100),                  -- Target GDrive folder
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,               -- For load balancing across accounts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Create backup_history table to track backup status and retention
CREATE TABLE IF NOT EXISTS backup_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT,
    server_id INT,
    file_name VARCHAR(255),
    gdrive_file_id VARCHAR(100),
    backup_account_id INT,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    error_message TEXT,
    file_size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
    FOREIGN KEY (backup_account_id) REFERENCES backup_accounts(id) ON DELETE SET NULL
);

-- Insert primary server record if not already present
INSERT INTO servers (name, hostname, is_primary, is_active)
SELECT 'Primary', 'ssh.nexspiresolutions.co.in', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM servers WHERE is_primary = TRUE);
