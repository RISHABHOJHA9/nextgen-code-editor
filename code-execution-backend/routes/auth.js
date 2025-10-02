const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup Route (no hashing)
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const newUser = new User({ username, email, password }); // plain text
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Signup failed' });
  }
});

// Login Route (no hashing)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('📥 Login Request:', { email, password });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log('🔐 Comparing passwords:', password, 'vs', user.password);

    if (user.password !== password) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('🔥 Login failed:', err);
    res.status(500).json({ msg: 'Login failed' });
  }
});

module.exports = router;
