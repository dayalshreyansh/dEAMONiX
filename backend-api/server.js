const express = require('express');
const cors = require('cors');
const http = require('http'); // Native Node HTTP module
const { Server } = require('socket.io'); // WebSocket Engine
const Redis = require('ioredis'); // To subscribe to cross-network events
require('dotenv').config();

// 1. Clean MVC Route Imports
const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/document.routes');
const applicationRoutes = require('./routes/application.routes'); 
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Strict CORS Configuration (Security Upgrade)
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Lock to your React app
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json()); 

// Create the unified HTTP server layer wrapping Express
const server = http.createServer(app);

// Initialize Socket.io over the wrapped server with strict CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Dedicated Redis Client exclusively for Subscribing to messages
const redisSubscriber = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 50, 2000) // Auto-reconnect safety net
});

// Redis Error Catching Pipeline
redisSubscriber.on('error', (err) => {
  console.error('❌ [Redis Sub Error] Connection lost or refused:', err.message);
});

// 3. Mount Route Matrices
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'FinGuard Core API is running.' });
});

// --- LIVE WEBSOCKET ROUTING & ROOM MAPPING ---
io.on('connection', (socket) => {
  console.log(`🔌 [Live Stream] Client attached to WebSocket matrix: ${socket.id}`);

  // When a user logs onto their dashboard, have them join a room unique to their application bundle ID
  socket.on('join_application_room', (applicationId) => {
    socket.join(applicationId);
    console.log(`🎯 [Room Mapping] Socket ${socket.id} locked into tracking room: ${applicationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Live Stream] Client split from streaming matrix: ${socket.id}`);
  });
});

// --- REDIS SUB LISTENER LOOP FOR RE-ROUTING ---
redisSubscriber.subscribe('finguard_updates', (err, count) => {
  if (err) {
    console.error("❌ [Fabric Error] Subscriber connection down:", err);
  } else {
    console.log(`📡 [Fabric Link] Node Gateway listening on backend streaming channel.`);
  }
});

// Intercept the final score packets from your Python node and broadcast them live
redisSubscriber.on('message', (channel, message) => {
  if (channel === 'finguard_updates') {
    try {
      const data = JSON.parse(message);
      console.log(`📣 [Fabric Event] Relaying Underwriting Verdict for Bundle: ${data.applicationId}`);
      
      // Broadcast the payload immediately to any socket joined to that specific application room
      io.to(data.applicationId).emit('verdict_update', data);
    } catch (parseError) {
      console.error("❌ [Fabric Error] Failed to parse Redis message payload:", parseError);
    }
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 [System Exception]:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// CRITICAL SEPARATION: Boot up the wrapped HTTP server instance instead of 'app'
server.listen(PORT, () => {
  console.log(`🚀 [FinGuard Core Gateway] Active and routing on port ${PORT}`);
});