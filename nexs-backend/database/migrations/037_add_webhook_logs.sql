-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider VARCHAR(50) NOT NULL, -- stripe, razorpay
    event_type VARCHAR(100),
    payload JSON,
    status VARCHAR(20) DEFAULT 'received', -- received, processed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
