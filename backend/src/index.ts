import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();

const ADMIN_PASSWORD = 'benakaAdmin2026';

app.use('*', secureHeaders());
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'] }));

// Admin Auth Middleware
app.use('/api/admin/*', async (c, next) => {
  const auth = c.req.header('Authorization');
  if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateRef(): string {
  return 'BT' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).toUpperCase().slice(2, 4);
}

function calcDays(pickup: string, ret: string): number {
  const d1 = new Date(pickup), d2 = new Date(ret);
  return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));
}

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

// Get all cars (with optional filters)
app.get('/api/cars', async (c) => {
  try {
    const category = c.req.query('category');
    const maxPrice = c.req.query('maxPrice');
    let query = 'SELECT * FROM cars WHERE 1=1';
    const params: any[] = [];
    if (category && category !== 'All') {
      query += ' AND category = ?'; params.push(category);
    }
    if (maxPrice) {
      query += ' AND price <= ?'; params.push(parseInt(maxPrice));
    }
    query += ' ORDER BY price ASC';
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Get single car
app.get('/api/cars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const car = await c.env.DB.prepare('SELECT * FROM cars WHERE id = ?').bind(id).first();
    if (!car) return c.json({ error: 'Car not found' }, 404);
    return c.json(car);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Create booking (public - customers)
app.post('/api/bookings', async (c) => {
  try {
    const { car_id, customer_name, customer_phone, customer_email, pickup_date, return_date } = await c.req.json();

    if (!car_id || !customer_name || !customer_phone || !customer_email || !pickup_date || !return_date) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Validate dates
    const days = calcDays(pickup_date, return_date);
    if (days < 1) return c.json({ error: 'Return date must be after pickup date' }, 400);

    // Get car and check availability
    const car = await c.env.DB.prepare('SELECT * FROM cars WHERE id = ? AND available = 1').bind(car_id).first() as any;
    if (!car) return c.json({ error: 'Car is not available for booking' }, 400);

    const total_price = car.price * days;
    const ref = generateRef();

    await c.env.DB.prepare(`
      INSERT INTO bookings (ref, car_id, car_name, customer_name, customer_phone, customer_email, pickup_date, return_date, total_days, daily_rate, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(ref, car_id, car.name, customer_name, customer_phone, customer_email, pickup_date, return_date, days, car.price, total_price).run();

    // Mark car as unavailable immediately
    await c.env.DB.prepare('UPDATE cars SET available = 0 WHERE id = ?').bind(car_id).run();

    return c.json({
      message: 'Booking placed successfully!',
      ref,
      car: car.name,
      category: car.category,
      days,
      daily_rate: car.price,
      total_price,
      pickup_date,
      return_date,
      customer_name,
      customer_phone,
      customer_email
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Track booking by reference (public)
app.get('/api/bookings/track/:ref', async (c) => {
  try {
    const ref = c.req.param('ref');
    const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE ref = ?').bind(ref).first();
    if (!booking) return c.json({ error: 'Booking not found' }, 404);
    return c.json(booking);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

// Dashboard stats (FIXED: revenue counts both confirmed AND completed)
app.get('/api/admin/stats', async (c) => {
  try {
    const totalCars = await c.env.DB.prepare('SELECT COUNT(*) as count FROM cars').first() as any;
    const availableCars = await c.env.DB.prepare('SELECT COUNT(*) as count FROM cars WHERE available = 1').first() as any;
    const rentedCars = await c.env.DB.prepare('SELECT COUNT(*) as count FROM cars WHERE available = 0').first() as any;
    const totalBookings = await c.env.DB.prepare('SELECT COUNT(*) as count FROM bookings').first() as any;
    const pending = await c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status='pending'").first() as any;
    const confirmed = await c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status='confirmed'").first() as any;
    const completed = await c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status='completed'").first() as any;
    const cancelled = await c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status='cancelled'").first() as any;

    // FIXED: Revenue = confirmed + completed (real profit after trip)
    const revenue = await c.env.DB.prepare(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status IN ('confirmed', 'completed')"
    ).first() as any;

    // Revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthRevenue = await c.env.DB.prepare(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE status IN ('confirmed', 'completed') AND created_at >= ?"
    ).bind(monthStart.toISOString()).first() as any;

    return c.json({
      totalCars: totalCars?.count ?? 0,
      availableCars: availableCars?.count ?? 0,
      rentedCars: rentedCars?.count ?? 0,
      totalBookings: totalBookings?.count ?? 0,
      pendingBookings: pending?.count ?? 0,
      confirmedBookings: confirmed?.count ?? 0,
      completedBookings: completed?.count ?? 0,
      cancelledBookings: cancelled?.count ?? 0,
      totalRevenue: revenue?.total ?? 0,
      monthRevenue: monthRevenue?.total ?? 0
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Get all cars (admin)
app.get('/api/admin/cars', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cars ORDER BY id DESC').all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Add car
app.post('/api/admin/cars', async (c) => {
  try {
    const { name, category, price, image_url, features, seats, fuel_type } = await c.req.json();
    if (!name || !category || !price || !image_url || !features) {
      return c.json({ error: 'All required fields must be filled' }, 400);
    }
    await c.env.DB.prepare(`
      INSERT INTO cars (name, category, price, image_url, features, seats, fuel_type, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(name, category, parseInt(price), image_url, features, parseInt(seats) || 5, fuel_type || 'Petrol').run();
    return c.json({ message: 'Car added successfully!' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Toggle car availability
app.patch('/api/admin/cars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { available } = await c.req.json();
    await c.env.DB.prepare('UPDATE cars SET available = ? WHERE id = ?').bind(available ? 1 : 0, id).run();
    return c.json({ message: 'Updated successfully' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Delete car (also cancel any pending bookings for this car)
app.delete('/api/admin/cars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE car_id = ? AND status = 'pending'").bind(id).run();
    await c.env.DB.prepare('DELETE FROM cars WHERE id = ?').bind(id).run();
    return c.json({ message: 'Deleted successfully' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Get all bookings
app.get('/api/admin/bookings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Update booking status (FIXED: completed releases car + counts as revenue)
app.patch('/api/admin/bookings/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first() as any;
    if (!booking) return c.json({ error: 'Booking not found' }, 404);

    // Prevent illogical transitions
    if (booking.status === 'completed') return c.json({ error: 'Cannot change a completed booking' }, 400);
    if (booking.status === 'cancelled') return c.json({ error: 'Cannot change a cancelled booking' }, 400);

    await c.env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ?').bind(status, id).run();

    // FIXED: When trip is COMPLETED → release car back to available AND revenue is preserved
    if (status === 'completed') {
      await c.env.DB.prepare('UPDATE cars SET available = 1 WHERE id = ?').bind(booking.car_id).run();
    }

    // When CANCELLED → release car back to available, revenue NOT counted
    if (status === 'cancelled') {
      await c.env.DB.prepare('UPDATE cars SET available = 1 WHERE id = ?').bind(booking.car_id).run();
    }

    // When CONFIRMED → car stays unavailable (trip in progress)
    if (status === 'confirmed') {
      await c.env.DB.prepare('UPDATE cars SET available = 0 WHERE id = ?').bind(booking.car_id).run();
    }

    return c.json({ message: `Booking ${status} successfully` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Delete a booking
app.delete('/api/admin/bookings/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first() as any;
    if (booking && (booking.status === 'pending' || booking.status === 'confirmed')) {
      await c.env.DB.prepare('UPDATE cars SET available = 1 WHERE id = ?').bind(booking.car_id).run();
    }
    await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run();
    return c.json({ message: 'Booking deleted' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Revenue breakdown by date (for charts)
app.get('/api/admin/revenue-chart', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT DATE(created_at) as day, SUM(total_price) as revenue, COUNT(*) as count
      FROM bookings
      WHERE status IN ('confirmed', 'completed')
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 30
    `).all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default app;
