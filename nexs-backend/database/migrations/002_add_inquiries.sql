-- Migration: Add Inquiries Table
-- Run this SQL to create the inquiries table

CREATE TABLE IF NOT EXISTS inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  message TEXT NOT NULL,
  status ENUM('new', 'contacted', 'resolved') DEFAULT 'new',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_created (createdAt)
);

-- Optional: Insert sample data for testing
INSERT INTO inquiries (name, email, phone, company, message, status) VALUES
('John Doe', 'john@example.com', '+1234567890', 'Tech Corp', 'I would like to inquire about your web development services.', 'new'),
('Jane Smith', 'jane@example.com', '+1234567891', 'Marketing Plus', 'Can you help us with digital marketing strategies?', 'contacted'),
('Bob Johnson', 'bob@example.com', NULL, NULL, 'Interested in mobile app development.', 'new');
