CREATE TABLE invoices_new (
    id                  TEXT    PRIMARY KEY,
    car_id              INTEGER NOT NULL,
    bill_type           TEXT    NOT NULL DEFAULT 'NON_GST',
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
    status              TEXT    NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Unpaid', 'Partially Paid', 'Paid')),
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT
);

INSERT INTO invoices_new SELECT * FROM invoices;

DROP TABLE invoice_line_items;
DROP TABLE invoices;

ALTER TABLE invoices_new RENAME TO invoices;

CREATE TABLE invoice_line_items (
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
