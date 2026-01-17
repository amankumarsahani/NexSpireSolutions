/**
 * SMTP Accounts Controller
 * Manages multiple SMTP accounts for email rotation
 */

const db = require('../config/database');

// Get all SMTP accounts
exports.getAllAccounts = async (req, res) => {
    try {
        const [accounts] = await db.query(
            `SELECT id, name, host, port, secure, username, from_name, from_email, 
                    daily_limit, hourly_limit, sent_today, sent_this_hour, is_active, priority, created_at
             FROM smtp_accounts
             ORDER BY priority ASC, created_at DESC`
        );

        // Don't expose passwords
        res.json({ success: true, data: accounts });
    } catch (error) {
        console.error('Get SMTP accounts error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch SMTP accounts' });
    }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        const [[account]] = await db.query(
            `SELECT id, name, host, port, secure, username, from_name, from_email, 
                    daily_limit, hourly_limit, sent_today, sent_this_hour, is_active, priority, created_at
             FROM smtp_accounts WHERE id = ?`,
            [id]
        );

        if (!account) {
            return res.status(404).json({ success: false, error: 'Account not found' });
        }

        res.json({ success: true, data: account });
    } catch (error) {
        console.error('Get SMTP account error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch account' });
    }
};

// Create SMTP account
exports.createAccount = async (req, res) => {
    try {
        const {
            name,
            host,
            port = 587,
            secure = false,
            username,
            password,
            from_name,
            from_email,
            daily_limit = 500,
            hourly_limit = 50,
            priority = 1
        } = req.body;

        if (!name || !host || !username || !password || !from_name || !from_email) {
            return res.status(400).json({
                success: false,
                error: 'Name, host, username, password, from_name and from_email are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO smtp_accounts 
             (name, host, port, secure, username, password, from_name, from_email, daily_limit, hourly_limit, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, host, port, secure, username, password, from_name, from_email, daily_limit, hourly_limit, priority]
        );

        const [[newAccount]] = await db.query(
            'SELECT id, name, host, port, secure, username, from_name, from_email, daily_limit, hourly_limit, is_active, priority FROM smtp_accounts WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({ success: true, data: newAccount });
    } catch (error) {
        console.error('Create SMTP account error:', error);
        res.status(500).json({ success: false, error: 'Failed to create account' });
    }
};

// Update SMTP account
exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = [
            'name', 'host', 'port', 'secure', 'username', 'password',
            'from_name', 'from_email', 'daily_limit', 'hourly_limit', 'is_active', 'priority'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }

        values.push(id);
        await db.query(`UPDATE smtp_accounts SET ${updates.join(', ')} WHERE id = ?`, values);

        const [[updated]] = await db.query(
            'SELECT id, name, host, port, secure, username, from_name, from_email, daily_limit, hourly_limit, is_active, priority FROM smtp_accounts WHERE id = ?',
            [id]
        );

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update SMTP account error:', error);
        res.status(500).json({ success: false, error: 'Failed to update account' });
    }
};

// Delete SMTP account
exports.deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM smtp_accounts WHERE id = ?', [id]);
        res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
        console.error('Delete SMTP account error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete account' });
    }
};

// Test SMTP connection
exports.testConnection = async (req, res) => {
    try {
        const { id } = req.params;
        const [[account]] = await db.query('SELECT * FROM smtp_accounts WHERE id = ?', [id]);

        if (!account) {
            return res.status(404).json({ success: false, error: 'Account not found' });
        }

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: account.host,
            port: account.port,
            secure: account.secure,
            auth: {
                user: account.username,
                pass: account.password
            }
        });

        await transporter.verify();
        res.json({ success: true, message: 'Connection successful' });
    } catch (error) {
        console.error('Test SMTP connection error:', error);
        res.status(400).json({ success: false, error: `Connection failed: ${error.message}` });
    }
};

// Reset daily/hourly counters (can be called manually or via cron)
exports.resetCounters = async (req, res) => {
    try {
        await db.query('UPDATE smtp_accounts SET sent_this_hour = 0, last_hour_reset = NOW()');
        res.json({ success: true, message: 'Hourly counters reset' });
    } catch (error) {
        console.error('Reset counters error:', error);
        res.status(500).json({ success: false, error: 'Failed to reset counters' });
    }
};
