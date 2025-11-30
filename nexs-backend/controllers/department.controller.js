const DepartmentModel = require('../models/department.model');

class DepartmentController {
    // Get all departments
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const departments = await DepartmentModel.findAll(page, limit);

            res.json({
                success: true,
                data: departments,
                page,
                limit
            });
        } catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({
                error: 'Failed to fetch departments'
            });
        }
    }

    // Get department by ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const department = await DepartmentModel.findById(id);

            if (!department) {
                return res.status(404).json({
                    error: 'Department not found'
                });
            }

            // Get teams in this department
            const teams = await DepartmentModel.getTeamsByDepartment(id);

            res.json({
                success: true,
                data: {
                    ...department,
                    teams
                }
            });
        } catch (error) {
            console.error('Get department error:', error);
            res.status(500).json({
                error: 'Failed to fetch department'
            });
        }
    }

    // Create department
    async create(req, res) {
        try {
            const { name, description, managerId, budget } = req.body;

            // Validation
            if (!name) {
                return res.status(400).json({
                    error: 'Department name is required'
                });
            }

            const departmentId = await DepartmentModel.create({
                name,
                description,
                managerId,
                budget: budget || 0
            });

            res.status(201).json({
                success: true,
                message: 'Department created successfully',
                departmentId
            });
        } catch (error) {
            console.error('Create department error:', error);
            res.status(500).json({
                error: 'Failed to create department'
            });
        }
    }

    // Update department
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, managerId, budget } = req.body;

            const affected = await DepartmentModel.update(id, {
                name,
                description,
                managerId,
                budget
            });

            if (affected === 0) {
                return res.status(404).json({
                    error: 'Department not found'
                });
            }

            res.json({
                success: true,
                message: 'Department updated successfully'
            });
        } catch (error) {
            console.error('Update department error:', error);
            res.status(500).json({
                error: 'Failed to update department'
            });
        }
    }

    // Delete department
    async delete(req, res) {
        try {
            const { id } = req.params;
            const affected = await DepartmentModel.delete(id);

            if (affected === 0) {
                return res.status(404).json({
                    error: 'Department not found'
                });
            }

            res.json({
                success: true,
                message: 'Department deleted successfully'
            });
        } catch (error) {
            console.error('Delete department error:', error);
            res.status(500).json({
                error: 'Failed to delete department'
            });
        }
    }

    // Get department statistics
    async getStats(req, res) {
        try {
            const stats = await DepartmentModel.getStats();
            res.json(stats);
        } catch (error) {
            console.error('Get department stats error:', error);
            res.status(500).json({
                error: 'Failed to fetch department statistics'
            });
        }
    }
}

module.exports = new DepartmentController();
