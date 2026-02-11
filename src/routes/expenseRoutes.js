const express = require('express');
const router = express.Router();
const {
    getMyExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

// User Routes: CRUD own expenses
router.get('/', protect, getMyExpenses);
router.post('/', protect, createExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

module.exports = router;
