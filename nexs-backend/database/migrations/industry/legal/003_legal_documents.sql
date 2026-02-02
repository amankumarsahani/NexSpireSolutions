-- Legal Document Templates Migration
-- Creates tables for legal document template management

-- 1. Legal Document Templates table
CREATE TABLE IF NOT EXISTS legal_document_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('agreement', 'notice', 'petition', 'affidavit', 'power_of_attorney', 'letter', 'court_filing', 'deed', 'will', 'other') DEFAULT 'other',
    content LONGTEXT NOT NULL,
    variables JSON COMMENT 'List of variables used in template',
    header TEXT COMMENT 'Header HTML/text for printed documents',
    footer TEXT COMMENT 'Footer HTML/text for printed documents',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Generated Legal Documents table
CREATE TABLE IF NOT EXISTS generated_legal_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT,
    case_id INT,
    client_id INT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    variables_used JSON COMMENT 'Variables substituted in this document',
    generated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES legal_document_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES legal_clients(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_case (case_id),
    INDEX idx_client (client_id),
    INDEX idx_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insert sample legal document templates
INSERT INTO legal_document_templates (name, description, category, content, variables) VALUES

('Legal Notice', 'General legal notice template', 'notice', 
'<div style="font-family: Georgia, serif; padding: 40px;">
<h1 style="text-align: center; text-decoration: underline;">LEGAL NOTICE</h1>

<p style="text-align: right;">Date: {{current_date}}</p>

<p><strong>To,</strong><br>
{{recipient_name}}<br>
{{recipient_address}}</p>

<p><strong>Subject:</strong> {{subject}}</p>

<p>Dear Sir/Madam,</p>

<p>Under instructions from and on behalf of my client <strong>{{client_name}}</strong>, residing at {{client_address}}, I hereby serve upon you the following legal notice:</p>

<div style="margin: 20px 0; padding: 20px; border-left: 3px solid #333;">
{{notice_content}}
</div>

<p>You are hereby called upon to {{demand_action}} within {{days_to_respond}} days from the date of receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you at your risk, cost, and consequences.</p>

<p>This notice is being issued without prejudice to any other legal remedies available to my client.</p>

<p style="margin-top: 40px;">
Yours faithfully,<br><br>
{{lawyer_name}}<br>
Advocate<br>
On behalf of {{client_name}}
</p>
</div>',
'["recipient_name", "recipient_address", "subject", "client_name", "client_address", "notice_content", "demand_action", "days_to_respond", "lawyer_name"]'),

('Power of Attorney', 'General Power of Attorney template', 'power_of_attorney',
'<div style="font-family: Georgia, serif; padding: 40px;">
<h1 style="text-align: center; text-decoration: underline;">GENERAL POWER OF ATTORNEY</h1>

<p>KNOW ALL MEN BY THESE PRESENTS THAT:</p>

<p>I, <strong>{{principal_name}}</strong>, aged {{principal_age}} years, S/o/D/o/W/o {{principal_parent}}, residing at {{principal_address}} (hereinafter referred to as the "Principal"), do hereby appoint and constitute:</p>

<p><strong>{{attorney_name}}</strong>, aged {{attorney_age}} years, S/o/D/o/W/o {{attorney_parent}}, residing at {{attorney_address}} (hereinafter referred to as the "Attorney"),</p>

<p>as my true and lawful Attorney to do and execute all or any of the following acts, deeds, and things, namely:</p>

<ol style="margin: 20px 0;">
{{powers_list}}
</ol>

<p>AND I do hereby agree and declare that all acts, deeds, and things lawfully done by my said Attorney shall be construed and held to be as if I had done the same.</p>

<p>IN WITNESS WHEREOF, I have hereunto set my hand on this {{current_date}}.</p>

<div style="margin-top: 50px; display: flex; justify-content: space-between;">
<div>
<p>_________________________<br>
PRINCIPAL<br>
({{principal_name}})</p>
</div>
<div>
<p>WITNESSES:<br><br>
1. _________________________<br>
2. _________________________</p>
</div>
</div>
</div>',
'["principal_name", "principal_age", "principal_parent", "principal_address", "attorney_name", "attorney_age", "attorney_parent", "attorney_address", "powers_list"]'),

('Affidavit', 'General Affidavit template', 'affidavit',
'<div style="font-family: Georgia, serif; padding: 40px;">
<h1 style="text-align: center; text-decoration: underline;">AFFIDAVIT</h1>

<p>I, <strong>{{deponent_name}}</strong>, aged {{deponent_age}} years, S/o/D/o/W/o {{deponent_parent}}, occupation {{deponent_occupation}}, residing at {{deponent_address}}, do hereby solemnly affirm and state as under:</p>

<ol style="margin: 20px 0; line-height: 2;">
{{affidavit_statements}}
</ol>

<p>I say that the above statements are true and correct to the best of my knowledge and belief. I understand that making a false statement is punishable under law.</p>

<p style="margin-top: 40px; text-align: right;">
_________________________<br>
DEPONENT<br>
({{deponent_name}})
</p>

<p style="margin-top: 30px;">
<strong>VERIFICATION</strong><br>
Verified at {{verification_place}} on {{current_date}} that the contents of the above affidavit are true and correct to the best of my knowledge. No part of this affidavit is false and nothing material has been concealed.
</p>

<p style="margin-top: 30px; text-align: right;">
_________________________<br>
DEPONENT
</p>
</div>',
'["deponent_name", "deponent_age", "deponent_parent", "deponent_occupation", "deponent_address", "affidavit_statements", "verification_place"]'),

('Client Engagement Letter', 'Letter of engagement for new clients', 'letter',
'<div style="font-family: Georgia, serif; padding: 40px;">
<p style="text-align: right;">Date: {{current_date}}</p>

<p><strong>To,</strong><br>
{{client_name}}<br>
{{client_address}}</p>

<p><strong>Re: Engagement Letter for Legal Services</strong></p>

<p>Dear {{client_name}},</p>

<p>Thank you for retaining our firm to represent you in the matter of <strong>{{case_title}}</strong>.</p>

<p>This letter confirms the terms of our engagement:</p>

<p><strong>1. Scope of Services:</strong><br>
{{scope_of_services}}</p>

<p><strong>2. Legal Fees:</strong><br>
Our fees for this matter will be {{fee_structure}}. {{additional_fee_terms}}</p>

<p><strong>3. Expenses:</strong><br>
In addition to our legal fees, you will be responsible for all costs and expenses incurred in connection with this matter, including but not limited to court fees, filing fees, process server fees, and travel expenses.</p>

<p><strong>4. Payment Terms:</strong><br>
{{payment_terms}}</p>

<p><strong>5. Termination:</strong><br>
Either party may terminate this engagement at any time upon written notice. You will remain responsible for all fees and expenses incurred prior to termination.</p>

<p>Please sign and return a copy of this letter to confirm your agreement to these terms.</p>

<p style="margin-top: 40px;">
Yours faithfully,<br><br>
{{lawyer_name}}<br>
Advocate
</p>

<div style="margin-top: 50px; border-top: 1px solid #333; padding-top: 20px;">
<p><strong>ACCEPTED AND AGREED:</strong></p>
<p>
_________________________<br>
{{client_name}}<br>
Date: _________________
</p>
</div>
</div>',
'["client_name", "client_address", "case_title", "scope_of_services", "fee_structure", "additional_fee_terms", "payment_terms", "lawyer_name"]');
