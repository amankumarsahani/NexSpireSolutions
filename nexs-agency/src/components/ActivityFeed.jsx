import React from 'react';

export default function ActivityFeed({ activities }) {
    const defaultActivities = [
        { id: 1, type: 'lead', action: 'created', title: 'New Lead: Tech Solutions Inc.', user: 'Sarah M.', timestamp: '2 hours ago', icon: 'ri-user-add-line', color: 'blue' },
        { id: 2, type: 'project', action: 'completed', title: 'Project "Mobile App" completed', user: 'John D.', timestamp: '4 hours ago', icon: 'ri-checkbox-circle-line', color: 'green' },
        { id: 3, type: 'client', action: 'updated', title: 'Client status updated: Active', user: 'Mike R.', timestamp: '6 hours ago', icon: 'ri-edit-line', color: 'purple' },
        { id: 4, type: 'lead', action: 'converted', title: 'Lead converted to client', user: 'Emma L.', timestamp: '1 day ago', icon: 'ri-arrow-right-circle-line', color: 'orange' },
        { id: 5, type: 'task', action: 'completed', title: 'Task completed: Design review', user: 'David K.', timestamp: '1 day ago', icon: 'ri-task-line', color: 'indigo' }
    ];

    const activityList = activities || defaultActivities;

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
            indigo: 'bg-indigo-100 text-indigo-600',
            red: 'bg-red-100 text-red-600'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <i className="ri-history-line text-indigo-600"></i>
                        Recent Activity
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Latest updates and actions</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>

            <div className="space-y-4">
                {activityList.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getColorClasses(activity.color)}`}>
                            <i className={`${activity.icon} text-lg`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">by {activity.user}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{activity.timestamp}</span>
                            </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <i className="ri-more-line"></i>
                        </button>
                    </div>
                ))}
            </div>

            {activityList.length === 0 && (
                <div className="text-center py-12">
                    <i className="ri-inbox-line text-5xl text-gray-300"></i>
                    <p className="text-gray-500 mt-3">No recent activity</p>
                </div>
            )}
        </div>
    );
}
