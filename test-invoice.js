const payload = {
  customer_name: "Test Name",
  customer_phone: "0000000000",
  car_id: 1,
  bill_type: "NON_GST",
  company_name: "",
  party_gstin: "",
  vehicle_no_override: "KA-25",
  place_from: "Gadag",
  place_to: "Hubli",
  start_date: "2026-04-10",
  end_date: "2026-04-11",
  working_days: 2,
  start_km: 1000,
  end_km: 1200,
  km_limit_per_day: 300,
  qty_avg_per_month: 1,
  avg_monthly_rate_paise: 0,
  amount_for_days_paise: 500000,
  extra_km_rate_paise: 1100,
  extra_km_qty: 0,
  driver_extra_duty_hours: 0,
  driver_extra_duty_rate_paise: 0,
  driver_batta_paise: 50000,
  toll_gate_paise: 0,
  fastag_paise: 20000,
  advance_paid_paise: 100000,
  cgst_rate: 0,
  sgst_rate: 0,
  trip_description: "",
  line_items: []
};

fetch('https://benaka-rentals-app.benakatravelsbusiness.workers.dev/api/admin/billing/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer benakaAdmin2026' },
  body: JSON.stringify(payload)
})
.then(async r => {
  console.log('Status:', r.status);
  console.log('Body:', await r.text());
})
.catch(e => console.error(e));
