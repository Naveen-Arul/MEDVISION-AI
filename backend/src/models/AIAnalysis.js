const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysisType: {
    type: String,
    enum: ['pneumonia_detection', 'chest_xray_analysis', 'risk_assessment'],
    required: true
  },
  inputData: {
    imageUrl: {
      type: String,
      required: function() {
        return this.analysisType === 'pneumonia_detection' || this.analysisType === 'chest_xray_analysis';
      }
    },
    imageMetadata: {
      originalName: String,
      size: Number,
      mimetype: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    textInput: {
      type: String,
      required: function() {
        return this.analysisType === 'risk_assessment';
      }
    }
  },
  results: {
    prediction: {
      type: String,
      enum: ['Normal', 'Pneumonia', 'Inconclusive'],
      required: function() {
        return this.analysisType === 'pneumonia_detection';
      }
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: function() {
        return this.analysisType === 'pneumonia_detection';
      }
    },
    rawScore: {
      type: Number,
      min: 0,
      max: 1
    },
    riskFactors: [{
      factor: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      description: String
    }],
    recommendations: [String],
    detailedAnalysis: {
      type: String
    }
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    message: String,
    code: String,
    timestamp: Date
  },
  feedback: {
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userComments: String,
    isAccurate: Boolean,
    reportedAt: Date
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      type: String,
      enum: ['view', 'comment'],
      default: 'view'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for analysis age
aiAnalysisSchema.virtual('analysisAge').get(function() {
  return Date.now() - this.createdAt;
});

// Virtual for risk level based on prediction
aiAnalysisSchema.virtual('riskLevel').get(function() {
  if (this.analysisType === 'pneumonia_detection') {
    if (this.results.prediction === 'Pneumonia') {
      if (this.results.confidence >= 80) return 'high';
      if (this.results.confidence >= 60) return 'medium';
      return 'low';
    }
    return 'normal';
  }
  return 'unknown';
});

// Indexes for better performance
aiAnalysisSchema.index({ user: 1, createdAt: -1 });
aiAnalysisSchema.index({ analysisType: 1 });
aiAnalysisSchema.index({ status: 1 });
aiAnalysisSchema.index({ 'results.prediction': 1 });

// Pre-save middleware
aiAnalysisSchema.pre('save', function(next) {
  // Set processing timestamps
  if (this.isNew) {
    this.inputData.imageMetadata.uploadDate = new Date();
  }
  
  next();
});

// Static methods
aiAnalysisSchema.statics.findByUser = function(userId, limit = 20) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email profile.avatar');
};

aiAnalysisSchema.statics.getAnalyticsByUser = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$analysisType',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$results.confidence' },
        avgProcessingTime: { $avg: '$processingTime' },
        lastAnalysis: { $max: '$createdAt' }
      }
    }
  ]);
};

// Instance methods
aiAnalysisSchema.methods.getPublicData = function() {
  const analysis = this.toObject();
  
  // Remove sensitive data if not owned by requester
  if (!analysis.isShared) {
    delete analysis.inputData.imageUrl;
  }
  
  return analysis;
};

aiAnalysisSchema.methods.shareWith = function(userId, permissions = 'view') {
  if (!this.sharedWith.some(share => share.user.toString() === userId.toString())) {
    this.sharedWith.push({
      user: userId,
      permissions: permissions
    });
    this.isShared = true;
  }
  return this.save();
};

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);