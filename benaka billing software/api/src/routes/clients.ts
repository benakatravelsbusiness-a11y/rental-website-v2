import { Hono } from 'hono';
import type { Env, ApiResponse, Client, CreateClientRequest } from '../types';

export const clientRoutes = new Hono<{ Bindings: Env }>();

// GET /api/clients — List all clients with search
clientRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const search = c.req.query('search');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM clients';
  let countQuery = 'SELECT COUNT(*) as total FROM clients';
  const bindings: string[] = [];

  if (search) {
    const searchClause = ` WHERE full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?`;
    query += searchClause;
    countQuery += searchClause;
    const pattern = `%${search}%`;
    bindings.push(pattern, pattern, pattern);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  // Get total count
  const countStmt = bindings.length > 0
    ? db.prepare(countQuery).bind(...bindings)
    : db.prepare(countQuery);
  const countResult = await countStmt.first<{ total: number }>();

  // Get paginated results
  const allBindings = [...bindings, limit.toString(), offset.toString()];
  const dataResult = await db.prepare(query).bind(...allBindings).all<Client>();

  return c.json<ApiResponse>({
    success: true,
    data: {
      clients: dataResult.results,
      total: countResult?.total ?? 0,
      page,
      limit,
    },
  });
});

// GET /api/clients/:id — Single client
clientRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, error: 'Invalid client ID' }, 400);
  }

  const client = await db
    .prepare('SELECT * FROM clients WHERE id = ?')
    .bind(id)
    .first<Client>();

  if (!client) {
    return c.json<ApiResponse>({ success: false, error: 'Client not found' }, 404);
  }

  // Also fetch their invoices
  const invoices = await db
    .prepare(
      `SELECT i.*, f.car_model, f.registration_number
       FROM invoices i
       JOIN fleet f ON i.fleet_id = f.id
       WHERE i.client_id = ?
       ORDER BY i.created_at DESC`
    )
    .bind(id)
    .all();

  return c.json<ApiResponse>({
    success: true,
    data: { ...client, invoices: invoices.results },
  });
});

// POST /api/clients — Create new client
clientRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<CreateClientRequest>();

  if (!body.full_name || !body.phone_number) {
    return c.json<ApiResponse>(
      { success: false, error: 'full_name and phone_number are required' },
      400
    );
  }

  try {
    const result = await db
      .prepare(
        `INSERT INTO clients (full_name, phone_number, email, driving_license_number, gstin)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        body.full_name,
        body.phone_number,
        body.email || null,
        body.driving_license_number || null,
        body.gstin || null
      )
      .run();

    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<Client>();

    return c.json<ApiResponse<Client>>({ success: true, data: client! }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE constraint')) {
      return c.json<ApiResponse>(
        { success: false, error: 'A client with this phone number already exists' },
        409
      );
    }
    throw err;
  }
});

// PUT /api/clients/:id — Update client
clientRoutes.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, error: 'Invalid client ID' }, 400);
  }

  const body = await c.req.json<Partial<CreateClientRequest>>();

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (body.full_name !== undefined) { fields.push('full_name = ?'); values.push(body.full_name); }
  if (body.phone_number !== undefined) { fields.push('phone_number = ?'); values.push(body.phone_number); }
  if (body.email !== undefined) { fields.push('email = ?'); values.push(body.email || null); }
  if (body.driving_license_number !== undefined) { fields.push('driving_license_number = ?'); values.push(body.driving_license_number || null); }
  if (body.gstin !== undefined) { fields.push('gstin = ?'); values.push(body.gstin || null); }

  if (fields.length === 0) {
    return c.json<ApiResponse>({ success: false, error: 'No fields to update' }, 400);
  }

  values.push(id.toString());

  try {
    const result = await db
      .prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    if (result.meta.changes === 0) {
      return c.json<ApiResponse>({ success: false, error: 'Client not found' }, 404);
    }

    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(id)
      .first<Client>();

    return c.json<ApiResponse<Client>>({ success: true, data: client! });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('UNIQUE constraint')) {
      return c.json<ApiResponse>(
        { success: false, error: 'A client with this phone number already exists' },
        409
      );
    }
    throw err;
  }
});
