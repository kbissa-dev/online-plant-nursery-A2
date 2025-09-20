require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { USER_ROLES } = require('../models/User');

const createAdmin = async () => {
    try {
        console.log('Creating admin account...');
        
        if (!process.env.MONGO_URI) {
            throw new Error("Missing MONGO_URI in backend/.env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });
        if (existingAdmin) {
            console.log('Admin account already exists:', existingAdmin.email);
            return;
        }

        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@green.com',
            password: 'admin123',
            role: USER_ROLES.ADMIN,
            employeeId: 'ADMIN001',
            isActive: true
        });

        console.log('Admin account created successfully!');
        console.log('Email: admin@green.com');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Failed to create admin:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

if (require.main === module) {
    createAdmin();
}

module.exports = createAdmin;