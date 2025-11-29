-- Tasks table for project management (MySQL 5.7+ compatible)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INT,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'todo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES team_members(id) ON DELETE SET NULL,
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CHECK (status IN ('todo', 'in-progress', 'done', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notes table for lead management (MySQL 5.7+ compatible)
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add lead score column to leads table if missing
SET @score_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'leads'
      AND column_name = 'score'
);
SET @has_leads_table := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'leads'
);
SET @score_sql := IF(
    @has_leads_table = 1 AND @score_exists = 0,
    'ALTER TABLE leads ADD COLUMN score INT DEFAULT 0',
    'SELECT 1'
);
PREPARE score_stmt FROM @score_sql;
EXECUTE score_stmt;
DEALLOCATE PREPARE score_stmt;

-- Create indexes for better query performance (guarded for MySQL versions without IF NOT EXISTS)
SET @has_tasks_table := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'tasks'
);
SET @idx_tasks_project := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'tasks' AND index_name = 'idx_tasks_project_id'
);
SET @sql := IF(@has_tasks_table = 1 AND @idx_tasks_project = 0, 'CREATE INDEX idx_tasks_project_id ON tasks(project_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_tasks_assigned := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'tasks' AND index_name = 'idx_tasks_assigned_to'
);
SET @sql := IF(@has_tasks_table = 1 AND @idx_tasks_assigned = 0, 'CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_tasks_status := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'tasks' AND index_name = 'idx_tasks_status'
);
SET @sql := IF(@has_tasks_table = 1 AND @idx_tasks_status = 0, 'CREATE INDEX idx_tasks_status ON tasks(status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_notes_lead := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'notes' AND index_name = 'idx_notes_lead_id'
);
SET @sql := IF((SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'notes') = 1 AND @idx_notes_lead = 0, 'CREATE INDEX idx_notes_lead_id ON notes(lead_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_notes_author := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'notes' AND index_name = 'idx_notes_author_id'
);
SET @sql := IF((SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'notes') = 1 AND @idx_notes_author = 0, 'CREATE INDEX idx_notes_author_id ON notes(author_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_leads_score := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'leads' AND index_name = 'idx_leads_score'
);
SET @score_column_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'leads' AND column_name = 'score'
);
SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'leads') = 1
    AND @score_column_exists = 1
    AND @idx_leads_score = 0,
    'CREATE INDEX idx_leads_score ON leads(score)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
