-- Nexspire Solutions Database Schema
-- MySQL Database Structure

-- Create database
CREATE DATABASE IF NOT EXISTS nexspire_solutions;
USE nexspire_solutions;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Clients table (CRM)
CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyName VARCHAR(255) NOT NULL,
  contactName VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  industry VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  status ENUM('active', 'prospect', 'inactive') DEFAULT 'prospect',
  notes TEXT,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_company (companyName)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('planning', 'in-progress', 'completed', 'on-hold') DEFAULT 'planning',
  budget DECIMAL(12, 2),
  startDate DATE,
  endDate DATE,
  progress INT DEFAULT 0,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_client (clientId)
);

-- Leads table (sales pipeline)
CREATE TABLE IF NOT EXISTS leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contactName VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  leadSource VARCHAR(100),
  status ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'new',
  estimatedValue DECIMAL(12, 2),
  score INT DEFAULT 0,
  notes TEXT,
  assignedTo INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_assigned (assignedTo)
);

-- Lead Comments table
CREATE TABLE IF NOT EXISTS lead_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leadId INT NOT NULL,
  comment TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_lead (leadId)
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  workload INT DEFAULT 0,
  status ENUM('active', 'inactive', 'on-leave') DEFAULT 'active',
  joinDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_department (department),
  INDEX idx_status (status)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('contract', 'design', 'report', 'other') DEFAULT 'other',
  fileUrl VARCHAR(500) NOT NULL,
  fileSize INT,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_recipient (recipientId),
  INDEX idx_read (isRead)
);

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123'
INSERT INTO users (email, password, firstName, lastName, role) 
VALUES ('admin@nexspiresolutions.co.in', '$2a$10$rGHQd8Z9hKCPqJKpH7xqseVq8Z5YZ5YZ5YZ5YZ5YZ5YZ5YZ5YZ5YZ', 'Admin', 'User', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Sample data (optional)
INSERT INTO clients (companyName, contactName, email, phone, status, industry) VALUES
('Tech Innovations Inc', 'John Doe', 'john@techinnovations.com', '+1234567890', 'active', 'Technology'),
('Marketing Pro Ltd', 'Jane Smith', 'jane@marketingpro.com', '+1234567891', 'prospect', 'Marketing')
ON DUPLICATE KEY UPDATE companyName=companyName;
