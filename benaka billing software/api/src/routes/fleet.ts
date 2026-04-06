import { Hono } from 'hono';
import type { Env, ApiResponse, FleetVehicle, UpdateFleetStatusRequest } from '../types';

export const fleetRoutes = new Hono<{ Bindings: Env }>();

// GET /api/fleet — List all vehicles
fleetRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status'); // optional filter

  let query = 'SELECT * FROM fleet';
  const bindings: string[] = [];

  if (status) {
    query += ' WHERE status = ?';
    bindings.push(status);
  }

  query += ' ORDER BY car_model ASC, registration_number ASC';

  const stmt = bindings.length > 0
    ? db.prepare(query).bind(...bindings)
    : db.prepare(query);

  const result = await stmt.all<FleetVehicle>();

  return c.json<ApiResponse<FleetVehicle[]>>({
    success: true,
    data: result.results,
  });
});

// GET /api/fleet/:id — Single vehicle
fleetRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, error: 'Invalid vehicle ID' }, 400);
  }

  const vehicle = await db
    .prepare('SELECT * FROM fleet WHERE id = ?')
    .bind(id)
    .first<FleetVehicle>();

  if (!vehicle) {
    return c.json<ApiResponse>({ success: false, error: 'Vehicle not found' }, 404);
  }

  return c.json<ApiResponse<FleetVehicle>>({ success: true, data: vehicle });
});

// PUT /api/fleet/:id/status — Toggle vehicle status
fleetRoutes.put('/:id/status', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, error: 'Invalid vehicle ID' }, 400);
  }

  const body = await c.req.json<UpdateFleetStatusRequest>();

  if (!body.status || !['Available', 'On-Trip', 'Maintenance'].includes(body.status)) {
    return c.json<ApiResponse>(
      { success: false, error: 'Invalid status. Must be: Available, On-Trip, or Maintenance' },
      400
    );
  }

  const result = await db
    .prepare('UPDATE fleet SET status = ? WHERE id = ?')
    .bind(body.status, id)
    .run();

  if (result.meta.changes === 0) {
    return c.json<ApiResponse>({ success: false, error: 'Vehicle not found' }, 404);
  }

  const updated = await db
    .prepare('SELECT * FROM fleet WHERE id = ?')
    .bind(id)
    .first<FleetVehicle>();

  return c.json<ApiResponse<FleetVehicle>>({ success: true, data: updated! });
});

// POST /api/fleet — Add a new vehicle
fleetRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<{
    registration_number: string;
    car_model: string;
    daily_rate_paise: number;
    status?: string;
  }>();

  if (!body.registration_number || !body.car_model || !body.daily_rate_paise) {
    return c.json<ApiResponse>(
      { success: false, error: 'registration_number, car_model, and daily_rate_paise are required' },
      400
    );
  }

  try {
    const result = await db
      .prepare(
        `INSERT INTO fleet (registration_number, car_model, daily_rate_paise, status)
         VALUES (?, ?, ?, ?)`
      )
      .bind(
        body.registration_number,
        body.car_model,
        body.daily_rate_paise,
        body.status || 'Available'
      )
      .run();

    const vehicle = await db
      .prepare('SELECT * FROM fleet WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<FleetVehicle>();

    return c.json<ApiResponse<FleetVehicle>>({ success: true, data: vehicle! }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE constraint')) {
      return c.json<ApiResponse>(
        { success: false, error: 'A vehicle with this registration number already exists' },
        409
      );
    }
    throw err;
  }
});
