-- Add admin_password column to store the generated password for tenant admin
-- This allows viewing the credentials later in the admin panel

ALTER TABLE tenants 
ADD COLUMN admin_password VARCHAR(255) AFTER email;

-- Add comment for security note
-- Note: In production, consider encrypting this or using a secure password reset flow
