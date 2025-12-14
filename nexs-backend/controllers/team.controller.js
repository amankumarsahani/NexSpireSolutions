const TeamModel = require('../models/team.model');
const UserModel = require('../models/user.model');

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
            const { name, email, phone, position, department, workload, status, joinDate, role = 'user' } = req.body;

            // Validation
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and email are required'
                });
            }

            // Check if email already exists in Team Members
            const existingMember = await TeamModel.getByEmail(email);
            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'Team member with this email already exists'
                });
            }

            // Generate a random secure password
            const generatePassword = () => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
                let password = '';
                for (let i = 0; i < 12; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return password;
            };

            const generatedPassword = generatePassword();

            // 1. Ensure User Account exists (for Login)
            let user = await UserModel.findByEmail(email);
            let isNewUser = false;

            if (!user) {
                // Split name
                const nameParts = name.trim().split(/\s+/);
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(' ') || '';

                await UserModel.create({
                    email,
                    password: generatedPassword,
                    firstName,
                    lastName,
                    phone,
                    role
                });
                isNewUser = true;
            }

            // 2. Create Team Member Profile
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

            // 3. Send Welcome Email with credentials (only for new users)
            if (isNewUser) {
                try {
                    const EmailService = require('../services/email.service');
                    const loginUrl = process.env.ADMIN_URL || 'https://admin.nexspiresolutions.co.in';

                    await EmailService.sendEmail({
                        to: email,
                        subject: '🎉 Welcome to Nexspire Solutions - Your Account Details',
                        html: `
                            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Nexspire Solutions!</h1>
                                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Your team account has been created</p>
                                </div>
                                
                                <div style="padding: 30px;">
                                    <p style="font-size: 16px; color: #374151;">Hi <strong>${name}</strong>,</p>
                                    
                                    <p style="font-size: 15px; color: #6b7280; line-height: 1.6;">
                                        You've been invited to join the Nexspire Solutions team as <strong>${position || 'Team Member'}</strong>
                                        ${department ? ` in the <strong>${department}</strong> department` : ''}.
                                    </p>
                                    
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                        <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 16px;">🔐 Your Login Credentials</h3>
                                        <table style="width: 100%; font-size: 14px;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #64748b;">Email:</td>
                                                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${email}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #64748b;">Password:</td>
                                                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; font-family: monospace; background: #fef3c7; padding: 4px 8px; border-radius: 4px;">${generatedPassword}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                            Login to Dashboard
                                        </a>
                                    </div>
                                    
                                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                        <p style="margin: 0; font-size: 13px; color: #92400e;">
                                            <strong>⚠️ Important:</strong> Please change your password after your first login for security reasons.
                                        </p>
                                    </div>
                                    
                                    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                                        If you have any questions, feel free to reach out to your administrator.
                                    </p>
                                    
                                    <p style="font-size: 14px; color: #374151; margin-top: 20px;">
                                        Welcome aboard! 🚀<br>
                                        <strong>The Nexspire Solutions Team</strong>
                                    </p>
                                </div>
                                
                                <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                                        © ${new Date().getFullYear()} Nexspire Solutions. All rights reserved.
                                    </p>
                                </div>
                            </div>
                        `
                    });
                    console.log(`Welcome email sent to ${email}`);
                } catch (emailError) {
                    console.error('Failed to send welcome email:', emailError);
                    // Don't fail the request if email fails - user is still created
                }
            }

            res.status(201).json({
                success: true,
                message: isNewUser
                    ? 'Team member created successfully. Welcome email sent with login credentials.'
                    : 'Team member profile created. User already has an account.',
                data: teamMember,
                emailSent: isNewUser
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
