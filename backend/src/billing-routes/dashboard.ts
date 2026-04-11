import { Hono } from 'hono';
import type { Env, ApiResponse, DashboardStats } from './types';

export const dashboardRoutes = new Hono<{ Bindings: Env }>();

dashboardRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().replace('T', ' ').slice(0, 19);

  const revenueResult = await db.prepare(`SELECT COALESCE(SUM(advance_paid_paise), 0) as total FROM invoices WHERE status != 'Draft' AND created_at >= ?`).bind(firstOfMonth).first<{ total: number }>();
  const outstandingResult = await db.prepare(`SELECT COALESCE(SUM(total_amount_paise - advance_paid_paise), 0) as total FROM invoices WHERE status IN ('Unpaid', 'Partially Paid')`).first<{ total: number }>();
  const activeTripsResult = await db.prepare(`SELECT COUNT(*) as count FROM cars WHERE available = 0`).first<{ count: number }>();
  const totalClientsResult = await db.prepare(`SELECT COUNT(DISTINCT customer_phone) as count FROM invoices`).first<{ count: number }>();
  const totalFleetResult = await db.prepare(`SELECT COUNT(*) as count FROM cars`).first<{ count: number }>();

  const stats = {
    revenue_this_month_paise: revenueResult?.total ?? 0,
    outstanding_paise: outstandingResult?.total ?? 0,
    active_trips: activeTripsResult?.count ?? 0,
    total_clients: totalClientsResult?.count ?? 0,
    total_fleet: totalFleetResult?.count ?? 0,
    total_bookings: (await db.prepare('SELECT COUNT(*) as count FROM bookings').first<{ count: number }>())?.count ?? 0,
  };

  return c.json<ApiResponse<DashboardStats>>({ success: true, data: stats });
});

dashboardRoutes.get('/recent-invoices', async (c) => {
  const db = c.env.DB;
  const result = await db.prepare(
    `SELECT i.id, i.total_amount_paise, i.advance_paid_paise, i.status, i.start_date, i.end_date, i.created_at, i.customer_name as client_name, i.customer_phone as client_phone, '' as registration_number, f.name as car_model
     FROM invoices i
     LEFT JOIN cars f ON i.car_id = f.id
     ORDER BY i.created_at DESC LIMIT 5`
  ).all();
  return c.json<ApiResponse>({ success: true, data: result.results });
});

dashboardRoutes.get('/revenue-report', async (c) => {
  const db = c.env.DB;
  const start = c.req.query('start');
  const end = c.req.query('end');

  if (!start || !end) {
    return c.json({ success: false, error: 'Start and end dates are required' }, 400);
  }

  // Filter by created_at between start and end (inclusive)
  const invoices = await db.prepare(
    `SELECT id, total_amount_paise, advance_paid_paise, status, created_at, customer_name, 'Invoice' as type
     FROM invoices 
     WHERE created_at >= ? AND created_at <= ? AND status != 'Draft'`
  ).bind(start + ' 00:00:00', end + ' 23:59:59').all();

  const bookings = await db.prepare(
    `SELECT ref as id, total_price as total_amount_paise, 0 as advance_paid_paise, status, created_at, customer_name, 'Booking' as type
     FROM bookings
     WHERE created_at >= ? AND created_at <= ? AND status IN ('confirmed', 'completed')`
  ).bind(start, end).all();

  const combined = [...invoices.results, ...bookings.results].sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total_revenue = combined.reduce((acc: number, curr: any) => acc + (curr.advance_paid_paise || curr.total_amount_paise || 0), 0);
  const total_outstanding = combined.reduce((acc: number, curr: any) => {
    if (curr.type === 'Invoice' && (curr.status === 'Unpaid' || curr.status === 'Partially Paid')) {
      return acc + (curr.total_amount_paise - curr.advance_paid_paise);
    }
    return acc;
  }, 0);

  return c.json({
    success: true,
    data: {
      transactions: combined,
      summary: {
        total_revenue_paise: total_revenue,
        total_outstanding_paise: total_outstanding,
        count: combined.length
      }
    }
  });
});
