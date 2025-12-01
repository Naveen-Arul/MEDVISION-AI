const express = require('express');
const { body, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Chat = require('../models/Chat');

const router = express.Router();

// @route   GET /api/consultations
// @desc    Get user's consultations (patient or doctor)
// @access  Private
router.get('/', verifyToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  query('type').optional().isIn(['routine', 'follow_up', 'urgent', 'second_opinion', 'emergency']),
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

    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (page - 1) * limit;

    // Build query based on user role
    const query = {};
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else {
      query.patient = req.user._id;
    }

    if (status) query.status = status;
    if (type) query.type = type;

    const consultations = await Consultation.find(query)
      .populate('patient', 'name email profile')
      .populate('doctor', 'name email profile specialization')
      .populate('relatedAnalysis', 'analysisType result createdAt')
      .populate('chatRoom', 'title participants')
      .sort({ scheduledDateTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Consultation.countDocuments(query);

    res.json({
      success: true,
      data: {
        consultations,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / limit),
          total,
          limit: Number(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultations'
    });
  }
});

// @route   GET /api/consultations/upcoming
// @desc    Get upcoming consultations
// @access  Private
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const consultations = await Consultation.findUpcoming(req.user._id, req.user.role);

    res.json({
      success: true,
      data: consultations
    });

  } catch (error) {
    console.error('Get upcoming consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming consultations'
    });
  }
});

// @route   GET /api/consultations/doctors
// @desc    Get available doctors for consultation
// @access  Private
router.get('/doctors', verifyToken, [
  query('specialization').optional().isIn(['general', 'pulmonology', 'radiology', 'cardiology', 'oncology']),
  query('available').optional().isBoolean(),
], async (req, res) => {
  try {
    const { specialization, available } = req.query;
    
    const query = { role: 'doctor', 'profile.isActive': true };
    if (specialization) {
      query['profile.specialization'] = specialization;
    }

    const doctors = await User.find(query)
      .select('name email profile.specialization profile.bio profile.experience profile.avatar profile.consultationFee')
      .sort({ 'profile.rating': -1 });

    // If checking availability, filter doctors
    let availableDoctors = doctors;
    if (available === 'true') {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      availableDoctors = [];
      for (const doctor of doctors) {
        const bookedSlots = await Consultation.findByTimeRange(now, nextWeek, doctor._id);
        // Simple availability check - if they have less than 40 hours booked in next week
        const totalBookedHours = bookedSlots.reduce((sum, slot) => sum + (slot.duration / 60), 0);
        if (totalBookedHours < 40) {
          availableDoctors.push(doctor);
        }
      }
    }

    res.json({
      success: true,
      data: availableDoctors
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors'
    });
  }
});

// @route   GET /api/consultations/availability/:doctorId
// @desc    Get doctor availability for specific date
// @access  Private
router.get('/availability/:doctorId', verifyToken, [
  query('date').isISO8601().withMessage('Date must be in ISO format')
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

    const { doctorId } = req.params;
    const { date } = req.query;

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get booked slots for the date
    const bookedSlots = await Consultation.getDoctorAvailability(doctorId, date);

    // Generate available slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const targetDate = new Date(date);
    
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotTime.getTime() + (30 * 60 * 1000));
        
        // Check if slot conflicts with booked appointments
        const isBooked = bookedSlots.some(booked => {
          return (slotTime >= booked.start && slotTime < booked.end) ||
                 (slotEnd > booked.start && slotEnd <= booked.end);
        });
        
        if (!isBooked && slotTime > new Date()) {
          availableSlots.push({
            time: slotTime.toISOString(),
            display: slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        date,
        doctor: {
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.profile.specialization
        },
        availableSlots,
        bookedSlots: bookedSlots.length
      }
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch availability'
    });
  }
});

// @route   POST /api/consultations
// @desc    Book a new consultation
// @access  Private
router.post('/', verifyToken, [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('scheduledDateTime').isISO8601().withMessage('Valid date and time is required'),
  body('type').isIn(['routine', 'follow_up', 'urgent', 'second_opinion', 'emergency']).withMessage('Invalid consultation type'),
  body('specialization').optional().isIn(['general', 'pulmonology', 'radiology', 'cardiology', 'oncology']),
  body('reason').isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('duration').optional().isInt({ min: 15, max: 120 }).withMessage('Duration must be between 15 and 120 minutes'),
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

    const {
      doctorId,
      scheduledDateTime,
      type = 'routine',
      specialization = 'general',
      reason,
      symptoms = [],
      duration = 30
    } = req.body;

    // Verify doctor exists and is active
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not available'
      });
    }

    // Check if the time slot is available
    const scheduledTime = new Date(scheduledDateTime);
    const endTime = new Date(scheduledTime.getTime() + (duration * 60 * 1000));
    
    const conflictingConsultations = await Consultation.findByTimeRange(
      scheduledTime,
      endTime,
      doctorId
    );

    if (conflictingConsultations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available'
      });
    }

    // Create consultation
    const consultation = new Consultation({
      patient: req.user._id,
      doctor: doctorId,
      scheduledDateTime: scheduledTime,
      duration,
      type,
      specialization,
      reason,
      symptoms,
      createdBy: req.user._id,
      billing: {
        fee: doctor.profile.consultationFee || 100
      }
    });

    await consultation.save();

    // Create associated chat room
    const chatRoom = new Chat({
      title: `Consultation: ${doctor.name}`,
      chatType: 'doctor_consultation',
      participants: [
        { user: req.user._id, role: 'patient' },
        { user: doctorId, role: 'doctor' }
      ],
      settings: {
        consultationId: consultation._id,
        isConsultationChat: true
      }
    });

    await chatRoom.save();

    // Link chat room to consultation
    consultation.chatRoom = chatRoom._id;
    await consultation.save();

    // Populate the consultation for response
    const populatedConsultation = await Consultation.findById(consultation._id)
      .populate('patient', 'name email profile')
      .populate('doctor', 'name email profile specialization')
      .populate('chatRoom', 'title');

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: populatedConsultation
    });

  } catch (error) {
    console.error('Book consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book consultation'
    });
  }
});

// @route   GET /api/consultations/:id
// @desc    Get specific consultation details
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient', 'name email profile')
      .populate('doctor', 'name email profile specialization')
      .populate('relatedAnalysis')
      .populate('chatRoom');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check access permissions
    const isAuthorized = consultation.patient._id.toString() === req.user._id.toString() ||
                        consultation.doctor._id.toString() === req.user._id.toString() ||
                        req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: consultation
    });

  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation'
    });
  }
});

// @route   PUT /api/consultations/:id/status
// @desc    Update consultation status
// @access  Private
router.put('/:id/status', verifyToken, [
  body('status').isIn(['confirmed', 'cancelled', 'no_show', 'completed']).withMessage('Invalid status'),
  body('cancelReason').optional().isLength({ max: 200 }).withMessage('Cancel reason too long')
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

    const { status, cancelReason } = req.body;
    
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const canUpdate = consultation.patient._id.toString() === req.user._id.toString() ||
                     consultation.doctor._id.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update status
    consultation.status = status;
    if (status === 'cancelled') {
      consultation.cancelledBy = req.user._id;
      consultation.cancelReason = cancelReason;
    }

    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation status updated',
      data: consultation
    });

  } catch (error) {
    console.error('Update consultation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update consultation status'
    });
  }
});

// @route   POST /api/consultations/:id/start-video
// @desc    Start video consultation
// @access  Private
router.post('/:id/start-video', verifyToken, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check if user is participant
    const isParticipant = consultation.patient._id.toString() === req.user._id.toString() ||
                         consultation.doctor._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if consultation can be started
    if (!consultation.canStart()) {
      return res.status(400).json({
        success: false,
        message: 'Consultation cannot be started yet or is not confirmed'
      });
    }

    // Start the video call
    await consultation.startVideoCall();

    res.json({
      success: true,
      message: 'Video consultation started',
      data: {
        roomId: consultation.videoCall.roomId,
        jitsiRoomName: consultation.videoCall.jitsiRoomName,
        participants: {
          patient: consultation.patient,
          doctor: consultation.doctor
        }
      }
    });

  } catch (error) {
    console.error('Start video consultation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start video consultation'
    });
  }
});

// @route   POST /api/consultations/:id/end-video
// @desc    End video consultation
// @access  Private
router.post('/:id/end-video', verifyToken, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check if user is participant
    const isParticipant = consultation.patient._id.toString() === req.user._id.toString() ||
                         consultation.doctor._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // End the video call
    await consultation.endVideoCall();

    res.json({
      success: true,
      message: 'Video consultation ended',
      data: consultation
    });

  } catch (error) {
    console.error('End video consultation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end video consultation'
    });
  }
});

// @route   PUT /api/consultations/:id/notes
// @desc    Add doctor notes to consultation
// @access  Private (Doctor only)
router.put('/:id/notes', verifyToken, [
  body('diagnosis').optional().isLength({ max: 1000 }).withMessage('Diagnosis too long'),
  body('recommendations').optional().isLength({ max: 1000 }).withMessage('Recommendations too long'),
  body('prescription').optional().isArray().withMessage('Prescription must be an array'),
  body('followUpRequired').optional().isBoolean(),
  body('followUpDate').optional().isISO8601(),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical'])
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

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Only doctor can add notes
    if (consultation.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned doctor can add notes'
      });
    }

    const {
      diagnosis,
      recommendations,
      prescription,
      followUpRequired,
      followUpDate,
      severity
    } = req.body;

    // Update doctor notes
    consultation.doctorNotes = {
      ...consultation.doctorNotes,
      diagnosis,
      recommendations,
      prescription,
      followUpRequired,
      followUpDate,
      severity
    };

    await consultation.save();

    res.json({
      success: true,
      message: 'Notes updated successfully',
      data: consultation
    });

  } catch (error) {
    console.error('Update consultation notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notes'
    });
  }
});

module.exports = router;