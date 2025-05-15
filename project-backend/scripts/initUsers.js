import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

const users = [
  {
    name: 'Admin User',
    email: 'admin@pharmacy.com',
    password: 'admin123456',
    role: 'admin',
    status: 'active'
  },
  {
    name: 'Pharmacist User',
    email: 'pharmacist@pharmacy.com',
    password: 'pharm123456',
    role: 'pharmacist',
    status: 'active'
  }
];

const initUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Delete existing users
    await User.deleteMany({});
    console.log('Deleted existing users...');

    // Create new users
    const createdUsers = await User.create(users);
    console.log('Created users:', createdUsers.map(user => ({ email: user.email, role: user.role })));

    console.log('Initialization complete!');
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

initUsers(); 