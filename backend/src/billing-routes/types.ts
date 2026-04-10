export interface Env {
  DB: D1Database;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}



export interface Invoice {
  id: string; // INV-YYYY-XXXX
  car_id: number;
  bill_type: 'GST' | 'NON_GST';
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_gstin: string | null;
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
  total_km: number | null;
  extra_km_qty: number;
  extra_km_total_paise: number;
  driver_extra_duty_hours: number;
  driver_extra_duty_rate_paise: number;
  driver_extra_duty_total_paise: number;
  amount_for_days_paise: number;
  qty_avg_per_month: number;
  km_limit_per_day: number;
  vehicle_no_override: string | null;
  trip_description: string | null;
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

export interface CreateInvoiceLineItem {
  description: string;
  amount_paise: number;
}

export interface CreateInvoiceRequest {
  car_id: number;
  bill_type: 'GST' | 'NON_GST';
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_gstin?: string;
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
  total_km?: number;
  extra_km_qty?: number;
  extra_km_total_paise?: number;
  driver_extra_duty_hours?: number;
  driver_extra_duty_rate_paise?: number;
  driver_extra_duty_total_paise?: number;
  amount_for_days_paise?: number;
  qty_avg_per_month?: number;
  km_limit_per_day?: number;
  vehicle_no_override?: string;
  trip_description?: string;
  status?: 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid';
  line_items: CreateInvoiceLineItem[];
}

export interface DashboardStats {
  revenue_this_month_paise: number;
  outstanding_paise: number;
  active_trips: number;
  total_fleet: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
