const express = require('express');
const router = express.Router();
const {
    softDeleteUser,
    getAllUsers,
    getAuditLogs,
    getAdminAnalytics
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/soft-delete', protect, admin, softDeleteUser);
router.get('/audit-logs', protect, admin, getAuditLogs);
router.get('/analytics', protect, admin, getAdminAnalytics);

module.exports = router;
