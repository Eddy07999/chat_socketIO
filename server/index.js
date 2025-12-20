const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));

app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'Socket.IO chat server running' });
});

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

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
