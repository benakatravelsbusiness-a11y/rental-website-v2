import { Hono } from 'hono';
import type { Env, ApiResponse, Invoice, CreateInvoiceRequest } from '../types';

export const invoiceRoutes = new Hono<{ Bindings: Env }>();

// ---------- Helpers ----------

/**
 * Generate invoice ID in format: INV-YYYY-XXXX
 * Finds the highest existing sequence number for the current year and increments.
 */
async function generateInvoiceId(db: D1Database): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const result = await db
    .prepare(
      `SELECT id FROM invoices
       WHERE id LIKE ?
       ORDER BY id DESC
       LIMIT 1`
    )
    .bind(`${prefix}%`)
    .first<{ id: string }>();

  let nextSeq = 1;
  if (result) {
    const lastSeq = parseInt(result.id.split('-').pop() || '0', 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

/**
 * Calculate 18% GST (9% CGST + 9% SGST) on subtotal.
 * Uses integer math to avoid floating-point errors.
 */
function calculateGST(subtotalPaise: number): number {
  // 18% of subtotal: (subtotal * 18) / 100, rounded to nearest paise
  return Math.round((subtotalPaise * 18) / 100);
}

// ---------- Routes ----------

// GET /api/invoices — List all invoices with filters
invoiceRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status');
  const clientId = c.req.query('client_id');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (status) {
    conditions.push('i.status = ?');
    bindings.push(status);
  }
  if (clientId) {
    conditions.push('i.client_id = ?');
    bindings.push(parseInt(clientId, 10));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM invoices i ${whereClause}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const query = `
    SELECT
      i.*,
      c.full_name as client_name,
      c.phone_number as client_phone,
      f.car_model,
      f.registration_number
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    JOIN fleet f   ON i.fleet_id  = f.id
    ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const allBindings = [...bindings, limit, offset];
  const result = await db.prepare(query).bind(...allBindings).all();

  return c.json<ApiResponse>({
    success: true,
    data: {
      invoices: result.results,
      total: countResult?.total ?? 0,
      page,
      limit,
    },
  });
});

// GET /api/invoices/:id — Single invoice with line items
invoiceRoutes.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const invoice = await db
    .prepare(
      `SELECT
         i.*,
         c.full_name as client_name,
         c.phone_number as client_phone,
         c.email as client_email,
         c.driving_license_number as client_dl,
         c.gstin as client_gstin,
         f.car_model,
         f.registration_number,
         f.daily_rate_paise
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       JOIN fleet f   ON i.fleet_id  = f.id
       WHERE i.id = ?`
    )
    .bind(id)
    .first();

  if (!invoice) {
    return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);
  }

  const lineItems = await db
    .prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY id ASC')
    .bind(id)
    .all();

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...invoice,
      line_items: lineItems.results,
    },
  });
});

// POST /api/invoices — Create invoice with line items (transactional)
invoiceRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<CreateInvoiceRequest>();

  // Validation
  if (!body.client_id || !body.fleet_id || !body.start_date || !body.end_date) {
    return c.json<ApiResponse>(
      { success: false, error: 'client_id, fleet_id, start_date, and end_date are required' },
      400
    );
  }

  if (!body.line_items || body.line_items.length === 0) {
    return c.json<ApiResponse>(
      { success: false, error: 'At least one line item is required' },
      400
    );
  }

  // Verify client exists
  const client = await db
    .prepare('SELECT id FROM clients WHERE id = ?')
    .bind(body.client_id)
    .first();

  if (!client) {
    return c.json<ApiResponse>({ success: false, error: 'Client not found' }, 404);
  }

  // Verify fleet vehicle exists
  const vehicle = await db
    .prepare('SELECT id FROM fleet WHERE id = ?')
    .bind(body.fleet_id)
    .first();

  if (!vehicle) {
    return c.json<ApiResponse>({ success: false, error: 'Vehicle not found' }, 404);
  }

  // Generate invoice ID
  const invoiceId = await generateInvoiceId(db);

  // Calculate totals from line items (all in paise — integer math only)
  const subtotalPaise = body.line_items.reduce((sum, item) => sum + item.amount_paise, 0);
  const taxPaise = calculateGST(subtotalPaise);
  const totalAmountPaise = subtotalPaise + taxPaise;
  const advancePaidPaise = body.advance_paid_paise || 0;

  // Determine initial status
  let status = body.status || 'Unpaid';
  if (advancePaidPaise >= totalAmountPaise) {
    status = 'Paid';
  } else if (advancePaidPaise > 0) {
    status = 'Partially Paid';
  }

  // Use D1 batch for transactional insertion
  const statements: D1PreparedStatement[] = [];

  // 1. Insert the invoice
  statements.push(
    db
      .prepare(
        `INSERT INTO invoices
         (id, client_id, fleet_id, start_date, end_date, start_km, end_km,
          subtotal_paise, tax_paise, total_amount_paise, advance_paid_paise, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        invoiceId,
        body.client_id,
        body.fleet_id,
        body.start_date,
        body.end_date,
        body.start_km ?? null,
        body.end_km ?? null,
        subtotalPaise,
        taxPaise,
        totalAmountPaise,
        advancePaidPaise,
        status
      )
  );

  // 2. Insert each line item
  for (const item of body.line_items) {
    statements.push(
      db
        .prepare(
          `INSERT INTO invoice_line_items (invoice_id, description, amount_paise)
           VALUES (?, ?, ?)`
        )
        .bind(invoiceId, item.description, item.amount_paise)
    );
  }

  // 3. Update fleet status to On-Trip
  statements.push(
    db
      .prepare(`UPDATE fleet SET status = 'On-Trip' WHERE id = ?`)
      .bind(body.fleet_id)
  );

  // Execute all statements as a batch (D1 guarantees atomicity for batches)
  await db.batch(statements);

  // Fetch the complete invoice to return
  const createdInvoice = await db
    .prepare(
      `SELECT i.*, c.full_name as client_name, f.car_model, f.registration_number
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       JOIN fleet f   ON i.fleet_id  = f.id
       WHERE i.id = ?`
    )
    .bind(invoiceId)
    .first();

  const lineItems = await db
    .prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ?')
    .bind(invoiceId)
    .all();

  return c.json<ApiResponse>(
    {
      success: true,
      data: {
        ...createdInvoice,
        line_items: lineItems.results,
      },
    },
    201
  );
});

// PATCH /api/invoices/:id/status — Update invoice status
invoiceRoutes.patch('/:id/status', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json<{ status: string; advance_paid_paise?: number }>();

  const validStatuses = ['Draft', 'Unpaid', 'Partially Paid', 'Paid'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return c.json<ApiResponse>(
      { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      400
    );
  }

  const statements: D1PreparedStatement[] = [];

  // Determine if status requires update
  if (body.advance_paid_paise !== undefined) {
    statements.push(
      db
        .prepare('UPDATE invoices SET status = ?, advance_paid_paise = ? WHERE id = ?')
        .bind(body.status, body.advance_paid_paise, id)
    );
  } else {
    statements.push(
      db
        .prepare('UPDATE invoices SET status = ? WHERE id = ?')
        .bind(body.status, id)
    );
  }

  await db.batch(statements);

  const updated = await db
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(id)
    .first();

  if (!updated) {
    return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);
  }

  return c.json<ApiResponse<Invoice>>({ success: true, data: updated as unknown as Invoice });
});

// DELETE /api/invoices/:id — Delete a draft invoice
invoiceRoutes.delete('/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  // Only allow deleting Draft invoices
  const invoice = await db
    .prepare('SELECT id, status, fleet_id FROM invoices WHERE id = ?')
    .bind(id)
    .first<{ id: string; status: string; fleet_id: number }>();

  if (!invoice) {
    return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);
  }

  if (invoice.status !== 'Draft') {
    return c.json<ApiResponse>(
      { success: false, error: 'Only Draft invoices can be deleted' },
      400
    );
  }

  // Delete line items + invoice, set fleet back to Available
  await db.batch([
    db.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').bind(id),
    db.prepare('DELETE FROM invoices WHERE id = ?').bind(id),
    db.prepare(`UPDATE fleet SET status = 'Available' WHERE id = ?`).bind(invoice.fleet_id),
  ]);

  return c.json<ApiResponse>({ success: true, data: { deleted: id } });
});

// POST /api/invoices/:id/end-trip — Mark trip as completed, optionally add extra KM charge, and release fleet
invoiceRoutes.post('/:id/end-trip', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json<{ end_km: number; extra_charge_paise?: number; description?: string }>();

  if (body.end_km == null) {
    return c.json<ApiResponse>({ success: false, error: 'end_km is required' }, 400);
  }

  const invoice = await db
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(id)
    .first<Invoice>();

  if (!invoice) {
    return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);
  }

  // Can only end trips that aren't already ended (assuming ended means fleet is 'Available', but we'll use a pragmatic approach)
  const statements: D1PreparedStatement[] = [];

  // Update End KM
  let newSubtotal = invoice.subtotal_paise;
  if (body.extra_charge_paise && body.extra_charge_paise > 0) {
    const desc = body.description || 'Extra KM Charge';
    statements.push(
      db.prepare(
        `INSERT INTO invoice_line_items (invoice_id, description, amount_paise) VALUES (?, ?, ?)`
      ).bind(id, desc, body.extra_charge_paise)
    );
    newSubtotal += body.extra_charge_paise;
  }

  const taxPaise = calculateGST(newSubtotal);
  const totalAmountPaise = newSubtotal + taxPaise;

  statements.push(
    db.prepare(
      `UPDATE invoices SET end_km = ?, subtotal_paise = ?, tax_paise = ?, total_amount_paise = ? WHERE id = ?`
    ).bind(body.end_km, newSubtotal, taxPaise, totalAmountPaise, id)
  );

  statements.push(
    db.prepare(`UPDATE fleet SET status = 'Available' WHERE id = ?`).bind(invoice.fleet_id)
  );

  await db.batch(statements);

  const updated = await db
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .bind(id)
    .first();

  return c.json<ApiResponse<Invoice>>({ success: true, data: updated as unknown as Invoice });
});
