# 🚀 Quick Start Guide

Get your LeetCode Reminder extension running in 5 minutes!

## 📋 Prerequisites
- Node.js installed
- Gmail account (for sending emails)
- Chrome browser

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install
```

### 2. Configure Email (Gmail)
Create `backend/.env` file:
```env
DATABASE_URL=postgresql://neondb_owner:npg_fMCp4jxK5dRG@ep-bitter-brook-ad5z6wcu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3001
NODE_ENV=development

# Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Gmail App Password Setup:**
1. Google Account → Security → 2-Step Verification → App passwords
2. Generate password for "Mail"
3. Use this password in `EMAIL_PASS`

### 3. Start Backend
```bash
cd backend
npm run dev
```

Wait for:
- ✅ Database connected successfully
- ✅ Database schema initialized
- ✅ Reminder scheduler started
- 🚀 Server running on http://localhost:3001

### 4. Load Chrome Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this project folder
5. Extension loaded! 🎉

### 5. Test It Out
1. Visit: https://leetcode.com/problems/two-sum/
2. Look for "Remind Me" button
3. Click it and enter your email
4. Check backend logs for confirmation!

## 🧪 Test Email System

Test if emails work:
```bash
# Test endpoint
curl -X POST http://localhost:3001/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

## 🔧 Admin Dashboard URLs

While backend is running, check these URLs:

- **Health Check**: http://localhost:3001/api/health
- **Test Backend**: http://localhost:3001/api/test  
- **Email Config**: http://localhost:3001/api/admin/verify-email
- **Scheduler Status**: http://localhost:3001/api/admin/scheduler
- **System Stats**: http://localhost:3001/api/admin/stats

## 🐛 Common Issues

**Backend won't start:**
- Check if port 3001 is free
- Verify .env file exists with correct email settings

**Extension not loading:**
- Make sure you selected the root project folder
- Check manifest.json is in the root directory

**Remind button missing:**
- Ensure you're on a LeetCode problem page (not just leetcode.com)
- Check browser console for errors
- Verify backend is running

**Emails not sending:**
- Check Gmail App Password is correct
- Verify 2FA is enabled on Google account
- Test with admin endpoint first

## 🎯 What's Next?

- Visit LeetCode problems and set reminders
- Check your email for beautiful reminder notifications
- Reminders will be sent after 3, 6, 12, and 24 days
- Use admin endpoints to monitor the system

**Happy coding! 🧠✨** 