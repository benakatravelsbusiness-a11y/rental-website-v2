const API_BASE = import.meta.env.VITE_API_BASE || '/api/billing';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error || `Request failed with status ${response.status}`);
  }

  return json.data as T;
}

export const api = {
  // Dashboard
  getDashboard: () =>
    request<{
      revenue_this_month_paise: number;
      outstanding_paise: number;
      active_trips: number;
      total_clients: number;
      total_fleet: number;
    }>('/dashboard'),

  getRecentInvoices: () =>
    request<Array<{
      id: string;
      total_amount_paise: number;
      advance_paid_paise: number;
      status: string;
      start_date: string;
      end_date: string;
      created_at: string;
      client_name: string;
      client_phone: string;
      registration_number: string;
      car_model: string;
    }>>('/dashboard/recent-invoices'),

  // Fleet
  getFleet: (status?: string) =>
    request<Array<{
      id: number;
      registration_number: string;
      car_model: string;
      daily_rate_paise: number;
      status: string;
      created_at: string;
    }>>(`/fleet${status ? `?status=${status}` : ''}`),

  updateFleetStatus: (id: number, status: string) =>
    request(`/fleet/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  addVehicle: (data: { registration_number: string; car_model: string; daily_rate_paise: number }) =>
    request('/fleet', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Clients
  getClients: (search?: string, page = 1) =>
    request<{
      clients: Array<{
        id: number;
        full_name: string;
        phone_number: string;
        email: string | null;
        driving_license_number: string | null;
        gstin: string | null;
        created_at: string;
      }>;
      total: number;
      page: number;
      limit: number;
    }>(`/clients?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  getClient: (id: number) =>
    request<{
      id: number;
      full_name: string;
      phone_number: string;
      email: string | null;
      driving_license_number: string | null;
      gstin: string | null;
      invoices: Array<{
        id: string;
        total_amount_paise: number;
        status: string;
        start_date: string;
        end_date: string;
        car_model: string;
        registration_number: string;
      }>;
    }>(`/clients/${id}`),

  createClient: (data: {
    full_name: string;
    phone_number: string;
    email?: string;
    driving_license_number?: string;
    gstin?: string;
  }) =>
    request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateClient: (id: number, data: {
    full_name?: string;
    phone_number?: string;
    email?: string;
    driving_license_number?: string;
    gstin?: string;
  }) =>
    request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Invoices
  getInvoices: (params?: { status?: string; client_id?: number; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.client_id) query.set('client_id', params.client_id.toString());
    if (params?.page) query.set('page', params.page.toString());
    const qs = query.toString();
    return request<{
      invoices: Array<{
        id: string;
        client_id: number;
        car_id: number;
        total_amount_paise: number;
        advance_paid_paise: number;
        status: string;
        start_date: string;
        end_date: string;
        created_at: string;
        client_name: string;
        client_phone: string;
        car_model: string;
        registration_number: string;
        subtotal_paise: number;
        tax_paise: number;
      }>;
      total: number;
      page: number;
      limit: number;
    }>(`/invoices${qs ? `?${qs}` : ''}`);
  },

  getInvoice: (id: string) =>
    request<{
      id: string;
      client_id: number;
      car_id: number;
      start_date: string;
      end_date: string;
      start_km: number | null;
      end_km: number | null;
      subtotal_paise: number;
      tax_paise: number;
      total_amount_paise: number;
      advance_paid_paise: number;
      status: string;
      created_at: string;
      client_name: string;
      client_phone: string;
      client_email: string | null;
      client_dl: string | null;
      client_gstin: string | null;
      car_model: string;
      registration_number: string;
      daily_rate_paise: number;
      line_items: Array<{
        id: number;
        invoice_id: string;
        description: string;
        amount_paise: number;
      }>;
    }>(`/invoices/${id}`),

  createInvoice: (data: {
    client_id: number;
    car_id: number;
    start_date: string;
    end_date: string;
    start_km?: number;
    end_km?: number;
    advance_paid_paise?: number;
    line_items: Array<{ description: string; amount_paise: number }>;
  }) =>
    request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateInvoiceStatus: (id: string, status: string, advance_paid_paise?: number) =>
    request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, advance_paid_paise }),
    }),

  endTrip: (id: string, data: { end_km: number; extra_charge_paise?: number; description?: string }) =>
    request(`/invoices/${id}/end-trip`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
