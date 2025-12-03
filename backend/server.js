const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const aiRoutes = require('./src/routes/ai');
const chatRoutes = require('./src/routes/chat');
const analyticsRoutes = require('./src/routes/analytics');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { verifyToken } = require('./src/middleware/auth');

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["https://medvision-ai-gamma.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ["https://medvision-ai-gamma.vercel.app"];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'AI-HER Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Root route - API status
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MedVision AI Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    backend_url: 'https://medvision-ai-d10f.onrender.com',
    frontend_url: 'https://medvision-ai-gamma.vercel.app',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      ai: '/api/ai',
      chat: '/api/chat',
      analytics: '/api/analytics',
      consultations: '/api/consultations',
      health: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MedVision AI Backend Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      ai: '/api/ai',
      chat: '/api/chat',
      analytics: '/api/analytics',
      consultations: '/api/consultations',
      health: '/health'
    },
    deployment: {
      frontend: 'https://medvision-ai-gamma.vercel.app',
      backend: 'https://medvision-ai-d10f.onrender.com'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/ai', verifyToken, aiRoutes);
app.use('/api/chat', verifyToken, chatRoutes);
app.use('/api/analytics', verifyToken, analyticsRoutes);
app.use('/api/consultations', verifyToken, require('./src/routes/consultations'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle chat messages
  socket.on('send_message', (data) => {
    // Broadcast message to all connected clients
    io.emit('receive_message', data);
  });

  // Handle AI analysis status updates
  socket.on('ai_analysis_start', (data) => {
    socket.to(data.userId).emit('ai_status_update', {
      status: 'processing',
      message: 'Analyzing chest X-ray...'
    });
  });

  // Handle consultation events
  socket.on('join_consultation', (consultationId) => {
    socket.join(`consultation_${consultationId}`);
    console.log(`User joined consultation room: consultation_${consultationId}`);
  });

  socket.on('consultation_status_change', (data) => {
    // Emit to all participants in the consultation
    socket.to(`consultation_${data.consultationId}`).emit('consultation_status_updated', data);
  });

  socket.on('video_call_started', (data) => {
    // Notify all participants that video call has started
    io.to(`consultation_${data.consultationId}`).emit('video_call_start', data);
  });

  socket.on('video_call_ended', (data) => {
    // Notify all participants that video call has ended
    io.to(`consultation_${data.consultationId}`).emit('video_call_end', data);
  });

  socket.on('participant_joined_video', (data) => {
    // Notify other participants
    socket.to(`consultation_${data.consultationId}`).emit('participant_video_join', data);
  });

  socket.on('participant_left_video', (data) => {
    // Notify other participants
    socket.to(`consultation_${data.consultationId}`).emit('participant_video_leave', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`🔹 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    server.listen(PORT, () => {
      console.log('🚀 MedVision AI Backend Server Started');
      console.log('='.repeat(50));
      console.log(`🔹 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔹 Server: https://medvision-ai-d10f.onrender.com`);
      console.log(`🔹 Health Check: https://medvision-ai-d10f.onrender.com/api/health`);
      console.log(`🔹 API Base: https://medvision-ai-d10f.onrender.com/api`);
      console.log(`🔹 Frontend: https://medvision-ai-gamma.vercel.app`);
      console.log(`🔹 Socket.IO: Enabled`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Start the server
startServer();

module.exports = app;