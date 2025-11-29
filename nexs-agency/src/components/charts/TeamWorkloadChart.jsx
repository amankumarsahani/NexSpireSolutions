import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TeamWorkloadChart({ data }) {
    const defaultData = [
        { name: 'John D.', activeProjects: 5, completedTasks: 24, capacity: 8 },
        { name: 'Sarah M.', activeProjects: 4, completedTasks: 31, capacity: 8 },
        { name: 'Mike R.', activeProjects: 6, completedTasks: 19, capacity: 8 },
        { name: 'Emma L.', activeProjects: 3, completedTasks: 28, capacity: 8 },
        { name: 'David K.', activeProjects: 5, completedTasks: 22, capacity: 8 }
    ];

    const chartData = data || defaultData;

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-team-line text-purple-600"></i>
                    Team Workload
                </h3>
                <p className="text-sm text-gray-500 mt-1">Active projects and task completion</p>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Bar dataKey="activeProjects" fill="#8B5CF6" name="Active Projects" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="completedTasks" fill="#10B981" name="Completed Tasks" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Team Capacity</span>
                    <span className="font-medium text-gray-900">
                        {chartData.reduce((sum, m) => sum + m.activeProjects, 0)} / {chartData.reduce((sum, m) => sum + m.capacity, 0)} Projects
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${(chartData.reduce((sum, m) => sum + m.activeProjects, 0) / chartData.reduce((sum, m) => sum + m.capacity, 0)) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
