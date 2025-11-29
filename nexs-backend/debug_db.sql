-- Check user table structure
DESCRIBE users;

-- Check if departments table exists
SHOW TABLES LIKE 'departments';

-- Check current user data
SELECT id, email, firstName, lastName, role, status FROM users WHERE email = 'admin@nexspire.com';
