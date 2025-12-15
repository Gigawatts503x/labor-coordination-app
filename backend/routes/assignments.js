import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

// GET /api/events/{eventId}/assignments - Get all assignments for an event
router.get('/events/:eventId/assignments', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const assignments = await query(
      `SELECT ea.*, t.name AS technicianname, t.position AS technicianprimaryposition, 
              e.name AS eventname, e.clientname 
       FROM eventassignments ea 
       JOIN technicians t ON t.id = ea.technicianid 
       JOIN events e ON e.id = ea.eventid 
       WHERE ea.eventid = ? 
       ORDER BY ea.assignmentdate ASC, ea.starttime ASC, ea.createdat ASC`,
      [eventId]
    );
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/{eventId}/assignments - Create a new assignment
router.post('/events/:eventId/assignments', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const id = uuid();
    const {
      technicianid,
      position,
      assignmentdate,
      starttime,
      endtime,
      hoursworked,
      basehours,
      othours,
      dothours,
      ratetype,
      techhourlyrate,
      techhalfdayrate,
      techfulldayrate,
      billhourlyrate,
      billhalfdayrate,
      billfulldayrate,
      calculatedpay,
      customerbill,
      requirementid,
      notes,
    } = req.body;

    console.log('Creating assignment', {
      eventId,
      technicianid,
      requirementid,
      assignmentdate,
      starttime,
      endtime,
    });

    // 21 VALUES for 21 COLUMNS - CORRECTED
    await run(
      `INSERT INTO eventassignments 
        (id, eventid, technicianid, position, assignmentdate, starttime, endtime, 
         hoursworked, basehours, othours, dothours, ratetype, 
         techhourlyrate, techhalfdayrate, techfulldayrate, 
         billhourlyrate, billhalfdayrate, billfulldayrate, 
         calculatedpay, customerbill, requirementid) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        technicianid,
        position || null,
        assignmentdate || null,
        starttime || null,
        endtime || null,
        parseFloat(hoursworked) || 0,
        parseFloat(basehours) || 0,
        parseFloat(othours) || 0,
        parseFloat(dothours) || 0,
        ratetype || null,
        techhourlyrate || null,
        techhalfdayrate || null,
        techfulldayrate || null,
        billhourlyrate || null,
        billhalfdayrate || null,
        billfulldayrate || null,
        parseFloat(calculatedpay) || 0,
        parseFloat(customerbill) || 0,
        requirementid || null,
      ]
    );

    const assignment = await query(
      `SELECT ea.*, t.name AS technicianname, t.position AS technicianprimaryposition, 
              e.name AS eventname, e.clientname 
       FROM eventassignments ea 
       JOIN technicians t ON t.id = ea.technicianid 
       JOIN events e ON e.id = ea.eventid 
       WHERE ea.id = ?`,
      [id]
    );

    console.log('Assignment created', assignment[0].id);
    res.status(201).json(assignment[0]);
  } catch (err) {
    console.error('Error creating assignment:', err.message);
    next(err);
  }
});

// PATCH /api/assignments/{id} - Update a single field (inline edit)
router.patch('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      hoursworked,
      basehours,
      othours,
      dothours,
      position,
      assignmentdate,
      starttime,
      endtime,
      ratetype,
      techhourlyrate,
      techhalfdayrate,
      techfulldayrate,
      billhourlyrate,
      billhalfdayrate,
      billfulldayrate,
      calculatedpay,
      customerbill,
      notes,
    } = req.body;

    // Build dynamic UPDATE based on provided fields
    const updates = {};
    if (hoursworked !== undefined) updates.hoursworked = hoursworked;
    if (basehours !== undefined) updates.basehours = basehours;
    if (othours !== undefined) updates.othours = othours;
    if (dothours !== undefined) updates.dothours = dothours;
    if (position !== undefined) updates.position = position;
    if (assignmentdate !== undefined) updates.assignmentdate = assignmentdate;
    if (starttime !== undefined) updates.starttime = starttime;
    if (endtime !== undefined) updates.endtime = endtime;
    if (ratetype !== undefined) updates.ratetype = ratetype;
    if (techhourlyrate !== undefined) updates.techhourlyrate = techhourlyrate;
    if (techhalfdayrate !== undefined) updates.techhalfdayrate = techhalfdayrate;
    if (techfulldayrate !== undefined) updates.techfulldayrate = techfulldayrate;
    if (billhourlyrate !== undefined) updates.billhourlyrate = billhourlyrate;
    if (billhalfdayrate !== undefined) updates.billhalfdayrate = billhalfdayrate;
    if (billfulldayrate !== undefined) updates.billfulldayrate = billfulldayrate;
    if (calculatedpay !== undefined) updates.calculatedpay = calculatedpay;
    if (customerbill !== undefined) updates.customerbill = customerbill;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updatedat = new Date().toISOString();

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');

    const values = Object.values(updates);
    values.push(id);

    await run(
      `UPDATE eventassignments SET ${setClause} WHERE id = ?`,
      values
    );

    const assignment = await query(
      `SELECT ea.*, t.name AS technicianname, t.position AS technicianprimaryposition, 
              e.name AS eventname, e.clientname 
       FROM eventassignments ea 
       JOIN technicians t ON t.id = ea.technicianid 
       JOIN events e ON e.id = ea.eventid 
       WHERE ea.id = ?`,
      [id]
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/assignments/{id} - Full update of an assignment (all fields)
router.put('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      position,
      assignmentdate,
      starttime,
      endtime,
      hoursworked,
      basehours,
      othours,
      dothours,
      ratetype,
      techhourlyrate,
      techhalfdayrate,
      techfulldayrate,
      billhourlyrate,
      billhalfdayrate,
      billfulldayrate,
      calculatedpay,
      customerbill,
      notes,
    } = req.body;

    await run(
      `UPDATE eventassignments 
       SET position = ?, assignmentdate = ?, starttime = ?, endtime = ?, 
           hoursworked = ?, basehours = ?, othours = ?, dothours = ?,
           ratetype = ?, 
           techhourlyrate = ?, techhalfdayrate = ?, techfulldayrate = ?,
           billhourlyrate = ?, billhalfdayrate = ?, billfulldayrate = ?,
           calculatedpay = ?, customerbill = ?, notes = ?, updatedat = ?
       WHERE id = ?`,
      [
        position || null,
        assignmentdate || null,
        starttime || null,
        endtime || null,
        parseFloat(hoursworked) || 0,
        parseFloat(basehours) || 0,
        parseFloat(othours) || 0,
        parseFloat(dothours) || 0,
        ratetype || null,
        techhourlyrate || null,
        techhalfdayrate || null,
        techfulldayrate || null,
        billhourlyrate || null,
        billhalfdayrate || null,
        billfulldayrate || null,
        parseFloat(calculatedpay) || 0,
        parseFloat(customerbill) || 0,
        notes || null,
        new Date().toISOString(),
        id,
      ]
    );

    const assignment = await query(
      `SELECT ea.*, t.name AS technicianname, t.position AS technicianprimaryposition, 
              e.name AS eventname, e.clientname 
       FROM eventassignments ea 
       JOIN technicians t ON t.id = ea.technicianid 
       JOIN events e ON e.id = ea.eventid 
       WHERE ea.id = ?`,
      [id]
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assignments/{id} - Delete an assignment
router.delete('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM eventassignments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
