# 🫁 AI-HER: AI-Powered Healthcare Platform

> **A comprehensive MERN stack platform for pneumonia detection, real-time consultations, and health analytics**

## 🎯 Project Overview

AI-HER is a full-stack healthcare platform built with the MERN (MongoDB, Express.js, React, Node.js) stack. It combines artificial intelligence with modern web technologies to provide a comprehensive solution for pneumonia detection, real-time patient-doctor communication, and health analytics.

### Key Features

| Feature | Description |
|--------|-------------|
| 🤖 **AI Pneumonia Detection** | Upload chest X-rays for automated pneumonia detection with confidence scoring |
| 💬 **Real-time Chat** | Instant messaging between patients and doctors with Socket.IO integration |
| 👩‍⚕️ **Video Consultations** | Secure video calls for remote consultations using Jitsi Meet |
| 📊 **Health Analytics** | Track health trends and receive personalized insights |
| 🔐 **Secure Authentication** | JWT-based authentication with role-based access control (Patient/Doctor) |
| 📱 **Responsive UI** | Modern, mobile-friendly interface built with React and TypeScript |

## 🏗️ Architecture

```
ai-her/
├── backend/                    # Node.js + Express API
│   ├── src/models/             # MongoDB schemas
│   ├── src/routes/             # API endpoints
│   ├── src/controllers/        # Business logic
│   ├── src/middleware/         # Authentication & error handling
│   └── server.js               # Express server with Socket.IO
├── frontend/                   # React + TypeScript
│   ├── src/components/         # Reusable UI components
│   ├── src/pages/              # Route pages
│   ├── src/contexts/           # React contexts
│   └── src/lib/                # API client and services
└── uploads/                    # Image storage
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas account
- npm >= 8.x

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ai-her
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create .env file (see Configuration section)
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   # Create .env file (see Configuration section)
   npm run dev
   ```

4. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

## ⚙️ Configuration

### Backend Environment Variables (.env)
```bash
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables (.env)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=AI-HER
VITE_MAX_FILE_SIZE=10485760
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### AI Analysis
- `POST /api/ai/analyze-xray` - Upload and analyze chest X-ray
- `GET /api/ai/analysis-history` - Get user's analysis history
- `GET /api/ai/analysis/:id` - Get specific analysis
- `POST /api/ai/analysis/:id/feedback` - Submit feedback
- `GET /api/ai/analytics` - Get usage analytics

### Chat
- `GET /api/chat` - Get user's chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/:id` - Get chat messages
- `POST /api/chat/:id/messages` - Send message

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password

### Consultations
- `GET /api/consultations` - Get user's consultations
- `POST /api/consultations` - Book new consultation
- `GET /api/consultations/upcoming` - Upcoming consultations
- `GET /api/consultations/:id` - Get consultation details

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 requests/15min)
- Input validation
- CORS protection
- Helmet.js security headers
- File upload restrictions

## 🧪 Testing

### Backend Tests
```bash
# In backend directory
npm test
```

### API Testing
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"patient"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🛠️ Development

### Backend Scripts
- `npm run dev` - Development server with nodemon
- `npm start` - Production server
- `npm test` - Run tests

### Frontend Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## 📁 Project Structure

### Backend Models
- [User](file:///e:/PROJECT/ai-her/backend/src/models/User.js) - User profiles and authentication
- [AIAnalysis](file:///e:/PROJECT/ai-her/backend/src/models/AIAnalysis.js) - AI analysis results and history
- [Chat](file:///e:/PROJECT/ai-her/backend/src/models/Chat.js) - Chat messages and conversations
- [Consultation](file:///e:/PROJECT/ai-her/backend/src/models/Consultation.js) - Appointment scheduling

### Frontend Pages
- Landing - Homepage
- Login/Signup - Authentication
- Dashboard - User dashboard
- Analysis - AI analysis interface
- Chat - Messaging system
- Consultations - Appointment management
- Profile - User settings

### Key Components
- ProtectedRoute - Route protection with authentication
- Navbar - Navigation component
- Patient/Doctor layouts - Role-specific UI
- Real-time components - Chat and video consultation

## 🎯 Future Enhancements

- [ ] Integration with real AI models (TensorFlow.js)
- [ ] Email verification and password reset
- [ ] Push notifications
- [ ] Medical records management
- [ ] Appointment scheduling system
- [ ] Multi-language support
- [ ] Dark/light theme toggle
- [ ] Mobile app development
- [ ] Insurance integration
- [ ] Advanced analytics dashboard

---

**Built to improve healthcare accessibility through technology.**