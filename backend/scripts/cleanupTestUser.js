const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const cleanupTestUser = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🧹 Cleaning up test user...');
    
    // Remove test user
    const result = await User.deleteOne({ email: 'test@example.com' });
    console.log(`🗑️  Deleted test user: ${result.deletedCount} user(s)`);
    
    // Show remaining users
    const remainingUsers = await User.find({});
    console.log(`\n📊 Remaining users: ${remainingUsers.length}`);
    
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email}) - ID: ${user._id}`);
    });
    
    console.log('\n🎉 Test user cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up test user:', error);
    process.exit(1);
  }
};

cleanupTestUser();
