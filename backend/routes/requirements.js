// backend/routes/requirements.js
import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/events/:eventId/requirements
 * Get all requirements for an event
 */
router.get('/events/:eventId/requirements', async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const requirements = await query(
      `
      SELECT er.*,
             COUNT(ea.id) as assigned_techs
      FROM event_requirements er
      LEFT JOIN event_assignments ea ON ea.requirement_id = er.id
      WHERE er.event_id = ?
      GROUP BY er.id
      ORDER BY er.start_time ASC
      `,
      [eventId]
    );

    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/events/:eventId/requirements
 * Create a new requirement for an event
 */
router.post('/events/:eventId/requirements', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const id = uuid();

    const {
      requirement_date,
      room_or_location,
      set_time,
      start_time,
      end_time,
      strike_time,
      position,
      techs_needed
    } = req.body;



    await run(
      `
      INSERT INTO event_requirements
        (id, event_id, requirement_date, room_or_location,
        set_time, start_time, end_time, strike_time,
        position, techs_needed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,

      [
        id,
        eventId,
        requirement_date || null,
        room_or_location || null,
        set_time || null,
        start_time || null,
        end_time || null,
        strike_time || null,
        position || null,
        techs_needed || 1
      ]
    );

    const [requirement] = await query(
      `
      SELECT er.*,
             COUNT(ea.id) as assigned_techs
      FROM event_requirements er
      LEFT JOIN event_assignments ea ON ea.requirement_id = er.id
      WHERE er.id = ?
      GROUP BY er.id
      `,
      [id]
    );

    res.status(201).json(requirement);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/requirements/:id
 * Update a requirement
 */
router.put('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      requirement_date,
      room_or_location,
      set_time,
      start_time,
      end_time,
      strike_time,
      position,
      techs_needed
    } = req.body;

    await run(
      `
      UPDATE event_requirements
      SET room_or_location = ?,
          start_time = ?,
          end_time = ?,
          position = ?,
          techs_needed = ?
      WHERE id = ?
      `,
      [
        room_or_location || null,
        start_time || null,
        end_time || null,
        position || null,
        techs_needed || 1,
        id
      ]
    );

    const [requirement] = await query(
      `
      SELECT er.*,
             COUNT(ea.id) as assigned_techs
      FROM event_requirements er
      LEFT JOIN event_assignments ea ON ea.requirement_id = er.id
      WHERE er.id = ?
      GROUP BY er.id
      `,
      [id]
    );

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    res.json(requirement);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/requirements/:id
 * Delete a requirement
 */
router.delete('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await run('DELETE FROM event_requirements WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
