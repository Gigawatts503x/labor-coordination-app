// backend/setup/initDb.js

// Database initialization - creates tables and exports db instance

// Called once by server.js at startup

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const dataDir = path.join(dirname, '../../data');
const DBPATH = path.join(dataDir, 'labor.db');

export let db;

export async function initializeDatabase() {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${dataDir}`);
    }

    console.log(`📦 Opening database: ${DBPATH}`);
    db = new Database(DBPATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create all tables
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

      // ✅ POSITIONS TABLE - NEW
      `CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        createdat DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_events_created ON events(createdat)`,
      `CREATE INDEX IF NOT EXISTS idx_requirements_event ON eventrequirements(eventid)`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_event ON eventassignments(eventid)`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_tech ON eventassignments(technicianid)`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_requirement ON eventassignments(requirementid)`,
      `CREATE INDEX IF NOT EXISTS idx_positions_name ON positions(name)`,
    ];

    let successCount = 0;
    for (const stmt of statements) {
      try {
        const trimmed = stmt.trim();
        if (trimmed) {
          const prepared = db.prepare(trimmed);
          prepared.run();
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        throw error;
      }
    }

    console.log(`✅ All ${successCount} statements executed`);
    console.log(
      `✅ Tables created: events, eventrequirements, technicians, eventassignments, settings, eventsettings, positions`
    );

    // ✅ Initialize sample positions if table is empty
    try {
      const checkPositions = db.prepare('SELECT COUNT(*) as count FROM positions');
      const result = checkPositions.all()[0];

      if (result.count === 0) {
        console.log('📍 Initializing sample positions...');
        const insertPosition = db.prepare('INSERT INTO positions (name) VALUES (?)');

        const samplePositions = [
          'A1', 'A2', 'V1', 'V2', 'LED', 'Set', 'Camera Op',
          'L1', 'L2', 'PM', 'Strike', 'Projections', 'LD Floater', 'Rigger Lead'
        ];

        samplePositions.forEach((position) => {
          try {
            insertPosition.run(position);
            console.log(`  ✅ Added position: ${position}`);
          } catch (err) {
            // Position might already exist, skip
          }
        });

        console.log('✅ Sample positions initialized successfully');
      } else {
        console.log(`✅ Positions table ready (${result.count} positions found)`);
      }
    } catch (err) {
      console.warn('⚠️  Could not initialize sample positions:', err.message);
    }

    return db;
  } catch (error) {
    console.error(`❌ Database initialization error: ${error.message}`);
    process.exit(1);
  }
}

export default db;