const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth.routes');
const webhookRoutes = require('./routes/webhook.routes');
const reviewRoutes = require('./routes/reviews.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const repoRoutes = require('./routes/repos.routes');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to routes
app.set('io', io);

// Webhook route must get raw body for signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/repos', repoRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join:repo', (repoId) => socket.join(`repo:${repoId}`));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

module.exports = { app, httpServer };
