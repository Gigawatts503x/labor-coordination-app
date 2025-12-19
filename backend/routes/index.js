// backend/routes/index.js
// ✅ FIXED: All core API routes with enhanced assignment creation

import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

// =============================================
// EVENTS CRUD
// =============================================

router.get('/events', async (req, res, next) => {
  try {
    const events = await query('SELECT * FROM events ORDER BY createdat DESC');
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post('/events', async (req, res, next) => {
  try {
    const id = uuid();
    const {
      name,
      clientname,
      clientcontact,
      clientphone,
      clientemail,
      clientaddress,
      ponumber,
      startdate,
      enddate,
    } = req.body;

    await run(
      `INSERT INTO events (
        id, name, clientname, clientcontact, clientphone, clientemail,
        clientaddress, ponumber, startdate, enddate, createdat, updatedat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        clientname || null,
        clientcontact || null,
        clientphone || null,
        clientemail || null,
        clientaddress || null,
        ponumber || null,
        startdate || null,
        enddate || null,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    const [event] = await query('SELECT * FROM events WHERE id = ?', [id]);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

router.get('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [event] = await query('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

router.put('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      clientname,
      clientcontact,
      clientphone,
      clientemail,
      clientaddress,
      ponumber,
      startdate,
      enddate,
      totaltechpayout,
      totallaborcost,
      totalcustomerbilling,
    } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (clientname !== undefined) {
      updates.push('clientname = ?');
      values.push(clientname);
    }
    if (clientcontact !== undefined) {
      updates.push('clientcontact = ?');
      values.push(clientcontact);
    }
    if (clientphone !== undefined) {
      updates.push('clientphone = ?');
      values.push(clientphone || null);
    }
    if (clientemail !== undefined) {
      updates.push('clientemail = ?');
      values.push(clientemail || null);
    }
    if (clientaddress !== undefined) {
      updates.push('clientaddress = ?');
      values.push(clientaddress || null);
    }
    if (ponumber !== undefined) {
      updates.push('ponumber = ?');
      values.push(ponumber || null);
    }
    if (startdate !== undefined) {
      updates.push('startdate = ?');
      values.push(startdate || null);
    }
    if (enddate !== undefined) {
      updates.push('enddate = ?');
      values.push(enddate || null);
    }
    if (totaltechpayout !== undefined) {
      updates.push('totaltechpayout = ?');
      values.push(totaltechpayout || 0);
    }
    if (totallaborcost !== undefined) {
      updates.push('totallaborcost = ?');
      values.push(totallaborcost || 0);
    }
    if (totalcustomerbilling !== undefined) {
      updates.push('totalcustomerbilling = ?');
      values.push(totalcustomerbilling || 0);
    }

    updates.push('updatedat = ?');
    values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 1) {
      const sql = `UPDATE events SET ${updates.join(', ')} WHERE id = ?`;
      await run(sql, values);
    }

    const [event] = await query('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

router.delete('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM eventassignments WHERE eventid = ?', [id]);
    await run('DELETE FROM eventrequirements WHERE eventid = ?', [id]);
    await run('DELETE FROM eventsettings WHERE eventid = ?', [id]);
    await run('DELETE FROM events WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// =============================================
// TECHNICIANS CRUD
// =============================================

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
    const { name, phone, email, ratetype, techhourlyrate, techhalfdayrate, techfulldayrate, billhourlyrate, billhalfdayrate, billfulldayrate } = req.body;

    await run(
      `INSERT INTO technicians (id, name, phone, email, ratetype, techhourlyrate, techhalfdayrate, techfulldayrate, billhourlyrate, billhalfdayrate, billfulldayrate, createdat, updatedat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, phone || null, email || null, ratetype || null, techhourlyrate || null, techhalfdayrate || null, techfulldayrate || null, billhourlyrate || null, billhalfdayrate || null, billfulldayrate || null, new Date().toISOString(), new Date().toISOString()]
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
    const { name, phone, email, ratetype, techhourlyrate, techhalfdayrate, techfulldayrate, billhourlyrate, billhalfdayrate, billfulldayrate } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email || null);
    }
    if (ratetype !== undefined) {
      updates.push('ratetype = ?');
      values.push(ratetype || null);
    }
    if (techhourlyrate !== undefined) {
      updates.push('techhourlyrate = ?');
      values.push(techhourlyrate || null);
    }
    if (techhalfdayrate !== undefined) {
      updates.push('techhalfdayrate = ?');
      values.push(techhalfdayrate || null);
    }
    if (techfulldayrate !== undefined) {
      updates.push('techfulldayrate = ?');
      values.push(techfulldayrate || null);
    }
    if (billhourlyrate !== undefined) {
      updates.push('billhourlyrate = ?');
      values.push(billhourlyrate || null);
    }
    if (billhalfdayrate !== undefined) {
      updates.push('billhalfdayrate = ?');
      values.push(billhalfdayrate || null);
    }
    if (billfulldayrate !== undefined) {
      updates.push('billfulldayrate = ?');
      values.push(billfulldayrate || null);
    }

    updates.push('updatedat = ?');
    values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 1) {
      const sql = `UPDATE technicians SET ${updates.join(', ')} WHERE id = ?`;
      await run(sql, values);
    }

    const [tech] = await query('SELECT * FROM technicians WHERE id = ?', [id]);
    res.json(tech);
  } catch (err) {
    next(err);
  }
});

router.delete('/technicians/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM eventassignments WHERE technicianid = ?', [id]);
    await run('DELETE FROM technicians WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// =============================================
// REQUIREMENTS CRUD
// =============================================

router.get('/events/:eventid/requirements', async (req, res, next) => {
  try {
    const { eventid } = req.params;
    const requirements = await query('SELECT * FROM eventrequirements WHERE eventid = ? ORDER BY requirementdate ASC', [eventid]);
    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

router.post('/requirements', async (req, res, next) => {
  try {
    const id = uuid();
    const { eventId, requirementdate, requirementenddate, roomorlocation, settime, starttime, endtime, striketime, position, techsneeded } = req.body;

    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    await run(
      `INSERT INTO eventrequirements (id, eventid, requirementdate, requirementenddate, roomorlocation, settime, starttime, endtime, striketime, position, techsneeded, createdat, updatedat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, eventId, requirementdate || null, requirementenddate || null, roomorlocation || null, settime || null, starttime || null, endtime || null, striketime || null, position || null, techsneeded || 1, new Date().toISOString(), new Date().toISOString()]
    );

    const [requirement] = await query('SELECT * FROM eventrequirements WHERE id = ?', [id]);
    res.status(201).json(requirement);
  } catch (err) {
    next(err);
  }
});

router.get('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [requirement] = await query('SELECT * FROM eventrequirements WHERE id = ?', [id]);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });
    res.json(requirement);
  } catch (err) {
    next(err);
  }
});

router.patch('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];

    const updateFields = ['requirementdate', 'requirementenddate', 'roomorlocation', 'settime', 'starttime', 'endtime', 'striketime', 'position', 'techsneeded'];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field] || null);
      }
    });

    if (updates.length === 0) return res.json({ message: 'No updates' });

    updates.push('updatedat = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const sql = `UPDATE eventrequirements SET ${updates.join(', ')} WHERE id = ?`;
    await run(sql, values);

    const [requirement] = await query('SELECT * FROM eventrequirements WHERE id = ?', [id]);
    res.json(requirement);
  } catch (err) {
    next(err);
  }
});

router.delete('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM eventassignments WHERE requirementid = ?', [id]);
    await run('DELETE FROM eventrequirements WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// =============================================
// EVENT ASSIGNMENTS CRUD - ✅ FIXED
// =============================================

router.get('/assignments', async (req, res, next) => {
  try {
    const assignments = await query('SELECT * FROM eventassignments ORDER BY assignmentdate DESC');
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.get('/events/:eventid/assignments', async (req, res, next) => {
  try {
    const { eventid } = req.params;
    const assignments = await query('SELECT * FROM eventassignments WHERE eventid = ? ORDER BY assignmentdate DESC', [eventid]);
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.post('/assignments', async (req, res, next) => {
  try {
    const id = uuid();

    // ✅ FIXED: Handle both eventId and eventid (camelCase and lowercase)
    const {
      eventId = req.body.eventid,
      technicianid,
      requirementid,
      position,
      roomorlocation,
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
      assignmentdate,
      starttime,
      endtime,
    } = req.body;

    // ✅ VALIDATION: Ensure required fields
    if (!eventId || !technicianid) {
      console.warn('⚠️ Missing required fields:', { eventId, technicianid });
      return res.status(400).json({
        error: 'Missing required fields: eventId (or eventid) and technicianid are required',
      });
    }

    // ✅ DEBUG: Log what we received
    console.log('📥 POST /assignments received:', {
      eventId,
      technicianid,
      requirementid,
      position,
      roomorlocation,
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
      assignmentdate,
      starttime,
      endtime,
    });

    // ✅ SAFE DEFAULTS: Provide sensible defaults for optional/calculated fields
    const assignmentParams = [
      id,
      eventId,
      technicianid,
      requirementid || null,
      position || null,
      roomorlocation || null,
      hoursworked !== undefined ? hoursworked : 0,
      basehours !== undefined ? basehours : 0,
      othours !== undefined ? othours : 0,
      dothours !== undefined ? dothours : 0,
      ratetype || null,
      techhourlyrate || null,
      techhalfdayrate || null,
      techfulldayrate || null,
      billhourlyrate || null,
      billhalfdayrate || null,
      billfulldayrate || null,
      calculatedpay !== undefined ? calculatedpay : 0,
      customerbill !== undefined ? customerbill : 0,
      notes || null,
      assignmentdate || new Date().toISOString().split('T')[0],
      starttime || null,
      endtime || null,
      new Date().toISOString(),
      new Date().toISOString(),
    ];

    // ✅ VERIFY: Count and validate parameter array
    const expectedCount = 25;
    if (assignmentParams.length !== expectedCount) {
      console.error(`❌ Parameter count mismatch: got ${assignmentParams.length}, expected ${expectedCount}`);
      console.error('Parameters:', assignmentParams);
      return res.status(500).json({
        error: `Internal error: parameter count mismatch (got ${assignmentParams.length}, expected ${expectedCount})`,
      });
    }

    console.log(`✅ Parameter validation passed: ${assignmentParams.length}/${expectedCount}`);

    // ✅ EXECUTE: Insert assignment with all validated parameters
    await run(
      `INSERT INTO eventassignments (
        id, eventid, technicianid, requirementid, position, roomorlocation,
        hoursworked, basehours, othours, dothours, ratetype,
        techhourlyrate, techhalfdayrate, techfulldayrate,
        billhourlyrate, billhalfdayrate, billfulldayrate,
        calculatedpay, customerbill, notes, assignmentdate,
        starttime, endtime, createdat, updatedat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      assignmentParams
    );

    console.log(`✅ Assignment ${id} created successfully`);

    // ✅ RETURN: Fetch and return the created assignment
    const [assignment] = await query('SELECT * FROM eventassignments WHERE id = ?', [id]);
    res.status(201).json(assignment);
  } catch (err) {
    console.error('❌ POST /assignments error:', {
      message: err.message,
      stack: err.stack,
      sqlError: err.code,
    });
    next(err);
  }
});

router.get('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [assignment] = await query('SELECT * FROM eventassignments WHERE id = ?', [id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

router.patch('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = [];
    const values = [];

    const updateFields = ['requirementid', 'position', 'roomorlocation', 'hoursworked', 'basehours', 'othours', 'dothours', 'ratetype', 'techhourlyrate', 'techhalfdayrate', 'techfulldayrate', 'billhourlyrate', 'billhalfdayrate', 'billfulldayrate', 'calculatedpay', 'customerbill', 'notes', 'assignmentdate', 'starttime', 'endtime'];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field] || null);
      }
    });

    if (updates.length === 0) return res.json({ message: 'No updates' });

    updates.push('updatedat = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const sql = `UPDATE eventassignments SET ${updates.join(', ')} WHERE id = ?`;
    await run(sql, values);

    const [assignment] = await query('SELECT * FROM eventassignments WHERE id = ?', [id]);
    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

router.delete('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM eventassignments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// =============================================
// POSITIONS ROUTES
// =============================================

router.get('/settings/positions', async (req, res, next) => {
  try {
    const positions = await query('SELECT name FROM positions ORDER BY name ASC');
    const positionNames = positions.map((p) => p.name);
    console.log('✅ Fetched positions:', positionNames);
    res.json(positionNames);
  } catch (err) {
    next(err);
  }
});

router.post('/settings/positions', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Position name is required and must be a string' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return res.status(400).json({ error: 'Position name cannot be empty' });
    }

    const [existing] = await query('SELECT id FROM positions WHERE name = ?', [trimmedName]);
    if (existing) {
      return res.status(409).json({ error: `Position "${trimmedName}" already exists` });
    }

    await run('INSERT INTO positions (name) VALUES (?)', [trimmedName]);
    console.log(`✅ Created position: ${trimmedName}`);
    res.status(201).json({ name: trimmedName });
  } catch (err) {
    next(err);
  }
});

router.delete('/settings/positions/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);

    if (!decodedName) {
      return res.status(400).json({ error: 'Position name is required' });
    }

    const [existing] = await query('SELECT id FROM positions WHERE name = ?', [decodedName]);
    if (!existing) {
      return res.status(404).json({ error: `Position "${decodedName}" not found` });
    }

    const inUseResults = await query('SELECT COUNT(*) as count FROM eventrequirements WHERE position = ?', [decodedName]);
    const inUse = inUseResults[0] || { count: 0 };

    if (inUse.count > 0) {
      return res.status(409).json({
        error: `Cannot delete "${decodedName}": ${inUse.count} requirement(s) use this position`,
      });
    }

    await run('DELETE FROM positions WHERE name = ?', [decodedName]);
    console.log(`✅ Deleted position: ${decodedName}`);
    res.json({ message: `Position "${decodedName}" deleted successfully` });
  } catch (err) {
    next(err);
  }
});

export default router;