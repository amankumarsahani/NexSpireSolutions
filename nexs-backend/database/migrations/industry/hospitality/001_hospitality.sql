-- =============================================
-- Hospitality Industry Module
-- Tables: room_types, rooms, guests, reservations, housekeeping_tasks
-- =============================================

-- Room Types/Categories
CREATE TABLE IF NOT EXISTS room_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    max_occupancy INT DEFAULT 2,
    amenities JSON,
    images JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code)
);

-- Rooms inventory
CREATE TABLE IF NOT EXISTS rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    room_type_id INT,
    floor INT,
    status ENUM('available', 'occupied', 'maintenance', 'cleaning', 'blocked') DEFAULT 'available',
    current_reservation_id INT,
    features JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
    INDEX idx_room_number (room_number),
    INDEX idx_status (status),
    INDEX idx_type (room_type_id)
);

-- Guests
CREATE TABLE IF NOT EXISTS guests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guest_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(100),
    id_type ENUM('passport', 'aadhar', 'driving_license', 'voter_id', 'other') DEFAULT 'aadhar',
    id_number VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    company VARCHAR(200),
    is_vip BOOLEAN DEFAULT FALSE,
    preferences TEXT,
    visit_count INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    loyalty_points INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guest_id (guest_id),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
);

-- Reservations/Bookings
CREATE TABLE IF NOT EXISTS reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_number VARCHAR(50) UNIQUE NOT NULL,
    guest_id INT NOT NULL,
    room_id INT,
    room_type_id INT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    actual_check_in DATETIME,
    actual_check_out DATETIME,
    adults INT DEFAULT 1,
    children INT DEFAULT 0,
    status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show') DEFAULT 'pending',
    source ENUM('direct', 'website', 'ota', 'phone', 'walk_in', 'agent') DEFAULT 'direct',
    rate_per_night DECIMAL(10,2) NOT NULL,
    total_nights INT,
    subtotal DECIMAL(10,2),
    taxes DECIMAL(10,2) DEFAULT 0,
    additional_charges DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2),
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    amount_paid DECIMAL(10,2) DEFAULT 0,
    special_requests TEXT,
    internal_notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reservation_number (reservation_number),
    INDEX idx_guest (guest_id),
    INDEX idx_room (room_id),
    INDEX idx_dates (check_in_date, check_out_date),
    INDEX idx_status (status)
);

-- Housekeeping Tasks
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    task_type ENUM('checkout_cleaning', 'stayover_cleaning', 'deep_cleaning', 'maintenance', 'inspection', 'turndown') DEFAULT 'checkout_cleaning',
    status ENUM('pending', 'in_progress', 'completed', 'verified') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    assigned_to INT,
    scheduled_date DATE,
    scheduled_time TIME,
    started_at DATETIME,
    completed_at DATETIME,
    verified_by INT,
    notes TEXT,
    issues_found TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room (room_id),
    INDEX idx_status (status),
    INDEX idx_date (scheduled_date),
    INDEX idx_assigned (assigned_to)
);

-- Insert default room types
INSERT INTO room_types (name, code, base_price, max_occupancy, description) VALUES
('Standard Room', 'STD', 2500.00, 2, 'Comfortable standard room with basic amenities'),
('Deluxe Room', 'DLX', 4000.00, 2, 'Spacious deluxe room with city view'),
('Suite', 'STE', 7500.00, 3, 'Luxury suite with living area'),
('Family Room', 'FAM', 5500.00, 4, 'Perfect for families with extra space')
ON DUPLICATE KEY UPDATE name = VALUES(name);
