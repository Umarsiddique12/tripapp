const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const cleanupUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🧹 Cleaning up duplicate users...');
    
    // Get all users
    const users = await User.find({});
    console.log(`📊 Total users before cleanup: ${users.length}`);
    
    // Group by email
    const emailGroups = {};
    users.forEach(user => {
      const email = user.email;
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(user);
    });
    
    // Find and clean up duplicates
    const duplicates = Object.entries(emailGroups).filter(([email, userList]) => userList.length > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate emails, cleaning up...');
      
      for (const [email, userList] of duplicates) {
        console.log(`\n📧 Processing email: ${email} (${userList.length} users)`);
        
        // Keep the most recent user (or the one with the most complete data)
        const sortedUsers = userList.sort((a, b) => {
          // First, prefer users with names
          if (a.name && !b.name) return -1;
          if (!a.name && b.name) return 1;
          
          // Then, prefer more recent users
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        
        const keepUser = sortedUsers[0];
        const deleteUsers = sortedUsers.slice(1);
        
        console.log(`   ✅ Keeping: ${keepUser.name || 'No name'} (${keepUser._id})`);
        
        // Delete duplicate users
        for (const user of deleteUsers) {
          console.log(`   🗑️  Deleting: ${user.name || 'No name'} (${user._id})`);
          await User.deleteOne({ _id: user._id });
        }
      }
    }
    
    // Clean up users with undefined names
    console.log('\n🔧 Fixing users with undefined names...');
    const usersWithUndefinedNames = await User.find({ name: { $exists: false } });
    
    for (const user of usersWithUndefinedNames) {
      console.log(`   🔧 Fixing user: ${user.email}`);
      // Generate a name from email
      const emailName = user.email.split('@')[0];
      user.name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      await user.save();
      console.log(`   ✅ Updated name to: ${user.name}`);
    }
    
    // Final count
    const finalUsers = await User.find({});
    console.log(`\n📊 Total users after cleanup: ${finalUsers.length}`);
    
    // Show final users
    console.log('\n📋 Final users:');
    finalUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    console.log('\n🎉 User cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up users:', error);
    process.exit(1);
  }
};

cleanupUsers();
