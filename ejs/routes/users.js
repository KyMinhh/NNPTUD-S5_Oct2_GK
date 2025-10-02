const express = require('express');
const router = express.Router();
const User = require('../schemas/users');
const Role = require('../schemas/roles');

// CREATE - Tạo user mới
router.post('/', async (req, res) => {
    try {
        const { username, password, email, fullName, avatarUrl, role } = req.body;

        // Kiểm tra role có tồn tại không
        const roleExists = await Role.findOne({ _id: role, isDeleted: false });
        if (!roleExists) {
            return res.status(400).json({
                success: false,
                message: 'Role not found'
            });
        }

        const newUser = new User({
            username,
            password,
            email,
            fullName: fullName || "",
            avatarUrl: avatarUrl || "",
            role
        });

        const savedUser = await newUser.save();
        const populatedUser = await User.findById(savedUser._id).populate('role');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: populatedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// READ - Get all users 
router.get('/', async (req, res) => {
    try {
        const { username, fullName, search, page = 1, limit = 10 } = req.query;

        // Tạo query filter
        let filter = { isDeleted: false };

        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } }
            ];
        } else {
            if (username) {
                filter.username = { $regex: username, $options: 'i' }; // Case insensitive
            }

            if (fullName) {
                filter.fullName = { $regex: fullName, $options: 'i' }; // Case insensitive
            }
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const users = await User.find(filter)
            .populate('role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: users,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalUsers: total,
                hasNext: pageNum < Math.ceil(total / limitNum),
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving users',
            error: error.message
        });
    }
});

// READ - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id, isDeleted: false }).populate('role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving user',
            error: error.message
        });
    }
});

// READ - Get user by username
router.get('/username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username, isDeleted: false }).populate('role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving user',
            error: error.message
        });
    }
});

// UPDATE - Cập nhập user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, email, fullName, avatarUrl, role, status, loginCount } = req.body;

        // Nếu có role, kiểm tra role có tồn tại không
        if (role) {
            const roleExists = await Role.findOne({ _id: role, isDeleted: false });
            if (!roleExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Role not found'
                });
            }
        }

        const updateData = {};
        if (username !== undefined) updateData.username = username;
        if (password !== undefined) updateData.password = password;
        if (email !== undefined) updateData.email = email;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;
        if (loginCount !== undefined) updateData.loginCount = loginCount;

        const updatedUser = await User.findOneAndUpdate(
            { _id: id, isDeleted: false },
            updateData,
            { new: true, runValidators: true }
        ).populate('role');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// DELETE - Xóa mềm user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        ).populate('role');

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: deletedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// POST - Activate user (chuyển status về true) - Yêu cầu đặc biệt
router.post('/activate', async (req, res) => {
    try {
        const { email, username } = req.body;

        if (!email || !username) {
            return res.status(400).json({
                success: false,
                message: 'Email and username are required'
            });
        }

        // Tìm user với email và username đúng
        const user = await User.findOne({
            email,
            username,
            isDeleted: false
        }).populate('role');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with provided email and username'
            });
        }

        // Chuyển status về true
        user.status = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User activated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error activating user',
            error: error.message
        });
    }
});

module.exports = router;