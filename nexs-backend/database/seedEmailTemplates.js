/**
 * Seed Default Email Templates
 * Run this with: node database/seedEmailTemplates.js
 */
const { query } = require('../config/database');

const templates = [
    {
        name: 'welcome-email',
        type: 'email',
        subject: 'Welcome to NexSpire Solutions!',
        html_content: `<!DOCTYPE html>
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
</html>`,
        description: 'Welcome email sent to new clients and leads',
        variables: JSON.stringify(['contact_name', 'email', 'company_name']),
        category: 'notification'
    },
    {
        name: 'project-proposal',
        type: 'email',
        subject: 'Project Proposal from NexSpire Solutions',
        html_content: `<!DOCTYPE html>
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
</html>`,
        description: 'Project proposal email for potential clients',
        variables: JSON.stringify(['contact_name', 'company_name', 'project_description']),
        category: 'transactional'
    },
    {
        name: 'follow-up',
        type: 'email',
        subject: 'Following Up - NexSpire Solutions',
        html_content: `<!DOCTYPE html>
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
</html>`,
        description: 'Follow-up email for leads and inquiries',
        variables: JSON.stringify(['contact_name']),
        category: 'notification'
    },
    {
        name: 'project-update',
        type: 'email',
        subject: 'Project Update - {{project_name}}',
        html_content: `<!DOCTYPE html>
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
</html>`,
        description: 'Regular project progress update for clients',
        variables: JSON.stringify(['contact_name', 'project_name', 'progress_percentage', 'milestone_title', 'milestone_description', 'next_steps']),
        category: 'transactional'
    },
    {
        name: 'thank-you',
        type: 'email',
        subject: 'Thank You for Choosing NexSpire Solutions!',
        html_content: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899, #be185d); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; text-align: center; }
        .icon-circle { width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 50%; margin: 0 auto 20px; }
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
            <div class="icon-circle"></div>
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
</html>`,
        description: 'Thank you email for clients after project completion',
        variables: JSON.stringify(['contact_name', 'company_name']),
        category: 'notification'
    },
    {
        name: 'meeting-confirmation',
        type: 'email',
        subject: 'Meeting Confirmed - {{meeting_date}}',
        html_content: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
        .meeting-box { background: #f5f3ff; border: 2px solid #8b5cf6; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .meeting-detail { margin: 12px 0; }
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
                <div class="meeting-detail"><strong>Date:</strong> {{meeting_date}}</div>
                <div class="meeting-detail"><strong>Time:</strong> {{meeting_time}}</div>
                <div class="meeting-detail"><strong>Location:</strong> {{meeting_location}}</div>
                <div class="meeting-detail"><strong>Agenda:</strong> {{meeting_agenda}}</div>
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
</html>`,
        description: 'Meeting confirmation email with details',
        variables: JSON.stringify(['contact_name', 'meeting_date', 'meeting_time', 'meeting_location', 'meeting_agenda']),
        category: 'transactional'
    }
];

async function seedTemplates() {
    console.log('🌱 Seeding email templates...');

    for (const template of templates) {
        try {
            // Check if template already exists
            const [existing] = await query(
                'SELECT id FROM email_templates WHERE name = ?',
                [template.name]
            );

            if (existing && existing.length > 0) {
                // Update existing
                await query(
                    `UPDATE email_templates SET 
                        type = ?, subject = ?, html_content = ?, 
                        description = ?, variables = ?, category = ?, 
                        is_active = true, updated_at = NOW()
                    WHERE name = ?`,
                    [template.type, template.subject, template.html_content,
                    template.description, template.variables, template.category,
                    template.name]
                );
                console.log(`  ✓ Updated: ${template.name}`);
            } else {
                // Insert new
                await query(
                    `INSERT INTO email_templates 
                        (name, type, subject, html_content, description, variables, category, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
                    [template.name, template.type, template.subject, template.html_content,
                    template.description, template.variables, template.category]
                );
                console.log(`  ✓ Created: ${template.name}`);
            }
        } catch (error) {
            console.error(`  ✗ Error with ${template.name}:`, error.message);
        }
    }

    console.log('✅ Email templates seeding completed!');
    process.exit(0);
}

seedTemplates().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
