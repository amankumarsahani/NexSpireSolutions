const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const AuthController = {
    // User registration
    async signup(req, res) {
        try {
            const { email, password, firstName, lastName, phone } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required'
                });
            }

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    error: 'User with this email already exists'
                });
            }

            // Create user
            const userId = await UserModel.create({
                email,
                password,
                firstName,
                lastName,
                phone
            });

            // Get user data
            const user = await UserModel.findById(userId);

            // Generate token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({
                error: 'Failed to register user'
            });
        }
    },

    // User login
    async signin(req, res) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required'
                });
            }

            // Find user
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid email or password'
                });
            }

            // Check if user is active
            if (user.status !== 'active') {
                return res.status(401).json({
                    error: 'Account is inactive. Please contact administrator.'
                });
            }

            // Verify password
            const isPasswordValid = await UserModel.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    error: 'Invalid email or password'
                });
            }

            // Generate token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Signin error:', error);
            res.status(500).json({
                error: 'Failed to login'
            });
        }
    },

    // Get current user
    async getMe(req, res) {
        try {
            const user = await UserModel.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt
                }
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                error: 'Failed to get user information'
            });
        }
    },

    // Update profile
    async updateProfile(req, res) {
        try {
            const { firstName, lastName, phone } = req.body;
            const userId = req.user.id;

            // Update user in database
            await UserModel.update(userId, { firstName, lastName, phone });

            // Fetch updated user
            const user = await UserModel.findById(userId);

            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                error: 'Failed to update profile'
            });
        }
    },

    // Change password
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: 'Current and new password are required'
                });
            }

            // Verify current password
            const user = await UserModel.findById(userId);
            const isPasswordValid = await UserModel.verifyPassword(currentPassword, user.password);

            if (!isPasswordValid) {
                return res.status(400).json({
                    error: 'Invalid current password'
                });
            }

            // Update password
            await UserModel.updatePassword(userId, newPassword);

            res.json({
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                error: 'Failed to change password'
            });
        }
    },

    // Logout (client-side token removal)
    async logout(req, res) {
        res.json({
            message: 'Logout successful'
        });
    }
};

module.exports = AuthController;
