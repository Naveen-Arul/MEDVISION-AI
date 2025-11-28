const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const AIAnalysis = require('../models/AIAnalysis');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: fileFilter
});

// Mock AI prediction function (replace with actual TensorFlow.js or Python service)
const mockPneumoniaDetection = async (imagePath) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Mock prediction (replace with actual model inference)
  const rawScore = Math.random();
  const prediction = rawScore > 0.5 ? 'Pneumonia' : 'Normal';
  const confidence = rawScore > 0.5 ? rawScore * 100 : (1 - rawScore) * 100;
  
  return {
    prediction,
    confidence: Math.round(confidence * 100) / 100,
    rawScore,
    recommendations: prediction === 'Pneumonia' ? 
      [
        'Consult a healthcare professional immediately',
        'Consider getting a chest CT scan for detailed analysis',
        'Monitor symptoms closely',
        'Follow prescribed treatment if any'
      ] : [
        'Regular health checkups are recommended',
        'Maintain good respiratory hygiene',
        'Stay updated with vaccinations'
      ],
    detailedAnalysis: prediction === 'Pneumonia' ? 
      'The AI model detected patterns consistent with pneumonia in the chest X-ray. Areas of opacity and infiltrates are visible in the lung fields.' :
      'The chest X-ray appears normal with clear lung fields and no obvious signs of infection or abnormalities.'
  };
};

// @route   POST /api/ai/analyze-xray
// @desc    Analyze chest X-ray for pneumonia detection
// @access  Private
router.post('/analyze-xray', upload.single('xray'), async (req, res) => {
  let analysisRecord = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No X-ray image provided'
      });
    }

    const startTime = Date.now();
    
    // Create analysis record
    analysisRecord = new AIAnalysis({
      user: req.user._id,
      analysisType: 'pneumonia_detection',
      inputData: {
        imageUrl: `/uploads/${req.file.filename}`,
        imageMetadata: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      },
      status: 'processing'
    });

    await analysisRecord.save();

    // Process image with Sharp for optimization
    const processedImagePath = path.join('uploads', `processed-${req.file.filename}`);
    await sharp(req.file.path)
      .resize(224, 224) // Resize for AI model
      .jpeg({ quality: 90 })
      .toFile(processedImagePath);

    // Perform AI analysis
    const aiResult = await mockPneumoniaDetection(processedImagePath);
    
    const processingTime = Date.now() - startTime;

    // Update analysis record with results
    analysisRecord.results = {
      prediction: aiResult.prediction,
      confidence: aiResult.confidence,
      rawScore: aiResult.rawScore,
      recommendations: aiResult.recommendations,
      detailedAnalysis: aiResult.detailedAnalysis
    };
    analysisRecord.processingTime = processingTime;
    analysisRecord.status = 'completed';

    await analysisRecord.save();

    // Clean up processed image
    try {
      await fs.unlink(processedImagePath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    res.json({
      success: true,
      message: 'X-ray analysis completed successfully',
      data: {
        analysisId: analysisRecord._id,
        prediction: aiResult.prediction,
        confidence: aiResult.confidence,
        recommendations: aiResult.recommendations,
        detailedAnalysis: aiResult.detailedAnalysis,
        processingTime: processingTime,
        imageUrl: analysisRecord.inputData.imageUrl,
        riskLevel: analysisRecord.riskLevel,
        timestamp: analysisRecord.createdAt
      }
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Update analysis record with error
    if (analysisRecord) {
      analysisRecord.status = 'failed';
      analysisRecord.error = {
        message: error.message,
        code: error.code || 'ANALYSIS_ERROR',
        timestamp: new Date()
      };
      await analysisRecord.save().catch(console.error);
    }

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'AI analysis failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Analysis processing error'
    });
  }
});

// @route   GET /api/ai/analysis-history
// @desc    Get user's analysis history
// @access  Private
router.get('/analysis-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const analyses = await AIAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    const total = await AIAnalysis.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis history'
    });
  }
});

// @route   GET /api/ai/analysis/:id
// @desc    Get specific analysis details
// @access  Private
router.get('/analysis/:id', async (req, res) => {
  try {
    const analysis = await AIAnalysis.findById(req.params.id)
      .populate('user', 'name email profile.avatar');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Check if user owns this analysis or it's shared with them
    const isOwner = analysis.user._id.toString() === req.user._id.toString();
    const isSharedWith = analysis.sharedWith.some(
      share => share.user.toString() === req.user._id.toString()
    );

    if (!isOwner && !isSharedWith) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this analysis'
      });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis'
    });
  }
});

// @route   POST /api/ai/analysis/:id/feedback
// @desc    Submit feedback for an analysis
// @access  Private
router.post('/analysis/:id/feedback', async (req, res) => {
  try {
    const { rating, comments, isAccurate } = req.body;

    const analysis = await AIAnalysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Check if user owns this analysis
    if (analysis.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this analysis'
      });
    }

    // Update feedback
    analysis.feedback = {
      userRating: rating,
      userComments: comments,
      isAccurate: isAccurate,
      reportedAt: new Date()
    };

    await analysis.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: analysis.feedback
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// @route   GET /api/ai/analytics
// @desc    Get user's AI usage analytics
// @access  Private
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await AIAnalysis.getAnalyticsByUser(req.user._id);
    
    const totalAnalyses = await AIAnalysis.countDocuments({ user: req.user._id });
    const recentAnalyses = await AIAnalysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalAnalyses,
        analyticsByType: analytics,
        recentAnalyses
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;