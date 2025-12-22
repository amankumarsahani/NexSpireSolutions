-- =============================================
-- Fitness/Gym Industry Module
-- Tables: gym_members, gym_memberships, gym_classes, class_schedules, trainers, equipment
-- =============================================

-- Gym Memberships/Plans
CREATE TABLE IF NOT EXISTS gym_memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    duration_months INT DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gym Members
CREATE TABLE IF NOT EXISTS gym_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    membership_id INT,
    membership_start DATE,
    membership_end DATE,
    status ENUM('active', 'expired', 'suspended', 'cancelled') DEFAULT 'active',
    photo_url VARCHAR(500),
    health_conditions TEXT,
    fitness_goals TEXT,
    assigned_trainer INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (membership_id) REFERENCES gym_memberships(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_trainer) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_member_id (member_id),
    INDEX idx_status (status)
);

-- Gym Classes
CREATE TABLE IF NOT EXISTS gym_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    class_type ENUM('yoga', 'cardio', 'strength', 'hiit', 'dance', 'spin', 'pilates', 'martial_arts', 'swimming', 'other') DEFAULT 'other',
    duration_minutes INT DEFAULT 60,
    max_capacity INT DEFAULT 20,
    instructor_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Class Schedules
CREATE TABLE IF NOT EXISTS class_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    start_time TIME NOT NULL,
    end_time TIME,
    room VARCHAR(50),
    instructor_id INT,
    max_capacity INT DEFAULT 20,
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES gym_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Class Bookings
CREATE TABLE IF NOT EXISTS class_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    member_id INT NOT NULL,
    booking_date DATE NOT NULL,
    status ENUM('booked', 'attended', 'cancelled', 'no_show') DEFAULT 'booked',
    checked_in_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_booking (schedule_id, member_id, booking_date),
    FOREIGN KEY (schedule_id) REFERENCES class_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES gym_members(id) ON DELETE CASCADE
);

-- Equipment
CREATE TABLE IF NOT EXISTS gym_equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 1,
    status ENUM('available', 'maintenance', 'out_of_order') DEFAULT 'available',
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default memberships
INSERT INTO gym_memberships (name, duration_months, price) VALUES
('Monthly', 1, 1500.00),
('Quarterly', 3, 4000.00),
('Half Yearly', 6, 7500.00),
('Annual', 12, 12000.00)
ON DUPLICATE KEY UPDATE name = VALUES(name);
