const express = require('express');
const router = express.Router();
const AIAnalysis = require('../models/AIAnalysis');
const Chat = require('../models/Chat');
const User = require('../models/User');

// @route   GET /api/analytics/overview
// @desc    Get overall analytics for user
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id;
    const timeRange = req.query.range || '30'; // days

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(timeRange));

    // AI Analysis Statistics
    const analysisStats = await AIAnalysis.aggregate([
      { 
        $match: { 
          user: userId,
          createdAt: { $gte: dateFrom }
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pneumoniaDetected: {
            $sum: {
              $cond: [{ $eq: ['$results.prediction', 'Pneumonia'] }, 1, 0]
            }
          },
          normalResults: {
            $sum: {
              $cond: [{ $eq: ['$results.prediction', 'Normal'] }, 1, 0]
            }
          },
          avgConfidence: { $avg: '$results.confidence' },
          avgProcessingTime: { $avg: '$processingTime' }
        }
      }
    ]);

    // Daily analysis counts
    const dailyAnalyses = await AIAnalysis.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          pneumoniaCount: {
            $sum: {
              $cond: [{ $eq: ['$results.prediction', 'Pneumonia'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Chat statistics
    const chatStats = await Chat.aggregate([
      {
        $match: {
          'participants.user': userId,
          lastActivity: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$chatType',
          count: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          avgMessages: { $avg: { $size: '$messages' } }
        }
      }
    ]);

    // Recent activity
    const recentActivity = await AIAnalysis.find({
      user: userId
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('analysisType results.prediction results.confidence createdAt status');

    res.json({
      success: true,
      data: {
        timeRange: parseInt(timeRange),
        analysis: {
          summary: analysisStats[0] || {
            total: 0,
            pneumoniaDetected: 0,
            normalResults: 0,
            avgConfidence: 0,
            avgProcessingTime: 0
          },
          dailyTrend: dailyAnalyses
        },
        chat: {
          byType: chatStats,
          totalChats: chatStats.reduce((sum, stat) => sum + stat.count, 0),
          totalMessages: chatStats.reduce((sum, stat) => sum + stat.totalMessages, 0)
        },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview'
    });
  }
});

// @route   GET /api/analytics/health-trends
// @desc    Get health trends and insights
// @access  Private
router.get('/health-trends', async (req, res) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months) || 6;

    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - months);

    // Monthly health analysis trends
    const monthlyTrends = await AIAnalysis.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: dateFrom },
          analysisType: 'pneumonia_detection'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAnalyses: { $sum: 1 },
          pneumoniaDetected: {
            $sum: {
              $cond: [{ $eq: ['$results.prediction', 'Pneumonia'] }, 1, 0]
            }
          },
          avgConfidence: { $avg: '$results.confidence' },
          highRiskCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$results.prediction', 'Pneumonia'] },
                    { $gte: ['$results.confidence', 80] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Risk assessment over time
    const riskAssessment = monthlyTrends.map(trend => {
      const pneumoniaRate = trend.totalAnalyses > 0 ? 
        (trend.pneumoniaDetected / trend.totalAnalyses) * 100 : 0;
      
      let riskLevel = 'low';
      if (pneumoniaRate > 50) riskLevel = 'high';
      else if (pneumoniaRate > 25) riskLevel = 'medium';

      return {
        period: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        pneumoniaRate: Math.round(pneumoniaRate * 100) / 100,
        riskLevel,
        totalAnalyses: trend.totalAnalyses,
        avgConfidence: Math.round(trend.avgConfidence * 100) / 100
      };
    });

    // Health recommendations based on trends
    const recommendations = generateHealthRecommendations(monthlyTrends);

    res.json({
      success: true,
      data: {
        timeRange: `${months} months`,
        trends: monthlyTrends,
        riskAssessment,
        recommendations,
        summary: {
          totalPeriods: monthlyTrends.length,
          overallPneumoniaRate: monthlyTrends.length > 0 ? 
            Math.round((monthlyTrends.reduce((sum, t) => sum + t.pneumoniaDetected, 0) / 
                       monthlyTrends.reduce((sum, t) => sum + t.totalAnalyses, 0)) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error('Health trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health trends'
    });
  }
});

// @route   GET /api/analytics/comparison
// @desc    Get comparative analytics with anonymized population data
// @access  Private
router.get('/comparison', async (req, res) => {
  try {
    const userId = req.user._id;

    // User's statistics
    const userStats = await AIAnalysis.aggregate([
      {
        $match: { user: userId }
      },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          pneumoniaDetected: {
            $sum: {
              $cond: [{ $eq: ['$results.prediction', 'Pneumonia'] }, 1, 0]
            }
          },
          avgConfidence: { $avg: '$results.confidence' }
        }
      }
    ]);

    // Population statistics (anonymized)
    const populationStats = await AIAnalysis.aggregate([
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          pneumoniaDetected: {
            $sum: {
              $cond: [{ $eq: ['$results.prediction', 'Pneumonia'] }, 1, 0]
            }
          },
          avgConfidence: { $avg: '$results.confidence' },
          totalUsers: { $addToSet: '$user' }
        }
      }
    ]);

    // Age group comparison (if user has provided age)
    const user = await User.findById(userId);
    let ageGroupComparison = null;

    if (user.profile.dateOfBirth) {
      const userAge = user.age;
      let ageGroup = 'unknown';
      
      if (userAge < 18) ageGroup = 'under_18';
      else if (userAge < 30) ageGroup = '18_29';
      else if (userAge < 50) ageGroup = '30_49';
      else if (userAge < 65) ageGroup = '50_64';
      else ageGroup = '65_plus';

      // This would require age data in user profiles for accurate comparison
      ageGroupComparison = {
        userAgeGroup: ageGroup,
        userAge: userAge
      };
    }

    const userResult = userStats[0] || { totalAnalyses: 0, pneumoniaDetected: 0, avgConfidence: 0 };
    const populationResult = populationStats[0] || { totalAnalyses: 0, pneumoniaDetected: 0, avgConfidence: 0, totalUsers: [] };

    const userPneumoniaRate = userResult.totalAnalyses > 0 ? 
      (userResult.pneumoniaDetected / userResult.totalAnalyses) * 100 : 0;
    
    const populationPneumoniaRate = populationResult.totalAnalyses > 0 ?
      (populationResult.pneumoniaDetected / populationResult.totalAnalyses) * 100 : 0;

    res.json({
      success: true,
      data: {
        user: {
          analyses: userResult.totalAnalyses,
          pneumoniaRate: Math.round(userPneumoniaRate * 100) / 100,
          avgConfidence: Math.round(userResult.avgConfidence * 100) / 100
        },
        population: {
          totalAnalyses: populationResult.totalAnalyses,
          totalUsers: populationResult.totalUsers.length,
          pneumoniaRate: Math.round(populationPneumoniaRate * 100) / 100,
          avgConfidence: Math.round(populationResult.avgConfidence * 100) / 100
        },
        comparison: {
          pneumoniaRateDifference: Math.round((userPneumoniaRate - populationPneumoniaRate) * 100) / 100,
          confidenceDifference: Math.round((userResult.avgConfidence - populationResult.avgConfidence) * 100) / 100,
          analysisVolume: userResult.totalAnalyses > (populationResult.totalAnalyses / populationResult.totalUsers.length) ? 'above_average' : 'below_average'
        },
        ageGroup: ageGroupComparison
      }
    });

  } catch (error) {
    console.error('Comparison analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison analytics'
    });
  }
});

// Helper function to generate health recommendations
function generateHealthRecommendations(trends) {
  const recommendations = [];

  if (trends.length === 0) {
    return ['Start by uploading chest X-rays for AI analysis to track your health trends.'];
  }

  const latestTrend = trends[trends.length - 1];
  const pneumoniaRate = latestTrend.totalAnalyses > 0 ? 
    (latestTrend.pneumoniaDetected / latestTrend.totalAnalyses) * 100 : 0;

  if (pneumoniaRate > 50) {
    recommendations.push('⚠️ High pneumonia detection rate detected. Please consult a healthcare professional immediately.');
    recommendations.push('🏥 Consider scheduling regular chest examinations.');
  } else if (pneumoniaRate > 25) {
    recommendations.push('⚡ Moderate pneumonia detection rate. Monitor symptoms and maintain regular checkups.');
    recommendations.push('💊 Ensure vaccinations are up to date.');
  } else {
    recommendations.push('✅ Good respiratory health trends. Continue healthy practices.');
  }

  if (latestTrend.avgConfidence < 60) {
    recommendations.push('📸 Consider retaking X-rays with better image quality for more accurate analysis.');
  }

  // General recommendations
  recommendations.push('🚭 Avoid smoking and exposure to air pollutants.');
  recommendations.push('🏃‍♂️ Maintain regular physical activity to strengthen respiratory health.');
  recommendations.push('🥗 Follow a balanced diet rich in vitamins and antioxidants.');

  return recommendations;
}

module.exports = router;