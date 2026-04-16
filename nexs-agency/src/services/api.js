import axios from 'axios';
import { snakeToCamel } from '../utils/mapKeys';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach AbortController signal if not already set
    if (!config.signal) {
        const controller = new AbortController();
        config.signal = controller.signal;
        config._abortController = controller;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        if (response.data) {
            response.data = snakeToCamel(response.data);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            cache.clear();
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
    }
);

const cache = new Map();
const MAX_CACHE_SIZE = 100;
const DEFAULT_TTL = 5 * 60 * 1000;

function getCacheKey(url, params) {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}::${paramStr}`;
}

function cacheSet(key, value) {
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
    cache.delete(key);
    cache.set(key, value);
}

function cachedGet(url, options = {}, ttl = DEFAULT_TTL) {
    const { params, ...rest } = options;
    const key = getCacheKey(url, params);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
        cache.delete(key);
        cache.set(key, cached);
        return Promise.resolve(cached.data);
    }

    return api.get(url, { params, ...rest }).then((response) => {
        cacheSet(key, { data: response, timestamp: Date.now() });
        return response;
    });
}

export function clearApiCache() {
    cache.clear();
}

// Authentication
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    signin: (data) => api.post('/auth/signin', data),
    getMe: () => api.get('/auth/me'),
    logout: () => {
        clearApiCache();
        return api.post('/auth/logout');
    }
};

// Inquiry Management (Public - Contact Form)
export const inquiryAPI = {
    // Public endpoint - no authentication required
    submit: (data) => api.post('/inquiries', data),
    // Protected endpoints (admin only)
    getAll: (params) => cachedGet('/inquiries', { params }),
    getById: (id) => cachedGet(`/inquiries/${id}`),
    updateStatus: (id, status) => api.patch(`/inquiries/${id}/status`, { status }),
    delete: (id) => api.delete(`/inquiries/${id}`),
    getStats: () => cachedGet('/inquiries/stats')
};

// System Settings
export const settingsAPI = {
    getPublicSettings: () => cachedGet('/settings/public')
};

// Billing & Payments
export const billingAPI = {
    createPaymentLink: (data) => api.post('/billing/payment-link', data)
};

// Admin Backup Management
export const adminAPI = {
    getServers: () => cachedGet('/admin/servers'),
    getBackupAccounts: () => cachedGet('/admin/backup-accounts'),
    createBackupAccount: (data) => api.post('/admin/backup-accounts', data),
    updateBackupAccount: (id, data) => api.put(`/admin/backup-accounts/${id}`, data),
    deleteBackupAccount: (id) => api.delete(`/admin/backup-accounts/${id}`),
    exchangeGoogleOauthCode: (data) => api.post('/admin/backup-accounts/google-oauth/exchange', data),
    runBackupsNow: () => api.post('/admin/backup-accounts/run-now')
};

// Blog
export const blogAPI = {
    getAll: (params) => cachedGet('/blogs', { params }),
    getBySlug: (slug) => cachedGet(`/blogs/slug/${slug}`),
    getById: (id) => cachedGet(`/blogs/${id}`),
    create: (data) => api.post('/blogs', data),
    update: (id, data) => api.put(`/blogs/${id}`, data),
    delete: (id) => api.delete(`/blogs/${id}`)
};

export default api;
