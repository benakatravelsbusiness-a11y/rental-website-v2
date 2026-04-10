-- Add detailed billing fields to invoices table
ALTER TABLE invoices ADD COLUMN total_km INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN extra_km_qty INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN extra_km_total_paise INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN driver_extra_duty_hours REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN driver_extra_duty_rate_paise INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN driver_extra_duty_total_paise INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN amount_for_days_paise INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN qty_avg_per_month INTEGER DEFAULT 1;
ALTER TABLE invoices ADD COLUMN vehicle_no_override TEXT;
ALTER TABLE invoices ADD COLUMN trip_description TEXT;
ALTER TABLE invoices ADD COLUMN km_limit_per_day INTEGER DEFAULT 300;
