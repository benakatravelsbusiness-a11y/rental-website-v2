import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', secureHeaders());
app.use('/api/*', cors());

app.get('/', (c) => {
  return c.json({ message: 'Benaka Travels API is running!' });
});

// Get all cars
app.get('/api/cars', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cars').all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: 'Failed to fetch cars' }, 500);
  }
});

// Seed data
app.post('/api/seed', async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        image_url TEXT,
        features TEXT,
        available BOOLEAN DEFAULT true
      )
    `).run();

    await c.env.DB.prepare(`
        INSERT INTO cars (name, category, price, image_url, features, available) 
        VALUES ('Tesla Model 3', 'Electric', 80, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800&auto=format&fit=crop', 'Autopilot, Long Range', true)
    `).run();

    await c.env.DB.prepare(`
        INSERT INTO cars (name, category, price, image_url, features, available) 
        VALUES ('BMW M4', 'Sports', 120, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop', 'V6 Engine, Leather Seats', true)
    `).run();

    return c.json({ message: 'Database seeded perfectly!' });
  } catch (e) {
    return c.json({ error: 'Seeding failed' }, 500);
  }
});

export default app;
