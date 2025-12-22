-- =============================================
-- Legal/Law Firm Industry Module
-- Tables: legal_clients, legal_cases, case_documents, billing, court_dates
-- =============================================

-- Legal Clients
CREATE TABLE IF NOT EXISTS legal_clients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id VARCHAR(50) UNIQUE,
    client_type ENUM('individual', 'company') DEFAULT 'individual',
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    notes TEXT,
    retainer_amount DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_client_id (client_id)
);

-- Legal Cases/Matters
CREATE TABLE IF NOT EXISTS legal_cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    client_id INT NOT NULL,
    case_type ENUM('civil', 'criminal', 'corporate', 'family', 'property', 'labour', 'tax', 'ip', 'other') DEFAULT 'civil',
    court_name VARCHAR(255),
    court_case_number VARCHAR(100),
    filing_date DATE,
    opposing_party VARCHAR(255),
    opposing_counsel VARCHAR(255),
    status ENUM('open', 'in_progress', 'pending', 'closed', 'won', 'lost', 'settled') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    description TEXT,
    assigned_lawyer INT,
    fee_type ENUM('fixed', 'hourly', 'contingency', 'retainer') DEFAULT 'fixed',
    estimated_fee DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_lawyer) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_case_number (case_number),
    INDEX idx_status (status)
);

-- Case Documents
CREATE TABLE IF NOT EXISTS case_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    document_type ENUM('petition', 'evidence', 'affidavit', 'order', 'judgment', 'correspondence', 'contract', 'other') DEFAULT 'other',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    file_size INT,
    uploaded_by INT,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Court Dates/Hearings
CREATE TABLE IF NOT EXISTS court_dates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    hearing_date DATE NOT NULL,
    hearing_time TIME,
    court_name VARCHAR(255),
    court_room VARCHAR(50),
    hearing_type ENUM('first_hearing', 'arguments', 'evidence', 'final_hearing', 'judgment', 'other') DEFAULT 'other',
    purpose TEXT,
    status ENUM('scheduled', 'completed', 'adjourned', 'cancelled') DEFAULT 'scheduled',
    outcome TEXT,
    next_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    INDEX idx_date (hearing_date)
);

-- Time Entries (for billing)
CREATE TABLE IF NOT EXISTS legal_time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL,
    description TEXT,
    rate DECIMAL(10,2),
    amount DECIMAL(12,2),
    is_billable BOOLEAN DEFAULT TRUE,
    is_billed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoices
CREATE TABLE IF NOT EXISTS legal_invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    case_id INT,
    invoice_date DATE DEFAULT (CURRENT_DATE),
    due_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE SET NULL
);
