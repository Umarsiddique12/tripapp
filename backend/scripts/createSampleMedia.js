const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Media = require('../models/Media');
const Trip = require('../models/Trip');
const User = require('../models/User');

const createSampleMedia = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('📸 Creating sample media for testing...');
    
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
    
    console.log(`✅ Using user: ${user.name} (${user.email})`);
    console.log(`✅ Using trip: ${trip.name}`);
    
    // Create sample media items
    const sampleMedia = [
      {
        tripId: trip._id,
        uploadedBy: user._id,
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        publicId: 'sample-mountain-view',
        type: 'image',
        filename: 'mountain-view.jpg',
        size: 1024000,
        caption: 'Beautiful mountain view from our trip',
        tags: ['mountain', 'nature', 'landscape'],
        isPublic: true,
        downloadCount: 0
      },
      {
        tripId: trip._id,
        uploadedBy: user._id,
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
        publicId: 'sample-beach-sunset',
        type: 'image',
        filename: 'beach-sunset.jpg',
        size: 1200000,
        caption: 'Amazing sunset at the beach',
        tags: ['beach', 'sunset', 'ocean'],
        isPublic: true,
        downloadCount: 0
      },
      {
        tripId: trip._id,
        uploadedBy: user._id,
        url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=600&fit=crop',
        publicId: 'sample-food-dish',
        type: 'image',
        filename: 'local-food.jpg',
        size: 980000,
        caption: 'Delicious local cuisine we tried',
        tags: ['food', 'local', 'cuisine'],
        isPublic: true,
        downloadCount: 0
      },
      {
        tripId: trip._id,
        uploadedBy: user._id,
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
        publicId: 'sample-forest-hike',
        type: 'image',
        filename: 'forest-hike.jpg',
        size: 1100000,
        caption: 'Hiking through the beautiful forest',
        tags: ['hiking', 'forest', 'adventure'],
        isPublic: true,
        downloadCount: 0
      },
      {
        tripId: trip._id,
        uploadedBy: user._id,
        url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
        publicId: 'sample-city-lights',
        type: 'image',
        filename: 'city-lights.jpg',
        size: 1300000,
        caption: 'City lights at night',
        tags: ['city', 'night', 'lights'],
        isPublic: true,
        downloadCount: 0
      }
    ];
    
    // Create media items
    const createdMedia = await Media.insertMany(sampleMedia);
    console.log(`✅ Created ${createdMedia.length} sample media items`);
    
    // Display created media
    console.log('\n📸 Created Media Items:');
    createdMedia.forEach((media, index) => {
      console.log(`   ${index + 1}. ${media.caption}`);
      console.log(`      Type: ${media.type}, Size: ${(media.size / 1024).toFixed(1)}KB`);
      console.log(`      Tags: ${media.tags.join(', ')}`);
      console.log(`      URL: ${media.url}`);
      console.log('');
    });
    
    // Test the media API
    console.log('🧪 Testing media retrieval...');
    const mediaByTrip = await Media.find({ tripId: trip._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Retrieved ${mediaByTrip.length} media items for trip "${trip.name}"`);
    
    console.log('\n🎉 Sample media creation completed!');
    console.log('📱 You can now test the media gallery in your mobile app!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample media:', error);
    process.exit(1);
  }
};

createSampleMedia();
