require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const scamRoutes = require('./routes/scamRoute');

const app = express();
const PUBLIC_DIR = path.join(__dirname, 'public');

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Guardian Path Scam Simulator API is running.' });
});

// Routes
app.use('/api/scam-sessions', scamRoutes);

app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
