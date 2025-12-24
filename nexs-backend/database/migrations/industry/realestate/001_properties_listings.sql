-- =============================================
-- Real Estate Industry Module
-- Tables: properties, listings, viewings, property_images
-- =============================================

-- Properties table (the actual property/building)
CREATE TABLE IF NOT EXISTS properties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    property_type ENUM('apartment', 'house', 'villa', 'plot', 'commercial', 'office', 'warehouse', 'shop') NOT NULL,
    transaction_type ENUM('sale', 'rent', 'lease') NOT NULL,
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    locality VARCHAR(150),
    landmark VARCHAR(200),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Property details
    bedrooms INT,
    bathrooms INT,
    balconies INT,
    floor_number INT,
    total_floors INT,
    carpet_area DECIMAL(10,2),
    built_up_area DECIMAL(10,2),
    plot_area DECIMAL(10,2),
    facing VARCHAR(20),
    furnishing ENUM('unfurnished', 'semi_furnished', 'fully_furnished'),
    age_of_property VARCHAR(30),
    
    -- Pricing
    price DECIMAL(15,2) NOT NULL,
    price_per_sqft DECIMAL(10,2),
    maintenance_charges DECIMAL(10,2),
    security_deposit DECIMAL(15,2),
    price_negotiable BOOLEAN DEFAULT TRUE,
    
    -- Amenities (JSON array)
    amenities JSON,
    
    -- Details
    description TEXT,
    features TEXT,
    
    -- Status
    status ENUM('available', 'sold', 'rented', 'under_offer', 'coming_soon', 'archived') DEFAULT 'available',
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Owner/Agent info
    owner_name VARCHAR(150),
    owner_phone VARCHAR(20),
    owner_email VARCHAR(150),
    assigned_agent INT,
    
    -- Lead tracking
    lead_id INT,
    client_id INT,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) UNIQUE,
    
    -- Media count (computed)
    images_count INT DEFAULT 0,
    videos_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_agent) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_type (property_type),
    INDEX idx_city (city),
    INDEX idx_price (price),
    INDEX idx_transaction (transaction_type)
);

-- Property images
CREATE TABLE IF NOT EXISTS property_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_property (property_id)
);

-- Listings (property posted on portals like 99acres, MagicBricks)
CREATE TABLE IF NOT EXISTS listings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    portal VARCHAR(50) NOT NULL,
    portal_listing_id VARCHAR(100),
    listing_url VARCHAR(500),
    status ENUM('active', 'paused', 'expired', 'removed') DEFAULT 'active',
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    views INT DEFAULT 0,
    inquiries INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_property (property_id),
    INDEX idx_portal (portal)
);

-- Viewings/Site visits
CREATE TABLE IF NOT EXISTS viewings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    lead_id INT,
    client_id INT,
    
    -- Visitor info
    visitor_name VARCHAR(150) NOT NULL,
    visitor_phone VARCHAR(20),
    visitor_email VARCHAR(150),
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    duration_minutes INT DEFAULT 30,
    
    -- Status
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    
    -- Follow-up
    feedback TEXT,
    interest_level ENUM('not_interested', 'maybe', 'interested', 'very_interested'),
    follow_up_notes TEXT,
    follow_up_date DATE,
    
    -- Assigned agent
    agent_id INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_property (property_id),
    INDEX idx_date (scheduled_date),
    INDEX idx_status (status)
);

-- Property inquiries (quick inquiries from portals/website)
CREATE TABLE IF NOT EXISTS property_inquiries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    
    -- Contact info
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    message TEXT,
    
    -- Source
    source VARCHAR(50),
    portal VARCHAR(50),
    
    -- Status
    status ENUM('new', 'contacted', 'viewing_scheduled', 'negotiating', 'closed', 'not_interested') DEFAULT 'new',
    
    -- Conversion tracking
    converted_to_lead BOOLEAN DEFAULT FALSE,
    lead_id INT,
    
    -- Assigned
    assigned_to INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_property (property_id),
    INDEX idx_status (status)
);

-- Insert default property amenities for reference
INSERT INTO settings (setting_key, setting_value, category) VALUES
('property_amenities', '["Lift", "Power Backup", "Security", "Parking", "Club House", "Gym", "Swimming Pool", "Park", "CCTV", "Fire Safety", "Water Supply", "Gas Pipeline", "Solar Panels", "Rain Water Harvesting"]', 'realestate')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
