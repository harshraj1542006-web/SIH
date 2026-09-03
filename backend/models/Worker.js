const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Worker name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Worker phone number is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Trade category is required'],
    enum: {
      values: [
        'electrician',
        'plumber',
        'carpenter',
        'painter',
        'domestic_helper',
        'caregiver',
        'driver',
        'gardener',
        'cleaner',
        'technician'
      ],
      message: '{VALUE} is not a supported trade category'
    }
  },
  society: {
    type: String,
    required: [true, 'Primary labour cooperative society is required'],
    trim: true
  },
  societyId: {
    type: String,
    trim: true,
    default: 'SOC-FED-VERIFIED'
  },
  membershipRollNo: {
    type: String,
    trim: true
  },
  verificationStatus: {
    type: String,
    enum: {
      values: ['Pending', 'Verified', 'Rejected'],
      message: '{VALUE} is not a valid verification status'
    },
    default: 'Pending'
  },
  aadhaarNumber: {
    type: String,
    trim: true
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly fair wage rate is required'],
    min: [100, 'Hourly rate must be at least ₹100']
  },
  experienceYears: {
    type: Number,
    required: [true, 'Years of experience is required'],
    default: 1
  },
  skills: {
    type: [String],
    required: [true, 'At least one skill is required'],
    validate: [v => Array.isArray(v) && v.length > 0, 'Skills list cannot be empty']
  },
  bio: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Operating city/district is required'],
    trim: true
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  emergencyAvailable: {
    type: Boolean,
    default: false
  },
  availabilityStatus: {
    type: String,
    enum: {
      values: ['online', 'busy', 'offline'],
      message: '{VALUE} is not a valid availability status'
    },
    default: 'online'
  },
  bankDetails: {
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    upiId: { type: String, trim: true }
  },
  avatarBg: {
    type: String,
    default: '#0f2b48'
  },
  initials: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate initials
workerSchema.pre('save', function (next) {
  if (!this.initials && this.name) {
    this.initials = this.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Worker', workerSchema);
