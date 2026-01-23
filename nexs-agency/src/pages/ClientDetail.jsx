import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientAPI } from '../services/api';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [activities, setActivities] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        loadClient();
    }, [id]);

    const loadClient = async () => {
        try {
            setLoading(true);
            const [clientRes, activityRes, paymentRes] = await Promise.all([
                clientAPI.getById(id),
                clientAPI.getActivities(id),
                clientAPI.getPayments(id)
            ]);

            setClient(clientRes.data.client);
            setActivities(activityRes.data.activities || []);
            setPayments(paymentRes.data.payments || []);
        } catch (error) {
            console.error('Error loading client:', error);
            alert('Failed to load client details');
            navigate('/admin/dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!client) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Breadcrumbs */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">Clients</span>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">{client.companyName}</span>
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate('/admin/dashboard')}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
                <i className="ri-arrow-left-line"></i>
                Back to Dashboard
            </button>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-8 border-b">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-4xl font-bold text-green-600">
                            <i className="ri-building-line"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.companyName}</h1>
                            <p className="text-xl text-gray-600 mt-1">{client.industry}</p>
                            <span className={`inline-block px-3 py-1 text-sm rounded-full mt-3 ${client.status === 'active' ? 'bg-green-100 text-green-800' :
                                client.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {client.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[500px]">
                    <div className="border-b px-8">
                        <nav className="-mb-px flex space-x-8">
                            {['details', 'activities', 'payments'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                    py-4 px-1 border-b-2 font-medium text-sm capitalize
                                    ${activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-8">
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-gray-500 block">Contact Person</label>
                                            <p className="font-medium">{client.contactName}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500 block">Email</label>
                                            <p className="font-medium">{client.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500 block">Phone</label>
                                            <p className="font-medium">{client.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500 block">Status</label>
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                                                }`}>{client.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-gray-500 block">Location</label>
                                            <p className="font-medium">
                                                {client.city && client.country ? `${client.city}, ${client.country}` : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500 block">Full Address</label>
                                            <p className="font-medium">{client.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activities' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
                                <div className="space-y-6">
                                    {activities.length === 0 ? (
                                        <p className="text-gray-500">No activities found.</p>
                                    ) : (
                                        activities.map((activity) => (
                                            <div key={activity.id} className="flex gap-4">
                                                <div className="mt-1">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                        <i className="ri-history-line"></i>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{activity.summary}</p>
                                                    <p className="text-sm text-gray-600">{activity.details}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(activity.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {payments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No payments found.</td>
                                                </tr>
                                            ) : (
                                                payments.map((payment) => (
                                                    <tr key={payment.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {new Date(payment.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            ₹{payment.amount}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.status === 'success' ? 'bg-green-100 text-green-800' :
                                                                payment.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {payment.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {payment.razorpay_payment_id || payment.invoice_number || 'N/A'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
