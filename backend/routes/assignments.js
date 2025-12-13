import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

/**
 * GET /api/events/:eventId/assignments
 * Get all assignments for an event
 */
router.get('/events/:eventId/assignments', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const assignments = await query(
      `SELECT
        ea.*,
        t.name as technician_name,
        t.position as tech_default_position
      FROM event_assignments ea
      LEFT JOIN technicians t ON t.id = ea.technician_id
      WHERE ea.event_id = ?
      ORDER BY ea.assignment_date ASC, ea.start_time ASC`,
      [eventId]
    );
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/events/:eventId/assignments
 * Create a new assignment for an event
 * FIXED: Correct number of values for all columns including requirement_id, base_hours, ot_hours, dot_hours
 */
router.post('/events/:eventId/assignments', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const id = uuid();
    const {
      technician_id,
      position,
      hours_worked = 0,
      rate_type = 'hourly',
      assignment_date,
      start_time,
      end_time,
      requirement_id,
      tech_hourly_rate,
      tech_half_day_rate,
      tech_full_day_rate,
      bill_hourly_rate,
      bill_half_day_rate,
      bill_full_day_rate,
      base_hours = 0,
      ot_hours = 0,
      dot_hours = 0
    } = req.body;

    console.log('📝 Creating assignment:', {
      eventId,
      technician_id,
      requirement_id,
      assignment_date,
      start_time,
      end_time
    });

    await run(
      `INSERT INTO event_assignments
      (id, event_id, technician_id, position, hours_worked, rate_type,
       assignment_date, start_time, end_time, requirement_id,
       tech_hourly_rate, tech_half_day_rate, tech_full_day_rate,
       bill_hourly_rate, bill_half_day_rate, bill_full_day_rate,
       base_hours, ot_hours, dot_hours,
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        technician_id || null,
        position || null,
        parseFloat(hours_worked) || 0,
        rate_type || 'hourly',
        assignment_date || null,
        start_time || null,
        end_time || null,
        requirement_id || null,
        tech_hourly_rate || null,
        tech_half_day_rate || null,
        tech_full_day_rate || null,
        bill_hourly_rate || null,
        bill_half_day_rate || null,
        bill_full_day_rate || null,
        parseFloat(base_hours) || 0,
        parseFloat(ot_hours) || 0,
        parseFloat(dot_hours) || 0,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const [assignment] = await query(
      `SELECT ea.*, t.name as technician_name
       FROM event_assignments ea
       LEFT JOIN technicians t ON t.id = ea.technician_id
       WHERE ea.id = ?`,
      [id]
    );

    console.log('✅ Assignment created:', assignment.id);
    res.status(201).json(assignment);
  } catch (err) {
    console.error('❌ Error creating assignment:', err.message);
    next(err);
  }
});

/**
 * PATCH /api/assignments/:id
 * Update a single field on an assignment (for inline cell edits)
 */
router.patch('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      position,
      hours_worked,
      rate_type,
      assignment_date,
      start_time,
      end_time,
      requirement_id,
      tech_hourly_rate,
      tech_half_day_rate,
      tech_full_day_rate,
      bill_hourly_rate,
      bill_half_day_rate,
      bill_full_day_rate,
      base_hours,
      ot_hours,
      dot_hours
    } = req.body;

    // Build dynamic UPDATE based on provided fields
    const updates = {};
    if (position !== undefined) updates.position = position;
    if (hours_worked !== undefined) updates.hours_worked = parseFloat(hours_worked) || 0;
    if (rate_type !== undefined) updates.rate_type = rate_type;
    if (assignment_date !== undefined) updates.assignment_date = assignment_date;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;
    if (requirement_id !== undefined) updates.requirement_id = requirement_id;
    if (tech_hourly_rate !== undefined) updates.tech_hourly_rate = tech_hourly_rate;
    if (tech_half_day_rate !== undefined) updates.tech_half_day_rate = tech_half_day_rate;
    if (tech_full_day_rate !== undefined) updates.tech_full_day_rate = tech_full_day_rate;
    if (bill_hourly_rate !== undefined) updates.bill_hourly_rate = bill_hourly_rate;
    if (bill_half_day_rate !== undefined) updates.bill_half_day_rate = bill_half_day_rate;
    if (bill_full_day_rate !== undefined) updates.bill_full_day_rate = bill_full_day_rate;
    if (base_hours !== undefined) updates.base_hours = parseFloat(base_hours) || 0;
    if (ot_hours !== undefined) updates.ot_hours = parseFloat(ot_hours) || 0;
    if (dot_hours !== undefined) updates.dot_hours = parseFloat(dot_hours) || 0;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);
    values.push(id);

    await run(
      `UPDATE event_assignments SET ${setClause} WHERE id = ?`,
      values
    );

    const [assignment] = await query(
      `SELECT ea.*, t.name as technician_name
       FROM event_assignments ea
       LEFT JOIN technicians t ON t.id = ea.technician_id
       WHERE ea.id = ?`,
      [id]
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/assignments/:id
 * Full update of an assignment (all fields)
 */
router.put('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      position,
      hours_worked = 0,
      rate_type = 'hourly',
      assignment_date,
      start_time,
      end_time,
      requirement_id,
      tech_hourly_rate,
      tech_half_day_rate,
      tech_full_day_rate,
      bill_hourly_rate,
      bill_half_day_rate,
      bill_full_day_rate,
      base_hours = 0,
      ot_hours = 0,
      dot_hours = 0
    } = req.body;

    await run(
      `UPDATE event_assignments
      SET position = ?,
          hours_worked = ?,
          rate_type = ?,
          assignment_date = ?,
          start_time = ?,
          end_time = ?,
          requirement_id = ?,
          tech_hourly_rate = ?,
          tech_half_day_rate = ?,
          tech_full_day_rate = ?,
          bill_hourly_rate = ?,
          bill_half_day_rate = ?,
          bill_full_day_rate = ?,
          base_hours = ?,
          ot_hours = ?,
          dot_hours = ?,
          updated_at = ?
      WHERE id = ?`,
      [
        position || null,
        parseFloat(hours_worked) || 0,
        rate_type || 'hourly',
        assignment_date || null,
        start_time || null,
        end_time || null,
        requirement_id || null,
        tech_hourly_rate || null,
        tech_half_day_rate || null,
        tech_full_day_rate || null,
        bill_hourly_rate || null,
        bill_half_day_rate || null,
        bill_full_day_rate || null,
        parseFloat(base_hours) || 0,
        parseFloat(ot_hours) || 0,
        parseFloat(dot_hours) || 0,
        new Date().toISOString(),
        id
      ]
    );

    const [assignment] = await query(
      `SELECT ea.*, t.name as technician_name
       FROM event_assignments ea
       LEFT JOIN technicians t ON t.id = ea.technician_id
       WHERE ea.id = ?`,
      [id]
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/assignments/:id
 * Delete an assignment
 */
router.delete('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM event_assignments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
