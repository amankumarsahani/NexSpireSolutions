-- Document Templates Table
-- Stores reusable document templates with liquid variables

CREATE TABLE IF NOT EXISTS document_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category ENUM('sales', 'legal', 'finance', 'operations') DEFAULT 'sales',
    content LONGTEXT NOT NULL,
    variables JSON,
    isActive BOOLEAN DEFAULT TRUE,
    isDefault BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Pre-populate with default templates
INSERT INTO document_templates (name, slug, description, category, content, variables, isDefault) VALUES

-- Discovery Call Template
('Discovery Call Notes', 'discovery-call', 'Template for documenting discovery call conversations', 'sales',
'<div style="font-family: Segoe UI, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #4f46e5; margin: 0;">Discovery Call Notes</h1>
        <p style="color: #64748b;">{{company_name}} | {{date}}</p>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">Client Information</h3>
        <table style="width: 100%;">
            <tr><td style="color: #64748b; padding: 5px 0;">Contact Name:</td><td style="font-weight: 600;">{{contact_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 5px 0;">Email:</td><td>{{email}}</td></tr>
            <tr><td style="color: #64748b; padding: 5px 0;">Phone:</td><td>{{phone}}</td></tr>
            <tr><td style="color: #64748b; padding: 5px 0;">Company:</td><td>{{company_name}}</td></tr>
        </table>
    </div>
    
    <h3 style="color: #1e293b;">Key Discussion Points</h3>
    <p>{{discussion_points}}</p>
    
    <h3 style="color: #1e293b;">Pain Points Identified</h3>
    <p>{{pain_points}}</p>
    
    <h3 style="color: #1e293b;">Requirements & Goals</h3>
    <p>{{requirements}}</p>
    
    <h3 style="color: #1e293b;">Budget Range</h3>
    <p>{{budget}}</p>
    
    <h3 style="color: #1e293b;">Timeline</h3>
    <p>{{timeline}}</p>
    
    <h3 style="color: #1e293b;">Next Steps</h3>
    <p>{{next_steps}}</p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    <p style="color: #64748b; font-size: 12px; text-align: center;">
        Prepared by Nexspire Solutions | {{date}}
    </p>
</div>',
'["contact_name", "email", "phone", "company_name", "date", "discussion_points", "pain_points", "requirements", "budget", "timeline", "next_steps"]',
TRUE),

-- Proposal Template
('Project Proposal', 'proposal', 'Professional project proposal template', 'sales',
'<div style="font-family: Segoe UI, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 32px;">Project Proposal</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Prepared for {{company_name}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Executive Summary</h2>
        <p style="color: #475569; line-height: 1.8;">{{executive_summary}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Project Scope</h2>
        <p style="color: #475569; line-height: 1.8;">{{project_scope}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Deliverables</h2>
        <p style="color: #475569; line-height: 1.8;">{{deliverables}}</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Investment</h2>
        <div style="font-size: 36px; color: #4f46e5; font-weight: 700; margin: 20px 0;">{{total_cost}}</div>
        <p style="color: #64748b;">{{payment_terms}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Timeline</h2>
        <p style="color: #475569; line-height: 1.8;">{{project_timeline}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Why Choose Us</h2>
        <p style="color: #475569; line-height: 1.8;">{{why_us}}</p>
    </div>
    
    <div style="background: #ecfdf5; padding: 30px; border-radius: 12px; text-align: center;">
        <h3 style="color: #059669; margin-top: 0;">Ready to Get Started?</h3>
        <p style="color: #047857;">Contact us at {{our_email}} or reply to this email to proceed.</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Nexspire Solutions | Proposal Valid Until: {{valid_until}}
    </p>
</div>',
'["contact_name", "company_name", "executive_summary", "project_scope", "deliverables", "total_cost", "payment_terms", "project_timeline", "why_us", "our_email", "valid_until"]',
TRUE),

-- Onboarding Document
('Client Onboarding Document', 'onboarding', 'Welcome and onboarding instructions for new clients', 'operations',
'<div style="font-family: Segoe UI, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 32px;">Welcome Aboard!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Hi {{contact_name}}, we are thrilled to have you!</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Getting Started</h2>
        <p style="color: #475569; line-height: 1.8;">Welcome to Nexspire Solutions! We are excited to begin our partnership with {{company_name}}. This document will guide you through our onboarding process.</p>
    </div>
    
    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">Your Project Details</h3>
        <table style="width: 100%;">
            <tr><td style="color: #64748b; padding: 8px 0;">Project:</td><td style="font-weight: 600;">{{project_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Start Date:</td><td>{{start_date}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Your Account Manager:</td><td>{{account_manager}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Contact Email:</td><td>{{manager_email}}</td></tr>
        </table>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">What We Need From You</h2>
        <p style="color: #475569; line-height: 1.8;">{{requirements_from_client}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Next Steps</h2>
        <p style="color: #475569; line-height: 1.8;">{{next_steps}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Communication</h2>
        <p style="color: #475569; line-height: 1.8;">{{communication_channels}}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
        <h4 style="color: #92400e; margin-top: 0;">Quick Tip</h4>
        <p style="color: #78350f; margin-bottom: 0;">Save this email for future reference. You can always reach out to us at {{support_email}} for any questions.</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Nexspire Solutions | Lets build something amazing together!
    </p>
</div>',
'["contact_name", "company_name", "project_name", "start_date", "account_manager", "manager_email", "requirements_from_client", "next_steps", "communication_channels", "support_email"]',
TRUE),

-- NDA Template
('Non-Disclosure Agreement', 'nda', 'Standard NDA for confidential information protection', 'legal',
'<div style="font-family: Segoe UI, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1e293b; margin: 0;">NON-DISCLOSURE AGREEMENT</h1>
        <p style="color: #64748b;">Confidential Information Protection</p>
    </div>
    
    <p style="color: #475569; line-height: 1.8;">
        This Non-Disclosure Agreement (Agreement) is entered into as of <strong>{{effective_date}}</strong> by and between:
    </p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Disclosing Party:</strong> Nexspire Solutions</p>
        <p style="margin: 10px 0 0;"><strong>Receiving Party:</strong> {{company_name}} ({{contact_name}})</p>
    </div>
    
    <h3 style="color: #1e293b;">1. Purpose</h3>
    <p style="color: #475569; line-height: 1.8;">{{purpose}}</p>
    
    <h3 style="color: #1e293b;">2. Definition of Confidential Information</h3>
    <p style="color: #475569; line-height: 1.8;">
        Confidential Information means any non-public information disclosed by either party, including but not limited to business plans, technical data, trade secrets, customer information, and financial information.
    </p>
    
    <h3 style="color: #1e293b;">3. Obligations</h3>
    <p style="color: #475569; line-height: 1.8;">
        The Receiving Party agrees to: (a) hold Confidential Information in strict confidence; (b) not disclose to third parties without prior written consent; (c) use Confidential Information only for the Purpose stated above.
    </p>
    
    <h3 style="color: #1e293b;">4. Term</h3>
    <p style="color: #475569; line-height: 1.8;">
        This Agreement shall remain in effect for a period of <strong>{{term_years}} years</strong> from the Effective Date.
    </p>
    
    <h3 style="color: #1e293b;">5. Return of Information</h3>
    <p style="color: #475569; line-height: 1.8;">
        Upon termination or request, the Receiving Party shall promptly return or destroy all Confidential Information.
    </p>
    
    <div style="margin-top: 50px;">
        <div style="display: inline-block; width: 45%;">
            <p style="border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 60px;">
                <strong>Nexspire Solutions</strong><br>
                <span style="color: #64748b;">Date: {{effective_date}}</span>
            </p>
        </div>
        <div style="display: inline-block; width: 45%; margin-left: 8%;">
            <p style="border-top: 1px solid #1e293b; padding-top: 10px; margin-top: 60px;">
                <strong>{{company_name}}</strong><br>
                <span style="color: #64748b;">Date: _______________</span>
            </p>
        </div>
    </div>
</div>',
'["contact_name", "company_name", "effective_date", "purpose", "term_years"]',
TRUE),

-- Invoice Template
('Invoice', 'invoice', 'Professional invoice template', 'finance',
'<div style="font-family: Segoe UI, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
    <div style="margin-bottom: 40px;">
        <div style="float: left;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">INVOICE</h1>
            <p style="color: #64748b; margin: 5px 0;">Invoice #: {{invoice_number}}</p>
            <p style="color: #64748b; margin: 5px 0;">Date: {{invoice_date}}</p>
            <p style="color: #64748b; margin: 5px 0;">Due Date: {{due_date}}</p>
        </div>
        <div style="float: right; text-align: right;">
            <h2 style="color: #1e293b; margin: 0;">Nexspire Solutions</h2>
            <p style="color: #64748b; margin: 5px 0;">{{our_address}}</p>
            <p style="color: #64748b; margin: 5px 0;">{{our_email}}</p>
        </div>
        <div style="clear: both;"></div>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h4 style="color: #64748b; margin: 0 0 10px; font-size: 12px; text-transform: uppercase;">Bill To</h4>
        <p style="margin: 0; font-weight: 600; color: #1e293b;">{{contact_name}}</p>
        <p style="margin: 5px 0; color: #475569;">{{company_name}}</p>
        <p style="margin: 5px 0; color: #475569;">{{client_email}}</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
            <tr style="background: #4f46e5; color: white;">
                <th style="padding: 12px; text-align: left;">Description</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Rate</th>
                <th style="padding: 12px; text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 15px 12px;">{{item_description}}</td>
                <td style="padding: 15px 12px; text-align: center;">{{quantity}}</td>
                <td style="padding: 15px 12px; text-align: right;">{{rate}}</td>
                <td style="padding: 15px 12px; text-align: right;">{{amount}}</td>
            </tr>
        </tbody>
    </table>
    
    <div style="text-align: right;">
        <div style="width: 250px; display: inline-block; text-align: left;">
            <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #64748b;">Subtotal:</span>
                <span style="float: right;">{{subtotal}}</span>
            </div>
            <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #64748b;">Tax ({{tax_rate}}):</span>
                <span style="float: right;">{{tax_amount}}</span>
            </div>
            <div style="padding: 12px 0; font-size: 18px; font-weight: 700; color: #4f46e5;">
                <span>Total:</span>
                <span style="float: right;">{{total_amount}}</span>
            </div>
        </div>
    </div>
    
    <div style="margin-top: 40px; padding: 20px; background: #ecfdf5; border-radius: 8px;">
        <h4 style="color: #059669; margin: 0 0 10px;">Payment Instructions</h4>
        <p style="color: #047857; margin: 0;">{{payment_instructions}}</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Thank you for your business! | Nexspire Solutions
    </p>
</div>',
'["invoice_number", "invoice_date", "due_date", "our_address", "our_email", "contact_name", "company_name", "client_email", "item_description", "quantity", "rate", "amount", "subtotal", "tax_rate", "tax_amount", "total_amount", "payment_instructions"]',
TRUE),

-- Offboarding Document
('Project Completion & Offboarding', 'offboarding', 'Project completion summary and handover document', 'operations',
'<div style="font-family: Segoe UI, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 40px;">
        <h1 style="margin: 0; font-size: 32px;">Project Complete!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Congratulations, {{contact_name}}!</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Project Summary</h2>
        <p style="color: #475569; line-height: 1.8;">We are pleased to inform you that your project with Nexspire Solutions has been successfully completed.</p>
    </div>
    
    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-top: 0;">Project Details</h3>
        <table style="width: 100%;">
            <tr><td style="color: #64748b; padding: 8px 0;">Project Name:</td><td style="font-weight: 600;">{{project_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Client:</td><td>{{company_name}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Start Date:</td><td>{{start_date}}</td></tr>
            <tr><td style="color: #64748b; padding: 8px 0;">Completion Date:</td><td>{{completion_date}}</td></tr>
        </table>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Deliverables Completed</h2>
        <p style="color: #475569; line-height: 1.8;">{{deliverables_completed}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Handover Items</h2>
        <p style="color: #475569; line-height: 1.8;">{{handover_items}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Access & Credentials</h2>
        <p style="color: #475569; line-height: 1.8;">{{access_credentials}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1e293b;">Ongoing Support</h2>
        <p style="color: #475569; line-height: 1.8;">{{support_details}}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h4 style="color: #92400e; margin: 0 0 10px;">We Value Your Feedback!</h4>
        <p style="color: #78350f; margin: 0;">Please take a moment to share your experience. Your feedback helps us improve!</p>
    </div>
    
    <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; text-align: center;">
        <h3 style="color: #059669; margin-top: 0;">Thank You for Choosing Nexspire Solutions!</h3>
        <p style="color: #047857; margin-bottom: 0;">We hope to work with you again in the future. Contact us anytime at {{support_email}}</p>
    </div>
</div>',
'["contact_name", "company_name", "project_name", "start_date", "completion_date", "deliverables_completed", "handover_items", "access_credentials", "support_details", "support_email"]',
TRUE);
