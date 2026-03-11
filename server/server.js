const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Use CORS middleware for Express APIs
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Set up Socket.IO with CORS (required separately for WebSockets)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student-collab';

// Disable buffering so the app doesn't hang if MongoDB is not connected
mongoose.set('bufferCommands', false);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error. Chat will work in-memory only.'));

// Basic Message Schema
const messageSchema = new mongoose.Schema({
  room: String,
  user: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Connection logic for active users (for demonstration purposes, stored in memory)
const activeUsers = new Map();

// Core WebSocket Logic
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // 1. Join a specific Room
  socket.on('join_room', async ({ username, room }) => {
    socket.join(room);
    
    // Store user data on the socket to use during disconnect
    socket.data.username = username;
    socket.data.room = room;

    console.log(`👤 ${username} joined room: ${room}`);

    // Manage in-memory active users for the "Live User List"
    if (!activeUsers.has(room)) {
      activeUsers.set(room, new Set());
    }
    activeUsers.get(room).add(username);

    // Broadcast the updated user list to everyone in this room
    io.to(room).emit('room_users', Array.from(activeUsers.get(room)));

    // Fetch and send PAST messages from MongoDB for this room
    try {
      if (mongoose.connection.readyState === 1) {
        const messages = await Message.find({ room }).sort({ timestamp: 1 }).limit(50);
        socket.emit('past_messages', messages);
      }
    } catch (err) {
      console.error('Error fetching past messages', err);
    }

    // Broadcast a system-wide announcement to other students
    const sysMsg = { 
      user: 'System Announcement', 
      text: `${username} has joined the room! 👋`, 
      room, 
      timestamp: new Date() 
    };
    socket.to(room).emit('receive_message', sysMsg);
  });

  // 2. Receive and Relay Messages
  socket.on('send_message', async (data) => {
    try {
      // Step A: Save message to Database (History)
      if (mongoose.connection.readyState === 1) {
        const newMessage = new Message(data);
        await newMessage.save();
      }
      
      // Step B: Send immediately to connected users (Real-Time)
      io.to(data.room).emit('receive_message', data);
    } catch (err) {
      console.error('Error saving message', err);
      // Even if DB fails, allow local real-time chat to continue
      io.to(data.room).emit('receive_message', data);
    }
  });

  // 3. Handle Disconnects
  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
    const { username, room } = socket.data;

    // Clean up active users list if they were in a room
    if (username && room && activeUsers.has(room)) {
      activeUsers.get(room).delete(username);
      io.to(room).emit('room_users', Array.from(activeUsers.get(room)));
      
      const leaveMsg = { 
        user: 'System Announcement', 
        text: `${username} left the room.`, 
        room, 
        timestamp: new Date() 
      };
      io.to(room).emit('receive_message', leaveMsg);
    }
  });
});

// Basic HTTP Route (Shows difference between HTTP and WebSockets)
app.get('/', (req, res) => {
  res.send('Backend Server is running. Ready for WebSockets!');
});

// Start the Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
