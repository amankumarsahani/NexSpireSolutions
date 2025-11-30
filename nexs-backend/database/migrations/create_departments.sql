-- Create departments table if missing
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert some default departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software development and technical teams'),
('Sales', 'Sales and business development'),
('Marketing', 'Marketing and communications'),
('Operations', 'Operations and administration'),
('HR', 'Human resources')
ON DUPLICATE KEY UPDATE name=name;
