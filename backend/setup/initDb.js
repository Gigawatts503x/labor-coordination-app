import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../data/labor.db');

export let db;

export function initializeDatabase() {
  try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    const SCHEMA = {
      sqlite: `
        -- Events table
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          client_name TEXT,
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

        -- Event requirements (positions needed)
        CREATE TABLE IF NOT EXISTS event_requirements (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          position TEXT NOT NULL,
          location TEXT,
          date TEXT,
          requirement_date TEXT,
          requirement_end_date TEXT,
          set_time TEXT,
          strike_time TEXT,
          techs_needed INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Technicians
        CREATE TABLE IF NOT EXISTS technicians (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          hourly_rate REAL DEFAULT 50,
          halfday_rate REAL DEFAULT 250,
          fullday_rate REAL DEFAULT 500,
          skills TEXT,
          phone TEXT,
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Event assignments (techs assigned to events)
        CREATE TABLE IF NOT EXISTS event_assignments (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          requirement_id TEXT,
          technician_id TEXT NOT NULL,
          position TEXT,
          location TEXT,
          assignment_date TEXT,
          start_time TEXT,
          end_time TEXT,
          hours_worked REAL DEFAULT 0,
          rate_type TEXT DEFAULT 'hourly',
          calculated_pay REAL DEFAULT 0,
          customer_bill REAL DEFAULT 0,
          notes TEXT,
          base_hours REAL DEFAULT 0,
          ot_hours REAL DEFAULT 0,
          dt_hours REAL DEFAULT 0,
          tech_hourly_rate REAL,
          tech_halfday_rate REAL,
          tech_fullday_rate REAL,
          bill_hourly_rate REAL,
          bill_halfday_rate REAL,
          bill_fullday_rate REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id),
          FOREIGN KEY (requirement_id) REFERENCES event_requirements(id),
          FOREIGN KEY (technician_id) REFERENCES technicians(id)
        );

        -- Settings (global defaults)
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          halfday_hours INTEGER DEFAULT 5,
          fullday_hours INTEGER DEFAULT 10,
          ot_threshold INTEGER DEFAULT 10,
          dot_threshold INTEGER DEFAULT 20,
          dot_start_hour INTEGER DEFAULT 20,
          tech_base_rate REAL DEFAULT 50,
          customer_base_rate REAL DEFAULT 75,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Event-level rate overrides
        CREATE TABLE IF NOT EXISTS event_settings (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL UNIQUE,
          tech_hourly_rate REAL,
          tech_halfday_rate REAL,
          tech_fullday_rate REAL,
          bill_hourly_rate REAL,
          bill_halfday_rate REAL,
          bill_fullday_rate REAL,
          ot_threshold INTEGER,
          dot_start_hour INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Schedule history for undo/redo
        CREATE TABLE IF NOT EXISTS schedule_history (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          before_state TEXT,
          after_state TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Positions reference table
        CREATE TABLE IF NOT EXISTS positions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Rate configurations (per-event)
        CREATE TABLE IF NOT EXISTS rate_configs (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          overtime_threshold INTEGER DEFAULT 8,
          overtime_multiplier REAL DEFAULT 1.5,
          billing_multiplier REAL DEFAULT 1.3,
          rounding_mode TEXT DEFAULT 'round',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Invoices
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          amount REAL DEFAULT 0,
          status TEXT DEFAULT 'draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
        CREATE INDEX IF NOT EXISTS idx_requirements_event ON event_requirements(event_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_event ON event_assignments(event_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_tech ON event_assignments(technician_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_requirement ON event_assignments(requirement_id);
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON schedule_history(timestamp);
      `,
      postgres: `
        -- Events table
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          client_name TEXT,
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Event requirements
        CREATE TABLE IF NOT EXISTS event_requirements (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          position TEXT NOT NULL,
          location TEXT,
          date TEXT,
          requirement_date TEXT,
          requirement_end_date TEXT,
          set_time TEXT,
          strike_time TEXT,
          techs_needed INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Technicians
        CREATE TABLE IF NOT EXISTS technicians (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          hourly_rate REAL DEFAULT 50,
          halfday_rate REAL DEFAULT 250,
          fullday_rate REAL DEFAULT 500,
          skills TEXT,
          phone TEXT,
          email TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Event assignments
        CREATE TABLE IF NOT EXISTS event_assignments (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          requirement_id TEXT,
          technician_id TEXT NOT NULL,
          position TEXT,
          location TEXT,
          assignment_date TEXT,
          start_time TEXT,
          end_time TEXT,
          hours_worked REAL DEFAULT 0,
          rate_type TEXT DEFAULT 'hourly',
          calculated_pay REAL DEFAULT 0,
          customer_bill REAL DEFAULT 0,
          notes TEXT,
          base_hours REAL DEFAULT 0,
          ot_hours REAL DEFAULT 0,
          dt_hours REAL DEFAULT 0,
          tech_hourly_rate REAL,
          tech_halfday_rate REAL,
          tech_fullday_rate REAL,
          bill_hourly_rate REAL,
          bill_halfday_rate REAL,
          bill_fullday_rate REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id),
          FOREIGN KEY (requirement_id) REFERENCES event_requirements(id),
          FOREIGN KEY (technician_id) REFERENCES technicians(id)
        );

        -- Settings
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          halfday_hours INTEGER DEFAULT 5,
          fullday_hours INTEGER DEFAULT 10,
          ot_threshold INTEGER DEFAULT 10,
          dot_threshold INTEGER DEFAULT 20,
          dot_start_hour INTEGER DEFAULT 20,
          tech_base_rate REAL DEFAULT 50,
          customer_base_rate REAL DEFAULT 75,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Event-level rate overrides
        CREATE TABLE IF NOT EXISTS event_settings (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL UNIQUE,
          tech_hourly_rate REAL,
          tech_halfday_rate REAL,
          tech_fullday_rate REAL,
          bill_hourly_rate REAL,
          bill_halfday_rate REAL,
          bill_fullday_rate REAL,
          ot_threshold INTEGER,
          dot_start_hour INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Schedule history for undo/redo
        CREATE TABLE IF NOT EXISTS schedule_history (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          before_state TEXT,
          after_state TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Positions
        CREATE TABLE IF NOT EXISTS positions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Rate configurations
        CREATE TABLE IF NOT EXISTS rate_configs (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          overtime_threshold INTEGER DEFAULT 8,
          overtime_multiplier REAL DEFAULT 1.5,
          billing_multiplier REAL DEFAULT 1.3,
          rounding_mode TEXT DEFAULT 'round',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Invoices
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          amount REAL DEFAULT 0,
          status TEXT DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (event_id) REFERENCES events(id)
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
        CREATE INDEX IF NOT EXISTS idx_requirements_event ON event_requirements(event_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_event ON event_assignments(event_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_tech ON event_assignments(technician_id);
        CREATE INDEX IF NOT EXISTS idx_assignments_requirement ON event_assignments(requirement_id);
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON schedule_history(timestamp);
      `
    };

    // Execute SQLite schema
    const statements = SCHEMA.sqlite.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        db.exec(statement);
      }
    }

    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (error) {
    console.error('Run error:', error);
    throw error;
  }
}

export default db;
