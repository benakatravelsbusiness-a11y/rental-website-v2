import { Hono } from 'hono';
import type { Env, ApiResponse, Client, CreateClientRequest } from './types';

export const clientRoutes = new Hono<{ Bindings: Env }>();

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

  const countStmt = bindings.length > 0 ? db.prepare(countQuery).bind(...bindings) : db.prepare(countQuery);
  const countResult = await countStmt.first<{ total: number }>();

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

clientRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) return c.json<ApiResponse>({ success: false, error: 'Invalid client ID' }, 400);

  const client = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first<Client>();
  if (!client) return c.json<ApiResponse>({ success: false, error: 'Client not found' }, 404);

  const invoices = await db
    .prepare(
      `SELECT i.*, c2.name as car_model, '' as registration_number
       FROM invoices i
       JOIN cars c2 ON i.car_id = c2.id
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

clientRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<CreateClientRequest>();

  if (!body.full_name || !body.phone_number) {
    return c.json<ApiResponse>({ success: false, error: 'full_name and phone_number are required' }, 400);
  }

  try {
    const result = await db
      .prepare(`INSERT INTO clients (full_name, phone_number, email, driving_license_number, gstin) VALUES (?, ?, ?, ?, ?)`)
      .bind(body.full_name, body.phone_number, body.email || null, body.driving_license_number || null, body.gstin || null)
      .run();

    const client = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(result.meta.last_row_id).first<Client>();
    return c.json<ApiResponse<Client>>({ success: true, data: client! }, 201);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      return c.json<ApiResponse>({ success: false, error: 'A client with this phone number already exists' }, 409);
    }
    throw err;
  }
});

clientRoutes.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json<ApiResponse>({ success: false, error: 'Invalid client ID' }, 400);

  const body = await c.req.json<Partial<CreateClientRequest>>();
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (body.full_name !== undefined) { fields.push('full_name = ?'); values.push(body.full_name); }
  if (body.phone_number !== undefined) { fields.push('phone_number = ?'); values.push(body.phone_number); }
  if (body.email !== undefined) { fields.push('email = ?'); values.push(body.email || null); }
  if (body.driving_license_number !== undefined) { fields.push('driving_license_number = ?'); values.push(body.driving_license_number || null); }
  if (body.gstin !== undefined) { fields.push('gstin = ?'); values.push(body.gstin || null); }

  if (fields.length === 0) return c.json<ApiResponse>({ success: false, error: 'No fields to update' }, 400);
  values.push(id.toString());

  try {
    const result = await db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    if (result.meta.changes === 0) return c.json<ApiResponse>({ success: false, error: 'Client not found' }, 404);
    const client = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first<Client>();
    return c.json<ApiResponse<Client>>({ success: true, data: client! });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) return c.json<ApiResponse>({ success: false, error: 'A client with this phone number already exists' }, 409);
    throw err;
  }
});
