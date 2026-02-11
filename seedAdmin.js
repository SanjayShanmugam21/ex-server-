const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User'); // Adjust path if needed
const connectDB = require('./src/config/db');

dotenv.config();

const seedAdmin = async () => {
    await connectDB();

    try {
        const adminEmail = 'admin@example.com';
        const adminPassword = 'adminpassword123';

        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists');
        } else {
            const user = await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'ADMIN',
            });
            console.log(`Admin created successfully: ${user.email} / ${adminPassword}`);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
