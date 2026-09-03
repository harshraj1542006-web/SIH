const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Register a new skilled worker under a cooperative society
// @route   POST /api/workers/register
// @access  Public / Protected
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      phone,
      category,
      society,
      societyId,
      membershipRollNo,
      aadhaarNumber,
      hourlyRate,
      experienceYears,
      skills,
      bio,
      city,
      emergencyAvailable,
      bankDetails
    } = req.body;

    if (!name || !phone || !category || !society || !hourlyRate || !skills) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required worker details (name, phone, category, society, hourlyRate, skills)'
      });
    }

    const skillsArray = Array.isArray(skills)
      ? skills
      : String(skills).split(',').map(s => s.trim()).filter(Boolean);

    const newWorker = await Worker.create({
      user: req.user ? req.user._id : undefined,
      name,
      phone,
      category,
      society,
      societyId: societyId || 'SOC-DEL-01',
      membershipRollNo,
      verificationStatus: req.body.verificationStatus || 'Pending',
      aadhaarNumber,
      hourlyRate: Number(hourlyRate),
      experienceYears: Number(experienceYears) || 1,
      skills: skillsArray,
      bio,
      city: city || 'New Delhi',
      emergencyAvailable: Boolean(emergencyAvailable),
      bankDetails: bankDetails || {}
    });

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      data: newWorker
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all verified workers with search & filters
// @route   GET /api/workers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      emergency,
      minRating,
      maxPrice,
      city,
      status
    } = req.query;

    const query = {};

    // Verification status filter (default shows Verified or all if queried)
    if (status) {
      query.verificationStatus = status;
    } else {
      // By default show Verified workers (or all if in development test)
      query.verificationStatus = { $in: ['Verified', 'Pending'] };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Emergency filter
    if (emergency === 'true') {
      query.emergencyAvailable = true;
    }

    // Minimum rating filter
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Max hourly price filter
    if (maxPrice) {
      query.hourlyRate = { $lte: Number(maxPrice) };
    }

    // City filter
    if (city) {
      query.city = new RegExp(city, 'i');
    }

    // Keyword search (name, skills, society, bio)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { skills: searchRegex },
        { society: searchRegex },
        { category: searchRegex },
        { bio: searchRegex }
      ];
    }

    const workers = await Worker.find(query).sort({ rating: -1, completedJobs: -1 });

    res.json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single worker by ID
// @route   GET /api/workers/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update worker profile (skills, rates, bio)
// @route   PUT /api/workers/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const allowedUpdates = [
      'hourlyRate',
      'skills',
      'bio',
      'emergencyAvailable',
      'bankDetails',
      'city'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        worker[field] = req.body[field];
      }
    });

    await worker.save();
    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update worker availability status (online/busy/offline)
// @route   PATCH /api/workers/:id/status
// @access  Private / Worker
router.patch('/:id/status', async (req, res) => {
  try {
    const { availabilityStatus } = req.body;
    if (!['online', 'busy', 'offline'].includes(availabilityStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be online, busy, or offline'
      });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { availabilityStatus },
      { new: true, runValidators: true }
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Federation/Society Admin verify worker (Verified/Rejected)
// @route   PATCH /api/workers/:id/verify
// @access  Private / Admin
router.patch('/:id/verify', async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    if (!['Verified', 'Rejected', 'Pending'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Verified, Rejected, or Pending'
      });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      { new: true }
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
