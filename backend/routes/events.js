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

// Settings routes
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await run('SELECT * FROM settings LIMIT 1');
    res.json(settings || {
      halfday_hours: 5,
      fullday_hours: 10,
      ot_threshold: 10,
      dot_threshold: 20,
      dot_start_hour: 20,
      tech_base_rate: 50,
      customer_base_rate: 75
    });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const { halfday_hours, fullday_hours, ot_threshold, dot_threshold, dot_start_hour, tech_base_rate, customer_base_rate } = req.body;
    
    // Update or insert settings
    await run(`
      INSERT INTO settings (halfday_hours, fullday_hours, ot_threshold, dot_threshold, dot_start_hour, tech_base_rate, customer_base_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        halfday_hours=?, fullday_hours=?, ot_threshold=?, dot_threshold=?, dot_start_hour=?, tech_base_rate=?, customer_base_rate=?
    `, [halfday_hours, fullday_hours, ot_threshold, dot_threshold, dot_start_hour, tech_base_rate, customer_base_rate,
        halfday_hours, fullday_hours, ot_threshold, dot_threshold, dot_start_hour, tech_base_rate, customer_base_rate]);
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});


export default router;
