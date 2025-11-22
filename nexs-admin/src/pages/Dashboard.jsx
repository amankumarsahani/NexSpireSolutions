import { useState, useEffect } from 'react';
import { clientsAPI, projectsAPI, leadsAPI } from '../api';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const [stats, setStats] = useState({
        clients: { total: 0, active: 0 },
        projects: { total: 0, inProgress: 0 },
        leads: { total: 0, qualified: 0 },
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [clientsData, projectsData, leadsData] = await Promise.all([
                clientsAPI.getStats(),
                projectsAPI.getStats(),
                leadsAPI.getStats(),
            ]);

            setStats({
                clients: clientsData,
                projects: projectsData,
                leads: leadsData,
            });
        } catch (error) {
            toast.error('Failed to load statistics');
            console.error('Stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Clients',
            value: stats.clients.total || 0,
            subtitle: `${stats.clients.active || 0} active`,
            icon: '👥',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'Projects',
            value: stats.projects.total || 0,
            subtitle: `${stats.projects.inProgress || 0} in progress`,
            icon: '📁',
            gradient: 'from-purple-500 to-pink-500',
        },
        {
            title: 'Leads',
            value: stats.leads.total || 0,
            subtitle: `${stats.leads.qualified || 0} qualified`,
            icon: '💼',
            gradient: 'from-green-500 to-teal-500',
        },
        {
            title: 'Success Rate',
            value: '98%',
            subtitle: 'Client satisfaction',
            icon: '📈',
            gradient: 'from-orange-500 to-red-500',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's your overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                                {card.icon}
                            </div>
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                        <p className="text-sm text-gray-500">{card.subtitle}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-all">
                            + Add New Client
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-all">
                            + Create Project
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-all">
                            + Add Lead
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                            <span className="text-lg">👥</span>
                            <div>
                                <p className="font-medium text-gray-900">New client added</p>
                                <p className="text-gray-500 text-xs">2 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                            <span className="text-lg">📁</span>
                            <div>
                                <p className="font-medium text-gray-900">Project updated</p>
                                <p className="text-gray-500 text-xs">5 hours ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                            <span className="text-lg">💼</span>
                            <div>
                                <p className="font-medium text-gray-900">Lead converted</p>
                                <p className="text-gray-500 text-xs">1 day ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
