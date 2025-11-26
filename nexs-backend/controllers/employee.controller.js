const UserModel = require('../models/user.model');
const ActivityLogController = require('./activity_log.controller');

const EmployeeController = {
    async getAll(req, res) {
        try {
            // Filter for employees (users with role 'user' or just all users if admin wants to see everyone)
            // Usually employees are role='user', admins are role='admin'
            // But we might want to see all staff.
            const employees = await UserModel.findAll(req.query);
            res.json({ employees });
        } catch (error) {
            console.error('Get employees error:', error);
            res.status(500).json({ error: 'Failed to fetch employees' });
        }
    },

    async getById(req, res) {
        try {
            const employee = await UserModel.findById(req.params.id);
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }
            res.json({ employee });
        } catch (error) {
            console.error('Get employee error:', error);
            res.status(500).json({ error: 'Failed to fetch employee' });
        }
    },

    async create(req, res) {
        try {
            const { email, password, firstName, lastName } = req.body;

            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({ error: 'Required fields missing' });
            }

            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const userId = await UserModel.create(req.body);
            const employee = await UserModel.findById(userId);

            // Log activity
            await ActivityLogController.logActivity(req, 'create', 'user', userId, {
                name: `${firstName} ${lastName}`,
                email
            });

            res.status(201).json({ message: 'Employee created successfully', employee });
        } catch (error) {
            console.error('Create employee error:', error);
            res.status(500).json({ error: 'Failed to create employee' });
        }
    },

    async update(req, res) {
        try {
            const employee = await UserModel.findById(req.params.id);
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const updated = await UserModel.update(req.params.id, req.body);

            // Log activity
            await ActivityLogController.logActivity(req, 'update', 'user', req.params.id, {
                changes: req.body
            });

            res.json({ message: 'Employee updated successfully', employee: updated });
        } catch (error) {
            console.error('Update employee error:', error);
            res.status(500).json({ error: 'Failed to update employee' });
        }
    },

    async delete(req, res) {
        try {
            const employee = await UserModel.findById(req.params.id);
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            await UserModel.delete(req.params.id);

            // Log activity
            await ActivityLogController.logActivity(req, 'delete', 'user', req.params.id, {
                name: `${employee.firstName} ${employee.lastName}`
            });

            res.json({ message: 'Employee deleted successfully' });
        } catch (error) {
            console.error('Delete employee error:', error);
            res.status(500).json({ error: 'Failed to delete employee' });
        }
    }
};

module.exports = EmployeeController;
