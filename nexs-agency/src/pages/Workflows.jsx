import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI } from '../services/api';

const triggerLabels = {
    lead_created: 'Lead Created',
    client_created: 'Client Created',
    lead_status_changed: 'Lead Status Changed',
    client_status_changed: 'Client Status Changed',
    task_due: 'Task Due',
    form_submitted: 'Form Submitted',
    scheduled: 'Scheduled',
    manual: 'Manual Trigger'
};

export default function Workflows() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', trigger_type: 'lead_created' });

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const res = await workflowAPI.getAll();
            setWorkflows(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            alert('Workflow name is required');
            return;
        }
        setSaving(true);
        try {
            const res = await workflowAPI.create({
                name: formData.name,
                description: formData.description,
                trigger_type: formData.trigger_type
            });
            setShowModal(false);
            setFormData({ name: '', description: '', trigger_type: 'lead_created' });
            navigate(`/admin/workflows/${res.data?.workflowId || res.data?.data?.id}`);
        } catch (error) {
            alert('Failed to create workflow');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await workflowAPI.toggle(id);
            fetchWorkflows();
        } catch (error) {
            alert('Failed to toggle workflow');
        }
    };

    const handleRun = async (id) => {
        try {
            await workflowAPI.run(id);
            alert('Workflow execution started!');
        } catch (error) {
            alert('Failed to run workflow');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return;
        try {
            await workflowAPI.delete(id);
            fetchWorkflows();
        } catch (error) {
            alert('Failed to delete workflow');
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
                    <p className="text-gray-500 mt-1">Automate your CRM tasks with triggers and actions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <i className="ri-add-line"></i>
                    New Workflow
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="ri-flow-chart text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
                            <p className="text-xs text-gray-500">Total Workflows</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <i className="ri-check-line text-green-600 text-xl"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{workflows.filter(w => w.is_active).length}</p>
                            <p className="text-xs text-gray-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i className="ri-play-circle-line text-purple-600 text-xl"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0)}
                            </p>
                            <p className="text-xs text-gray-500">Total Runs</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <i className="ri-checkbox-circle-line text-emerald-600 text-xl"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {workflows.reduce((sum, w) => sum + (w.success_count || 0), 0)}
                            </p>
                            <p className="text-xs text-gray-500">Successful</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workflows Grid */}
            {workflows.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
                    <i className="ri-flow-chart text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No workflows yet</h3>
                    <p className="text-gray-500 mb-4">Create your first automation workflow</p>
                    <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        Create Workflow
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workflows.map(workflow => (
                        <div key={workflow.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                            <div className="p-4 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{workflow.name}</h3>
                                        {workflow.description && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{workflow.description}</p>
                                        )}
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer ml-2">
                                        <input
                                            type="checkbox"
                                            checked={workflow.is_active}
                                            onChange={() => handleToggle(workflow.id)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500">Trigger:</span>
                                    <span className="font-medium text-gray-700">
                                        {triggerLabels[workflow.trigger_type] || workflow.trigger_type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>{workflow.execution_count || 0} runs</span>
                                    <span>{workflow.success_count || 0} successful</span>
                                </div>
                            </div>
                            <div className="p-3 border-t flex items-center gap-2">
                                <button
                                    onClick={() => navigate(`/admin/workflows/${workflow.id}`)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1"
                                >
                                    <i className="ri-edit-line"></i>
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleRun(workflow.id)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-lg"
                                    title="Test Run"
                                >
                                    <i className="ri-play-fill"></i>
                                </button>
                                <button
                                    onClick={() => handleDelete(workflow.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 text-sm py-2 px-3 rounded-lg"
                                    title="Delete"
                                >
                                    <i className="ri-delete-bin-line"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Create Workflow</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name *</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Welcome New Leads"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    placeholder="What does this workflow do?"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.trigger_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, trigger_type: e.target.value }))}
                                >
                                    {Object.entries(triggerLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg" disabled={saving}>
                                Cancel
                            </button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={saving}>
                                {saving ? 'Creating...' : 'Create & Edit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
