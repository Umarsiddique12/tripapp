const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const simpleCleanup = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🧹 Simple cleanup - removing duplicate users...');
    
    // Remove all users with the duplicate email
    const result = await User.deleteMany({ email: 'aghani14789@gmail.com' });
    console.log(`🗑️  Deleted ${result.deletedCount} duplicate users`);
    
    // Remove any users with undefined names
    const undefinedResult = await User.deleteMany({ name: { $exists: false } });
    console.log(`🗑️  Deleted ${undefinedResult.deletedCount} users with undefined names`);
    
    // Show remaining users
    const remainingUsers = await User.find({});
    console.log(`\n📊 Remaining users: ${remainingUsers.length}`);
    
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email}) - ID: ${user._id}`);
    });
    
    console.log('\n🎉 Simple cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in simple cleanup:', error);
    process.exit(1);
  }
};

simpleCleanup();
