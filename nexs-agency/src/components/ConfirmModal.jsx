import React, { useEffect } from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmStyle = 'danger' }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getButtonStyles = () => {
        if (confirmStyle === 'danger') {
            return 'bg-red-600 hover:bg-red-700 text-white';
        }
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <p className="text-gray-700">{message}</p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${getButtonStyles()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
