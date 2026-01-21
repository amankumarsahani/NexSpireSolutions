/**
 * Settings Controller
 * Manages system settings stored in the database
 */

const db = require('../config/database');

// Get all system settings
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.query('SELECT setting_key, setting_value FROM settings');

        // Transform array into an object for easier frontend consumption
        const settingsMap = {};
        settings.forEach(s => {
            // Mask sensitive data like API keys
            if (s.setting_key.includes('_api_key') && s.setting_value) {
                const val = s.setting_value;
                if (val.length > 8) {
                    settingsMap[s.setting_key] = `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;
                } else {
                    settingsMap[s.setting_key] = '****';
                }
            } else {
                settingsMap[s.setting_key] = s.setting_value;
            }
        });

        res.json({ success: true, data: settingsMap });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

// Update multiple settings at once
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expects { key: value, key2: value2 }

        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid settings format' });
        }

        const keys = Object.keys(updates);
        if (keys.length === 0) {
            return res.status(400).json({ success: false, error: 'No settings provided' });
        }

        // Use a transaction for consistency
        const connection = await db.pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const key of keys) {
                const value = updates[key];

                // If it's an API key and it's masked (ends with ...), don't update it
                if (key.includes('_api_key') && value && value.includes('...')) {
                    continue;
                }

                await connection.query(
                    `INSERT INTO settings (setting_key, setting_value) 
                     VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [key, value]
                );
            }

            await connection.commit();
            res.json({ success: true, message: 'Settings updated successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};

// Test AI Provider Connection
exports.testAIConnection = async (req, res) => {
    try {
        const { provider, apiKey } = req.body;

        if (!provider || !apiKey) {
            return res.status(400).json({ success: false, error: 'Provider and API Key are required' });
        }

        // If apiKey is masked, fetch the real one from DB
        let finalApiKey = apiKey;
        if (apiKey.includes('...')) {
            const [[setting]] = await db.query(
                'SELECT setting_value FROM settings WHERE setting_key = ?',
                [`${provider}_api_key`]
            );
            if (!setting) {
                return res.status(404).json({ success: false, error: 'API Key not found in settings' });
            }
            finalApiKey = setting.setting_value;
        }

        const axios = require('axios');

        if (provider === 'openai') {
            try {
                await axios.get('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${finalApiKey}` }
                });
                return res.json({ success: true, message: 'OpenAI connection successful' });
            } catch (err) {
                return res.status(400).json({ success: false, error: `OpenAI connection failed: ${err.response?.data?.error?.message || err.message}` });
            }
        } else if (provider === 'gemini') {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${finalApiKey}`;
                await axios.get(url);
                return res.json({ success: true, message: 'Gemini connection successful' });
            } catch (err) {
                return res.status(400).json({ success: false, error: `Gemini connection failed: ${err.response?.data?.error?.message || err.message}` });
            }
        } else {
            return res.status(400).json({ success: false, error: 'Unsupported provider' });
        }
    } catch (error) {
        console.error('Test AI connection error:', error);
        res.status(500).json({ success: false, error: 'Failed to test connection' });
    }
};
