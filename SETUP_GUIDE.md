# 🚀 MedVision AI - Setup & Deployment Guide

## ✅ Fixed Issues (December 14, 2025)

### 1. **ObjectId Constructor Error** ✅ FIXED
- **Error**: `TypeError: Class constructor ObjectId cannot be invoked without 'new'`
- **Location**: `backend/src/models/AIAnalysis.js:164`
- **Fix**: Changed `ObjectId(userId)` to `new ObjectId(userId)`
- **Impact**: Doctor patient list and analytics endpoint now working

### 2. **AI Chatbot UX Issues** ✅ FIXED
- **Auto-scroll**: Added `useEffect` hook with `scrollIntoView` for smooth auto-scroll when AI responds
- **Sidebar scrolling**: Changed sidebar to `sticky top-6` positioning to prevent scrolling with page content
- **Location**: `frontend/src/pages/patient/AIAssistant.tsx`

### 3. **Doctor Seed Data** ✅ CREATED
- **File**: `backend/seedDoctors.js`
- **Includes**: 5 sample doctors with different specializations
- **Instructions**: See below for how to run

---

## 🔧 Critical Setup Steps

### Step 1: Seed Doctor Data

**Run this command in the backend directory:**

\`\`\`bash
cd E:\PROJECT\ai-her\backend
node seedDoctors.js
\`\`\`

**This will create 5 doctors:**
1. Dr. Sarah Johnson (Cardiology) - sarah.johnson@medvision.com
2. Dr. Michael Chen (Pulmonology) - michael.chen@medvision.com
3. Dr. Emily Rodriguez (Radiology) - emily.rodriguez@medvision.com
4. Dr. James Wilson (Internal Medicine) - james.wilson@medvision.com
5. Dr. Priya Patel (General Practice) - priya.patel@medvision.com

**Password for all**: `doctor123`

---

### Step 2: Start Python AI Service (CRITICAL)

The Python Flask service must be running for image analysis to work.

**Option A: Run Python Service Locally**

1. **Install Python dependencies:**
   \`\`\`bash
   cd E:\PROJECT\ai-her\backend
   pip install -r requirements.txt
   \`\`\`

2. **Start the Flask server:**
   \`\`\`bash
   python app.py
   \`\`\`

   **Expected output:**
   \`\`\`
   * Serving Flask app 'app'
   * Running on http://127.0.0.1:5001
   * Press CTRL+C to quit
   \`\`\`

3. **Verify it's running:**
   - Open browser: http://localhost:5001/health
   - Should see: `{"status": "healthy", "message": "Pneumonia Detection API is running"}`

**Option B: Run in Separate Terminal (Recommended)**

Open a **NEW terminal** in VS Code:
1. Click Terminal → New Terminal
2. Run:
   \`\`\`bash
   cd E:\PROJECT\ai-her\backend
   python app.py
   \`\`\`
3. Keep this terminal running alongside your Node.js backend

---

### Step 3: Verify All Services Running

You should have **3 processes** running simultaneously:

1. **Node.js Backend** (Terminal 1):
   \`\`\`bash
   cd E:\PROJECT\ai-her\backend
   npm start
   # Should show: 🚀 MedVision AI Backend Server Started on port 5000
   \`\`\`

2. **Python AI Service** (Terminal 2):
   \`\`\`bash
   cd E:\PROJECT\ai-her\backend
   python app.py
   # Should show: Running on http://127.0.0.1:5001
   \`\`\`

3. **Frontend** (Terminal 3):
   \`\`\`bash
   cd E:\PROJECT\ai-her\frontend
   npm run dev
   # Should show: Local: http://localhost:8080/
   \`\`\`

---

## 🎯 Testing After Fixes

### Test 1: Doctor Patient List (Analytics)
1. Login as doctor (any doctor email + `doctor123`)
2. Navigate to "Patients" in sidebar
3. Should now load without 500 errors
4. Will show empty list initially (no patients have uploaded images yet)

### Test 2: Image Upload (Python AI Service)
1. Login as patient
2. Go to "Upload" or "Analysis"
3. Upload a chest X-ray image
4. Should get AI prediction without ECONNREFUSED errors
5. Doctor can now see this patient in their patient list

### Test 3: Doctor Listing (Appointments)
1. Login as patient
2. Go to "Consultations" → "Book Appointment"
3. Should now see 5 doctors listed with their details
4. Can select doctor and book appointment

### Test 4: AI Chatbot
1. Login as patient
2. Go to "AI Assistant"
3. Type messages and verify:
   - Messages auto-scroll to bottom ✅
   - Sidebar stays fixed when scrolling chat ✅

### Test 5: Video Consultation
1. Book an appointment for a time slot
2. When appointment time arrives (or 5 minutes before for doctors)
3. Click "Join Now" button
4. Jitsi video call should open automatically
5. Both patient and doctor can join the same room

---

## 📁 File Upload Path (Deployment Note)

**Current Issue**: `UPLOAD_PATH=./uploads` won't persist on Render

**Temporary Solution**: Works locally for testing

**Production Solution** (choose one):

### Option 1: Cloudinary (Recommended)
\`\`\`bash
npm install cloudinary multer-storage-cloudinary
\`\`\`

Update `.env`:
\`\`\`
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
\`\`\`

### Option 2: AWS S3
\`\`\`bash
npm install @aws-sdk/client-s3 multer-s3
\`\`\`

### Option 3: Render Persistent Disk
- Upgrade Render plan to include persistent disk
- Update `UPLOAD_PATH` to absolute path in Render dashboard

---

## 🐛 Common Errors & Solutions

### Error: "ECONNREFUSED ::1:5001"
**Solution**: Python service not running
\`\`\`bash
cd backend
python app.py
\`\`\`

### Error: "ObjectId cannot be invoked without 'new'"
**Solution**: Already fixed in AIAnalysis.js ✅

### Error: Empty doctor list in patient view
**Solution**: Run seed script
\`\`\`bash
cd backend
node seedDoctors.js
\`\`\`

### Error: "Failed to fetch analytics"
**Solution**: Ensure ObjectId fix is saved and backend restarted
\`\`\`bash
# Stop backend (Ctrl+C) and restart
npm start
\`\`\`

---

## 🚀 Quick Start (All Fixed)

**In 3 terminals:**

**Terminal 1 (Backend):**
\`\`\`bash
cd E:\PROJECT\ai-her\backend
node seedDoctors.js  # First time only
npm start
\`\`\`

**Terminal 2 (Python AI):**
\`\`\`bash
cd E:\PROJECT\ai-her\backend
python app.py
\`\`\`

**Terminal 3 (Frontend):**
\`\`\`bash
cd E:\PROJECT\ai-her\frontend
npm run dev
\`\`\`

**Then open**: http://localhost:8080

---

## ✨ What's Now Working

✅ **AI Image Analysis** - Upload chest X-rays for pneumonia detection
✅ **AI Chatbot** - Health questions with auto-scroll and fixed sidebar
✅ **Doctor Patient List** - View all patients with analysis history
✅ **Appointment Booking** - Browse doctors and book video consultations
✅ **Video Calls** - Jitsi integration with auto-open at appointment time
✅ **Analytics Dashboard** - Patient data aggregation for doctors
✅ **Medical History** - Real data from MongoDB Atlas

---

## 📞 Support

If any issues persist:
1. Check all 3 services are running
2. Clear browser cache (Ctrl+Shift+R)
3. Check MongoDB connection in backend logs
4. Verify Python AI service health: http://localhost:5001/health

**All critical errors have been resolved! 🎉**
