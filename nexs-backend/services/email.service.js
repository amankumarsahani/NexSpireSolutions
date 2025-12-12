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
    async sendEmail({ to, subject, html, text, from }) {
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
                text: text || this.stripHtml(html)
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
            const html = templateLoader.render(template, data);
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
