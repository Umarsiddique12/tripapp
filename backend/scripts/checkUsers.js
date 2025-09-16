const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const checkUsers = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('👥 Checking existing users...');
    
    // Get all users
    const users = await User.find({});
    console.log(`📊 Total users: ${users.length}`);
    
    // Group by email to find duplicates
    const emailGroups = {};
    users.forEach(user => {
      const email = user.email;
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(user);
    });
    
    // Find duplicate emails
    const duplicates = Object.entries(emailGroups).filter(([email, userList]) => userList.length > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate emails:');
      duplicates.forEach(([email, userList]) => {
        console.log(`   Email: ${email} (${userList.length} users)`);
        userList.forEach((user, index) => {
          console.log(`     ${index + 1}. ID: ${user._id}, Name: ${user.name}, Created: ${user.createdAt}`);
        });
      });
    } else {
      console.log('✅ No duplicate emails found');
    }
    
    // Show all users
    console.log('\n📋 All users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
};

checkUsers();
