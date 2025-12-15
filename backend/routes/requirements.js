import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

// GET all requirements for an event
router.get('/events/:eventId/requirements', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const requirements = await query(
      'SELECT * FROM event_requirements WHERE event_id = ? ORDER BY requirement_date, set_time',
      [eventId]
    );
    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

// GET requirement with coverage info
router.get('/events/:eventId/requirements-with-coverage', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const requirements = await query(
      `SELECT er.*,
              COUNT(ea.id) as assignedCount
       FROM event_requirements er
       LEFT JOIN event_assignments ea ON er.id = ea.requirement_id
       WHERE er.event_id = ?
       GROUP BY er.id
       ORDER BY er.requirement_date, er.set_time`,
      [eventId]
    );
    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

// GET single requirement
router.get('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [requirement] = await query('SELECT * FROM event_requirements WHERE id = ?', [id]);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });
    res.json(requirement);
  } catch (err) {
    next(err);
  }
});

// POST create requirement
router.post('/events/:eventId/requirements', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const {
      position,
      location,
      date,
      requirement_date,
      requirement_end_date,
      set_time,
      strike_time,
      techs_needed
    } = req.body;

    const id = uuid();
    await run(
      `INSERT INTO event_requirements 
       (id, event_id, position, location, date, requirement_date, requirement_end_date, set_time, strike_time, techs_needed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        position,
        location || null,
        date || null,
        requirement_date || null,
        requirement_end_date || null,
        set_time || null,
        strike_time || null,
        techs_needed || 1,
        new Date().toISOString()
      ]
    );

    const [requirement] = await query('SELECT * FROM event_requirements WHERE id = ?', [id]);
    res.status(201).json(requirement);
  } catch (err) {
    next(err);
  }
});

// PATCH update requirement
router.patch('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      position,
      location,
      date,
      requirement_date,
      requirement_end_date,
      set_time,
      strike_time,
      techs_needed
    } = req.body;

    // Build dynamic update
    const updates = [];
    const values = [];

    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      values.push(date);
    }
    if (requirement_date !== undefined) {
      updates.push('requirement_date = ?');
      values.push(requirement_date);
    }
    if (requirement_end_date !== undefined) {
      updates.push('requirement_end_date = ?');
      values.push(requirement_end_date);
    }
    if (set_time !== undefined) {
      updates.push('set_time = ?');
      values.push(set_time);
    }
    if (strike_time !== undefined) {
      updates.push('strike_time = ?');
      values.push(strike_time);
    }
    if (techs_needed !== undefined) {
      updates.push('techs_needed = ?');
      values.push(techs_needed);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 1) {
      const sql = `UPDATE event_requirements SET ${updates.join(', ')} WHERE id = ?`;
      await run(sql, values);
    }

    const [requirement] = await query('SELECT * FROM event_requirements WHERE id = ?', [id]);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });
    res.json(requirement);
  } catch (err) {
    next(err);
  }
});

// DELETE requirement
router.delete('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Delete assignments first
    await run('DELETE FROM event_assignments WHERE requirement_id = ?', [id]);
    // Delete requirement
    await run('DELETE FROM event_requirements WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET locations for an event (from requirements)
router.get('/events/:eventId/locations', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const locations = await query(
      `SELECT DISTINCT location FROM event_requirements 
       WHERE event_id = ? AND location IS NOT NULL
       ORDER BY location`,
      [eventId]
    );
    res.json(locations.map(l => l.location));
  } catch (err) {
    next(err);
  }
});

export default router;
