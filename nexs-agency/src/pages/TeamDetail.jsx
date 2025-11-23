import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { teamAPI } from '../services/api';

export default function TeamDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMember();
    }, [id]);

    const loadMember = async () => {
        try {
            const response = await teamAPI.getById(id);
            setMember(response.data.data);
        } catch (error) {
            console.error('Error loading team member:', error);
            alert('Failed to load team member details');
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

    if (!member) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Breadcrumbs */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">Team</span>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">{member.name}</span>
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
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600">
                            {member.name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
                            <p className="text-xl text-gray-600 mt-1">{member.position}</p>
                            <span className={`inline-block px-3 py-1 text-sm rounded-full mt-3 ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {member.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500 block">Email</label>
                                <p className="font-medium">{member.email}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block">Phone</label>
                                <p className="font-medium">{member.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500 block">Department</label>
                                <p className="font-medium">{member.department}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block">Workload</label>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${member.workload || 0}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{member.workload || 0}% Capacity</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
