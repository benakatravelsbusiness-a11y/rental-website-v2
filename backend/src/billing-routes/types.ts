export interface Env {
  DB: D1Database;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
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

export interface Invoice {
  id: string; // INV-YYYY-XXXX
  client_id: number;
  car_id: number;
  bill_type: 'GST' | 'NON_GST';
  company_name: string | null;
  party_gstin: string | null;
  place_from: string | null;
  place_to: string | null;
  working_days: number | null;
  start_date: string;
  end_date: string;
  start_km: number | null;
  end_km: number | null;
  subtotal_paise: number;
  extra_km_rate_paise: number;
  avg_monthly_rate_paise: number;
  driver_extra_duty_paise: number;
  driver_batta_paise: number;
  toll_gate_paise: number;
  fastag_paise: number;
  cgst_rate: number;
  sgst_rate: number;
  cgst_paise: number;
  sgst_paise: number;
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

// Request/Response DTOs
export interface CreateClientRequest {
  full_name: string;
  phone_number: string;
  email?: string;
  driving_license_number?: string;
  gstin?: string;
}

export interface CreateInvoiceLineItem {
  description: string;
  amount_paise: number;
}

export interface CreateInvoiceRequest {
  client_id: number;
  car_id: number;
  bill_type: 'GST' | 'NON_GST';
  company_name?: string;
  party_gstin?: string;
  place_from?: string;
  place_to?: string;
  working_days?: number;
  start_date: string;
  end_date: string;
  start_km?: number;
  end_km?: number;
  extra_km_rate_paise?: number;
  avg_monthly_rate_paise?: number;
  driver_extra_duty_paise?: number;
  driver_batta_paise?: number;
  toll_gate_paise?: number;
  fastag_paise?: number;
  cgst_rate?: number;
  sgst_rate?: number;
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
