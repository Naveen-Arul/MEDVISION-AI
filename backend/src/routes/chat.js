const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const User = require('../models/User');
const AIAnalysis = require('../models/AIAnalysis');
const Groq = require('groq-sdk');

// Initialize Groq client with API key from environment variables
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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
      isActive: true,
      // Exclude consultation chats - they appear in appointments page only
      chatType: { $ne: 'doctor_consultation' }
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

// @route   POST /api/chat/ai-assistant
// @desc    Get AI health assistant response using Groq
// @access  Private
router.post('/ai-assistant', async (req, res) => {
  try {
    const { message, image, conversationHistory = [] } = req.body;

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message or image'
      });
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      return res.status(500).json({
        success: false,
        message: 'AI service is not configured. Please contact administrator.'
      });
    }

    console.log('AI Assistant request:', { message: message?.substring(0, 50), hasImage: !!image });

    // Pre-filter: Check if query seems non-medical (basic heuristic)
    const nonMedicalKeywords = [
      'code', 'programming', 'java', 'python', 'javascript', 'array', 'function',
      'algorithm', 'data structure', 'software', 'develop', 'html', 'css',
      'recipe', 'cooking', 'game', 'movie', 'music', 'sports', 'weather',
      'math problem', 'homework', 'calculate', 'history', 'geography'
    ];
    
    const medicalKeywords = [
      'symptom', 'pain', 'fever', 'cough', 'headache', 'nausea', 'vomit',
      'disease', 'condition', 'treatment', 'medication', 'doctor', 'health',
      'sick', 'illness', 'injury', 'medical', 'diagnosis', 'chest', 'breath',
      'heart', 'blood', 'pressure', 'diabetes', 'cancer', 'infection', 'virus',
      'bacteria', 'allergy', 'rash', 'fatigue', 'dizzy', 'swelling', 'ache'
    ];

    const messageLower = message?.toLowerCase() || '';
    const hasNonMedicalKeywords = nonMedicalKeywords.some(kw => messageLower.includes(kw));
    const hasMedicalKeywords = medicalKeywords.some(kw => messageLower.includes(kw));
    
    // If clearly non-medical and no medical context, provide quick redirect
    if (hasNonMedicalKeywords && !hasMedicalKeywords && message.length > 10) {
      console.log('Non-medical query detected, providing redirect response');
      return res.json({
        success: true,
        data: {
          response: `I appreciate your question, but I'm specifically designed as a medical AI assistant for MedVision AI. I can only help with health-related questions such as:

🏥 Symptoms and health concerns
💊 Medications and treatments  
🩺 Medical conditions and diseases
🫁 Chest X-ray analysis for pneumonia
📋 General health guidance

For non-medical questions, please use a general-purpose AI assistant. 

**Is there anything health-related I can help you with today?**`,
          model: 'pre-filter',
          filtered: true
        }
      });
    }

    // Build conversation context with strict medical focus
    const messages = [
      {
        role: 'system',
        content: `You are MedVision AI Medical Assistant - a highly specialized healthcare AI assistant exclusively designed for medical and health-related consultations. You are part of a professional telemedicine platform.

CORE IDENTITY & SCOPE:
You ONLY respond to medical, health, and healthcare-related queries. You are NOT a general-purpose AI assistant.

STRICT BOUNDARIES - You MUST REFUSE to answer:
❌ Programming/coding questions (politely redirect: "I'm a medical AI assistant. For programming help, please use a coding assistant.")
❌ General knowledge questions unrelated to health
❌ Entertainment, games, jokes (unless health-related humor for patient comfort)
❌ Non-medical academic subjects
❌ Any topic outside healthcare/medicine/wellness

MEDICAL EXPERTISE AREAS (ONLY respond to these):
✅ Symptom analysis and health guidance
✅ Medical conditions, diseases, and treatments
✅ Medications, dosages, and side effects
✅ Preventive healthcare and wellness
✅ Nutrition and diet for medical conditions
✅ Mental health and psychological well-being
✅ Emergency medical situations (with urgent care recommendations)
✅ Medical imaging interpretation (especially chest X-rays for pneumonia)
✅ Chronic disease management
✅ Maternal and child health
✅ Public health and epidemiology
✅ Medical procedures and diagnostics
✅ Healthcare system navigation

RESPONSE PROTOCOL:
1. For medical queries: Provide detailed, evidence-based, empathetic responses
2. For non-medical queries: Politely decline and redirect to appropriate resources
3. Always maintain patient safety as top priority
4. Use clear, patient-friendly language while maintaining medical accuracy
5. Cite medical reasoning when appropriate (e.g., "This symptom may indicate...")

SAFETY GUIDELINES:
⚠️ NEVER diagnose - always say "This could be..." or "Symptoms suggest you should consult..."
⚠️ For serious symptoms: IMMEDIATELY recommend urgent medical attention
⚠️ Always recommend professional consultation for:
   - Chest pain, severe headaches, difficulty breathing
   - Persistent fever, unexplained weight loss
   - Any emergency symptoms
⚠️ Remind patients: "I provide general medical guidance, not a substitute for professional medical diagnosis"

PLATFORM INTEGRATION:
- Encourage X-ray uploads for respiratory symptoms (pneumonia detection available)
- Suggest booking consultations through the platform for concerning symptoms
- Reference MedVision AI's diagnostic tools when relevant

TONE & STYLE:
- Professional yet warm and empathetic
- Patient-centered and supportive
- Clear explanations of complex medical concepts
- Reassuring but honest about when professional care is needed
- Culturally sensitive and inclusive
- **USE EMOJIS** to make responses friendly and easy to understand (🏥 💊 🩺 ❤️ ⚠️ ✅ 🫁 🧠 💉 🌡️ etc.)
- Format responses with markdown: **bold** for emphasis, bullet points for lists, headers for sections

FORMATTING GUIDELINES:
✅ Use emojis at the start of bullet points (e.g., 🏥 Hospital care, 💊 Medications)
✅ Use headers (##) to organize information
✅ Use **bold** for important medical terms or warnings
✅ Use bullet points for lists of symptoms, recommendations, etc.
✅ Keep paragraphs short and scannable

EXAMPLE RESPONSES:
✅ Medical: "## 🫁 Respiratory Symptoms Assessment

Based on your symptoms of **persistent cough** and **fever**, this could indicate a respiratory infection. Here's what I recommend:

### 🩺 Immediate Actions:
- 🌡️ **Monitor your temperature** - Keep track if it goes above 100.4°F (38°C)
- 💧 **Stay hydrated** - Drink plenty of fluids
- 😴 **Get adequate rest**

### 🏥 Next Steps:
1. 📸 Upload a chest X-ray for our **AI pneumonia detection**
2. 📅 Book a consultation with a doctor through the platform
3. ⚠️ Seek emergency care if you experience difficulty breathing

Remember: I provide general guidance, not a diagnosis. Professional medical evaluation is essential."

❌ Non-medical: "I appreciate your question about Java programming, but I'm specifically designed as a medical AI assistant. 

For coding help, I recommend:
💻 Programming-focused AI assistants
🌐 Coding forums like StackOverflow

**Is there anything health-related I can help you with?** 🏥"

Remember: You are a specialized medical professional AI. Stay within your scope of medical expertise to provide the highest quality healthcare guidance.`
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current message
    let userMessage = message;
    if (image) {
      userMessage += ' [User uploaded an image for analysis]';
    }
    messages.push({
      role: 'user',
      content: userMessage
    });

    console.log('Calling Groq API...');

    // Call Groq API with optimized parameters for medical responses
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile', // Best model for medical reasoning and accuracy
      temperature: 0.3, // Lower temperature for more focused, factual medical responses
      max_tokens: 2048, // Increased for detailed medical explanations
      top_p: 0.9, // Focused sampling for medical accuracy
      presence_penalty: 0.1, // Slight penalty to avoid repetition
      frequency_penalty: 0.1, // Encourage diverse medical terminology
      stream: false
    });

    const aiResponse = completion.choices[0]?.message?.content || 
      "I'm sorry, I couldn't generate a response. Please try again.";

    console.log('AI response generated successfully');

    res.json({
      success: true,
      data: {
        response: aiResponse,
        model: completion.model,
        usage: completion.usage
      }
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Generate AI response using Groq API for medical terms and doubts
const generateAIResponse = async (userMessage, userId) => {
  try {
    // Define the system prompt to ensure the AI only responds to medical terms and doubts
    const systemPrompt = `You are a specialized medical AI assistant for MedVision AI platform. 
You should only respond to medical-related questions, symptoms, diagnoses, treatments, and health advice.

Important guidelines:
1. Only answer medical questions - politely decline non-medical topics
2. Be empathetic and professional in your tone
3. Never provide definitive diagnoses - always recommend consulting healthcare professionals
4. When appropriate, suggest uploading chest X-rays for pneumonia analysis
5. Do not provide medication dosages without proper context
6. Emphasize the importance of professional medical consultation

Example responses:
- For pneumonia/X-ray questions: "I can help analyze chest X-rays for pneumonia detection. Please upload your X-ray image for detailed analysis."
- For general symptoms: "While I can provide general information, please consult with a healthcare professional for proper evaluation of your symptoms."
- For non-medical questions: "I'm designed to assist with medical questions. Please ask about health conditions, symptoms, or medical procedures."`;

    // Create the chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      stop: null,
      stream: false
    });

    // Extract and return the response
    const aiResponse = chatCompletion.choices[0]?.message?.content || "I apologize, but I couldn't process your request at the moment. Please try again later.";
    
    // Ensure the response is medical-related, otherwise provide a standard response
    if (aiResponse.toLowerCase().includes("non-medical") || aiResponse.toLowerCase().includes("not medical")) {
      return "I'm designed to assist with medical questions. Please ask about health conditions, symptoms, or medical procedures related to pneumonia detection and respiratory health.";
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Groq API error:', error);
    // Fallback to predefined responses if Groq API fails
    const message = userMessage.toLowerCase();
    
    if (message.includes('pneumonia') || message.includes('chest') || message.includes('xray') || message.includes('x-ray')) {
      return '🔬 I can help you analyze chest X-rays for pneumonia detection! Please upload your X-ray image, and I\'ll provide a detailed analysis including confidence levels and recommendations.';
    }
    
    if (message.includes('symptoms') || message.includes('cough') || message.includes('fever')) {
      return '🩺 I understand you\'re asking about symptoms. While I can analyze X-ray images, for symptom evaluation, please consult with a healthcare professional. Common pneumonia symptoms include persistent cough, fever, difficulty breathing, and chest pain.';
    }
    
    if (message.includes('help') || message.includes('how')) {
      return '💡 I can assist you with:\n• Chest X-ray analysis for pneumonia detection\n• Medical information and guidance\n• Health recommendations based on analysis results\n\nTo get started, you can upload a chest X-ray image or ask me any health-related questions!';
    }
    
    return '🤖 Thank you for your message! I\'m here to help with medical analysis and health guidance. Could you please provide more specific information about what you\'d like assistance with? You can also upload chest X-ray images for pneumonia analysis.';
  }
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

// @route   POST /api/chat/medical-assistant
// @desc    Get medical AI response for specific medical queries
// @access  Private
router.post('/medical-assistant', [
  body('query')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be between 1 and 1000 characters')
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

    const { query } = req.body;

    // Generate medical AI response using Groq
    const aiResponse = await generateAIResponse(query, req.user._id);

    res.json({
      success: true,
      message: 'Medical assistance provided',
      data: {
        query,
        response: aiResponse
      }
    });

  } catch (error) {
    console.error('Medical assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical assistance'
    });
  }
});

module.exports = router;