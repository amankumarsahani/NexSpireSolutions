-- =============================================
-- Salon/Spa Industry Module
-- Tables: services, service_categories, staff, appointments, packages, products
-- =============================================

-- Service Categories
CREATE TABLE IF NOT EXISTS salon_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salon Services
CREATE TABLE IF NOT EXISTS salon_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    price DECIMAL(10,2) NOT NULL,
    member_price DECIMAL(10,2),
    gender ENUM('male', 'female', 'unisex') DEFAULT 'unisex',
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES salon_categories(id) ON DELETE SET NULL
);

-- Staff/Stylists
CREATE TABLE IF NOT EXISTS salon_staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    role ENUM('stylist', 'beautician', 'therapist', 'barber', 'manager', 'receptionist') DEFAULT 'stylist',
    specializations JSON,
    experience_years INT,
    photo_url VARCHAR(500),
    bio TEXT,
    status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active',
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    joining_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_staff_id (staff_id)
);

-- Staff Working Hours
CREATE TABLE IF NOT EXISTS staff_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (staff_id) REFERENCES salon_staff(id) ON DELETE CASCADE
);

-- Salon Appointments
CREATE TABLE IF NOT EXISTS salon_appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_number VARCHAR(50) UNIQUE,
    client_id INT,
    client_name VARCHAR(200),
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    staff_id INT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status ENUM('booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'booked',
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_status ENUM('pending', 'paid', 'partial') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES salon_staff(id) ON DELETE SET NULL,
    INDEX idx_date (appointment_date),
    INDEX idx_status (status)
);

-- Appointment Services
CREATE TABLE IF NOT EXISTS appointment_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    service_id INT,
    service_name VARCHAR(200),
    duration_minutes INT,
    price DECIMAL(10,2),
    staff_id INT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    FOREIGN KEY (appointment_id) REFERENCES salon_appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES salon_services(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES salon_staff(id) ON DELETE SET NULL
);

-- Service Packages
CREATE TABLE IF NOT EXISTS salon_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    services JSON,
    regular_price DECIMAL(10,2),
    package_price DECIMAL(10,2) NOT NULL,
    validity_days INT DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Retail Products
CREATE TABLE IF NOT EXISTS salon_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    stock INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Memberships
CREATE TABLE IF NOT EXISTS salon_memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    validity_months INT DEFAULT 12,
    price DECIMAL(10,2) NOT NULL,
    discount_percent INT DEFAULT 10,
    free_services JSON,
    benefits TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
