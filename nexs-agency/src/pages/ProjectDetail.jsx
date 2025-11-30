import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showEditTask, setShowEditTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            const response = await projectAPI.getById(id);
            setProject(response.data.project);
            setTasks(response.data.tasks || []);
        } catch (error) {
            console.error('Error loading project:', error);
            alert('Failed to load project details');
            navigate('/admin/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (taskData) => {
        try {
            await projectAPI.createTask(id, {
                title: taskData.name,
                description: taskData.description,
                assignedTo: taskData.assignedTo || null,
                dueDate: taskData.dueDate,
                priority: taskData.priority,
                status: taskData.status
            });
            setShowAddTask(false);
            loadProject();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
        }
    };

    const handleEditTask = async (taskId, updates) => {
        try {
            await projectAPI.updateTask(id, taskId, {
                title: updates.title,
                description: updates.description,
                status: updates.status,
                priority: updates.priority,
                dueDate: updates.dueDate
            });
            setShowEditTask(false);
            setSelectedTask(null);
            loadProject();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await projectAPI.deleteTask(id, taskId);
            loadProject();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Breadcrumbs */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                <Link to="/admin/dashboard" className="hover:text-blue-600">Dashboard</Link>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">Projects</span>
                <i className="ri-arrow-right-s-line"></i>
                <span className="font-medium text-gray-900">{project.projectName}</span>
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
                        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-4xl font-bold text-purple-600">
                            <i className="ri-folder-line"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{project.projectName}</h1>
                            <p className="text-xl text-gray-600 mt-1">Client ID: {project.clientId}</p>
                            <span className={`inline-block px-3 py-1 text-sm rounded-full mt-3 ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                                        project.status === 'planning' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600">{project.description || 'No description provided.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 block">Budget</label>
                                    <p className="font-medium text-lg text-green-600">${project.budget || '0'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block">Priority</label>
                                    <p className="font-medium capitalize">{project.priority || 'Medium'}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500 block">Start Date</label>
                                    <p className="font-medium">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block">End Date</label>
                                    <p className="font-medium">
                                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks */}
                    <div className="mt-10">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
                                <p className="text-sm text-gray-500">Manage tasks for this project</p>
                            </div>
                            <button
                                onClick={() => setShowAddTask(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                            >
                                <i className="ri-add-line"></i>
                                Add Task
                            </button>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
                                <i className="ri-task-line text-3xl mb-2 text-gray-400"></i>
                                <p>No tasks yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tasks.map((task) => (
                                    <div key={task.id} className="border rounded-lg p-4 bg-white flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                            {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-3">
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1"><i className="ri-calendar-line"></i>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                )}
                                                {task.priority && (
                                                    <span className="flex items-center gap-1 capitalize"><i className="ri-flag-line"></i>{task.priority}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 text-xs rounded-full capitalize ${
                                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                task.status === 'review' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {task.status}
                                            </span>
                                            <button
                                                onClick={() => { setSelectedTask(task); setShowEditTask(true); }}
                                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                            >
                                                <i className="ri-edit-line"></i> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                                            >
                                                <i className="ri-delete-bin-line"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddTaskModal
                isOpen={showAddTask}
                onClose={() => setShowAddTask(false)}
                onSave={handleAddTask}
                projectId={id}
            />
            <EditTaskModal
                isOpen={showEditTask}
                onClose={() => { setShowEditTask(false); setSelectedTask(null); }}
                onSave={handleEditTask}
                task={selectedTask}
            />
        </div>
    );
}
