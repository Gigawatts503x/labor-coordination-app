import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

// GET all assignments for an event
router.get('/events/:eventId/assignments', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const assignments = await query(
      `SELECT ea.*, t.name as tech_name, er.position as req_position
       FROM event_assignments ea
       LEFT JOIN technicians t ON ea.technician_id = t.id
       LEFT JOIN event_requirements er ON ea.requirement_id = er.id
       WHERE ea.event_id = ?
       ORDER BY ea.assignment_date, ea.start_time`,
      [eventId]
    );
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

// GET assignments for a specific date and location
router.get('/events/:eventId/assignments/slot/:date/:location', async (req, res, next) => {
  try {
    const { eventId, date, location } = req.params;
    const assignments = await query(
      `SELECT ea.*, t.name as tech_name
       FROM event_assignments ea
       LEFT JOIN technicians t ON ea.technician_id = t.id
       WHERE ea.event_id = ? AND ea.assignment_date = ? AND ea.location = ?
       ORDER BY ea.start_time`,
      [eventId, date, location]
    );
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

// GET single assignment
router.get('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [assignment] = await query(
      `SELECT ea.*, t.name as tech_name
       FROM event_assignments ea
       LEFT JOIN technicians t ON ea.technician_id = t.id
       WHERE ea.id = ?`,
      [id]
    );
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

// POST create assignment
router.post('/assignments', async (req, res, next) => {
  try {
    const {
      event_id,
      requirement_id,
      technician_id,
      position,
      location,
      assignment_date,
      start_time,
      end_time,
      hours_worked,
      rate_type,
      calculated_pay,
      customer_bill,
      notes,
      base_hours,
      ot_hours,
      dt_hours
    } = req.body;

    const id = uuid();
    await run(
      `INSERT INTO event_assignments 
       (id, event_id, requirement_id, technician_id, position, location, assignment_date, 
        start_time, end_time, hours_worked, rate_type, calculated_pay, customer_bill, 
        notes, base_hours, ot_hours, dt_hours, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        event_id,
        requirement_id || null,
        technician_id,
        position || null,
        location || null,
        assignment_date || null,
        start_time || null,
        end_time || null,
        hours_worked || 0,
        rate_type || 'hourly',
        calculated_pay || 0,
        customer_bill || 0,
        notes || null,
        base_hours || 0,
        ot_hours || 0,
        dt_hours || 0,
        new Date().toISOString()
      ]
    );

    const [assignment] = await query('SELECT * FROM event_assignments WHERE id = ?', [id]);
    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
});

// PATCH update assignment
router.patch('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      position,
      location,
      assignment_date,
      start_time,
      end_time,
      hours_worked,
      rate_type,
      calculated_pay,
      customer_bill,
      notes,
      base_hours,
      ot_hours,
      dt_hours,
      tech_hourly_rate,
      tech_halfday_rate,
      tech_fullday_rate,
      bill_hourly_rate,
      bill_halfday_rate,
      bill_fullday_rate
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
    if (assignment_date !== undefined) {
      updates.push('assignment_date = ?');
      values.push(assignment_date);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time);
    }
    if (hours_worked !== undefined) {
      updates.push('hours_worked = ?');
      values.push(hours_worked);
    }
    if (rate_type !== undefined) {
      updates.push('rate_type = ?');
      values.push(rate_type);
    }
    if (calculated_pay !== undefined) {
      updates.push('calculated_pay = ?');
      values.push(calculated_pay);
    }
    if (customer_bill !== undefined) {
      updates.push('customer_bill = ?');
      values.push(customer_bill);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (base_hours !== undefined) {
      updates.push('base_hours = ?');
      values.push(base_hours);
    }
    if (ot_hours !== undefined) {
      updates.push('ot_hours = ?');
      values.push(ot_hours);
    }
    if (dt_hours !== undefined) {
      updates.push('dt_hours = ?');
      values.push(dt_hours);
    }
    if (tech_hourly_rate !== undefined) {
      updates.push('tech_hourly_rate = ?');
      values.push(tech_hourly_rate);
    }
    if (tech_halfday_rate !== undefined) {
      updates.push('tech_halfday_rate = ?');
      values.push(tech_halfday_rate);
    }
    if (tech_fullday_rate !== undefined) {
      updates.push('tech_fullday_rate = ?');
      values.push(tech_fullday_rate);
    }
    if (bill_hourly_rate !== undefined) {
      updates.push('bill_hourly_rate = ?');
      values.push(bill_hourly_rate);
    }
    if (bill_halfday_rate !== undefined) {
      updates.push('bill_halfday_rate = ?');
      values.push(bill_halfday_rate);
    }
    if (bill_fullday_rate !== undefined) {
      updates.push('bill_fullday_rate = ?');
      values.push(bill_fullday_rate);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 1) {
      const sql = `UPDATE event_assignments SET ${updates.join(', ')} WHERE id = ?`;
      await run(sql, values);
    }

    const [assignment] = await query('SELECT * FROM event_assignments WHERE id = ?', [id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

// DELETE assignment
router.delete('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM event_assignments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET technician availability for a specific time slot
router.get('/events/:eventId/tech-availability/:date/:startTime/:endTime', async (req, res, next) => {
  try {
    const { eventId, date, startTime, endTime } = req.params;

    // Get all techs
    const allTechs = await query('SELECT * FROM technicians ORDER BY name');

    // Get assignments for this time slot
    const conflicts = await query(
      `SELECT DISTINCT technician_id FROM event_assignments
       WHERE assignment_date = ? 
       AND (
         (start_time < ? AND end_time > ?)
         OR (start_time < ? AND end_time > ?)
         OR (start_time >= ? AND end_time <= ?)
       )`,
      [date, endTime, startTime, endTime, startTime, startTime, endTime]
    );

    const conflictIds = conflicts.map(c => c.technician_id);

    const available = allTechs.filter(t => !conflictIds.includes(t.id));

    res.json({
      available,
      conflicts: allTechs.filter(t => conflictIds.includes(t.id))
    });
  } catch (err) {
    next(err);
  }
});

// BULK assign technicians
router.post('/assignments/bulk', async (req, res, next) => {
  try {
    const assignments = req.body; // Array of assignment objects

    const created = [];
    for (const assignment of assignments) {
      const id = uuid();
      await run(
        `INSERT INTO event_assignments 
         (id, event_id, requirement_id, technician_id, position, location, assignment_date, 
          start_time, end_time, hours_worked, rate_type, calculated_pay, customer_bill, 
          notes, base_hours, ot_hours, dt_hours, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          assignment.event_id,
          assignment.requirement_id || null,
          assignment.technician_id,
          assignment.position || null,
          assignment.location || null,
          assignment.assignment_date || null,
          assignment.start_time || null,
          assignment.end_time || null,
          assignment.hours_worked || 0,
          assignment.rate_type || 'hourly',
          assignment.calculated_pay || 0,
          assignment.customer_bill || 0,
          assignment.notes || null,
          assignment.base_hours || 0,
          assignment.ot_hours || 0,
          assignment.dt_hours || 0,
          new Date().toISOString()
        ]
      );
      created.push(id);
    }

    res.status(201).json({ created, count: created.length });
  } catch (err) {
    next(err);
  }
});

export default router;
