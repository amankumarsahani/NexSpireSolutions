import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientAPI } from '../services/api';

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClient();
    }, [id]);

    const loadClient = async () => {
        try {
            const response = await clientAPI.getById(id);
            setClient(response.data.client);
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

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
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
            </div>
        </div>
    );
}
