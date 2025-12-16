-- Activities Table
-- Tracks all activities and notes on entities (inquiries, leads, clients, etc.)

CREATE TABLE IF NOT EXISTS activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entityType VARCHAR(50) NOT NULL COMMENT 'Type: inquiry, lead, client, project',
    entityId INT NOT NULL COMMENT 'ID of the related entity',
    type VARCHAR(50) NOT NULL DEFAULT 'note' COMMENT 'Type: note, call, email, meeting, status_change',
    summary VARCHAR(255) COMMENT 'Short summary of the activity',
    details TEXT COMMENT 'Full activity details',
    performedBy INT COMMENT 'User ID who performed the action',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entityType, entityId),
    INDEX idx_type (type),
    INDEX idx_performed_by (performedBy),
    
    FOREIGN KEY (performedBy) REFERENCES users(id) ON DELETE SET NULL
)
