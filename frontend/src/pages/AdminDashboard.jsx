import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Car, Users, BarChart2,
  Settings, HelpCircle, Bell, RefreshCw,
  Plus, Trash2, CheckCircle, XCircle, Menu, X,
  Home, MessageCircle, Printer, Search, Phone, Receipt,
  FileText, CreditCard, Calendar, User, MapPin, Gauge
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import '../admin.css';

Chart.register(...registerables);

const TOKEN = 'Bearer benakaAdmin2026';

/* ══════════════ GLOBAL MODALS ══════════════ */
let _setEndTripData = null;
let _setShowEndTripModal = null;
let _setManualBookingRef = null;

let _setToasts = null;
function toast(msg, type = 'success') {
  const id = Date.now();
  _setToasts(p => [...p, { id, msg, type }]);
  setTimeout(() => _setToasts(p => p.filter(t => t.id !== id)), 3500);
}
function ToastHub() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { _setToasts = setToasts; }, []);
  return (
    <div className="adm-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`adm-toast adm-toast-${t.type}`}>
          {t.type === 'success' ? '✅' : '❌'} {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ══════════════ HELPERS ══════════════ */
const pillClass = { pending: 'pill-yellow', confirmed: 'pill-blue', completed: 'pill-green', cancelled: 'pill-red' };
const StatusPill = ({ status }) => <span className={`pill ${pillClass[status] || 'pill-gray'}`}>{status}</span>;
const whatsappLink = (phone, msg) => `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
const Loader = () => <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}>⏳ Loading...</div>;
const Empty = ({ icon, text }) => <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}><div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{icon}</div>{text}</div>;

/* CSV Export helper */
function exportCSV(rows, filename) {
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* Print high-fidelity invoice */
function printProfessionalInvoice(invoiceData) {
  const i = invoiceData;
  const isGST = i.bill_type === 'GST';
  
  // Format currency
  const fmt = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${i.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter', sans-serif;padding:40px;color:#111;line-height:1.5;background:#fff}
    .invoice-container{max-width:800px;margin:0 auto;border:1px solid #eee;padding:40px;box-shadow:0 0 20px rgba(0,0,0,0.05)}
    .header{display:flex;justify-content:space-between;border-bottom:2px solid #10b981;padding-bottom:20px;margin-bottom:30px}
    .brand h1{font-size:24px;font-weight:900;color:#10b981;letter-spacing:-0.5px}
    .brand p{font-size:12px;color:#666}
    .bill-title{text-align:right}
    .bill-title h2{font-size:20px;text-transform:uppercase;color:#334155;letter-spacing:1px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:40px}
    .info-sec h4{font-size:11px;text-transform:uppercase;color:#10b981;margin-bottom:8px;letter-spacing:1px}
    .info-sec p{font-size:14px;font-weight:500;margin:2px 0}
    .invoice-meta{text-align:right}
    .invoice-meta p{font-size:13px;color:#475569}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    th{background:#f8fafc;padding:12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}
    td{padding:12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b}
    .totals-sec{display:flex;justify-content:flex-end;margin-top:20px}
    .totals-table{width:300px}
    .totals-table tr td:first-child{text-align:right;color:#64748b;font-size:13px}
    .totals-table tr td:last-child{text-align:right;font-weight:700;font-size:15px}
    .grand-total{background:#f0fdf4;color:#166534}
    .grand-total td{font-size:18px !important;padding:15px !important;border-bottom:none !important}
    .bank-details{margin-top:40px;padding-top:20px;border-top:1px solid #eee}
    .bank-details h4{font-size:12px;margin-bottom:5px;color:#334155}
    .bank-details p{font-size:12px;color:#64748b}
    .footer{text-align:center;margin-top:50px;font-size:11px;color:#94a3b8;border-top:1px dashed #e2e8f0;padding-top:20px}
    @media print{.invoice-container{box-shadow:none;border:none;padding:0}}
  </style></head><body>
    <div class="invoice-container">
      <div class="header">
        <div class="brand">
          <h1>BENAKA TOURS and TRAVELS</h1>
          <p>Luxurious Travel Experiences · Panchaxari Nagar, Gadag</p>
          <p>Mob: +91 63624 16120 | benakatravelsbusiness@gmail.com</p>
          ${isGST ? '<p><strong>GSTIN: 29XXXXXXXXXXXXX</strong></p>' : ''}
        </div>
        <div class="bill-title">
          <h2>${isGST ? 'Tax Invoice' : 'Cash Bill'}</h2>
          <div class="invoice-meta">
            <p><strong>Invoice No:</strong> ${i.id}</p>
            <p><strong>Date:</strong> ${i.created_at?.split('T')[0]}</p>
          </div>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-sec">
          <h4>Bill To</h4>
          <p><strong>${i.company_name || i.client_name}</strong></p>
          ${i.party_gstin ? `<p>GSTIN: ${i.party_gstin}</p>` : ''}
          <p>${i.client_phone}</p>
        </div>
        <div class="info-sec" style="text-align:right">
          <h4>Trip Details</h4>
          <p><strong>Vehicle:</strong> ${i.car_model}</p>
          <p><strong>Route:</strong> ${i.place_from || 'Local'} to ${i.place_to || 'Local'}</p>
          <p><strong>Period:</strong> ${i.start_date} to ${i.end_date}</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th width="40">Sl</th>
            <th>Description</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>01</td>
            <td>
              <strong>Car Rental Charges</strong><br/>
              <span style="font-size:11px; color:#666">
                ${i.start_km ? `Reading: ${i.start_km} to ${i.end_km} Km` : ''} 
                ${i.working_days ? `(${i.working_days} Days)` : ''}
              </span>
            </td>
            <td style="text-align:right">${fmt(i.subtotal_paise)}</td>
          </tr>
          ${(i.driver_batta_paise > 0) ? `<tr><td>02</td><td>Driver Batta</td><td style="text-align:right">${fmt(i.driver_batta_paise)}</td></tr>` : ''}
          ${(i.toll_gate_paise > 0) ? `<tr><td>03</td><td>Toll Gate / Parking</td><td style="text-align:right">${fmt(i.toll_gate_paise)}</td></tr>` : ''}
          ${(i.fastag_paise > 0) ? `<tr><td>04</td><td>Fastag Charges</td><td style="text-align:right">${fmt(i.fastag_paise)}</td></tr>` : ''}
          ${(i.line_items || []).map((li, idx) => li.amount_paise > 0 ? `<tr><td>0${idx+5}</td><td>${li.description}</td><td style="text-align:right">${fmt(li.amount_paise)}</td></tr>` : '').join('')}
        </tbody>
      </table>
      
      <div class="totals-sec">
        <table class="totals-table">
          <tr><td>Sub Total:</td><td>${fmt(i.subtotal_paise + (i.driver_batta_paise||0) + (i.toll_gate_paise||0) + (i.fastag_paise||0))}</td></tr>
          ${isGST ? `
            <tr><td>CGST (${i.cgst_rate}%):</td><td>${fmt(i.cgst_paise)}</td></tr>
            <tr><td>SGST (${i.sgst_rate}%):</td><td>${fmt(i.sgst_paise)}</td></tr>
          ` : ''}
          <tr class="grand-total"><td>Total Amount:</td><td>${fmt(i.total_amount_paise)}</td></tr>
          ${i.advance_paid_paise > 0 ? `<tr><td>Advance Paid:</td><td>${fmt(i.advance_paid_paise)}</td></tr>` : ''}
          <tr><td><strong>Balance Due:</strong></td><td style="color:#ef4444">${fmt(i.total_amount_paise - (i.advance_paid_paise || 0))}</td></tr>
        </table>
      </div>
      
      <div class="bank-details">
        <h4>Bank Details & Terms</h4>
        <p><strong>Bank:</strong> Canara Bank | <strong>A/c:</strong> 1234567890 | <strong>IFSC:</strong> CNRB0001234</p>
        <p style="margin-top:10px; font-style:italic">Thank you for choosing Benaka Tours and Travels! Please pay within 7 days of invoice date.</p>
      </div>
      
      <div class="footer">
        <p>Digital Invoice Generated by Benaka Admin Engine · +91 63624 16120</p>
      </div>
    </div>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

/* ══════════════ REVENUE CHART ══════════════ */
function RevenueChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !data || data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = data.map(d => d.day).reverse();
    const values = data.map(d => d.revenue).reverse();

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: values,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,.1)',
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.42,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a28',
            borderColor: 'rgba(16,185,129,.3)',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#fff',
            callbacks: { label: ctx => `₹${ctx.parsed.y.toLocaleString('en-IN')}` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: 'rgba(255,255,255,.4)', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: 'rgba(255,255,255,.4)', font: { size: 11 }, callback: v => `₹${v}` }, beginAtZero: true }
        }
      }
    });
    return () => chartRef.current?.destroy();
  }, [data]);

  return <div style={{ height: '200px' }}><canvas ref={ref} /></div>;
}

/* ══════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════ */
function DashboardPage({ setPage }) {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [chartData, setChartData] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [sr, br, cr] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/revenue-chart', { headers: { Authorization: TOKEN } })
      ]);
      setStats(await sr.json());
      const bd = await br.json(); if (Array.isArray(bd)) setBookings(bd);
      const cd = await cr.json(); if (Array.isArray(cd)) setChartData(cd);
    } catch {}
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build notifications from real bookings
  const notifications = bookings.slice(0, 5).map(b => {
    const msgs = {
      pending: { text: `New booking from ${b.customer_name} for ${b.car_name}`, color: '#f59e0b' },
      confirmed: { text: `Booking #${b.ref} confirmed — ${b.car_name}`, color: '#22c55e' },
      completed: { text: `Trip completed: ${b.car_name} returned by ${b.customer_name}`, color: '#3b82f6' },
      cancelled: { text: `Booking #${b.ref} was cancelled`, color: '#ef4444' },
    };
    const m = msgs[b.status] || { text: `Booking update: ${b.ref}`, color: '#888' };
    return { id: b.id, ...m, time: b.created_at?.split('T')[0] || '' };
  });

  return (
    <>
      <div className="adm-stats-row">
        {[
          { label: 'Total Bookings', value: stats?.totalBookings ?? '—', sub: `${stats?.pendingBookings ?? 0} pending`, subClass: 'yellow', icon: '📋', iconClass: 'icon-blue' },
          { label: 'Available Fleet', value: `${stats?.availableCars ?? '—'} Cars`, sub: `${stats?.totalCars ?? '—'} total`, subClass: 'blue', icon: '🚗', iconClass: 'icon-green' },
          { label: 'Total Revenue', value: `₹${((stats?.totalRevenue || 0) / 100).toLocaleString('en-IN')}`, sub: `₹${((stats?.monthRevenue || 0) / 100).toLocaleString('en-IN')} this month`, subClass: 'green', icon: '💰', iconClass: 'icon-yellow' },
          { label: 'Active Rentals', value: stats?.rentedCars ?? '—', sub: `${stats?.completedBookings ?? 0} completed`, subClass: 'blue', icon: '🔑', iconClass: 'icon-red' },
        ].map((s, i) => (
          <div key={i} className="adm-stat-card">
            <div>
              <div className="adm-stat-label">{s.label}</div>
              <div className="adm-stat-value">{s.value}</div>
              <div className={`adm-stat-sub ${s.subClass}`}>{s.sub}</div>
            </div>
            <div className={`adm-stat-icon ${s.iconClass}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="adm-grid-3-1">
        <div>
          {/* Recent Bookings */}
          <div className="adm-panel" style={{ marginBottom: '1.25rem' }}>
            <div className="adm-panel-header">
              <span className="adm-panel-title">Recent Bookings</span>
              <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setPage('bookings')}>View All →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead><tr><th>Ref</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={6}><Empty icon="📋" text="No bookings yet" /></td></tr>
                  ) : bookings.slice(0, 6).map(b => (
                    <tr key={b.id}>
                      <td style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem', fontFamily: 'monospace' }}>{b.ref}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>{b.customer_email}</div>
                      </td>
                      <td>{b.car_name}</td>
                      <td style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>{b.pickup_date} → {b.return_date}</td>
                      <td style={{ fontWeight: 700, color: '#60a5fa' }}>${b.total_price}</td>
                      <td><StatusPill status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Revenue Overview</span>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>Last 30 days</span>
            </div>
            <div className="revenue-chart-wrap">
              {chartData.length > 0 ? <RevenueChart data={chartData} /> : <Empty icon="📊" text="Complete bookings to see revenue data" />}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="adm-panel">
            <div className="adm-panel-header"><span className="adm-panel-title">Fleet Status</span></div>
            <div className="adm-panel-body" style={{ paddingTop: '.5rem' }}>
              {[
                { label: 'Available', count: stats?.availableCars ?? 0, color: '#22c55e' },
                { label: 'Rented Out', count: stats?.rentedCars ?? 0, color: '#3b82f6' },
                { label: 'Pending Bookings', count: stats?.pendingBookings ?? 0, color: '#f59e0b' },
                { label: 'Total Fleet', count: stats?.totalCars ?? 0, color: '#8b5cf6' },
              ].map((r, i) => (
                <div key={i} className="fleet-status-row">
                  <div className="fleet-status-label"><div className="fleet-status-dot" style={{ background: r.color }} />{r.label}</div>
                  <div className="fleet-status-count" style={{ color: r.color }}>{r.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-panel">
            <div className="adm-panel-header"><span className="adm-panel-title">Quick Actions</span></div>
            <div className="adm-panel-body" style={{ paddingTop: '.5rem' }}>
              <div className="quick-actions-grid">
                <button className="quick-action-btn qa-primary" onClick={() => setPage('bookings')}><Plus size={14} /> Bookings</button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('vehicles')}>🚗 Fleet</button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('reports')}>📊 Reports</button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('customers')}>👥 Customers</button>
              </div>
            </div>
          </div>

          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Activity</span>
              {notifications.length > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '.1rem .4rem', borderRadius: '99px' }}>{notifications.length}</span>}
            </div>
            <div className="adm-panel-body" style={{ paddingTop: '.25rem' }}>
              {notifications.length === 0 ? <Empty icon="🔔" text="No activity" /> : notifications.map(n => (
                <div key={n.id} className="notif-item">
                  <div className="notif-dot-wrap"><div className="notif-dot" style={{ background: n.color }} /></div>
                  <div><div className="notif-text">{n.text}</div><div className="notif-time">{n.time}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   BOOKINGS PAGE
══════════════════════════════════════════════════ */
function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ car_id: '', customer_name: '', customer_phone: '', customer_email: '', pickup_date: '', return_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [br, cr] = await Promise.all([
        fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/cars', { headers: { Authorization: TOKEN } })
      ]);
      const bd = await br.json(); if (Array.isArray(bd)) setBookings(bd);
      const cd = await cr.json(); if (Array.isArray(cd)) setCars(cd.filter(c => c.available));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id, status) => {
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify({ status })
      });
      const d = await r.json();
      if (r.ok) { toast(d.message || 'Status updated', 'success'); fetchAll(); }
      else toast(d.error || 'Failed', 'error');
    } catch { toast('Network error', 'error'); }
  };

  const endTrip = async (id, endKm, extraCharge, desc) => {
    try {
      const r = await fetch(`/api/admin/billing/invoices/${id}/end-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify({ end_km: parseInt(endKm), extra_charge_paise: Math.round(extraCharge * 100), description: desc })
      });
      const d = await r.json();
      if (r.ok) { 
        toast('Trip completed and car released!', 'success'); 
        fetchAll(); 
        setPage('billing'); // Redirect to billing to see the invoice
      }
      else toast(d.error || 'Failed', 'error');
    } catch { toast('Network error', 'error'); }
  };

  const deleteBooking = async (id, ref) => {
    if (!confirm(`Delete booking ${ref}? This cannot be undone.`)) return;
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
      if (r.ok) { toast('Booking deleted', 'success'); fetchAll(); }
      else toast('Delete failed', 'error');
    } catch { toast('Network error', 'error'); }
  };

  const addBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (r.ok) {
        toast(`Booking ${d.ref} created!`, 'success');
        setShowModal(false);
        setForm({ car_id: '', customer_name: '', customer_phone: '', customer_email: '', pickup_date: '', return_date: '' });
        fetchAll();
      } else toast(d.error || 'Failed', 'error');
    } catch { toast('Network error', 'error'); }
    setSubmitting(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter(b => {
    const mf = filter === 'all' || b.status === filter;
    const ms = !search || [b.customer_name, b.car_name, b.ref].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return mf && ms;
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Bookings</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>{bookings.length} total · {bookings.filter(b => b.status === 'pending').length} pending</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> New Booking</button>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header" style={{ flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
              <button key={f} className={`adm-btn adm-btn-sm ${filter === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${bookings.filter(b => b.status === f).length})`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input className="adm-search" placeholder="🔍 Search ref, name..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchAll}><RefreshCw size={14} /></button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? <Loader /> : filtered.length === 0 ? <Empty icon="📋" text="No bookings found" /> : (
            <table className="adm-table">
              <thead>
                <tr><th>Ref</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Days</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>{b.ref}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                      <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>{b.customer_phone}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{b.car_name}</td>
                    <td style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>
                      <div>{b.pickup_date}</div>
                      <div>→ {b.return_date}</div>
                    </td>
                    <td>{b.total_days}d</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>₹{b.total_price}</td>
                    <td><StatusPill status={b.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        {b.status === 'pending' && <>
                          <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => updateStatus(b.id, 'confirmed')} title="Confirm"><CheckCircle size={13} /> Confirm</button>
                          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => updateStatus(b.id, 'cancelled')} title="Cancel"><XCircle size={13} /></button>
                        </>}
                        {b.status === 'confirmed' && (
                          <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => {
                            _setEndTripData(b);
                            setShowEndTripModal(true);
                          }} title="Complete trip & release car">🏁 End Trip</button>
                        )}
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => {
                          const mockInvoice = {
                            id: b.ref,
                            bill_type: 'NON_GST',
                            client_name: b.customer_name,
                            client_phone: b.customer_phone,
                            car_model: b.car_name,
                            subtotal_paise: b.total_price * 100,
                            total_amount_paise: b.total_price * 100,
                            start_date: b.pickup_date,
                            end_date: b.return_date,
                            created_at: new Date().toISOString()
                          };
                          printProfessionalInvoice(mockInvoice);
                        }} title="Print Quick Bill" style={{ color: '#a78bfa' }}>
                          <Printer size={13} />
                        </button>
                        <a href={whatsappLink(b.customer_phone, `Hi ${b.customer_name}! BENAKA TRAVELS: This is an update on your booking ${b.ref} for the ${b.car_name} (${b.pickup_date} to ${b.return_date}). Status is now: ${b.status.toUpperCase()}. Total amount: ₹${b.total_price}. Please let us know if you have any questions!`)} target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ color: '#25D366' }} title="WhatsApp Update">
                          <MessageCircle size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Booking Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-hd"><h3>New Booking</h3><button className="adm-modal-close" onClick={() => setShowModal(false)}><X size={15} /></button></div>
            <form onSubmit={addBooking}>
              <div className="adm-form-group">
                <label>Vehicle *</label>
                <select required className="adm-input" value={form.car_id} onChange={e => setForm({ ...form, car_id: e.target.value })}>
                  <option value="">Choose vehicle...</option>
                  {cars.map(c => <option key={c.id} value={c.id}>{c.name} — ₹{c.price}/day</option>)}
                </select>
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Customer Name *</label><input required className="adm-input" placeholder="Full name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div className="adm-form-group"><label>Phone *</label><input required className="adm-input" placeholder="+91..." value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></div>
              </div>
              <div className="adm-form-group"><label>Email *</label><input required type="email" className="adm-input" placeholder="email@example.com" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Pickup *</label><input required type="date" className="adm-input" min={today} value={form.pickup_date} onChange={e => setForm({ ...form, pickup_date: e.target.value })} /></div>
                <div className="adm-form-group"><label>Return *</label><input required type="date" className="adm-input" min={form.pickup_date || today} value={form.return_date} onChange={e => setForm({ ...form, return_date: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════
   VEHICLES PAGE
══════════════════════════════════════════════════ */
function VehiclesPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Sedan', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Diesel' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/cars', { headers: { Authorization: TOKEN } });
      const d = await r.json(); if (Array.isArray(d)) setCars(d);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/admin/cars', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: TOKEN }, body: JSON.stringify(form) });
      if (r.ok) { toast('Vehicle added!', 'success'); setShowModal(false); setForm({ name: '', category: 'Sedan', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Diesel' }); fetchCars(); }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error'); }
    } catch { toast('Network error', 'error'); }
    setSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? Any pending bookings will be cancelled.`)) return;
    const r = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
    if (r.ok) { toast(`${name} removed`, 'success'); fetchCars(); }
    else toast('Failed', 'error');
  };

  const toggleAvail = async (car) => {
    const r = await fetch(`/api/admin/cars/${car.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
      body: JSON.stringify({ available: !car.available })
    });
    if (r.ok) { toast(`${car.name} → ${!car.available ? 'Available' : 'Unavailable'}`, 'success'); fetchCars(); }
  };

  const filtered = cars.filter(c => !search || [c.name, c.category].some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vehicles</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>{cars.length} total · {cars.filter(c => c.available).length} available</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <input className="adm-search" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchCars}><RefreshCw size={14} /></button>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => cars.length > 0 && exportCSV(cars.map(c => ({ Name: c.name, Category: c.category, Price: c.price, Seats: c.seats, Fuel: c.fuel_type, Available: c.available ? 'Yes' : 'No' })), 'fleet_export.csv')}>⬇ CSV</button>
          <button className="adm-btn adm-btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Add Vehicle</button>
        </div>
      </div>

      <div className="adm-panel">
        <div style={{ overflowX: 'auto' }}>
          {loading ? <Loader /> : (
            <table className="adm-table">
              <thead><tr><th>Vehicle</th><th>Category</th><th>Daily Rate</th><th>Seats</th><th>Fuel</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(car => (
                  <tr key={car.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <img src={car.image_url} alt="" style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px', background: '#1e293b', flexShrink: 0 }} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=200'; }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{car.name}</div>
                          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>{car.features?.slice(0, 35)}...</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="pill pill-blue">{car.category}</span></td>
                    <td style={{ fontWeight: 700, color: '#60a5fa' }}>${car.price}/day</td>
                    <td>{car.seats}</td>
                    <td>{car.fuel_type}</td>
                    <td>
                      <button className={`pill ${car.available ? 'pill-green' : 'pill-red'}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggleAvail(car)}>
                        {car.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td><button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(car.id, car.name)}><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-hd"><h3>Add Vehicle</h3><button className="adm-modal-close" onClick={() => setShowModal(false)}><X size={15} /></button></div>
            <form onSubmit={handleAdd}>
              <div className="adm-form-group"><label>Name *</label><input required className="adm-input" placeholder="e.g. Lamborghini Urus" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Category *</label><select className="adm-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Sedan', 'SUV', 'MUV', 'Minibus', 'Bus'].map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="adm-form-group"><label>Daily Rate ($) *</label><input required type="number" className="adm-input" placeholder="450" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Seats</label><input type="number" className="adm-input" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} /></div>
                <div className="adm-form-group"><label>Fuel</label><select className="adm-input" value={form.fuel_type} onChange={e => setForm({ ...form, fuel_type: e.target.value })}>{['Petrol / CNG / Diesel', 'Petrol / CNG', 'Diesel', 'Petrol', 'Electric'].map(f => <option key={f}>{f}</option>)}</select></div>
              </div>
              <div className="adm-form-group"><label>Features *</label><input required className="adm-input" placeholder="V8 Biturbo, 641hp" value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} /></div>
              <div className="adm-form-group"><label>Image URL *</label><input required className="adm-input" placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════
   CUSTOMERS PAGE
══════════════════════════════════════════════════ */
function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } })
      .then(r => r.json()).then(data => {
        if (!Array.isArray(data)) return;
        const map = {};
        data.forEach(b => {
          const k = b.customer_phone;
          if (!map[k]) map[k] = { name: b.customer_name, email: b.customer_email, phone: b.customer_phone, bookings: 0, revenue: 0, lastCar: '' };
          map[k].bookings++;
          if (b.status === 'confirmed' || b.status === 'completed') map[k].revenue += b.total_price || 0;
          map[k].lastCar = b.car_name;
        });
        setCustomers(Object.values(map).sort((a, b) => b.revenue - a.revenue));
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => !search || [c.name, c.email, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Customers</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>{customers.length} unique customers</p>
        </div>
        <input className="adm-search" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="adm-panel">
        <div style={{ overflowX: 'auto' }}>
          {loading ? <Loader /> : filtered.length === 0 ? <Empty icon="👥" text="No customers yet" /> : (
            <table className="adm-table">
              <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Email</th><th>Bookings</th><th>Revenue</th><th>Contact</th></tr></thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.phone}>
                    <td style={{ color: 'rgba(255,255,255,.3)' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', flexShrink: 0 }}>{c.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>Last: {c.lastCar}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '.85rem' }}>{c.phone}</td>
                    <td style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)' }}>{c.email}</td>
                    <td><span className="pill pill-blue">{c.bookings}</span></td>
                    <td style={{ fontWeight: 700, color: '#4ade80' }}>${c.revenue.toLocaleString()}</td>
                    <td>
                      <a href={whatsappLink(c.phone, `Hi ${c.name}! This is BENAKA TRAVELS.`)} target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ color: '#25D366' }}>
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   REPORTS PAGE
══════════════════════════════════════════════════ */
function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: TOKEN } }).then(r => r.json()),
      fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } }).then(r => r.json()),
      fetch('/api/admin/revenue-chart', { headers: { Authorization: TOKEN } }).then(r => r.json())
    ]).then(([s, b, c]) => {
      setStats(s);
      if (Array.isArray(b)) setBookings(b);
      if (Array.isArray(c)) setChartData(c);
    }).catch(() => {});
  }, []);

  const statusCounts = bookings.reduce((a, b) => { a[b.status] = (a[b.status] || 0) + 1; return a; }, {});
  const topCars = bookings.reduce((a, b) => { a[b.car_name] = (a[b.car_name] || 0) + 1; return a; }, {});
  const topCarsSorted = Object.entries(topCars).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Reports & Analytics</h2>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>Complete business overview</p>
      </div>

      <div className="adm-stats-row" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', sub: 'Confirmed + Completed' },
          { label: 'This Month', value: `$${(stats?.monthRevenue || 0).toLocaleString()}`, icon: '📅', sub: 'Current month revenue' },
          { label: 'Avg Booking', value: stats?.totalBookings ? `$${Math.round((stats.totalRevenue || 0) / Math.max(1, (stats.confirmedBookings || 0) + (stats.completedBookings || 0)))}` : '$0', icon: '📊', sub: 'Per confirmed booking' },
          { label: 'Completion Rate', value: stats?.totalBookings ? `${Math.round(((stats.completedBookings || 0) / stats.totalBookings) * 100)}%` : '0%', icon: '✅', sub: `${stats?.completedBookings ?? 0} of ${stats?.totalBookings ?? 0}` },
        ].map((s, i) => (
          <div key={i} className="adm-stat-card">
            <div>
              <div className="adm-stat-label">{s.label}</div>
              <div className="adm-stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              <div className="adm-stat-sub blue">{s.sub}</div>
            </div>
            <div className="adm-stat-icon icon-blue">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="adm-grid-2">
        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Revenue Trend (Last 30 Days)</span></div>
          <div className="revenue-chart-wrap">
            {chartData.length > 0 ? <RevenueChart data={chartData} /> : <Empty icon="📊" text="No revenue data yet" />}
          </div>
        </div>

        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Booking Status</span></div>
          <div className="adm-panel-body">
            {Object.entries(statusCounts).map(([st, cnt]) => {
              const pct = Math.round((cnt / bookings.length) * 100);
              return (
                <div key={st} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                    <StatusPill status={st} />
                    <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{cnt} ({pct}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: '99px', height: '6px' }}>
                    <div style={{ background: '#10b981', borderRadius: '99px', height: '100%', width: `${pct}%`, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(statusCounts).length === 0 && <Empty icon="📋" text="No data" />}
          </div>
        </div>
      </div>

      {topCarsSorted.length > 0 && (
        <div className="adm-panel" style={{ marginTop: '1.25rem' }}>
          <div className="adm-panel-header"><span className="adm-panel-title">Most Popular Vehicles</span></div>
          <div className="adm-panel-body">
            {topCarsSorted.map(([name, cnt], i) => (
              <div key={name} className="fleet-status-row">
                <div className="fleet-status-label">
                  <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 700, width: '20px' }}>#{i + 1}</span>
                  {name}
                </div>
                <span className="pill pill-blue">{cnt} booking{cnt > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS + SUPPORT (compact)
══════════════════════════════════════════════════ */
function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const save = (e) => { e.preventDefault(); toast('Settings saved', 'success'); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h2>
      <div className="adm-grid-2" style={{ alignItems: 'start' }}>
        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Business Details</span></div>
          <div className="adm-panel-body">
            <form onSubmit={save}>
              {[['Business Name', 'BENAKA TRAVELS'], ['Contact Email', 'benakatravelsbusiness@gmail.com'], ['Phone', '+91 6362416120'], ['Address', 'Panchaxari Nagar, Gadag']].map(([l, v]) => (
                <div key={l} className="adm-form-group"><label>{l}</label><input className="adm-input" defaultValue={v} /></div>
              ))}
              <button type="submit" className="adm-btn adm-btn-primary">{saved ? '✅ Saved' : 'Save'}</button>
            </form>
          </div>
        </div>
        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Quick Links</span></div>
          <div className="adm-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <Link to="/" className="adm-btn adm-btn-ghost" style={{ justifyContent: 'flex-start' }}><Home size={15} /> View Website</Link>
            <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost" style={{ justifyContent: 'flex-start' }}>☁️ Cloudflare Dashboard</a>
          </div>
        </div>
      </div>
    </>
  );
}

function SupportPage() {
  const faqs = [
    { q: 'How does the booking lifecycle work?', a: 'Customer books → Status is PENDING → You click Confirm → Status is CONFIRMED (car stays rented, revenue counted) → When trip ends, click "Trip Done" → Status is COMPLETED (car released back to available, revenue preserved permanently).' },
    { q: 'Why is revenue $0?', a: 'Revenue only counts bookings with status CONFIRMED or COMPLETED. Pending and cancelled bookings are not counted. Make sure to Confirm bookings to see revenue.' },
    { q: 'How to contact a customer?', a: 'Every booking row has a green WhatsApp button that opens a pre-filled message with all booking details. You can also go to Customers page to see all customers with WhatsApp links.' },
    { q: 'How does car availability work?', a: 'When a booking is created → car becomes Unavailable. When booking is Completed or Cancelled → car is automatically released back to Available. You can also manually toggle availability in the Vehicles page.' },
    { q: 'Can I delete a booking?', a: 'You can only delete Completed or Cancelled bookings. Active bookings (Pending/Confirmed) must be cancelled first to release the car.' },
  ];
  return (
    <>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Support & FAQ</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>
        {faqs.map((f, i) => (
          <div key={i} className="adm-panel">
            <div className="adm-panel-body">
              <div style={{ fontWeight: 700, marginBottom: '.5rem', color: '#34d399' }}>Q: {f.q}</div>
              <div style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.7 }}>{f.a}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   BILLING ENGINE PAGE (Iframe Embed)
══════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════
   BILLING ENGINE PAGE (Native Implementation)
   Goal: Replace iframe with robust React UI
══════════════════════════════════════════════════ */
function BillingEnginePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Create Invoice State
  const [form, setForm] = useState({
    client_id: '', car_id: '', bill_type: 'NON_GST', company_name: '', party_gstin: '',
    place_from: '', place_to: '', working_days: '', start_date: '', end_date: '',
    start_km: '', end_km: '', extra_km_rate: '', avg_monthly_rate: '',
    driver_extra_duty: '', driver_batta: '', toll_gate: '', fastag: '',
    cgst_rate: 9, sgst_rate: 9, advance_paid: 0
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ir, cr, clr] = await Promise.all([
        fetch('/api/admin/billing/invoices', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/cars', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/billing/clients', { headers: { Authorization: TOKEN } })
      ]);
      const idata = await ir.json(); if (idata.success) setInvoices(idata.data.invoices);
      const cdata = await cr.json(); if (Array.isArray(cdata)) setCars(cdata);
      const cldata = await clr.json(); if (cldata.success) setClients(cldata.data.clients);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      client_id: parseInt(form.client_id),
      car_id: parseInt(form.car_id),
      subtotal_paise: 0, // Simplified for now, backend will recalc if needed or I add line items
      line_items: [{ description: 'Base Rental', amount_paise: 0 }],
      advance_paid_paise: Math.round(form.advance_paid * 100),
      driver_batta_paise: Math.round(form.driver_batta * 100),
      toll_gate_paise: Math.round(form.toll_gate * 100),
      fastag_paise: Math.round(form.fastag * 100),
    };
    
    try {
      const r = await fetch('/api/admin/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        toast('Invoice generated successfully', 'success');
        setShowCreate(false);
        fetchAll();
      } else {
        const d = await r.json();
        toast(d.error || 'Failed to generate invoice', 'error');
      }
    } catch { toast('Network error: Could not reach server', 'error'); }
  };

  const deleteInvoice = async (id) => {
    if (!confirm('Permanent delete this invoice?')) return;
    try {
      const r = await fetch(`/api/admin/billing/invoices/${id}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
      if (r.ok) { toast('Invoice deleted', 'success'); fetchAll(); }
      else {
        const d = await r.json();
        toast(d.error || 'Delete failed', 'error');
      }
    } catch { toast('Network error during delete', 'error'); }
  };

  return (
    <div className="adm-page-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Invoices & Billing</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>{invoices.length} total records generated</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="adm-btn adm-btn-ghost" onClick={fetchAll}><RefreshCw size={15} /> Refresh</button>
          <button className="adm-btn adm-btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Create Manual Bill</button>
        </div>
      </div>

      <div className="adm-panel">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🧾</div>
              <h3 style={{ fontWeight: 600, marginBottom: '.5rem' }}>No Invoices Yet</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.9rem' }}>Create your first bill to see it here.</p>
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>INV #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Dates</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.id}</td>
                    <td>{inv.client_name}</td>
                    <td>{inv.car_model}</td>
                    <td style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.6)' }}>{inv.start_date} → {inv.end_date}</td>
                    <td style={{ fontWeight: 700, color: '#34d399', textAlign: 'right' }}>₹{(inv.total_amount_paise / 100).toLocaleString()}</td>
                    <td><span className={`adm-badge ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => printProfessionalInvoice(inv)} title="Print"><Printer size={15} /></button>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => deleteInvoice(inv.id)} title="Delete" style={{ color: '#ef4444' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <InvoiceFormModal 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => { setShowCreate(false); fetchAll(); }}
          cars={cars}
          clients={clients}
          onAddClient={() => { setShowCreate(false); setShowAddClient(true); }}
        />
      )}

      {showAddClient && (
        <ClientFormModal
          onClose={() => setShowAddClient(false)}
          onSuccess={() => { setShowAddClient(false); fetchAll(); setShowCreate(true); }}
        />
      )}
    </div>
  );
}


function InvoiceFormModal({ onClose, onSuccess, cars, clients, onAddClient }) {
  const [form, setForm] = useState({
    client_id: '', car_id: '', bill_type: 'NON_GST', company_name: '', party_gstin: '',
    place_from: '', place_to: '', working_days: '', start_date: '', end_date: '',
    start_km: '', end_km: '', extra_km_rate: '', avg_monthly_rate: '',
    driver_extra_duty: '', driver_batta: '', toll_gate: '', fastag: '',
    cgst_rate: 9, sgst_rate: 9, advance_paid: 0
  });

    e.preventDefault();
    
    // Auto-calculate base rental if working days and car rate are available
    const selectedCar = cars.find(c => c.id === parseInt(form.car_id));
    const dailyRate = selectedCar ? (selectedCar.price * 100) : 0;
    const workingDays = parseInt(form.working_days) || 0;
    const calculatedBasePaise = workingDays * dailyRate;

    const payload = {
      ...form,
      client_id: parseInt(form.client_id),
      car_id: parseInt(form.car_id),
      subtotal_paise: calculatedBasePaise, 
      line_items: calculatedBasePaise > 0 ? [] : [{ description: 'Base Rental', amount_paise: 0 }],
      advance_paid_paise: Math.round(form.advance_paid * 100),
      driver_batta_paise: Math.round(form.driver_batta * 100),
      toll_gate_paise: Math.round(form.toll_gate * 100),
      fastag_paise: Math.round(form.fastag * 100),
    };
    
    try {
      const r = await fetch('/api/admin/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        toast('Invoice generated successfully', 'success');
        onSuccess();
      } else {
        const d = await r.json();
        toast(d.error || 'Failed', 'error');
      }
    } catch { toast('Network error', 'error'); }
  };

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: '800px' }}>
        <div className="adm-modal-hd"><h3>Create New Invoice / Manual Booking</h3><button className="adm-modal-close" onClick={onClose}><X size={15} /></button></div>
        <form onSubmit={handleSubmit} className="billing-form" style={{ padding: '0 1.5rem 1.5rem' }}>
          <div className="adm-form-row">
            <div className="adm-form-group">
              <label>Bill Type</label>
              <select className="adm-input" value={form.bill_type} onChange={e => setForm({...form, bill_type: e.target.value})}>
                <option value="NON_GST">Cash Bill (Non-GST)</option>
                <option value="GST">Tax Invoice (GST)</option>
              </select>
            </div>
            <div className="adm-form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                Select Customer 
                <button type="button" onClick={onAddClient} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '.75rem', cursor: 'pointer', fontWeight: 700 }}>+ Add New</button>
              </label>
              <select required className="adm-input" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}>
                <option value="">-- Choose Party --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone_number})</option>)}
              </select>
            </div>
          </div>

          {form.bill_type === 'GST' && (
            <div className="adm-form-row">
              <div className="adm-form-group"><label>Company Name (M/s)</label><input className="adm-input" placeholder="Party's Company Name" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} /></div>
              <div className="adm-form-group"><label>Party GSTIN</label><input className="adm-input" placeholder="29XXXXX..." value={form.party_gstin} onChange={e => setForm({...form, party_gstin: e.target.value})} /></div>
            </div>
          )}

          <div className="adm-form-row">
            <div className="adm-form-group">
              <label>Vehicle</label>
              <select required className="adm-input" value={form.car_id} onChange={e => setForm({...form, car_id: e.target.value})}>
                <option value="">-- Select Car --</option>
                {cars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="adm-form-group"><label>Working Days</label><input type="number" className="adm-input" value={form.working_days} onChange={e => setForm({...form, working_days: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Start Date</label><input type="date" className="adm-input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
            <div className="adm-form-group"><label>End Date</label><input type="date" className="adm-input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Place From</label><input className="adm-input" value={form.place_from} onChange={e => setForm({...form, place_from: e.target.value})} /></div>
            <div className="adm-form-group"><label>Place To</label><input className="adm-input" value={form.place_to} onChange={e => setForm({...form, place_to: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Driver Batta (₹)</label><input type="number" className="adm-input" value={form.driver_batta} onChange={e => setForm({...form, driver_batta: e.target.value})} /></div>
            <div className="adm-form-group"><label>Toll / Parking (₹)</label><input type="number" className="adm-input" value={form.toll_gate} onChange={e => setForm({...form, toll_gate: e.target.value})} /></div>
            <div className="adm-form-group"><label>Fastag (₹)</label><input type="number" className="adm-input" value={form.fastag} onChange={e => setForm({...form, fastag: e.target.value})} /></div>
          </div>

          {form.bill_type === 'GST' && (
            <div className="adm-form-row">
              <div className="adm-form-group"><label>CGST Rate (%)</label><input type="number" step="0.5" className="adm-input" value={form.cgst_rate} onChange={e => setForm({...form, cgst_rate: e.target.value})} /></div>
              <div className="adm-form-group"><label>SGST Rate (%)</label><input type="number" step="0.5" className="adm-input" value={form.sgst_rate} onChange={e => setForm({...form, sgst_rate: e.target.value})} /></div>
            </div>
          )}

          <div className="adm-form-row" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            <div className="adm-form-group"><label>Advance Received (₹)</label><input type="number" className="adm-input" value={form.advance_paid} onChange={e => setForm({...form, advance_paid: e.target.value})} /></div>
            <div style={{ flex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary">Generate Final Invoice</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientFormModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ full_name: '', phone_number: '', email: '', driving_license_number: '', gstin: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/admin/billing/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify(form)
      });
      if (r.ok) { toast('Client added!', 'success'); onSuccess(); }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error'); }
    } catch { toast('Network error', 'error'); }
    setSubmitting(false);
  };

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-hd"><h3>Add New Client</h3><button className="adm-modal-close" onClick={onClose}><X size={15} /></button></div>
        <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem' }}>
          <div className="adm-form-group"><label>Full Name *</label><input required className="adm-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
          <div className="adm-form-group"><label>Phone Number *</label><input required className="adm-input" value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} /></div>
          <div className="adm-form-group"><label>Email</label><input type="email" className="adm-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div className="adm-form-group"><label>GSTIN (Optional)</label><input className="adm-input" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} /></div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('benaka_admin_auth') === 'true');
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Modals state
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [endTripData, setEndTripData] = useState(null);

  useEffect(() => {
    _setShowEndTripModal = setShowEndTripModal;
    _setEndTripData = setEndTripData;
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    fetch('/api/admin/stats', { headers: { Authorization: TOKEN } })
      .then(r => r.json())
      .then(d => setPendingCount(d.pendingBookings || 0))
      .catch(() => {});
  }, [page, isAuthorized]);

  if (!isAuthorized) {
    return (
      <>
        <ToastHub />
        <LoginScreen onLogin={() => setIsAuthorized(true)} />
      </>
    );
  }

  const logout = () => {
    sessionStorage.removeItem('benaka_admin_auth');
    setIsAuthorized(false);
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { key: 'bookings', label: 'Bookings', icon: <BookOpen size={17} />, badge: pendingCount },
    { key: 'vehicles', label: 'Vehicles', icon: <Car size={17} /> },
    { key: 'customers', label: 'Customers', icon: <Users size={17} /> },
    { key: 'billing', label: 'Billing Engine', icon: <Receipt size={17} /> },
    { key: 'reports', label: 'Reports', icon: <BarChart2 size={17} /> },
  ];

  const titles = {
    dashboard: ['Dashboard', 'Welcome back to BENAKA TRAVELS'],
    bookings: ['Bookings', 'Manage all customer reservations'],
    vehicles: ['Fleet Management', 'Add, edit, and manage your vehicles'],
    customers: ['Customers', 'Customer profiles from bookings'],
    billing: ['Advanced Billing', 'Invoicing and CRM suite'],
    reports: ['Reports & Analytics', 'Business performance overview'],
    settings: ['Settings', 'Configure your admin panel'],
    support: ['Support', 'Help and FAQ'],
  };

  return (
    <div className="adm-layout">
      <ToastHub />

      {/* Global End Trip Modal */}
      {showEndTripModal && endTripData && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowEndTripModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-hd"><h3>End Trip: {endTripData.car_name}</h3><button className="adm-modal-close" onClick={() => setShowEndTripModal(false)}><X size={15} /></button></div>
            <div className="adm-panel-body">
              <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)', marginBottom: '1rem' }}>Closing trip for {endTripData.customer_name}. Vehicle will be marked as available.</p>
              <div className="adm-form-group">
                <label>Closing KM Reading</label>
                <input type="number" className="adm-input" placeholder="Enter final odometer reading" id="end-km-input" />
              </div>
              <div className="adm-form-group">
                <label>Extra Charges (₹) - Optional</label>
                <input type="number" className="adm-input" placeholder="Extra charges if any" id="extra-charge-input" />
              </div>
              <div className="adm-form-group">
                <label>Charge Reason</label>
                <input className="adm-input" placeholder="e.g. Extra hours, cleaning" id="extra-desc-input" />
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="adm-btn adm-btn-ghost" onClick={() => setShowEndTripModal(false)}>Cancel</button>
                <button className="adm-btn adm-btn-success" onClick={() => {
                  const km = document.getElementById('end-km-input').value;
                  const charge = document.getElementById('extra-charge-input').value || 0;
                  const desc = document.getElementById('extra-desc-input').value;
                  if (!km) return toast('End KM is required', 'error');
                  
                  fetch(`/api/admin/billing/invoices/${endTripData.id}/end-trip`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
                    body: JSON.stringify({ end_km: parseInt(km), extra_charge_paise: Math.round(charge * 100), description: desc })
                  }).then(r => r.json()).then(d => {
                    if (d.success) {
                      toast('Trip completed successfully!', 'success');
                      setShowEndTripModal(false);
                      setPage('billing');
                    } else {
                      toast(d.error || 'Failed', 'error');
                    }
                  });
                }}>Complete Trip & Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-brand-name">🚗 <span className="dot">BENAKA</span> ADMIN</div>
          <div className="adm-brand-sub">Fleet Management System</div>
        </div>
        <nav className="adm-nav">
          <div className="adm-nav-section">Main</div>
          {navItems.map(item => (
            <button key={item.key} className={`adm-nav-item ${page === item.key ? 'active' : ''}`} onClick={() => { setPage(item.key); setSidebarOpen(false); }}>
              {item.icon} {item.label}
              {item.badge > 0 && <span className="adm-nav-badge">{item.badge}</span>}
            </button>
          ))}
          <div className="adm-nav-section">System</div>
          <button className={`adm-nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => { setPage('settings'); setSidebarOpen(false); }}><Settings size={17} /> Settings</button>
          <button className={`adm-nav-item ${page === 'support' ? 'active' : ''}`} onClick={() => { setPage('support'); setSidebarOpen(false); }}><HelpCircle size={17} /> Support</button>
          <button className="adm-nav-item" style={{ marginTop: 'auto', color: '#ef4444' }} onClick={logout}><XCircle size={17} /> Logout</button>
        </nav>
        <div className="adm-sidebar-footer">
          <Link to="/" className="adm-user-card">
            <div className="adm-avatar">BT</div>
            <div><div className="adm-user-name">BENAKA TRAVELS</div><div className="adm-user-role">Administrator</div></div>
          </Link>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-topbar">
          <div className="adm-topbar-left"><h2>{titles[page]?.[0]}</h2><p>{titles[page]?.[1]}</p></div>
          <div className="adm-topbar-right">
            <button className="adm-icon-btn" onClick={() => setPage('bookings')}>
              <Bell size={16} />
              {pendingCount > 0 && <span className="adm-notif-dot" />}
            </button>
            <Link to="/" className="adm-icon-btn"><Home size={16} /></Link>
            <div className="adm-avatar">BT</div>
          </div>
        </div>
        <div className="adm-content">
          {page === 'dashboard' && <DashboardPage setPage={setPage} />}
          {page === 'bookings' && <BookingsPage />}
          {page === 'vehicles' && <VehiclesPage />}
          {page === 'customers' && <CustomersPage />}
          {page === 'billing' && <BillingEnginePage />}
          {page === 'reports' && <ReportsPage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'support' && <SupportPage />}
        </div>
      </main>

      <button className="adm-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }} />}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pass === 'benakaAdmin2026') {
      sessionStorage.setItem('benaka_admin_auth', 'true');
      onLogin();
    } else {
      setErr(true);
      toast('Invalid Admin Password', 'error');
      setTimeout(() => setErr(false), 2000);
    }
  };

  return (
    <div className="adm-login-wrap" style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: '#0a0a0b', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div className="adm-login-card" style={{ 
        width: '100%', maxWidth: '400px', padding: '3rem', background: '#111113', 
        borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🚗</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>BENAKA ADMIN</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>Secure Fleet Management Access</p>
        
        <form onSubmit={handleLogin}>
          <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Password</label>
            <input 
              type="password" 
              className={`adm-input ${err ? 'err' : ''}`} 
              autoFocus 
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              style={{ padding: '0.875rem 1rem', fontSize: '1rem', letterSpacing: '0.1em' }}
            />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}>
            Unlock Dashboard
          </button>
        </form>
        
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textDecoration: 'none' }}>← Return to Homepage</Link>
        </div>
      </div>
    </div>
  );
}
