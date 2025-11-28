const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const User = require('../models/User');
const AIAnalysis = require('../models/AIAnalysis');

// @route   GET /api/chat
// @desc    Get user's chats
// @access  Private
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const chatType = req.query.type;

    let query = {
      'participants.user': req.user._id,
      isActive: true
    };

    if (chatType) {
      query.chatType = chatType;
    }

    const chats = await Chat.find(query)
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('participants.user', 'name email profile.avatar')
      .populate({
        path: 'messages.sender',
        select: 'name profile.avatar'
      });

    // Calculate unread counts for each chat
    const chatsWithUnread = chats.map(chat => {
      const chatObj = chat.toObject();
      chatObj.unreadCount = chat.getUnreadCount(req.user._id);
      return chatObj;
    });

    const total = await Chat.countDocuments(query);

    res.json({
      success: true,
      data: {
        chats: chatsWithUnread,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats'
    });
  }
});

// @route   POST /api/chat
// @desc    Create a new chat
// @access  Private
router.post('/', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('chatType')
    .isIn(['personal_ai', 'doctor_consultation', 'group_support', 'emergency'])
    .withMessage('Invalid chat type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, chatType = 'personal_ai', participants = [] } = req.body;

    // Create new chat
    const chat = new Chat({
      title: title || `${chatType.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`,
      chatType,
      participants: [
        {
          user: req.user._id,
          role: 'user'
        }
      ]
    });

    // Add additional participants if provided
    for (const participantId of participants) {
      const participant = await User.findById(participantId);
      if (participant) {
        chat.participants.push({
          user: participantId,
          role: participant.role
        });
      }
    }

    await chat.save();

    // Add welcome message for AI chats
    if (chatType === 'personal_ai') {
      await chat.addMessage({
        senderType: 'ai',
        messageType: 'system_notification',
        content: {
          text: '👋 Hello! I\'m your AI health assistant. I can help you analyze chest X-rays for pneumonia detection, answer health-related questions, and provide medical guidance. How can I assist you today?'
        }
      });
    }

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'name email profile.avatar')
      .populate('messages.sender', 'name profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: populatedChat
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat'
    });
  }
});

// @route   GET /api/chat/:id
// @desc    Get specific chat with messages
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants.user', 'name email profile.avatar')
      .populate('messages.sender', 'name profile.avatar')
      .populate('messages.content.aiAnalysis');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat'
      });
    }

    // Mark messages as read
    await chat.markAsRead(req.user._id);

    res.json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat'
    });
  }
});

// @route   POST /api/chat/:id/messages
// @desc    Send message to chat
// @access  Private
router.post('/:id/messages', [
  body('content.text')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('messageType')
    .isIn(['text', 'ai_result', 'image', 'document'])
    .withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat'
      });
    }

    const { content, messageType = 'text', aiAnalysisId } = req.body;

    const messageData = {
      sender: req.user._id,
      senderType: 'user',
      content,
      messageType
    };

    // If linking to AI analysis
    if (aiAnalysisId && messageType === 'ai_result') {
      const analysis = await AIAnalysis.findById(aiAnalysisId);
      if (analysis && analysis.user.toString() === req.user._id.toString()) {
        messageData.content.aiAnalysis = aiAnalysisId;
      }
    }

    await chat.addMessage(messageData);

    // Generate AI response for personal_ai chats
    if (chat.chatType === 'personal_ai' && messageType === 'text') {
      setTimeout(async () => {
        try {
          const aiResponse = await generateAIResponse(content.text, req.user._id);
          await chat.addMessage({
            senderType: 'ai',
            messageType: 'text',
            content: {
              text: aiResponse
            }
          });
        } catch (aiError) {
          console.error('AI response error:', aiError);
        }
      }, 1000); // Delay to simulate AI processing
    }

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'name email profile.avatar')
      .populate('messages.sender', 'name profile.avatar')
      .populate('messages.content.aiAnalysis');

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: updatedChat
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// @route   PUT /api/chat/:id
// @desc    Update chat settings
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat'
      });
    }

    const { title, settings } = req.body;

    if (title) {
      chat.title = title;
    }

    if (settings) {
      chat.settings = { ...chat.settings, ...settings };
    }

    await chat.save();

    res.json({
      success: true,
      message: 'Chat updated successfully',
      data: chat
    });

  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat'
    });
  }
});

// Mock AI response generator (replace with actual AI service)
const generateAIResponse = async (userMessage, userId) => {
  // Simple keyword-based responses
  const message = userMessage.toLowerCase();
  
  if (message.includes('pneumonia') || message.includes('chest') || message.includes('xray') || message.includes('x-ray')) {
    return '🔬 I can help you analyze chest X-rays for pneumonia detection! Please upload your X-ray image using the camera icon, and I\'ll provide a detailed analysis including confidence levels and recommendations.';
  }
  
  if (message.includes('symptoms') || message.includes('cough') || message.includes('fever')) {
    return '🩺 I understand you\'re asking about symptoms. While I can analyze X-ray images, for symptom evaluation, please consult with a healthcare professional. Common pneumonia symptoms include persistent cough, fever, difficulty breathing, and chest pain.';
  }
  
  if (message.includes('help') || message.includes('how')) {
    return '💡 I can assist you with:\n• Chest X-ray analysis for pneumonia detection\n• Medical information and guidance\n• Health recommendations based on analysis results\n\nTo get started, you can upload a chest X-ray image or ask me any health-related questions!';
  }
  
  return '🤖 Thank you for your message! I\'m here to help with medical analysis and health guidance. Could you please provide more specific information about what you\'d like assistance with? You can also upload chest X-ray images for pneumonia analysis.';
};

// @route   DELETE /api/chat/:id
// @desc    Delete/deactivate chat
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    const isParticipant = chat.participants.some(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat'
      });
    }

    // Soft delete
    chat.isActive = false;
    await chat.save();

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat'
    });
  }
});

module.exports = router;