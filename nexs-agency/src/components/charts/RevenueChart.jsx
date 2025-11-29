import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RevenueChart({ data, timePeriod = 'month' }) {
    // Sample data structure if no data provided
    const defaultData = [
        { name: 'Jan', revenue: 4500, projects: 12, clients: 8 },
        { name: 'Feb', revenue: 5200, projects: 15, clients: 10 },
        { name: 'Mar', revenue: 4800, projects: 13, clients: 9 },
        { name: 'Apr', revenue: 6100, projects: 18, clients: 12 },
        { name: 'May', revenue: 7200, projects: 21, clients: 15 },
        { name: 'Jun', revenue: 6800, projects: 19, clients: 14 }
    ];

    const chartData = data || defaultData;

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <i className="ri-line-chart-line text-blue-600"></i>
                        Revenue Trends
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Track your revenue over time</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        {timePeriod}
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue ($)"
                    />
                    <Line
                        type="monotone"
                        dataKey="projects"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981', r: 4 }}
                        name="Projects"
                    />
                    <Line
                        type="monotone"
                        dataKey="clients"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{ fill: '#8B5CF6', r: 4 }}
                        name="Clients"
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-xl font-bold text-blue-600">
                        ${chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Total Projects</p>
                    <p className="text-xl font-bold text-green-600">
                        {chartData.reduce((sum, item) => sum + item.projects, 0)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-xl font-bold text-purple-600">
                        {chartData.reduce((sum, item) => sum + item.clients, 0)}
                    </p>
                </div>
            </div>
        </div>
    );
}
