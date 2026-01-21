-- Migration: Ensure Settings Table Exists
-- This is a fallback to ensure the settings table is present

CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
);

-- Seed basic settings if they don't exist
INSERT IGNORE INTO settings (setting_key, setting_value, category) VALUES 
('company_name', 'NexSpire Solutions', 'general'),
('primary_color', '#6366f1', 'branding'),
('secondary_color', '#8b5cf6', 'branding'),
('currency', 'INR', 'localization'),
('currency_symbol', '₹', 'localization');
