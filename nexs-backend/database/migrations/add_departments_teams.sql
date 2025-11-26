-- Add Departments Table
-- This migration adds the departments table and related schema changes

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR (255) NOT NULL,
  description TEXT,
  managerId INT NULL,
  budget DECIMAL(15, 2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (managerId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_manager (managerId)
);

-- Create teams table with department relationship
CREATE TABLE IF NOT EXISTS teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  departmentId INT NULL,
  leaderId INT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (leaderId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_department (departmentId),
  INDEX idx_status (status)
);

-- Create team_members junction table (many-to-many relationship between teams and users)
CREATE TABLE IF NOT EXISTS team_member_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teamId INT NOT NULL,
  userId INT NOT NULL,
  role VARCHAR(100),
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_user (teamId, userId),
  INDEX idx_team (teamId),
  INDEX idx_user (userId)
);

-- Add teamId column to projects table if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS teamId INT NULL AFTER clientId,
ADD FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
ADD INDEX idx_team (teamId);

-- Add departmentId to existing team_members table if needed (for backward compatibility)
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS departmentId INT NULL AFTER department,
ADD FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL;

-- Insert sample departments
INSERT INTO departments (name, description, budget) VALUES
('Engineering', 'Software development and engineering teams', 500000.00),
('Design', 'UI/UX and graphic design team', 200000.00),
('Marketing', 'Marketing and growth team', 300000.00),
('Sales', 'Sales and business development team', 250000.00)
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample teams
INSERT INTO teams (name, description, departmentId, status) VALUES
('Backend Team', 'Node.js and database development', 1, 'active'),
('Frontend Team', 'React and UI development', 1, 'active'),
('UX Team', 'User experience research and design', 2, 'active'),
('Content Team', 'Content creation and social media', 3, 'active')
ON DUPLICATE KEY UPDATE name=name;
