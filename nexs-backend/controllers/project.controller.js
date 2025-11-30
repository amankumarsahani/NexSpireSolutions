const ProjectModel = require('../models/project.model');

const ProjectController = {
    async getAll(req, res) {
        try {
            const projects = await ProjectModel.findAll(req.query);
            res.json({ projects });
        } catch (error) {
            console.error('Get projects error:', error);
            res.status(500).json({ error: 'Failed to fetch projects' });
        }
    },

    async getById(req, res) {
        try {
            const project = await ProjectModel.findById(req.params.id);

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const tasks = await ProjectModel.getTasksByProjectId(req.params.id);
            const documents = await ProjectModel.getDocumentsByProjectId(req.params.id);

            res.json({
                project,
                tasks,
                documents
            });
        } catch (error) {
            console.error('Get project error:', error);
            res.status(500).json({ error: 'Failed to fetch project' });
        }
    },

    async create(req, res) {
        try {
            const name = req.body.name || req.body.projectName;
            const clientId = req.body.clientId || req.body.client_id;

            if (!name || !clientId) {
                return res.status(400).json({ error: 'Name and client ID are required' });
            }

            const projectId = await ProjectModel.create({
                ...req.body,
                name,
                clientId,
                createdBy: req.user.id
            });
            const project = await ProjectModel.findById(projectId);

            res.status(201).json({ message: 'Project created successfully', project });
        } catch (error) {
            console.error('Create project error:', error);
            res.status(500).json({ error: 'Failed to create project' });
        }
    },

    async update(req, res) {
        try {
            const project = await ProjectModel.findById(req.params.id);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const name = req.body.name || req.body.projectName || project.name;
            const clientId = req.body.clientId || req.body.client_id || project.clientId;

            const updated = await ProjectModel.update(req.params.id, { ...req.body, name, clientId });
            res.json({ message: 'Project updated successfully', project: updated });
        } catch (error) {
            console.error('Update project error:', error);
            res.status(500).json({ error: 'Failed to update project' });
        }
    },

    async delete(req, res) {
        try {
            const project = await ProjectModel.findById(req.params.id);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            await ProjectModel.delete(req.params.id);
            res.json({ message: 'Project deleted successfully' });
        } catch (error) {
            console.error('Delete project error:', error);
            res.status(500).json({ error: 'Failed to delete project' });
        }
    },

    async getStats(req, res) {
        try {
            const stats = await ProjectModel.getStats();
            res.json({ stats });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    },

    async createTask(req, res) {
        try {
            if (!req.body.title) {
                return res.status(400).json({ error: 'Task title is required' });
            }

            const allowedStatus = ['todo', 'in-progress', 'review', 'completed'];
            const allowedPriority = ['low', 'medium', 'high', 'urgent'];
            const normalizedStatus = allowedStatus.includes(req.body.status) ? req.body.status : req.body.status === 'done' ? 'completed' : 'todo';
            const normalizedPriority = allowedPriority.includes(req.body.priority) ? req.body.priority : 'medium';

            const taskId = await ProjectModel.createTask({
                ...req.body,
                projectId: req.params.id,
                status: normalizedStatus,
                priority: normalizedPriority
            });

            res.status(201).json({
                message: 'Task created successfully',
                taskId
            });
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    },

    async updateTask(req, res) {
        try {
            const allowedStatus = ['todo', 'in-progress', 'review', 'completed'];
            const allowedPriority = ['low', 'medium', 'high', 'urgent'];
            const normalizedStatus = allowedStatus.includes(req.body.status) ? req.body.status : undefined;
            const normalizedPriority = allowedPriority.includes(req.body.priority) ? req.body.priority : undefined;

            const updated = await ProjectModel.updateTask(req.params.taskId, {
                ...req.body,
                status: normalizedStatus ?? req.body.status,
                priority: normalizedPriority ?? req.body.priority
            });

            if (!updated) {
                return res.status(404).json({ error: 'Task not found' });
            }

            res.json({ message: 'Task updated successfully', task: updated });
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    },

    async deleteTask(req, res) {
        try {
            const deleted = await ProjectModel.deleteTask(req.params.taskId);
            if (!deleted) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    }
};

module.exports = ProjectController;
