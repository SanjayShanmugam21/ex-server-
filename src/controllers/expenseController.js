const Expense = require('../models/Expense');
const User = require('../models/User'); // For user details in export
const Category = require('../models/Category'); // For category details in export
const logAction = require('../utils/auditLogger');
const { format } = require('date-fns'); // Assuming date-fns is installed or use native JS date
const fastcsv = require('fast-csv');

// @desc    Get all current user expenses
// @route   GET /api/expenses
// @access  Private (User)
const getMyExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user._id, isDeleted: false });
        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private (User)
const createExpense = async (req, res) => {
    const { amount, categoryId, description, paymentType, date, type } = req.body;

    // For income, category might be optional or handled differently, but let's assume valid category is passed for now or handle it.
    // Actually, "Income" might not need a category ID if we don't have income categories. 
    // The user didn't specify income categories. "Salary, Bonus, Freelance" sound like descriptions or a specific category.
    // Let's assume the user will pick a category or we might need to make categoryId optional?
    // The existing schema has categoryId required. 
    // I will stick to categoryId required for now to minimize schema changes, relying on the user to pick a category (maybe "Income" category?).

    if (!amount || !categoryId || !description || !paymentType) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        const expense = new Expense({
            userId: req.user._id,
            amount,
            categoryId,
            description,
            paymentType,
            date: date || Date.now(),
            type: type || 'expense'
        });

        const createdExpense = await expense.save();

        await logAction('CREATE', type === 'income' ? 'INCOME' : 'EXPENSE', createdExpense._id, req.user._id, req.user.role, {
            amount, categoryId, description, type
        });

        res.status(201).json(createdExpense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private (User)
const updateExpense = async (req, res) => {
    const { amount, categoryId, description, paymentType, date, type } = req.body;

    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Verify ownership
        if (expense.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        if (expense.isDeleted) {
            return res.status(400).json({ message: 'Cannot update deleted expense' });
        }

        const oldData = { ...expense.toObject() };

        expense.amount = amount || expense.amount;
        expense.categoryId = categoryId || expense.categoryId;
        expense.description = description || expense.description;
        expense.paymentType = paymentType || expense.paymentType;
        expense.date = date || expense.date;
        expense.type = type || expense.type;

        const updatedExpense = await expense.save();

        await logAction('UPDATE', expense.type === 'income' ? 'INCOME' : 'EXPENSE', updatedExpense._id, req.user._id, req.user.role, {
            oldData,
            newData: req.body
        });

        res.json(updatedExpense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete expense (Soft delete)
// @route   DELETE /api/expenses/:id
// @access  Private (User)
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Verify ownership
        if (expense.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        if (expense.isDeleted) {
            return res.status(400).json({ message: 'Expense is already deleted' });
        }

        expense.isDeleted = true;
        await expense.save();

        await logAction('DELETE', expense.type === 'income' ? 'INCOME' : 'EXPENSE', expense._id, req.user._id, req.user.role, {
            description: expense.description
        });

        res.json({ message: 'Expense removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all expenses (Admin) with filtering
// @route   GET /api/admin/expenses
// @access  Private (Admin)
const getAllExpensesAdmin = async (req, res) => {
    // Basic filter logic can be here too
    // But specific route for export exists
    try {
        const expenses = await Expense.find({ isDeleted: false }).populate('userId', 'name email').populate('categoryId', 'name');
        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete any expense (Admin) - Soft delete
// @route   DELETE /api/admin/expenses/:id
// @access  Private (Admin)
const deleteAnyExpenseAdmin = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        if (expense.isDeleted) {
            return res.status(400).json({ message: 'Expense is already deleted' });
        }

        expense.isDeleted = true;
        await expense.save();

        await logAction('DELETE', 'EXPENSE', expense._id, req.user._id, req.user.role, {
            adminOverride: true,
            description: expense.description
        });

        res.json({ message: 'Expense removed by Admin' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Export expenses to CSV (Admin)
// @route   GET /api/admin/expenses/export
// @access  Private (Admin)
const exportExpenses = async (req, res) => {
    const { from, to, userId, categoryId } = req.query;

    const query = { isDeleted: false };

    if (from || to) {
        query.date = {};
        if (from) query.date.$gte = new Date(from);
        if (to) query.date.$lte = new Date(to);
    }

    if (userId) query.userId = userId;
    if (categoryId) query.categoryId = categoryId;

    try {
        const expenses = await Expense.find(query)
            .populate('userId', 'name email')
            .populate('categoryId', 'name')
            .lean();

        const csvData = expenses.map(exp => ({
            Date: exp.date ? exp.date.toISOString().split('T')[0] : '', // simple date format
            User: exp.userId ? exp.userId.name : 'Unknown',
            Email: exp.userId ? exp.userId.email : 'Unknown',
            Category: exp.categoryId ? exp.categoryId.name : 'Unknown',
            Description: exp.description,
            Amount: exp.amount,
            PaymentType: exp.paymentType
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');

        fastcsv
            .write(csvData, { headers: true })
            .pipe(res);

        await logAction('EXPORT', 'EXPENSE', null, req.user._id, req.user.role, { query });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
    getMyExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getAllExpensesAdmin,
    deleteAnyExpenseAdmin,
    exportExpenses
};
