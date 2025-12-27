-- =============================================
-- Services Industry Module
-- Tables: service_categories, services, appointments, bookings, timesheets
-- =============================================

-- Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE,
    description TEXT,
    image VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (active)
);

-- Services catalog (what services the business offers)
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE,
    category_id INT,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    price_type ENUM('fixed', 'hourly', 'per_session', 'custom') DEFAULT 'fixed',
    
    -- Duration
    duration INT DEFAULT 60,
    duration_minutes INT DEFAULT 60,
    buffer_time_before INT DEFAULT 0,
    buffer_time_after INT DEFAULT 15,
    
    -- Details
    description TEXT,
    short_description VARCHAR(500),
    image VARCHAR(500),
    images JSON,
    
    -- Display
    featured BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    -- Availability
    availability_days JSON,
    availability_slots JSON,
    max_bookings_per_slot INT DEFAULT 1,
    
    -- Staff assignment
    requires_staff BOOLEAN DEFAULT TRUE,
    allowed_staff JSON,
    
    -- Settings
    requires_deposit BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),
    cancellation_policy TEXT,
    advance_booking_days INT DEFAULT 30,
    min_advance_hours INT DEFAULT 2,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL,
    INDEX idx_active (active),
    INDEX idx_featured (featured),
    INDEX idx_category (category_id)
);

-- Appointments (scheduled service bookings)
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_number VARCHAR(20) UNIQUE,
    
    -- Service & Customer
    service_id INT,
    client_id INT,
    lead_id INT,
    
    -- Customer info (for guests)
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(20),
    
    -- Schedule
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INT,
    
    -- Staff
    assigned_staff INT,
    
    -- Status
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
    
    -- Payment
    total_amount DECIMAL(10,2),
    deposit_paid DECIMAL(10,2) DEFAULT 0,
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    
    -- Notes
    customer_notes TEXT,
    staff_notes TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP NULL,
    
    -- Cancellation
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_staff) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_staff (assigned_staff)
);

-- Staff timesheets (working hours tracking)
CREATE TABLE IF NOT EXISTS timesheets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Work period
    work_date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    break_minutes INT DEFAULT 0,
    total_hours DECIMAL(5,2),
    
    -- Appointment tracking
    appointments_count INT DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_date (user_id, work_date),
    INDEX idx_date (work_date)
);

-- Staff availability (recurring schedule)
CREATE TABLE IF NOT EXISTS staff_availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_day (user_id, day_of_week)
);

-- Staff time-off / blocked dates
CREATE TABLE IF NOT EXISTS staff_timeoff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Service packages / bundles
CREATE TABLE IF NOT EXISTS service_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    
    -- Pricing
    original_price DECIMAL(10,2),
    package_price DECIMAL(10,2) NOT NULL,
    validity_days INT DEFAULT 365,
    
    -- Sessions
    total_sessions INT,
    sessions_used INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Package-service mapping
CREATE TABLE IF NOT EXISTS package_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    service_id INT NOT NULL,
    sessions_included INT DEFAULT 1,
    
    FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Customer packages (purchased packages)
CREATE TABLE IF NOT EXISTS customer_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    client_id INT NOT NULL,
    
    purchase_date DATE NOT NULL,
    expires_at DATE,
    amount_paid DECIMAL(10,2),
    sessions_remaining INT,
    
    status ENUM('active', 'expired', 'exhausted', 'cancelled') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (package_id) REFERENCES service_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Insert default category
INSERT IGNORE INTO service_categories (id, name, slug, description, active) VALUES 
(1, 'General', 'general', 'General services', TRUE);
