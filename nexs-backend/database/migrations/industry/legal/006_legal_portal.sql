-- Legal client portal — OTP login store.
-- SQL mirror of nexcrm-backend/database/migrations/legal/006_legal_portal.js.
--
-- A leaked OTP table must not be a leaked account, so the OTP is hashed, never
-- stored in the clear, and expires.

CREATE TABLE IF NOT EXISTS legal_portal_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(120) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose ENUM('client_login') DEFAULT 'client_login',
    attempts INT NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    consumed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_legal_otp_identifier (identifier, purpose, expires_at)
) ENGINE=InnoDB;
