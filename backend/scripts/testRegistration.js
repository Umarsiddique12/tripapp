const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const testRegistration = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🧪 Testing registration process...');
    
    // Test 1: Create a new user
    console.log('\n📝 Test 1: Creating new user...');
    try {
      const newUser = await User.create({
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'password123'
      });
      console.log('✅ New user created successfully:', newUser.email);
      
      // Clean up
      await User.deleteOne({ _id: newUser._id });
      console.log('🧹 Test user cleaned up');
    } catch (error) {
      console.log('❌ New user creation failed:', error.message);
    }
    
    // Test 2: Try to create duplicate user
    console.log('\n📝 Test 2: Testing duplicate email prevention...');
    try {
      // First, create a user
      const user1 = await User.create({
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'password123'
      });
      console.log('✅ First user created:', user1.email);
      
      // Try to create duplicate
      try {
        const user2 = await User.create({
          name: 'User 2',
          email: 'duplicate@example.com', // Same email
          password: 'password123'
        });
        console.log('❌ Duplicate user was created (this should not happen)');
      } catch (duplicateError) {
        console.log('✅ Duplicate user correctly rejected:', duplicateError.message);
      }
      
      // Clean up
      await User.deleteOne({ _id: user1._id });
      console.log('🧹 Test user cleaned up');
    } catch (error) {
      console.log('❌ Duplicate test failed:', error.message);
    }
    
    // Test 3: Test with existing user email
    console.log('\n📝 Test 3: Testing with existing user email...');
    try {
      const existingUser = await User.create({
        name: 'Test User',
        email: 'add232@gmail.com', // This email already exists
        password: 'password123'
      });
      console.log('❌ User with existing email was created (this should not happen)');
    } catch (error) {
      console.log('✅ User with existing email correctly rejected:', error.message);
    }
    
    console.log('\n🎉 Registration testing completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing registration:', error);
    process.exit(1);
  }
};

testRegistration();
