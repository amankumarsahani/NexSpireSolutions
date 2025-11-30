import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClientDetails();
    }, [id]);

    const fetchClientDetails = async () => {
        try {
            const data = await clientsAPI.getById(id);
            setClient(data.client);
            setProjects(data.projects || []);
            setStats(data.stats || {});
        } catch (error) {
            toast.error('Failed to load client details');
            console.error(error);
            navigate('/clients');
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
            active: 'bg-green-100 text-green-800',
            prospect: 'bg-blue-100 text-blue-800',
            inactive: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || colors.active;
    };

    const getProjectStatusColor = (status) => {
        const colors = {
            'planning': 'bg-blue-100 text-blue-800',
            'in-progress': 'bg-purple-100 text-purple-800',
            'completed': 'bg-green-100 text-green-800',
            'on-hold': 'bg-orange-100 text-orange-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!client) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/clients')}
                        className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2 text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Clients
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">{client.companyName}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)}`}>
                            {client.status}
                        </span>
                        <span className="text-slate-500 text-sm">{client.industry}</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/projects?clientId=${client.id}`)} // Assuming we can filter projects list
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    View All Projects
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Projects</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalProjects || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">Active Projects</p>
                    <p className="text-2xl font-bold text-slate-900">{stats?.activeProjects || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Contact Person</p>
                            <p className="text-slate-900">{client.contactName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Email</p>
                            <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">{client.email}</a>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                            <p className="text-slate-900">{client.phone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Website</p>
                            <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {client.website || 'N/A'}
                            </a>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Address</p>
                            <p className="text-slate-900 whitespace-pre-line">
                                {client.address}<br />
                                {client.city}, {client.country}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Projects List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Projects</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Project Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Budget</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Timeline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{project.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getProjectStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{formatCurrency(project.budget)}</td>
                                        <td className="px-4 py-3 text-slate-600 text-sm">
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                                            {' - '}
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                        </td>
                                    </tr>
                                ))}
                                {projects.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                            No projects found for this client.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
