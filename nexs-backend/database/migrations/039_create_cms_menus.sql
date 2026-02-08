-- Create cms_menus table for dynamic navigation
CREATE TABLE IF NOT EXISTS cms_menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    items JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Insert default menus
INSERT IGNORE INTO cms_menus (name, items) VALUES 
('header', '[{"label":"Home","url":"/"},{"label":"Services","url":"/services"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"}]'),
('footer', '[{"label":"Terms","url":"/terms"},{"label":"Privacy","url":"/privacy"}]');
