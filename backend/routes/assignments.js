// backend/routes/assignments.js
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
      `
      SELECT ea.*,
             t.name AS technician_name,
             t.position AS technician_primary_position,
             e.name AS event_name,
             e.client_name
      FROM event_assignments ea
      JOIN technicians t ON t.id = ea.technician_id
      JOIN events e ON e.id = ea.event_id
      WHERE ea.event_id = ?
      ORDER BY ea.assignment_date ASC, ea.start_time ASC, ea.created_at ASC
      `,
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
 */
router.post('/events/:eventId/assignments', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const id = uuid();

    const {
      technician_id,
      position,
      hours_worked,
      rate_type,
      calculated_pay,
      customer_bill,
      assignment_date,
      start_time,
      end_time,
      requirement_id,
      notes
    } = req.body;

    await run(
      `
      INSERT INTO event_assignments
        (id, event_id, technician_id, position, hours_worked, rate_type,
         calculated_pay, customer_bill, assignment_date, start_time, end_time,
         requirement_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        eventId,
        technician_id,
        position || null,
        hours_worked || 0,
        rate_type || null,
        calculated_pay || 0,
        customer_bill || 0,
        assignment_date || null,
        start_time || null,
        end_time || null,
        requirement_id || null,
        notes || null
      ]
    );

    const [assignment] = await query(
      `
      SELECT ea.*,
             t.name AS technician_name,
             t.position AS technician_primary_position,
             e.name AS event_name,
             e.client_name
      FROM event_assignments ea
      JOIN technicians t ON t.id = ea.technician_id
      JOIN events e ON e.id = ea.event_id
      WHERE ea.id = ?
      `,
      [id]
    );

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/assignments/:id
 * Update an existing assignment
 */
router.put('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      position,
      hours_worked,
      rate_type,
      calculated_pay,
      customer_bill,
      assignment_date,
      start_time,
      end_time,
      requirement_id,
      notes
    } = req.body;

    await run(
      `
      UPDATE event_assignments
      SET position = ?,
          hours_worked = ?,
          rate_type = ?,
          calculated_pay = ?,
          customer_bill = ?,
          assignment_date = ?,
          start_time = ?,
          end_time = ?,
          requirement_id = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        position || null,
        hours_worked || 0,
        rate_type || null,
        calculated_pay || 0,
        customer_bill || 0,
        assignment_date || null,
        start_time || null,
        end_time || null,
        requirement_id || null,
        notes || null,
        id
      ]
    );

    const [assignment] = await query(
      `
      SELECT ea.*,
             t.name AS technician_name,
             t.position AS technician_primary_position,
             e.name AS event_name,
             e.client_name
      FROM event_assignments ea
      JOIN technicians t ON t.id = ea.technician_id
      JOIN events e ON e.id = ea.event_id
      WHERE ea.id = ?
      `,
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
