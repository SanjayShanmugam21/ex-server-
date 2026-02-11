const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    amount: {
        type: Number,
        required: true,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category',
    },
    description: {
        type: String,
        required: true,
    },
    paymentType: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        default: 'expense',
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
