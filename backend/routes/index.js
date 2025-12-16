// backend/routes/index.js

// All core API routes in one place

// Schema: camelCase fields matching initDb.js

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
    const { name, position, hourlyrate, halfdayrate, fulldayrate } = req.body;

    await run(
      `INSERT INTO technicians (id, name, position, hourlyrate, halfdayrate, fulldayrate, createdat, updatedat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        position || null,
        hourlyrate || 50,
        halfdayrate || 250,
        fulldayrate || 500,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    const [technician] = await query('SELECT * FROM technicians WHERE id = ?', [id]);
    res.status(201).json(technician);
  } catch (err) {
    next(err);
  }
});

router.get('/technicians/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [technician] = await query('SELECT * FROM technicians WHERE id = ?', [id]);
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    res.json(technician);
  } catch (err) {
    next(err);
  }
});

router.put('/technicians/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, hourlyrate, halfdayrate, fulldayrate } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position || null);
    }
    if (hourlyrate !== undefined) {
      updates.push('hourlyrate = ?');
      values.push(hourlyrate);
    }
    if (halfdayrate !== undefined) {
      updates.push('halfdayrate = ?');
      values.push(halfdayrate);
    }
    if (fulldayrate !== undefined) {
      updates.push('fulldayrate = ?');
      values.push(fulldayrate);
    }

    updates.push('updatedat = ?');
    values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 1) {
      const sql = `UPDATE technicians SET ${updates.join(', ')} WHERE id = ?`;
      await run(sql, values);
    }

    const [technician] = await query('SELECT * FROM technicians WHERE id = ?', [id]);
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    res.json(technician);
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
// EVENT REQUIREMENTS CRUD
// =============================================

router.get('/requirements', async (req, res, next) => {
  try {
    const requirements = await query('SELECT * FROM eventrequirements ORDER BY requirementdate DESC');
    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

router.get('/events/:eventid/requirements', async (req, res, next) => {
  try {
    const { eventid } = req.params;
    const requirements = await query(
      'SELECT * FROM eventrequirements WHERE eventid = ? ORDER BY requirementdate DESC',
      [eventid]
    );
    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

router.post('/requirements', async (req, res, next) => {
  try {
    const id = uuid();
    const {
      eventid,
      requirementdate,
      requirementenddate,
      roomorlocation,
      settime,
      starttime,
      endtime,
      striketime,
      position,
      techsneeded,
    } = req.body;

    await run(
      `INSERT INTO eventrequirements (
        id, eventid, requirementdate, requirementenddate, roomorlocation,
        settime, starttime, endtime, striketime, position, techsneeded,
        createdat, updatedat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventid,
        requirementdate || null,
        requirementenddate || null,
        roomorlocation || null,
        settime || null,
        starttime,
        endtime,
        striketime || null,
        position || null,
        techsneeded || 1,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
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
    const updateFields = [
      'requirementdate',
      'requirementenddate',
      'roomorlocation',
      'settime',
      'starttime',
      'endtime',
      'striketime',
      'position',
      'techsneeded',
    ];

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
// EVENT ASSIGNMENTS CRUD
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
    const assignments = await query(
      'SELECT * FROM eventassignments WHERE eventid = ? ORDER BY assignmentdate DESC',
      [eventid]
    );
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.post('/assignments', async (req, res, next) => {
  try {
    const id = uuid();
    const {
      eventid,
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

    await run(
      `INSERT INTO eventassignments (
        id, eventid, technicianid, requirementid, position, roomorlocation,
        hoursworked, basehours, othours, dothours, ratetype,
        techhourlyrate, techhalfdayrate, techfulldayrate,
        billhourlyrate, billhalfdayrate, billfulldayrate,
        calculatedpay, customerbill, notes, assignmentdate,
        starttime, endtime, createdat, updatedat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventid,
        technicianid,
        requirementid || null,
        position || null,
        roomorlocation || null,
        hoursworked || 0,
        basehours || 0,
        othours || 0,
        dothours || 0,
        ratetype || null,
        techhourlyrate || null,
        techhalfdayrate || null,
        techfulldayrate || null,
        billhourlyrate || null,
        billhalfdayrate || null,
        billfulldayrate || null,
        calculatedpay || 0,
        customerbill || 0,
        notes || null,
        assignmentdate || null,
        starttime || null,
        endtime || null,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    const [assignment] = await query('SELECT * FROM eventassignments WHERE id = ?', [id]);
    res.status(201).json(assignment);
  } catch (err) {
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
    const updateFields = [
      'requirementid',
      'position',
      'roomorlocation',
      'hoursworked',
      'basehours',
      'othours',
      'dothours',
      'ratetype',
      'techhourlyrate',
      'techhalfdayrate',
      'techfulldayrate',
      'billhourlyrate',
      'billhalfdayrate',
      'billfulldayrate',
      'calculatedpay',
      'customerbill',
      'notes',
      'assignmentdate',
      'starttime',
      'endtime',
    ];

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
// POSITIONS ROUTES ✅ NEW
// =============================================

router.get('/settings/positions', async (req, res, next) => {
  try {
    const positions = await query('SELECT name FROM positions ORDER BY name ASC');
    const positionNames = positions.map(p => p.name);
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

    // Check if position already exists
    const [existing] = await query('SELECT id FROM positions WHERE name = ?', [trimmedName]);
    if (existing) {
      return res.status(409).json({ error: `Position "${trimmedName}" already exists` });
    }

    // Insert new position
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

    // Check if position exists
    const [existing] = await query('SELECT id FROM positions WHERE name = ?', [decodedName]);
    if (!existing) {
      return res.status(404).json({ error: `Position "${decodedName}" not found` });
    }

    // Check if position is in use by requirements
    const inUseResults = await query(
      'SELECT COUNT(*) as count FROM eventrequirements WHERE position = ?',
      [decodedName]
    );
    const inUse = inUseResults[0] || { count: 0 };

    if (inUse.count > 0) {
      return res.status(409).json({
        error: `Cannot delete "${decodedName}": ${inUse.count} requirement(s) use this position`,
      });
    }

    // Delete position
    await run('DELETE FROM positions WHERE name = ?', [decodedName]);

    console.log(`✅ Deleted position: ${decodedName}`);
    res.json({ message: `Position "${decodedName}" deleted successfully` });
  } catch (err) {
    next(err);
  }
});

export default router;