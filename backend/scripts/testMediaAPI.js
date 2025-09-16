const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Media = require('../models/Media');
const Trip = require('../models/Trip');
const User = require('../models/User');

const testMediaAPI = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🧪 Testing Media API functionality...');
    
    // Get a user and trip for testing
    const user = await User.findOne();
    const trip = await Trip.findOne();
    
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    if (!trip) {
      console.log('❌ No trips found. Please create a trip first.');
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`✅ Found trip: ${trip.name}`);
    
    // Test 1: Check if media collection exists and is accessible
    console.log('\n📊 Media Collection Stats:');
    const mediaCount = await Media.countDocuments();
    console.log(`   Total media items: ${mediaCount}`);
    
    // Test 2: Check media by trip
    const mediaByTrip = await Media.find({ tripId: trip._id });
    console.log(`   Media in trip "${trip.name}": ${mediaByTrip.length}`);
    
    // Test 3: Check media with public visibility
    const publicMedia = await Media.find({ isPublic: true });
    console.log(`   Public media items: ${publicMedia.length}`);
    
    // Test 4: Check media types
    const imageCount = await Media.countDocuments({ type: 'image' });
    const videoCount = await Media.countDocuments({ type: 'video' });
    console.log(`   Images: ${imageCount}, Videos: ${videoCount}`);
    
    // Test 5: Check recent media
    const recentMedia = await Media.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name email')
      .populate('tripId', 'name');
    
    console.log('\n📸 Recent Media:');
    if (recentMedia.length > 0) {
      recentMedia.forEach((media, index) => {
        console.log(`   ${index + 1}. ${media.type} - ${media.caption || 'No caption'}`);
        console.log(`      Uploaded by: ${media.uploadedBy?.name || 'Unknown'}`);
        console.log(`      Trip: ${media.tripId?.name || 'Unknown'}`);
        console.log(`      Date: ${media.createdAt}`);
        console.log(`      URL: ${media.url ? 'Available' : 'Missing'}`);
        console.log('');
      });
    } else {
      console.log('   No media found');
    }
    
    // Test 6: Check Cloudinary URLs
    console.log('☁️  Cloudinary Integration Check:');
    const mediaWithUrls = await Media.find({ url: { $exists: true, $ne: null } });
    console.log(`   Media with Cloudinary URLs: ${mediaWithUrls.length}`);
    
    const mediaWithPublicIds = await Media.find({ publicId: { $exists: true, $ne: null } });
    console.log(`   Media with Cloudinary Public IDs: ${mediaWithPublicIds.length}`);
    
    // Test 7: Check for any broken media
    const brokenMedia = await Media.find({
      $or: [
        { url: { $exists: false } },
        { url: null },
        { publicId: { $exists: false } },
        { publicId: null }
      ]
    });
    
    if (brokenMedia.length > 0) {
      console.log(`⚠️  Found ${brokenMedia.length} media items with missing Cloudinary data:`);
      brokenMedia.forEach((media, index) => {
        console.log(`   ${index + 1}. ID: ${media._id}, Type: ${media.type}`);
      });
    } else {
      console.log('✅ All media items have proper Cloudinary integration');
    }
    
    console.log('\n🎉 Media API test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing media API:', error);
    process.exit(1);
  }
};

testMediaAPI();
