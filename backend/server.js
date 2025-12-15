// backend/server.js
// Main Express server - single source of truth for database initialization

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './setup/initDb.js';
import eventsRouter from './routes/index.js';
import techniciansRouter from './routes/index.js';
import requirementsRouter from './routes/index.js';
import assignmentsRouter from './routes/index.js';
import settingsRouter from './routes/index.js';
import positionsRouter from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// All routes use the same router from index.js
app.use('/api', eventsRouter);

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    console.log('📦 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
