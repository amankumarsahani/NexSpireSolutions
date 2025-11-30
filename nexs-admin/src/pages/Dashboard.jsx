import { useState, useEffect } from 'react';
import { clientsAPI, projectsAPI, leadsAPI, teamAPI, departmentAPI } from '../api';
import toast from 'react-hot-toast';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';

export default function Dashboard() {
    const [stats, setStats] = useState({
        clients: { total: 0, active: 0 },
        projects: { total: 0, inProgress: 0 },
        leads: { total: 0, qualified: 0 },
        teams: { total: 0 },
        departments: { total: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [clientsData, projectsData, leadsData, teamsData, departmentsData] = await Promise.all([
                clientsAPI.getStats().catch(() => ({ total: 0, active: 0 })),
                projectsAPI.getStats().catch(() => ({ total: 0, inProgress: 0 })),
                leadsAPI.getStats().catch(() => ({ total: 0, qualified: 0 })),
                teamAPI.getStats().catch(() => ({ total: 0 })),
                departmentAPI.getStats().catch(() => ({ total: 0 }))
            ]);

            setStats({
                clients: clientsData,
                projects: projectsData,
                leads: leadsData,
                teams: teamsData,
                departments: departmentsData
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
            trend: '+12%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconBg: 'bg-blue-500'
        },
        {
            title: 'Active Projects',
            value: stats.projects.total || 0,
            subtitle: `${stats.projects.inProgress || 0} in progress`,
            trend: '+8%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'purple',
            bgColor: 'bg-purple-50',
            iconBg: 'bg-purple-500'
        },
        {
            title: 'Total Leads',
            value: stats.leads.total || 0,
            subtitle: `${stats.leads.qualified || 0} qualified`,
            trend: '+23%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            color: 'green',
            bgColor: 'bg-green-50',
            iconBg: 'bg-green-500'
        },
        {
            title: 'Teams',
            value: stats.teams.total || 0,
            subtitle: `${stats.departments.total || 0} departments`,
            trend: '+5%',
            trendUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            iconBg: 'bg-indigo-500'
        }
    ];

    // Sample data for charts
    const revenueData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Revenue',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const projectStatusData = {
        labels: ['Planning', 'In Progress', 'Completed', 'On Hold'],
        datasets: [
            {
                data: [8, 15, 32, 5],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)'
                ],
                borderWidth: 0
            }
        ]
    };

    const leadFunnelData = {
        labels: ['New', 'Contacted', 'Qualified', 'Proposal', 'Won'],
        datasets: [
            {
                label: 'Leads',
                data: [45, 35, 25, 15, 10],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2
            }
        ]
    };

    const teamPerformanceData = {
        labels: ['Engineering', 'Design', 'Marketing', 'Sales'],
        datasets: [
            {
                label: 'Completed Projects',
                data: [12, 8, 10, 6],
                backgroundColor: 'rgba(99, 102, 241, 0.8)'
            }
        ]
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
                <p className="text-blue-100">Here's what's happening with your business today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                                <div className={`${card.iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                                    {card.icon}
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${card.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {card.trend}
                            </span>
                        </div>
                        <h3 className="text-slate-600 text-sm font-medium mb-1">{card.title}</h3>
                        <p className="text-3xl font-bold text-slate-900 mb-1">{card.value}</p>
                        <p className="text-xs text-slate-500">{card.subtitle}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Revenue Trend (Last 6 Months)</h2>
                    <LineChart data={revenueData} height={250} />
                </div>

                {/* Project Status Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Project Status Distribution</h2>
                    <PieChart data={projectStatusData} type="doughnut" height={250} />
                </div>

                {/* Lead Funnel */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Lead Conversion Funnel</h2>
                    <BarChart data={leadFunnelData} height={250} />
                </div>

                {/* Team Performance */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Team Performance</h2>
                    <BarChart data={teamPerformanceData} height={250} horizontal />
                </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        {[
                            { icon: '👥', label: 'Add Client', color: 'blue' },
                            { icon: '📁', label: 'New Project', color: 'purple' },
                            { icon: '💼', label: 'Add Lead', color: 'green' },
                            { icon: '👨‍💼', label: 'Create Team', color: 'indigo' }
                        ].map((action, index) => (
                            <button
                                key={index}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left"
                            >
                                <span className="text-2xl">{action.icon}</span>
                                <span className="font-medium text-sm text-slate-700">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {[
                            { icon: '👥', action: 'New client added', detail: 'Tech Innovations Inc', time: '2 hours ago' },
                            { icon: '📁', action: 'Project updated', detail: 'Website Redesign', time: '5 hours ago' },
                            { icon: '💼', action: 'Lead converted', detail: 'Marketing Pro Ltd', time: '1 day ago' },
                            { icon: '✅', action: 'Project completed', detail: 'Mobile App Development', time: '2 days ago' }
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <div className="text-2xl">{item.icon}</div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-slate-900">{item.action}</p>
                                    <p className="text-xs text-slate-600">{item.detail}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
