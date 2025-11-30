CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add some sample notifications
INSERT INTO notifications (user_id, type, title, message, is_read) VALUES 
(1, 'info', 'Welcome to Nexspire', 'Welcome to the new admin dashboard!', FALSE),
(1, 'success', 'Project Completed', 'The "Website Redesign" project has been marked as completed.', FALSE),
(1, 'warning', 'Server Load High', 'Server CPU usage is above 80%.', TRUE);
