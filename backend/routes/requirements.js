import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/events/:eventId/requirements/with-coverage
 * Get all requirements with assigned technician details
 */
router.get('/events/:eventId/requirements/with-coverage', async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const requirements = await query(
      `SELECT
        er.*,
        COUNT(DISTINCT ea.id) as assigned_count,
        GROUP_CONCAT(DISTINCT t.id) as assigned_tech_ids,
        GROUP_CONCAT(DISTINCT t.name) as assigned_tech_names
      FROM event_requirements er
      LEFT JOIN event_assignments ea ON ea.requirement_id = er.id
      LEFT JOIN technicians t ON t.id = ea.technician_id
      WHERE er.event_id = ?
      GROUP BY er.id
      ORDER BY er.start_time ASC`,
      [eventId]
    );

    // Transform the comma-separated strings into arrays of objects
    const formattedRequirements = requirements.map(req => {
      const ids = req.assigned_tech_ids ? req.assigned_tech_ids.split(',').filter(Boolean) : [];
      const names = req.assigned_tech_names ? req.assigned_tech_names.split(',').filter(Boolean) : [];

      return {
        ...req,
        assigned_count: parseInt(req.assigned_count) || 0,
        assigned_techs: ids.map((id, idx) => ({
          id,
          name: names[idx] || 'Unknown'
        }))
      };
    });

    res.json(formattedRequirements);
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
      requirement_end_date,
      room_or_location,
      set_time,
      start_time,
      end_time,
      strike_time,
      position,
      techs_needed
    } = req.body;

    await run(
      `INSERT INTO event_requirements
      (id, event_id, requirement_date, requirement_end_date, room_or_location,
       set_time, start_time, end_time, strike_time,
       position, techs_needed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        requirement_date || null,
        requirement_end_date || null,
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
      `SELECT er.*,
        COUNT(ea.id) as assigned_techs
      FROM event_requirements er
      LEFT JOIN event_assignments ea ON ea.requirement_id = er.id
      WHERE er.id = ?
      GROUP BY er.id`,
      [id]
    );

    res.status(201).json(requirement);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/requirements/:id
 * Update a requirement (individual fields)
 */
router.patch('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      requirement_date,
      requirement_end_date,
      room_or_location,
      set_time,
      start_time,
      end_time,
      strike_time,
      position,
      techs_needed
    } = req.body;

    // Build dynamic UPDATE based on which fields are provided
    const updates = [];
    const values = [];

    if (requirement_date !== undefined) {
      updates.push('requirement_date = ?');
      values.push(requirement_date || null);
    }
    if (requirement_end_date !== undefined) {
      updates.push('requirement_end_date = ?');
      values.push(requirement_end_date || null);
    }
    if (room_or_location !== undefined) {
      updates.push('room_or_location = ?');
      values.push(room_or_location || null);
    }
    if (set_time !== undefined) {
      updates.push('set_time = ?');
      values.push(set_time || null);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time || null);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time || null);
    }
    if (strike_time !== undefined) {
      updates.push('strike_time = ?');
      values.push(strike_time || null);
    }
    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position || null);
    }
    if (techs_needed !== undefined) {
      updates.push('techs_needed = ?');
      values.push(techs_needed || 1);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await run(
      `UPDATE event_requirements
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );

    const [requirement] = await query(
      `SELECT er.*,
        COUNT(ea.id) as assigned_techs
      FROM event_requirements er
      LEFT JOIN event_assignments ea ON ea.requirement_id = er.id
      WHERE er.id = ?
      GROUP BY er.id`,
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
 * PUT /api/requirements/:id
 * Full update of a requirement (all fields)
 */
router.put('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      requirement_date,
      requirement_end_date,
      room_or_location,
      set_time,
      start_time,
      end_time,
      strike_time,
      position,
      techs_needed
    } = req.body;

    await run(
      `UPDATE event_requirements
       SET requirement_date = ?,
           requirement_end_date = ?,
           room_or_location = ?,
           set_time = ?,
           start_time = ?,
           end_time = ?,
           strike_time = ?,
           position = ?,
           techs_needed = ?
       WHERE id = ?`,
      [
        requirement_date || null,
        requirement_end_date || null,
        room_or_location || null,
        set_time || null,
        start_time || null,
        end_time || null,
        strike_time || null,
        position || null,
        techs_needed || 1,
        id
      ]
    );

    const [requirement] = await query(
      `SELECT er.*,
        COUNT(ea.id) as assigned_techs
      FROM event_requirements er
      LEFT JOIN event_assignments ea ON ea.requirement_id = er.id
      WHERE er.id = ?
      GROUP BY er.id`,
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