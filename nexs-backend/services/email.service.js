const nodemailer = require('nodemailer');
const templateLoader = require('./template.loader');
const brand = require('../config/brand');

/**
 * Email Service - Reusable email sending functionality
 * Supports multiple SMTP providers (Gmail, SendGrid, Mailgun, etc.)
 */
class EmailService {
    constructor() {
        this.transporter = null;      // primary transporter (kept for backward compat)
        this.transports = [];         // prioritized list used for automatic failover
        this.isConfigured = false;
        this._dbLoaded = false;
        this._fromName = null;
        this._fromEmail = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        const {
            ZOHO_SMTP_HOST, ZOHO_SMTP_PORT, ZOHO_SMTP_USER, ZOHO_SMTP_PASSWORD, ZOHO_FROM_NAME, ZOHO_FROM_EMAIL,
            SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE, SMTP_FROM_NAME, SMTP_FROM_EMAIL
        } = process.env;

        // Build a prioritized list of providers. sendEmail() tries them in order
        // and automatically falls back to the next one if a send fails.
        this.transports = [];

        // 1. Zoho (primary, if configured)
        if (ZOHO_SMTP_HOST && ZOHO_SMTP_USER && ZOHO_SMTP_PASSWORD) {
            this.transports.push(this._buildTransport({
                label: 'Zoho',
                host: ZOHO_SMTP_HOST,
                port: parseInt(ZOHO_SMTP_PORT) || 587,
                secure: ZOHO_SMTP_PORT,
                user: ZOHO_SMTP_USER,
                password: ZOHO_SMTP_PASSWORD,
                fromName: ZOHO_FROM_NAME || 'Napnix',
                fromEmail: ZOHO_FROM_EMAIL || ZOHO_SMTP_USER
            }));
        }

        // 2. Gmail / generic SMTP (fallback, if configured)
        if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
            this.transports.push(this._buildTransport({
                label: 'Gmail',
                host: SMTP_HOST,
                port: parseInt(SMTP_PORT) || 587,
                secure: SMTP_SECURE === 'true' ? 465 : SMTP_PORT,
                user: SMTP_USER,
                password: SMTP_PASSWORD,
                fromName: SMTP_FROM_NAME || 'Napnix',
                fromEmail: SMTP_FROM_EMAIL || SMTP_USER
            }));
        }

        if (this.transports.length === 0) {
            console.warn('⚠ Email service: No SMTP configured (checked Zoho, then Gmail). Emails will not be sent.');
            return;
        }

        this.transporter = this.transports[0].transporter; // primary, for backward compat
        this.isConfigured = true;
        console.log(`✓ Email service initialized. Providers (in failover order): ${this.transports.map(t => t.label).join(' → ')}`);
    }

    /**
     * Build a single transport entry. `secure` is derived from the port
     * (465 => implicit SSL, anything else => STARTTLS) so a port/TLS mismatch
     * can never produce the "wrong version number" SSL error.
     */
    _buildTransport({ label, host, port, secure, user, password, fromName, fromEmail }) {
        const useSSL = parseInt(secure) === 465 || port === 465;
        return {
            label,
            fromName,
            fromEmail,
            transporter: nodemailer.createTransport({
                host,
                port,
                secure: useSSL,
                auth: { user, pass: password }
            })
        };
    }

    async _loadFromDB() {
        if (this._dbLoaded) return;
        this._dbLoaded = true;
        try {
            const db = require('../config/database');
            const [rows] = await db.query(
                "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'smtp_%'"
            );
            const s = {};
            rows.forEach(r => { s[r.setting_key] = r.setting_value; });
            if (s.smtp_host && s.smtp_user && s.smtp_password) {
                const dbPort = parseInt(s.smtp_port) || 587;
                const dbTransport = this._buildTransport({
                    label: 'DB-SMTP',
                    host: s.smtp_host,
                    port: dbPort,
                    secure: s.smtp_secure === 'true' ? 465 : dbPort,
                    user: s.smtp_user,
                    password: s.smtp_password,
                    fromName: s.smtp_from_name || 'Napnix',
                    fromEmail: s.smtp_from_email || s.smtp_user
                });
                // Highest priority, but env providers remain as fallbacks.
                this.transports = [dbTransport, ...this.transports.filter(t => t.label !== 'DB-SMTP')];
                this.transporter = dbTransport.transporter;
                this._fromEmail = s.smtp_from_email || null;
                this._fromName = s.smtp_from_name || null;
                this.isConfigured = true;
                console.log(`✓ Email service loaded SMTP from DB settings. Failover order: ${this.transports.map(t => t.label).join(' → ')}`);
            }
        } catch (e) {
            // DB not ready or no smtp settings yet — env var config stays active
        }
    }

    reload() {
        this._dbLoaded = false;
    }

    getDefaultFrom() {
        const fromName = this._fromName || process.env.ZOHO_FROM_NAME || process.env.SMTP_FROM_NAME || 'Napnix';
        const fromEmail = this._fromEmail || process.env.ZOHO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
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
        await this._loadFromDB();
        if (!this.isConfigured || this.transports.length === 0) {
            console.warn('Email not sent: SMTP not configured');
            return { success: false, error: 'SMTP not configured' };
        }

        const recipient = Array.isArray(to) ? to.join(', ') : to;
        const baseOptions = {
            to: recipient,
            subject,
            html,
            text: text || this.stripHtml(html),
            attachments: attachments || []
        };

        // Try each provider in priority order; fall back to the next on failure.
        const errors = [];
        for (const tp of this.transports) {
            try {
                const mailOptions = {
                    ...baseOptions,
                    from: from || `"${tp.fromName}" <${tp.fromEmail}>`
                };
                const result = await tp.transporter.sendMail(mailOptions);
                console.log(`✓ Email sent via ${tp.label} to ${recipient}: ${subject}`);
                return {
                    success: true,
                    messageId: result.messageId,
                    provider: tp.label
                };
            } catch (error) {
                console.error(`✗ ${tp.label} send failed: ${error.message}` +
                    (this.transports.indexOf(tp) < this.transports.length - 1 ? ' — falling back to next provider...' : ''));
                errors.push(`${tp.label}: ${error.message}`);
            }
        }

        console.error('✗ Email send failed on all providers:', errors.join(' | '));
        return { success: false, error: errors.join(' | ') };
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

    async sendAutoReply(inquiry) {
        try {
            const optionalRows = [];
            if (inquiry.phone) {
                optionalRows.push(`<tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;"><tr><td style="width: 100px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding-top: 2px;">Phone</td><td style="font-size: 14px; color: #334155;">${inquiry.phone}</td></tr></table></td></tr>`);
            }
            if (inquiry.company) {
                optionalRows.push(`<tr><td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;"><tr><td style="width: 100px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; padding-top: 2px;">Company</td><td style="font-size: 14px; color: #334155;">${inquiry.company}</td></tr></table></td></tr>`);
            }

            const html = await templateLoader.renderAsync('inquiry-autoreply', {
                name: inquiry.name || 'there',
                inquiryId: inquiry.inquiryId || '',
                message: inquiry.message || '',
                optionalDetails: optionalRows.join('')
            });

            return await this.sendEmail({
                to: inquiry.email,
                subject: 'We received your inquiry - Napnix',
                html
            });
        } catch (error) {
            console.error('✗ Auto-reply send failed:', error.message);
            return { success: false, error: error.message };
        }
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
            subject: 'Welcome to Napnix',
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
            subject: 'Reset Your Password - Napnix',
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

        const domain = brand.baseDomain;
        const crmUrl = `https://${slug}-crm.${domain}`;
        const storefrontUrl = `https://${slug}.${domain}`;
        const apiUrl = `https://${slug}-crm-api.${domain}`;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Napnix CRM</title>
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
                                        <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;letter-spacing:-0.5px;">Welcome to Napnix CRM</h1>
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
                                Congratulations! Your Napnix CRM account has been successfully created and is now ready to use. Below you will find your login credentials and platform access URLs.
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
                                            &copy; ${new Date().getFullYear()} Napnix. All rights reserved.
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
            subject: `Welcome to Napnix CRM - Your ${name} Account is Ready`,
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
     * Verify SMTP connection for all active accounts
     * @returns {Promise<boolean>} Connection status
     */
    async verifyConnection() {
        const db = require('../config/database');
        try {
            const [accounts] = await db.query('SELECT * FROM smtp_accounts WHERE is_active = TRUE');
            if (accounts.length === 0) {
                // Fallback to default transporter if no accounts configured
                if (!this.transporter) return false;
                await this.transporter.verify();
                return true;
            }

            for (const account of accounts) {
                const testTransporter = nodemailer.createTransport({
                    host: account.host,
                    port: account.port,
                    secure: account.secure,
                    auth: {
                        user: account.username,
                        pass: account.password
                    }
                });
                await testTransporter.verify();
            }
            return true;
        } catch (error) {
            console.error('✗ SMTP connection verification failed:', error.message);
            throw new Error(`SMTP validation failed: ${error.message}`);
        }
    }
}

module.exports = new EmailService();