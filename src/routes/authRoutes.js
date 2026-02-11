const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);

module.exports = router;
