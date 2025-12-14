# 🏥 MedVision AI - Intelligent Healthcare Platform

## 📋 Project Overview

**MedVision AI** is a comprehensive healthcare platform that combines AI-powered medical image analysis with real-time doctor-patient consultations. The system enables patients to upload medical images (chest X-rays) for instant AI analysis, chat with doctors, and conduct video consultations, all within a secure and user-friendly interface.

### 🎯 Key Features

- **AI-Powered Pneumonia Detection**: Upload chest X-ray images for instant AI analysis with confidence scores
- **Real-time Chat System**: Patient-doctor and AI chatbot interactions
- **Video Consultations**: Integrated video calling using Jitsi Meet
- **Appointment Management**: Schedule, manage, and track consultations
- **Medical History**: Track AI analysis results and consultation records
- **Role-Based Access**: Separate interfaces for patients and doctors
- **Responsive UI**: Modern, accessible interface built with React and shadcn/ui

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

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Naveen-Arul/MEDVISION-AI.git
cd MEDVISION-AI
```

2. **Backend Setup**
```bash
cd backend
npm install

# Seed doctor data
node seedDoctors.js
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Python AI Service**
```bash
cd backend
pip install flask tensorflow pillow werkzeug
```

### Environment Variables

Create `.env` files:

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-her-db
JWT_SECRET=your_jwt_secret
PYTHON_SERVICE_URL=http://localhost:5001
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Application

**Terminal 1 - Backend**:
```bash
cd backend
npm start
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - AI Service**:
```bash
cd backend
python app.py
```

Access the application at `http://localhost:8080`

---

## 👥 Default Accounts

### Doctors (Password: `123456`)
1. **Dr. Sarah Johnson** - Cardiology - `sarah.johnson@medvision.com`
2. **Dr. Michael Chen** - Pulmonology - `michael.chen@medvision.com`
3. **Dr. Emily Rodriguez** - Radiology - `emily.rodriguez@medvision.com`
4. **Dr. James Wilson** - Internal Medicine - `james.wilson@medvision.com`
5. **Dr. Priya Patel** - General Practice - `priya.patel@medvision.com`

### Test Patient
Create your own account via the signup page.

---

## 📁 Project Structure

```
MEDVISION-AI/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/       # Auth & error handling
│   │   ├── models/           # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── Consultation.js
│   │   │   ├── Chat.js
│   │   │   └── AIAnalysis.js
│   │   ├── routes/           # API endpoints
│   │   │   ├── auth.js
│   │   │   ├── consultations.js
│   │   │   ├── chat.js
│   │   │   └── ai.js
│   │   └── utils/
│   ├── uploads/              # Uploaded medical images
│   ├── app.py                # Python AI service
│   ├── pneumonia_model.h5    # Trained CNN model
│   ├── server.js             # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── patient/      # Patient-specific components
│   │   │   └── ...
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── pages/            # Route pages
│   │   │   ├── patient/
│   │   │   │   ├── AIAssistant.tsx
│   │   │   │   ├── MyAppointments.tsx
│   │   │   │   ├── History.tsx
│   │   │   │   └── PatientConsultation.tsx
│   │   │   └── doctor/
│   │   │       ├── DoctorAppointments.tsx
│   │   │       └── DoctorConsultation.tsx
│   │   ├── lib/              # Utilities & services
│   │   │   ├── api.ts
│   │   │   └── services.ts
│   │   └── App.tsx
│   └── package.json
│
├── README.md
├── SETUP_GUIDE.md
└── DEPLOYMENT.md
```

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Patient/Doctor/Admin roles
- **Input Validation**: express-validator on all endpoints
- **CORS Protection**: Configured CORS policies
- **File Upload Validation**: Type and size restrictions
- **Protected Routes**: Frontend route guards

---

## 🎨 UI/UX Features

- **Responsive Design**: Mobile, tablet, and desktop support
- **Dark Mode Ready**: Tailwind CSS theming
- **Accessibility**: ARIA labels and keyboard navigation
- **Real-time Updates**: Socket.IO for instant messaging
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success/error feedback

---

## 📈 Future Enhancements

- [ ] Multi-disease detection (COVID-19, Tuberculosis)
- [ ] Patient health metrics tracking
- [ ] Prescription management system
- [ ] Integration with pharmacy APIs
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Email/SMS notifications
- [ ] Multi-language support
- [ ] Insurance claim integration
- [ ] Telemedicine recording and playback

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Developer

**Naveen Arul**  
GitHub: [@Naveen-Arul](https://github.com/Naveen-Arul)

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@medvision-ai.com (if available)

---

## 🙏 Acknowledgments

- TensorFlow team for the deep learning framework
- shadcn for the beautiful UI components
- Jitsi team for the video conferencing solution
- MongoDB team for the excellent database platform

---

**Built with ❤️ for better healthcare accessibility**
