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
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to NexSpire CRM</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#1e293b;padding:32px 40px;text-align:center;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom:16px;">
                                        <div style="width:56px;height:56px;background-color:#3b82f6;border-radius:12px;display:inline-block;line-height:56px;text-align:center;">
                                            <span style="color:#ffffff;font-size:24px;font-weight:bold;">N</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;letter-spacing:-0.5px;">Welcome to NexSpire CRM</h1>
                                        <p style="color:#94a3b8;margin:8px 0 0;font-size:15px;">Your business management platform is ready</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td style="padding:40px;">
                            
                            <!-- Greeting -->
                            <p style="color:#1e293b;font-size:16px;line-height:1.6;margin:0 0 24px;">
                                Hello <strong>${name}</strong>,
                            </p>
                            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 32px;">
                                Congratulations! Your NexSpire CRM account has been successfully created and is now ready to use. Below you will find your login credentials and platform access URLs.
                            </p>
                            
                            <!-- Credentials Section -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:32px;">
                                <tr>
                                    <td style="padding:24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                                                    <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Login Credentials</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-top:16px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding:8px 0;">
                                                                <span style="color:#64748b;font-size:13px;">Email Address</span><br>
                                                                <span style="color:#0f172a;font-size:15px;font-weight:600;">${email}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;">
                                                                <span style="color:#64748b;font-size:13px;">Password</span><br>
                                                                <code style="display:inline-block;background-color:#1e293b;color:#f1f5f9;padding:8px 16px;border-radius:6px;font-size:14px;font-family:'Courier New',monospace;margin-top:4px;">${password}</code>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Platform URLs -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                                <tr>
                                    <td style="padding-bottom:16px;">
                                        <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Platform URLs</span>
                                    </td>
                                </tr>
                                
                                <!-- CRM Dashboard -->
                                <tr>
                                    <td style="padding:12px 16px;background-color:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 6px 6px 0;margin-bottom:8px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <span style="color:#1e40af;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">CRM Dashboard</span><br>
                                                    <a href="${crmUrl}" style="color:#1e293b;font-size:14px;text-decoration:none;word-break:break-all;">${crmUrl}</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height:8px;"></td></tr>
                                
                                <!-- Storefront -->
                                <tr>
                                    <td style="padding:12px 16px;background-color:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 6px 6px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <span style="color:#166534;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Storefront</span><br>
                                                    <a href="${storefrontUrl}" style="color:#1e293b;font-size:14px;text-decoration:none;word-break:break-all;">${storefrontUrl}</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr><td style="height:8px;"></td></tr>
                                
                                <!-- API Endpoint -->
                                <tr>
                                    <td style="padding:12px 16px;background-color:#fefce8;border-left:4px solid #eab308;border-radius:0 6px 6px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <span style="color:#854d0e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">API Endpoint</span><br>
                                                    <a href="${apiUrl}" style="color:#1e293b;font-size:14px;text-decoration:none;word-break:break-all;">${apiUrl}</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                                <tr>
                                    <td align="center">
                                        <a href="${crmUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:15px;">Access Your Dashboard</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                                <tr>
                                    <td style="padding:16px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="24" valign="top" style="padding-right:12px;">
                                                    <div style="width:20px;height:20px;background-color:#dc2626;border-radius:50%;text-align:center;line-height:20px;">
                                                        <span style="color:#ffffff;font-size:12px;font-weight:bold;">!</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style="color:#991b1b;font-size:13px;font-weight:600;">Security Notice</span>
                                                    <p style="color:#7f1d1d;font-size:13px;line-height:1.5;margin:4px 0 0;">
                                                        Please change your password after your first login. Keep your credentials secure and do not share them with anyone.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
                                            Industry: <strong>${industry || 'General'}</strong> | Plan: <strong>Starter</strong>
                                        </p>
                                        <p style="color:#94a3b8;font-size:12px;margin:0;">
                                            &copy; ${new Date().getFullYear()} NexSpire Solutions. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
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
            subject: `Welcome to NexSpire CRM - Your ${name} Account is Ready`,
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