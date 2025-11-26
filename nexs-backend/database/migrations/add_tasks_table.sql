-- Add Tasks Table
-- This migration adds the tasks table for project management

CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in-progress', 'review', 'completed') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assignedTo INT,
  dueDate DATE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_project (projectId),
  INDEX idx_assigned (assignedTo),
  INDEX idx_status (status)
);

-- Add sample tasks
INSERT INTO tasks (projectId, title, description, status, priority, dueDate) 
SELECT id, 'Initial Setup', 'Setup project repository and environment', 'completed', 'high', DATE_ADD(NOW(), INTERVAL 2 DAY)
FROM projects LIMIT 1;

INSERT INTO tasks (projectId, title, description, status, priority, dueDate) 
SELECT id, 'Database Design', 'Design database schema', 'in-progress', 'high', DATE_ADD(NOW(), INTERVAL 5 DAY)
FROM projects LIMIT 1;
