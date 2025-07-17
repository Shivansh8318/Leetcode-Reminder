const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { sendConfirmationEmail } = require('../services/emailService');

// Reminder intervals in days
const REMINDER_INTERVALS = [3, 6, 12, 24];

// Create a new reminder
router.post('/', async (req, res) => {
    try {
        const { email, problemId, title, url, difficulty } = req.body;
        
        // Validate required fields
        if (!email || !problemId || !title || !url) {
            return res.status(400).json({ 
                error: 'Missing required fields: email, problemId, title, url' 
            });
        }
        
        // Calculate first reminder date (3 days from now)
        const firstReminderDate = new Date();
        firstReminderDate.setDate(firstReminderDate.getDate() + REMINDER_INTERVALS[0]);
        
        const result = await transaction(async (client) => {
            // Check if reminder already exists
            const existing = await client.query(
                'SELECT id FROM reminders WHERE email = $1 AND problem_id = $2',
                [email, problemId]
            );
            
            if (existing.rows.length > 0) {
                throw new Error('Reminder already exists for this problem');
            }
            
            // Insert new reminder
            const insertResult = await client.query(
                `INSERT INTO reminders 
                (email, problem_id, problem_title, problem_url, difficulty, next_reminder_date)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [email, problemId, title, url, difficulty, firstReminderDate]
            );
            
            return insertResult.rows[0];
        });
        
        // Send instant confirmation email
        console.log('📧 Sending confirmation email...');
        const emailResult = await sendConfirmationEmail({
            email,
            problem_title: title,
            problem_url: url,
            difficulty
        });
        
        res.status(201).json({
            message: 'Reminder created successfully',
            reminder: result,
            nextReminderDate: firstReminderDate,
            confirmationEmail: {
                sent: emailResult.success,
                messageId: emailResult.messageId,
                error: emailResult.error || null
            }
        });
        
    } catch (error) {
        console.error('Error creating reminder:', error);
        
        if (error.message === 'Reminder already exists for this problem') {
            return res.status(409).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

// Get user's reminders
router.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { status } = req.query; // active, completed, all
        
        let whereClause = 'WHERE email = $1';
        let params = [email];
        
        if (status === 'active') {
            whereClause += ' AND is_completed = false';
        } else if (status === 'completed') {
            whereClause += ' AND is_completed = true';
        }
        
        const result = await query(
            `SELECT id, problem_id, problem_title, problem_url, difficulty, 
                    created_at, next_reminder_date, reminder_count, is_completed
             FROM reminders 
             ${whereClause}
             ORDER BY created_at DESC`,
            params
        );
        
        res.json({
            reminders: result.rows,
            count: result.rows.length
        });
        
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Mark reminder as completed
router.put('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            'UPDATE reminders SET is_completed = true WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        
        res.json({
            message: 'Reminder marked as completed',
            reminder: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error completing reminder:', error);
        res.status(500).json({ error: 'Failed to complete reminder' });
    }
});

// Delete a reminder
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            'DELETE FROM reminders WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        
        res.json({
            message: 'Reminder deleted successfully',
            reminder: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
});

// Get pending reminders (for scheduler)
router.get('/pending', async (req, res) => {
    try {
        const now = new Date();
        
        const result = await query(
            `SELECT * FROM reminders 
             WHERE next_reminder_date <= $1 
             AND is_completed = false 
             AND reminder_count < $2
             ORDER BY next_reminder_date ASC`,
            [now, REMINDER_INTERVALS.length]
        );
        
        res.json({
            reminders: result.rows,
            count: result.rows.length
        });
        
    } catch (error) {
        console.error('Error fetching pending reminders:', error);
        res.status(500).json({ error: 'Failed to fetch pending reminders' });
    }
});

// Update reminder after sending email
router.put('/:id/sent', async (req, res) => {
    try {
        const { id } = req.params;
        const { success, errorMessage } = req.body;
        
        const result = await transaction(async (client) => {
            // Get current reminder
            const reminderResult = await client.query(
                'SELECT * FROM reminders WHERE id = $1',
                [id]
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
            
            // Update reminder
            const updateResult = await client.query(
                `UPDATE reminders 
                 SET reminder_count = $1, next_reminder_date = $2
                 WHERE id = $3 
                 RETURNING *`,
                [nextCount, nextReminderDate, id]
            );
            
            // Log the email attempt
            await client.query(
                `INSERT INTO reminder_logs 
                 (reminder_id, email_status, next_reminder_days, error_message)
                 VALUES ($1, $2, $3, $4)`,
                [
                    id,
                    success ? 'sent' : 'failed',
                    nextCount < REMINDER_INTERVALS.length ? REMINDER_INTERVALS[nextCount] : null,
                    errorMessage || null
                ]
            );
            
            return updateResult.rows[0];
        });
        
        res.json({
            message: 'Reminder updated successfully',
            reminder: result
        });
        
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
});

// Get reminder statistics
router.get('/stats/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const stats = await query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_completed = false THEN 1 END) as active,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as completed,
                AVG(reminder_count) as avg_reminders
             FROM reminders 
             WHERE email = $1`,
            [email]
        );
        
        res.json({
            stats: stats.rows[0]
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router; 