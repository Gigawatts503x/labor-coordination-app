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
      ],
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
        hourlyrate || 0,
        halfdayrate || 0,
        fulldayrate || 0,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
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
    const { name, position, hourlyrate, halfdayrate, fulldayrate } = req.body;

    await run(
      `UPDATE technicians SET name = ?, position = ?, hourlyrate = ?, halfdayrate = ?, fulldayrate = ?, updatedat = ? WHERE id = ?`,
      [
        name,
        position || null,
        hourlyrate || 0,
        halfdayrate || 0,
        fulldayrate || 0,
        new Date().toISOString(),
        id,
      ],
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

// =============================================
// REQUIREMENTS CRUD
// =============================================

router.get('/events/:eventId/requirements', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const requirements = await query(
      'SELECT * FROM eventrequirements WHERE eventid = ? ORDER BY requirementdate ASC, settime ASC',
      [eventId],
    );
    res.json(requirements);
  } catch (err) {
    next(err);
  }
});

router.post('/events/:eventId/requirements', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const id = uuid();
    const {
      position,
      roomorlocation,
      requirementdate,
      requirementenddate,
      settime,
      striketime,
      starttime,
      endtime,
      techsneeded,
    } = req.body;

    await run(
      `INSERT INTO eventrequirements 
       (id, eventid, position, roomorlocation, requirementdate, requirementenddate, settime, striketime, starttime, endtime, techsneeded, createdat, updatedat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        position || null,
        roomorlocation || null,
        requirementdate || null,
        requirementenddate || null,
        settime || null,
        striketime || null,
        starttime || null,
        endtime || null,
        techsneeded || 1,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );

    const [requirement] = await query('SELECT * FROM eventrequirements WHERE id = ?', [id]);
    res.status(201).json(requirement);
  } catch (err) {
    next(err);
  }
});

router.patch('/requirements/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      position,
      roomorlocation,
      requirementdate,
      requirementenddate,
      settime,
      striketime,
      starttime,
      endtime,
      techsneeded,
    } = req.body;

    const updates = [];
    const values = [];

    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position);
    }
    if (roomorlocation !== undefined) {
      updates.push('roomorlocation = ?');
      values.push(roomorlocation);
    }
    if (requirementdate !== undefined) {
      updates.push('requirementdate = ?');
      values.push(requirementdate);
    }
    if (requirementenddate !== undefined) {
      updates.push('requirementenddate = ?');
      values.push(requirementenddate);
    }
    if (settime !== undefined) {
      updates.push('settime = ?');
      values.push(settime);
    }
    if (striketime !== undefined) {
      updates.push('striketime = ?');
      values.push(striketime);
    }
    if (starttime !== undefined) {
      updates.push('starttime = ?');
      values.push(starttime);
    }
    if (endtime !== undefined) {
      updates.push('endtime = ?');
      values.push(endtime);
    }
    if (techsneeded !== undefined) {
      updates.push('techsneeded = ?');
      values.push(techsneeded);
    }

    updates.push('updatedat = ?');
    values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 1) {
      const sql = `UPDATE eventrequirements SET ${updates.join(', ')} WHERE id = ?`;
      await run(sql, values);
    }

    const [requirement] = await query('SELECT * FROM eventrequirements WHERE id = ?', [id]);
    if (!requirement) return res.status(404).json({ error: 'Requirement not found' });
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
// ASSIGNMENTS CRUD
// =============================================

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
      [eventId],
    );
    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

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
      requirementid,
      notes,
    } = req.body;

    await run(
      `INSERT INTO eventassignments 
        (id, eventid, technicianid, position, assignmentdate, starttime, endtime, roomorlocation,
         hoursworked, basehours, othours, dothours, ratetype, 
         techhourlyrate, techhalfdayrate, techfulldayrate, 
         billhourlyrate, billhalfdayrate, billfulldayrate, 
         calculatedpay, customerbill, requirementid, notes, createdat, updatedat) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        technicianid,
        position || null,
        assignmentdate || null,
        starttime || null,
        endtime || null,
        roomorlocation || null,
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
        notes || null,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );

    const [assignment] = await query(
      `SELECT ea.*, t.name AS technicianname, t.position AS technicianprimaryposition, 
              e.name AS eventname, e.clientname 
       FROM eventassignments ea 
       JOIN technicians t ON t.id = ea.technicianid 
       JOIN events e ON e.id = ea.eventid 
       WHERE ea.id = ?`,
      [id],
    );

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
});

router.patch('/assignments/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      hoursworked,
      basehours,
      othours,
      dothours,
      position,
      roomorlocation,
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

    const updates = {};
    if (hoursworked !== undefined) updates.hoursworked = hoursworked;
    if (basehours !== undefined) updates.basehours = basehours;
    if (othours !== undefined) updates.othours = othours;
    if (dothours !== undefined) updates.dothours = dothours;
    if (position !== undefined) updates.position = position;
    if (roomorlocation !== undefined) updates.roomorlocation = roomorlocation;
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

    await run(`UPDATE eventassignments SET ${setClause} WHERE id = ?`, values);

    const [assignment] = await query(
      `SELECT ea.*, t.name AS technicianname, t.position AS technicianprimaryposition, 
              e.name AS eventname, e.clientname 
       FROM eventassignments ea 
       JOIN technicians t ON t.id = ea.technicianid 
       JOIN events e ON e.id = ea.eventid 
       WHERE ea.id = ?`,
      [id],
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

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
// SETTINGS
// =============================================

router.get('/settings', async (req, res, next) => {
  try {
    const [settings] = await query('SELECT * FROM settings LIMIT 1');
    res.json(
      settings || {
        halfdayhours: 5,
        fulldayhours: 10,
        otthreshold: 10,
        dotthreshold: 20,
        dotstarthour: 20,
        techbaserate: 50,
        customerbaserate: 75,
      },
    );
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const {
      halfdayhours,
      fulldayhours,
      otthreshold,
      dotthreshold,
      dotstarthour,
      techbaserate,
      customerbaserate,
    } = req.body;

    await run(
      `UPDATE settings
       SET halfdayhours = ?, fulldayhours = ?, otthreshold = ?, dotthreshold = ?,
           dotstarthour = ?, techbaserate = ?, customerbaserate = ?, updatedat = ?
       WHERE id = 1`,
      [
        halfdayhours || 5,
        fulldayhours || 10,
        otthreshold || 10,
        dotthreshold || 20,
        dotstarthour || 20,
        techbaserate || 50,
        customerbaserate || 75,
        new Date().toISOString(),
      ],
    );

    const [existing] = await query('SELECT * FROM settings WHERE id = 1');
    if (!existing) {
      await run(
        `INSERT INTO settings
         (id, halfdayhours, fulldayhours, otthreshold, dotthreshold, dotstarthour,
          techbaserate, customerbaserate, updatedat)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          halfdayhours || 5,
          fulldayhours || 10,
          otthreshold || 10,
          dotthreshold || 20,
          dotstarthour || 20,
          techbaserate || 50,
          customerbaserate || 75,
          new Date().toISOString(),
        ],
      );
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// =============================================
// POSITIONS
// =============================================

router.get('/positions', async (req, res, next) => {
  try {
    const positions = await query(
      'SELECT DISTINCT position FROM technicians WHERE position IS NOT NULL ORDER BY position ASC',
    );
    res.json(positions.map((p) => p.position));
  } catch (err) {
    next(err);
  }
});

export default router;
