const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'sahakari_shramik_secure_jwt_secret_key_2026_sih',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register a citizen user or worker user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, role, city, address } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone number, and password'
      });
    }

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number'
      });
    }

    const user = await User.create({
      name,
      phone,
      email,
      password,
      role: role || 'customer',
      city: city || 'New Delhi',
      address
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        city: user.city,
        address: user.address,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone/email and password'
      });
    }

    const query = phone ? { phone } : { email };
    const user = await User.findOne(query);

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id, user.role);
      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          city: user.city,
          token
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
