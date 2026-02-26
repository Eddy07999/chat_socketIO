require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const userRoutes = require('./routes/users');

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://admin:chatpass123@localhost:27017/chat_app?authSource=admin';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.send({ status: 'ok', message: 'Socket.IO chat server running', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/users', userRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('chat:message', (payload) => {
    const message = {
      id: payload?.id || socket.id,
      user: payload?.user || 'Anonymous',
      text: payload?.text || '',
      timestamp: payload?.timestamp || Date.now(),
    };

    io.emit('chat:message', message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id} (${reason})`);
  });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
