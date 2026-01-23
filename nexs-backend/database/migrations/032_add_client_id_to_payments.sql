-- Add client_id to payments table
ALTER TABLE payments
ADD COLUMN client_id INT NULL AFTER tenant_id,
ADD CONSTRAINT fk_payments_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
