// backend/config/database.js
// Simple wrapper around the better-sqlite3 instance from initDb.js
// All queries go through here

/**
 * Execute a SQL query - returns array of rows
 */
export async function query(sql, params = []) {
  try {
    // Import after server has initialized the db
    const { db } = await import('../setup/initDb.js');

    if (!db) {
      throw new Error('Database not initialized');
    }

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (err) {
    console.error('Query error:', err.message, '\nSQL:', sql);
    throw err;
  }
}

/**
 * Run a SQL statement (INSERT, UPDATE, DELETE)
 */
export async function run(sql, params = []) {
  try {
    const { db } = await import('../setup/initDb.js');

    if (!db) {
      throw new Error('Database not initialized');
    }

    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } catch (err) {
    console.error('Run error:', err.message, '\nSQL:', sql);
    throw err;
  }
}

/**
 * Close database connection
 */
export async function closeConnection() {
  try {
    const { db } = await import('../setup/initDb.js');
    if (db) {
      db.close();
      console.log('✅ SQLite connection closed');
    }
  } catch (err) {
    console.error('Error closing connection:', err);
  }
}

export default { query, run, closeConnection };
