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
            res.json({ project });
        } catch (error) {
            console.error('Get project error:', error);
            res.status(500).json({ error: 'Failed to fetch project' });
        }
    },

    async create(req, res) {
        try {
            if (!req.body.name || !req.body.clientId) {
                return res.status(400).json({ error: 'Name and client ID are required' });
            }

            const projectId = await ProjectModel.create({ ...req.body, createdBy: req.user.id });
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

            const updated = await ProjectModel.update(req.params.id, req.body);
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

    // Task Management
    async getTasks(req, res) {
        try {
            const Task = require('../models/task.model');
            const tasks = await Task.findByProjectId(req.params.id);
            res.json({ tasks });
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    },

    async createTask(req, res) {
        try {
            const Task = require('../models/task.model');
            const task = await Task.create({
                projectId: req.params.id,
                ...req.body
            });
            res.status(201).json({ message: 'Task created successfully', task });
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    },

    async updateTask(req, res) {
        try {
            const Task = require('../models/task.model');
            const task = await Task.update(req.params.taskId, req.body);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json({ message: 'Task updated successfully', task });
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    },

    async deleteTask(req, res) {
        try {
            const Task = require('../models/task.model');
            await Task.delete(req.params.taskId);
            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    },

    async getTaskStats(req, res) {
        try {
            const Task = require('../models/task.model');
            const stats = await Task.getStats(req.params.id);
            res.json({ stats });
        } catch (error) {
            console.error('Get task stats error:', error);
            res.status(500).json({ error: 'Failed to fetch task statistics' });
        }
    }
};

module.exports = ProjectController;
