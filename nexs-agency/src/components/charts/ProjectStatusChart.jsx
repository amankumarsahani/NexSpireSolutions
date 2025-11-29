import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function ProjectStatusChart({ data }) {
    // Default data if none provided
    const defaultData = [
        { name: 'Planning', value: 8, color: '#F59E0B' },
        { name: 'Active', value: 24, color: '#10B981' },
        { name: 'On Hold', value: 5, color: '#6B7280' },
        { name: 'Completed', value: 43, color: '#3B82F6' }
    ];

    const chartData = data || defaultData;
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-pie-chart-line text-green-600"></i>
                    Project Status
                </h3>
                <p className="text-sm text-gray-500 mt-1">Distribution of project statuses</p>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1">
                            <p className="text-sm text-gray-700">{item.name}</p>
                            <p className="text-xs text-gray-500">
                                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
