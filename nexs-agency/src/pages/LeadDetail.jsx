import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { leadAPI, clientAPI, projectAPI } from '../services/api';
import AddNoteModal from '../components/AddNoteModal';
import ConvertLeadModal from '../components/ConvertLeadModal';

export default function LeadDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);

    useEffect(() => {
        loadLead();
        loadComments();
    }, [id]);

    const loadLead = async () => {
        try {
            const response = await leadAPI.getById(id);
            setLead(response.data.lead);
        } catch (error) {
            console.error('Error loading lead:', error);
            alert('Failed to load lead details');
            navigate('/admin/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const response = await leadAPI.getComments(id);
            setComments(response.data.comments || []);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const response = await leadAPI.addComment(id, newComment);
            setComments([response.data.comment, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        }
    };

    const handleSaveNote = async (noteData) => {
        try {
            const response = await leadAPI.addComment(id, noteData.content);
            setComments([response.data.comment, ...comments]);
            setShowNoteModal(false);
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Failed to add note');
        }
    };

    const handleConvertLead = async (leadId, options) => {
        try {
            // Create client from lead info
            const clientPayload = {
                companyName: lead.company || lead.contactName,
                contactName: lead.contactName,
                email: lead.email,
                phone: lead.phone,
                industry: lead.leadSource || 'general',
                status: 'active'
            };
            const clientRes = await clientAPI.create(clientPayload);
            const newClientId = clientRes.data.client?.id || clientRes.data.id;

            // Optionally create project
            if (options?.createProject) {
                await projectAPI.create({
                    projectName: `Project for ${clientPayload.companyName}`,
                    clientId: newClientId,
                    description: `Auto-created from lead ${clientPayload.companyName}`,
                    status: 'planning'
                });
            }

            // Update lead status
            await leadAPI.update(leadId, { status: 'converted' });
            setLead({ ...lead, status: 'converted' });
            setShowConvertModal(false);
            alert('Lead converted to client successfully');
        } catch (error) {
            console.error('Error converting lead:', error);
            alert('Failed to convert lead');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Breadcrumbs */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">Leads</span>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">{lead.company}</span>
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate('/admin/dashboard')}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
                <i className="ri-arrow-left-line"></i>
                Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-8 border-b">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-4xl font-bold text-orange-600">
                                    <i className="ri-user-star-line"></i>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{lead.company}</h1>
                                    <p className="text-xl text-gray-600 mt-1">{lead.contactName}</p>
                                    <div className="mt-3 flex gap-3">
                                        <button
                                            onClick={() => setShowConvertModal(true)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                                        >
                                            <i className="ri-arrow-right-line"></i>
                                            Convert to Client
                                        </button>
                                        <button
                                            onClick={() => setShowNoteModal(true)}
                                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2"
                                        >
                                            <i className="ri-sticky-note-line"></i>
                                            Add Note
                                        </button>
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Pipeline Stage</label>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs">
                                            <div className={`h-2.5 rounded-full ${lead.status === 'won' ? 'bg-green-600 w-full' :
                                                lead.status === 'lost' ? 'bg-red-600 w-full' :
                                                    lead.status === 'negotiation' ? 'bg-yellow-500 w-3/4' :
                                                        lead.status === 'proposal' ? 'bg-purple-500 w-1/2' :
                                                            lead.status === 'qualified' ? 'bg-blue-500 w-1/3' :
                                                                'bg-gray-500 w-1/6'
                                                }`}></div>
                                        </div>
                                        <p className="text-sm font-medium capitalize mt-1 text-gray-700">{lead.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block">Email</label>
                                        <p className="font-medium">{lead.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block">Phone</label>
                                        <p className="font-medium">{lead.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Info</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block">Source</label>
                                        <p className="font-medium capitalize">{lead.leadSource || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block">Estimated Value</label>
                                        <p className="font-medium text-lg text-green-600">${lead.estimatedValue || '0'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>

                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 max-h-[500px]">
                            {comments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="ri-chat-1-line text-3xl mb-2"></i>
                                    <p>No comments yet</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-800">{comment.comment}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleAddComment} className="mt-auto pt-4 border-t">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none mb-2"
                                rows="3"
                            ></textarea>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Post Comment
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <AddNoteModal
                isOpen={showNoteModal}
                onClose={() => setShowNoteModal(false)}
                onSave={handleSaveNote}
                leadId={id}
            />

            <ConvertLeadModal
                isOpen={showConvertModal}
                onClose={() => setShowConvertModal(false)}
                onConvert={handleConvertLead}
                lead={lead}
            />
        </div>
    );
}
