# MedVision AI - Deployment Guide

## 🚀 Quick Deployment Status

✅ **Frontend**: https://medvision-ai-gamma.vercel.app/ (Deployed on Vercel)  
🔄 **Backend**: Ready for Render deployment  
⏳ **AI Service**: Pending deployment

## Backend Deployment to Render

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Add deployment configuration"
git push origin deployment-clean
```

### Step 2: Create Render Web Service
1. Go to [Render Dashboard](https://render.com/dashboard)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select branch: `deployment-clean`
5. Root Directory: `backend`
6. Build Command: `npm install`
7. Start Command: `npm start`

### Step 3: Environment Variables on Render
Add these in the Render dashboard Environment tab:

**Required Environment Variables:**
- `NODE_ENV` = `production`
- `PORT` = `5000`
- `MONGODB_URI` = Your MongoDB Atlas connection string
- `JWT_SECRET` = Strong secret key for JWT tokens
- `GROQ_API_KEY` = Your Groq API key
- `JWT_EXPIRES_IN` = `7d`
- `MAX_FILE_SIZE` = `10485760`
- `UPLOAD_PATH` = `./uploads`
- `AI_MODEL_PATH` = `./models/pneumonia_model.h5`
- `AI_CONFIDENCE_THRESHOLD` = `0.5`
- `FRONTEND_URL` = `https://medvision-ai-gamma.vercel.app`
- `ALLOWED_ORIGINS` = `https://medvision-ai-gamma.vercel.app`
- `RATE_LIMIT_WINDOW` = `15`
- `RATE_LIMIT_MAX_REQUESTS` = `100`
- `BCRYPT_SALT_ROUNDS` = `12`
- `LOG_LEVEL` = `info`

You'll provide the actual values during the deployment setup.

### Step 4: Update Frontend Environment Variables
Once backend is deployed to Render:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `medvision-ai-gamma`
3. Go to Settings → Environment Variables
4. Add/Update:
   - `VITE_API_BASE_URL` = Your Render backend URL
   - `VITE_SOCKET_URL` = Your Render backend URL (same as above)
5. Redeploy frontend

## Features Included

### 🏥 Core Medical Features
- **AI Pneumonia Detection**: Upload chest X-rays for AI analysis
- **Real-time Chat**: Doctor-patient communication with Socket.IO
- **Video Consultations**: Jitsi Meet integration
- **Medical Records**: Comprehensive patient data management
- **Appointment Booking**: Schedule consultations

### 🔧 Technical Features  
- **Authentication**: JWT-based secure login for doctors/patients
- **Database**: MongoDB Atlas with realistic seeded data
- **File Upload**: Secure medical image handling
- **Rate Limiting**: API protection
- **CORS**: Configured for production domains
- **Real-time**: Socket.IO for live updates

### 📊 Database Schema
- **Users**: 20 seeded users (5 doctors, 15 patients)
- **Consultations**: Medical appointment system
- **Chats**: Real-time messaging
- **AI Analysis**: Pneumonia detection results

## Testing Checklist

After deployment, test:
- [ ] User registration/login
- [ ] Doctor-patient chat
- [ ] AI pneumonia analysis
- [ ] Video consultation booking
- [ ] Medical records access
- [ ] File upload functionality
- [ ] Real-time notifications

## Security Notes

🔐 **Production Security**:
- JWT secrets are environment-specific
- API keys stored securely in Render
- CORS restricted to production domains
- File upload validation enabled
- Rate limiting active

## Support

If you encounter issues:
1. Check Render deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS configuration
5. Validate MongoDB connection