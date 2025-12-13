import React, { useState, useEffect } from 'react';
import { emailTemplateAPI } from '../services/api';

const CATEGORIES = [
    { value: 'notification', label: 'Notification', color: '#3b82f6' },
    { value: 'marketing', label: 'Marketing', color: '#10b981' },
    { value: 'transactional', label: 'Transactional', color: '#f59e0b' },
    { value: 'system', label: 'System', color: '#6366f1' }
];

const SAMPLE_DATA = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    company: 'Acme Corp',
    message: 'Hello, I would like to inquire about your services.',
    inquiryId: '12345',
    timestamp: new Date().toLocaleString()
};

export default function EmailTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const [activeTab, setActiveTab] = useState('editor');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        html_content: '',
        description: '',
        variables: [],
        category: 'notification',
        is_active: true
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await emailTemplateAPI.getAll();
            setTemplates(response.data.data || []);
        } catch (err) {
            setError('Failed to load templates');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                variables: formData.variables.length > 0
                    ? formData.variables
                    : extractVariables(formData.html_content)
            };

            if (editingTemplate) {
                await emailTemplateAPI.update(editingTemplate.id, data);
            } else {
                await emailTemplateAPI.create(data);
            }

            setIsModalOpen(false);
            resetForm();
            loadTemplates();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save template');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await emailTemplateAPI.delete(id);
            loadTemplates();
        } catch (err) {
            setError('Failed to delete template');
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            subject: template.subject || '',
            html_content: template.html_content,
            description: template.description || '',
            variables: template.variables || [],
            category: template.category || 'notification',
            is_active: template.is_active
        });
        setIsModalOpen(true);
        setActiveTab('editor');
    };

    const handlePreview = async () => {
        if (!editingTemplate && !formData.html_content) {
            setPreviewHtml('<p style="color: #666; text-align: center;">Add some HTML content to preview</p>');
            return;
        }

        try {
            if (editingTemplate) {
                const response = await emailTemplateAPI.preview(editingTemplate.id, SAMPLE_DATA);
                setPreviewHtml(response.data.html);
            } else {
                // For new templates, do client-side preview
                let html = formData.html_content;
                Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
                    html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
                });
                setPreviewHtml(html);
            }
            setActiveTab('preview');
        } catch (err) {
            setError('Failed to generate preview');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            subject: '',
            html_content: '',
            description: '',
            variables: [],
            category: 'notification',
            is_active: true
        });
        setEditingTemplate(null);
        setPreviewHtml('');
    };

    const extractVariables = (html) => {
        const matches = html.match(/{{\\s*(\\w+)\\s*}}/g) || [];
        return [...new Set(matches.map(m => m.replace(/[{}\s]/g, '')))];
    };

    const insertVariable = (varName) => {
        const textarea = document.getElementById('html_content');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.html_content;
        const newText = text.substring(0, start) + `{{${varName}}}` + text.substring(end);
        setFormData({ ...formData, html_content: newText });
    };

    const getCategoryBadge = (category) => {
        const cat = CATEGORIES.find(c => c.value === category);
        return cat ? (
            <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: `${cat.color}20`,
                color: cat.color
            }}>
                {cat.label}
            </span>
        ) : null;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="animate-spin" style={{
                    width: '40px', height: '40px', border: '3px solid #e5e7eb',
                    borderTopColor: '#3b82f6', borderRadius: '50%'
                }}></div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Email Templates</h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Manage your email templates</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>+</span> New Template
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    borderRadius: '8px',
                    marginBottom: '16px'
                }}>
                    {error}
                    <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            {/* Templates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {templates.map(template => (
                    <div
                        key={template.id}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{template.name}</h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{template.description || 'No description'}</p>
                            </div>
                            {getCategoryBadge(template.category)}
                        </div>

                        {template.subject && (
                            <p style={{ margin: '8px 0', fontSize: '13px', color: '#6b7280' }}>
                                <strong>Subject:</strong> {template.subject}
                            </p>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                            {(template.variables || []).slice(0, 5).map(v => (
                                <span key={v} style={{
                                    padding: '2px 6px',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    fontFamily: 'monospace'
                                }}>
                                    {`{{${v}}}`}
                                </span>
                            ))}
                            {(template.variables || []).length > 5 && (
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>+{template.variables.length - 5} more</span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                            <button
                                onClick={() => handleEdit(template)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(template.id)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {templates.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '12px',
                        color: '#6b7280'
                    }}>
                        <p style={{ fontSize: '18px', marginBottom: '8px' }}>No templates yet</p>
                        <p>Create your first email template to get started</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '900px',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>
                                {editingTemplate ? 'Edit Template' : 'New Template'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#9ca3af'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                            {['editor', 'preview'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => tab === 'preview' ? handlePreview() : setActiveTab(tab)}
                                    style={{
                                        padding: '12px 24px',
                                        border: 'none',
                                        background: activeTab === tab ? '#f8fafc' : 'transparent',
                                        borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                                        cursor: 'pointer',
                                        fontWeight: activeTab === tab ? '600' : '400',
                                        color: activeTab === tab ? '#1e293b' : '#64748b',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                            {activeTab === 'editor' ? (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                                Template Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g., welcome-email"
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                            Email Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="e.g., Welcome to NexSpire Solutions, {{name}}!"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description of this template"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <label style={{ fontWeight: '500', fontSize: '14px' }}>
                                                HTML Content *
                                            </label>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {['name', 'email', 'message'].map(v => (
                                                    <button
                                                        key={v}
                                                        type="button"
                                                        onClick={() => insertVariable(v)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#f3f4f6',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontFamily: 'monospace'
                                                        }}
                                                    >
                                                        {`{{${v}}}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <textarea
                                            id="html_content"
                                            value={formData.html_content}
                                            onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                                            placeholder="<h1>Hello {{name}}</h1>..."
                                            required
                                            style={{
                                                width: '100%',
                                                height: '300px',
                                                padding: '12px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontFamily: 'monospace',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#f3f4f6',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePreview}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#f8fafc',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Preview
                                        </button>
                                        <button
                                            type="submit"
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {editingTemplate ? 'Save Changes' : 'Create Template'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
                                        Preview with sample data. Variables are replaced with test values.
                                    </p>
                                    <div
                                        style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            backgroundColor: '#f9fafb'
                                        }}
                                    >
                                        <iframe
                                            srcDoc={previewHtml}
                                            title="Email Preview"
                                            style={{
                                                width: '100%',
                                                height: '500px',
                                                border: 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
