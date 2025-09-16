const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const fixIndexes = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🔧 Fixing User model indexes...');
    
    // Drop all indexes except _id
    console.log('🗑️  Dropping existing indexes...');
    await User.collection.dropIndexes();
    
    // Recreate the email unique index
    console.log('🔨 Creating email unique index...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    
    // Verify the index was created
    const indexes = await User.collection.getIndexes();
    console.log('✅ Indexes after fix:', JSON.stringify(indexes, null, 2));
    
    // Test the index
    console.log('\n🧪 Testing index functionality...');
    try {
      // Create first user
      const user1 = await User.create({
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'password123'
      });
      console.log('✅ First user created:', user1.email);
      
      // Try to create duplicate user
      try {
        const user2 = await User.create({
          name: 'Test User 2',
          email: 'test1@example.com', // Same email
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
      console.log('❌ Test failed:', error.message);
    }
    
    console.log('\n🎉 Index fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
