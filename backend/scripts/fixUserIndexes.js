const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const fixUserIndexes = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🔧 Fixing User model indexes...');
    
    // Get current indexes
    const indexes = await User.collection.getIndexes();
    console.log('📋 Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Drop the incorrect username index if it exists
    if (indexes.username_1) {
      console.log('🗑️  Dropping incorrect username index...');
      await User.collection.dropIndex('username_1');
      console.log('✅ Username index dropped');
    }
    
    // Create the correct email unique index
    console.log('🔨 Creating email unique index...');
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Email unique index created');
    } catch (indexError) {
      if (indexError.code === 11000) {
        console.log('⚠️  Email index already exists or there are duplicate emails');
        // Check for duplicate emails
        const duplicates = await User.aggregate([
          { $group: { _id: '$email', count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } }
        ]);
        
        if (duplicates.length > 0) {
          console.log('❌ Found duplicate emails:', duplicates);
          console.log('Please clean up duplicate emails before creating the index');
        }
      } else {
        throw indexError;
      }
    }
    
    // Verify the indexes
    const newIndexes = await User.collection.getIndexes();
    console.log('📋 Indexes after fix:', JSON.stringify(newIndexes, null, 2));
    
    // Test user creation
    console.log('\n🧪 Testing user creation...');
    try {
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Test user created successfully:', testUser.email);
      
      // Try to create duplicate
      try {
        await User.create({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'password123'
        });
        console.log('❌ Duplicate user was created (this should not happen)');
      } catch (duplicateError) {
        console.log('✅ Duplicate user correctly rejected:', duplicateError.message);
      }
      
      // Clean up
      await User.deleteOne({ _id: testUser._id });
      console.log('🧹 Test user cleaned up');
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
    
    console.log('\n🎉 User index fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user indexes:', error);
    process.exit(1);
  }
};

fixUserIndexes();
