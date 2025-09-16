const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');

const checkIndexes = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🔍 Checking User model indexes...');
    
    // Get all indexes on the User collection
    const indexes = await User.collection.getIndexes();
    console.log('📋 Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Check if email index exists
    const emailIndex = Object.keys(indexes).find(indexName => 
      indexes[indexName].key && indexes[indexName].key.email === 1
    );
    
    if (emailIndex) {
      console.log('✅ Email index found:', emailIndex, indexes[emailIndex]);
    } else {
      console.log('❌ Email index not found');
    }
    
    // Check for duplicate indexes
    const emailIndexes = Object.keys(indexes).filter(indexName => 
      indexes[indexName].key && indexes[indexName].key.email === 1
    );
    
    if (emailIndexes.length > 1) {
      console.log('⚠️  Multiple email indexes found:', emailIndexes.length);
      emailIndexes.forEach((index, i) => {
        console.log(`   Index ${i + 1}:`, index);
      });
    }
    
    // Test creating a user to see what error we get
    console.log('\n🧪 Testing user creation...');
    try {
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Test user created successfully:', testUser._id);
      
      // Clean up test user
      await User.deleteOne({ _id: testUser._id });
      console.log('🧹 Test user cleaned up');
      
    } catch (error) {
      console.log('❌ Test user creation failed:');
      console.log('   Error code:', error.code);
      console.log('   Error name:', error.name);
      console.log('   Error message:', error.message);
      console.log('   Error keyPattern:', error.keyPattern);
      console.log('   Error keyValue:', error.keyValue);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
    process.exit(1);
  }
};

checkIndexes();
