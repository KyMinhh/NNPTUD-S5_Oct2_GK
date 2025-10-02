const express = require('express');
const router = express.Router();
const Role = require('../schemas/roles');

// CREATE - Tạo role mới
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        const newRole = new Role({
            name,
            description: description || ""
        });

        const savedRole = await newRole.save();
        res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: savedRole
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Role name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating role',
            error: error.message
        });
    }
});

// READ - Get all roles (chỉ những role chưa bị xóa)
router.get('/', async (req, res) => {
    try {
        const roles = await Role.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Roles retrieved successfully',
            data: roles,
            count: roles.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving roles',
            error: error.message
        });
    }
});

// READ - Get role by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findOne({ _id: id, isDeleted: false });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Role retrieved successfully',
            data: role
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving role',
            error: error.message
        });
    }
});

// UPDATE - Cập nhật role
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const updatedRole = await Role.findOneAndUpdate(
            { _id: id, isDeleted: false },
            {
                name,
                description: description || ""
            },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Role updated successfully',
            data: updatedRole
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Role name already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating role',
            error: error.message
        });
    }
});

// DELETE - Xóa mềm role
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRole = await Role.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!deletedRole) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Role deleted successfully',
            data: deletedRole
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting role',
            error: error.message
        });
    }
});

module.exports = router;