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
    }
};

module.exports = ProjectController;
