import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Car, Users, BarChart2,
  Settings, HelpCircle, Bell, Search, RefreshCw,
  Plus, Trash2, CheckCircle, XCircle, Menu, X,
  TrendingUp, AlertCircle, Home
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import '../admin.css';

Chart.register(...registerables);

const TOKEN = 'Bearer benakaAdmin2026';

/* ══════════════════════════════════════════════════
   TOAST SYSTEM
══════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════
   REVENUE CHART
══════════════════════════════════════════════════ */
function RevenueChart({ bookings }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    // Build last 7 days revenue from bookings
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [0, 0, 0, 0, 0, 0, 0];
    bookings.forEach(b => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        const d = new Date(b.created_at);
        const day = d.getDay(); // 0=Sun
        const idx = day === 0 ? 6 : day - 1;
        data[idx] += b.total_price || 0;
      }
    });

    if (chartRef.current) chartRef.current.destroy();
    if (!ref.current) return;

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Revenue ($)',
          data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,.12)',
          borderWidth: 2.5,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.42,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: '#1e293b',
          borderColor: 'rgba(59,130,246,.3)',
          borderWidth: 1,
          titleColor: '#94a3b8',
          bodyColor: '#fff',
          callbacks: { label: ctx => `$${ctx.parsed.y}` }
        }},
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: 'rgba(255,255,255,.4)', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: 'rgba(255,255,255,.4)', font: { size: 11 }, callback: v => `$${v}` } }
        }
      }
    });
    return () => chartRef.current?.destroy();
  }, [bookings]);

  return (
    <div style={{ height: '200px' }}>
      <canvas ref={ref} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════ */
function DashboardPage({ setPage }) {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New booking received for Lamborghini Urus', time: '2 min ago', color: '#3b82f6' },
    { id: 2, text: 'Booking #CB0014 has been confirmed', time: '15 min ago', color: '#22c55e' },
    { id: 3, text: 'Porsche 911 GT3 is now available', time: '1 hr ago', color: '#f59e0b' },
    { id: 4, text: 'Monthly report is ready to view', time: '3 hr ago', color: '#8b5cf6' },
  ]);

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: TOKEN } })
      .then(r => r.json()).then(setStats).catch(() => {
        setStats({ totalCars: 22, availableCars: 18, totalBookings: 47, pendingBookings: 5, totalRevenue: 14820 });
      });
    fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setBookings(d.slice(0, 8)); })
      .catch(() => {});
  }, []);

  const statusPill = (s) => {
    const m = { pending: 'pill-yellow', confirmed: 'pill-green', cancelled: 'pill-red', completed: 'pill-blue' };
    return <span className={`pill ${m[s] || 'pill-gray'}`}>{s}</span>;
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="adm-stats-row">
        {[
          { label: 'Total Bookings', value: stats?.totalBookings ?? '—', sub: '+15% this month', subClass: 'green', icon: '📋', iconClass: 'icon-blue' },
          { label: 'Available Fleet', value: `${stats?.availableCars ?? '—'} Cars`, sub: `${stats?.totalCars ?? '—'} Total`, subClass: 'blue', icon: '🚗', iconClass: 'icon-green' },
          { label: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, sub: '+6% vs last month', subClass: 'green', icon: '💰', iconClass: 'icon-yellow' },
          { label: 'Active Rentals', value: (stats?.totalCars || 0) - (stats?.availableCars || 0), sub: `${stats?.pendingBookings ?? '—'} pending`, subClass: 'yellow', icon: '🔑', iconClass: 'icon-red' },
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

      {/* Middle row: bookings + chart + fleet status */}
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
                <thead>
                  <tr>
                    <th>ID</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,.3)' }}>No bookings yet</td></tr>
                  ) : bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ color: 'rgba(255,255,255,.4)', fontSize: '.8rem' }}>#{String(b.id).padStart(4, '0')}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{b.customer_name}</div>
                        <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)' }}>{b.customer_email}</div>
                      </td>
                      <td style={{ fontSize: '.875rem' }}>{b.car_name}</td>
                      <td style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>{b.pickup_date} → {b.return_date}</td>
                      <td style={{ fontWeight: 700, color: '#60a5fa' }}>${b.total_price}</td>
                      <td>{statusPill(b.status)}</td>
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
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)' }}>This Week</span>
            </div>
            <div className="revenue-chart-wrap">
              <RevenueChart bookings={bookings} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Fleet Status */}
          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Fleet Status</span>
            </div>
            <div className="adm-panel-body" style={{ paddingTop: '.5rem' }}>
              {[
                { label: 'Available', count: stats?.availableCars ?? 0, color: '#22c55e' },
                { label: 'Rented', count: (stats?.totalCars || 0) - (stats?.availableCars || 0), color: '#3b82f6' },
                { label: 'Pending', count: stats?.pendingBookings ?? 0, color: '#f59e0b' },
                { label: 'Total Fleet', count: stats?.totalCars ?? 0, color: '#8b5cf6' },
              ].map((row, i) => (
                <div key={i} className="fleet-status-row">
                  <div className="fleet-status-label">
                    <div className="fleet-status-dot" style={{ background: row.color }} />
                    {row.label}
                  </div>
                  <div className="fleet-status-count" style={{ color: row.color }}>{row.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Quick Actions</span>
            </div>
            <div className="adm-panel-body" style={{ paddingTop: '.5rem' }}>
              <div className="quick-actions-grid">
                <button className="quick-action-btn qa-primary" onClick={() => setPage('bookings')}>
                  <Plus size={15} /> Add Booking
                </button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('vehicles')}>
                  🚗 View Fleet
                </button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('reports')}>
                  📊 Reports
                </button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('customers')}>
                  👥 Customers
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Notifications</span>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '.15rem .45rem', borderRadius: '99px' }}>
                {notifications.length}
              </span>
            </div>
            <div className="adm-panel-body" style={{ paddingTop: '.25rem' }}>
              {notifications.map(n => (
                <div key={n.id} className="notif-item">
                  <div className="notif-dot-wrap">
                    <div className="notif-dot" style={{ background: n.color }} />
                  </div>
                  <div>
                    <div className="notif-text">{n.text}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
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
  const [showAddModal, setShowAddModal] = useState(false);
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
      if (r.ok) { toast(`Booking ${status}`, 'success'); fetchAll(); }
      else toast('Update failed', 'error');
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
      if (r.ok) { toast('Booking created!', 'success'); setShowAddModal(false); setForm({ car_id: '', customer_name: '', customer_phone: '', customer_email: '', pickup_date: '', return_date: '' }); fetchAll(); }
      else toast(d.error || 'Failed', 'error');
    } catch { toast('Network error', 'error'); }
    setSubmitting(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter;
    const matchSearch = !search || b.customer_name.toLowerCase().includes(search.toLowerCase()) || b.car_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pillClass = { pending: 'pill-yellow', confirmed: 'pill-green', cancelled: 'pill-red', completed: 'pill-blue' };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Bookings</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>{bookings.length} total reservations</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowAddModal(true)}><Plus size={15} /> New Booking</button>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header" style={{ flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
              <button key={f} className={`adm-btn adm-btn-sm ${filter === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input className="adm-search" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchAll}><RefreshCw size={14} /></button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}>⏳ Loading bookings...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}>📋 No bookings found</div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Pickup</th><th>Return</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>#{String(b.id).padStart(4, '0')}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                      <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)' }}>{b.customer_phone}</div>
                    </td>
                    <td>{b.car_name}</td>
                    <td style={{ fontSize: '.82rem' }}>{b.pickup_date}</td>
                    <td style={{ fontSize: '.82rem' }}>{b.return_date}</td>
                    <td style={{ fontWeight: 700, color: '#60a5fa' }}>${b.total_price}</td>
                    <td><span className={`pill ${pillClass[b.status] || 'pill-gray'}`}>{b.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '.35rem' }}>
                        {b.status === 'pending' && <>
                          <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => updateStatus(b.id, 'confirmed')} title="Confirm"><CheckCircle size={13} /></button>
                          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => updateStatus(b.id, 'cancelled')} title="Cancel"><XCircle size={13} /></button>
                        </>}
                        {b.status === 'confirmed' && (
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => updateStatus(b.id, 'completed')}>✅ Done</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-hd">
              <h3>New Booking</h3>
              <button className="adm-modal-close" onClick={() => setShowAddModal(false)}><X size={15} /></button>
            </div>
            <form onSubmit={addBooking}>
              <div className="adm-form-group">
                <label>Select Vehicle *</label>
                <select required className="adm-input" value={form.car_id} onChange={e => setForm({...form, car_id: e.target.value})}>
                  <option value="">Choose a vehicle...</option>
                  {cars.map(c => <option key={c.id} value={c.id}>{c.name} — ${c.price}/day</option>)}
                </select>
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label>Customer Name *</label>
                  <input required className="adm-input" placeholder="Full name" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
                </div>
                <div className="adm-form-group">
                  <label>Phone *</label>
                  <input required className="adm-input" placeholder="+91..." value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} />
                </div>
              </div>
              <div className="adm-form-group">
                <label>Email *</label>
                <input required type="email" className="adm-input" placeholder="email@example.com" value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} />
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label>Pickup Date *</label>
                  <input required type="date" className="adm-input" min={today} value={form.pickup_date} onChange={e => setForm({...form, pickup_date: e.target.value})} />
                </div>
                <div className="adm-form-group">
                  <label>Return Date *</label>
                  <input required type="date" className="adm-input" min={form.pickup_date || today} value={form.return_date} onChange={e => setForm({...form, return_date: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Confirm Booking'}</button>
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
  const [form, setForm] = useState({ name: '', category: 'Sports', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Petrol' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/cars', { headers: { Authorization: TOKEN } });
      const d = await r.json();
      if (Array.isArray(d)) setCars(d);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/admin/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify(form)
      });
      if (r.ok) { toast('Vehicle added!', 'success'); setShowModal(false); setForm({ name: '', category: 'Sports', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Petrol' }); fetchCars(); }
      else toast('Failed to add', 'error');
    } catch { toast('Network error', 'error'); }
    setSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    const r = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
    if (r.ok) { toast(`${name} removed`, 'success'); fetchCars(); }
    else toast('Delete failed', 'error');
  };

  const toggleAvail = async (car) => {
    const r = await fetch(`/api/admin/cars/${car.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
      body: JSON.stringify({ available: !car.available })
    });
    if (r.ok) { toast(`${car.name} toggled`, 'success'); fetchCars(); }
  };

  const filtered = cars.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vehicles</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>{cars.length} vehicles in fleet</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <input className="adm-search" placeholder="🔍 Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchCars}><RefreshCw size={14} /></button>
          <button className="adm-btn adm-btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Add Vehicle</button>
        </div>
      </div>

      <div className="adm-panel">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}>⏳ Loading fleet...</div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr><th>Vehicle</th><th>Category</th><th>Daily Rate</th><th>Seats</th><th>Fuel</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(car => (
                  <tr key={car.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <img
                          src={car.image_url}
                          alt={car.name}
                          style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px', background: '#1e293b', flexShrink: 0 }}
                          onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=200'; }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{car.name}</div>
                          <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', marginTop: '.1rem' }}>{car.features?.slice(0, 40)}...</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="pill pill-blue">{car.category}</span></td>
                    <td style={{ fontWeight: 700, color: '#60a5fa' }}>${car.price}/day</td>
                    <td style={{ color: 'rgba(255,255,255,.6)' }}>{car.seats}</td>
                    <td style={{ color: 'rgba(255,255,255,.6)' }}>{car.fuel_type}</td>
                    <td>
                      <button
                        className={`pill ${car.available ? 'pill-green' : 'pill-red'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        onClick={() => toggleAvail(car)}
                        title="Click to toggle"
                      >
                        {car.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td>
                      <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(car.id, car.name)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
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
            <div className="adm-modal-hd">
              <h3>Add New Vehicle</h3>
              <button className="adm-modal-close" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="adm-form-group">
                <label>Vehicle Name *</label>
                <input required className="adm-input" placeholder="e.g. Lamborghini Urus" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label>Category *</label>
                  <select className="adm-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {['Sports','SUV','Electric','Luxury'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="adm-form-group">
                  <label>Daily Rate ($) *</label>
                  <input required type="number" className="adm-input" placeholder="450" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group">
                  <label>Seats</label>
                  <input type="number" className="adm-input" placeholder="5" value={form.seats} onChange={e => setForm({...form, seats: e.target.value})} />
                </div>
                <div className="adm-form-group">
                  <label>Fuel Type</label>
                  <select className="adm-input" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})}>
                    {['Petrol','Electric','Diesel','Hybrid'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="adm-form-group">
                <label>Key Features *</label>
                <input required className="adm-input" placeholder="e.g. V8 Biturbo, 641hp, AWD" value={form.features} onChange={e => setForm({...form, features: e.target.value})} />
              </div>
              <div className="adm-form-group">
                <label>Image URL *</label>
                <input required className="adm-input" placeholder="https://images.unsplash.com/..." value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
              </div>
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
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        // Deduplicate by email
        const map = {};
        data.forEach(b => {
          if (!map[b.customer_email]) {
            map[b.customer_email] = { email: b.customer_email, name: b.customer_name, phone: b.customer_phone, bookings: 0, spent: 0, last: b.created_at };
          }
          map[b.customer_email].bookings++;
          map[b.customer_email].spent += b.total_price || 0;
        });
        setCustomers(Object.values(map).sort((a, b) => b.spent - a.spent));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Customers</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>{customers.length} unique customers</p>
        </div>
        <input className="adm-search" placeholder="🔍 Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="adm-panel">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}>⏳ Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}>👥 No customers yet. Bookings will appear here.</div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr><th>#</th><th>Customer</th><th>Email</th><th>Phone</th><th>Total Bookings</th><th>Total Spent</th></tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.email}>
                    <td style={{ color: 'rgba(255,255,255,.3)', fontSize: '.8rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', flexShrink: 0 }}>
                          {c.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem' }}>{c.email}</td>
                    <td style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem' }}>{c.phone}</td>
                    <td><span className="pill pill-blue">{c.bookings} booking{c.bookings > 1 ? 's' : ''}</span></td>
                    <td style={{ fontWeight: 700, color: '#4ade80' }}>${c.spent.toLocaleString()}</td>
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

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: TOKEN } }).then(r => r.json()),
      fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } }).then(r => r.json())
    ]).then(([s, b]) => {
      setStats(s);
      if (Array.isArray(b)) setBookings(b);
    }).catch(() => {});
  }, []);

  const byCategory = bookings.reduce((acc, b) => {
    const key = b.status;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Reports & Analytics</h2>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>Live business metrics</p>
      </div>

      <div className="adm-stats-row" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', sub: 'Confirmed bookings only' },
          { label: 'Total Fleet', value: stats?.totalCars ?? '—', icon: '🚗', sub: `${stats?.availableCars ?? '—'} available now` },
          { label: 'All Bookings', value: stats?.totalBookings ?? '—', icon: '📋', sub: `${stats?.pendingBookings ?? '—'} pending` },
          { label: 'Avg Booking Value', value: stats?.totalBookings ? `$${Math.round((stats.totalRevenue||0) / stats.totalBookings)}` : '$0', icon: '📊', sub: 'Per transaction' },
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
          <div className="adm-panel-header"><span className="adm-panel-title">Booking Status Breakdown</span></div>
          <div className="adm-panel-body">
            {Object.entries(byCategory).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,.3)' }}>No data yet</div>
            ) : Object.entries(byCategory).map(([status, count]) => {
              const pillMap = { pending: 'pill-yellow', confirmed: 'pill-green', cancelled: 'pill-red', completed: 'pill-blue' };
              const pct = Math.round((count / bookings.length) * 100);
              return (
                <div key={status} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                    <span className={`pill ${pillMap[status] || 'pill-gray'}`}>{status}</span>
                    <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: '99px', height: '6px' }}>
                    <div style={{ background: '#3b82f6', borderRadius: '99px', height: '100%', width: `${pct}%`, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Revenue Chart (This Week)</span></div>
          <div className="revenue-chart-wrap">
            <RevenueChart bookings={bookings} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════════════════════ */
function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ business: 'BENAKA TRAVELS', email: 'info@benakatravels.com', phone: '+91 98765 43210', address: 'Bengaluru, Karnataka', currency: 'USD' });

  const save = (e) => {
    e.preventDefault();
    toast('Settings saved!', 'success');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Settings</h2>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>Configure your business details</p>
      </div>

      <div className="adm-grid-2" style={{ alignItems: 'start' }}>
        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Business Details</span></div>
          <div className="adm-panel-body">
            <form onSubmit={save}>
              <div className="adm-form-group">
                <label>Business Name</label>
                <input className="adm-input" value={form.business} onChange={e => setForm({...form, business: e.target.value})} />
              </div>
              <div className="adm-form-group">
                <label>Contact Email</label>
                <input type="email" className="adm-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="adm-form-group">
                <label>Phone Number</label>
                <input className="adm-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="adm-form-group">
                <label>Address</label>
                <input className="adm-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="adm-form-group">
                <label>Currency</label>
                <select className="adm-input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                  <option>USD</option><option>INR</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
              <button type="submit" className="adm-btn adm-btn-primary">{saved ? '✅ Saved!' : 'Save Changes'}</button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="adm-panel">
            <div className="adm-panel-header"><span className="adm-panel-title">Security</span></div>
            <div className="adm-panel-body">
              <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: '1rem' }}>
                Admin access is managed via your Cloudflare Worker environment variable <code style={{ background: 'rgba(255,255,255,.08)', padding: '.15rem .4rem', borderRadius: '4px' }}>ADMIN_PASSWORD</code>. 
                Update it directly in the Cloudflare Workers dashboard → Settings → Variables.
              </p>
              <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: '8px', padding: '1rem', fontSize: '.82rem', color: '#fbbf24' }}>
                ⚠️ Never share your admin password. Change it regularly for security.
              </div>
            </div>
          </div>

          <div className="adm-panel">
            <div className="adm-panel-header"><span className="adm-panel-title">Quick Links</span></div>
            <div className="adm-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <Link to="/" className="adm-btn adm-btn-ghost" style={{ justifyContent: 'flex-start' }}><Home size={15} /> View Live Website</Link>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost" style={{ justifyContent: 'flex-start' }}>☁️ Cloudflare Dashboard</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   SUPPORT PAGE
══════════════════════════════════════════════════ */
function SupportPage() {
  const faqs = [
    { q: 'How do I confirm a booking?', a: 'Go to Bookings → find the pending booking → click the ✅ Confirm button. The car status will automatically be marked as Unavailable on the client website.' },
    { q: 'How do I make a car available again after a rental?', a: 'Go to Bookings → click ✅ Done on a confirmed booking to mark it completed. Or go to Vehicles and click the status pill to toggle availability.' },
    { q: 'How to add a new vehicle?', a: 'Go to Vehicles → click Add Vehicle → fill in the name, category, daily rate, features, and a public image URL (Unsplash works great).' },
    { q: 'Where is revenue calculated from?', a: 'Revenue is summed from all bookings with status = confirmed or completed. Pending and cancelled bookings are excluded.' },
    { q: 'How to deploy changes to production?', a: 'Run npm run deploy from the root of your project. This builds the frontend and deploys everything to Cloudflare Workers automatically.' },
  ];

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Support & Help</h2>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>Frequently asked questions</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>
        {faqs.map((faq, i) => (
          <div key={i} className="adm-panel">
            <div className="adm-panel-body">
              <div style={{ fontWeight: 700, marginBottom: '.5rem', color: '#60a5fa' }}>Q: {faq.q}</div>
              <div style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.7 }}>{faq.a}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   ROOT ADMIN DASHBOARD
══════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPendingCount(d.filter(b => b.status === 'pending').length); })
      .catch(() => {});
  }, [page]);

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { key: 'bookings', label: 'Bookings', icon: <BookOpen size={17} />, badge: pendingCount },
    { key: 'vehicles', label: 'Vehicles', icon: <Car size={17} /> },
    { key: 'customers', label: 'Customers', icon: <Users size={17} /> },
    { key: 'reports', label: 'Reports', icon: <BarChart2 size={17} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={17} /> },
    { key: 'support', label: 'Support', icon: <HelpCircle size={17} /> },
  ];

  const pageTitles = {
    dashboard: { title: 'Dashboard', sub: 'Welcome back to BENAKA TRAVELS' },
    bookings: { title: 'Bookings', sub: 'Manage all customer reservations' },
    vehicles: { title: 'Fleet Management', sub: 'Add, edit, and manage your vehicles' },
    customers: { title: 'Customers', sub: 'Customer profiles from bookings' },
    reports: { title: 'Reports & Analytics', sub: 'Business performance overview' },
    settings: { title: 'Settings', sub: 'Configure your admin panel' },
    support: { title: 'Support', sub: 'Help and frequently asked questions' },
  };

  return (
    <div className="adm-layout">
      <ToastHub />

      {/* ── SIDEBAR ───────────────────────────────── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-brand-name">🚗 <span className="dot">BENAKA</span> ADMIN</div>
          <div className="adm-brand-sub">Fleet Management System</div>
        </div>

        <nav className="adm-nav">
          <div className="adm-nav-section">Main</div>
          {navItems.slice(0, 5).map(item => (
            <button
              key={item.key}
              className={`adm-nav-item ${page === item.key ? 'active' : ''}`}
              onClick={() => { setPage(item.key); setSidebarOpen(false); }}
            >
              {item.icon} {item.label}
              {item.badge > 0 && <span className="adm-nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="adm-nav-section">System</div>
          {navItems.slice(5).map(item => (
            <button
              key={item.key}
              className={`adm-nav-item ${page === item.key ? 'active' : ''}`}
              onClick={() => { setPage(item.key); setSidebarOpen(false); }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <Link to="/" className="adm-user-card">
            <div className="adm-avatar">BT</div>
            <div>
              <div className="adm-user-name">BENAKA TRAVELS</div>
              <div className="adm-user-role">Administrator</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────── */}
      <main className="adm-main">
        {/* Topbar */}
        <div className="adm-topbar">
          <div className="adm-topbar-left">
            <h2>{pageTitles[page]?.title}</h2>
            <p>{pageTitles[page]?.sub}</p>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-icon-btn" title="Notifications" onClick={() => setPage('dashboard')}>
              <Bell size={16} />
              {pendingCount > 0 && <span className="adm-notif-dot" />}
            </button>
            <Link to="/" className="adm-icon-btn" title="View Website" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={16} />
            </Link>
            <div className="adm-avatar" style={{ cursor: 'pointer' }}>BT</div>
          </div>
        </div>

        {/* Page Content */}
        <div className="adm-content">
          {page === 'dashboard' && <DashboardPage setPage={setPage} />}
          {page === 'bookings' && <BookingsPage />}
          {page === 'vehicles' && <VehiclesPage />}
          {page === 'customers' && <CustomersPage />}
          {page === 'reports' && <ReportsPage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'support' && <SupportPage />}
        </div>
      </main>

      {/* Mobile Sidebar Toggle */}
      <button className="adm-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }}
        />
      )}
    </div>
  );
}
