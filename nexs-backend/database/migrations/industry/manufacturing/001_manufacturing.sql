-- =============================================
-- Manufacturing Industry Module
-- Tables: products, raw_materials, production_orders, work_orders, quality_checks, suppliers
-- =============================================

-- Raw Materials
CREATE TABLE IF NOT EXISTS raw_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'units',
    quantity DECIMAL(12,2) DEFAULT 0,
    min_stock_level DECIMAL(12,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,2),
    supplier_id INT,
    location VARCHAR(100),
    status ENUM('available', 'low_stock', 'out_of_stock') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sku (sku)
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    gst_number VARCHAR(50),
    payment_terms VARCHAR(100),
    rating INT DEFAULT 3,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Manufactured Products
CREATE TABLE IF NOT EXISTS manufactured_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'units',
    selling_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    stock_quantity DECIMAL(12,2) DEFAULT 0,
    min_stock_level DECIMAL(12,2) DEFAULT 0,
    bom JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sku (sku)
);

-- Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    status ENUM('planned', 'in_progress', 'on_hold', 'completed', 'cancelled') DEFAULT 'planned',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    planned_start DATE,
    planned_end DATE,
    actual_start DATETIME,
    actual_end DATETIME,
    produced_quantity DECIMAL(12,2) DEFAULT 0,
    rejected_quantity DECIMAL(12,2) DEFAULT 0,
    assigned_to INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES manufactured_products(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
);

-- Work Orders (sub-tasks of production)
CREATE TABLE IF NOT EXISTS work_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    production_order_id INT NOT NULL,
    operation_name VARCHAR(200) NOT NULL,
    sequence INT DEFAULT 1,
    workstation VARCHAR(100),
    planned_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    assigned_to INT,
    started_at DATETIME,
    completed_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Quality Checks
CREATE TABLE IF NOT EXISTS quality_checks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    production_order_id INT NOT NULL,
    check_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    inspector_id INT,
    sample_size INT,
    passed_quantity INT DEFAULT 0,
    failed_quantity INT DEFAULT 0,
    defect_type VARCHAR(200),
    status ENUM('pending', 'passed', 'failed', 'conditional') DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Material Movements
CREATE TABLE IF NOT EXISTS material_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    movement_type ENUM('purchase', 'consumption', 'adjustment', 'return') NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE CASCADE
);
