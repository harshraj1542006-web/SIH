const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { protect } = require('../middleware/authMiddleware');

// @desc    Submit rating and review for a completed booking
// @route   POST /api/reviews
// @access  Public / Protected
router.post('/', async (req, res) => {
  try {
    const { bookingId, rating, comment, customerName } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId and rating'
      });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already submitted for this booking'
      });
    }

    const review = await Review.create({
      booking: booking._id,
      worker: booking.worker,
      customer: req.user ? req.user._id : booking.customer,
      customerName: customerName || booking.customerName || 'Verified Citizen',
      rating: numRating,
      comment: comment || ''
    });

    // Recalculate worker's aggregate rating and reviewsCount
    if (booking.worker) {
      const worker = await Worker.findById(booking.worker);
      if (worker) {
        const currentReviews = worker.reviewsCount || 0;
        const currentRating = worker.rating || 5.0;
        const newReviewsCount = currentReviews + 1;
        const newAverageRating = Number(((currentRating * currentReviews + numRating) / newReviewsCount).toFixed(1));

        worker.reviewsCount = newReviewsCount;
        worker.rating = newAverageRating;
        await worker.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all reviews for a specific worker
// @route   GET /api/reviews/worker/:workerId
// @access  Public
router.get('/worker/:workerId', async (req, res) => {
  try {
    const reviews = await Review.find({ worker: req.params.workerId }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
