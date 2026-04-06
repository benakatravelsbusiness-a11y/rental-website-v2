import { Hono } from 'hono';
import type { Env, ApiResponse, Invoice, CreateInvoiceRequest } from './types';

export const invoiceRoutes = new Hono<{ Bindings: Env }>();

async function generateInvoiceId(db: D1Database): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const result = await db.prepare(`SELECT id FROM invoices WHERE id LIKE ? ORDER BY id DESC LIMIT 1`).bind(`${prefix}%`).first<{ id: string }>();
  let nextSeq = 1;
  if (result) nextSeq = parseInt(result.id.split('-').pop() || '0', 10) + 1;
  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

function calculateGST(subtotalPaise: number): number {
  return Math.round((subtotalPaise * 18) / 100);
}

invoiceRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status');
  const clientId = c.req.query('client_id');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (status) { conditions.push('i.status = ?'); bindings.push(status); }
  if (clientId) { conditions.push('i.client_id = ?'); bindings.push(parseInt(clientId, 10)); }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM invoices i ${whereClause}`).bind(...bindings).first<{ total: number }>();

  const query = `
    SELECT i.*, c.full_name as client_name, c.phone_number as client_phone, f.name as car_model, '' as registration_number
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    JOIN cars f   ON i.car_id  = f.id
    ${whereClause}
    ORDER BY i.created_at DESC LIMIT ? OFFSET ?
  `;
  const result = await db.prepare(query).bind(...bindings, limit, offset).all();

  return c.json<ApiResponse>({ success: true, data: { invoices: result.results, total: countResult?.total ?? 0, page, limit } });
});

invoiceRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const invoice = await db.prepare(
    `SELECT i.*, c.full_name as client_name, c.phone_number as client_phone, c.email as client_email, c.driving_license_number as client_dl, c.gstin as client_gstin, f.name as car_model, '' as registration_number, (f.price * 100) as daily_rate_paise
     FROM invoices i JOIN clients c ON i.client_id = c.id JOIN cars f ON i.car_id = f.id WHERE i.id = ?`
  ).bind(id).first();

  if (!invoice) return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);
  const lineItems = await db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY id ASC').bind(id).all();

  return c.json<ApiResponse>({ success: true, data: { ...invoice, line_items: lineItems.results } });
});

invoiceRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<CreateInvoiceRequest>();

  if (!body.client_id || !body.car_id || !body.start_date || !body.end_date) return c.json<ApiResponse>({ success: false, error: 'client_id, car_id, start_date, and end_date are required' }, 400);
  if (!body.line_items || body.line_items.length === 0) return c.json<ApiResponse>({ success: false, error: 'At least one line item is required' }, 400);

  const client = await db.prepare('SELECT id FROM clients WHERE id = ?').bind(body.client_id).first();
  if (!client) return c.json<ApiResponse>({ success: false, error: 'Client not found' }, 404);

  const vehicle = await db.prepare('SELECT id FROM cars WHERE id = ?').bind(body.car_id).first();
  if (!vehicle) return c.json<ApiResponse>({ success: false, error: 'Vehicle not found' }, 404);

  const invoiceId = await generateInvoiceId(db);
  const subtotalPaise = body.line_items.reduce((sum, item) => sum + item.amount_paise, 0);
  const taxPaise = calculateGST(subtotalPaise);
  const totalAmountPaise = subtotalPaise + taxPaise;
  const advancePaidPaise = body.advance_paid_paise || 0;

  let status = body.status || 'Unpaid';
  if (advancePaidPaise >= totalAmountPaise) status = 'Paid';
  else if (advancePaidPaise > 0) status = 'Partially Paid';

  const statements: D1PreparedStatement[] = [];
  statements.push(db.prepare(`INSERT INTO invoices (id, client_id, car_id, start_date, end_date, start_km, end_km, subtotal_paise, tax_paise, total_amount_paise, advance_paid_paise, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(invoiceId, body.client_id, body.car_id, body.start_date, body.end_date, body.start_km ?? null, body.end_km ?? null, subtotalPaise, taxPaise, totalAmountPaise, advancePaidPaise, status));
  for (const item of body.line_items) statements.push(db.prepare(`INSERT INTO invoice_line_items (invoice_id, description, amount_paise) VALUES (?, ?, ?)`).bind(invoiceId, item.description, item.amount_paise));
  statements.push(db.prepare(`UPDATE cars SET available = 0 WHERE id = ?`).bind(body.car_id));

  await db.batch(statements);

  const createdInvoice = await db.prepare(`SELECT i.*, c.full_name as client_name, f.name as car_model, '' as registration_number FROM invoices i JOIN clients c ON i.client_id = c.id JOIN cars f ON i.car_id = f.id WHERE i.id = ?`).bind(invoiceId).first();
  const lineItems = await db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ?').bind(invoiceId).all();

  return c.json<ApiResponse>({ success: true, data: { ...createdInvoice, line_items: lineItems.results } }, 201);
});

invoiceRoutes.patch('/:id/status', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json<{ status: string; advance_paid_paise?: number }>();

  if (!body.status || !['Draft', 'Unpaid', 'Partially Paid', 'Paid'].includes(body.status)) return c.json<ApiResponse>({ success: false, error: 'Invalid status' }, 400);

  const statements: D1PreparedStatement[] = [];
  if (body.advance_paid_paise !== undefined) statements.push(db.prepare('UPDATE invoices SET status = ?, advance_paid_paise = ? WHERE id = ?').bind(body.status, body.advance_paid_paise, id));
  else statements.push(db.prepare('UPDATE invoices SET status = ? WHERE id = ?').bind(body.status, id));

  await db.batch(statements);
  const updated = await db.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first();
  return c.json<ApiResponse>({ success: true, data: updated });
});

invoiceRoutes.delete('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const invoice = await db.prepare('SELECT id, status, car_id FROM invoices WHERE id = ?').bind(id).first<{ id: string; status: string; car_id: number }>();
  if (!invoice) return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);
  if (invoice.status !== 'Draft') return c.json<ApiResponse>({ success: false, error: 'Only Draft invoices can be deleted' }, 400);

  await db.batch([
    db.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').bind(id),
    db.prepare('DELETE FROM invoices WHERE id = ?').bind(id),
    db.prepare(`UPDATE cars SET available = 1 WHERE id = ?`).bind(invoice.car_id),
  ]);

  return c.json<ApiResponse>({ success: true, data: { deleted: id } });
});

invoiceRoutes.post('/:id/end-trip', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json<{ end_km: number; extra_charge_paise?: number; description?: string }>();

  if (body.end_km == null) return c.json<ApiResponse>({ success: false, error: 'end_km is required' }, 400);
  const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first<Invoice>();
  if (!invoice) return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);

  const statements: D1PreparedStatement[] = [];
  let newSubtotal = invoice.subtotal_paise;
  if (body.extra_charge_paise && body.extra_charge_paise > 0) {
    const desc = body.description || 'Extra KM Charge';
    statements.push(db.prepare(`INSERT INTO invoice_line_items (invoice_id, description, amount_paise) VALUES (?, ?, ?)`).bind(id, desc, body.extra_charge_paise));
    newSubtotal += body.extra_charge_paise;
  }

  const taxPaise = calculateGST(newSubtotal);
  const totalAmountPaise = newSubtotal + taxPaise;

  statements.push(db.prepare(`UPDATE invoices SET end_km = ?, subtotal_paise = ?, tax_paise = ?, total_amount_paise = ? WHERE id = ?`).bind(body.end_km, newSubtotal, taxPaise, totalAmountPaise, id));
  statements.push(db.prepare(`UPDATE cars SET available = 1 WHERE id = ?`).bind(invoice.car_id));

  await db.batch(statements);
  const updated = await db.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first();
  return c.json<ApiResponse>({ success: true, data: updated });
});
