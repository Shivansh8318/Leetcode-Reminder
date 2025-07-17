const cron = require('node-cron');
const { query } = require('../config/database');
const { sendReminderEmail } = require('./emailService');

// Reminder intervals in days (matching the API)
const REMINDER_INTERVALS = [3, 6, 12, 24];

// Track scheduler status
let isSchedulerRunning = false;
let schedulerTask = null;

// Process pending reminders
async function processPendingReminders() {
    if (isSchedulerRunning) {
        console.log('⏳ Scheduler already running, skipping...');
        return;
    }
    
    isSchedulerRunning = true;
    console.log('🔄 Processing pending reminders...');
    
    try {
        // Get all pending reminders
        const result = await query(
            `SELECT * FROM reminders 
             WHERE next_reminder_date <= NOW() 
             AND is_completed = false 
             AND reminder_count < $1
             ORDER BY next_reminder_date ASC`,
            [REMINDER_INTERVALS.length]
        );
        
        const pendingReminders = result.rows;
        
        if (pendingReminders.length === 0) {
            console.log('✅ No pending reminders to process');
            return;
        }
        
        console.log(`📧 Found ${pendingReminders.length} pending reminder(s)`);
        
        // Process each reminder
        for (const reminder of pendingReminders) {
            await processIndividualReminder(reminder);
            
            // Add a small delay between emails to avoid overwhelming the SMTP server
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`✅ Finished processing ${pendingReminders.length} reminder(s)`);
        
    } catch (error) {
        console.error('❌ Error processing pending reminders:', error);
    } finally {
        isSchedulerRunning = false;
    }
}

// Process individual reminder
async function processIndividualReminder(reminder) {
    try {
        console.log(`📧 Sending reminder for: ${reminder.problem_title} to ${reminder.email}`);
        
        // Send email
        const emailResult = await sendReminderEmail(reminder);
        
        // Update reminder status in database
        await updateReminderAfterSending(reminder.id, emailResult);
        
        if (emailResult.success) {
            console.log(`✅ Successfully sent reminder for: ${reminder.problem_title}`);
        } else {
            console.error(`❌ Failed to send reminder for: ${reminder.problem_title}`, emailResult.error);
        }
        
    } catch (error) {
        console.error(`❌ Error processing reminder ${reminder.id}:`, error);
        
        // Still update the database to record the failure
        await updateReminderAfterSending(reminder.id, {
            success: false,
            error: error.message
        });
    }
}

// Update reminder after sending email
async function updateReminderAfterSending(reminderId, emailResult) {
    try {
        // Get current reminder data
        const reminderResult = await query(
            'SELECT * FROM reminders WHERE id = $1',
            [reminderId]
        );
        
        if (reminderResult.rows.length === 0) {
            throw new Error('Reminder not found');
        }
        
        const reminder = reminderResult.rows[0];
        const nextCount = reminder.reminder_count + 1;
        
        let nextReminderDate = null;
        
        // Calculate next reminder date if there are more intervals
        if (nextCount < REMINDER_INTERVALS.length) {
            nextReminderDate = new Date();
            nextReminderDate.setDate(nextReminderDate.getDate() + REMINDER_INTERVALS[nextCount]);
        }
        
        // Begin transaction
        await query('BEGIN');
        
        try {
            // Update reminder
            await query(
                `UPDATE reminders 
                 SET reminder_count = $1, next_reminder_date = $2, updated_at = NOW()
                 WHERE id = $3`,
                [nextCount, nextReminderDate, reminderId]
            );
            
            // Log the email attempt
            await query(
                `INSERT INTO reminder_logs 
                 (reminder_id, email_status, next_reminder_days, error_message)
                 VALUES ($1, $2, $3, $4)`,
                [
                    reminderId,
                    emailResult.success ? 'sent' : 'failed',
                    nextCount < REMINDER_INTERVALS.length ? REMINDER_INTERVALS[nextCount] : null,
                    emailResult.error || null
                ]
            );
            
            await query('COMMIT');
            
        } catch (dbError) {
            await query('ROLLBACK');
            throw dbError;
        }
        
    } catch (error) {
        console.error('Error updating reminder after sending:', error);
        throw error;
    }
}

// Start the reminder scheduler
function startReminderScheduler() {
    if (schedulerTask) {
        console.log('⚠️  Scheduler already running');
        return;
    }
    
    // Run every hour at minute 0
    // In production, you might want to run this more frequently (every 15-30 minutes)
    schedulerTask = cron.schedule('0 * * * *', async () => {
        console.log('⏰ Scheduler triggered at:', new Date().toISOString());
        await processPendingReminders();
    }, {
        scheduled: true,
        timezone: 'UTC'
    });
    
    console.log('✅ Reminder scheduler started (runs every hour)');
    
    // Also run once immediately for testing
    setTimeout(async () => {
        console.log('🚀 Running initial reminder check...');
        await processPendingReminders();
    }, 5000); // Wait 5 seconds after startup
}

// Stop the reminder scheduler
function stopReminderScheduler() {
    if (schedulerTask) {
        schedulerTask.destroy();
        schedulerTask = null;
        console.log('🛑 Reminder scheduler stopped');
    }
}

// Get scheduler status
function getSchedulerStatus() {
    return {
        isRunning: schedulerTask !== null,
        isProcessing: isSchedulerRunning,
        nextRun: schedulerTask ? 'Every hour at minute 0' : null
    };
}

// Manual trigger for testing
async function triggerManualCheck() {
    console.log('🔧 Manual reminder check triggered');
    await processPendingReminders();
}

// Get reminder statistics
async function getReminderStats() {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_reminders,
                COUNT(CASE WHEN is_completed = false THEN 1 END) as active_reminders,
                COUNT(CASE WHEN next_reminder_date <= NOW() AND is_completed = false THEN 1 END) as pending_reminders,
                COUNT(CASE WHEN reminder_count >= $1 THEN 1 END) as completed_cycles
            FROM reminders
        `, [REMINDER_INTERVALS.length]);
        
        const emailStats = await query(`
            SELECT 
                COUNT(*) as total_emails_sent,
                COUNT(CASE WHEN email_status = 'sent' THEN 1 END) as successful_emails,
                COUNT(CASE WHEN email_status = 'failed' THEN 1 END) as failed_emails
            FROM reminder_logs
        `);
        
        return {
            reminders: stats.rows[0],
            emails: emailStats.rows[0],
            intervals: REMINDER_INTERVALS
        };
        
    } catch (error) {
        console.error('Error getting reminder stats:', error);
        throw error;
    }
}

module.exports = {
    startReminderScheduler,
    stopReminderScheduler,
    getSchedulerStatus,
    triggerManualCheck,
    processPendingReminders,
    getReminderStats,
    REMINDER_INTERVALS
}; 