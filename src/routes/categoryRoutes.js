const express = require('express');
const router = express.Router();
const {
    getCategories,
    createUserCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

// Public/User Routes
router.get('/', protect, getCategories);
router.post('/', protect, createUserCategory);

module.exports = router;
