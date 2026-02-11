const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Expense = require('../models/Expense');
const logAction = require('../utils/auditLogger');

// @desc    Soft delete user
// @route   PUT /api/admin/users/:id/soft-delete
// @access  Private (Admin)
const softDeleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'ADMIN') {
            return res.status(400).json({ message: 'Cannot delete admin' });
        }

        if (user.deletedAt) {
            return res.status(400).json({ message: 'User already deleted' });
        }

        user.isActive = false;
        user.deletedAt = new Date();
        await user.save();

        await logAction('DELETE', 'USER', user._id, req.user._id, req.user.role, {
            userEmail: user.email
        });

        res.json({ message: 'User soft deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({})
            .populate('performedBy', 'name email')
            .sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Admin Analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
    try {
        const totalExpenses = await Expense.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const categoryWiseTotals = await Expense.aggregate([
            { $match: { isDeleted: false } },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $group: {
                    _id: "$category.name",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const monthlySpendingTrends = await Expense.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const topSpendingUsers = await Expense.aggregate([
            { $match: { isDeleted: false } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $group: {
                    _id: "$user.email",
                    name: { $first: "$user.name" }, // Get the user name
                    totalSpent: { $sum: "$amount" }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalExpenses: totalExpenses[0]?.total || 0,
            categoryWiseTotals,
            monthlySpendingTrends,
            topSpendingUsers
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    softDeleteUser,
    getAllUsers,
    getAuditLogs,
    getAdminAnalytics,
};
