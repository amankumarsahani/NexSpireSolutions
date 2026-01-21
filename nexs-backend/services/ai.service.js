/**
 * AI Service
 * Interface for communicating with Large Language Models
 */

const axios = require('axios');
const db = require('../config/database');

class AIService {
    constructor() {
        // Initial defaults from environment
        this.envApiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || null;
        this.envApiType = process.env.OPENAI_API_KEY ? 'openai' : 'gemini';

        // Model configurations
        this.models = {
            openai: 'gpt-4o-mini',
            gemini: 'gemini-1.5-flash',
            groq: 'llama-3.3-70b-versatile',
            grok: 'grok-beta'
        };
    }

    /**
     * Get active API configuration for the tenant
     */
    async getApiConfig() {
        try {
            const [settings] = await db.query(
                "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('openai_api_key', 'gemini_api_key', 'groq_api_key', 'grok_api_key')"
            );

            const settingsMap = {};
            settings.forEach(s => settingsMap[s.setting_key] = s.setting_value);

            const config = {};
            if (settingsMap.openai_api_key) {
                config.openai = settingsMap.openai_api_key;
            }
            if (settingsMap.gemini_api_key) {
                config.gemini = settingsMap.gemini_api_key;
            }
            if (settingsMap.groq_api_key) {
                config.groq = settingsMap.groq_api_key;
            }
            if (settingsMap.grok_api_key) {
                config.grok = settingsMap.grok_api_key;
            }

            // Fallback for primary/legacy logic if only environment keys exist
            if (Object.keys(config).length === 0 && this.envApiKey) {
                config[this.envApiType] = this.envApiKey;
            }

            return config;
        } catch (error) {
            console.warn('[AIService] Database config fetch failed, using environment fallback:', error.message);
            const fallback = {};
            if (this.envApiKey) fallback[this.envApiType] = this.envApiKey;
            return fallback;
        }
    }

    /**
     * Generate content from a prompt
     */
    async generateContent(prompt, systemMessage = 'You are a helpful CRM assistant.', model = null) {
        const config = await this.getApiConfig();
        const selectedModel = model || (config.openai ? this.models.openai : this.models.gemini);

        try {
            // Route based on model prefix
            if (selectedModel.startsWith('gpt-') || selectedModel.startsWith('o1-')) {
                if (!config.openai) throw new Error('OpenAI API key not configured');
                return await this.callOpenAI(prompt, systemMessage, selectedModel, config.openai);
            }

            if (selectedModel.startsWith('gemini-')) {
                if (!config.gemini) throw new Error('Gemini API key not configured');
                return await this.callGemini(prompt, systemMessage, selectedModel, config.gemini);
            }

            if (selectedModel.includes('llama') || selectedModel.includes('mixtral')) {
                if (!config.groq) throw new Error('Groq API key not configured');
                return await this.callGroq(prompt, systemMessage, selectedModel, config.groq);
            }

            if (selectedModel.startsWith('grok-')) {
                if (!config.grok) throw new Error('Grok API key not configured');
                return await this.callGrok(prompt, systemMessage, selectedModel, config.grok);
            }

            // Default fallback based on what's configured
            if (config.openai) return await this.callOpenAI(prompt, systemMessage, selectedModel, config.openai);
            if (config.gemini) return await this.callGemini(prompt, systemMessage, selectedModel, config.gemini);

            throw new Error('No compatible AI provider configured for this model');
        } catch (error) {
            console.error('[AIService] Generation error:', error.message);
            throw new Error(`AI generation failed: ${error.message}`);
        }
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(prompt, systemMessage, model, key) {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: model,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * Call Google Gemini API
     */
    async callGemini(prompt, systemMessage, model, key) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        const response = await axios.post(url, {
            contents: [{
                role: 'user',
                parts: [{ text: `${systemMessage}\n\nUser Input: ${prompt}` }]
            }]
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            return response.data.candidates[0].content.parts[0].text;
        }

        throw new Error('Unexpected Gemini API response structure');
    }

    /**
     * Call Groq API (OpenAI Compatible)
     */
    async callGroq(prompt, systemMessage, model, key) {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: model,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * Call xAI Grok API (OpenAI Compatible)
     */
    async callGrok(prompt, systemMessage, model, key) {
        const response = await axios.post(
            'https://api.x.ai/v1/chat/completions',
            {
                model: model,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * Process a template with entity data
     */
    renderPrompt(template, entityData) {
        let prompt = template;
        const variables = {
            name: entityData.name || entityData.contact_name || 'Customer',
            email: entityData.email || '',
            company: entityData.company || '',
            status: entityData.status || '',
            source: entityData.source || '',
            type: entityData.client_type || 'Lead',
            phone: entityData.phone || '',
            score: entityData.lead_score || entityData.score || '0',
            ...entityData
        };

        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            prompt = prompt.replace(regex, variables[key]);
        });

        return prompt;
    }
}

module.exports = new AIService();
