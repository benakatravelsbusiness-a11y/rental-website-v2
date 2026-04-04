import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();

const ADMIN_PASSWORD = 'benakaAdmin2026';

app.use('*', secureHeaders());
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET','POST','DELETE','PATCH','OPTIONS'] }));

// Admin Auth Middleware
app.use('/api/admin/*', async (c, next) => {
  const auth = c.req.header('Authorization');
  if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

// Get all available cars (with optional filters)
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

// Create booking (public)
app.post('/api/bookings', async (c) => {
  try {
    const { car_id, customer_name, customer_phone, customer_email, pickup_date, return_date } = await c.req.json();
    // Get car price
    const car = await c.env.DB.prepare('SELECT * FROM cars WHERE id = ? AND available = true').bind(car_id).first() as any;
    if (!car) return c.json({ error: 'Car not available' }, 400);
    
    // Calculate total price
    const d1 = new Date(pickup_date), d2 = new Date(return_date);
    const days = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    const total_price = car.price * days;

    await c.env.DB.prepare(`
      INSERT INTO bookings (car_id, car_name, customer_name, customer_phone, customer_email, pickup_date, return_date, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(car_id, car.name, customer_name, customer_phone, customer_email, pickup_date, return_date, total_price).run();

    // Mark car unavailable
    await c.env.DB.prepare('UPDATE cars SET available = false WHERE id = ?').bind(car_id).run();

    return c.json({ 
      message: 'Booking confirmed!', 
      car: car.name, 
      days, 
      total_price,
      pickup_date,
      return_date
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

// Admin: Dashboard stats
app.get('/api/admin/stats', async (c) => {
  try {
    const totalCars = await c.env.DB.prepare('SELECT COUNT(*) as count FROM cars').first() as any;
    const availableCars = await c.env.DB.prepare('SELECT COUNT(*) as count FROM cars WHERE available = true').first() as any;
    const totalBookings = await c.env.DB.prepare('SELECT COUNT(*) as count FROM bookings').first() as any;
    const pending = await c.env.DB.prepare("SELECT COUNT(*) as count FROM bookings WHERE status='pending'").first() as any;
    const revenue = await c.env.DB.prepare("SELECT SUM(total_price) as total FROM bookings WHERE status='confirmed'").first() as any;
    
    return c.json({
      totalCars: totalCars?.count ?? 0,
      availableCars: availableCars?.count ?? 0,
      totalBookings: totalBookings?.count ?? 0,
      pendingBookings: pending?.count ?? 0,
      totalRevenue: revenue?.total ?? 0
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Admin: Get all cars
app.get('/api/admin/cars', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cars ORDER BY id DESC').all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Admin: Add car
app.post('/api/admin/cars', async (c) => {
  try {
    const { name, category, price, image_url, features, seats, fuel_type } = await c.req.json();
    await c.env.DB.prepare(`
      INSERT INTO cars (name, category, price, image_url, features, seats, fuel_type, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, true)
    `).bind(name, category, parseInt(price), image_url, features, parseInt(seats) || 5, fuel_type || 'Petrol').run();
    return c.json({ message: 'Car added successfully!' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Admin: Toggle car availability
app.patch('/api/admin/cars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { available } = await c.req.json();
    await c.env.DB.prepare('UPDATE cars SET available = ? WHERE id = ?').bind(available, id).run();
    return c.json({ message: 'Updated successfully' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Admin: Delete car
app.delete('/api/admin/cars/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM cars WHERE id = ?').bind(id).run();
    return c.json({ message: 'Deleted successfully' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Admin: Get all bookings
app.get('/api/admin/bookings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Admin: Update booking status
app.patch('/api/admin/bookings/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first() as any;
    if (!booking) return c.json({ error: 'Booking not found' }, 404);

    await c.env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ?').bind(status, id).run();

    // If cancelled, release car
    if (status === 'cancelled') {
      await c.env.DB.prepare('UPDATE cars SET available = true WHERE id = ?').bind(booking.car_id).run();
    }
    // If confirmed, make sure car stays unavailable  
    if (status === 'confirmed') {
      await c.env.DB.prepare('UPDATE cars SET available = false WHERE id = ?').bind(booking.car_id).run();
    }
    return c.json({ message: `Booking ${status}` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default app;
