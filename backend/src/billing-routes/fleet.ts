import { Hono } from 'hono';
import type { Env, ApiResponse } from './types';

export const fleetRoutes = new Hono<{ Bindings: Env }>();

fleetRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status'); // 'Available' or 'On-Trip' or 'Maintenance'

  let query = 'SELECT id, \'\' as registration_number, name as car_model, (price * 100) as daily_rate_paise, CASE WHEN available = 1 THEN \'Available\' ELSE \'On-Trip\' END as status FROM cars';
  const bindings: string[] = [];

  if (status) {
    query += ' WHERE available = ?';
    bindings.push(status === 'Available' ? '1' : '0');
  }

  query += ' ORDER BY name ASC';

  const stmt = bindings.length > 0 ? db.prepare(query).bind(...bindings) : db.prepare(query);
  const result = await stmt.all();

  return c.json<ApiResponse>({ success: true, data: result.results });
});

fleetRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json<ApiResponse>({ success: false, error: 'Invalid vehicle ID' }, 400);

  const vehicle = await db.prepare('SELECT id, \'\' as registration_number, name as car_model, (price * 100) as daily_rate_paise, CASE WHEN available = 1 THEN \'Available\' ELSE \'On-Trip\' END as status FROM cars WHERE id = ?').bind(id).first();
  if (!vehicle) return c.json<ApiResponse>({ success: false, error: 'Vehicle not found' }, 404);

  return c.json<ApiResponse>({ success: true, data: vehicle });
});

fleetRoutes.put('/:id/status', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json<ApiResponse>({ success: false, error: 'Invalid vehicle ID' }, 400);

  const body = await c.req.json<{ status: string }>();
  if (!body.status || !['Available', 'On-Trip', 'Maintenance'].includes(body.status)) {
    return c.json<ApiResponse>({ success: false, error: 'Invalid status' }, 400);
  }

  const available = body.status === 'Available' ? 1 : 0;
  const result = await db.prepare('UPDATE cars SET available = ? WHERE id = ?').bind(available, id).run();

  if (result.meta.changes === 0) return c.json<ApiResponse>({ success: false, error: 'Vehicle not found' }, 404);

  const updated = await db.prepare('SELECT id, \'\' as registration_number, name as car_model, (price * 100) as daily_rate_paise, CASE WHEN available = 1 THEN \'Available\' ELSE \'On-Trip\' END as status FROM cars WHERE id = ?').bind(id).first();
  return c.json<ApiResponse>({ success: true, data: updated });
});

fleetRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{ registration_number: string; car_model: string; daily_rate_paise: number; status?: string }>();

  if (!body.car_model || !body.daily_rate_paise) {
    return c.json<ApiResponse>({ success: false, error: 'car_model and daily_rate_paise are required' }, 400);
  }

  const price = Math.round(body.daily_rate_paise / 100);
  const available = body.status === 'Available' ? 1 : 0;

  const result = await db.prepare(`INSERT INTO cars (name, category, price, image_url, features, available) VALUES (?, 'Luxury', ?, 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=800', 'Standard', ?)`).bind(body.car_model, price, available).run();

  const vehicle = await db.prepare('SELECT id, \'\' as registration_number, name as car_model, (price * 100) as daily_rate_paise, CASE WHEN available = 1 THEN \'Available\' ELSE \'On-Trip\' END as status FROM cars WHERE id = ?').bind(result.meta.last_row_id).first();
  return c.json<ApiResponse>({ success: true, data: vehicle }, 201);
});
