import { Hono } from 'hono';
import type { Env, ApiResponse, DashboardStats } from '../types';

export const dashboardRoutes = new Hono<{ Bindings: Env }>();

// GET /api/dashboard — Aggregate stats
dashboardRoutes.get('/', async (c) => {
  const db = c.env.DB;

  // Get the first day of the current month in UTC
  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);

  // Revenue this month: sum of all received money (advance_paid_paise) for non-draft invoices created this month
  const revenueResult = await db
    .prepare(
      `SELECT COALESCE(SUM(advance_paid_paise), 0) as total
       FROM invoices
       WHERE status != 'Draft' AND created_at >= ?`
    )
    .bind(firstOfMonth)
    .first<{ total: number }>();

  // Outstanding payments: total amount minus what's paid, only for Unpaid and Partially Paid
  const outstandingResult = await db
    .prepare(
      `SELECT COALESCE(SUM(total_amount_paise - advance_paid_paise), 0) as total
       FROM invoices
       WHERE status IN ('Unpaid', 'Partially Paid')`
    )
    .first<{ total: number }>();

  // Active trips (fleet with status = 'On-Trip')
  const activeTripsResult = await db
    .prepare(`SELECT COUNT(*) as count FROM fleet WHERE status = 'On-Trip'`)
    .first<{ count: number }>();

  // Total clients
  const totalClientsResult = await db
    .prepare(`SELECT COUNT(*) as count FROM clients`)
    .first<{ count: number }>();

  // Total fleet
  const totalFleetResult = await db
    .prepare(`SELECT COUNT(*) as count FROM fleet`)
    .first<{ count: number }>();

  const stats: DashboardStats = {
    revenue_this_month_paise: revenueResult?.total ?? 0,
    outstanding_paise: outstandingResult?.total ?? 0,
    active_trips: activeTripsResult?.count ?? 0,
    total_clients: totalClientsResult?.count ?? 0,
    total_fleet: totalFleetResult?.count ?? 0,
  };

  return c.json<ApiResponse<DashboardStats>>({ success: true, data: stats });
});

// GET /api/dashboard/recent-invoices — Last 5 invoices with client & car info
dashboardRoutes.get('/recent-invoices', async (c) => {
  const db = c.env.DB;

  const result = await db
    .prepare(
      `SELECT
         i.id,
         i.total_amount_paise,
         i.advance_paid_paise,
         i.status,
         i.start_date,
         i.end_date,
         i.created_at,
         c.full_name as client_name,
         c.phone_number as client_phone,
         f.registration_number,
         f.car_model
       FROM invoices i
       JOIN clients c ON i.client_id = c.id
       JOIN fleet f   ON i.fleet_id  = f.id
       ORDER BY i.created_at DESC
       LIMIT 5`
    )
    .all();

  return c.json<ApiResponse>({ success: true, data: result.results });
});
