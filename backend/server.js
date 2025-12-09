// backend/server.js
// Main Express server entry point
// WHAT THIS DOES:
// - Creates an Express app
// - Sets up routes (API endpoints)
// - Starts listening for requests on port 3001
// - Serves API for the frontend to communicate with

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './setup/initDb.js';
import eventsRouter from './routes/events.js';
import techniciansRouter from './routes/technicians.js';
import positionsRouter from './routes/positions.js';
import assignmentsRouter from './routes/assignments.js';
import requirementsRouter from './routes/requirements.js';

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// CORS: Allow frontend (running on port 3000) to make requests to this backend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Parse JSON: Convert JSON in request body to JavaScript objects
app.use(express.json());

// Parse URL-encoded: Handle form data
app.use(express.urlencoded({ extended: true }));

// Logging middleware: Log every request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Mount routers under /api
app.use('/api', eventsRouter);
app.use('/api', techniciansRouter);
app.use('/api', positionsRouter);
app.use('/api', assignmentsRouter);
app.use('/api', requirementsRouter);

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    console.log('📦 Initializing database (sqlite)...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
