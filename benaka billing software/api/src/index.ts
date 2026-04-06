import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, ApiResponse } from './types';
import { dashboardRoutes } from './routes/dashboard';
import { fleetRoutes } from './routes/fleet';
import { clientRoutes } from './routes/clients';
import { invoiceRoutes } from './routes/invoices';

const app = new Hono<{ Bindings: Env }>();

// ---------- Middleware ----------

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Global error handler
app.onError((err, c) => {
  console.error(`[API Error] ${err.message}`, err.stack);
  const response: ApiResponse = {
    success: false,
    error: err.message || 'Internal Server Error',
  };
  return c.json(response, 500);
});

// ---------- Health Check ----------

app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      name: 'Benaka Billing API',
      version: '1.0.0',
      status: 'healthy',
    },
  });
});

// ---------- Mount Routes ----------

app.route('/api/dashboard', dashboardRoutes);
app.route('/api/fleet', fleetRoutes);
app.route('/api/clients', clientRoutes);
app.route('/api/invoices', invoiceRoutes);

// ---------- 404 ----------

app.notFound((c) => {
  return c.json<ApiResponse>({ success: false, error: 'Route not found' }, 404);
});

export default app;
