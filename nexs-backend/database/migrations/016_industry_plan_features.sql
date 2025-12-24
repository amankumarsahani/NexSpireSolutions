-- =============================================
-- Migration: Add Industry & Plan Features
-- =============================================

-- 1. Add industry_type to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS industry_type VARCHAR(50) DEFAULT 'general' AFTER plan_id,
ADD COLUMN IF NOT EXISTS features JSON AFTER industry_type;

-- 2. Add feature configuration to plans table
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS feature_limits JSON AFTER max_leads,
ADD COLUMN IF NOT EXISTS allowed_industries JSON AFTER feature_limits,
ADD COLUMN IF NOT EXISTS communication_limits JSON AFTER allowed_industries,
ADD COLUMN IF NOT EXISTS enabled_features JSON AFTER communication_limits;

-- 3. Update existing plans with feature configurations

-- Starter Plan
UPDATE plans SET 
    feature_limits = JSON_OBJECT(
        'users', 3,
        'leads', 500,
        'clients', 100,
        'storage_gb', 1,
        'documents', 50
    ),
    allowed_industries = JSON_ARRAY('general'),
    communication_limits = JSON_OBJECT(
        'emails_per_month', 500,
        'email_templates', 5,
        'bulk_mail_limit', 0,
        'sms_per_month', 0,
        'whatsapp_enabled', false,
        'team_chat', false,
        'push_notifications', false
    ),
    enabled_features = JSON_ARRAY('basic_reports', 'email_templates', 'in_app_notifications')
WHERE name = 'Starter' OR slug = 'starter';

-- Growth Plan
UPDATE plans SET 
    feature_limits = JSON_OBJECT(
        'users', 10,
        'leads', 2000,
        'clients', 500,
        'storage_gb', 5,
        'documents', 200
    ),
    allowed_industries = JSON_ARRAY('general', 'ecommerce', 'services', 'realestate'),
    communication_limits = JSON_OBJECT(
        'emails_per_month', 5000,
        'email_templates', 25,
        'bulk_mail_limit', 500,
        'sms_per_month', 0,
        'whatsapp_enabled', false,
        'team_chat', true,
        'chat_history_days', 7,
        'chat_channels', 3,
        'push_notifications', true
    ),
    enabled_features = JSON_ARRAY(
        'basic_reports', 'email_templates', 'bulk_import', 
        'email_scheduling', 'auto_responders', 'team_chat_basic',
        'push_notifications', 'in_app_notifications'
    )
WHERE name = 'Growth' OR slug = 'growth';

-- Business Plan
UPDATE plans SET 
    feature_limits = JSON_OBJECT(
        'users', 25,
        'leads', 10000,
        'clients', 2000,
        'storage_gb', 25,
        'documents', 1000
    ),
    allowed_industries = JSON_ARRAY('*'),
    communication_limits = JSON_OBJECT(
        'emails_per_month', 25000,
        'email_templates', -1,
        'bulk_mail_limit', 5000,
        'sms_per_month', 1000,
        'sms_templates', 10,
        'whatsapp_enabled', true,
        'whatsapp_templates', 10,
        'team_chat', true,
        'chat_history_days', 90,
        'chat_channels', 10,
        'push_notifications', true,
        'browser_push', true
    ),
    enabled_features = JSON_ARRAY(
        'basic_reports', 'advanced_reports', 'email_templates', 'bulk_import',
        'email_scheduling', 'email_campaigns', 'campaign_analytics', 'custom_smtp',
        'sms_notifications', 'whatsapp_business', 'team_chat_full',
        'ai_chatbot_basic', 'auto_responders', 'workflow_triggers',
        'push_notifications', 'browser_push', 'in_app_notifications',
        'api_access', 'webhooks'
    )
WHERE name = 'Business' OR slug = 'business';

-- Enterprise Plan
UPDATE plans SET 
    feature_limits = JSON_OBJECT(
        'users', -1,
        'leads', -1,
        'clients', -1,
        'storage_gb', 100,
        'documents', -1
    ),
    allowed_industries = JSON_ARRAY('*'),
    communication_limits = JSON_OBJECT(
        'emails_per_month', -1,
        'email_templates', -1,
        'bulk_mail_limit', -1,
        'sms_per_month', -1,
        'sms_templates', -1,
        'whatsapp_enabled', true,
        'whatsapp_templates', -1,
        'whatsapp_broadcast', true,
        'team_chat', true,
        'chat_history_days', -1,
        'chat_channels', -1,
        'push_notifications', true,
        'browser_push', true,
        'mobile_push', true
    ),
    enabled_features = JSON_ARRAY('*')
WHERE name = 'Enterprise' OR slug = 'enterprise';

-- 4. Create industry_configs table for storing industry-specific settings
CREATE TABLE IF NOT EXISTS industry_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    industry_type VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    modules JSON NOT NULL,
    default_settings JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Insert industry configurations
INSERT INTO industry_configs (industry_type, display_name, description, modules, default_settings) VALUES
('general', 'General Business', 'Standard CRM for any business type', 
    JSON_ARRAY('dashboard', 'leads', 'clients', 'inquiries', 'users', 'documents', 'communications'),
    JSON_OBJECT('lead_stages', JSON_ARRAY('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'))
),
('ecommerce', 'E-Commerce', 'CRM for online stores and retail', 
    JSON_ARRAY('products', 'orders', 'inventory', 'shipping', 'returns'),
    JSON_OBJECT(
        'order_statuses', JSON_ARRAY('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'),
        'inventory_alerts', true
    )
),
('realestate', 'Real Estate', 'CRM for property sales and rentals', 
    JSON_ARRAY('properties', 'listings', 'viewings', 'contracts'),
    JSON_OBJECT(
        'property_types', JSON_ARRAY('House', 'Apartment', 'Villa', 'Land', 'Commercial'),
        'listing_types', JSON_ARRAY('Sale', 'Rent', 'Lease')
    )
),
('services', 'Professional Services', 'CRM for service-based businesses', 
    JSON_ARRAY('appointments', 'services', 'bookings', 'timesheets'),
    JSON_OBJECT(
        'booking_slots', 30,
        'reminder_hours', 24
    )
),
('education', 'Education', 'CRM for schools and training institutes', 
    JSON_ARRAY('courses', 'students', 'batches', 'attendance', 'grades'),
    JSON_OBJECT(
        'grading_system', 'percentage',
        'attendance_tracking', true
    )
),
('healthcare', 'Healthcare', 'CRM for clinics and medical practices', 
    JSON_ARRAY('patients', 'appointments', 'records', 'prescriptions'),
    JSON_OBJECT(
        'appointment_slots', 15,
        'reminder_hours', 24
    )
),
('hospitality', 'Hospitality', 'CRM for hotels and restaurants', 
    JSON_ARRAY('reservations', 'rooms', 'guests', 'housekeeping'),
    JSON_OBJECT(
        'check_in_time', '14:00',
        'check_out_time', '11:00'
    )
)
ON DUPLICATE KEY UPDATE 
    display_name = VALUES(display_name),
    modules = VALUES(modules);
