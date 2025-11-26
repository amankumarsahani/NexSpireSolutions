import { useState, useEffect } from 'react';
import { departmentAPI } from '../../api';
import toast from 'react-hot-toast';

export default function DepartmentsList() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        budget: 0,
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const data = await departmentAPI.getAll();
            setDepartments(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            toast.error('Failed to load departments');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDepartment) {
                await departmentAPI.update(editingDepartment.id, formData);
                toast.success('Department updated successfully');
            } else {
                await departmentAPI.create(formData);
                toast.success('Department created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchDepartments();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this department?')) return;

        try {
            await departmentAPI.delete(id);
            toast.success('Department deleted successfully');
            fetchDepartments();
        } catch (error) {
            toast.error('Failed to delete department');
        }
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setFormData({
            name: department.name || '',
            description: department.description || '',
            budget: department.budget || 0,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingDepartment(null);
        setFormData({
            name: '',
            description: '',
            budget: 0,
        });
    };

    const formatBudget = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount || 0);
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
            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Departments</h1>
                        <p className="text-slate-600 mt-1">{departments.length} departments</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Department
                    </button>
                </div>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((department) => (
                    <div
                        key={department.id}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-all"
                    >
                        {/* Department Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {department.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{department.name}</h3>
                                        <p className="text-sm text-slate-500">{department.teamCount || 0} teams</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Department Description */}
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {department.description || 'No description provided'}
                        </p>

                        {/* Budget */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
                            <p className="text-xs font-medium text-slate-600 mb-1">Budget</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {formatBudget(department.budget)}
                            </p>
                        </div>

                        {/* Manager Info */}
                        {department.managerName && (
                            <div className="flex items-center gap-2 mb-4 text-sm">
                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
                                    {department.managerName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Manager</p>
                                    <p className="font-medium text-slate-700">{department.managerName}</p>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => handleEdit(department)}
                                className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(department.id)}
                                className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {departments.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No departments yet</h3>
                    <p className="text-slate-600 mb-4">Create departments to organize your teams</p>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                        Create Department
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900">
                            {editingDepartment ? 'Edit Department' : 'Add New Department'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                    placeholder="Enter department name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                    placeholder="Describe the department's purpose"
                                    rows="4"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Budget (USD)
                                </label>
                                <input
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                    {editingDepartment ? 'Update Department' : 'Create Department'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
