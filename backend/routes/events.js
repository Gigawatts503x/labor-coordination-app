import express from 'express';
import { v4 as uuid } from 'uuid';
import { query, run } from '../config/database.js';

const router = express.Router();

// =============================================
// EVENTS CRUD
// =============================================

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
    const {
      name,
      client_name,
      client_contact,
      client_phone,
      client_email,
      client_address,
      po_number,
      start_date,
      end_date
    } = req.body;

    await run(
      `INSERT INTO events (id, name, client_name, client_contact, client_phone, client_email, client_address, po_number, start_date, end_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        client_name,
        client_contact,
        client_phone || null,
        client_email || null,
        client_address || null,
        po_number || null,
        start_date || null,
        end_date || null,
        new Date().toISOString()
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
      client_name,
      client_contact,
      client_phone,
      client_email,
      client_address,
      po_number,
      start_date,
      end_date,
      total_tech_payout,
      total_labor_cost,
      total_customer_billing
    } = req.body;

    await run(
      `UPDATE events SET
      name = ?,
      client_name = ?,
      client_contact = ?,
      client_phone = ?,
      client_email = ?,
      client_address = ?,
      po_number = ?,
      start_date = ?,
      end_date = ?,
      total_tech_payout = ?,
      total_labor_cost = ?,
      total_customer_billing = ?,
      updated_at = ?
      WHERE id = ?`,
      [
        name,
        client_name,
        client_contact,
        client_phone || null,
        client_email || null,
        client_address || null,
        po_number || null,
        start_date || null,
        end_date || null,
        total_tech_payout || 0,
        total_labor_cost || 0,
        total_customer_billing || 0,
        new Date().toISOString(),
        id
      ]
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

// =============================================
// GLOBAL SETTINGS
// =============================================

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await query('SELECT * FROM settings LIMIT 1');
    res.json(settings[0] || {
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
    const {
      halfday_hours,
      fullday_hours,
      ot_threshold,
      dot_threshold,
      dot_start_hour,
      tech_base_rate,
      customer_base_rate
    } = req.body;

    // Update global settings
    await run(
      `INSERT INTO settings (id, halfday_hours, fullday_hours, ot_threshold, dot_threshold, dot_start_hour, tech_base_rate, customer_base_rate, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
      halfday_hours = EXCLUDED.halfday_hours,
      fullday_hours = EXCLUDED.fullday_hours,
      ot_threshold = EXCLUDED.ot_threshold,
      dot_threshold = EXCLUDED.dot_threshold,
      dot_start_hour = EXCLUDED.dot_start_hour,
      tech_base_rate = EXCLUDED.tech_base_rate,
      customer_base_rate = EXCLUDED.customer_base_rate,
      updated_at = EXCLUDED.updated_at`,
      [
        halfday_hours,
        fullday_hours,
        ot_threshold,
        dot_threshold,
        dot_start_hour,
        tech_base_rate,
        customer_base_rate,
        new Date().toISOString()
      ]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// =============================================
// EVENT-LEVEL SETTINGS (NEW - Step 2)
// =============================================

router.get('/events/:eventId/settings', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const settings = await query(
      'SELECT * FROM rate_configs WHERE event_id = ?',
      [eventId]
    );
    res.json(settings[0] || {});
  } catch (err) {
    next(err);
  }
});

router.post('/events/:eventId/settings', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const {
      overtime_threshold,
      overtime_multiplier,
      billing_multiplier,
      rounding_mode
    } = req.body;

    const id = uuid();
    await run(
      `INSERT INTO rate_configs (id, event_id, overtime_threshold, overtime_multiplier, billing_multiplier, rounding_mode, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eventId,
        overtime_threshold || 8,
        overtime_multiplier || 1.5,
        billing_multiplier || 1.3,
        rounding_mode || 'round',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const [settings] = await query('SELECT * FROM rate_configs WHERE id = ?', [id]);
    res.status(201).json(settings);
  } catch (err) {
    next(err);
  }
});

router.put('/events/:eventId/settings/:settingsId', async (req, res, next) => {
  try {
    const { eventId, settingsId } = req.params;
    const {
      overtime_threshold,
      overtime_multiplier,
      billing_multiplier,
      rounding_mode
    } = req.body;

    await run(
      `UPDATE rate_configs SET
      overtime_threshold = ?,
      overtime_multiplier = ?,
      billing_multiplier = ?,
      rounding_mode = ?,
      updated_at = ?
      WHERE id = ? AND event_id = ?`,
      [
        overtime_threshold || 8,
        overtime_multiplier || 1.5,
        billing_multiplier || 1.3,
        rounding_mode || 'round',
        new Date().toISOString(),
        settingsId,
        eventId
      ]
    );

    const [settings] = await query('SELECT * FROM rate_configs WHERE id = ?', [settingsId]);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
