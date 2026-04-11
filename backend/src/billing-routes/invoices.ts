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

function calculateGST(subtotalPaise: number, rate: number): number {
  return Math.round((subtotalPaise * rate) / 100);
}

invoiceRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (status) { conditions.push('i.status = ?'); bindings.push(status); }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM invoices i ${whereClause}`).bind(...bindings).first<{ total: number }>();

  const query = `
    SELECT i.*, f.name as car_model, '' as registration_number
    FROM invoices i
    JOIN cars f ON i.car_id  = f.id
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
    `SELECT i.*, f.name as car_model, '' as registration_number, (f.price * 100) as daily_rate_paise
     FROM invoices i JOIN cars f ON i.car_id = f.id WHERE i.id = ?`
  ).bind(id).first();

  if (!invoice) return c.json<ApiResponse>({ success: false, error: 'Invoice not found' }, 404);
  const lineItems = await db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY id ASC').bind(id).all();

  return c.json<ApiResponse>({ success: true, data: { ...invoice, line_items: lineItems.results } });
});

invoiceRoutes.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<CreateInvoiceRequest>();

  if (!body.customer_name || !body.customer_phone || !body.car_id || !body.start_date || !body.end_date) {
    return c.json<ApiResponse>({ success: false, error: 'customer_name, customer_phone, car_id, start_date, and end_date are required' }, 400);
  }

  const vehicle = await db.prepare('SELECT id FROM cars WHERE id = ?').bind(body.car_id).first();
  if (!vehicle) return c.json<ApiResponse>({ success: false, error: 'Vehicle not found' }, 404);

  const invoiceId = await generateInvoiceId(db);
  
  // High Fidelity Calculations
  const workingDays = body.working_days || 0;
  const kmLimitPerDay = body.km_limit_per_day ?? 300;
  const extraKmRate = body.extra_km_rate_paise || 0;
  
  // 1. Base amount (usually days * rate)
  const amountForDaysPaise = body.amount_for_days_paise || 0;
  
  // 2. Average Monthly (e.g. Rate x Number of vehicles)
  const qtyAvgVehicles = body.qty_avg_per_month || 1;
  const avgMonthlyTotalPaise = (body.avg_monthly_rate_paise || 0) * qtyAvgVehicles;
  
  // 3. Distance Calculations — supports manual override for GST2
  let totalKm: number, extraKmQty: number, extraKmTotalPaise: number;
  if (body.start_km && body.end_km) {
    totalKm = body.end_km - body.start_km;
    const includedKms = workingDays * kmLimitPerDay;
    extraKmQty = Math.max(0, totalKm - includedKms);
  } else {
    totalKm = 0;
    extraKmQty = body.extra_km_qty || 0;
  }
  extraKmTotalPaise = extraKmQty * extraKmRate;
  
  // 4. Extra Duty Calculation
  const extraDutyHours = body.driver_extra_duty_hours || 0;
  const extraDutyRate = body.driver_extra_duty_rate_paise || 0;
  const extraDutyTotalPaise = Math.round(extraDutyHours * extraDutyRate);

  // 5. Total Summation
  const nonTaxableExtras = (body.driver_batta_paise || 0) + (body.toll_gate_paise || 0) + (body.fastag_paise || 0);
  const lineItemsSum = (body.line_items || []).reduce((sum, item) => sum + item.amount_paise, 0);
  
  // Final taxable subtotal
  const taxableSubtotalPaise = amountForDaysPaise + avgMonthlyTotalPaise + extraKmTotalPaise + extraDutyTotalPaise + lineItemsSum;
  
  // Tax Logic
  const cgstRate = body.cgst_rate ?? 9.0;
  const sgstRate = body.sgst_rate ?? 9.0;
  const cgstPaise = (body.bill_type === 'GST' || body.bill_type === 'GST2') ? calculateGST(taxableSubtotalPaise, cgstRate) : 0;
  const sgstPaise = (body.bill_type === 'GST' || body.bill_type === 'GST2') ? calculateGST(taxableSubtotalPaise, sgstRate) : 0;
  
  // Grand total including non-taxable reimbursements (Toll, Fastag, Batta)
  const totalAmountPaise = taxableSubtotalPaise + cgstPaise + sgstPaise + nonTaxableExtras;
  const advancePaidPaise = body.advance_paid_paise || 0;

  let status = body.status || 'Unpaid';
  if (advancePaidPaise >= totalAmountPaise) status = 'Paid';
  else if (advancePaidPaise > 0) status = 'Partially Paid';

  const statements: D1PreparedStatement[] = [];
  statements.push(db.prepare(`
    INSERT INTO invoices (
      id, car_id, bill_type, customer_name, customer_phone, customer_email, customer_gstin, company_name, party_gstin, place_from, place_to, working_days,
      start_date, end_date, start_km, end_km, subtotal_paise, extra_km_rate_paise, avg_monthly_rate_paise,
      driver_extra_duty_paise, driver_batta_paise, toll_gate_paise, fastag_paise,
      cgst_rate, sgst_rate, cgst_paise, sgst_paise, total_amount_paise, advance_paid_paise,
      total_km, extra_km_qty, extra_km_total_paise, driver_extra_duty_hours, driver_extra_duty_rate_paise,
      driver_extra_duty_total_paise, amount_for_days_paise, qty_avg_per_month, km_limit_per_day,
      vehicle_no_override, trip_description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    invoiceId, body.car_id, body.bill_type, body.customer_name, body.customer_phone, body.customer_email || null, body.customer_gstin || null, body.company_name || null, body.party_gstin || null,
    body.place_from || null, body.place_to || null, workingDays,
    body.start_date, body.end_date, body.start_km ?? null, body.end_km ?? null,
    taxableSubtotalPaise, extraKmRate, body.avg_monthly_rate_paise || 0,
    extraDutyTotalPaise, body.driver_batta_paise || 0, body.toll_gate_paise || 0, body.fastag_paise || 0,
    cgstRate, sgstRate, cgstPaise, sgstPaise, totalAmountPaise, advancePaidPaise,
    totalKm, extraKmQty, extraKmTotalPaise, extraDutyHours, extraDutyRate,
    extraDutyTotalPaise, amountForDaysPaise, qtyAvgVehicles, kmLimitPerDay,
    body.vehicle_no_override || null, body.trip_description || null, status
  ));

  if (body.line_items && body.line_items.length > 0) {
    for (const item of body.line_items) {
      statements.push(db.prepare(`INSERT INTO invoice_line_items (invoice_id, description, amount_paise) VALUES (?, ?, ?)`).bind(invoiceId, item.description, item.amount_paise));
    }
  }

  if (body.bill_type !== 'GST2') {
    statements.push(db.prepare(`UPDATE cars SET available = 0 WHERE id = ?`).bind(body.car_id));
  }

  await db.batch(statements);

  const createdInvoice = await db.prepare(`
    SELECT i.*, f.name as car_model, '' as registration_number 
    FROM invoices i 
    JOIN cars f ON i.car_id = f.id 
    WHERE i.id = ?
  `).bind(invoiceId).first();
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
  // Admin deletion allowed for all statuses in dashboard logic

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

  const startKm = invoice.start_km || 0;
  const endKm = body.end_km;
  const totalKm = endKm - startKm;
  const days = invoice.working_days || 1;
  const limit = invoice.km_limit_per_day || 300;
  const includedKms = days * limit;
  const extraKmQty = Math.max(0, totalKm - includedKms);
  const extraKmTotalPaise = extraKmQty * invoice.extra_km_rate_paise;

  const statements: D1PreparedStatement[] = [];
  
  // If an extra charge was passed manually, add it as a line item
  if (body.extra_charge_paise) {
    statements.push(db.prepare(`INSERT INTO invoice_line_items (invoice_id, description, amount_paise) VALUES (?, ?, ?)`).bind(id, body.description || 'Final Trip Adjustment', body.extra_charge_paise));
  }

  // Calculate new taxable subtotal including the new KM distance math
  const subtotalBeforeTripEnd = invoice.amount_for_days_paise + (invoice.avg_monthly_rate_paise * invoice.qty_avg_per_month) + invoice.driver_extra_duty_total_paise;
  // Note: we can't easily fetch line items in the same batch, so we rely on what was previously there.
  const lineItems = await db.prepare('SELECT SUM(amount_paise) as total FROM invoice_line_items WHERE invoice_id = ?').bind(id).first<{total: number}>();
  const currentLineItemsTotal = (lineItems?.total || 0) + (body.extra_charge_paise || 0);

  const finalSubtotalPaise = subtotalBeforeTripEnd + extraKmTotalPaise + currentLineItemsTotal;
  
  const cgstPaise = invoice.bill_type === 'GST' ? calculateGST(finalSubtotalPaise, invoice.cgst_rate) : 0;
  const sgstPaise = invoice.bill_type === 'GST' ? calculateGST(finalSubtotalPaise, invoice.sgst_rate) : 0;
  
  const extras = invoice.driver_batta_paise + invoice.toll_gate_paise + invoice.fastag_paise;
  const totalAmountPaise = finalSubtotalPaise + cgstPaise + sgstPaise + extras;

  statements.push(db.prepare(`
    UPDATE invoices 
    SET end_km = ?, total_km = ?, extra_km_qty = ?, extra_km_total_paise = ?, 
        subtotal_paise = ?, cgst_paise = ?, sgst_paise = ?, total_amount_paise = ?,
        status = 'Unpaid'
    WHERE id = ?
  `).bind(endKm, totalKm, extraKmQty, extraKmTotalPaise, finalSubtotalPaise, cgstPaise, sgstPaise, totalAmountPaise, id));
  
  statements.push(db.prepare(`UPDATE cars SET available = 1 WHERE id = ?`).bind(invoice.car_id));

  await db.batch(statements);
  const updated = await db.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first();
  return c.json<ApiResponse>({ success: true, data: updated });
});
