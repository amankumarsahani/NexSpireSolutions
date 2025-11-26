import apiClient from './axios';

export const authAPI = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/signin', { email, password });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },
};

export const clientsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/clients', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/clients/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/clients', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/clients/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/clients/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/clients/stats');
        return response.data;
    },
};

export const projectsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/projects', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/projects/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/projects', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/projects/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/projects/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/projects/stats');
        return response.data;
    },

    createTask: async (projectId, data) => {
        const response = await apiClient.post(`/projects/${projectId}/tasks`, data);
        return response.data;
    },
};

export const leadsAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/leads', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/leads/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/leads', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/leads/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/leads/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/leads/stats');
        return response.data;
    },
};

export const inquiriesAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/inquiries', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/inquiries/${id}`);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await apiClient.patch(`/inquiries/${id}/status`, { status });
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/inquiries/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/inquiries/stats');
        return response.data;
    },
};

export const teamAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/team', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/team/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/team', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/team/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/team/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/team/stats');
        return response.data;
    },
};

export const departmentAPI = {
    getAll: async (params = {}) => {
        const response = await apiClient.get('/departments', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/departments/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/departments', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/departments/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/departments/${id}`);
        return response.data;
    },

    getStats: async () => {
        const response = await apiClient.get('/departments/stats');
        return response.data;
    },
};

export const employeesAPI = {
    getAll: async (params) => {
        const response = await apiClient.get('/employees', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await apiClient.get(`/employees/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await apiClient.post('/employees', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.put(`/employees/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete(`/employees/${id}`);
        return response.data;
    },
};

export const activityLogsAPI = {
    getAll: async (params) => {
        const response = await apiClient.get('/activity-logs', { params });
        return response.data;
    },
};

export const notificationsAPI = {
    getAll: async () => {
        const response = await apiClient.get('/notifications');
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data;
    },
    markRead: async (id) => {
        const response = await apiClient.put(`/notifications/${id}/read`);
        return response.data;
    },
    markAllRead: async () => {
        const response = await apiClient.put('/notifications/mark-all-read');
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete(`/notifications/${id}`);
        return response.data;
    }
};

