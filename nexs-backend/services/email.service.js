const nodemailer = require('nodemailer');
const templateLoader = require('./template.loader');

/**
 * Email Service - Reusable email sending functionality
 * Supports multiple SMTP providers (Gmail, SendGrid, Mailgun, etc.)
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializeTransporter();
    }

    /**
     * Initialize nodemailer transporter with SMTP settings
     */
    initializeTransporter() {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE } = process.env;

        // Check if SMTP is configured
        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
            console.warn('⚠ Email service: SMTP not configured. Emails will not be sent.');
            return;
        }

        try {
            this.transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: parseInt(SMTP_PORT) || 587,
                secure: SMTP_SECURE === 'true',
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASSWORD
                }
            });

            this.isConfigured = true;
            console.log('✓ Email service initialized');
        } catch (error) {
            console.error('✗ Email service initialization failed:', error.message);
        }
    }

    /**
     * Get default sender information
     * @returns {Object} From address object
     */
    getDefaultFrom() {
        const fromName = process.env.SMTP_FROM_NAME || 'NexSpire Solutions';
        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
        return `"${fromName}" <${fromEmail}>`;
    }

    /**
     * Send an email
     * @param {Object} options - Email options
     * @param {string|string[]} options.to - Recipient email(s)
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content
     * @param {string} [options.text] - Plain text content
     * @param {string} [options.from] - Sender (optional, uses default)
     * @returns {Promise<Object>} Send result
     */
    async sendEmail({ to, subject, html, text, from, attachments }) {
        if (!this.isConfigured) {
            console.warn('Email not sent: SMTP not configured');
            return { success: false, error: 'SMTP not configured' };
        }

        try {
            const mailOptions = {
                from: from || this.getDefaultFrom(),
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html,
                text: text || this.stripHtml(html),
                attachments: attachments || []
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✓ Email sent to ${mailOptions.to}: ${subject}`);

            return {
                success: true,
                messageId: result.messageId
            };
        } catch (error) {
            console.error('✗ Email send failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send email using a template
     * @param {Object} options - Template email options
     * @param {string|string[]} options.to - Recipient email(s)
     * @param {string} options.subject - Email subject
     * @param {string} options.template - Template name
     * @param {Object} options.data - Template variables
     * @returns {Promise<Object>} Send result
     */
    async sendTemplateEmail({ to, subject, template, data = {} }) {
        try {
            // Use async version to support database templates
            const html = await templateLoader.renderAsync(template, data);
            return await this.sendEmail({ to, subject, html });
        } catch (error) {
            console.error(`✗ Template email failed (${template}):`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send inquiry notification to configured recipients
     * @param {Object} inquiry - Inquiry data
     * @param {string} inquiry.name - Sender name
     * @param {string} inquiry.email - Sender email
     * @param {string} inquiry.phone - Sender phone
     * @param {string} inquiry.company - Sender company
     * @param {string} inquiry.message - Inquiry message
     * @param {number} inquiry.inquiryId - Inquiry ID
     * @returns {Promise<Object>} Send result
     */
    async sendInquiryNotification(inquiry) {
        const recipients = this.getNotificationRecipients();

        if (recipients.length === 0) {
            console.warn('No notification recipients configured');
            return { success: false, error: 'No recipients configured' };
        }

        const templateData = {
            name: inquiry.name || 'Unknown',
            email: inquiry.email || 'Not provided',
            phone: inquiry.phone || 'Not provided',
            company: inquiry.company || 'Not provided',
            message: inquiry.message || '',
            inquiryId: inquiry.inquiryId || 'N/A',
            timestamp: new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
                timeStyle: 'short'
            })
        };

        return await this.sendTemplateEmail({
            to: recipients,
            subject: `🔔 New Inquiry from ${inquiry.name}`,
            template: 'inquiry-notification',
            data: templateData
        });
    }

    /**
     * Send welcome email to new user
     * @param {Object} user - User data
     * @param {string} user.name - User name
     * @param {string} user.email - User email
     * @returns {Promise<Object>} Send result
     */
    async sendWelcomeEmail(user) {
        return await this.sendTemplateEmail({
            to: user.email,
            subject: 'Welcome to NexSpire Solutions',
            template: 'welcome',
            data: {
                name: user.name,
                email: user.email
            }
        });
    }

    /**
     * Send password reset email
     * @param {string} email - User email
     * @param {string} resetLink - Password reset link
     * @returns {Promise<Object>} Send result
     */
    async sendPasswordReset(email, resetLink) {
        return await this.sendTemplateEmail({
            to: email,
            subject: 'Reset Your Password - NexSpire Solutions',
            template: 'password-reset',
            data: {
                email,
                resetLink,
                expiresIn: '1 hour'
            }
        });
    }

    /**
     * Send welcome email to new tenant with credentials
     * @param {Object} tenant - Tenant data
     * @param {string} tenant.name - Tenant/Company name
     * @param {string} tenant.email - Admin email
     * @param {string} tenant.password - Admin password
     * @param {string} tenant.slug - Tenant slug
     * @param {string} tenant.industry - Industry type
     * @returns {Promise<Object>} Send result
     */
    async sendTenantWelcomeEmail(tenant) {
        const { name, email, password, slug, industry } = tenant;

        const domain = process.env.NEXCRM_DOMAIN || 'nexspiresolutions.co.in';
        const crmUrl = `https://${slug}-crm.${domain}`;
        const storefrontUrl = `https://${slug}.${domain}`;
        const apiUrl = `https://${slug}-crm-api.${domain}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8fafc;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);padding:40px;border-radius:16px 16px 0 0;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Welcome to NexSpire CRM</h1>
                            <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px;">Your business management platform is ready</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="color:#1e293b;font-size:16px;line-height:1.6;margin:0 0 20px;">
                                Hello <strong>${name}</strong>,
                            </p>
                            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 30px;">
                                Congratulations! Your NexSpire CRM account has been successfully created and provisioned. 
                                Below are your login credentials and access URLs.
                            </p>
                            
                            <!-- Credentials Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;border-radius:12px;padding:24px;margin-bottom:30px;">
                                <tr>
                                    <td>
                                        <h3 style="color:#1e293b;margin:0 0 16px;font-size:16px;">Your Login Credentials</h3>
                                        <table width="100%" cellpadding="8" cellspacing="0">
                                            <tr>
                                                <td style="color:#64748b;font-size:14px;width:100px;">Email:</td>
                                                <td style="color:#1e293b;font-size:14px;font-weight:600;">${email}</td>
                                            </tr>
                                            <tr>
                                                <td style="color:#64748b;font-size:14px;">Password:</td>
                                                <td style="color:#1e293b;font-size:14px;font-weight:600;font-family:monospace;background:#e2e8f0;padding:4px 8px;border-radius:4px;">${password}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Access Links -->
                            <h3 style="color:#1e293b;margin:0 0 16px;font-size:16px;">Your Platform URLs</h3>
                            <table width="100%" cellpadding="12" cellspacing="0" style="margin-bottom:30px;">
                                <tr>
                                    <td style="background-color:#dbeafe;border-radius:8px;padding:16px;">
                                        <strong style="color:#1e40af;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">CRM Dashboard</strong><br>
                                        <a href="${crmUrl}" style="color:#3b82f6;font-size:14px;text-decoration:none;">${crmUrl}</a>
                                    </td>
                                </tr>
                                <tr><td style="height:12px;"></td></tr>
                                <tr>
                                    <td style="background-color:#dcfce7;border-radius:8px;padding:16px;">
                                        <strong style="color:#166534;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Storefront</strong><br>
                                        <a href="${storefrontUrl}" style="color:#16a34a;font-size:14px;text-decoration:none;">${storefrontUrl}</a>
                                    </td>
                                </tr>
                                <tr><td style="height:12px;"></td></tr>
                                <tr>
                                    <td style="background-color:#fef3c7;border-radius:8px;padding:16px;">
                                        <strong style="color:#92400e;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">API Endpoint</strong><br>
                                        <a href="${apiUrl}" style="color:#d97706;font-size:14px;text-decoration:none;">${apiUrl}</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${crmUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
                                            Login to Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Note -->
                            <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:30px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;">
                                For security, we recommend changing your password after your first login. 
                                If you did not request this account, please contact our support team immediately.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc;padding:24px 40px;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid #e2e8f0;">
                            <p style="color:#64748b;font-size:13px;margin:0;">
                                © ${new Date().getFullYear()} NexSpire Solutions. All rights reserved.
                            </p>
                            <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">
                                Industry: ${industry || 'General'} | Plan: Starter
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        return await this.sendEmail({
            to: email,
            subject: `🎉 Welcome to NexSpire CRM - Your ${name} Account is Ready!`,
            html
        });
    }

    /**
     * Get notification recipients from environment
     * @returns {string[]} Array of email addresses
     */
    getNotificationRecipients() {
        const emails = process.env.NOTIFICATION_EMAILS || '';
        return emails.split(',').map(e => e.trim()).filter(Boolean);
    }

    /**
     * Strip HTML tags for plain text version
     * @param {string} html - HTML content
     * @returns {string} Plain text
     */
    stripHtml(html) {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    /**
     * Verify SMTP connection
     * @returns {Promise<boolean>} Connection status
     */
    async verifyConnection() {
        if (!this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            console.log('✓ SMTP connection verified');
            return true;
        } catch (error) {
            console.error('✗ SMTP connection failed:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();