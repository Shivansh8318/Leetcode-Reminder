# 🧠 LeetCode Reminder Chrome Extension

A Chrome extension that adds a "Remind Me" button to LeetCode problems, automatically sending email reminders to solve problems again after 3, 6, 12, and 24 days using spaced repetition for better learning.

## ✨ Features

- **📌 One-Click Reminders**: Add a "Remind Me" button to any LeetCode problem page
- **📧 Automated Email Reminders**: Receive beautiful HTML emails with problem details
- **⏰ Spaced Repetition**: Reminders sent after 3, 6, 12, and 24 days for optimal learning
- **📊 Progress Tracking**: Track your reminder history and statistics
- **🎨 Beautiful UI**: Modern, responsive design matching LeetCode's style
- **🔒 Secure**: Built with security best practices and rate limiting
- **☁️ Cloud Backend**: Deployed on Railway for reliable 24/7 operation

## 🏗️ Architecture

- **Chrome Extension**: Manifest V3 extension with content scripts (serves as the frontend)
- **Backend**: Node.js/Express API deployed on Railway with PostgreSQL database
- **Email Service**: Nodemailer with Gmail SMTP
- **Scheduler**: Cron-based email reminder system running in the cloud

## 📁 Project Structure

```
leetcodereminder2/
├── 📄 manifest.json          # Chrome extension manifest
├── 📄 content.js             # Content script for LeetCode pages
├── 📄 content.css            # Styles for the remind button
├── 📄 popup.html             # Extension popup interface
├── 📄 popup.js               # Popup functionality
├── 📄 background.js          # Background service worker
└── 📁 backend/               # Node.js backend (deployed on Railway)
    ├── 📄 package.json
    ├── 📄 server.js
    ├── 📄 env.example
    ├── 📁 config/
    │   └── 📄 database.js
    ├── 📁 routes/
    │   ├── 📄 reminders.js
    │   └── 📄 admin.js
    ├── 📁 services/
    │   ├── 📄 emailService.js
    │   └── 📄 scheduler.js
    └── 📁 scripts/
        └── 📄 init-db.js
```

## 🚀 Setup Instructions

### Prerequisites

- Chrome browser for using the extension
- **Backend is already deployed on Railway** - no local setup required!

### 1. Load Chrome Extension

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the root project directory (`leetcodereminder2`)
6. The extension should now appear in your extensions list

### 2. Test the Extension

1. Visit any LeetCode problem page (e.g., https://leetcode.com/problems/two-sum/)
2. Look for the "Remind Me" button near the problem title
3. Click the button and enter your email when prompted
4. You should receive an instant confirmation email
5. Scheduled reminders will be sent after 3, 6, 12, and 24 days

## ☁️ Backend Deployment

The backend is deployed and running on Railway at:
**`https://leetcode-reminder-production.up.railway.app`**

### Features:
- ✅ 24/7 uptime
- ✅ PostgreSQL database with Neon DB
- ✅ Automated email reminders
- ✅ Cron scheduler running hourly
- ✅ Rate limiting and security middleware
- ✅ Health monitoring

### API Base URL:
`https://leetcode-reminder-production.up.railway.app/api`

## 🛠️ API Endpoints

The backend API is accessible at `https://leetcode-reminder-production.up.railway.app/api`:

### Reminders

- `POST /api/reminders` - Create a new reminder
- `GET /api/reminders/user/:email` - Get user's reminders
- `PUT /api/reminders/:id/complete` - Mark reminder as completed
- `DELETE /api/reminders/:id` - Delete a reminder
- `GET /api/reminders/stats/:email` - Get reminder statistics

### System

- `GET /api/health` - Health check
- `GET /api/test` - Test endpoint

### Admin (for monitoring)

- `GET /api/admin/reminders` - View all reminders
- `GET /api/admin/email-logs` - View email delivery logs
- `POST /api/admin/test-email` - Send test email

## 📧 Email System

The system is configured with Gmail SMTP and sends two types of emails:

### 1. Instant Confirmation Email
- **Green header design**
- Sent immediately when you click "Remind Me"
- Confirms the reminder was successfully created

### 2. Scheduled Reminder Emails
- **Purple header design**
- Sent according to spaced repetition schedule
- Includes problem details and direct link

## 📊 Database Schema

### Reminders Table
```sql
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    problem_id VARCHAR(255) NOT NULL,
    problem_title VARCHAR(500) NOT NULL,
    problem_url VARCHAR(500) NOT NULL,
    difficulty VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_count INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(email, problem_id)
);
```

### Reminder Logs Table
```sql
CREATE TABLE reminder_logs (
    id SERIAL PRIMARY KEY,
    reminder_id INTEGER REFERENCES reminders(id) ON DELETE CASCADE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_status VARCHAR(50) DEFAULT 'sent',
    next_reminder_days INTEGER,
    error_message TEXT
);
```

## ⏰ Reminder Schedule

The system sends reminders using spaced repetition:

1. **First reminder**: 3 days after creating the reminder
2. **Second reminder**: 6 days after the first reminder  
3. **Third reminder**: 12 days after the second reminder
4. **Final reminder**: 24 days after the third reminder

After all 4 reminders are sent, the reminder cycle is complete.

## 🔧 Local Development (Optional)

If you want to run the backend locally for development:

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Gmail account for SMTP

### Setup
```bash
# Install backend dependencies
cd backend
npm install

# Configure environment variables
cp env.example .env
# Edit .env with your email credentials

# Start development server
npm run dev
```

## 🐛 Troubleshooting

### Extension Not Loading
- Check that all files are in the correct directory structure
- Verify manifest.json is valid
- Check browser console for errors

### Reminder Button Not Appearing
- Check if you're on a LeetCode problem page (URL contains `/problems/`)
- Open browser console to see any JavaScript errors
- Refresh the page and wait a few seconds for the button to inject

### Email Not Received
- Check your spam/junk folder
- Verify you entered the correct email address
- Check the browser console for any error messages
- The backend automatically handles Gmail delivery

### Backend Connection Issues
- The extension should automatically connect to the Railway backend
- If you see connection errors, check your internet connection
- The extension popup will show connection status

### Extension Updates
If you make changes to the extension:
1. Go to `chrome://extensions/`
2. Click the refresh button on the LeetCode Reminder extension
3. Reload any open LeetCode pages

## 🎯 Usage Tips

1. **Best Practices:**
   - Use a dedicated email for reminders to keep them organized
   - Create reminders for problems you found challenging
   - Don't create multiple reminders for the same problem

2. **Email Organization:**
   - Set up a Gmail filter to automatically label reminder emails
   - Create a folder for "LeetCode Reminders"

3. **Learning Strategy:**
   - Review the problem again when you receive each reminder
   - Try to solve it without looking at your previous solution
   - Focus on understanding the underlying patterns

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with the deployed backend
5. Submit a pull request

## 🙏 Credits

Built with:
- [Express.js](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://postgresql.org/) - Database
- [Railway](https://railway.app/) - Cloud deployment platform
- [Neon DB](https://neon.tech/) - PostgreSQL hosting
- [Nodemailer](https://nodemailer.com/) - Email service
- [node-cron](https://github.com/node-cron/node-cron) - Scheduling
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Browser extension platform

---

**🚀 Ready to use!** The backend is deployed and running 24/7. Just install the Chrome extension and start creating reminders on LeetCode! 