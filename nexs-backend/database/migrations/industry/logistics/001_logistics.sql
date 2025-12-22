-- =============================================
-- Logistics/Transport Industry Module
-- Tables: vehicles, drivers, shipments, routes, warehouses
-- =============================================

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type ENUM('truck', 'van', 'pickup', 'trailer', 'container', 'bike', 'other') DEFAULT 'truck',
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    capacity_kg DECIMAL(10,2),
    capacity_volume DECIMAL(10,2),
    fuel_type ENUM('diesel', 'petrol', 'cng', 'electric', 'hybrid') DEFAULT 'diesel',
    status ENUM('available', 'in_transit', 'maintenance', 'retired') DEFAULT 'available',
    current_driver_id INT,
    insurance_expiry DATE,
    fitness_expiry DATE,
    permit_expiry DATE,
    gps_device_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vehicle_number (vehicle_number),
    INDEX idx_status (status)
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    license_type VARCHAR(50),
    license_expiry DATE,
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    status ENUM('available', 'on_trip', 'off_duty', 'terminated') DEFAULT 'available',
    current_vehicle_id INT,
    joining_date DATE,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_driver_id (driver_id),
    INDEX idx_status (status)
);

-- Warehouses/Locations
CREATE TABLE IF NOT EXISTS warehouses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    contact_person VARCHAR(200),
    phone VARCHAR(20),
    capacity DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT,
    origin_warehouse_id INT,
    destination_address TEXT,
    destination_city VARCHAR(100),
    destination_state VARCHAR(100),
    destination_pincode VARCHAR(10),
    receiver_name VARCHAR(200),
    receiver_phone VARCHAR(20),
    shipment_type ENUM('ftl', 'ltl', 'parcel', 'express', 'bulk') DEFAULT 'ftl',
    weight DECIMAL(10,2),
    volume DECIMAL(10,2),
    packages INT DEFAULT 1,
    vehicle_id INT,
    driver_id INT,
    status ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled') DEFAULT 'pending',
    priority ENUM('normal', 'express', 'same_day') DEFAULT 'normal',
    pickup_date DATE,
    expected_delivery DATE,
    actual_delivery DATETIME,
    freight_charges DECIMAL(10,2),
    other_charges DECIMAL(10,2),
    total_charges DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'partial') DEFAULT 'pending',
    pod_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (origin_warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    INDEX idx_shipment_number (shipment_number),
    INDEX idx_status (status)
);

-- Shipment Tracking
CREATE TABLE IF NOT EXISTS shipment_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shipment_id INT NOT NULL,
    status VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    notes TEXT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
    INDEX idx_shipment (shipment_id)
);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    origin_id INT,
    destination_id INT,
    distance_km DECIMAL(10,2),
    estimated_hours DECIMAL(6,2),
    toll_charges DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (origin_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_id) REFERENCES warehouses(id) ON DELETE SET NULL
);
