-- 1. Enhance legal_clients table
ALTER TABLE legal_clients
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'referral',
ADD COLUMN IF NOT EXISTS rating INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_billed DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS aadhar_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50) DEFAULT 'English',
ADD COLUMN IF NOT EXISTS communication_preference ENUM('email','phone','whatsapp','sms') DEFAULT 'phone';

-- 2. Enhance legal_cases table
ALTER TABLE legal_cases
ADD COLUMN IF NOT EXISTS priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS practice_area VARCHAR(100),
ADD COLUMN IF NOT EXISTS stage ENUM('intake','discovery','pre_trial','trial','settlement','appeal','closed') DEFAULT 'intake',
ADD COLUMN IF NOT EXISTS billable_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_billed DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS flat_fee DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS retainer_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS retainer_balance DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(255),
ADD COLUMN IF NOT EXISTS statute_of_limitations DATE,
ADD COLUMN IF NOT EXISTS conflict_check_date DATE,
ADD COLUMN IF NOT EXISTS conflict_check_notes TEXT,
ADD COLUMN IF NOT EXISTS conflict_cleared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS opened_date DATE,
ADD COLUMN IF NOT EXISTS closed_date DATE,
ADD COLUMN IF NOT EXISTS outcome ENUM('won','lost','settled','dismissed','withdrawn') NULL,
ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
ADD COLUMN IF NOT EXISTS contingency_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_expenses DECIMAL(15,2) DEFAULT 0;

-- 3. Create lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    lawyer_code VARCHAR(50) UNIQUE,
    bar_council_number VARCHAR(100),
    bar_council_state VARCHAR(100),
    enrollment_date DATE,
    practice_areas JSON,
    courts_practiced JSON,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    specialization VARCHAR(255),
    experience_years INT DEFAULT 0,
    cases_handled INT DEFAULT 0,
    cases_won INT DEFAULT 0,
    cases_lost INT DEFAULT 0,
    cases_settled INT DEFAULT 0,
    total_billed DECIMAL(15,2) DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    bio TEXT,
    education TEXT,
    certifications JSON,
    is_partner BOOLEAN DEFAULT FALSE,
    is_senior BOOLEAN DEFAULT FALSE,
    monthly_target DECIMAL(15,2) DEFAULT 0,
    status ENUM('active','inactive','on_leave','suspended') DEFAULT 'active',
    profile_photo VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lawyer_status (status),
    INDEX idx_lawyer_user (user_id)
);

-- 4. Create case_team table
CREATE TABLE IF NOT EXISTS case_team (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    role ENUM('lead_counsel','associate','junior','paralegal','clerk','intern') DEFAULT 'associate',
    hourly_rate DECIMAL(10,2),
    responsibility TEXT,
    assigned_date DATE,
    removed_date DATE,
    status ENUM('active','removed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE,
    INDEX idx_case_team_case (case_id),
    INDEX idx_case_team_lawyer (lawyer_id)
);

-- 5. Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    lawyer_id INT NOT NULL,
    client_id INT,
    entry_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours DECIMAL(5,2) NOT NULL,
    description TEXT NOT NULL,
    activity_type ENUM('research','drafting','court_appearance','client_meeting','phone_call','document_review','travel','administrative','other') DEFAULT 'other',
    billable BOOLEAN DEFAULT TRUE,
    billed BOOLEAN DEFAULT FALSE,
    approved BOOLEAN DEFAULT FALSE,
    approved_by INT,
    invoice_id INT,
    hourly_rate DECIMAL(10,2),
    amount DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE,
    INDEX idx_time_case (case_id),
    INDEX idx_time_lawyer (lawyer_id),
    INDEX idx_time_date (entry_date),
    INDEX idx_time_billed (billed)
);

-- 6. Create case_expenses table
CREATE TABLE IF NOT EXISTS case_expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    client_id INT,
    expense_date DATE NOT NULL,
    category ENUM('court_fees','filing_fees','travel','photocopying','courier','notary','expert_witness','investigation','other') DEFAULT 'other',
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2),
    billable BOOLEAN DEFAULT TRUE,
    billed BOOLEAN DEFAULT FALSE,
    invoice_id INT,
    receipt_url VARCHAR(500),
    vendor VARCHAR(255),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    reimbursable BOOLEAN DEFAULT FALSE,
    reimbursed BOOLEAN DEFAULT FALSE,
    created_by INT,
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    INDEX idx_expense_case (case_id),
    INDEX idx_expense_date (expense_date),
    INDEX idx_expense_billed (billed)
);

-- 7. Create legal_invoices table
CREATE TABLE IF NOT EXISTS legal_invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(50) UNIQUE,
    client_id INT NOT NULL,
    case_id INT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    billing_period_start DATE,
    billing_period_end DATE,
    subtotal DECIMAL(15,2) DEFAULT 0,
    time_charges DECIMAL(15,2) DEFAULT 0,
    expense_charges DECIMAL(15,2) DEFAULT 0,
    flat_fee_charges DECIMAL(15,2) DEFAULT 0,
    discount_type ENUM('percentage','amount') DEFAULT 'amount',
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    taxable_amount DECIMAL(15,2) DEFAULT 0,
    cgst_rate DECIMAL(5,2) DEFAULT 9,
    cgst_amount DECIMAL(15,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 9,
    sgst_amount DECIMAL(15,2) DEFAULT 0,
    igst_rate DECIMAL(5,2) DEFAULT 0,
    igst_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    status ENUM('draft','sent','viewed','paid','partial','overdue','cancelled','written_off') DEFAULT 'draft',
    payment_terms TEXT,
    notes TEXT,
    internal_notes TEXT,
    sent_at DATETIME,
    viewed_at DATETIME,
    paid_at DATETIME,
    reminder_count INT DEFAULT 0,
    last_reminder_at DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE SET NULL,
    INDEX idx_invoice_client (client_id),
    INDEX idx_invoice_case (case_id),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_date (invoice_date)
);

-- 8. Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    item_type ENUM('time','expense','flat_fee','retainer','adjustment','other') DEFAULT 'time',
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    rate DECIMAL(15,2) DEFAULT 0,
    amount DECIMAL(15,2) DEFAULT 0,
    time_entry_id INT,
    expense_id INT,
    taxable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES legal_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE SET NULL,
    FOREIGN KEY (expense_id) REFERENCES case_expenses(id) ON DELETE SET NULL,
    INDEX idx_item_invoice (invoice_id)
);

-- 9. Create legal_payments table
CREATE TABLE IF NOT EXISTS legal_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_number VARCHAR(50) UNIQUE,
    invoice_id INT,
    client_id INT NOT NULL,
    case_id INT,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash','cheque','bank_transfer','upi','card','demand_draft','online','other') DEFAULT 'bank_transfer',
    reference_number VARCHAR(100),
    bank_name VARCHAR(255),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    is_advance BOOLEAN DEFAULT FALSE,
    is_retainer BOOLEAN DEFAULT FALSE,
    notes TEXT,
    receipt_url VARCHAR(500),
    recorded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES legal_invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE SET NULL,
    INDEX idx_payment_client (client_id),
    INDEX idx_payment_invoice (invoice_id),
    INDEX idx_payment_date (payment_date)
);

-- 10. Enhance court_dates table
ALTER TABLE court_dates
ADD COLUMN IF NOT EXISTS judge_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS result TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS next_date DATE,
ADD COLUMN IF NOT EXISTS next_date_purpose VARCHAR(255),
ADD COLUMN IF NOT EXISTS attended_by JSON,
ADD COLUMN IF NOT EXISTS opposing_appeared BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS order_passed TEXT,
ADD COLUMN IF NOT EXISTS order_document_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_at DATETIME;

-- 11. Create legal_tasks table
CREATE TABLE IF NOT EXISTS legal_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_code VARCHAR(50) UNIQUE,
    case_id INT,
    client_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type ENUM('deadline','follow_up','filing','research','drafting','meeting','call','other') DEFAULT 'other',
    assigned_to INT,
    assigned_by INT,
    due_date DATE,
    due_time TIME,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    status ENUM('pending','in_progress','completed','cancelled','deferred') DEFAULT 'pending',
    reminder_date DATETIME,
    reminder_sent BOOLEAN DEFAULT FALSE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    started_at DATETIME,
    completed_at DATETIME,
    completion_notes TEXT,
    is_billable BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(100),
    parent_task_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE CASCADE,
    INDEX idx_task_case (case_id),
    INDEX idx_task_assigned (assigned_to),
    INDEX idx_task_due (due_date),
    INDEX idx_task_status (status)
);

-- 12. Create case_notes table
CREATE TABLE IF NOT EXISTS case_notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    note_type ENUM('general','hearing','meeting','call','research','strategy','client_instruction','internal') DEFAULT 'general',
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    related_hearing_id INT,
    attachments JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    INDEX idx_note_case (case_id),
    INDEX idx_note_type (note_type)
);

-- 13. Create case_activities table
CREATE TABLE IF NOT EXISTS case_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    activity_type ENUM('created','updated','status_change','stage_change','hearing_added','document_added','time_entry','expense','note','task','assignment','invoice','payment','communication') DEFAULT 'updated',
    description TEXT,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    metadata JSON,
    performed_by INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    INDEX idx_activity_case (case_id),
    INDEX idx_activity_date (performed_at)
);

-- 14. Create client_communications table
CREATE TABLE IF NOT EXISTS client_communications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    case_id INT,
    communication_type ENUM('email','call','meeting','video_call','letter','sms','whatsapp','in_person') DEFAULT 'call',
    direction ENUM('inbound','outbound') DEFAULT 'outbound',
    subject VARCHAR(255),
    content TEXT,
    summary TEXT,
    duration_minutes INT,
    participants JSON,
    outcome VARCHAR(255),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    attachments JSON,
    is_billable BOOLEAN DEFAULT FALSE,
    time_entry_id INT,
    communicated_by INT,
    communicated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE SET NULL,
    INDEX idx_comm_client (client_id),
    INDEX idx_comm_case (case_id),
    INDEX idx_comm_date (communicated_at)
);

-- 15. Create trust_accounts table
CREATE TABLE IF NOT EXISTS trust_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_number VARCHAR(50) UNIQUE,
    client_id INT NOT NULL,
    case_id INT,
    transaction_type ENUM('deposit','withdrawal','transfer_in','transfer_out','interest','fee_deduction','refund') DEFAULT 'deposit',
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    description TEXT,
    reference_number VARCHAR(100),
    payment_method VARCHAR(50),
    related_invoice_id INT,
    transaction_date DATE NOT NULL,
    bank_name VARCHAR(255),
    cheque_number VARCHAR(50),
    approved_by INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE SET NULL,
    INDEX idx_trust_client (client_id),
    INDEX idx_trust_date (transaction_date)
);

-- 16. Create opposing_parties table
CREATE TABLE IF NOT EXISTS opposing_parties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    party_type ENUM('individual','company','government','organization') DEFAULT 'individual',
    party_role ENUM('defendant','plaintiff','respondent','petitioner','accused','complainant','other') DEFAULT 'defendant',
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    counsel_name VARCHAR(255),
    counsel_firm VARCHAR(255),
    counsel_phone VARCHAR(20),
    counsel_email VARCHAR(255),
    counsel_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
    INDEX idx_opposing_case (case_id)
);

-- 17. Enhance case_documents table
ALTER TABLE case_documents
ADD COLUMN IF NOT EXISTS document_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_category ENUM('pleading','evidence','correspondence','contract','court_order','affidavit','motion','brief','discovery','other') DEFAULT 'other',
ADD COLUMN IF NOT EXISTS document_date DATE,
ADD COLUMN IF NOT EXISTS filed_date DATE,
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS file_size INT,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS tags JSON,
ADD COLUMN IF NOT EXISTS shared_with_client BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS uploaded_by INT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 18. Create document_templates table
CREATE TABLE IF NOT EXISTS legal_document_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    template_name VARCHAR(255) AS (name) STORED,
    template_code VARCHAR(50) UNIQUE,
    category ENUM('pleading','motion','contract','letter','affidavit','notice','agreement','other') DEFAULT 'other',
    practice_area VARCHAR(100),
    description TEXT,
    content LONGTEXT,
    variables JSON,
    header TEXT,
    footer TEXT,
    file_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_category (category)
);

-- Compatibility fix for legal_document_templates
-- Ensure 'name' exists (required by routes) and sync from 'template_name' (used in older migrations)
ALTER TABLE legal_document_templates ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER id;
ALTER TABLE legal_document_templates ADD COLUMN IF NOT EXISTS header TEXT AFTER variables;
ALTER TABLE legal_document_templates ADD COLUMN IF NOT EXISTS footer TEXT AFTER header;
UPDATE legal_document_templates SET name = template_name WHERE (name IS NULL OR name = '') AND (template_name IS NOT NULL AND template_name != '');
