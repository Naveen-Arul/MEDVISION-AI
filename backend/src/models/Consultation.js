const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  // Basic Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Scheduling
  scheduledDateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Consultation Details
  type: {
    type: String,
    enum: ['routine', 'follow_up', 'urgent', 'second_opinion', 'emergency'],
    default: 'routine'
  },
  specialization: {
    type: String,
    enum: ['general', 'pulmonology', 'radiology', 'cardiology', 'oncology'],
    default: 'general'
  },
  reason: {
    type: String,
    required: true,
    maxLength: 500
  },
  symptoms: [{
    type: String,
    maxLength: 100
  }],
  
  // Status Management
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  
  // Video Call Integration
  videoCall: {
    roomId: {
      type: String,
      unique: true
    },
    jitsiRoomName: String,
    startedAt: Date,
    endedAt: Date,
    recordingUrl: String
  },
  
  // Related Documents
  relatedAnalysis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIAnalysis'
  }],
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  
  // Consultation Notes
  doctorNotes: {
    diagnosis: String,
    prescription: [{
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
      notes: String
    }],
    recommendations: String,
    followUpRequired: Boolean,
    followUpDate: Date,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    }
  },
  
  // Payment & Billing
  billing: {
    fee: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentMethod: String,
    transactionId: String
  },
  
  // Reminders & Notifications
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sentAt: Date,
    scheduledFor: Date
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
consultationSchema.index({ patient: 1, scheduledDateTime: 1 });
consultationSchema.index({ doctor: 1, scheduledDateTime: 1 });
consultationSchema.index({ status: 1, scheduledDateTime: 1 });
consultationSchema.index({ 'videoCall.roomId': 1 });

// Virtual for duration in human readable format
consultationSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for time until consultation
consultationSchema.virtual('timeUntil').get(function() {
  const now = new Date();
  const diff = this.scheduledDateTime - now;
  
  if (diff < 0) return 'Past due';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

// Pre-save middleware
consultationSchema.pre('save', async function(next) {
  // Generate unique room ID for video calls
  if (!this.videoCall.roomId) {
    this.videoCall.roomId = `consultation_${this._id}_${Date.now()}`;
    this.videoCall.jitsiRoomName = `ai-her-${this.patient.toString().slice(-6)}-${this.doctor.toString().slice(-6)}-${Date.now()}`;
  }
  
  next();
});

// Instance Methods
consultationSchema.methods.canStart = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledDateTime);
  const timeDiff = scheduledTime.getTime() - now.getTime();
  
  // Allow starting 5 minutes before scheduled time
  return timeDiff <= (5 * 60 * 1000) && this.status === 'confirmed';
};

consultationSchema.methods.isOverdue = function() {
  const now = new Date();
  const scheduledTime = new Date(this.scheduledDateTime);
  const overdueTime = scheduledTime.getTime() + (this.duration * 60 * 1000) + (15 * 60 * 1000); // 15 min grace period
  
  return now.getTime() > overdueTime && this.status !== 'completed';
};

consultationSchema.methods.startVideoCall = async function() {
  if (!this.canStart()) {
    throw new Error('Consultation cannot be started yet or is not confirmed');
  }
  
  this.status = 'in_progress';
  this.videoCall.startedAt = new Date();
  return await this.save();
};

consultationSchema.methods.endVideoCall = async function() {
  if (this.status !== 'in_progress') {
    throw new Error('Consultation is not currently in progress');
  }
  
  this.status = 'completed';
  this.videoCall.endedAt = new Date();
  return await this.save();
};

// Static Methods
consultationSchema.statics.findUpcoming = function(userId, role = 'patient') {
  const query = role === 'patient' ? { patient: userId } : { doctor: userId };
  query.scheduledDateTime = { $gte: new Date() };
  query.status = { $in: ['scheduled', 'confirmed'] };
  
  return this.find(query)
    .populate('patient', 'name email profile')
    .populate('doctor', 'name email profile')
    .populate('relatedAnalysis')
    .sort({ scheduledDateTime: 1 });
};

consultationSchema.statics.findByTimeRange = function(startTime, endTime, doctorId = null) {
  const query = {
    scheduledDateTime: {
      $gte: startTime,
      $lte: endTime
    },
    status: { $ne: 'cancelled' }
  };
  
  if (doctorId) {
    query.doctor = doctorId;
  }
  
  return this.find(query)
    .populate('patient', 'name email profile')
    .populate('doctor', 'name email profile');
};

consultationSchema.statics.getDoctorAvailability = async function(doctorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const bookedSlots = await this.find({
    doctor: doctorId,
    scheduledDateTime: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
  }).select('scheduledDateTime duration');
  
  return bookedSlots.map(slot => ({
    start: slot.scheduledDateTime,
    end: new Date(slot.scheduledDateTime.getTime() + (slot.duration * 60 * 1000))
  }));
};

module.exports = mongoose.model('Consultation', consultationSchema);