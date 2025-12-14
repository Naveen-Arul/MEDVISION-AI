# 🏥 MedVision AI - Intelligent Healthcare Platform

## � Project Idea & Vision

**MedVision AI** is born from the vision of making quality healthcare accessible to everyone, regardless of their geographic location or economic status. The platform addresses three critical challenges in modern healthcare:

1. **Accessibility Gap**: Millions of people in remote areas lack access to immediate medical expertise
2. **Time Delays**: Traditional healthcare systems often involve long wait times for preliminary diagnosis
3. **Cost Barriers**: Initial consultations and screenings can be prohibitively expensive

### The Solution

MedVision AI bridges these gaps by combining artificial intelligence with telemedicine, creating a comprehensive healthcare ecosystem where:
- **AI serves as the first line of screening** - Providing instant, preliminary analysis of medical images
- **Doctors provide expert validation** - Human expertise confirms and guides treatment
- **Technology enables access** - Video consultations eliminate geographical barriers
- **Integration creates continuity** - Complete medical history tracking from screening to treatment

### 🎯 Core Capabilities

**🤖 AI-Powered Pneumonia Detection**
- Deep learning CNN model analyzes chest X-ray images in real-time
- Provides confidence scores (0-100%) for prediction reliability
- Classifies images as Normal, Pneumonia, or Inconclusive
- Delivers instant preliminary screening results

**💬 Intelligent Chat System**
- **AI Assistant**: Answers general health queries, provides health tips
- **Doctor Consultation Chat**: Real-time messaging between patients and doctors
- **Context-Aware**: AI remembers conversation history for better assistance
- **Multimedia Support**: Share images, documents, and AI analysis results

**🎥 Video Consultation Platform**
- High-quality video calls using Jitsi Meet technology
- Secure, browser-based (no downloads required)
- Unique room IDs for each consultation
- Real-time communication for accurate diagnosis

**📅 Comprehensive Appointment System**
- Smart scheduling with doctor availability matching
- 30-minute active window for flexible joining
- Status tracking (Scheduled → In Progress → Completed)
- Integrated with video rooms and chat

**📊 Medical Records Management**
- Complete history of AI analyses with images and results
- Consultation records with doctor notes and prescriptions
- Trend analysis showing health patterns over time
- Secure, patient-controlled data access

**👥 Role-Based User Experience**
- **Patient Interface**: Upload scans, book appointments, view history
- **Doctor Interface**: Review cases, manage appointments, add prescriptions
- **Contextual Dashboards**: Each role sees relevant information only

---

## 🏗️ Project Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: React Context API
- **Real-time**: Socket.IO Client
- **Video**: Jitsi Meet iframe integration

#### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Validation**: express-validator

#### AI Service
- **Framework**: Python Flask
- **Deep Learning**: TensorFlow/Keras (H5 model)
- **Image Processing**: PIL/Pillow
- **Model**: CNN for pneumonia detection

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Patient    │  │   Doctor     │  │   Admin      │      │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         React + TypeScript + shadcn/ui                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│              Express.js REST API + Socket.IO                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   Chat   │  │   AI     │  │  Consult │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │  Middleware  │  │   Services   │      │
│  │              │  │  (Auth, Err) │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │  Python AI   │  │   Jitsi      │      │
│  │   Database   │  │   Service    │  │   Meet       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### 1. User Model
**Collection**: `users`

```javascript
{
  name: String,                    // User's full name
  email: String,                   // Unique email (lowercase)
  password: String,                // Hashed password (bcrypt)
  role: Enum['patient', 'doctor', 'admin'],
  profile: {
    avatar: String,                // Profile image URL
    phone: String,
    dateOfBirth: Date,
    gender: Enum['male', 'female', 'other'],
    medicalHistory: [{
      condition: String,
      diagnosedDate: Date,
      notes: String
    }]
  },
  doctorProfile: {                 // Only for doctors
    specialization: String,
    licenseNumber: String,
    yearsOfExperience: Number,
    qualifications: [String],
    availability: [{
      day: String,
      startTime: String,
      endTime: String
    }],
    consultationFee: Number,
    rating: Number,
    totalConsultations: Number
  },
  status: Enum['active', 'inactive', 'suspended'],
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Consultation Model
**Collection**: `consultations`

```javascript
{
  patient: ObjectId → User,        // Patient reference
  doctor: ObjectId → User,         // Doctor reference
  scheduledDateTime: Date,         // Appointment time
  duration: Number,                // Minutes (default: 30)
  timezone: String,                // Timezone (default: UTC)
  type: Enum['routine', 'follow_up', 'urgent', 'second_opinion', 'emergency'],
  specialization: Enum['general', 'pulmonology', 'radiology', 'cardiology', 'oncology'],
  reason: String,                  // Consultation reason
  symptoms: [String],              // List of symptoms
  status: Enum['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
  videoCall: {
    roomId: String,                // Jitsi room identifier
    startedAt: Date,
    endedAt: Date,
    duration: Number,
    recordingUrl: String
  },
  notes: {
    patientNotes: String,          // Pre-consultation notes
    doctorNotes: String,           // Post-consultation notes
    diagnosis: String,
    prescription: [{
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    followUpRequired: Boolean,
    followUpDate: Date
  },
  payment: {
    amount: Number,
    status: Enum['pending', 'completed', 'failed', 'refunded'],
    method: String,
    transactionId: String,
    paidAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Chat Model
**Collection**: `chats`

```javascript
{
  participants: [{
    user: ObjectId → User,
    role: Enum['user', 'ai', 'doctor'],
    joinedAt: Date
  }],
  messages: [{
    sender: ObjectId → User,
    senderType: Enum['user', 'ai', 'system'],
    content: {
      text: String,
      aiAnalysis: ObjectId → AIAnalysis,
      attachment: {
        url: String,
        type: String,              // image, document, etc.
        name: String,
        size: Number
      }
    },
    messageType: Enum['text', 'ai_result', 'image', 'document', 'system_notification'],
    timestamp: Date,
    readBy: [ObjectId → User],
    reactions: [{
      user: ObjectId → User,
      type: String                 // emoji or reaction type
    }]
  }],
  chatType: Enum['ai_assistant', 'doctor_consultation', 'group'],
  consultation: ObjectId → Consultation,
  lastMessage: {
    text: String,
    timestamp: Date,
    sender: ObjectId → User
  },
  metadata: {
    isArchived: Boolean,
    isPinned: Boolean,
    mutedBy: [ObjectId → User]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Virtual Properties**:
- `unreadMessages`: Array of unread messages
- `unreadCount`: Count of unread messages
- `lastActivity`: Timestamp of last message

### 4. AIAnalysis Model
**Collection**: `aianalyses`

```javascript
{
  user: ObjectId → User,
  analysisType: Enum['pneumonia_detection', 'chest_xray_analysis', 'risk_assessment'],
  inputData: {
    imageUrl: String,              // Uploaded image path
    imageMetadata: {
      originalName: String,
      size: Number,
      mimetype: String,
      uploadDate: Date
    },
    textInput: String              // For risk assessment
  },
  results: {
    prediction: Enum['Normal', 'Pneumonia', 'Inconclusive'],
    confidence: Number,            // 0-100
    severity: Enum['low', 'medium', 'high'],
    findings: [String],            // Detailed findings
    recommendations: [String],     // Medical recommendations
    metrics: {
      processingTime: Number,      // Milliseconds
      modelVersion: String
    }
  },
  status: Enum['pending', 'processing', 'completed', 'failed'],
  reviewedBy: ObjectId → User,     // Doctor who reviewed
  reviewNotes: String,
  reviewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 System Workflows

### Patient Journey

```
1. Registration/Login
   ↓
2. Upload Chest X-ray → AI Analysis
   ↓
3. View Results (Confidence Score + Recommendations)
   ↓
4. [Optional] Chat with AI Assistant
   ↓
5. Book Consultation with Doctor
   ↓
6. Video Consultation (Jitsi Meet)
   ↓
7. Receive Diagnosis & Prescription
   ↓
8. View Medical History
```

### Doctor Journey

```
1. Login
   ↓
2. View Scheduled Appointments
   ↓
3. Review Patient's AI Analysis Results
   ↓
4. Join Video Consultation
   ↓
5. Add Notes, Diagnosis & Prescription
   ↓
6. End Consultation
   ↓
7. View Analytics Dashboard
```

### AI Analysis Workflow

```
Patient → Upload Image → Backend API
                           ↓
                      Python Flask Service
                           ↓
                      Load H5 Model
                           ↓
                    Preprocess Image
                           ↓
                    CNN Prediction
                           ↓
            {prediction: "Pneumonia", confidence: 87%}
                           ↓
                   Store in MongoDB
                           ↓
              Return Results to Frontend
                           ↓
           Display with Recommendations
```

---

## 🧩 Component Architecture & Explanation

### Frontend Components

#### 1. **Authentication System**
- **AuthContext**: Manages user authentication state globally across the application
- **JWT Token Storage**: Secure token management in localStorage with automatic expiration
- **Protected Routes**: Wrapper component that checks authentication before rendering pages
- **Role-Based Routing**: Redirects users to appropriate dashboards based on their role

**How It Works**: When a user logs in, credentials are validated against the backend, a JWT token is generated containing user ID and role, stored in browser, and included in all subsequent API requests via Authorization headers.

#### 2. **Patient Dashboard Components**

**AIAssistant.tsx** - AI-Powered Health Assistant
- Chat interface with AI for health-related questions
- Real-time message streaming with auto-scroll
- Markdown rendering for formatted AI responses
- Context retention for follow-up questions
- Quick action buttons for common queries

**Upload.tsx** - Medical Image Analysis
- Drag-and-drop file upload with preview
- Image validation (type, size, format)
- Progress indicators during upload and analysis
- Results display with confidence visualization
- Recommendation cards based on AI findings

**MyAppointments.tsx** - Consultation Management
- Tabbed view (Upcoming / Past appointments)
- Real-time status updates via Socket.IO
- Quick join buttons for active consultations
- Statistics cards (Total, Today, Completed)
- 30-minute active window logic for flexible scheduling

**History.tsx** - Medical Records Timeline
- Chronological list of all AI analyses
- Filterable by date range and prediction type
- Detailed view showing original images and confidence scores
- Doctor review notes if available
- Export functionality for medical records

**BookAppointment.tsx** - Doctor Selection & Scheduling
- Doctor listing with specializations and ratings
- Real-time availability checking
- Dynamic time slot selection (HTML time input)
- Symptom checklist and reason description
- Appointment type selection (routine, urgent, follow-up)

**PatientConsultation.tsx** - Video Call Interface
- Jitsi Meet iframe integration
- Consultation details sidebar
- End consultation button with status update
- Pre-call notes and post-call prescription view
- Automatic chat room linking

#### 3. **Doctor Dashboard Components**

**DoctorAppointments.tsx** - Appointment Queue
- Grid view of all scheduled consultations
- Patient information cards with AI analysis preview
- Action buttons (Join Now, View Details, End Session)
- Filtering by date and status
- Color-coded status indicators

**Patients.tsx** - Patient Registry
- Complete list of patients the doctor has treated
- Search and filter functionality
- Medical history access for each patient
- Quick consultation booking for follow-ups
- Analytics on patient demographics

**DoctorConsultation.tsx** - Consultation Workspace
- Video call interface
- Patient medical history sidebar
- AI analysis results review
- Prescription writing form with medication database
- Real-time notes saving to database

#### 4. **Shared Components**

**ChatMessage.tsx** - Message Bubble
- Sender-based styling (patient/doctor/AI)
- Timestamp formatting
- Read receipt indicators
- Support for text, images, and AI results
- Reaction emoji support (planned)

**Navbar.tsx** - Navigation Bar
- Role-based menu items
- User profile dropdown
- Notification bell with unread count
- Logout functionality
- Responsive mobile menu

**Sidebar.tsx** - Navigation Sidebar
- Hierarchical navigation structure
- Active route highlighting
- Collapsible on mobile devices
- Quick access to frequent actions
- Icon-based visual navigation

**MarkdownRenderer.tsx** - Content Formatter
- Converts AI responses to formatted HTML
- Syntax highlighting for medical terms
- Safe HTML rendering (XSS prevention)
- Custom styling for medical content

### Backend Components

#### 1. **API Routes Layer**

**auth.js** - Authentication Endpoints
- `POST /register` - New user registration with validation
- `POST /login` - Credential verification and token generation
- `GET /me` - Current user profile retrieval
- `PUT /profile` - Profile update with authorization check

**consultations.js** - Consultation Management
- `POST /` - Create new consultation appointment
- `GET /` - Retrieve user's consultations (filtered by role)
- `GET /:id` - Get specific consultation details
- `PUT /:id/status` - Update consultation status
- `PUT /:id/notes` - Add doctor notes and prescription
- `GET /patients` - List patients for doctor dashboard

**chat.js** - Messaging System
- `POST /` - Create new chat room
- `GET /` - Get user's chat list (excludes doctor_consultation type)
- `GET /:id` - Get chat history with pagination
- `POST /:id/message` - Send new message
- `PUT /:id/read` - Mark messages as read

**ai.js** - AI Analysis Integration
- `POST /analyze` - Upload image and trigger AI analysis
- `GET /analyses` - Retrieve user's analysis history
- `GET /analyses/:id` - Get specific analysis details
- `PUT /analyses/:id/review` - Doctor review submission

#### 2. **Middleware Layer**

**auth.js** - Authentication Middleware
```javascript
verifyToken(req, res, next)
```
- Extracts JWT from Authorization header
- Verifies token signature and expiration
- Attaches decoded user data to request object
- Handles invalid/expired token errors

**errorHandler.js** - Centralized Error Management
```javascript
errorHandler(err, req, res, next)
```
- Catches all unhandled errors
- Formats error responses consistently
- Logs errors for debugging
- Distinguishes between validation, authentication, and server errors

#### 3. **Controllers Layer**

**Business Logic Separation**: Each route has corresponding controller functions that:
- Validate input data using express-validator
- Perform database operations via Mongoose models
- Handle complex business logic (e.g., appointment availability)
- Format responses with consistent structure
- Log important operations for audit trails

#### 4. **Models Layer** (Database Schemas)

**User.js** - User Entity
- Polymorphic schema (patient/doctor/admin)
- Conditional fields based on role
- Password hashing using bcrypt pre-save hooks
- Virtual properties for full name formatting
- Instance methods for password comparison

**Consultation.js** - Appointment Entity
- References to User model (patient & doctor)
- Nested videoCall object for Jitsi integration
- Complex validation for scheduling logic
- Prescription array with medication details
- Payment tracking structure (for future integration)

**Chat.js** - Messaging Entity
- Participants array with roles
- Messages array with polymorphic sender types
- Virtual properties for unread count calculation
- Support for multiple chat types
- Metadata for archiving and pinning

**AIAnalysis.js** - AI Results Entity
- Image upload metadata storage
- Results object with prediction and confidence
- Review tracking by doctors
- Status workflow (pending → processing → completed)
- Static methods for analytics queries

### Python AI Service Components

**app.py** - Flask Microservice
- `GET /health` - Service health check endpoint
- `POST /predict` - Image prediction endpoint

**Workflow**:
1. Receive image via multipart form-data
2. Validate file type and size
3. Save temporarily with unique filename (UUID)
4. Preprocess image (resize, normalize)
5. Load CNN model from .h5 file
6. Run inference
7. Calculate confidence score
8. Clean up temporary file
9. Return JSON prediction

**pneumonia_model.h5** - Trained CNN Model
- Architecture: Convolutional Neural Network
- Input: 224x224 grayscale chest X-ray images
- Layers: Conv2D → MaxPooling → Dense → Softmax
- Output: Binary classification (Normal/Pneumonia) + confidence
- Trained on labeled chest X-ray dataset

### Real-time Components (Socket.IO)

**Server-Side Socket Handlers** (in server.js)
```javascript
io.on('connection', (socket) => {
  // User authentication via handshake
  // Join user-specific room
  // Handle 'send_message' events
  // Emit 'receive_message' to recipients
  // Handle 'typing' indicators
  // Disconnect cleanup
});
```

**Client-Side Socket Context** (SocketContext.tsx)
- Establishes WebSocket connection on app load
- Provides socket instance to all components
- Handles automatic reconnection
- Manages event listeners lifecycle
- Emits and listens for custom events

**Message Flow**:
```
User types → emit('send_message') → Server validates → 
Save to DB → emit('receive_message') to recipient → 
Recipient UI updates in real-time
```

---

## 📁 Project Structure & Component Organization

### Backend Architecture
```
backend/
├── src/
│   ├── controllers/           # Business Logic Layer
│   │   └── [Feature-specific logic handlers]
│   │
│   ├── middleware/            # Request Processing
│   │   ├── auth.js           → JWT verification, user attachment
│   │   └── errorHandler.js   → Centralized error formatting
│   │
│   ├── models/               # Data Models (MongoDB Schemas)
│   │   ├── User.js           → Patient/Doctor profiles, authentication
│   │   ├── Consultation.js   → Appointments, video calls, prescriptions
│   │   ├── Chat.js           → Messages, participants, chat types
│   │   └── AIAnalysis.js     → Image metadata, predictions, reviews
│   │
│   ├── routes/               # API Endpoints
│   │   ├── auth.js           → /api/auth/* (register, login, profile)
│   │   ├── consultations.js  → /api/consultations/* (CRUD, status updates)
│   │   ├── chat.js           → /api/chat/* (messaging, history)
│   │   └── ai.js             → /api/ai/* (image upload, analysis)
│   │
│   └── utils/                # Helper Functions
│       └── [Utility functions, validators, formatters]
│
├── uploads/                  # User-Uploaded Files
│   └── [Chest X-ray images with UUID filenames]
│
├── app.py                    # Python AI Microservice
│   └── Flask server for CNN model inference
│
├── pneumonia_model.h5        # Trained Deep Learning Model
│   └── Pre-trained weights for pneumonia detection
│
├── server.js                 # Main Express Application
│   ├── Middleware setup (CORS, body-parser)
│   ├── Route registration
│   ├── Socket.IO initialization
│   ├── MongoDB connection
│   └── Error handling
│
└── package.json              # Dependencies & Scripts
    └── express, mongoose, socket.io, jwt, bcrypt, multer
```

### Frontend Architecture
```
frontend/
├── src/
│   ├── components/           # Reusable UI Components
│   │   ├── ui/              # shadcn/ui Library Components
│   │   │   ├── button.tsx   → Styled button variants
│   │   │   ├── card.tsx     → Container components
│   │   │   ├── dialog.tsx   → Modal dialogs
│   │   │   ├── form.tsx     → Form controls with validation
│   │   │   └── [35+ more components]
│   │   │
│   │   ├── patient/         # Patient-Specific Components
│   │   │   ├── PatientLayout.tsx  → Layout wrapper for patient pages
│   │   │   └── PatientSidebar.tsx → Navigation for patient dashboard
│   │   │
│   │   ├── ChatMessage.tsx        → Individual message bubble
│   │   ├── ChatSidebar.tsx        → Chat list with unread counts
│   │   ├── MedicalChatbot.tsx     → AI assistant interface
│   │   ├── VideoCallRoom.tsx      → Jitsi iframe wrapper
│   │   ├── BookConsultation.tsx   → Appointment booking form
│   │   ├── MarkdownRenderer.tsx   → AI response formatter
│   │   └── ProtectedRoute.tsx     → Authentication guard
│   │
│   ├── contexts/            # Global State Management
│   │   ├── AuthContext.tsx  → User authentication state
│   │   │   ├── user: { id, name, email, role }
│   │   │   ├── token: JWT string
│   │   │   ├── login(credentials)
│   │   │   ├── logout()
│   │   │   └── updateProfile(data)
│   │   │
│   │   └── SocketContext.tsx → Real-time connection
│   │       ├── socket: Socket.IO instance
│   │       ├── connected: boolean
│   │       └── Event emitters/listeners
│   │
│   ├── pages/               # Route Components
│   │   ├── patient/         # Patient Dashboard Pages
│   │   │   ├── AIAssistant.tsx      → Chat with AI bot
│   │   │   ├── Upload.tsx           → Upload X-ray for analysis
│   │   │   ├── History.tsx          → Medical records timeline
│   │   │   ├── MyAppointments.tsx   → Consultation list
│   │   │   ├── BookAppointment.tsx  → Schedule with doctor
│   │   │   ├── DoctorList.tsx       → Browse available doctors
│   │   │   └── PatientConsultation.tsx → Video call interface
│   │   │
│   │   ├── doctor/          # Doctor Dashboard Pages
│   │   │   ├── Dashboard.tsx         → Analytics overview
│   │   │   ├── DoctorAppointments.tsx → Appointment queue
│   │   │   ├── Patients.tsx          → Patient registry
│   │   │   └── DoctorConsultation.tsx → Video call with notes
│   │   │
│   │   ├── Login.tsx        → Authentication page
│   │   ├── SignupPatient.tsx → Patient registration
│   │   └── SignupDoctor.tsx  → Doctor registration
│   │
│   ├── lib/                 # Utilities & Services
│   │   ├── api.ts           → Axios instance with interceptors
│   │   │   ├── Base URL configuration
│   │   │   ├── Token injection
│   │   │   └── Error handling
│   │   │
│   │   ├── services.ts      → API service functions
│   │   │   ├── authService: { login, register, getProfile }
│   │   │   ├── consultationService: { create, get, update }
│   │   │   ├── chatService: { getChats, sendMessage }
│   │   │   └── aiService: { analyze, getHistory }
│   │   │
│   │   └── utils.ts         → Helper functions
│   │       ├── formatDate()
│   │       ├── calculateAge()
│   │       └── cn() - className merger
│   │
│   ├── App.tsx              # Root Component
│   │   ├── Router configuration
│   │   ├── Protected route wrappers
│   │   ├── Context providers
│   │   └── Global layouts
│   │
│   └── main.tsx             # Application Entry Point
│       ├── React.StrictMode wrapper
│       ├── BrowserRouter setup
│       └── Root DOM rendering
│
└── package.json             # Dependencies
    └── react, typescript, vite, tailwind, shadcn, socket.io-client
```

### Component Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  React Component (e.g., Upload.tsx)                         │
│  ├── State management (useState, useEffect)                 │
│  ├── Form handling                                          │
│  └── Event handlers                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (lib/services.ts)                            │
│  └── aiService.analyze(formData)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  API Client (lib/api.ts - Axios)                            │
│  ├── Attach JWT token from AuthContext                      │
│  ├── POST /api/ai/analyze                                   │
│  └── Handle response/errors                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend Route (routes/ai.js)                               │
│  ├── Multer middleware (file upload)                        │
│  ├── verifyToken middleware (authentication)                │
│  └── Route handler                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Controller Logic                                            │
│  ├── Validate file                                          │
│  ├── Call Python AI service                                 │
│  ├── Create AIAnalysis document                             │
│  └── Return results                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Python Flask Service (app.py)                              │
│  ├── Load pneumonia_model.h5                                │
│  ├── Preprocess image                                       │
│  ├── CNN inference                                          │
│  └── Return { prediction, confidence }                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  MongoDB (AIAnalysis collection)                            │
│  └── Store analysis with results                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Response to Frontend                                        │
│  └── { success: true, data: { prediction, confidence } }    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Component Updates State                                     │
│  ├── setResults(response.data)                              │
│  ├── Show success toast                                     │
│  └── Navigate to results page                               │
└─────────────────────────────────────────────────────────────┘
```

---

## � Security Architecture & Implementation

### Authentication Flow
```
User Login → Credentials Validation → Password Comparison (bcrypt)
    ↓
Token Generation (JWT)
    ├── Payload: { userId, role, email }
    ├── Secret: Environment variable
    └── Expiry: 24 hours
    ↓
Token Storage → localStorage (Frontend)
    ↓
Protected Requests → Authorization: Bearer <token>
    ↓
Token Verification (Middleware)
    ├── Extract from header
    ├── Verify signature
    ├── Check expiration
    └── Attach user to request
```

### Security Layers Implemented

**1. Password Security**
- bcrypt hashing with salt rounds (10)
- Never store plain text passwords
- Password excluded from queries by default (`select: false`)
- Pre-save hooks for automatic hashing on updates

**2. API Security**
- JWT token verification on all protected routes
- Role-based access control (patient can't access doctor endpoints)
- Request validation using express-validator
- CORS configured for specific origins only

**3. Data Access Control**
- Users can only access their own medical records
- Doctors can only see assigned patients
- Consultation participants verified before joining video calls
- Chat room access restricted to participants

**4. File Upload Security**
- File type whitelist (JPEG, PNG only)
- File size limits (5MB maximum)
- Unique filenames using UUID (prevent overwrites)
- Sanitization of original filenames
- Storage outside public directory

**5. Input Validation**
- All user inputs validated and sanitized
- MongoDB injection prevention via Mongoose
- XSS prevention (React escapes by default)
- SQL injection N/A (NoSQL database)

### Privacy Considerations

**HIPAA-Ready Architecture**:
- Patient data isolated by user ID
- Medical images stored with access controls
- Consultation notes encrypted in transit (HTTPS in production)
- Audit trail via timestamps and logs
- Data minimization (only collect necessary information)

---

## 🎨 UI/UX Design Philosophy

### Design Principles

**1. Medical Context Awareness**
- Calming color palette (blues, greens) to reduce anxiety
- Clear typography for readability (many users may be elderly)
- High contrast for accessibility
- Minimal distractions during critical tasks (image upload, consultations)

**2. Progressive Disclosure**
- Show basic information first, details on demand
- Wizard-style flows for complex tasks (booking appointments)
- Expandable sections for medical history
- Tooltips for medical terminology

**3. Responsive & Accessible**
- Mobile-first design (many patients use phones)
- Touch-friendly targets (minimum 44x44px)
- Keyboard navigation support
- ARIA labels for screen readers
- Skip links for navigation

**4. Real-time Feedback**
- Loading states with skeleton screens
- Progress indicators for AI analysis
- Toast notifications for actions
- Optimistic UI updates (chat messages)
- Error messages with recovery suggestions

### Component Design Patterns

**shadcn/ui Components** - Why This Choice?
- **Accessible by default**: Built on Radix UI primitives
- **Customizable**: Copy-paste, not npm install
- **Type-safe**: Full TypeScript support
- **Composable**: Build complex UIs from simple parts
- **Beautiful**: Modern design with Tailwind CSS

**Key UI Components**:
- **Card**: Medical record containers
- **Dialog**: Confirmation modals
- **Form**: Controlled inputs with validation
- **Table**: Appointment lists
- **Tabs**: Switch between appointment statuses
- **Badge**: Status indicators (Active, Completed)
- **Avatar**: User profile pictures
- **Toast**: Success/error notifications

---

## 📊 Data Flow & State Management

### Frontend State Architecture

**1. Global State (React Context)**
```typescript
AuthContext
├── user: User | null
├── token: string | null
├── isAuthenticated: boolean
├── login(credentials)
├── logout()
└── updateProfile(data)

SocketContext
├── socket: Socket | null
├── connected: boolean
└── Event handlers
```

**2. Local State (useState)**
- Form inputs
- UI toggles (modals, dropdowns)
- Temporary data (search queries)
- Loading states

**3. Server State (API Calls)**
- Consultations list
- Chat messages
- AI analysis results
- User profiles

**Data Fetching Pattern**:
```typescript
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await service.getData();
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, [dependency]);
```

### Backend Data Flow

**Request → Response Lifecycle**:
```
1. Client sends HTTP request
   ↓
2. Express middleware stack
   ├── CORS headers
   ├── JSON body parsing
   └── Custom middleware (auth)
   ↓
3. Route handler
   ├── Extract params/body
   └── Call controller
   ↓
4. Controller logic
   ├── Validate inputs
   ├── Database operations
   └── Business logic
   ↓
5. Database (MongoDB)
   ├── Query execution
   └── Return documents
   ↓
6. Format response
   ├── Success: { success: true, data: {...} }
   └── Error: { success: false, error: "message" }
   ↓
7. Send JSON response
   └── Client receives data
```

### Real-time Data Synchronization

**Socket.IO Events**:
```javascript
// Client → Server
socket.emit('send_message', {
  chatId,
  content: { text: "Hello" },
  senderType: 'user'
});

// Server → Client
socket.on('receive_message', (message) => {
  setMessages(prev => [...prev, message]);
});

// Bidirectional
socket.emit('typing', { chatId, isTyping: true });
socket.on('user_typing', ({ userId, isTyping }) => {
  // Show "User is typing..." indicator
});
```

---

## 🔄 System Workflows Explained

### Complete Patient Journey (Step-by-Step)

**1. Registration & Authentication**
- User fills signup form (name, email, password, role: patient)
- Frontend validates input (email format, password strength)
- POST /api/auth/register with form data
- Backend hashes password with bcrypt
- Creates User document in MongoDB
- Returns success message
- User redirected to login page
- Login with credentials
- Backend verifies password, generates JWT
- Token stored in localStorage
- User redirected to patient dashboard

**2. AI Image Analysis**
- Patient clicks "AI Assistant" → "Upload X-ray"
- Drag & drop or click to upload chest X-ray image
- Frontend validates file (type: image/*, size: <5MB)
- Preview shown before upload
- Click "Analyze" button
- FormData created with image file
- POST /api/ai/analyze with multipart/form-data
- Backend receives file via Multer middleware
- File saved to /uploads with UUID filename
- Backend calls Python Flask service
- Python service loads pneumonia_model.h5
- Image preprocessed (resize to 224x224, normalize)
- CNN model runs inference
- Returns { prediction: "Pneumonia", confidence: 87.5 }
- Backend creates AIAnalysis document in MongoDB
- Response sent to frontend
- Results displayed with confidence visualization
- Recommendations shown based on prediction
- Option to book consultation with doctor

**3. Booking Consultation**
- Patient clicks "Book Consultation"
- Browse doctor list with filters (specialization, availability)
- Select doctor (e.g., Dr. Sarah Johnson - Cardiology)
- Choose date using calendar component
- Select time using HTML time input
- Fill consultation form:
  - Reason for consultation
  - Symptoms checklist
  - Type (routine/urgent/follow-up)
- Submit booking
- POST /api/consultations with data
- Backend validates doctor availability
- Creates Consultation document
- Creates associated Chat room for consultation
- Generates unique Jitsi roomId
- Email notification sent (future enhancement)
- Success toast shown
- Patient redirected to "My Appointments"

**4. Video Consultation**
- Patient sees "Join Now" button when consultation is active
- Clicks to join video call
- Navigates to /patient/consult/:id
- Component fetches consultation details
- Jitsi Meet iframe loaded with roomId
- Patient enters video room
- Doctor joins from their dashboard
- Real-time video/audio communication
- Patient can view AI analysis results shared by doctor
- Doctor can take notes during call
- Either party can end consultation
- Status updated to "completed"
- Consultation moved to "Past Appointments"

**5. Viewing Medical History**
- Navigate to "Medical History" page
- GET /api/ai/analyses fetches all patient's analyses
- Timeline view of all X-ray uploads
- Each record shows:
  - Upload date
  - Thumbnail of image
  - Prediction (Normal/Pneumonia)
  - Confidence percentage
  - Doctor review notes (if reviewed)
- Expandable details for full findings
- Filter by date range or prediction type
- Export functionality (PDF/CSV)

### Complete Doctor Journey (Step-by-Step)

**1. Login & Dashboard**
- Doctor logs in with credentials
- JWT token generated and stored
- Redirected to /doctor/dashboard
- Dashboard shows:
  - Total appointments today
  - Active consultations
  - Pending reviews
  - Recent AI analyses from patients

**2. Viewing Appointments**
- Navigate to "Appointments"
- GET /api/consultations fetches doctor's consultations
- Two tabs: Upcoming | Past
- Upcoming shows consultations with 30-minute active window
- Each appointment card displays:
  - Patient name and age
  - Scheduled time
  - Consultation type
  - Symptoms
  - AI analysis preview (if available)
- Action buttons:
  - "Join Now" (if currently active)
  - "Waiting" (if scheduled but not yet time)
  - "End Consultation" (quick terminate)

**3. Reviewing Patient AI Results**
- Click on patient appointment
- View patient's complete medical history
- Review AI analysis results:
  - Original X-ray image
  - Prediction and confidence
  - AI findings list
- Add doctor review notes
- Confirm or disagree with AI prediction
- PUT /api/ai/analyses/:id/review
- Review saved with timestamp

**4. Conducting Video Consultation**
- Click "Join Now" on active appointment
- Enter video call room
- View patient details sidebar:
  - Medical history
  - Current symptoms
  - AI analysis results
- Conduct examination via video
- Take real-time notes
- After consultation:
  - Add diagnosis
  - Write prescription (medication, dosage, duration)
  - Set follow-up requirement
  - PUT /api/consultations/:id/notes
- Click "End Consultation"
- Status updated to "completed"

**5. Patient Management**
- View all patients doctor has treated
- Search by name or filter by condition
- Access complete patient records
- Quick book follow-up consultation
- Send message via chat

---

## 🧠 AI Model Architecture & Training

### Pneumonia Detection CNN Model

**Model Type**: Convolutional Neural Network (Deep Learning)

**Architecture Layers**:
```
Input Layer (224x224x1 grayscale image)
    ↓
Conv2D Layer 1 (32 filters, 3x3 kernel, ReLU activation)
    ↓
MaxPooling2D (2x2 pool size)
    ↓
Conv2D Layer 2 (64 filters, 3x3 kernel, ReLU activation)
    ↓
MaxPooling2D (2x2 pool size)
    ↓
Conv2D Layer 3 (128 filters, 3x3 kernel, ReLU activation)
    ↓
MaxPooling2D (2x2 pool size)
    ↓
Flatten Layer
    ↓
Dense Layer (128 units, ReLU activation)
    ↓
Dropout (0.5 - prevent overfitting)
    ↓
Output Layer (2 units, Softmax activation)
    ↓
Prediction: [Normal, Pneumonia] + Confidence Score
```

**Training Details**:
- **Dataset**: Chest X-ray images (Normal vs Pneumonia cases)
- **Preprocessing**: 
  - Resize to 224x224 pixels
  - Grayscale conversion
  - Normalization (pixel values 0-1)
  - Data augmentation (rotation, flip, zoom)
- **Optimizer**: Adam (adaptive learning rate)
- **Loss Function**: Categorical cross-entropy
- **Metrics**: Accuracy, Precision, Recall, F1-Score
- **Epochs**: 50 with early stopping
- **Validation Split**: 80% training, 20% validation

**Model Performance**:
- Accuracy: ~88-92% on test data
- Precision: High (minimizes false positives)
- Recall: Critical (minimizes false negatives - dangerous in medical)
- F1-Score: Balanced metric

**Inference Process**:
```python
# 1. Load model
model = load_model('pneumonia_model.h5')

# 2. Preprocess image
img = load_img(image_path, target_size=(224, 224), color_mode='grayscale')
img_array = img_to_array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

# 3. Predict
predictions = model.predict(img_array)
confidence = float(np.max(predictions) * 100)
prediction_class = 'Pneumonia' if predictions[0][1] > 0.5 else 'Normal'

# 4. Return results
return {
    'prediction': prediction_class,
    'confidence': confidence,
    'severity': calculate_severity(confidence)
}
```

### Why CNN for Pneumonia Detection?

**Advantages**:
1. **Feature Extraction**: Automatically learns patterns in X-rays (infiltrates, consolidations)
2. **Spatial Hierarchy**: Recognizes local patterns (edges) to global patterns (lung opacity)
3. **Translation Invariance**: Detects pneumonia regardless of position in image
4. **Proven Performance**: CNNs are state-of-the-art for medical image classification

**How It Works**:
- Early convolutional layers detect edges, textures
- Middle layers detect shapes (lung regions, ribs)
- Deep layers detect high-level features (pneumonia indicators)
- Final dense layers make classification decision

---

## 🌐 Integration Points & External Services

### Jitsi Meet Video Platform

**Why Jitsi?**
- Open-source and free to use
- No API limits or per-minute charges
- Excellent video/audio quality
- Browser-based (no downloads)
- End-to-end encryption support
- Self-hosting option for privacy

**Integration Method**:
```typescript
// Generate unique room ID for each consultation
const roomId = `medvision-${consultationId}-${Date.now()}`;

// Embed Jitsi iframe
<iframe
  src={`https://meet.jit.si/${roomId}`}
  allow="camera; microphone; fullscreen; display-capture"
  style={{ width: '100%', height: '600px', border: 'none' }}
/>
```

**Features Used**:
- Video/audio calling
- Screen sharing (for X-ray review)
- Chat (integrated with our system)
- Recording (future enhancement)

**Security**:
- Unique room IDs prevent unauthorized access
- Room expires after consultation ends
- Consultation participants verified before room access

### MongoDB Atlas Cloud Database

**Why MongoDB Atlas?**
- Fully managed cloud database
- Automatic backups and point-in-time recovery
- Built-in monitoring and alerts
- Horizontal scaling with sharding
- Global clusters for low latency
- Free tier for development

**Collections Used**:
1. **users** - Patient and doctor profiles
2. **consultations** - Appointment records
3. **chats** - Messaging history
4. **aianalyses** - AI prediction results

**Connection**:
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### Socket.IO Real-time Engine

**Why Socket.IO?**
- Automatic fallback (WebSocket → polling)
- Room/namespace support for chat isolation
- Binary data support (images)
- Reconnection handling
- Cross-browser compatibility

**Implementation**:
```javascript
// Server
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  socket.join(`user-${userId}`); // User-specific room
  
  socket.on('send_message', async (data) => {
    const message = await saveMessage(data);
    io.to(`chat-${data.chatId}`).emit('receive_message', message);
  });
});

// Client
const socket = io(SERVER_URL, {
  auth: { userId: user.id }
});
```

**Events Used**:
- `send_message` - User sends chat message
- `receive_message` - User receives message
- `consultation_status_update` - Appointment status changed
- `typing` - User typing indicator
- `user_online` - User presence

---

## 📈 Scalability Considerations

### Current Architecture Limitations

**Single Server Setup**:
- Backend, AI service, and database on separate instances
- No load balancing yet
- Vertical scaling only (increase server resources)

**Scalability Improvements for Production**:

**1. Microservices Architecture**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Auth        │     │ Consultation │     │   AI         │
│  Service     │     │ Service      │     │   Service    │
│  (Node.js)   │     │ (Node.js)    │     │  (Python)    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  API Gateway   │
                    │  (Kong/Nginx)  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │   Frontend     │
                    └────────────────┘
```

**2. Load Balancing**
- Nginx reverse proxy
- Multiple backend instances
- Round-robin distribution
- Health checks

**3. Caching Layer**
- Redis for session data
- Cache doctor availability
- Cache frequently accessed consultations
- Reduce database queries by 60-70%

**4. CDN for Images**
- Store X-ray images on AWS S3
- CloudFront CDN for fast delivery
- Reduce server load
- Better performance globally

**5. Database Optimization**
- MongoDB sharding by user region
- Read replicas for analytics
- Indexes on frequently queried fields
- Aggregation pipeline optimization

**6. Message Queue**
- RabbitMQ for async tasks
- Email notifications
- AI analysis jobs
- Decouple services

**Expected Performance**:
- Handle 10,000+ concurrent users
- <100ms API response time
- 99.9% uptime
- Real-time messaging (<50ms latency)

---

## 🚀 Future Enhancements & Roadmap

### Phase 1: Enhanced AI Capabilities (Q1 2026)
- [ ] **Multi-Disease Detection**
  - COVID-19 from CT scans
  - Tuberculosis detection
  - Lung cancer screening
  - Bone fracture detection

- [ ] **Explainable AI**
  - Heatmap visualization (Grad-CAM)
  - Highlight affected lung regions
  - Detailed finding explanations
  - Confidence breakdown by region

- [ ] **Model Improvements**
  - Ensemble models (combine multiple CNNs)
  - Transfer learning (ResNet, EfficientNet)
  - Continuous learning from doctor feedback
  - A/B testing of model versions

### Phase 2: Patient Engagement Features (Q2 2026)
- [ ] **Health Monitoring**
  - Vital signs tracking (BP, heart rate, temperature)
  - Symptom checker
  - Health score dashboard
  - Wearable device integration (Fitbit, Apple Watch)

- [ ] **Medication Management**
  - Prescription tracking
  - Medication reminders
  - Drug interaction warnings
  - Refill notifications

- [ ] **Personalized Health Tips**
  - AI-powered recommendations
  - Diet and exercise plans
  - Preventive care alerts
  - Health goal tracking

### Phase 3: Doctor Tools & Analytics (Q3 2026)
- [ ] **Advanced Analytics Dashboard**
  - Patient demographics analysis
  - Disease trend visualization
  - Consultation time optimization
  - Revenue tracking

- [ ] **Digital Prescription System**
  - E-prescription generation
  - Pharmacy integration
  - Insurance claim automation
  - Prescription history

- [ ] **Clinical Decision Support**
  - Drug dosage calculator
  - Treatment guidelines
  - Medical literature search
  - Second opinion network

### Phase 4: Platform Expansion (Q4 2026)
- [ ] **Mobile Applications**
  - React Native iOS app
  - React Native Android app
  - Push notifications
  - Offline mode

- [ ] **Multi-language Support**
  - English, Hindi, Spanish, French
  - RTL language support
  - Localized medical terms
  - Currency conversion

- [ ] **Hospital Integration**
  - EHR/EMR system integration
  - Lab results import
  - Radiology PACS integration
  - Hospital bed availability

- [ ] **Insurance & Payments**
  - Stripe/Razorpay payment gateway
  - Insurance verification
  - Claim submission
  - Invoice generation

### Phase 5: Advanced Features (2027)
- [ ] **AI Assistant Enhancements**
  - Voice-based interaction (speech-to-text)
  - Multilingual support
  - Personalized responses
  - Proactive health alerts

- [ ] **Telemedicine Expansion**
  - Group consultations
  - Specialist referrals
  - Medical conferences
  - Remote patient monitoring

- [ ] **Blockchain Integration**
  - Immutable medical records
  - Patient data ownership
  - Secure sharing
  - Consent management

---

## 🎯 Project Impact & Achievements

### Problem Solved

**Before MedVision AI**:
- Patients travel hours for basic X-ray screening
- Wait days/weeks for doctor appointments
- Expensive preliminary consultations
- No second opinions easily available
- Medical records scattered across facilities

**After MedVision AI**:
- Instant AI-powered screening from home
- Video consultations within hours
- Affordable telemedicine access
- AI + doctor dual validation
- Centralized medical history

### Target Beneficiaries

1. **Rural Population**: 60% of global population lacks quality healthcare
2. **Busy Professionals**: Save time with video consultations
3. **Elderly Patients**: Avoid travel, easier access
4. **Developing Countries**: Bridge healthcare infrastructure gap
5. **Pandemic Situations**: Safe remote healthcare delivery

### Technical Achievements

- ✅ Full-stack implementation (MERN + Python)
- ✅ AI model integration with 88%+ accuracy
- ✅ Real-time video consultations
- ✅ WebSocket-based chat system
- ✅ Responsive, accessible UI
- ✅ Secure authentication & authorization
- ✅ Role-based dashboards
- ✅ Complete medical history tracking

### Learning Outcomes

**Technical Skills Developed**:
- Deep learning model deployment
- Microservices architecture
- Real-time communication (Socket.IO)
- TypeScript for type safety
- MongoDB schema design
- JWT authentication
- Video calling integration
- Responsive UI design

**Soft Skills Enhanced**:
- Healthcare domain understanding
- User experience design
- Project planning
- Problem-solving
- Documentation

---

## 👨‍💻 Developer Information

**Naveen Arul**  
Full-Stack Developer | AI Enthusiast | Healthcare Technology Innovator

**GitHub**: [@Naveen-Arul](https://github.com/Naveen-Arul)  
**Repository**: [MEDVISION-AI](https://github.com/Naveen-Arul/MEDVISION-AI)

**Project Stats**:
- **Lines of Code**: 15,000+
- **Components**: 50+ React components
- **API Endpoints**: 25+ REST endpoints
- **Database Collections**: 4 main models
- **Development Time**: 3 months
- **Technologies**: 12+ tools & frameworks

---

## 🙏 Acknowledgments & Credits

**Open Source Libraries**:
- **React Team** - Excellent frontend framework
- **TensorFlow** - Deep learning capabilities
- **MongoDB** - Flexible NoSQL database
- **Express.js** - Fast web framework
- **Socket.IO** - Real-time communication
- **shadcn/ui** - Beautiful accessible components
- **Jitsi** - Free video conferencing
- **Tailwind CSS** - Utility-first styling

**Inspiration**:
- Healthcare workers fighting COVID-19
- Rural populations lacking medical access
- Open-source community

**Special Thanks**:
- Medical professionals for domain insights
- Beta testers for valuable feedback
- Open-source contributors

---

## 📞 Support & Contact

**For Technical Issues**:
- Open an issue on [GitHub](https://github.com/Naveen-Arul/MEDVISION-AI/issues)
- Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for installation help
- Review [QUESTIONS.md](QUESTIONS.md) for common queries

**For Collaboration**:
- Fork the repository and submit pull requests
- Suggest features via GitHub Issues
- Star ⭐ the repository if you find it useful

**For Medical/Healthcare Queries**:
- Consult qualified medical professionals
- This is a demonstration project, not a medical device
- Always verify AI predictions with doctors

---

## ⚖️ License & Disclaimer

**License**: MIT License - Free to use, modify, and distribute

**Medical Disclaimer**:
> ⚠️ **Important**: MedVision AI is a demonstration project for educational purposes. It should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions regarding medical conditions. The AI model provides preliminary screening only and requires validation by licensed medical professionals.

**Privacy Notice**:
> This application handles sensitive medical data. In production deployment, ensure HIPAA/GDPR compliance, implement encryption at rest, conduct security audits, and obtain necessary medical certifications.

---

<div align="center">

## 🌟 Built with ❤️ for Better Healthcare Accessibility

**Making quality healthcare accessible to everyone, everywhere.**

---

*"The best time to plant a tree was 20 years ago. The second best time is now."*  
*The best time to improve healthcare access is now.*

---

### ⭐ Star this repository if you believe in accessible healthcare for all!

</div>
