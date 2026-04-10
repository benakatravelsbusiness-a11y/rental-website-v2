DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS cars;

CREATE TABLE cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  features TEXT NOT NULL,
  seats INTEGER DEFAULT 5,
  fuel_type TEXT DEFAULT 'Petrol',
  available INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE,
  car_id INTEGER NOT NULL,
  car_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  pickup_date TEXT NOT NULL,
  return_date TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  daily_rate INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (car_id) REFERENCES cars(id)
);

-- 22 Professional Vehicles
INSERT INTO cars (name, category, price, image_url, features, seats, fuel_type, available) VALUES
('Lamborghini Urus', 'SUV', 450, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop', 'V8 Biturbo, 641hp, All-Wheel Drive', 5, 'Petrol', 1),
('Ferrari F8 Tributo', 'Sports', 600, 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?q=80&w=800&auto=format&fit=crop', 'V8 Twin-Turbo, 710hp, Carbon Fiber', 2, 'Petrol', 1),
('Rolls-Royce Ghost', 'Luxury', 800, 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?q=80&w=800&auto=format&fit=crop', 'V12 Engine, Starlight Headliner, Bespoke Interior', 5, 'Petrol', 1),
('Porsche 911 GT3', 'Sports', 350, 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=800&auto=format&fit=crop', 'Flat-6, 503hp, Rear Wheel Drive', 2, 'Petrol', 1),
('Bentley Bentayga', 'SUV', 500, 'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?q=80&w=800&auto=format&fit=crop', 'W12 Engine, 550hp, Luxury Quilted Interior', 5, 'Petrol', 1),
('Mercedes-AMG G63', 'SUV', 420, 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop', 'V8 Biturbo, 577hp, AMG Performance', 5, 'Petrol', 1),
('Tesla Model S Plaid', 'Electric', 280, 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=800&auto=format&fit=crop', 'Tri-Motor, 1020hp, 396mi Range, Autopilot', 5, 'Electric', 1),
('Aston Martin DB11', 'Sports', 480, 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=800&auto=format&fit=crop', 'V12 AMG Engine, 600hp, British Craftsmanship', 4, 'Petrol', 1),
('McLaren 720S', 'Sports', 550, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop', 'Twin Turbo V8, 720hp, Carbon MonoCell', 2, 'Petrol', 1),
('BMW M8 Competition', 'Sports', 290, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800&auto=format&fit=crop', 'V8 Twin-Turbo, 617hp, M xDrive', 4, 'Petrol', 1),
('Range Rover SVAutobiography', 'SUV', 380, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=800&auto=format&fit=crop', 'V8 Supercharged, 518hp, Executive Rear Seats', 5, 'Petrol', 1),
('Porsche Taycan Turbo S', 'Electric', 320, 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=800&auto=format&fit=crop', 'Dual Motor, 750hp, 0-100 in 2.8s', 5, 'Electric', 1),
('Mercedes-Maybach S680', 'Luxury', 720, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop', 'V12 Biturbo, 621hp, Executive Lounge Rear', 5, 'Petrol', 1),
('Audi RS e-tron GT', 'Electric', 260, 'https://images.unsplash.com/photo-1606016159991-d85c4bf41849?q=80&w=800&auto=format&fit=crop', 'Dual Motor, 637hp, Quattro AWD', 5, 'Electric', 1),
('Lamborghini Huracan', 'Sports', 520, 'https://images.unsplash.com/photo-1544544904-9e893fb3e1e2?q=80&w=800&auto=format&fit=crop', 'V10 NA, 610hp, Magnetic Ride Control', 2, 'Petrol', 1),
('Maserati Levante Trofeo', 'SUV', 310, 'https://images.unsplash.com/photo-1548699939-9b04f14e4b49?q=80&w=800&auto=format&fit=crop', 'Ferrari V8, 580hp, Q4 AWD', 5, 'Petrol', 1),
('Cadillac Escalade ESV', 'SUV', 200, 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=800&auto=format&fit=crop', 'V8 6.2L, 420hp, Super Cruise', 8, 'Petrol', 1),
('BMW 7 Series M760i', 'Luxury', 250, 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?q=80&w=800&auto=format&fit=crop', 'V12 Twin-Turbo, 577hp, Sky Lounge Roof', 5, 'Petrol', 1),
('Mercedes-AMG GT Black Series', 'Sports', 650, 'https://images.unsplash.com/photo-1560009320-bd2a7ca01b42?q=80&w=800&auto=format&fit=crop', 'V8 Flat Plane, 730hp, Aerodynamic Package', 2, 'Petrol', 1),
('Porsche Cayenne Turbo GT', 'SUV', 330, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop', 'V8 Twin Turbo, 631hp, Sport Chrono', 5, 'Petrol', 1),
('Tesla Model X Plaid', 'Electric', 240, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800&auto=format&fit=crop', 'Tri-Motor, 1020hp, Falcon Wing Doors, 7 Seats', 7, 'Electric', 1),
('Rolls-Royce Cullinan Black Badge', 'SUV', 900, 'https://images.unsplash.com/photo-1631295868223-63265b40d9e4?q=80&w=800&auto=format&fit=crop', 'V12 Twin-Turbo, 600hp, Black Badge Exclusive', 5, 'Petrol', 1);

-- ============================================================
-- BENAKA BILLING SOFTWARE SCHEMA (Appended)
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id                  TEXT    PRIMARY KEY,   -- Format: INV-YYYY-XXXX
    car_id              INTEGER NOT NULL,
    bill_type           TEXT    NOT NULL DEFAULT 'NON_GST' CHECK (bill_type IN ('GST', 'NON_GST')),
    customer_name       TEXT    NOT NULL DEFAULT '',
    customer_phone      TEXT    NOT NULL DEFAULT '',
    customer_email      TEXT    DEFAULT '',
    customer_gstin      TEXT    DEFAULT '',
    company_name        TEXT,                  -- Customer Company name (M/s)
    party_gstin         TEXT,
    place_from          TEXT,
    place_to            TEXT,
    working_days        INTEGER,
    start_date          TEXT    NOT NULL,
    end_date            TEXT    NOT NULL,
    start_km            INTEGER,
    end_km              INTEGER,
    subtotal_paise      INTEGER NOT NULL DEFAULT 0,
    extra_km_rate_paise INTEGER NOT NULL DEFAULT 0,
    avg_monthly_rate_paise INTEGER NOT NULL DEFAULT 0,
    driver_extra_duty_paise INTEGER NOT NULL DEFAULT 0,
    driver_batta_paise   INTEGER NOT NULL DEFAULT 0,
    toll_gate_paise      INTEGER NOT NULL DEFAULT 0,
    fastag_paise         INTEGER NOT NULL DEFAULT 0,
    cgst_rate           REAL    NOT NULL DEFAULT 9.0,
    sgst_rate           REAL    NOT NULL DEFAULT 9.0,
    cgst_paise          INTEGER NOT NULL DEFAULT 0,
    sgst_paise          INTEGER NOT NULL DEFAULT 0,
    total_amount_paise  INTEGER NOT NULL DEFAULT 0,
    advance_paid_paise  INTEGER NOT NULL DEFAULT 0,
    total_km            INTEGER NOT NULL DEFAULT 0,
    extra_km_qty        INTEGER NOT NULL DEFAULT 0,
    extra_km_total_paise INTEGER NOT NULL DEFAULT 0,
    driver_extra_duty_hours REAL NOT NULL DEFAULT 0,
    driver_extra_duty_rate_paise INTEGER NOT NULL DEFAULT 0,
    driver_extra_duty_total_paise INTEGER NOT NULL DEFAULT 0,
    amount_for_days_paise INTEGER NOT NULL DEFAULT 0,
    qty_avg_per_month   INTEGER NOT NULL DEFAULT 1,
    km_limit_per_day    INTEGER NOT NULL DEFAULT 300,
    vehicle_no_override TEXT,
    trip_description    TEXT,
    status              TEXT    NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Unpaid', 'Partially Paid', 'Paid')),
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (car_id)    REFERENCES cars(id)    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id  TEXT    NOT NULL,
    description TEXT    NOT NULL,
    amount_paise INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_car      ON invoices(car_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status   ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created  ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_line_items_inv    ON invoice_line_items(invoice_id);
