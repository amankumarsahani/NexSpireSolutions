-- Alter Users Table to add Employee fields

ALTER TABLE users
ADD COLUMN position VARCHAR(100),
ADD COLUMN departmentId INT,
ADD COLUMN joinDate DATE,
ADD COLUMN salary DECIMAL(12, 2),
ADD COLUMN address TEXT,
ADD COLUMN emergencyContact VARCHAR(255),
ADD COLUMN notes TEXT,
ADD CONSTRAINT fk_user_department FOREIGN KEY (departmentId) REFERENCES departments(id) ON DELETE SET NULL;

-- Update existing admin user with dummy data
UPDATE users 
SET position = 'System Administrator', 
    joinDate = CURRENT_DATE 
WHERE role = 'admin';
