import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Authentication
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    signin: (data) => api.post('/auth/signin', data),
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
};

// Inquiry Management (Public - Contact Form)
export const inquiryAPI = {
    // Public endpoint - no authentication required
    submit: (data) => api.post('/inquiries', data),
    // Protected endpoints (admin only)
    getAll: (params) => api.get('/inquiries', { params }),
    getById: (id) => api.get(`/inquiries/${id}`),
    updateStatus: (id, status) => api.patch(`/inquiries/${id}/status`, { status }),
    delete: (id) => api.delete(`/inquiries/${id}`),
    getStats: () => api.get('/inquiries/stats')
};

// System Settings
export const settingsAPI = {
    getPublicSettings: () => api.get('/settings/public')
};

// Billing & Payments
export const billingAPI = {
    createPaymentLink: (data) => api.post('/billing/payment-link', data)
};

// Admin Backup Management
export const adminAPI = {
    getServers: () => api.get('/admin/servers'),
    getBackupAccounts: () => api.get('/admin/backup-accounts'),
    createBackupAccount: (data) => api.post('/admin/backup-accounts', data),
    updateBackupAccount: (id, data) => api.put(`/admin/backup-accounts/${id}`, data),
    deleteBackupAccount: (id) => api.delete(`/admin/backup-accounts/${id}`),
    exchangeGoogleOauthCode: (data) => api.post('/admin/backup-accounts/google-oauth/exchange', data),
    runBackupsNow: () => api.post('/admin/backup-accounts/run-now')
};

// Blog
export const blogAPI = {
    getAll: (params) => api.get('/blogs', { params }),
    getBySlug: (slug) => api.get(`/blogs/slug/${slug}`),
    getById: (id) => api.get(`/blogs/${id}`),
    create: (data) => api.post('/blogs', data),
    update: (id, data) => api.put(`/blogs/${id}`, data),
    delete: (id) => api.delete(`/blogs/${id}`)
};

export default api;
