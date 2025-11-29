import React, { useState } from 'react';

export default function ConvertLeadModal({ isOpen, onClose, onConvert, lead }) {
    const [loading, setLoading] = useState(false);
    const [createProject, setCreateProject] = useState(false);

    if (!isOpen || !lead) return null;

    const handleConvert = async () => {
        setLoading(true);
        try {
            await onConvert(lead.id, { createProject });
        } catch (error) {
            console.error('Error converting lead:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <i className="ri-user-follow-line"></i>
                            Convert Lead to Client
                        </h3>
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <i className="ri-close-line text-2xl"></i>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <i className="ri-information-line text-lg mt-0.5"></i>
                            <span>This will create a new client record and mark the lead as "Converted".</span>
                        </p>
                    </div>

                    <div className="space-y-3 mb-6">
                        <h4 className="font-semibold text-gray-900">Lead Information:</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <i className="ri-building-line text-gray-500"></i>
                                <span className="font-medium text-gray-900">{lead.company || lead.contact_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="ri-user-line text-gray-500"></i>
                                <span className="text-gray-700">{lead.contact_name || lead.contactName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="ri-mail-line text-gray-500"></i>
                                <span className="text-gray-700">{lead.email}</span>
                            </div>
                            {lead.phone && (
                                <div className="flex items-center gap-2">
                                    <i className="ri-phone-line text-gray-500"></i>
                                    <span className="text-gray-700">{lead.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={createProject}
                                onChange={(e) => setCreateProject(e.target.checked)}
                                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 group-hover:text-green-600">
                                    Create a project for this client
                                </p>
                                <p className="text-sm text-gray-500">
                                    Automatically create a new project linked to the new client
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConvert}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50 flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (<><i className="ri-loader-4-line animate-spin"></i>Converting...</>) : (<><i className="ri-check-line"></i>Convert to Client</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
