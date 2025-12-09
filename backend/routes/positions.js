// backend/routes/positions.js
import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

router.get('/technicians/:technicianId/positions', async (req, res, next) => {
  try {
    const { technicianId } = req.params;
    const positions = await query(
      'SELECT * FROM technician_positions WHERE technician_id = ? ORDER BY position_name ASC',
      [technicianId]
    );
    res.json(positions);
  } catch (err) {
    next(err);
  }
});

router.post('/positions', async (req, res, next) => {
  try {
    const id = uuid();
    const { technician_id, position_name } = req.body;

    if (!technician_id || !position_name) {
      return res.status(400).json({ error: 'technician_id and position_name required' });
    }

    await run(
      'INSERT INTO technician_positions (id, technician_id, position_name, created_at) VALUES (?, ?, ?, ?)',
      [id, technician_id, position_name, new Date().toISOString()]
    );

    const [position] = await query('SELECT * FROM technician_positions WHERE id = ?', [id]);

    res.status(201).json(position);
  } catch (err) {
    next(err);
  }
});

router.delete('/positions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM technician_positions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
