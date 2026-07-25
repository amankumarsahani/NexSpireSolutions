/**
 * AI Service
 * Interface for communicating with Large Language Models
 */

const axios = require('axios');
const db = require('../config/database');
const { decryptSecret } = require('./secretStore');

class AIService {
    constructor() {
        // Initial defaults from environment
        this.envApiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || null;
        this.envApiType = process.env.OPENAI_API_KEY ? 'openai' : 'gemini';

        // Model configurations
        this.models = {
            openai: 'gpt-4o-mini',
            gemini: 'gemini-3.6-flash',
            groq: 'openai/gpt-oss-120b',
            grok: 'grok-4.5'
        };

    }

    /**
     * Get active API configuration for the tenant
     */
    async getApiConfig() {
        try {
            const [settings] = await db.query(
                `SELECT setting_key, setting_value FROM settings
                 WHERE setting_key IN (
                    'openai_api_key', 'gemini_api_key', 'groq_api_key', 'grok_api_key',
                    'ai_preferred_provider', 'ai_preferred_model'
                 )`
            );

            const settingsMap = {};
            settings.forEach(s => settingsMap[s.setting_key] = s.setting_value);

            const config = {};
            const assignKey = (provider, settingKey) => {
                if (!settingsMap[settingKey]) return;
                try {
                    config[provider] = decryptSecret(settingsMap[settingKey]);
                } catch (err) {
                    console.warn(`[AIService] skipped unreadable ${settingKey}:`, err.message);
                }
            };

            assignKey('openai', 'openai_api_key');
            assignKey('gemini', 'gemini_api_key');
            assignKey('groq', 'groq_api_key');
            assignKey('grok', 'grok_api_key');
            config.preferredProvider = settingsMap.ai_preferred_provider || null;
            config.preferredModel = settingsMap.ai_preferred_model || null;

            if (process.env.OPENAI_API_KEY && !config.openai) {
                config.openai = process.env.OPENAI_API_KEY;
            }
            if (process.env.GEMINI_API_KEY && !config.gemini) {
                config.gemini = process.env.GEMINI_API_KEY;
            }
            if (process.env.GROQ_API_KEY && !config.groq) {
                config.groq = process.env.GROQ_API_KEY;
            }
            if (process.env.GROK_API_KEY && !config.grok) {
                config.grok = process.env.GROK_API_KEY;
            }

            // Fallback for primary/legacy logic if only environment keys exist
            if (!['openai', 'gemini', 'groq', 'grok'].some(provider => config[provider]) && this.envApiKey) {
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
     * Detect which provider owns a given model string.
     * Returns null when the model is unknown (try all providers).
     */
    _detectProvider(model) {
        if (!model) return null;
        if (model.startsWith('openai/gpt-oss-') || model.startsWith('qwen/')) return 'groq';
        if (model.startsWith('gpt-') || model.startsWith('o1-')) return 'openai';
        if (model.startsWith('gemini-'))                          return 'gemini';
        if (model.includes('llama') || model.includes('mixtral')) return 'groq';
        if (model.startsWith('grok-'))                            return 'grok';
        return null;
    }

    /**
     * Build an ordered list of provider attempts.
     * Primary provider (matching the requested model) goes first.
     * Fallback order: groq → openai → grok → gemini
     * (Groq leads fallbacks — most generous free tier, no rate limit issues)
     */
    _buildQueue(config, requestedModel) {
        // Fallback preference when a provider is rate-limited or unavailable
        const fallbackOrder = ['groq', 'openai', 'grok', 'gemini'];
        const preferredProvider = fallbackOrder.includes(config.preferredProvider)
            ? config.preferredProvider
            : null;
        const effectiveModel = requestedModel || config.preferredModel || null;
        const detectedProvider = this._detectProvider(effectiveModel);
        const primary = detectedProvider || preferredProvider;

        const queue = [];

        // 1. Primary (the provider that owns requestedModel, if configured)
        if (primary && config[primary]) {
            queue.push({
                provider: primary,
                model:    detectedProvider === primary ? effectiveModel : this.models[primary],
                key:      config[primary],
            });
        }

        // 2. Remaining configured providers in fallback order
        for (const p of fallbackOrder) {
            if (p !== primary && config[p]) {
                queue.push({ provider: p, model: this.models[p], key: config[p] });
            }
        }

        // 3. If no model was specified and no primary found, treat the first
        //    available provider as primary (happens when no model is requested)
        if (!primary && queue.length === 0) {
            for (const p of fallbackOrder) {
                if (config[p]) {
                    queue.push({ provider: p, model: this.models[p], key: config[p] });
                }
            }
        }

        return queue;
    }

    /** Dispatch a single attempt to the correct provider call. */
    async _dispatch({ provider, model, key }, prompt, systemMessage) {
        switch (provider) {
            case 'openai': return this.callOpenAI(prompt, systemMessage, model, key);
            case 'gemini': return this.callGemini(prompt, systemMessage, model, key);
            case 'groq':   return this.callGroq(prompt, systemMessage, model, key);
            case 'grok':   return this.callGrok(prompt, systemMessage, model, key);
            default:       throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Generate content from a prompt.
     * Automatically falls back to the next configured provider on:
     *   - 429 Too Many Requests (rate limit / quota)
     *   - 500 / 502 / 503 / 529 (server-side errors)
     *   - Network / timeout errors
     * Non-retryable errors (401 Unauthorized, 400 Bad Request, 404 Not Found)
     * are surfaced immediately without trying other providers.
     */
    async generateContent(prompt, systemMessage = 'You are a helpful CRM assistant.', model = null) {
        const config = await this.getApiConfig();

        if (!['openai', 'gemini', 'groq', 'grok'].some(provider => config[provider])) {
            throw new Error('No AI provider configured. Please add an API key in Settings > AI Integration.');
        }

        const queue = this._buildQueue(config, model);

        if (queue.length === 0) {
            throw new Error('No compatible AI provider configured for the requested model.');
        }

        console.log(`[AIService] Provider queue: ${queue.map(q => q.provider).join(' → ')}`);

        const failures = [];

        for (const attempt of queue) {
            try {
                console.log(`[AIService] Trying ${attempt.provider} (${attempt.model})${failures.length ? ' [fallback]' : ''}`);
                const result = await this._dispatch(attempt, prompt, systemMessage);

                if (failures.length > 0) {
                    console.log(`[AIService] ✓ Succeeded with fallback provider: ${attempt.provider}`);
                }
                return result;

            } catch (err) {
                const status = err.response?.status;

                // Non-retryable: auth failure or bad request — surface immediately
                if (status === 400 || status === 401 || status === 403) {
                    console.error(`[AIService] ${attempt.provider} non-retryable error ${status}: ${err.message}`);
                    throw new Error(`AI generation failed (${attempt.provider} ${status}): ${err.message}`);
                }

                // Retryable: rate limit, server errors, or network failures
                failures.push({ provider: attempt.provider, status: status || 'network', msg: err.message.slice(0, 120) });

                const isLast = failures.length >= queue.length;
                console.warn(
                    `[AIService] ${attempt.provider} failed (${status || 'network'})${isLast ? ' — all providers exhausted' : ' — trying next provider'}`
                );
            }
        }

        // All providers failed
        const summary = failures.map(f => `${f.provider}(${f.status})`).join(' → ');
        const detail  = failures.map(f => `${f.provider}: ${f.msg}`).join(' | ');
        console.error(`[AIService] All providers failed: ${detail}`);
        throw new Error(`All AI providers exhausted [${summary}]. Check your API keys and rate limits.`);
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
        // Ensure correct model format (some models need full path)
        const modelId = model.includes('/') ? model : model;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`;

        console.log(`[AIService] Calling Gemini API: ${modelId}`);

        try {
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
        } catch (error) {
            // Log more details about the error
            if (error.response) {
                console.error(`[AIService] Gemini API Error ${error.response.status}:`, JSON.stringify(error.response.data));
                if (error.response.status === 404) {
                    throw new Error(`Model '${modelId}' not found. Try 'gemini-3.6-flash'.`);
                }
            }
            throw error;
        }
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
