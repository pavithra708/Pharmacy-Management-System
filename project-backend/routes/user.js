// routes/users.js
const express = require('express');
const User = require('../models/User');  // Import the User model
const router = express.Router();

// Route to add a user
router.post('/add', async (req, res) => {
  try {
    const { name, email, role, status, avatar, lastLogin } = req.body;

    const newUser = new User({
      name,
      email,
      role,
      status,
      avatar,
      lastLogin,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Error adding user' });
  }
});

// Route to get all users (optional)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
