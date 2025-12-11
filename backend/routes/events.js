import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

router.get('/events', async (req, res, next) => {
  try {
    const events = await query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(events);
  } catch (err) {
    next(err);
  }
});

router.post('/events', async (req, res, next) => {
  try {
    const id = uuid();
    const { name, client_name, client_contact, client_phone, client_email, client_address, po_number, start_date, end_date } = req.body;

    await run(
      `INSERT INTO events (id, name, client_name, client_contact, client_phone, client_email, client_address, po_number, start_date, end_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, client_name, client_contact, client_phone || null, client_email || null, client_address || null, po_number || null, start_date || null, end_date || null, new Date().toISOString()]
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
    const { name, client_name, client_contact, client_phone, client_email, client_address, po_number, start_date, end_date } = req.body;

    await run(
      `UPDATE events SET name = ?, client_name = ?, client_contact = ?, client_phone = ?, client_email = ?, client_address = ?, po_number = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?`,
      [name, client_name, client_contact, client_phone || null, client_email || null, client_address || null, po_number || null, start_date || null, end_date || null, new Date().toISOString(), id]
    );

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
    // Delete in correct order to avoid foreign key conflicts
    await run('DELETE FROM event_assignments WHERE event_id = ?', [id]);
    await run('DELETE FROM event_requirements WHERE event_id = ?', [id]);
    await run('DELETE FROM rate_configs WHERE event_id = ?', [id]);
    await run('DELETE FROM invoices WHERE event_id = ?', [id]);
    await run('DELETE FROM events WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});


export default router;
