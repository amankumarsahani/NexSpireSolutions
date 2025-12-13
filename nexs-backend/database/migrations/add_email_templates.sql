-- Email Templates Table
-- Stores custom email templates that can be managed from admin panel

CREATE TABLE IF NOT EXISTS email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL COMMENT 'Template identifier e.g. inquiry-notification',
    subject VARCHAR(255) COMMENT 'Default email subject line',
    html_content TEXT NOT NULL COMMENT 'HTML template content',
    description VARCHAR(500) COMMENT 'Admin description of template purpose',
    variables JSON COMMENT 'Available template variables with descriptions',
    category ENUM('notification', 'marketing', 'transactional', 'system') DEFAULT 'notification',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default inquiry notification template
INSERT INTO email_templates (name, subject, html_content, description, variables, category) VALUES
(
    'inquiry-notification',
    '🔔 New Inquiry from {{name}}',
    '<div style="margin-bottom: 24px;">
    <h2 style="color: #1a1a2e; margin: 0 0 8px 0; font-size: 20px;">🔔 New Inquiry Received</h2>
    <p style="color: #64748b; margin: 0; font-size: 14px;">{{timestamp}}</p>
</div>

<div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Name:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">{{name}}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0;">
                <a href="mailto:{{email}}" style="color: #3b82f6; text-decoration: none;">{{email}}</a>
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Phone:</td>
            <td style="padding: 8px 0;">
                <a href="tel:{{phone}}" style="color: #3b82f6; text-decoration: none;">{{phone}}</a>
            </td>
        </tr>
        <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Company:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">{{company}}</td>
        </tr>
    </table>
</div>

<div style="margin-bottom: 24px;">
    <h3 style="color: #1a1a2e; margin: 0 0 12px 0; font-size: 16px;">Message</h3>
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{{message}}</p>
    </div>
</div>

<div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
    <a href="https://admin.nexspiresolutions.co.in/inquiries" 
       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
        View in Dashboard
    </a>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 12px;">Inquiry ID: #{{inquiryId}}</p>
</div>',
    'Notification sent to admin when a new contact inquiry is received',
    '["name", "email", "phone", "company", "message", "inquiryId", "timestamp"]',
    'notification'
);
