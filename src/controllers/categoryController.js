const Category = require('../models/Category');
const logAction = require('../utils/auditLogger');

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Private (User/Admin)
const getCategories = async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.type) {
            query.type = req.query.type;
        }
        const categories = await Category.find(query).select('name _id type');
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a category (User)
// @route   POST /api/categories
// @access  Private (User)
const createUserCategory = async (req, res) => {
    try {
        const { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: 'Please provide name and type' });
        }

        const categoryExists = await Category.findOne({ name });

        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            type,
            createdBy: req.user._id, // User ID
        });

        await logAction('CREATE', 'CATEGORY', category._id, req.user._id, req.user.role, { name, type });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a category
// @route   POST /api/admin/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const categoryExists = await Category.findOne({ name });

        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            createdBy: 'ADMIN',
        });

        await logAction('CREATE', 'CATEGORY', category._id, req.user._id, req.user.role, { name });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
    try {
        const { name, isActive } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const oldName = category.name;
        category.name = name || category.name;
        if (isActive !== undefined) category.isActive = isActive;

        const updatedCategory = await category.save();

        await logAction('UPDATE', 'CATEGORY', updatedCategory._id, req.user._id, req.user.role, {
            oldName,
            newName: updatedCategory.name,
            isActive: updatedCategory.isActive,
        });

        res.json(updatedCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all categories (Admin - including inactive)
// @route   GET /api/admin/categories
// @access  Private (Admin)
const getAllCategoriesAdmin = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Optional: Check if used in expenses
        // For now, allow delete.
        await category.deleteOne();

        await logAction('DELETE', 'CATEGORY', category._id, req.user._id, req.user.role, {
            deletedCategoryName: category.name
        });

        res.json({ message: 'Category removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategoriesAdmin,
    createUserCategory,
};
