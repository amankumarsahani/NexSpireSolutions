import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        status: 'todo'
    });

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const data = await projectsAPI.getById(id);
            setProject(data.project);
            setTasks(data.tasks || []);
            setDocuments(data.documents || []);
        } catch (error) {
            toast.error('Failed to load project details');
            console.error(error);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getStatusColor = (status) => {
        const colors = {
            'planning': 'bg-blue-100 text-blue-800',
            'in-progress': 'bg-purple-100 text-purple-800',
            'completed': 'bg-green-100 text-green-800',
            'on-hold': 'bg-orange-100 text-orange-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'low': 'bg-slate-100 text-slate-800',
            'medium': 'bg-blue-100 text-blue-800',
            'high': 'bg-orange-100 text-orange-800',
            'urgent': 'bg-red-100 text-red-800',
        };
        return colors[priority] || colors.medium;
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            await projectsAPI.createTask(id, taskData);
            toast.success('Task added successfully');
            setShowTaskModal(false);
            setTaskData({
                title: '',
                description: '',
                priority: 'medium',
                dueDate: '',
                status: 'todo'
            });
            fetchProjectDetails();
        } catch (error) {
            toast.error('Failed to add task');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2 text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Projects
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                            {project.status}
                        </span>
                        {project.clientName && (
                            <span className="text-slate-500 text-sm flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {project.clientName}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                        Edit Project
                    </button>
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Add Task
                    </button>
                </div>
            </div>

            {/* Project Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description & Stats */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Overview</h2>
                        <p className="text-slate-600 mb-6">{project.description || 'No description provided.'}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs font-semibold text-slate-500 uppercase">Budget</p>
                                <p className="text-lg font-bold text-slate-900">{formatCurrency(project.budget)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs font-semibold text-slate-500 uppercase">Start Date</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs font-semibold text-slate-500 uppercase">End Date</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-xs font-semibold text-slate-500 uppercase">Progress</p>
                                <p className="text-lg font-bold text-slate-900">{project.progress}%</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-700">Completion</span>
                                <span className="text-slate-500">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${project.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Tasks</h2>
                            <span className="text-sm text-slate-500">{tasks.length} tasks</span>
                        </div>

                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        <div>
                                            <p className={`font-medium text-slate-900 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-slate-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <p className="text-center text-slate-500 py-4">No tasks created yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Team Members (Placeholder for now) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Team</h2>
                        <div className="flex -space-x-2 overflow-hidden mb-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    U{i}
                                </div>
                            ))}
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                                +2
                            </div>
                        </div>
                        <button className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                            Manage Team
                        </button>
                    </div>

                    {/* Documents */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Documents</h2>
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Upload</button>
                        </div>
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                                        <p className="text-xs text-slate-500">{doc.category}</p>
                                    </div>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <p className="text-center text-slate-500 py-4 text-sm">No documents uploaded.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-6 text-slate-900">Add New Task</h2>
                        <form onSubmit={handleTaskSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Task Title *</label>
                                <input
                                    type="text"
                                    value={taskData.title}
                                    onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <textarea
                                    value={taskData.description}
                                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    rows="3"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                                    <select
                                        value={taskData.priority}
                                        onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        value={taskData.dueDate}
                                        onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                                >
                                    Add Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
