const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Users, Audit Logs, Analytics

// Controllers for specific Admin routes
const {
    createCategory,
    updateCategory,
    deleteCategory,
    getAllCategoriesAdmin
} = require('./controllers/categoryController');

const {
    getAllExpensesAdmin,
    deleteAnyExpenseAdmin,
    exportExpenses
} = require('./controllers/expenseController');
const { protect, admin } = require('./middleware/authMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));

// Mount routers
app.use('/api/auth', authRoutes);

// Admin Routes (Users, Audit Logs, Analytics)
app.use('/api/admin', adminRoutes);

// Category Routes
// User: GET /api/categories
app.use('/api/categories', categoryRoutes);

// Admin: POST /api/admin/categories, PUT /api/admin/categories/:id
const adminCategoryRouter = express.Router();
adminCategoryRouter.get('/', protect, admin, getAllCategoriesAdmin);
adminCategoryRouter.post('/', protect, admin, createCategory);
adminCategoryRouter.put('/:id', protect, admin, updateCategory);
adminCategoryRouter.delete('/:id', protect, admin, deleteCategory);
app.use('/api/admin/categories', adminCategoryRouter);

// Expense Routes
// User: CRUD own expenses
app.use('/api/expenses', expenseRoutes);

// Admin: Export, View All, Delete Any
const adminExpenseRouter = express.Router();
adminExpenseRouter.get('/export', protect, admin, exportExpenses);
adminExpenseRouter.get('/', protect, admin, getAllExpensesAdmin);
adminExpenseRouter.delete('/:id', protect, admin, deleteAnyExpenseAdmin);
app.use('/api/admin/expenses', adminExpenseRouter);


const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
