const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');
const { authMiddleware } = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const expenseRoutes = require('./routes/expenses');
const mediaRoutes = require('./routes/media');
const chatRoutes = require('./routes/chat');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : ['http://localhost:3000', 'exp://localhost:19000'],
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : ['http://localhost:3000', 'exp://localhost:19000'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TripSync API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);

  // Join trip room
  socket.on('joinTrip', (tripId) => {
    socket.join(`trip_${tripId}`);
    console.log(`User ${socket.user.name} joined trip room: ${tripId}`);
    
    // Notify others in the trip
    socket.to(`trip_${tripId}`).emit('userJoined', {
      user: {
        id: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar
      },
      message: `${socket.user.name} joined the chat`
    });
  });

  // Leave trip room
  socket.on('leaveTrip', (tripId) => {
    socket.leave(`trip_${tripId}`);
    console.log(`User ${socket.user.name} left trip room: ${tripId}`);
    
    // Notify others in the trip
    socket.to(`trip_${tripId}`).emit('userLeft', {
      user: {
        id: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar
      },
      message: `${socket.user.name} left the chat`
    });
  });

  // Send message
  socket.on('sendMessage', async (data) => {
    try {
      const { tripId, message, type = 'text', mediaUrl, fileName, fileSize, replyTo } = data;

      // Verify user is a member of the trip
      const Trip = require('./models/Trip');
      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        socket.emit('error', { message: 'Trip not found' });
        return;
      }

      const isMember = trip.members.some(member => member.toString() === socket.userId);
      if (!isMember) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Save message to database
      const Chat = require('./models/Chat');
      const chatMessage = await Chat.create({
        tripId,
        senderId: socket.userId,
        message,
        type,
        mediaUrl,
        fileName,
        fileSize,
        replyTo
      });

      await chatMessage.populate('senderId', 'name email avatar');
      if (replyTo) {
        await chatMessage.populate('replyTo', 'message senderId');
      }

      // Broadcast message to all users in the trip room
      io.to(`trip_${tripId}`).emit('newMessage', {
        message: chatMessage
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { tripId, isTyping } = data;
    socket.to(`trip_${tripId}`).emit('userTyping', {
      user: {
        id: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar
      },
      isTyping
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 TripSync server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
