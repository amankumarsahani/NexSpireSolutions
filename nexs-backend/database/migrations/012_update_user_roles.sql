-- Add missing roles to users table
-- The ENUM needs to include: admin, manager, sales_operator, user

ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'sales_operator', 'user') DEFAULT 'user';
