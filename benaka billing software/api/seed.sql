-- ============================================================
-- Seed Data — 22 cars for Benaka fleet
-- Daily rates in paise (₹2000 = 200000 paise, etc.)
-- ============================================================

INSERT OR IGNORE INTO fleet (registration_number, car_model, daily_rate_paise, status) VALUES
('KA-01-AB-1234', 'Maruti Suzuki Swift',       200000, 'Available'),
('KA-01-AB-1235', 'Maruti Suzuki Swift',       200000, 'Available'),
('KA-01-CD-2001', 'Hyundai i20',               250000, 'Available'),
('KA-01-CD-2002', 'Hyundai i20',               250000, 'On-Trip'),
('KA-01-EF-3001', 'Honda City',                350000, 'Available'),
('KA-01-EF-3002', 'Honda City',                350000, 'Available'),
('KA-01-GH-4001', 'Toyota Innova Crysta',      500000, 'Available'),
('KA-01-GH-4002', 'Toyota Innova Crysta',      500000, 'On-Trip'),
('KA-01-IJ-5001', 'Kia Seltos',               300000, 'Available'),
('KA-01-IJ-5002', 'Kia Seltos',               300000, 'Available'),
('KA-01-KL-6001', 'Mahindra Thar',            400000, 'Maintenance'),
('KA-01-KL-6002', 'Mahindra Thar',            400000, 'Available'),
('KA-01-MN-7001', 'Maruti Suzuki Ertiga',     280000, 'Available'),
('KA-01-MN-7002', 'Maruti Suzuki Ertiga',     280000, 'Available'),
('KA-01-OP-8001', 'Hyundai Creta',            320000, 'Available'),
('KA-01-OP-8002', 'Hyundai Creta',            320000, 'On-Trip'),
('KA-01-QR-9001', 'Toyota Fortuner',          600000, 'Available'),
('KA-01-QR-9002', 'Toyota Fortuner',          600000, 'Available'),
('KA-01-ST-1001', 'Tata Nexon EV',            350000, 'Available'),
('KA-01-ST-1002', 'Tata Nexon EV',            350000, 'Maintenance'),
('KA-01-UV-1101', 'Maruti Suzuki Dzire',      180000, 'Available'),
('KA-01-UV-1102', 'Maruti Suzuki Dzire',      180000, 'Available');

-- Sample Admin user (password: admin123 — bcrypt hash placeholder)
INSERT OR IGNORE INTO users (email, password_hash, role) VALUES
('admin@benaka.in', '$2a$10$placeholder_hash_replace_me', 'Admin');

-- Sample Clients
INSERT OR IGNORE INTO clients (full_name, phone_number, email, driving_license_number, gstin) VALUES
('Rajesh Kumar',    '+919876543210', 'rajesh@email.com',  'KA-0120230001234', NULL),
('Priya Sharma',    '+919876543211', 'priya@email.com',   'KA-0120230005678', NULL),
('Mohammed Irfan',  '+919876543212', 'irfan@email.com',   'KA-0120230009012', '29AABCU9603R1ZM'),
('Sneha Reddy',     '+919876543213', 'sneha@email.com',   'KA-0120230003456', NULL),
('Vikram Patel',    '+919876543214', 'vikram@email.com',  'KA-0120230007890', '29AADCB2230M1ZX');
