const TeamModel = require('../models/team.model');

const TeamController = {
    // Get all team members
    async getAll(req, res) {
        try {
            const { status, department } = req.query;
            const filters = {};

            if (status) filters.status = status;
            if (department) filters.department = department;

            const teamMembers = await TeamModel.getAll(filters);

            res.json({
                success: true,
                count: teamMembers.length,
                data: teamMembers
            });
        } catch (error) {
            console.error('Get all team members error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch team members',
                error: error.message
            });
        }
    },

    // Get team member by ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const teamMember = await TeamModel.getById(id);

            if (!teamMember) {
                return res.status(404).json({
                    success: false,
                    message: 'Team member not found'
                });
            }

            res.json({
                success: true,
                data: teamMember
            });
        } catch (error) {
            console.error('Get team member error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch team member',
                error: error.message
            });
        }
    },

    // Create new team member
    async create(req, res) {
        try {
            const { name, email, phone, position, department, workload, status, joinDate } = req.body;

            // Validation
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and email are required'
                });
            }

            // Check if email already exists
            const existingMember = await TeamModel.getByEmail(email);
            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'Team member with this email already exists'
                });
            }

            const teamMember = await TeamModel.create({
                name,
                email,
                phone,
                position,
                department,
                workload,
                status,
                joinDate
            });

            res.status(201).json({
                success: true,
                message: 'Team member created successfully',
                data: teamMember
            });
        } catch (error) {
            console.error('Create team member error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create team member',
                error: error.message
            });
        }
    },

    // Update team member
    async update(req, res) {
        try {
            const { id } = req.params;

            // Check if team member exists
            const existingMember = await TeamModel.getById(id);
            if (!existingMember) {
                return res.status(404).json({
                    success: false,
                    message: 'Team member not found'
                });
            }

            // If email is being updated, check for duplicates
            if (req.body.email && req.body.email !== existingMember.email) {
                const emailExists = await TeamModel.getByEmail(req.body.email);
                if (emailExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use by another team member'
                    });
                }
            }

            const teamMember = await TeamModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Team member updated successfully',
                data: teamMember
            });
        } catch (error) {
            console.error('Update team member error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update team member',
                error: error.message
            });
        }
    },

    // Delete team member
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Check if team member exists
            const existingMember = await TeamModel.getById(id);
            if (!existingMember) {
                return res.status(404).json({
                    success: false,
                    message: 'Team member not found'
                });
            }

            const deleted = await TeamModel.delete(id);

            if (deleted) {
                res.json({
                    success: true,
                    message: 'Team member deleted successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete team member'
                });
            }
        } catch (error) {
            console.error('Delete team member error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete team member',
                error: error.message
            });
        }
    },

    // Get team statistics
    async getStats(req, res) {
        try {
            const stats = await TeamModel.getStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get team stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch team statistics',
                error: error.message
            });
        }
    }
};

module.exports = TeamController;
