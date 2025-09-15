const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Trip = require('./models/Trip');
const Expense = require('./models/Expense');
const Media = require('./models/Media');
const Chat = require('./models/Chat');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Trip.deleteMany({});
    await Expense.deleteMany({});
    await Media.deleteMany({});
    await Chat.deleteMany({});

    // Create test users
    console.log('👥 Creating test users...');
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'David Brown',
        email: 'david@example.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create test trips
    console.log('✈️  Creating test trips...');
    const trips = await Trip.create([
      {
        name: 'Bali Adventure',
        description: 'Amazing trip to Bali with friends. Exploring beaches, temples, and local culture.',
        createdBy: users[0]._id,
        members: [users[0]._id, users[1]._id, users[2]._id],
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-22'),
        destination: 'Bali, Indonesia',
        totalBudget: 2000
      },
      {
        name: 'European Tour',
        description: 'Backpacking through Europe. Visiting Paris, Rome, and Barcelona.',
        createdBy: users[1]._id,
        members: [users[1]._id, users[3]._id, users[4]._id],
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-15'),
        destination: 'Europe',
        totalBudget: 3000
      },
      {
        name: 'Weekend Getaway',
        description: 'Quick weekend trip to the mountains for hiking and relaxation.',
        createdBy: users[2]._id,
        members: [users[2]._id, users[0]._id],
        startDate: new Date('2024-02-10'),
        endDate: new Date('2024-02-12'),
        destination: 'Rocky Mountains',
        totalBudget: 500
      }
    ]);

    console.log(`✅ Created ${trips.length} trips`);

    // Create test expenses
    console.log('💰 Creating test expenses...');
    const expenses = await Expense.create([
      {
        tripId: trips[0]._id,
        addedBy: users[0]._id,
        description: 'Flight tickets to Bali',
        amount: 800,
        currency: 'USD',
        splitType: 'equal',
        participants: [
          { user: users[0]._id, amount: 266.67, paid: true },
          { user: users[1]._id, amount: 266.67, paid: false },
          { user: users[2]._id, amount: 266.66, paid: false }
        ],
        category: 'transport'
      },
      {
        tripId: trips[0]._id,
        addedBy: users[1]._id,
        description: 'Hotel accommodation for 3 nights',
        amount: 450,
        currency: 'USD',
        splitType: 'equal',
        participants: [
          { user: users[0]._id, amount: 150, paid: false },
          { user: users[1]._id, amount: 150, paid: true },
          { user: users[2]._id, amount: 150, paid: false }
        ],
        category: 'accommodation'
      },
      {
        tripId: trips[0]._id,
        addedBy: users[2]._id,
        description: 'Dinner at local restaurant',
        amount: 75,
        currency: 'USD',
        splitType: 'equal',
        participants: [
          { user: users[0]._id, amount: 25, paid: false },
          { user: users[1]._id, amount: 25, paid: false },
          { user: users[2]._id, amount: 25, paid: true }
        ],
        category: 'food'
      },
      {
        tripId: trips[1]._id,
        addedBy: users[1]._id,
        description: 'Train tickets Paris to Rome',
        amount: 120,
        currency: 'EUR',
        splitType: 'equal',
        participants: [
          { user: users[1]._id, amount: 40, paid: true },
          { user: users[3]._id, amount: 40, paid: false },
          { user: users[4]._id, amount: 40, paid: false }
        ],
        category: 'transport'
      },
      {
        tripId: trips[2]._id,
        addedBy: users[2]._id,
        description: 'Gas for road trip',
        amount: 80,
        currency: 'USD',
        splitType: 'equal',
        participants: [
          { user: users[2]._id, amount: 40, paid: true },
          { user: users[0]._id, amount: 40, paid: false }
        ],
        category: 'transport'
      }
    ]);

    console.log(`✅ Created ${expenses.length} expenses`);

    // Create test media
    console.log('📸 Creating test media...');
    const media = await Media.create([
      {
        tripId: trips[0]._id,
        uploadedBy: users[0]._id,
        url: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop',
        publicId: 'tripsync/bali_beach_1',
        type: 'image',
        filename: 'bali_beach_sunset.jpg',
        size: 1024000,
        caption: 'Beautiful sunset at Kuta Beach',
        tags: ['sunset', 'beach', 'bali']
      },
      {
        tripId: trips[0]._id,
        uploadedBy: users[1]._id,
        url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
        publicId: 'tripsync/bali_temple_1',
        type: 'image',
        filename: 'uluwatu_temple.jpg',
        size: 856000,
        caption: 'Uluwatu Temple with amazing ocean view',
        tags: ['temple', 'bali', 'architecture']
      },
      {
        tripId: trips[1]._id,
        uploadedBy: users[1]._id,
        url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop',
        publicId: 'tripsync/paris_eiffel_1',
        type: 'image',
        filename: 'eiffel_tower.jpg',
        size: 1200000,
        caption: 'Eiffel Tower at night',
        tags: ['paris', 'eiffel', 'night']
      },
      {
        tripId: trips[2]._id,
        uploadedBy: users[2]._id,
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        publicId: 'tripsync/mountains_1',
        type: 'image',
        filename: 'mountain_view.jpg',
        size: 980000,
        caption: 'Amazing mountain view from our hike',
        tags: ['mountains', 'hiking', 'nature']
      }
    ]);

    console.log(`✅ Created ${media.length} media items`);

    // Create test chat messages
    console.log('💬 Creating test chat messages...');
    const chatMessages = await Chat.create([
      {
        tripId: trips[0]._id,
        senderId: users[0]._id,
        message: 'Hey everyone! Excited for our Bali trip! 🏝️',
        type: 'text'
      },
      {
        tripId: trips[0]._id,
        senderId: users[1]._id,
        message: 'Me too! I\'ve been planning this for months',
        type: 'text'
      },
      {
        tripId: trips[0]._id,
        senderId: users[2]._id,
        message: 'Don\'t forget to pack sunscreen! ☀️',
        type: 'text'
      },
      {
        tripId: trips[0]._id,
        senderId: users[0]._id,
        message: 'Check out this amazing sunset I found online!',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400&h=300&fit=crop',
        fileName: 'sunset_preview.jpg',
        fileSize: 256000
      },
      {
        tripId: trips[1]._id,
        senderId: users[1]._id,
        message: 'European adventure starts tomorrow! 🇪🇺',
        type: 'text'
      },
      {
        tripId: trips[1]._id,
        senderId: users[3]._id,
        message: 'Can\'t wait to try all the local food!',
        type: 'text'
      },
      {
        tripId: trips[2]._id,
        senderId: users[2]._id,
        message: 'Weather looks perfect for hiking this weekend',
        type: 'text'
      },
      {
        tripId: trips[2]._id,
        senderId: users[0]._id,
        message: 'I\'ll bring the snacks! 🥨',
        type: 'text'
      }
    ]);

    console.log(`✅ Created ${chatMessages.length} chat messages`);

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   ✈️  Trips: ${trips.length}`);
    console.log(`   💰 Expenses: ${expenses.length}`);
    console.log(`   📸 Media: ${media.length}`);
    console.log(`   💬 Chat Messages: ${chatMessages.length}`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('   Email: john@example.com | Password: password123');
    console.log('   Email: jane@example.com | Password: password123');
    console.log('   Email: mike@example.com | Password: password123');
    console.log('   Email: sarah@example.com | Password: password123');
    console.log('   Email: david@example.com | Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed function
seedData();
