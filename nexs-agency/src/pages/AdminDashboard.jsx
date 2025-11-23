import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { teamAPI } from '../services/api';
import { clientAPI } from '../services/api';
import { projectAPI } from '../services/api';
import { leadAPI } from '../services/api';
import { messageAPI } from '../services/api';
export default function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize activeTab from URL query param
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        return params.get('tab') || 'dashboard';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [teamMembers, setTeamMembers] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [leads, setLeads] = useState([]);
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState({
        team: {},
        clients: {},
        projects: {},
        leads: {}
    });
    const [loading, setLoading] = useState(false);

    // Filter & Search State
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });

    // New Team Member Form
    const [newTeamMember, setNewTeamMember] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        status: 'active',
        workload: 0
    });

    // New Client Form
    const [newClient, setNewClient] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        industry: '',
        status: 'prospect'
    });

    // New Project Form
    const [newProject, setNewProject] = useState({
        projectName: '',
        clientId: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'planning'
    });

    // New Lead Form
    const [newLead, setNewLead] = useState({
        company: '',
        contactName: '',
        email: '',
        phone: '',
        leadSource: '',
        status: 'new',
        estimatedValue: ''
    });

    // Comments State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    // Load dashboard stats
    useEffect(() => {
        loadDashboardStats();
    }, []);

    // Update activeTab when URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab') || 'dashboard';
        setActiveTab(tab);
    }, [location.search]);

    // Load data based on active tab
    useEffect(() => {
        if (activeTab !== 'dashboard') {
            setFilters({ search: '', status: 'all' });
            loadData();
        }
    }, [activeTab]);

    const loadDashboardStats = async () => {
        try {
            const [teamStats, clientStats, projectStats, leadStats] = await Promise.all([
                teamAPI.getStats(),
                clientAPI.getStats(),
                projectAPI.getStats(),
                leadAPI.getStats()
            ]);

            setStats({
                team: teamStats.data.data || {},
                clients: clientStats.data.stats || {},
                projects: projectStats.data.stats || {},
                leads: leadStats.data.stats || {}
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'team') {
                const response = await teamAPI.getAll();
                setTeamMembers(response.data.data || []);
            } else if (activeTab === 'clients') {
                const response = await clientAPI.getAll();
                setClients(response.data.clients || []);
            } else if (activeTab === 'projects') {
                const [projectsRes, clientsRes] = await Promise.all([
                    projectAPI.getAll(),
                    clientAPI.getAll()
                ]);
                setProjects(projectsRes.data.projects || []);
                setClients(clientsRes.data.clients || []);
            } else if (activeTab === 'leads') {
                const response = await leadAPI.getAll();
                setLeads(response.data.leads || []);
            } else if (activeTab === 'messages') {
                const response = await messageAPI.getInbox();
                setMessages(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeamMember = async (e) => {
        e.preventDefault();
        try {
            await teamAPI.create(newTeamMember);
            alert('Team member created successfully!');
            setNewTeamMember({
                name: '',
                email: '',
                phone: '',
                position: '',
                department: '',
                status: 'active',
                workload: 0
            });
            loadData();
            loadDashboardStats();
        } catch (error) {
            alert('Error creating team member: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            await clientAPI.create(newClient);
            alert('Client created successfully!');
            setNewClient({
                companyName: '',
                contactName: '',
                email: '',
                phone: '',
                industry: '',
                status: 'prospect'
            });
            loadData();
            loadDashboardStats();
        } catch (error) {
            alert('Error creating client: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await projectAPI.create(newProject);
            alert('Project created successfully!');
            setNewProject({
                projectName: '',
                clientId: '',
                description: '',
                startDate: '',
                endDate: '',
                budget: '',
                status: 'planning'
            });
            loadData();
            loadDashboardStats();
        } catch (error) {
            alert('Error creating project: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        try {
            await leadAPI.create(newLead);
            alert('Lead created successfully!');
            setNewLead({
                company: '',
                contactName: '',
                email: '',
                phone: '',
                leadSource: '',
                status: 'new',
                estimatedValue: ''
            });
            loadData();
            loadDashboardStats();
        } catch (error) {
            alert('Error creating lead: ' + (error.response?.data?.message || error.message));
        }
    };

    // Filter Logic
    const getFilteredData = (data) => {
        return data.filter(item => {
            const matchesSearch = filters.search === '' ||
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(filters.search.toLowerCase())
                );

            const matchesStatus = filters.status === 'all' || item.status === filters.status;

            return matchesSearch && matchesStatus;
        });
    };

    const handleCardClick = (item) => {
        if (activeTab === 'team') navigate(`/admin/team/${item.id}`);
        if (activeTab === 'clients') navigate(`/admin/clients/${item.id}`);
        if (activeTab === 'projects') navigate(`/admin/projects/${item.id}`);
        if (activeTab === 'leads') navigate(`/admin/leads/${item.id}`);
    };

    return (
        <>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="px-8 py-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'dashboard' && 'Dashboard Overview'}
                            {activeTab === 'team' && 'Team Management'}
                            {activeTab === 'clients' && 'Client Management'}
                            {activeTab === 'projects' && 'Projects'}
                            {activeTab === 'leads' && 'Leads Pipeline'}
                            {activeTab === 'messages' && 'Messages'}
                        </h2>
                    </div>
                </div>

                {/* Filter Bar */}
                {activeTab !== 'dashboard' && activeTab !== 'messages' && (
                    <div className="px-8 py-4 bg-gray-50 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full md:w-48 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            {activeTab === 'team' && (
                                <>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </>
                            )}
                            {activeTab === 'clients' && (
                                <>
                                    <option value="active">Active</option>
                                    <option value="prospect">Prospect</option>
                                    <option value="inactive">Inactive</option>
                                </>
                            )}
                            {activeTab === 'projects' && (
                                <>
                                    <option value="planning">Planning</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="on-hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </>
                            )}
                            {activeTab === 'leads' && (
                                <>
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="qualified">Qualified</option>
                                    <option value="proposal">Proposal Sent</option>
                                    <option value="negotiation">Negotiation</option>
                                    <option value="won">Won</option>
                                    <option value="lost">Lost</option>
                                </>
                            )}
                        </select>
                    </div>
                )}

                <div className="p-8">
                    {/* Dashboard View */}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Total Team Members</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.team.total || 0}</h3>
                                    </div>
                                    <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center">
                                        <i className="ri-team-line text-2xl text-blue-600"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Total Clients</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.clients.total || 0}</h3>
                                    </div>
                                    <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center">
                                        <i className="ri-building-line text-2xl text-green-600"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Active Projects</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.projects.inProgress || 0}</h3>
                                    </div>
                                    <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                                        <i className="ri-folder-line text-2xl text-purple-600"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm">Total Leads</p>
                                        <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.leads.total || 0}</h3>
                                    </div>
                                    <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center">
                                        <i className="ri-user-star-line text-2xl text-orange-600"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {/* Team Tab */}
                            {activeTab === 'team' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Create Form */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                <i className="ri-user-add-line text-blue-600"></i>
                                                Add Team Member
                                            </h3>
                                            <form onSubmit={handleCreateTeamMember} className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Full Name"
                                                    value={newTeamMember.name}
                                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    value={newTeamMember.email}
                                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Phone"
                                                    value={newTeamMember.phone}
                                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, phone: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Position"
                                                    value={newTeamMember.position}
                                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, position: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Department"
                                                    value={newTeamMember.department}
                                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, department: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <button
                                                    type="submit"
                                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                                                >
                                                    Add Member
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="lg:col-span-2">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4">Team Members ({teamMembers.length})</h3>
                                            <div className="space-y-3">
                                                {teamMembers.map((member) => (
                                                    <div key={member.id} onClick={() => handleCardClick(member)} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white hover:bg-gray-50">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800">{member.name}</h4>
                                                                <p className="text-sm text-gray-600">{member.position} • {member.department}</p>
                                                                <p className="text-sm text-gray-500">{member.email}</p>
                                                            </div>
                                                            <span className={`px-3 py-1 text-xs rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {member.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clients Tab */}
                            {activeTab === 'clients' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                <i className="ri-building-2-line text-green-600"></i>
                                                Add Client
                                            </h3>
                                            <form onSubmit={handleCreateClient} className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Company Name"
                                                    value={newClient.companyName}
                                                    onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Contact Name"
                                                    value={newClient.contactName}
                                                    onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    value={newClient.email}
                                                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Phone"
                                                    value={newClient.phone}
                                                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Industry"
                                                    value={newClient.industry}
                                                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <button
                                                    type="submit"
                                                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                                                >
                                                    Add Client
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4">Clients ({clients.length})</h3>
                                            <div className="space-y-3">
                                                {clients.map((client) => (
                                                    <div key={client.id} onClick={() => handleCardClick(client)} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white hover:bg-gray-50">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800">{client.companyName}</h4>
                                                                <p className="text-sm text-gray-600">{client.contactName}</p>
                                                                <p className="text-sm text-gray-500">{client.email} • {client.industry}</p>
                                                            </div>
                                                            <span className={`px-3 py-1 text-xs rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                client.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {client.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Messages Tab */}
                            {activeTab === 'messages' && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <i className="ri-inbox-line text-purple-600"></i>
                                        Inbox ({messages.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <i className="ri-mail-line text-6xl mb-4 text-gray-300"></i>
                                                <p>No messages yet</p>
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <div key={message.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-gray-800">{message.subject}</h4>
                                                        {!message.isRead && (
                                                            <span className="bg-blue-500 text-white px-2 py-1 text-xs rounded-full">New</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">{message.message}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <i className="ri-user-line"></i>
                                                        <span>From: {message.senderFirstName} {message.senderLastName}</span>
                                                        <span>•</span>
                                                        <span>{new Date(message.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Projects Tab */}
                            {activeTab === 'projects' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                <i className="ri-folder-add-line text-purple-600"></i>
                                                Add Project
                                            </h3>
                                            <form onSubmit={handleCreateProject} className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Project Name"
                                                    value={newProject.projectName}
                                                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                <select
                                                    value={newProject.clientId}
                                                    onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                >
                                                    <option value="">Select Client</option>
                                                    {clients.map((client) => (
                                                        <option key={client.id} value={client.id}>{client.companyName}</option>
                                                    ))}
                                                </select>
                                                <textarea
                                                    placeholder="Description"
                                                    value={newProject.description}
                                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    rows="3"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="Start Date"
                                                    value={newProject.startDate}
                                                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="date"
                                                    placeholder="End Date"
                                                    value={newProject.endDate}
                                                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Budget"
                                                    value={newProject.budget}
                                                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <select
                                                    value={newProject.status}
                                                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                >
                                                    <option value="planning">Planning</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="on-hold">On Hold</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                                <button
                                                    type="submit"
                                                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-medium"
                                                >
                                                    Add Project
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4">Projects ({projects.length})</h3>
                                            <div className="space-y-3">
                                                {getFilteredData(projects).length === 0 ? (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <i className="ri-folder-line text-4xl mb-2 text-gray-300"></i>
                                                        <p>No projects found</p>
                                                    </div>
                                                ) : (
                                                    getFilteredData(projects).map((project) => (
                                                        <div
                                                            key={project.id}
                                                            onClick={() => handleCardClick(project)}
                                                            className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-800">{project.projectName}</h4>
                                                                    <p className="text-sm text-gray-600">{project.description}</p>
                                                                </div>
                                                                <span className={`px-3 py-1 text-xs rounded-full ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                    project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                                        project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                                                                            project.status === 'planning' ? 'bg-purple-100 text-purple-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {project.status}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                                                                <div><i className="ri-money-dollar-circle-line"></i> Budget: ${project.budget || 'N/A'}</div>
                                                                <div><i className="ri-calendar-line"></i> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Leads Tab */}
                            {activeTab === 'leads' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                <i className="ri-user-add-line text-orange-600"></i>
                                                Add Lead
                                            </h3>
                                            <form onSubmit={handleCreateLead} className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Company Name"
                                                    value={newLead.company}
                                                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Contact Name"
                                                    value={newLead.contactName}
                                                    onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    value={newLead.email}
                                                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="Phone"
                                                    value={newLead.phone}
                                                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <select
                                                    value={newLead.leadSource}
                                                    onChange={(e) => setNewLead({ ...newLead, leadSource: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                >
                                                    <option value="">Select Source</option>
                                                    <option value="website">Website</option>
                                                    <option value="referral">Referral</option>
                                                    <option value="social-media">Social Media</option>
                                                    <option value="cold-call">Cold Call</option>
                                                    <option value="event">Event</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Estimated Value ($)"
                                                    value={newLead.estimatedValue}
                                                    onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                                <select
                                                    value={newLead.status}
                                                    onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                >
                                                    <option value="new">New</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="qualified">Qualified</option>
                                                    <option value="proposal">Proposal Sent</option>
                                                    <option value="negotiation">Negotiation</option>
                                                    <option value="won">Won</option>
                                                    <option value="lost">Lost</option>
                                                </select>
                                                <button
                                                    type="submit"
                                                    className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 font-medium"
                                                >
                                                    Add Lead
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <h3 className="text-lg font-bold mb-4">Leads Pipeline ({leads.length})</h3>
                                            <div className="space-y-3">
                                                {getFilteredData(leads).length === 0 ? (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <i className="ri-user-star-line text-4xl mb-2 text-gray-300"></i>
                                                        <p>No leads found</p>
                                                    </div>
                                                ) : (
                                                    getFilteredData(leads).map((lead) => (
                                                        <div
                                                            key={lead.id}
                                                            onClick={() => handleCardClick(lead)}
                                                            className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-800">{lead.company}</h4>
                                                                    <p className="text-sm text-gray-600">{lead.contactName}</p>
                                                                    <p className="text-sm text-gray-500">{lead.email}</p>
                                                                </div>
                                                                <span className={`px-3 py-1 text-xs rounded-full ${lead.status === 'won' ? 'bg-green-100 text-green-800' :
                                                                    lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                                                                        lead.status === 'proposal' ? 'bg-purple-100 text-purple-800' :
                                                                            lead.status === 'negotiation' ? 'bg-yellow-100 text-yellow-800' :
                                                                                lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {lead.status}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                                                                {lead.leadSource && <div><i className="ri-compass-line"></i> Source: {lead.leadSource}</div>}
                                                                {lead.estimatedValue && <div><i className="ri-money-dollar-circle-line"></i> Est. Value: ${lead.estimatedValue}</div>}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>


        </>
    );
}