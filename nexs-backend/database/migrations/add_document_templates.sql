-- Document Templates Table (schema only)
CREATE TABLE IF NOT EXISTS document_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category ENUM('sales', 'legal', 'finance', 'operations') DEFAULT 'sales',
    content LONGTEXT NOT NULL,
    variables JSON,
    isActive BOOLEAN DEFAULT TRUE,
    isDefault BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
