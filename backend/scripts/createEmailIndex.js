const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const createEmailIndex = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🔨 Creating email unique index...');
    
    // Create the email unique index
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Email unique index created successfully');
    
    // Verify the index was created
    const indexes = await User.collection.getIndexes();
    console.log('📋 Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Test the index
    console.log('\n🧪 Testing index functionality...');
    
    // Create first user
    const user1 = await User.create({
      name: 'Test User 1',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ First user created:', user1.email);
    
    // Try to create duplicate user
    try {
      const user2 = await User.create({
        name: 'Test User 2',
        email: 'test@example.com', // Same email
        password: 'password123'
      });
      console.log('❌ Duplicate user was created (this should not happen)');
    } catch (duplicateError) {
      console.log('✅ Duplicate user correctly rejected:', duplicateError.message);
    }
    
    // Clean up
    await User.deleteOne({ _id: user1._id });
    console.log('🧹 Test user cleaned up');
    
    console.log('\n🎉 Email index creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating email index:', error);
    process.exit(1);
  }
};

createEmailIndex();
