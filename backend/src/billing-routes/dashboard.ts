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
  const totalClientsResult = await db.prepare(`SELECT COUNT(*) as count FROM clients`).first<{ count: number }>();
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
    `SELECT i.id, i.total_amount_paise, i.advance_paid_paise, i.status, i.start_date, i.end_date, i.created_at, c.full_name as client_name, c.phone_number as client_phone, '' as registration_number, f.name as car_model
     FROM invoices i
     JOIN clients c ON i.client_id = c.id
     JOIN cars f ON i.car_id = f.id
     ORDER BY i.created_at DESC LIMIT 5`
  ).all();
  return c.json<ApiResponse>({ success: true, data: result.results });
});
