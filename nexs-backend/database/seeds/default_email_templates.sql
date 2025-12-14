-- Default Email Templates Seed
-- Run this to populate email_templates table with pre-built templates

-- Clear existing templates (optional - comment out if you want to keep existing)
-- DELETE FROM email_templates;

-- 1. Welcome Email Template
INSERT INTO email_templates (name, type, subject, html_content, description, variables, category, is_active)
VALUES (
    'welcome-email',
    'email',
    'Welcome to NexSpire Solutions!',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to NexSpire!</h1>
        </div>
        <div class="content">
            <p>Dear {{contact_name}},</p>
            <p>Welcome to <strong>NexSpire Solutions</strong>! We are thrilled to have you on board.</p>
            <p>At NexSpire, we are committed to delivering exceptional digital solutions that help businesses thrive in the modern landscape.</p>
            <p>Here is what you can expect from us:</p>
            <ul>
                <li>Cutting-edge web development solutions</li>
                <li>Professional digital marketing services</li>
                <li>Dedicated support team</li>
                <li>Regular updates on your projects</li>
            </ul>
            <p>If you have any questions, feel free to reach out to us anytime.</p>
            <a href="https://nexspiresolutions.co.in" class="btn">Visit Our Website</a>
        </div>
        <div class="footer">
            <p>© 2024 NexSpire Solutions. All rights reserved.</p>
            <p>This email was sent to {{email}}</p>
        </div>
    </div>
</body>
</html>',
    'Welcome email sent to new clients and leads',
    '["contact_name", "email", "company_name"]',
    'notification',
    true
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 2. Project Proposal Template
INSERT INTO email_templates (name, type, subject, html_content, description, variables, category, is_active)
VALUES (
    'project-proposal',
    'email',
    'Project Proposal from NexSpire Solutions',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .highlight { background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Project Proposal</h1>
        </div>
        <div class="content">
            <p>Dear {{contact_name}},</p>
            <p>Thank you for considering <strong>NexSpire Solutions</strong> for your project. We are excited about the opportunity to work with {{company_name}}.</p>
            <div class="highlight">
                <h3 style="margin-top: 0;">Project Overview</h3>
                <p>{{project_description}}</p>
            </div>
            <p>Based on our discussion, we have prepared a comprehensive proposal that outlines:</p>
            <ul>
                <li>Project scope and deliverables</li>
                <li>Timeline and milestones</li>
                <li>Investment details</li>
                <li>Terms and conditions</li>
            </ul>
            <p>Please review the attached proposal at your convenience. We would be happy to schedule a call to discuss any questions you may have.</p>
            <a href="#" class="btn">View Full Proposal</a>
        </div>
        <div class="footer">
            <p>© 2024 NexSpire Solutions. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Project proposal email for potential clients',
    '["contact_name", "company_name", "project_description"]',
    'transactional',
    true
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 3. Follow-up Email Template
INSERT INTO email_templates (name, type, subject, html_content, description, variables, category, is_active)
VALUES (
    'follow-up',
    'email',
    'Following Up - NexSpire Solutions',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Just Checking In</h1>
        </div>
        <div class="content">
            <p>Hi {{contact_name}},</p>
            <p>I wanted to follow up on our previous conversation regarding your project requirements.</p>
            <p>I understand you might be busy, but I wanted to ensure you have all the information you need to make a decision. Our team at NexSpire Solutions is ready to help bring your vision to life.</p>
            <p>Would you have time for a quick call this week to discuss the next steps?</p>
            <p>Looking forward to hearing from you!</p>
            <a href="mailto:contact@nexspiresolutions.co.in" class="btn">Reply to This Email</a>
        </div>
        <div class="footer">
            <p>© 2024 NexSpire Solutions. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Follow-up email for leads and inquiries',
    '["contact_name"]',
    'notification',
    true
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 4. Project Update Template
INSERT INTO email_templates (name, type, subject, html_content, description, variables, category, is_active)
VALUES (
    'project-update',
    'email',
    'Project Update - {{project_name}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .progress { background: #e2e8f0; border-radius: 10px; height: 20px; margin: 20px 0; overflow: hidden; }
        .progress-bar { background: linear-gradient(90deg, #3b82f6, #1d4ed8); height: 100%; }
        .milestone { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #3b82f6; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Project Update</h1>
        </div>
        <div class="content">
            <p>Dear {{contact_name}},</p>
            <p>Here is the latest update on your project: <strong>{{project_name}}</strong></p>
            <h3>Progress Overview</h3>
            <div class="progress">
                <div class="progress-bar" style="width: {{progress_percentage}}%;"></div>
            </div>
            <p style="text-align: center;"><strong>{{progress_percentage}}% Complete</strong></p>
            <h3>Recent Milestones</h3>
            <div class="milestone">
                <strong>{{milestone_title}}</strong>
                <p style="margin: 5px 0 0;">{{milestone_description}}</p>
            </div>
            <h3>Next Steps</h3>
            <p>{{next_steps}}</p>
            <p>If you have any questions or feedback, please dont hesitate to reach out.</p>
            <a href="#" class="btn">View Project Dashboard</a>
        </div>
        <div class="footer">
            <p>© 2024 NexSpire Solutions. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Regular project progress update for clients',
    '["contact_name", "project_name", "progress_percentage", "milestone_title", "milestone_description", "next_steps"]',
    'transactional',
    true
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 5. Thank You Email Template
INSERT INTO email_templates (name, type, subject, html_content, description, variables, category, is_active)
VALUES (
    'thank-you',
    'email',
    'Thank You for Choosing NexSpire Solutions!',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899, #be185d); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .icon-circle { width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
        .icon-circle svg { width: 30px; height: 30px; fill: white; }
        .btn { display: inline-block; background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You!</h1>
        </div>
        <div class="content">
            <div class="icon-circle">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <p>Dear {{contact_name}},</p>
            <p>We just wanted to take a moment to say <strong>THANK YOU</strong> for choosing NexSpire Solutions.</p>
            <p>Your trust in us means the world, and we are committed to exceeding your expectations.</p>
            <p>It has been a pleasure working with you and {{company_name}}. We look forward to continuing our partnership and helping you achieve even greater success.</p>
            <p>If there is anything we can do to make your experience better, please let us know!</p>
            <a href="https://nexspiresolutions.co.in" class="btn">Stay Connected</a>
        </div>
        <div class="footer">
            <p>© 2024 NexSpire Solutions. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Thank you email for clients after project completion',
    '["contact_name", "company_name"]',
    'notification',
    true
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 6. Meeting Confirmation Template
INSERT INTO email_templates (name, type, subject, html_content, description, variables, category, is_active)
VALUES (
    'meeting-confirmation',
    'email',
    'Meeting Confirmed - {{meeting_date}}',
    '<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .meeting-box { background: #f5f3ff; border: 2px solid #8b5cf6; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .meeting-detail { display: flex; align-items: center; margin: 12px 0; }
        .meeting-icon { width: 36px; height: 36px; background: #8b5cf6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; }
        .meeting-icon svg { width: 18px; height: 18px; fill: white; }
        .btn { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 10px; margin-right: 10px; }
        .btn-outline { display: inline-block; background: transparent; color: #8b5cf6; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 10px; border: 2px solid #8b5cf6; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Meeting Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi {{contact_name}},</p>
            <p>Your meeting with NexSpire Solutions has been confirmed!</p>
            <div class="meeting-box">
                <div class="meeting-detail">
                    <span class="meeting-icon"><svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg></span>
                    <span><strong>Date:</strong> {{meeting_date}}</span>
                </div>
                <div class="meeting-detail">
                    <span class="meeting-icon"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg></span>
                    <span><strong>Time:</strong> {{meeting_time}}</span>
                </div>
                <div class="meeting-detail">
                    <span class="meeting-icon"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg></span>
                    <span><strong>Location:</strong> {{meeting_location}}</span>
                </div>
                <div class="meeting-detail">
                    <span class="meeting-icon"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></span>
                    <span><strong>Agenda:</strong> {{meeting_agenda}}</span>
                </div>
            </div>
            <p>Please make sure to join on time. If you need to reschedule, please let us know at least 24 hours in advance.</p>
            <a href="#" class="btn">Add to Calendar</a>
            <a href="mailto:contact@nexspiresolutions.co.in" class="btn-outline">Reschedule</a>
        </div>
        <div class="footer">
            <p>© 2024 NexSpire Solutions. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Meeting confirmation email with details',
    '["contact_name", "meeting_date", "meeting_time", "meeting_location", "meeting_agenda"]',
    'transactional',
    true
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Display confirmation
SELECT 'Default email templates have been created/updated successfully!' AS message;
SELECT name, category, is_active FROM email_templates ORDER BY category, name;
