import React from 'react';
import { FunnelChart, Funnel, Cell, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function LeadFunnelChart({ data }) {
    // Default funnel data
    const defaultData = [
        { name: 'New Leads', value: 100, fill: '#3B82F6' },
        { name: 'Contacted', value: 75, fill: '#8B5CF6' },
        { name: 'Qualified', value: 50, fill: '#F59E0B' },
        { name: 'Converted', value: 25, fill: '#10B981' }
    ];

    const chartData = data || defaultData;

    // Calculate conversion rates
    const getConversionRate = (index) => {
        if (index === 0) return null;
        const rate = ((chartData[index].value / chartData[index - 1].value) * 100).toFixed(1);
        return `${rate}%`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-funnel-line text-orange-600"></i>
                    Lead Conversion Funnel
                </h3>
                <p className="text-sm text-gray-500 mt-1">Track lead progression and conversion rates</p>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <FunnelChart>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                        }}
                    />
                    <Funnel
                        dataKey="value"
                        data={chartData}
                        isAnimationActive
                    >
                        <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>

            {/* Conversion Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
                {chartData.slice(1).map((item, index) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">{item.name}</p>
                        <p className="text-lg font-bold text-gray-900">{item.value}</p>
                        <p className="text-xs text-green-600 font-medium">
                            {getConversionRate(index + 1)} conversion
                        </p>
                    </div>
                ))}
            </div>

            {/* Overall Conversion Rate */}
            <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-gray-600">Overall Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                    {((chartData[chartData.length - 1].value / chartData[0].value) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {chartData[chartData.length - 1].value} of {chartData[0].value} leads converted
                </p>
            </div>
        </div>
    );
}
