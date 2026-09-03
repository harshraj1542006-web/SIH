const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { protect } = require('../middleware/authMiddleware');

// Helper to generate booking reference and OTP
const generateBookingRef = () => 'SHK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// @desc    Create a new service booking
// @route   POST /api/bookings
// @access  Public / Protected
router.post('/', async (req, res) => {
  try {
    const {
      serviceCategory,
      serviceName,
      workerId,
      workerName,
      workerPhone,
      customerName,
      customerPhone,
      serviceAddress,
      date,
      timeSlot,
      isEmergency,
      estimatedHours,
      baseFare,
      notes
    } = req.body;

    if (!serviceCategory || !customerName || !customerPhone || !serviceAddress || !date || !timeSlot || !baseFare) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required booking details'
      });
    }

    const hours = Number(estimatedHours) || 1;
    const subtotal = Number(baseFare) * hours;
    const emergencySurcharge = isEmergency ? 100 : 0;
    const welfareContribution = Math.round((subtotal + emergencySurcharge) * 0.05);
    const totalAmount = subtotal + emergencySurcharge + welfareContribution;

    // Resolve worker details if workerId provided
    let assignedWorkerId = null;
    let resolvedWorkerName = workerName || 'Auto-Assign Nearest Certified Worker';
    let resolvedWorkerPhone = workerPhone || '+91 98112 34500';

    if (workerId && workerId !== 'auto') {
      const worker = await Worker.findById(workerId);
      if (worker) {
        assignedWorkerId = worker._id;
        resolvedWorkerName = worker.name;
        resolvedWorkerPhone = worker.phone;
      }
    }

    const newBooking = await Booking.create({
      bookingRef: generateBookingRef(),
      customer: req.user ? req.user._id : undefined,
      customerName,
      customerPhone,
      serviceAddress,
      serviceCategory,
      serviceName: serviceName || `${serviceCategory.charAt(0).toUpperCase() + serviceCategory.slice(1)} Service`,
      worker: assignedWorkerId,
      workerName: resolvedWorkerName,
      workerPhone: resolvedWorkerPhone,
      date,
      timeSlot: isEmergency ? 'Immediate SOS (Within 30 mins)' : timeSlot,
      isEmergency: Boolean(isEmergency),
      status: 'Pending',
      estimatedHours: hours,
      baseFare: subtotal,
      emergencyFee: emergencySurcharge,
      welfareFund: welfareContribution,
      totalFare: totalAmount,
      otp: generateOTP(),
      notes: notes || 'Standard cooperative service dispatch'
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get customer bookings
// @route   GET /api/bookings/customer
// @access  Public / Protected
router.get('/customer', async (req, res) => {
  try {
    const query = {};
    if (req.user) {
      query.customer = req.user._id;
    } else if (req.query.phone) {
      query.customerPhone = req.query.phone;
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get worker bookings (incoming queue, active, completed)
// @route   GET /api/bookings/worker
// @access  Public / Protected
router.get('/worker', async (req, res) => {
  try {
    const { workerId, category, status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (workerId) {
      query.$or = [
        { worker: workerId },
        { status: 'Pending', serviceCategory: category }
      ];
    } else if (category) {
      query.serviceCategory = category;
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single booking by ID or reference
// @route   GET /api/bookings/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { bookingRef: req.params.id };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Worker accept booking
// @route   PATCH /api/bookings/:id/accept
// @access  Public / Protected
router.patch('/:id/accept', async (req, res) => {
  try {
    const { workerId, workerName, workerPhone } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'Accepted';
    if (workerId) booking.worker = workerId;
    if (workerName) booking.workerName = workerName;
    if (workerPhone) booking.workerPhone = workerPhone;

    await booking.save();
    res.json({ success: true, message: 'Booking accepted', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Worker decline booking
// @route   PATCH /api/bookings/:id/reject
// @access  Public / Protected
router.patch('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = reason || 'Declined by worker';

    await booking.save();
    res.json({ success: true, message: 'Booking declined', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update booking status (Pending, Accepted, In Progress, Completed, Cancelled)
// @route   PATCH /api/bookings/:id/status
// @access  Public / Protected
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const validStatuses = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = status;
    if (cancellationReason) {
      booking.cancellationReason = cancellationReason;
    }

    // If completed, increment completedJobs counter on worker
    if (status === 'Completed' && booking.worker) {
      await Worker.findByIdAndUpdate(booking.worker, {
        $inc: { completedJobs: 1 }
      });
    }

    await booking.save();
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
