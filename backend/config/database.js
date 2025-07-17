const { Pool } = require('pg');

// Database connection configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fMCp4jxK5dRG@ep-bitter-brook-ad5z6wcu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false
    }
};

// Create connection pool
const pool = new Pool(dbConfig);

// Connect to database
async function connectDB() {
    try {
        const client = await pool.connect();
        console.log('Database connected successfully');
        client.release();
        return pool;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// Initialize database schema
async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('Starting database schema initialization...');
        
        // Drop existing tables if they exist (for clean initialization)
        console.log('Cleaning up existing tables...');
        await client.query('DROP TABLE IF EXISTS reminder_logs CASCADE');
        await client.query('DROP TABLE IF EXISTS reminders CASCADE');
        console.log('✅ Existing tables cleaned up');
        
        // Create reminders table
        console.log('Creating reminders table...');
        await client.query(`
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
                CONSTRAINT unique_email_problem UNIQUE(email, problem_id)
            )
        `);
        console.log('✅ Reminders table created successfully');
        
        // Create reminder_logs table
        console.log('Creating reminder_logs table...');
        await client.query(`
            CREATE TABLE reminder_logs (
                id SERIAL PRIMARY KEY,
                reminder_id INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
                sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                email_status VARCHAR(50) DEFAULT 'sent',
                next_reminder_days INTEGER,
                error_message TEXT
            )
        `);
        console.log('✅ Reminder_logs table created successfully');
        
        // Create indexes for better performance
        console.log('Creating indexes...');
        
        await client.query(`
            CREATE INDEX idx_reminders_email ON reminders(email)
        `);
        console.log('✅ Email index created');
        
        await client.query(`
            CREATE INDEX idx_reminders_next_date ON reminders(next_reminder_date)
        `);
        console.log('✅ Next date index created');
        
        await client.query(`
            CREATE INDEX idx_reminders_completed ON reminders(is_completed)
        `);
        console.log('✅ Completed index created');
        
        await client.query(`
            CREATE INDEX idx_reminder_logs_reminder_id ON reminder_logs(reminder_id)
        `);
        console.log('✅ Reminder logs index created');
        
        // Verify tables were created
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('reminders', 'reminder_logs')
            ORDER BY table_name
        `);
        
        console.log('✅ Tables verified:', tablesResult.rows.map(r => r.table_name));
        console.log('✅ Database schema initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Helper function to execute queries
async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Helper function for transactions
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Get database pool
function getPool() {
    return pool;
}

// Close database connection
async function closeDB() {
    try {
        await pool.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database:', error);
        throw error;
    }
}

module.exports = {
    connectDB,
    initializeDatabase,
    query,
    transaction,
    getPool,
    closeDB
}; 