-- Add 'converted' status to inquiries table

ALTER TABLE inquiries MODIFY COLUMN status ENUM('new', 'contacted', 'resolved', 'converted') DEFAULT 'new'
