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

-- Add budget column if missing (for existing tables)
SET @dbname = DATABASE();
SET @tablename = "departments";
SET @columnname = "budget";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE departments ADD COLUMN budget DECIMAL(15, 2) DEFAULT 0;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


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
-- Add teamId column to projects table if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = "projects";
SET @columnname = "teamId";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE projects ADD COLUMN teamId INT NULL AFTER clientId;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add FK to projects (only if column exists, which it should now)
-- Note: Checking for FK existence is harder, so we'll skip if it fails or assume it's fine to try adding if we added the column. 
-- For simplicity, we'll try to add the FK only if we added the column, but that's complex.
-- Instead, let's just run the FK add in a separate block that ignores errors or checks for constraint name.
SET @constraintName = "projects_ibfk_team"; -- Guessing name or we can name it explicitly
-- Actually, let's just try to add the FK. If it fails, it fails. But migrate.js stops.
-- Let's use a similar check for the FK.
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = 'fk_projects_team')
  ) > 0,
  "SELECT 1",
  "ALTER TABLE projects ADD CONSTRAINT fk_projects_team FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- Add departmentId to existing team_members table if needed
SET @tablename = "team_members";
SET @columnname = "departmentId";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE team_members ADD COLUMN departmentId INT NULL AFTER department;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add FK for team_members
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = 'fk_team_members_department')
  ) > 0,
  "SELECT 1",
  "ALTER TABLE team_members ADD CONSTRAINT fk_team_members_department FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL;"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


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
