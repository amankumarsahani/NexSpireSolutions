-- Legal enquiry intake + consultation scheduling.
--
-- SQL mirror of nexcrm-backend/database/migrations/legal/005_legal_enquiries.js.
-- The provisioner only executes .sql files, so a tenant provisioned without this
-- file has no legal_enquiries table and every website enquiry 500s at
-- POST /api/public/legal/enquiry. Keep the two files in step.
--
-- legal_enquiries is the front door: website form, WhatsApp, phone and walk-in all
-- land here before anyone decides the matter is worth a case file. It deliberately
-- does not reuse core `leads` — legal intake carries case_type, urgency and a
-- first-response SLA the generic lead pipeline has no room for.
--
-- first_response_at is the SLA clock: stamped once, never cleared.
-- sla_alerted_at exists so a breach alerts once rather than on every poll.

CREATE TABLE IF NOT EXISTS legal_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_ref VARCHAR(50) UNIQUE DEFAULT NULL,

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,

    case_type VARCHAR(100) DEFAULT NULL,
    description TEXT,
    urgency ENUM('low','normal','high','urgent') DEFAULT 'normal',

    source ENUM('website','whatsapp','phone','walkin','referral','other') DEFAULT 'website',
    source_detail VARCHAR(255) DEFAULT NULL,

    status ENUM('new','contacted','qualified','consultation_scheduled','converted','lost','spam')
        DEFAULT 'new',
    lost_reason VARCHAR(255) DEFAULT NULL,

    assigned_to INT DEFAULT NULL,
    assigned_at TIMESTAMP NULL DEFAULT NULL,

    first_response_at TIMESTAMP NULL DEFAULT NULL,
    sla_alerted_at TIMESTAMP NULL DEFAULT NULL,

    converted_client_id INT DEFAULT NULL,
    converted_case_id INT DEFAULT NULL,
    converted_at TIMESTAMP NULL DEFAULT NULL,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_le_status (status),
    INDEX idx_le_source (source),
    INDEX idx_le_assigned (assigned_to),
    INDEX idx_le_created (created_at),
    INDEX idx_le_phone (phone),
    INDEX idx_le_email (email),
    -- Drives the alert worker's hot query: unanswered, un-alerted, oldest first.
    INDEX idx_le_sla (status, first_response_at, created_at),

    CONSTRAINT fk_le_client FOREIGN KEY (converted_client_id)
        REFERENCES legal_clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_le_case FOREIGN KEY (converted_case_id)
        REFERENCES legal_cases(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- The paid/unpaid first meeting. Court hearings stay in court_dates; the two are
-- not the same thing and must not be merged.
CREATE TABLE IF NOT EXISTS legal_consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT DEFAULT NULL,
    client_id INT DEFAULT NULL,
    case_id INT DEFAULT NULL,
    lawyer_id INT DEFAULT NULL,

    scheduled_at DATETIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    mode ENUM('in_person','phone','video') DEFAULT 'in_person',
    location VARCHAR(255) DEFAULT NULL,

    status ENUM('scheduled','completed','no_show','cancelled','rescheduled')
        DEFAULT 'scheduled',

    fee DECIMAL(10,2) DEFAULT 0,
    fee_status ENUM('none','pending','paid','waived') DEFAULT 'none',

    agenda TEXT,
    outcome TEXT,
    notes TEXT,

    reminder_sent_at TIMESTAMP NULL DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_lcon_enquiry (enquiry_id),
    INDEX idx_lcon_client (client_id),
    INDEX idx_lcon_lawyer (lawyer_id),
    INDEX idx_lcon_status (status),
    INDEX idx_lcon_scheduled (scheduled_at),
    -- Reminder sweep: upcoming, not yet reminded.
    INDEX idx_lcon_reminder (status, scheduled_at, reminder_sent_at),

    CONSTRAINT fk_lcon_enquiry FOREIGN KEY (enquiry_id)
        REFERENCES legal_enquiries(id) ON DELETE SET NULL,
    CONSTRAINT fk_lcon_client FOREIGN KEY (client_id)
        REFERENCES legal_clients(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Enquiry-sourced clients need a back-pointer for funnel reporting.
ALTER TABLE legal_clients
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS enquiry_id INT DEFAULT NULL;
