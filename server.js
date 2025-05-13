const express = require('express');
const path = require('path');
const socketIO = require('socket.io');

class ChatServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 4000;
    this.connectedSockets = new Set();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.server = this.app.listen(this.port, this.onServerStart.bind(this));
    this.io = socketIO(this.server);
    this.initializeSocketHandlers();
  }

  initializeMiddleware() {
    this.app.use(express.static(path.join(__dirname, 'web')));
  }

  initializeRoutes() {
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'web', 'index.html'));
    });
  }

  onServerStart() {
    console.log(`💬 Server running on port ${this.port}`);
    console.log(`💬 Click this link "http://localhost:${this.port}/"`);
  }

  initializeSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New connection:', socket.id);
      this.connectedSockets.add(socket.id);
      this.updateClientCount();

      socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        this.connectedSockets.delete(socket.id);
        this.updateClientCount();
      });

      socket.on('message', (data) => {
        socket.broadcast.emit('chat-message', data);
      });

      socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
      });
    });
  }

  updateClientCount() {
    this.io.emit('clients-total', this.connectedSockets.size);
  }
}

// Start the server
new ChatServer();