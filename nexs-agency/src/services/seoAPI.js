import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const seoAPI = {
    // Run SEO analysis on a URL
    analyze: (url, clientId = null) => {
        return axios.post(`${API_URL}/seo/analyze`, { url, client_id: clientId });
    },

    // Get all SEO reports
    getAllReports: () => {
        return axios.get(`${API_URL}/seo/reports`);
    },

    // Get reports for a specific client
    getClientReports: (clientId) => {
        return axios.get(`${API_URL}/seo/reports/${clientId}`);
    },

    // Get a specific report by ID
    getReport: (id) => {
        return axios.get(`${API_URL}/seo/report/${id}`);
    },

    // Delete a report
    deleteReport: (id) => {
        return axios.delete(`${API_URL}/seo/report/${id}`);
    },

    // Export report as PDF (future feature)
    exportPDF: (id) => {
        return axios.get(`${API_URL}/seo/export/${id}/pdf`, {
            responseType: 'blob'
        });
    }
};
