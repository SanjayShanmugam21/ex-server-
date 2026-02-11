const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    createdBy: {
        type: String,
        default: 'ADMIN',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        default: 'expense',
        required: true,
    },
}, {
    timestamps: true,
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
