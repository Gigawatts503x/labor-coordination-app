// backend/config/database.js
// Database connection and initialization
// WHAT THIS DOES:
// - Connects to PostgreSQL (production) or SQLite (development)
// - Exports a query function that the rest of the app uses
// - Runs SQL setup if needed

import pg from 'pg';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const USE_POSTGRES = process.env.DB_TYPE === 'postgres';
const USE_SQLITE = !USE_POSTGRES;

let db = null;

// ============================================
// PostgreSQL Configuration (for Synology NAS)
// ============================================
if (USE_POSTGRES) {
  const { Client } = pg;
  
  db = new Client({
    user: process.env.DB_USER || 'labor_admin',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'labor_coordinator',
  });

  db.connect((err) => {
    if (err) {
      console.error('❌ Database connection error:', err);
      process.exit(1);
    }
    console.log('✅ Connected to PostgreSQL');
  });
}

// ============================================
// SQLite Configuration (for local development)
// ============================================
if (USE_SQLITE) {
  // SQLite is simpler - just opens a file
  db = new sqlite3.Database('./data/labor.db', (err) => {
    if (err) {
      console.error('❌ SQLite error:', err);
    } else {
      console.log('✅ Connected to SQLite (local dev mode)');
    }
  });
  
  // Enable foreign keys for SQLite
  db.run('PRAGMA foreign_keys = ON');
}

/**
 * Execute a SQL query
 * USAGE: const result = await query('SELECT * FROM events WHERE id = $1', [eventId]);
 */
export async function query(sql, params = []) {
  if (USE_POSTGRES) {
    try {
      const result = await db.query(sql, params);
      return result.rows;
    } catch (err) {
      console.error('Query error:', err, 'SQL:', sql);
      throw err;
    }
  }
  
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

/**
 * Run a single SQL statement (INSERT, UPDATE, DELETE)
 * USAGE: await run('DELETE FROM events WHERE id = $1', [eventId]);
 */
export async function run(sql, params = []) {
  if (USE_POSTGRES) {
    try {
      const result = await db.query(sql, params);
      return result;
    } catch (err) {
      console.error('Run error:', err);
      throw err;
    }
  }
  
  if (USE_SQLITE) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, (err) => {
        if (err) {
          console.error('Run error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * Close database connection cleanly
 */
export function closeConnection() {
  if (USE_POSTGRES) {
    db.end(() => console.log('PostgreSQL connection closed'));
  }
  if (USE_SQLITE) {
    db.close(() => console.log('SQLite connection closed'));
  }
}

export default { query, run, closeConnection };
