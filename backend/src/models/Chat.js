const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'ai', 'doctor'],
      default: 'user'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderType: {
      type: String,
      enum: ['user', 'ai', 'system'],
      required: true
    },
    content: {
      text: {
        type: String,
        required: function() {
          return this.messageType === 'text';
        }
      },
      aiAnalysis: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AIAnalysis'
      },
      attachment: {
        url: String,
        type: String, // image, document, etc.
        name: String,
        size: Number
      }
    },
    messageType: {
      type: String,
      enum: ['text', 'ai_result', 'image', 'document', 'system_notification'],
      default: 'text'
    },
    metadata: {
      isEdited: {
        type: Boolean,
        default: false
      },
      editedAt: Date,
      isDeleted: {
        type: Boolean,
        default: false
      },
      deletedAt: Date,
      reactions: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        emoji: String,
        reactedAt: {
          type: Date,
          default: Date.now
        }
      }],
      readBy: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }]
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  chatType: {
    type: String,
    enum: ['personal_ai', 'doctor_consultation', 'group_support', 'emergency'],
    default: 'personal_ai'
  },
  title: {
    type: String,
    default: function() {
      return `Chat - ${new Date().toLocaleDateString()}`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    aiAssistant: {
      enabled: {
        type: Boolean,
        default: true
      },
      model: {
        type: String,
        default: 'gpt-3.5-turbo'
      },
      personality: {
        type: String,
        enum: ['professional', 'friendly', 'empathetic'],
        default: 'empathetic'
      }
    },
    notifications: {
      type: Boolean,
      default: true
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  summary: {
    keyPoints: [String],
    recommendations: [String],
    nextActions: [String],
    generatedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.filter(msg => !msg.metadata.isDeleted).length;
});

// Virtual for unread message count for a specific user
chatSchema.virtual('unreadCount').get(function() {
  // This will be calculated in the application logic
  return 0;
});

// Virtual for latest message
chatSchema.virtual('latestMessage').get(function() {
  const activeMessages = this.messages.filter(msg => !msg.metadata.isDeleted);
  return activeMessages.length > 0 ? activeMessages[activeMessages.length - 1] : null;
});

// Indexes for performance
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ chatType: 1 });
chatSchema.index({ isActive: 1 });

// Pre-save middleware
chatSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

// Static methods
chatSchema.statics.findUserChats = function(userId, limit = 50) {
  return this.find({
    'participants.user': userId,
    isActive: true
  })
  .sort({ lastActivity: -1 })
  .limit(limit)
  .populate('participants.user', 'name email profile.avatar')
  .populate('messages.sender', 'name profile.avatar')
  .populate('messages.content.aiAnalysis');
};

chatSchema.statics.findChatsByType = function(userId, chatType) {
  return this.find({
    'participants.user': userId,
    chatType: chatType,
    isActive: true
  })
  .sort({ lastActivity: -1 })
  .populate('participants.user', 'name email profile.avatar');
};

// Instance methods
chatSchema.methods.addMessage = function(messageData) {
  this.messages.push({
    ...messageData,
    timestamp: new Date()
  });
  this.lastActivity = new Date();
  return this.save();
};

chatSchema.methods.markAsRead = function(userId, messageId = null) {
  if (messageId) {
    // Mark specific message as read
    const message = this.messages.id(messageId);
    if (message && !message.metadata.readBy.some(read => read.user.toString() === userId.toString())) {
      message.metadata.readBy.push({ user: userId });
    }
  } else {
    // Mark all messages as read
    this.messages.forEach(message => {
      if (!message.metadata.readBy.some(read => read.user.toString() === userId.toString())) {
        message.metadata.readBy.push({ user: userId });
      }
    });
  }
  return this.save();
};

chatSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(message => 
    !message.metadata.isDeleted &&
    !message.metadata.readBy.some(read => read.user.toString() === userId.toString())
  ).length;
};

chatSchema.methods.addParticipant = function(userId, role = 'user') {
  if (!this.participants.some(p => p.user.toString() === userId.toString())) {
    this.participants.push({
      user: userId,
      role: role
    });
  }
  return this.save();
};

chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Chat', chatSchema);