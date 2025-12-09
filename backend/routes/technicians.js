import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

router.get('/technicians', async (req, res, next) => {
  try {
    const technicians = await query('SELECT * FROM technicians ORDER BY name ASC');
    res.json(technicians);
  } catch (err) {
    next(err);
  }
});

router.post('/technicians', async (req, res, next) => {
  try {
    const id = uuid();
    const { name, position, hourly_rate, half_day_rate, full_day_rate } = req.body;

    await run(
      `INSERT INTO technicians (id, name, position, hourly_rate, half_day_rate, full_day_rate, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, position || null, hourly_rate || 0, half_day_rate || 0, full_day_rate || 0, new Date().toISOString()]
    );

    const [tech] = await query('SELECT * FROM technicians WHERE id = ?', [id]);
    res.status(201).json(tech);
  } catch (err) {
    next(err);
  }
});

router.get('/technicians/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [tech] = await query('SELECT * FROM technicians WHERE id = ?', [id]);
    if (!tech) return res.status(404).json({ error: 'Technician not found' });
    res.json(tech);
  } catch (err) {
    next(err);
  }
});

router.put('/technicians/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, hourly_rate, half_day_rate, full_day_rate } = req.body;

    await run(
      `UPDATE technicians SET name = ?, position = ?, hourly_rate = ?, half_day_rate = ?, full_day_rate = ?, updated_at = ? WHERE id = ?`,
      [name, position || null, hourly_rate || 0, half_day_rate || 0, full_day_rate || 0, new Date().toISOString(), id]
    );

    const [tech] = await query('SELECT * FROM technicians WHERE id = ?', [id]);
    if (!tech) return res.status(404).json({ error: 'Technician not found' });
    res.json(tech);
  } catch (err) {
    next(err);
  }
});

router.delete('/technicians/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM technicians WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/technicians/:techId/schedule
// All assignments for a technician across all events
router.get('/technicians/:techId/schedule', async (req, res, next) => {
  try {
    const { techId } = req.params;

    const assignments = await query(
      `
      SELECT ea.*,
             e.name AS event_name,
             e.client_name
      FROM event_assignments ea
      JOIN events e ON e.id = ea.event_id
      WHERE ea.technician_id = ?
      ORDER BY ea.assignment_date ASC, ea.start_time ASC, ea.created_at ASC
      `,
      [techId]
    );

    res.json(assignments);
  } catch (err) {
    next(err);
  }
});


export default router;
