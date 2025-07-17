#!/usr/bin/env node

const { connectDB, initializeDatabase, closeDB } = require('../config/database');

async function initDatabase() {
    console.log('🔧 Initializing LeetCode Reminder Database...\n');
    
    try {
        // Connect to database
        console.log('1. Connecting to database...');
        await connectDB();
        console.log('✅ Database connected successfully\n');
        
        // Initialize schema
        console.log('2. Creating database schema...');
        await initializeDatabase();
        console.log('✅ Database schema created successfully\n');
        
        console.log('🎉 Database initialization completed!\n');
        console.log('📋 Next steps:');
        console.log('   1. Configure your email settings in .env file');
        console.log('   2. Start the server with: npm run dev');
        console.log('   3. Load the Chrome extension in developer mode');
        console.log('   4. Visit a LeetCode problem and test the reminder button\n');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        console.error('\n🔍 Troubleshooting:');
        console.error('   1. Check your DATABASE_URL environment variable');
        console.error('   2. Ensure the database server is running');
        console.error('   3. Verify your database credentials');
        process.exit(1);
    } finally {
        await closeDB();
    }
}

// Run the initialization
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase }; 