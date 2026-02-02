-- =============================================
-- Migration: Add Missing Industries & Update Plans
-- =============================================

-- 1. Insert missing industry configurations
INSERT INTO industry_configs (industry_type, display_name, description, modules, default_settings) VALUES
('fitness', 'Fitness & Gym', 'CRM for gyms and fitness centers',
    JSON_ARRAY('gym_members', 'gym_classes', 'memberships', 'equipment', 'trainers'),
    JSON_OBJECT('class_duration_mins', 60)
),
('logistics', 'Logistics & Transport', 'CRM for logistics and fleet management',
    JSON_ARRAY('shipments', 'vehicles', 'drivers', 'warehouses', 'routes'),
    JSON_OBJECT('tracking_enabled', true)
),
('manufacturing', 'Manufacturing', 'CRM for production and manufacturing',
    JSON_ARRAY('production', 'raw_materials', 'work_orders', 'quality_checks', 'suppliers'),
    JSON_OBJECT('qc_check_required', true)
),
('restaurant', 'Restaurant', 'CRM for restaurants and food service',
    JSON_ARRAY('menu', 'tables', 'restaurant_orders', 'kitchen', 'table_reservations'),
    JSON_OBJECT('currency', 'INR')
),
('salon', 'Salon & Spa', 'CRM for salons, spas and beauty services',
    JSON_ARRAY('salon_bookings', 'salon_services', 'salon_staff', 'packages', 'salon_products'),
    JSON_OBJECT('appointment_interval', 30)
),
('legal', 'Legal & Law', 'CRM for law firms and legal practice',
    JSON_ARRAY('legal_cases', 'legal_clients', 'court_dates', 'case_documents', 'billing'),
    JSON_OBJECT('case_number_format', 'CASE-{YYYY}-{0000}')
),
('travel', 'Travel & Tourism', 'CRM for travel agencies',
    JSON_ARRAY('tours', 'tour_bookings', 'destinations', 'itineraries', 'guests'),
    JSON_OBJECT('booking_currency', 'USD')
)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    modules = VALUES(modules);

-- 2. Update Plans to include ALL industries
-- Update Starter Plan to include all new industries explicitly (or better yet, all available)
UPDATE plans 
SET allowed_industries = JSON_ARRAY(
    'general', 'ecommerce', 'education', 'fitness', 'healthcare', 
    'hospitality', 'legal', 'logistics', 'manufacturing', 
    'realestate', 'restaurant', 'salon', 'services', 'travel'
)
WHERE slug = 'starter';

-- Growth Plan supports a subset usually, but let's add common SMB ones
UPDATE plans 
SET allowed_industries = JSON_ARRAY(
    'general', 'ecommerce', 'services', 'realestate', 'education', 
    'fitness', 'salon', 'restaurant', 'travel', 'legal'
)
WHERE slug = 'growth';

-- Business and Enterprise already use '*' (All), so no update needed for them.
