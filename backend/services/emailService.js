const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

// Create transporter
let transporter = null;

function createTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport(emailConfig);
    }
    return transporter;
}

// Verify email configuration
async function verifyEmailConfig() {
    try {
        const transport = createTransporter();
        await transport.verify();
        console.log('✅ Email configuration verified');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
}

// Generate reminder email HTML template
function generateReminderEmailHTML(reminder) {
    const { problem_title, problem_url, difficulty, reminder_count } = reminder;
    
    const difficultyColors = {
        'Easy': '#00b8a3',
        'Medium': '#ffa116', 
        'Hard': '#ff375f'
    };
    
    const difficultyColor = difficultyColors[difficulty] || '#6c757d';
    
    const reminderMessages = [
        'Time to revisit this problem! 🧠',
        'Let\'s solve this again! 💪',
        'Ready for another round? 🚀',
        'Final reminder - master this problem! 🏆'
    ];
    
    const message = reminderMessages[reminder_count] || reminderMessages[0];
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LeetCode Reminder</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .header p {
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
            }
            .content {
                padding: 30px 20px;
            }
            .problem-card {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid ${difficultyColor};
            }
            .problem-title {
                font-size: 20px;
                font-weight: 600;
                color: #1a202c;
                margin: 0 0 10px 0;
            }
            .difficulty-badge {
                display: inline-block;
                background-color: ${difficultyColor};
                color: white;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 500;
                text-transform: uppercase;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
            }
            .cta-button:hover {
                background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
            }
            .progress {
                background: #e9ecef;
                border-radius: 10px;
                height: 8px;
                margin: 20px 0;
                overflow: hidden;
            }
            .progress-bar {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                height: 100%;
                width: ${((reminder_count + 1) / 4) * 100}%;
                transition: width 0.3s ease;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .tips {
                background: #e3f2fd;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                border-left: 4px solid #2196f3;
            }
            .tips h3 {
                margin: 0 0 8px 0;
                color: #1976d2;
                font-size: 16px;
            }
            .tips ul {
                margin: 0;
                padding-left: 20px;
            }
            .tips li {
                margin: 4px 0;
                color: #424242;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧠 LeetCode Reminder</h1>
                <p>${message}</p>
            </div>
            
            <div class="content">
                <p>Hi there! 👋</p>
                <p>It's time to practice this LeetCode problem again. Spaced repetition is key to mastering algorithmic thinking!</p>
                
                <div class="problem-card">
                    <div class="problem-title">${problem_title}</div>
                    <div class="difficulty-badge">${difficulty}</div>
                </div>
                
                <div style="text-align: center;">
                    <a href="${problem_url}" class="cta-button">Solve Problem Now →</a>
                </div>
                
                <div class="progress">
                    <div class="progress-bar"></div>
                </div>
                <p style="text-align: center; color: #6c757d; font-size: 14px;">
                    Reminder ${reminder_count + 1} of 4
                </p>
                
                <div class="tips">
                    <h3>💡 Study Tips</h3>
                    <ul>
                        <li>Try to solve it without looking at your previous solution first</li>
                        <li>Think about different approaches and their time/space complexity</li>
                        <li>Explain your solution out loud or write it down</li>
                        <li>Consider edge cases and test with different inputs</li>
                    </ul>
                </div>
                
                <p>Keep up the great work! Consistent practice is the path to mastery. 🚀</p>
                
                <p style="color: #6c757d; font-size: 14px;">
                    <em>This is an automated reminder from your LeetCode Reminder extension.</em>
                </p>
            </div>
            
            <div class="footer">
                <p>Happy coding! 💻</p>
                <p style="margin: 5px 0;">LeetCode Reminder Extension</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Generate plain text version
function generateReminderEmailText(reminder) {
    const { problem_title, problem_url, difficulty, reminder_count } = reminder;
    
    return `
LeetCode Reminder 🧠

Hi there! 👋

It's time to practice this LeetCode problem again. Spaced repetition is key to mastering algorithmic thinking!

Problem: ${problem_title}
Difficulty: ${difficulty}
URL: ${problem_url}

Reminder ${reminder_count + 1} of 4

Study Tips:
- Try to solve it without looking at your previous solution first
- Think about different approaches and their time/space complexity  
- Explain your solution out loud or write it down
- Consider edge cases and test with different inputs

Keep up the great work! Consistent practice is the path to mastery. 🚀

Happy coding! 💻
LeetCode Reminder Extension

---
This is an automated reminder from your LeetCode Reminder extension.
    `.trim();
}

// Send reminder email
async function sendReminderEmail(reminder) {
    try {
        const transport = createTransporter();
        
        if (!transport) {
            throw new Error('Email transporter not configured');
        }
        
        const { email, problem_title } = reminder;
        
        const mailOptions = {
            from: `"LeetCode Reminder" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: `🧠 Time to practice: ${problem_title}`,
            text: generateReminderEmailText(reminder),
            html: generateReminderEmailHTML(reminder)
        };
        
        const result = await transport.sendMail(mailOptions);
        
        console.log(`✅ Reminder email sent to ${email} for problem: ${problem_title}`);
        console.log('Message ID:', result.messageId);
        
        return {
            success: true,
            messageId: result.messageId,
            email: email
        };
        
    } catch (error) {
        console.error('❌ Error sending reminder email:', error);
        return {
            success: false,
            error: error.message,
            email: reminder.email
        };
    }
}

// Generate confirmation email HTML template
function generateConfirmationEmailHTML(reminder) {
    const { problem_title, problem_url, difficulty } = reminder;
    
    const difficultyColors = {
        'Easy': '#00b8a3',
        'Medium': '#ffa116', 
        'Hard': '#ff375f'
    };
    
    const difficultyColor = difficultyColors[difficulty] || '#6c757d';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LeetCode Reminder Confirmed</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .header p {
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
            }
            .content {
                padding: 30px 20px;
            }
            .problem-card {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid ${difficultyColor};
            }
            .problem-title {
                font-size: 20px;
                font-weight: 600;
                color: #1a202c;
                margin: 0 0 10px 0;
            }
            .difficulty-badge {
                display: inline-block;
                background-color: ${difficultyColor};
                color: white;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 500;
                text-transform: uppercase;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
            }
            .schedule-box {
                background: #e3f2fd;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #2196f3;
            }
            .schedule-box h3 {
                margin: 0 0 10px 0;
                color: #1976d2;
                font-size: 18px;
            }
            .schedule-item {
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .schedule-item:last-child {
                border-bottom: none;
            }
            .checkmark {
                color: #10b981;
                font-size: 20px;
                font-weight: bold;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Reminder Set!</h1>
                <p>Your LeetCode reminder has been confirmed</p>
            </div>
            
            <div class="content">
                <p>Great! 🎉 You've successfully set up a reminder for this LeetCode problem:</p>
                
                <div class="problem-card">
                    <div class="problem-title">${problem_title}</div>
                    <div class="difficulty-badge">${difficulty}</div>
                </div>
                
                <div style="text-align: center;">
                    <a href="${problem_url}" class="cta-button">View Problem →</a>
                </div>
                
                <div class="schedule-box">
                    <h3>📅 Your Reminder Schedule</h3>
                    <div class="schedule-item">
                        <span>First reminder</span>
                        <span><strong>3 days from now</strong></span>
                    </div>
                    <div class="schedule-item">
                        <span>Second reminder</span>
                        <span><strong>6 days later</strong></span>
                    </div>
                    <div class="schedule-item">
                        <span>Third reminder</span>
                        <span><strong>12 days later</strong></span>
                    </div>
                    <div class="schedule-item">
                        <span>Final reminder</span>
                        <span><strong>24 days later</strong></span>
                    </div>
                </div>
                
                <p><span class="checkmark">✓</span> <strong>Spaced repetition</strong> schedule optimized for learning retention</p>
                <p><span class="checkmark">✓</span> <strong>Automatic reminders</strong> will be sent to your email</p>
                <p><span class="checkmark">✓</span> <strong>Beautiful emails</strong> with direct links to solve the problem</p>
                
                <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                    <em>This confirmation email was sent immediately to confirm your reminder setup.</em>
                </p>
            </div>
            
            <div class="footer">
                <p>Happy coding! 🧠✨</p>
                <p>LeetCode Reminder Extension</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Generate confirmation email text version
function generateConfirmationEmailText(reminder) {
    const { problem_title, problem_url, difficulty } = reminder;
    
    return `
✅ LeetCode Reminder Confirmed!

Great! You've successfully set up a reminder for this LeetCode problem:

Problem: ${problem_title}
Difficulty: ${difficulty}
URL: ${problem_url}

📅 Your Reminder Schedule:
• First reminder: 3 days from now
• Second reminder: 6 days later  
• Third reminder: 12 days later
• Final reminder: 24 days later

✓ Spaced repetition schedule optimized for learning retention
✓ Automatic reminders will be sent to your email
✓ Beautiful emails with direct links to solve the problem

Happy coding! 🧠✨
LeetCode Reminder Extension

---
This confirmation email was sent immediately to confirm your reminder setup.
    `.trim();
}

// Send confirmation email
async function sendConfirmationEmail(reminder) {
    try {
        const transport = createTransporter();
        
        if (!transport) {
            throw new Error('Email transporter not configured');
        }
        
        const { email, problem_title } = reminder;
        
        const mailOptions = {
            from: `"LeetCode Reminder" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: `✅ Reminder confirmed for: ${problem_title}`,
            text: generateConfirmationEmailText(reminder),
            html: generateConfirmationEmailHTML(reminder)
        };
        
        const result = await transport.sendMail(mailOptions);
        
        console.log(`✅ Confirmation email sent to ${email} for problem: ${problem_title}`);
        console.log('Message ID:', result.messageId);
        
        return {
            success: true,
            messageId: result.messageId,
            email: email
        };
        
    } catch (error) {
        console.error('❌ Error sending confirmation email:', error);
        return {
            success: false,
            error: error.message,
            email: reminder.email
        };
    }
}

// Send test email
async function sendTestEmail(to) {
    try {
        const transport = createTransporter();
        
        const testReminder = {
            email: to,
            problem_title: 'Two Sum',
            problem_url: 'https://leetcode.com/problems/two-sum/',
            difficulty: 'Easy',
            reminder_count: 0
        };
        
        const result = await sendReminderEmail(testReminder);
        return result;
        
    } catch (error) {
        console.error('Error sending test email:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    verifyEmailConfig,
    sendReminderEmail,
    sendConfirmationEmail,
    sendTestEmail,
    createTransporter
}; 