const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const scheduleRoutes = require('./routes/schedule');
const developerRoutes = require('./routes/developers');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/developers', developerRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'IMCPSS Backend is running!', status: 'OK' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`IMCPSS backend running on port ${PORT}`);
});

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);