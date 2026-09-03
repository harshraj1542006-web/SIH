const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingRef: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone number is required'],
    trim: true
  },
  serviceAddress: {
    type: String,
    required: [true, 'Service address is required'],
    trim: true
  },
  serviceCategory: {
    type: String,
    required: [true, 'Service trade category is required']
  },
  serviceName: {
    type: String,
    required: [true, 'Service title is required']
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  workerName: {
    type: String,
    trim: true
  },
  workerPhone: {
    type: String,
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Service date is required']
  },
  timeSlot: {
    type: String,
    required: [true, 'Service time slot is required']
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
      message: '{VALUE} is not a valid booking status'
    },
    default: 'Pending'
  },
  estimatedHours: {
    type: Number,
    default: 1
  },
  baseFare: {
    type: Number,
    required: [true, 'Base labour fare is required']
  },
  emergencyFee: {
    type: Number,
    default: 0
  },
  welfareFund: {
    type: Number,
    required: [true, '5% worker welfare deduction is required']
  },
  totalFare: {
    type: Number,
    required: [true, 'Total fare amount is required']
  },
  otp: {
    type: String,
    required: [true, '4-digit OTP is required']
  },
  notes: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
