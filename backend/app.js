const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const scheduleRoutes = require('./routes/schedule');
const developerRoutes = require('./routes/developers');
const adminRoutes = require('./routes/admin');

const app = express();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const allowedOrigins = (process.env.CORS_ORIGIN || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'IMCPSS Backend is running!', status: 'OK' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err.message);
  const isCorsError = err.message?.startsWith('CORS blocked for origin:');
  res.status(isCorsError ? 403 : 500).json({
    error: isCorsError ? err.message : 'Internal server error.',
  });
});

module.exports = app;
