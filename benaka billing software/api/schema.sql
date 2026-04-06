-- ============================================================
-- Benaka Billing Software — D1 Schema
-- All currency values stored as INTEGER (paise) to prevent
-- floating-point math errors.
-- ============================================================

-- 1. Users (Auth)
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE,
    password_hash TEXT  NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'Employee' CHECK (role IN ('Admin', 'Employee')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 2. Clients (CRM)
CREATE TABLE IF NOT EXISTS clients (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name               TEXT    NOT NULL,
    phone_number            TEXT    NOT NULL UNIQUE,
    email                   TEXT,
    driving_license_number  TEXT,
    gstin                   TEXT,
    created_at              TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 3. Fleet (Inventory)
CREATE TABLE IF NOT EXISTS fleet (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT    NOT NULL UNIQUE,
    car_model           TEXT    NOT NULL,
    daily_rate_paise    INTEGER NOT NULL DEFAULT 0,
    status              TEXT    NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On-Trip', 'Maintenance')),
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 4. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id                  TEXT    PRIMARY KEY,   -- Format: INV-YYYY-XXXX
    client_id           INTEGER NOT NULL,
    fleet_id            INTEGER NOT NULL,
    start_date          TEXT    NOT NULL,
    end_date            TEXT    NOT NULL,
    start_km            INTEGER,
    end_km              INTEGER,
    subtotal_paise      INTEGER NOT NULL DEFAULT 0,
    tax_paise           INTEGER NOT NULL DEFAULT 0,
    total_amount_paise  INTEGER NOT NULL DEFAULT 0,
    advance_paid_paise  INTEGER NOT NULL DEFAULT 0,
    status              TEXT    NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Unpaid', 'Partially Paid', 'Paid')),
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (fleet_id)  REFERENCES fleet(id)   ON DELETE RESTRICT
);

-- 5. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id  TEXT    NOT NULL,
    description TEXT    NOT NULL,
    amount_paise INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_client   ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fleet    ON invoices(fleet_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status   ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created  ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_line_items_inv    ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone     ON clients(phone_number);
CREATE INDEX IF NOT EXISTS idx_fleet_status      ON fleet(status);
