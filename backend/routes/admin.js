const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { sendTestEmail, sendConfirmationEmail, verifyEmailConfig } = require('../services/emailService');
const { getSchedulerStatus, triggerManualCheck, getReminderStats } = require('../services/scheduler');

// Test email endpoint
router.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const result = await sendTestEmail(email);
        
        if (result.success) {
            res.json({
                message: 'Test email sent successfully',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                error: 'Failed to send test email',
                details: result.error
            });
        }
        
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test confirmation email endpoint
router.post('/test-confirmation', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const testReminder = {
            email: email,
            problem_title: 'Two Sum (Test)',
            problem_url: 'https://leetcode.com/problems/two-sum/',
            difficulty: 'Easy'
        };
        
        const result = await sendConfirmationEmail(testReminder);
        
        if (result.success) {
            res.json({
                message: 'Test confirmation email sent successfully',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                error: 'Failed to send test confirmation email',
                details: result.error
            });
        }
        
    } catch (error) {
        console.error('Error sending test confirmation email:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify email configuration
router.get('/verify-email', async (req, res) => {
    try {
        const isValid = await verifyEmailConfig();
        res.json({
            isValid,
            message: isValid ? 'Email configuration is valid' : 'Email configuration has issues'
        });
    } catch (error) {
        res.status(500).json({
            isValid: false,
            error: error.message
        });
    }
});

// Get scheduler status
router.get('/scheduler', (req, res) => {
    try {
        const status = getSchedulerStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger manual reminder check
router.post('/scheduler/trigger', async (req, res) => {
    try {
        await triggerManualCheck();
        res.json({ message: 'Manual reminder check triggered' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await getReminderStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all reminders (for debugging)
router.get('/all-reminders', async (req, res) => {
    try {
        const result = await query(
            `SELECT r.*, 
                    COUNT(rl.id) as email_count,
                    MAX(rl.sent_at) as last_email_sent
             FROM reminders r
             LEFT JOIN reminder_logs rl ON r.id = rl.reminder_id
             GROUP BY r.id
             ORDER BY r.created_at DESC
             LIMIT 50`
        );
        
        res.json({
            reminders: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching all reminders:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Get recent email logs
router.get('/email-logs', async (req, res) => {
    try {
        const result = await query(
            `SELECT rl.*, r.problem_title, r.email
             FROM reminder_logs rl
             JOIN reminders r ON rl.reminder_id = r.id
             ORDER BY rl.sent_at DESC
             LIMIT 50`
        );
        
        res.json({
            logs: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching email logs:', error);
        res.status(500).json({ error: 'Failed to fetch email logs' });
    }
});

module.exports = router; 