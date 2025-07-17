# 🧠 LeetCode Reminder Chrome Extension

A Chrome extension that adds a "Remind Me" button to LeetCode problems, automatically sending email reminders to solve problems again after 3, 6, 12, and 24 days using spaced repetition for better learning.

## ✨ Features

- **📌 One-Click Reminders**: Add a "Remind Me" button to any LeetCode problem page
- **📧 Automated Email Reminders**: Receive beautiful HTML emails with problem details
- **⏰ Spaced Repetition**: Reminders sent after 3, 6, 12, and 24 days for optimal learning
- **📊 Progress Tracking**: Track your reminder history and statistics
- **🎨 Beautiful UI**: Modern, responsive design matching LeetCode's style
- **🔒 Secure**: Built with security best practices and rate limiting

## 🏗️ Architecture

- **Chrome Extension**: Manifest V3 extension with content scripts (serves as the frontend)
- **Backend**: Node.js/Express API with PostgreSQL database
- **Email Service**: Nodemailer with customizable SMTP settings
- **Scheduler**: Cron-based email reminder system

## 📁 Project Structure

```
leetcodereminder2/
├── 📄 manifest.json          # Chrome extension manifest
├── 📄 content.js             # Content script for LeetCode pages
├── 📄 content.css            # Styles for the remind button
├── 📄 popup.html             # Extension popup interface
├── 📄 popup.js               # Popup functionality
├── 📄 background.js          # Background service worker
└── 📁 backend/               # Node.js backend (separate package)
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

- Node.js (v16 or higher)
- PostgreSQL database (we're using Neon DB)
- Gmail account or SMTP server for sending emails
- Chrome browser for testing the extension

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory using the example:

```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your email configuration:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Use App Password for Gmail
EMAIL_FROM=your-email@gmail.com
```

**For Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate an App Password: Google Account → Security → App passwords
3. Use the App Password (not your regular password) in `EMAIL_PASS`

### 3. Initialize Database

The database schema will be automatically created when you start the server, or you can initialize it manually:

```bash
cd backend
npm run init-db
```

### 4. Start the Backend Server

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001` and you should see:
- ✅ Database connected successfully
- ✅ Database schema initialized  
- ✅ Reminder scheduler started
- 🚀 Server running on http://localhost:3001



### 5. Load Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the root project directory (`leetcodereminder2`)
5. The extension should now appear in your extensions list

### 6. Test the Extension

1. Visit any LeetCode problem page (e.g., https://leetcode.com/problems/two-sum/)
2. Look for the "Remind Me" button near the problem title
3. Click the button and enter your email when prompted
4. Check the browser console and backend logs for confirmation

## 📧 Email Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use App Password** in your `.env` file

### Other Email Providers

Update the SMTP settings in your `.env` file:

```env
# For Outlook/Hotmail
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587

# For Yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587

# For custom SMTP server
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
```

## 🛠️ API Endpoints

### Reminders

- `POST /api/reminders` - Create a new reminder
- `GET /api/reminders/user/:email` - Get user's reminders
- `PUT /api/reminders/:id/complete` - Mark reminder as completed
- `DELETE /api/reminders/:id` - Delete a reminder
- `GET /api/reminders/stats/:email` - Get reminder statistics

### System

- `GET /api/health` - Health check
- `GET /api/test` - Test endpoint

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

## 🔧 Development

### Backend Development

```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Database Operations

```bash
cd backend
npm run init-db  # Initialize database schema
```

## 🐛 Troubleshooting

### Extension Not Loading
- Check that all files are in the correct directory structure
- Verify manifest.json is valid
- Check browser console for errors

### Backend Connection Issues
- Verify the DATABASE_URL is correct
- Check if the database server is running
- Ensure firewall allows connections on port 3001

### Email Not Sending
- Verify email credentials in .env file
- Check if 2FA and App Password are set up for Gmail
- Test email configuration with the test endpoint

### Reminder Button Not Appearing
- Check if you're on a LeetCode problem page
- Open browser console to see any JavaScript errors
- Verify the backend is running and accessible

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🙏 Credits

Built with:
- [Express.js](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://postgresql.org/) - Database
- [Nodemailer](https://nodemailer.com/) - Email service
- [node-cron](https://github.com/node-cron/node-cron) - Scheduling
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Browser extension platform

---

Happy coding and remember: consistent practice makes perfect! 🚀 