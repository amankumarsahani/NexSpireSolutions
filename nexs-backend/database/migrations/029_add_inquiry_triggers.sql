-- Migration: 029_add_inquiry_triggers.sql
-- Description: Add inquiry triggers to the workflows table

ALTER TABLE workflows 
MODIFY COLUMN trigger_type ENUM(
    'lead_created', 
    'client_created', 
    'lead_status_changed',
    'client_status_changed',
    'task_due', 
    'form_submitted', 
    'scheduled', 
    'manual',
    'inquiry_created',
    'inquiry_status_updated',
    'inquiry_converted'
) NOT NULL;
