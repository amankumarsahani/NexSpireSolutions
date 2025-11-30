import { useState, useEffect } from 'react';
import { activityLogsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const data = await activityLogsAPI.getAll();
            setLogs(Array.isArray(data) ? data : data.logs || []);
        } catch (error) {
            toast.error('Failed to load activity logs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        const colors = {
            create: 'bg-green-100 text-green-800',
            update: 'bg-blue-100 text-blue-800',
            delete: 'bg-red-100 text-red-800',
            login: 'bg-purple-100 text-purple-800'
        };
        return colors[action] || 'bg-gray-100 text-gray-800';
    };

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
                <h1 className="text-3xl font-bold text-slate-900">Activity Logs</h1>
                <p className="text-slate-600 mt-1">Track system usage and changes</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Entity</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Details</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-slate-900">{log.userName || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500">{log.userEmail}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-700 font-medium capitalize">
                                        {log.entityType} #{log.entityId}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-600 max-w-xs truncate" title={JSON.stringify(log.details)}>
                                        {JSON.stringify(log.details)}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                    No activity logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
