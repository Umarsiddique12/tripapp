/**
 * Debug Test Script
 * Run this to verify your location tracking system
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running correctly',
    timestamp: new Date().toISOString()
  });
});

// Test Socket.IO
io.on('connection', (socket) => {
  console.log('🔗 Test client connected:', socket.id);
  
  socket.on('testLocation', (data) => {
    console.log('📍 Test location received:', data);
    socket.broadcast.emit('testLocationBroadcast', {
      ...data,
      receivedAt: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Test client disconnected:', socket.id);
  });
});

const PORT = 5001; // Different port to avoid conflicts

server.listen(PORT, () => {
  console.log('🧪 Debug test server running on port', PORT);
  console.log('📍 Test the following:');
  console.log(`   📱 HTTP: http://192.168.1.8:${PORT}/test`);
  console.log(`   🔗 Socket: http://192.168.1.8:${PORT}`);
  console.log('');
  console.log('💡 If this works, your network is fine.');
  console.log('💡 If not, check firewall/network settings.');
});