-- Add assignment columns and tracking for round-robin

-- Add assignedTo column to inquiries table
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS assignedTo INT;
ALTER TABLE inquiries ADD CONSTRAINT fk_inquiry_assigned FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned ON inquiries(assignedTo);

-- Create assignment tracking table for round-robin
CREATE TABLE IF NOT EXISTS assignment_tracker (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entityType VARCHAR(50) NOT NULL UNIQUE COMMENT 'lead or inquiry',
    lastAssignedUserId INT COMMENT 'Last user who was assigned an item',
    lastAssignedIndex INT DEFAULT 0 COMMENT 'Index in the rotation',
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize tracker for leads and inquiries
INSERT IGNORE INTO assignment_tracker (entityType, lastAssignedUserId, lastAssignedIndex) VALUES ('lead', NULL, 0);
INSERT IGNORE INTO assignment_tracker (entityType, lastAssignedUserId, lastAssignedIndex) VALUES ('inquiry', NULL, 0);
