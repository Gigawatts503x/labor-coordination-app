// backend/setup/initDb.js
// FIXED: Added requirement_id column to event_assignments table

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// SQL for creating all tables
const CREATE_TABLES_SQL = {
  sqlite: `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_contact TEXT,
      client_phone TEXT,
      client_email TEXT,
      client_address TEXT,
      po_number TEXT,
      start_date TEXT,
      end_date TEXT,
      total_tech_payout REAL DEFAULT 0,
      total_labor_cost REAL DEFAULT 0,
      total_customer_billing REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_requirements (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      requirement_date TEXT,
      requirement_end_date TEXT,
      room_or_location TEXT NOT NULL,
      set_time TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      strike_time TEXT,
      position TEXT,
      techs_needed INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT,
      hourly_rate REAL DEFAULT 0,
      half_day_rate REAL DEFAULT 0,
      full_day_rate REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS technician_positions (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      position_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
      UNIQUE(technician_id, position_name)
    );

    CREATE TABLE IF NOT EXISTS event_assignments (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      requirement_id TEXT,
      position TEXT,
      room_or_location TEXT,
      hours_worked REAL DEFAULT 0,
      rate_type TEXT,
      calculated_pay REAL DEFAULT 0,
      customer_bill REAL DEFAULT 0,
      assignment_date TEXT,
      start_time TEXT,
      end_time TEXT,
      notes TEXT,
      tech_hourly_rate REAL,
      tech_half_day_rate REAL,
      tech_full_day_rate REAL,
      bill_hourly_rate REAL,
      bill_half_day_rate REAL,
      bill_full_day_rate REAL,
      base_hours REAL DEFAULT 0,
      ot_hours REAL DEFAULT 0,
      dot_hours REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
      FOREIGN KEY(requirement_id) REFERENCES event_requirements(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS event_settings (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      tech_hourly_rate REAL,
      tech_half_day_rate REAL,
      tech_full_day_rate REAL,
      bill_hourly_rate REAL,
      bill_half_day_rate REAL,
      bill_full_day_rate REAL,
      halfday_hours INTEGER,
      fullday_hours INTEGER,
      ot_threshold INTEGER,
      dot_threshold INTEGER,
      dot_start_hour INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      tech_hourly_rate REAL DEFAULT 50,
      tech_half_day_rate REAL DEFAULT 250,
      tech_full_day_rate REAL DEFAULT 500,
      bill_hourly_rate REAL DEFAULT 75,
      bill_half_day_rate REAL DEFAULT 375,
      bill_full_day_rate REAL DEFAULT 750,
      halfday_hours INTEGER DEFAULT 5,
      fullday_hours INTEGER DEFAULT 10,
      ot_threshold INTEGER DEFAULT 10,
      dot_threshold INTEGER DEFAULT 20,
      dot_start_hour INTEGER DEFAULT 20,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `,

  postgres: `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_contact TEXT,
      client_phone TEXT,
      client_email TEXT,
      client_address TEXT,
      po_number TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_requirements (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      requirement_date TEXT,
      requirement_end_date TEXT,
      room_or_location TEXT NOT NULL,
      set_time TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      strike_time TEXT,
      position TEXT,
      techs_needed INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT,
      hourly_rate REAL DEFAULT 0,
      half_day_rate REAL DEFAULT 0,
      full_day_rate REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS technician_positions (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      position_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
      UNIQUE(technician_id, position_name)
    );

    CREATE TABLE IF NOT EXISTS event_assignments (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      requirement_id TEXT,
      position TEXT,
      room_or_location TEXT,
      hours_worked REAL DEFAULT 0,
      rate_type TEXT,
      calculated_pay REAL DEFAULT 0,
      customer_bill REAL DEFAULT 0,
      assignment_date TEXT,
      start_time TEXT,
      end_time TEXT,
      notes TEXT,
      tech_hourly_rate REAL,
      tech_half_day_rate REAL,
      tech_full_day_rate REAL,
      bill_hourly_rate REAL,
      bill_half_day_rate REAL,
      bill_full_day_rate REAL,
      base_hours REAL DEFAULT 0,
      ot_hours REAL DEFAULT 0,
      dot_hours REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(technician_id) REFERENCES technicians(id) ON DELETE CASCADE,
      FOREIGN KEY(requirement_id) REFERENCES event_requirements(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS event_settings (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      tech_hourly_rate REAL,
      tech_half_day_rate REAL,
      tech_full_day_rate REAL,
      bill_hourly_rate REAL,
      bill_half_day_rate REAL,
      bill_full_day_rate REAL,
      halfday_hours INTEGER,
      fullday_hours INTEGER,
      ot_threshold INTEGER,
      dot_threshold INTEGER,
      dot_start_hour INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      tech_hourly_rate REAL DEFAULT 50,
      tech_half_day_rate REAL DEFAULT 250,
      tech_full_day_rate REAL DEFAULT 500,
      bill_hourly_rate REAL DEFAULT 75,
      bill_half_day_rate REAL DEFAULT 375,
      bill_full_day_rate REAL DEFAULT 750,
      halfday_hours INTEGER DEFAULT 5,
      fullday_hours INTEGER DEFAULT 10,
      ot_threshold INTEGER DEFAULT 10,
      dot_threshold INTEGER DEFAULT 20,
      dot_start_hour INTEGER DEFAULT 20,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `
};

/**
 * Main initialization function
 * Runs SQL to create tables if they don't exist
 */
export async function initializeDatabase() {
  try {
    console.log(`\n📦 Initializing database (${DB_TYPE})...`);
    const db = Database('./data/labor.db');
    const sql = CREATE_TABLES_SQL[DB_TYPE];

    if (!sql) {
      throw new Error(`Unknown database type: ${DB_TYPE}`);
    }

    // For SQLite, split and execute each statement
    if (DB_TYPE === 'sqlite') {
      const statements = sql.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          db.exec(statement);
        }
      }
    }

    console.log('✅ Database initialized successfully');
    console.log('📊 Tables created: events, event_requirements, technicians, technician_positions, event_assignments (with requirement_id), event_settings, settings, audit_log, invoices\n');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  }
}

// Run if called directly
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
