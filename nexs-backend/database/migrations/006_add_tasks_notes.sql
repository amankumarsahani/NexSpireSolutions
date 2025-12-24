-- Tasks table for project management
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INT,
    due_date DATE,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('todo', 'in-progress', 'done', 'cancelled') DEFAULT 'todo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES team_members(id) ON DELETE SET NULL
);

-- Notes table for lead management
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
);

-- Add lead score column to leads table
-- Note: MySQL requires a stored procedure or separate block to safely check column existence before adding,
-- but for simplicity in this migration script we'll use a standard ADD COLUMN. 
-- In MySQL 8.0+ IF NOT EXISTS is supported for columns in ALTER TABLE.
-- If running on older MySQL, this line might need adjustment or should be ignored if column exists.
-- Using try-catch block logic in application code is better, but here we assume modern MySQL or first run.
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INT DEFAULT 0; -- MySQL 8.0 syntax

-- For compatibility, we will just run the ALTER. If it fails because column exists, the migration script handles one statement at a time.
-- However, strict SQL scripts might fail. 
-- Let's use a standard ADD which will fail if exists, but our runner catches errors. 
-- To be safer, we can wrap this. 

-- Indexes (MySQL automatically creates indexes for Foreign Keys, so we only need non-key indexes)
-- CREATE INDEX idx_tasks_project_id ON tasks(project_id); -- Auto-created by FK
-- CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to); -- Auto-created by FK
CREATE INDEX idx_tasks_status ON tasks(status);
-- CREATE INDEX idx_notes_lead_id ON notes(lead_id); -- Auto-created by FK
-- CREATE INDEX idx_notes_author_id ON notes(author_id); -- Auto-created by FK
-- CREATE INDEX idx_leads_score ON leads(score); 

