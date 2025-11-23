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

// Team Management
export const teamAPI = {
    getAll: (params) => api.get('/team', { params }),
    getById: (id) => api.get(`/team/${id}`),
    create: (data) => api.post('/team', data),
    update: (id, data) => api.put(`/team/${id}`, data),
    delete: (id) => api.delete(`/team/${id}`),
    getStats: () => api.get('/team/stats')
};

// Client Management
export const clientAPI = {
    getAll: (params) => api.get('/clients', { params }),
    getById: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
    getStats: () => api.get('/clients/stats')
};

// Project Management
export const projectAPI = {
    getAll: (params) => api.get('/projects', { params }),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
    getStats: () => api.get('/projects/stats')
};

// Lead Management
export const leadAPI = {
    getAll: (params) => api.get('/leads', { params }),
    getById: (id) => api.get(`/leads/${id}`),
    create: (data) => api.post('/leads', data),
    update: (id, data) => api.put(`/leads/${id}`, data),
    delete: (id) => api.delete(`/leads/${id}`),
    getStats: () => api.get('/leads/stats'),
    addComment: (id, comment) => api.post(`/leads/${id}/comments`, { comment }),
    getComments: (id) => api.get(`/leads/${id}/comments`)
};

// Messaging
export const messageAPI = {
    getInbox: () => api.get('/messages/inbox'),
    getOutbox: () => api.get('/messages/outbox'),
    getUnreadCount: () => api.get('/messages/unread-count'),
    getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
    send: (data) => api.post('/messages', data),
    markAsRead: (id) => api.put(`/messages/${id}/read`),
    markAllAsRead: () => api.put('/messages/read-all'),
    delete: (id) => api.delete(`/messages/${id}`),
    getStats: () => api.get('/messages/stats')
};

// Document Management
export const documentAPI = {
    getAll: (params) => api.get('/documents', { params }),
    getById: (id) => api.get(`/documents/${id}`),
    getByProject: (projectId) => api.get(`/documents/project/${projectId}`),
    upload: (formData) => api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/documents/${id}`, data),
    delete: (id) => api.delete(`/documents/${id}`),
    getStats: () => api.get('/documents/stats')
};

export default api;
