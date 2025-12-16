import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// ========================
// POSITIONS ROUTES ✅ NEW
// ========================

// GET all positions
app.get('/api/settings/positions', (req, res) => {
  try {
    const stmt = db.prepare('SELECT name FROM positions ORDER BY name ASC');
    const positions = stmt.all();
    const positionNames = positions.map(p => p.name);
    console.log('✅ Fetched positions:', positionNames);
    res.json(positionNames);
  } catch (error) {
    console.error('❌ Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// CREATE position
app.post('/api/settings/positions', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Position name is required and must be a string' });
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return res.status(400).json({ error: 'Position name cannot be empty' });
    }

    // Check if position already exists
    const existing = db.prepare('SELECT id FROM positions WHERE name = ?').get(trimmedName);
    if (existing) {
      return res.status(409).json({ error: `Position "${trimmedName}" already exists` });
    }

    // Insert new position
    const stmt = db.prepare('INSERT INTO positions (name) VALUES (?)');
    const result = stmt.run(trimmedName);

    console.log(`✅ Created position: ${trimmedName}`);
    res.status(201).json({ id: result.lastInsertRowid, name: trimmedName });
  } catch (error) {
    console.error('❌ Error creating position:', error);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

// DELETE position
app.delete('/api/settings/positions/:name', (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);

    if (!decodedName) {
      return res.status(400).json({ error: 'Position name is required' });
    }

    // Check if position exists
    const existing = db.prepare('SELECT id FROM positions WHERE name = ?').get(decodedName);
    if (!existing) {
      return res.status(404).json({ error: `Position "${decodedName}" not found` });
    }

    // Check if position is in use by requirements
    const inUse = db.prepare(
      'SELECT COUNT(*) as count FROM requirements WHERE position = ?'
    ).get(decodedName);

    if (inUse.count > 0) {
      return res.status(409).json({
        error: `Cannot delete "${decodedName}": ${inUse.count} requirement(s) use this position`,
      });
    }

    // Delete position
    const stmt = db.prepare('DELETE FROM positions WHERE name = ?');
    stmt.run(decodedName);

    console.log(`✅ Deleted position: ${decodedName}`);
    res.json({ message: `Position "${decodedName}" deleted successfully` });
  } catch (error) {
    console.error('❌ Error deleting position:', error);
    res.status(500).json({ error: 'Failed to delete position' });
  }
});
