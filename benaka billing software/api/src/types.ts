export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

// ---------- Entity Types ----------

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'Admin' | 'Employee';
  created_at: string;
}

export interface Client {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  driving_license_number: string | null;
  gstin: string | null;
  created_at: string;
}

export interface FleetVehicle {
  id: number;
  registration_number: string;
  car_model: string;
  daily_rate_paise: number;
  status: 'Available' | 'On-Trip' | 'Maintenance';
  created_at: string;
}

export interface Invoice {
  id: string; // INV-YYYY-XXXX
  client_id: number;
  fleet_id: number;
  start_date: string;
  end_date: string;
  start_km: number | null;
  end_km: number | null;
  subtotal_paise: number;
  tax_paise: number;
  total_amount_paise: number;
  advance_paid_paise: number;
  status: 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid';
  created_at: string;
}

export interface InvoiceLineItem {
  id: number;
  invoice_id: string;
  description: string;
  amount_paise: number;
}

// ---------- Request/Response DTOs ----------

export interface CreateClientRequest {
  full_name: string;
  phone_number: string;
  email?: string;
  driving_license_number?: string;
  gstin?: string;
}

export interface UpdateFleetStatusRequest {
  status: 'Available' | 'On-Trip' | 'Maintenance';
}

export interface CreateInvoiceLineItem {
  description: string;
  amount_paise: number;
}

export interface CreateInvoiceRequest {
  client_id: number;
  fleet_id: number;
  start_date: string;
  end_date: string;
  start_km?: number;
  end_km?: number;
  advance_paid_paise?: number;
  status?: 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid';
  line_items: CreateInvoiceLineItem[];
}

export interface DashboardStats {
  revenue_this_month_paise: number;
  outstanding_paise: number;
  active_trips: number;
  total_clients: number;
  total_fleet: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
