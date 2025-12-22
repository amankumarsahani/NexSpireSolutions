-- =============================================
-- Healthcare Industry Module
-- Tables: patients, medical_records, prescriptions, vital_signs
-- =============================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    allergies TEXT,
    chronic_conditions TEXT,
    insurance_provider VARCHAR(200),
    insurance_id VARCHAR(100),
    status ENUM('active', 'inactive', 'deceased') DEFAULT 'active',
    assigned_doctor INT,
    photo_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_doctor) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient_id (patient_id),
    INDEX idx_phone (phone),
    INDEX idx_status (status)
);

-- Medical Records (patient history)
CREATE TABLE IF NOT EXISTS medical_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    record_date DATE NOT NULL,
    record_type ENUM('consultation', 'lab_result', 'imaging', 'surgery', 'follow_up', 'emergency', 'other') DEFAULT 'consultation',
    chief_complaint TEXT,
    diagnosis TEXT,
    symptoms TEXT,
    examination_notes TEXT,
    treatment_given TEXT,
    lab_results JSON,
    attachments JSON,
    doctor_id INT,
    follow_up_date DATE,
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_date (record_date),
    INDEX idx_type (record_type)
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    record_id INT,
    prescription_date DATE DEFAULT (CURRENT_DATE),
    medicines JSON NOT NULL,
    instructions TEXT,
    dosage_notes TEXT,
    duration_days INT,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    prescribed_by INT,
    pharmacy_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE SET NULL,
    FOREIGN KEY (prescribed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_date (prescription_date),
    INDEX idx_status (status)
);

-- Vital Signs tracking
CREATE TABLE IF NOT EXISTS vital_signs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    temperature DECIMAL(4,1),
    respiratory_rate INT,
    oxygen_saturation INT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2),
    blood_sugar DECIMAL(5,2),
    notes TEXT,
    recorded_by INT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient_date (patient_id, recorded_at)
);

-- Patient Appointments (extends base appointments for healthcare)
CREATE TABLE IF NOT EXISTS patient_appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    appointment_type ENUM('consultation', 'follow_up', 'checkup', 'procedure', 'lab_test', 'imaging') DEFAULT 'consultation',
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    vital_signs_id INT,
    record_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_doctor (doctor_id),
    INDEX idx_date (appointment_date),
    INDEX idx_status (status)
);
