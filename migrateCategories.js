const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./src/models/Category');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const updateCategories = async () => {
    await connectDB();

    const incomeCategories = ['Salary', 'Own Business', 'Other Sources'];

    // 1. Update/Create Income Categories
    for (const name of incomeCategories) {
        const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (exists) {
            exists.type = 'income';
            exists.name = name; // Normalize case
            await exists.save();
            console.log(`Updated ${name} to income`);
        } else {
            await Category.create({ name, type: 'income', createdBy: 'SYSTEM' });
            console.log(`Created ${name} as income`);
        }
    }

    // 2. Update all other categories to expense if type is not set or default
    // Since default in schema is 'expense', this might already be fine for new fetches, 
    // but existing docs might not have the field.
    await Category.updateMany(
        { name: { $nin: incomeCategories }, type: { $exists: false } },
        { $set: { type: 'expense' } }
    );
    // Also update those that might have type='expense' from default but we want to be sure
    const expenses = await Category.find({ type: 'expense' });
    console.log(`Ensured ${expenses.length} categories are expenses.`);

    console.log('Category migration complete');
    process.exit();
};

updateCategories();
