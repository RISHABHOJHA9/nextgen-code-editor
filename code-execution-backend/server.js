require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ==============================
// Code Execution Endpoint
// ==============================
app.post('/api/execute', authMiddleware, (req, res) => {
  const { language, code } = req.body;

  let fileExtension, compileCmd, runCmd, fileName;

  switch (language) {
    case 'c':
      fileExtension = '.c';
      fileName = 'code' + fileExtension;
      compileCmd = `gcc ${fileName} -o output`;
      runCmd = os.platform() === 'win32' ? 'output.exe' : './output';
      break;
    case 'cpp':
      fileExtension = '.cpp';
      fileName = 'code' + fileExtension;
      compileCmd = `g++ ${fileName} -o output`;
      runCmd = os.platform() === 'win32' ? 'output.exe' : './output';
      break;
    case 'python':
      fileExtension = '.py';
      fileName = 'code' + fileExtension;
      compileCmd = null;
      runCmd = `python ${fileName}`;
      break;
    case 'java':
      fileExtension = '.java';
      fileName = 'Main' + fileExtension;
      compileCmd = `javac ${fileName}`;
      runCmd = `java Main`;
      break;
    case 'javascript':
      fileExtension = '.js';
      fileName = 'code' + fileExtension;
      compileCmd = null;
      runCmd = `node ${fileName}`;
      break;
    default:
      return res.json({ output: 'Unsupported language' });
  }

  fs.writeFile(fileName, code, (err) => {
    if (err) return res.json({ output: 'File write error' });

    const execute = () => {
      exec(runCmd, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) return res.json({ output: stderr || err.message });
        return res.json({ output: stdout });
      });
    };

    if (compileCmd) {
      exec(compileCmd, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) return res.json({ output: stderr || err.message });
        execute();
      });
    } else {
      execute();
    }
  });
});

// ==============================
// Socket.IO for Collaboration
// ==============================

const roomState = {}; // Stores code + language
const roomUsers = {}; // Stores socket.id per room

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);

    // Track user in room
    if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
    roomUsers[roomId].add(socket.id);

    console.log(`🟢 User ${socket.id} joined room: ${roomId}`);
    io.to(roomId).emit('user-connected', `👤 A new user joined`);
    io.to(roomId).emit('user-count', roomUsers[roomId].size);

    // Sync latest code/language to newly joined user
    if (roomState[roomId]) {
      socket.emit('code-update', roomState[roomId].code || '');
      socket.emit('language-update', roomState[roomId].language || 'javascript');
    }

    // Code changes
    socket.on('code-change', ({ roomId, code }) => {
      roomState[roomId] = roomState[roomId] || {};
      roomState[roomId].code = code;
      socket.to(roomId).emit('code-update', code);
    });

    // Language changes
    socket.on('language-change', ({ roomId, language }) => {
      roomState[roomId] = roomState[roomId] || {};
      roomState[roomId].language = language;
      socket.to(roomId).emit('language-update', language);
    });

    // On disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);

      if (roomUsers[roomId]) {
        roomUsers[roomId].delete(socket.id);

        // Notify remaining users
        socket.to(roomId).emit('user-disconnected', `⚠️ A user has left`);
        io.to(roomId).emit('user-count', roomUsers[roomId].size);

        // Cleanup if room is empty
        if (roomUsers[roomId].size === 0) {
          delete roomUsers[roomId];
          delete roomState[roomId];
        }
      }
    });
  });
});

// ==============================
// MongoDB + Start Server
// ==============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(5000, () => console.log('🚀 Server listening on port 5000'));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
