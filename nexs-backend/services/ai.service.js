/**
 * AI Service
 * Interface for communicating with Large Language Models
 */

const axios = require('axios');

class AIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || null;
        this.apiType = process.env.OPENAI_API_KEY ? 'openai' : 'gemini';

        // Model configurations
        this.models = {
            openai: 'gpt-4o-mini',
            gemini: 'gemini-1.5-flash'
        };
    }

    /**
     * Generate content from a prompt
     */
    async generateContent(prompt, systemMessage = 'You are a helpful CRM assistant.', model = null) {
        if (!this.apiKey) {
            console.warn('[AIService] No API key found in environment variables. AI features will be disabled.');
            return 'AI Service unavailable: Missing API Key.';
        }

        try {
            if (this.apiType === 'openai') {
                return await this.callOpenAI(prompt, systemMessage, model || this.models.openai);
            } else {
                return await this.callGemini(prompt, systemMessage, model || this.models.gemini);
            }
        } catch (error) {
            console.error('[AIService] Generation error:', error.message);
            throw new Error(`AI generation failed: ${error.message}`);
        }
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(prompt, systemMessage, model) {
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
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    /**
     * Call Google Gemini API
     */
    async callGemini(prompt, systemMessage, model) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

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
