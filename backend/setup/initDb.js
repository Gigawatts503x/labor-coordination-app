import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const dataDir = path.join(dirname, '../../data');
const DBPATH = path.join(dataDir, 'labor.db');

export let db;

export function initializeDatabase() {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${dataDir}`);
    }

    console.log(`📦 Initializing database at: ${DBPATH}`);
    
    db = new Database(DBPATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Array of individual CREATE TABLE statements
    const statements = [
      // Events table
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        clientname TEXT,
        clientcontact TEXT,
        clientphone TEXT,
        clientemail TEXT,
        clientaddress TEXT,
        ponumber TEXT,
        startdate TEXT,
        enddate TEXT,
        totaltechpayout REAL DEFAULT 0,
        totallaborcost REAL DEFAULT 0,
        totalcustomerbilling REAL DEFAULT 0,
        createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Event requirements table
      `CREATE TABLE IF NOT EXISTS eventrequirements (
        id TEXT PRIMARY KEY,
        eventid TEXT NOT NULL,
        requirementdate TEXT,
        requirementenddate TEXT,
        roomorlocation TEXT,
        settime TEXT,
        starttime TEXT NOT NULL,
        endtime TEXT NOT NULL,
        striketime TEXT,
        position TEXT,
        techsneeded INTEGER DEFAULT 1,
        createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventid) REFERENCES events(id) ON DELETE CASCADE
      )`,
      
      // Technicians table
      `CREATE TABLE IF NOT EXISTS technicians (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        position TEXT,
        hourlyrate REAL DEFAULT 50,
        halfdayrate REAL DEFAULT 250,
        fulldayrate REAL DEFAULT 500,
        createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Event assignments table
      `CREATE TABLE IF NOT EXISTS eventassignments (
        id TEXT PRIMARY KEY,
        eventid TEXT NOT NULL,
        technicianid TEXT NOT NULL,
        requirementid TEXT,
        position TEXT,
        roomorlocation TEXT,
        hoursworked REAL DEFAULT 0,
        basehours REAL DEFAULT 0,
        othours REAL DEFAULT 0,
        dothours REAL DEFAULT 0,
        ratetype TEXT,
        techhourlyrate REAL,
        techhalfdayrate REAL,
        techfulldayrate REAL,
        billhourlyrate REAL,
        billhalfdayrate REAL,
        billfulldayrate REAL,
        calculatedpay REAL DEFAULT 0,
        customerbill REAL DEFAULT 0,
        notes TEXT,
        assignmentdate TEXT,
        starttime TEXT,
        endtime TEXT,
        createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventid) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (technicianid) REFERENCES technicians(id) ON DELETE CASCADE,
        FOREIGN KEY (requirementid) REFERENCES eventrequirements(id) ON DELETE SET NULL
      )`,
      
      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        halfdayhours INTEGER DEFAULT 5,
        fulldayhours INTEGER DEFAULT 10,
        otthreshold INTEGER DEFAULT 10,
        dotthreshold INTEGER DEFAULT 20,
        dotstarthour INTEGER DEFAULT 20,
        techbaserate REAL DEFAULT 50,
        customerbaserate REAL DEFAULT 75,
        updatedat DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Event settings table
      `CREATE TABLE IF NOT EXISTS eventsettings (
        id TEXT PRIMARY KEY,
        eventid TEXT NOT NULL UNIQUE,
        techhourlyrate REAL,
        techhalfdayrate REAL,
        techfulldayrate REAL,
        billhourlyrate REAL,
        billhalfdayrate REAL,
        billfulldayrate REAL,
        halfdayhours INTEGER,
        fulldayhours INTEGER,
        otthreshold INTEGER,
        dotthreshold INTEGER,
        dotstarthour INTEGER,
        createdat DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventid) REFERENCES events(id) ON DELETE CASCADE
      )`,
      
      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_events_created ON events(createdat)`,
      `CREATE INDEX IF NOT EXISTS idx_requirements_event ON eventrequirements(eventid)`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_event ON eventassignments(eventid)`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_tech ON eventassignments(technicianid)`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_requirement ON eventassignments(requirementid)`
    ];

    // Execute each statement using db.prepare().run() - THE CORRECT WAY
    let successCount = 0;
    for (const stmt of statements) {
      try {
        const trimmed = stmt.trim();
        if (trimmed) {
          // Use prepare().run() instead of exec() - this is the correct better-sqlite3 API
          const prepared = db.prepare(trimmed);
          prepared.run();
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        // Log which statement failed
        console.error(`Failed statement: ${stmt.substring(0, 50)}...`);
        throw error;
      }
    }

    console.log(`✅ Database initialized successfully`);
    console.log(`✅ All ${successCount} statements executed`);
    console.log(`✅ Tables created: events, eventrequirements, technicians, eventassignments, settings, eventsettings, indexes`);
    
    return db;
  } catch (error) {
    console.error(`❌ Database initialization error: ${error.message}`);
    console.error('Error details:', error);
    throw error;
  }
}

export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
}

export function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (error) {
    console.error('❌ Run error:', error);
    throw error;
  }
}

export default db;
