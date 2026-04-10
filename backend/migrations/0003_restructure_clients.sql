-- 1. Create a new invoices table with the desired schema
CREATE TABLE invoices_new (
    id                  TEXT    PRIMARY KEY,
    car_id              INTEGER NOT NULL,
    bill_type           TEXT    NOT NULL DEFAULT 'NON_GST' CHECK (bill_type IN ('GST', 'NON_GST')),
    customer_name       TEXT    NOT NULL DEFAULT '',
    customer_phone      TEXT    NOT NULL DEFAULT '',
    customer_email      TEXT    DEFAULT '',
    customer_gstin      TEXT    DEFAULT '',
    company_name        TEXT,
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
    status              TEXT    NOT NULL DEFAULT 'Draft',
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT
);

-- 2. Copy data over (client details will be left empty initially for old records)
INSERT INTO invoices_new (id, car_id, bill_type, company_name, party_gstin, place_from, place_to, working_days, start_date, end_date, start_km, end_km, subtotal_paise, extra_km_rate_paise, avg_monthly_rate_paise, driver_extra_duty_paise, driver_batta_paise, toll_gate_paise, fastag_paise, cgst_rate, sgst_rate, cgst_paise, sgst_paise, total_amount_paise, advance_paid_paise, total_km, extra_km_qty, extra_km_total_paise, driver_extra_duty_hours, driver_extra_duty_rate_paise, driver_extra_duty_total_paise, amount_for_days_paise, qty_avg_per_month, km_limit_per_day, vehicle_no_override, trip_description, status, created_at)
SELECT id, car_id, bill_type, company_name, party_gstin, place_from, place_to, working_days, start_date, end_date, start_km, end_km, subtotal_paise, extra_km_rate_paise, avg_monthly_rate_paise, driver_extra_duty_paise, driver_batta_paise, toll_gate_paise, fastag_paise, cgst_rate, sgst_rate, cgst_paise, sgst_paise, total_amount_paise, advance_paid_paise, total_km, extra_km_qty, extra_km_total_paise, driver_extra_duty_hours, driver_extra_duty_rate_paise, driver_extra_duty_total_paise, amount_for_days_paise, qty_avg_per_month, km_limit_per_day, vehicle_no_override, trip_description, status, created_at FROM invoices;

-- 3. Drop old table and rename
DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;

-- 4. Recreate indices
CREATE INDEX IF NOT EXISTS idx_invoices_car      ON invoices(car_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status   ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created  ON invoices(created_at);

-- 5. Drop clients table safely now that references are gone
DROP TABLE IF EXISTS clients;
-- For Cloudflare D1, if DROP COLUMN fails, we will safely ignore `client_id` and just inject a dummy value.
-- We will try to drop it.
-- ALTER TABLE invoices DROP COLUMN client_id;
