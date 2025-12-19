import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/labor.db');
const db = new sqlite3(dbPath);

console.log('🔄 Running technicians schema migration...');

try {
  const migrations = [
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS phone TEXT;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS email TEXT;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS ratetype TEXT;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS techhourlyrate REAL;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS techhalfdayrate REAL;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS techfulldayrate REAL;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS billhourlyrate REAL;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS billhalfdayrate REAL;',
    'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS billfulldayrate REAL;',
  ];

  migrations.forEach((sql, index) => {
    try {
      db.exec(sql);
      console.log(`✅ Migration ${index + 1} complete`);
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log(`⏭️  Migration ${index + 1} skipped (column already exists)`);
      } else {
        throw error;
      }
    }
  });

  console.log('✅ All migrations complete!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

