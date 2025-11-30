-- Create Activity Logs Table

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  action VARCHAR(50) NOT NULL, -- e.g., 'create', 'update', 'delete', 'login'
  entityType VARCHAR(50) NOT NULL, -- e.g., 'client', 'project', 'lead', 'user'
  entityId INT,
  details TEXT, -- JSON string or description of changes
  ipAddress VARCHAR(45),
  userAgent VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (userId),
  INDEX idx_entity (entityType, entityId),
  INDEX idx_action (action)
);
