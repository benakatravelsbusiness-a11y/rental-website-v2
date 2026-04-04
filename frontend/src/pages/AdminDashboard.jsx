import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Car, BookOpen, Settings, LogOut, 
  Plus, Trash2, CheckCircle, XCircle, Menu, X,
  RefreshCw, Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Toast, { showToast } from '../components/Toast';

const TOKEN = 'Bearer benakaAdmin2026';
const ADMIN_PASS = 'benakaAdmin2026';

/* ── Small reusable components ───────────────────── */
function Spinner() {
  return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>⏳ Loading...</div>;
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>{icon}</div>
      <p>{text}</p>
    </div>
  );
}

/* ── Dashboard Page ──────────────────────────────── */
function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: TOKEN } })
      .then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) return <Spinner />;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back to BENAKA TRAVELS admin panel</p>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Vehicles', value: stats.totalCars, icon: '🚗', badge: 'badge-blue' },
          { label: 'Available Now', value: stats.availableCars, icon: '✅', badge: 'badge-green' },
          { label: 'Total Bookings', value: stats.totalBookings, icon: '📋', badge: 'badge-blue' },
          { label: 'Pending Approval', value: stats.pendingBookings, icon: '⏳', badge: 'badge-yellow' },
          { label: 'Total Revenue', value: `$${(stats.totalRevenue || 0).toLocaleString()}`, icon: '💰', badge: 'badge-green' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">{s.icon}</span>
              <span className={`stat-badge ${s.badge}`}>Live</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛣️</div>
        <h3>BENAKA TRAVELS Control Center</h3>
        <p style={{ color: 'var(--text-2)', marginTop: '.5rem', maxWidth: '400px', margin: '.5rem auto' }}>
          Manage your entire fleet, bookings, and customers from the left sidebar. All changes reflect on the live website immediately.
        </p>
      </div>
    </>
  );
}

/* ── Fleet Management Page ───────────────────────── */
function FleetPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Sports', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Petrol' });

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/cars', { headers: { Authorization: TOKEN } });
      const data = await r.json();
      if (Array.isArray(data)) setCars(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/admin/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify(form)
      });
      if (r.ok) {
        showToast('Vehicle added to fleet!', 'success');
        setShowModal(false);
        setForm({ name: '', category: 'Sports', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Petrol' });
        fetchCars();
      } else { showToast('Failed to add vehicle', 'error'); }
    } catch { showToast('Network error', 'error'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      const r = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
      if (r.ok) { showToast(`${name} removed from fleet`, 'success'); fetchCars(); }
      else showToast('Delete failed', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const toggleAvailability = async (car) => {
    try {
      const r = await fetch(`/api/admin/cars/${car.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify({ available: !car.available })
      });
      if (r.ok) { showToast(`${car.name} marked as ${!car.available ? 'Available' : 'Unavailable'}`, 'success'); fetchCars(); }
    } catch {}
  };

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Fleet Management</h1>
          <p>{cars.length} vehicles registered</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchCars}><RefreshCw size={15} /> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={15} /> Add Vehicle</button>
        </div>
      </div>

      <div className="admin-card">
        <div className="table-wrap">
          {loading ? <Spinner /> : cars.length === 0 ? <EmptyState icon="🚗" text="No vehicles in fleet" /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Daily Rate</th>
                  <th>Fuel</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <img
                          src={car.image_url}
                          alt={car.name}
                          style={{ width: '52px', height: '38px', objectFit: 'cover', borderRadius: '6px', background: 'var(--surface-2)' }}
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=200'; }}
                        />
                        <span style={{ fontWeight: 700 }}>{car.name}</span>
                      </div>
                    </td>
                    <td>{car.category}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${car.price}/day</td>
                    <td>{car.fuel_type}</td>
                    <td>
                      <button
                        className={`status-badge ${car.available ? 'status-available' : 'status-unavailable'}`}
                        onClick={() => toggleAvailability(car)}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle"
                      >
                        {car.available ? '✅ Available' : '🔴 Unavailable'}
                      </button>
                    </td>
                    <td>
                      <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(car.id, car.name)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add New Vehicle</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Vehicle Name *</label>
                <input required className="form-input" placeholder="e.g. Lamborghini Urus" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select required className="form-input form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {['Sports','SUV','Electric','Luxury'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Daily Rate ($) *</label>
                  <input required type="number" className="form-input" placeholder="e.g. 450" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Seats</label>
                  <input type="number" className="form-input" placeholder="5" value={form.seats} onChange={e => setForm({...form, seats: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Fuel Type</label>
                  <select className="form-input form-select" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})}>
                    {['Petrol','Electric','Diesel','Hybrid'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Features *</label>
                <input required className="form-input" placeholder="e.g. V8 Biturbo, 641hp, All-Wheel Drive" value={form.features} onChange={e => setForm({...form, features: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Image URL *</label>
                <input required className="form-input" placeholder="https://..." value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} /> Add Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Bookings Management Page ────────────────────── */
function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } });
      const data = await r.json();
      if (Array.isArray(data)) setBookings(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id, status, carId) => {
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify({ status, car_id: carId })
      });
      if (r.ok) { showToast(`Booking ${status}`, 'success'); fetchBookings(); }
      else showToast('Update failed', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const statusClass = (s) => `status-badge status-${s}`;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Bookings</h1>
          <p>{bookings.length} total bookings</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchBookings}><RefreshCw size={15} /> Refresh</button>
      </div>

      <div className="admin-card">
        <div className="table-wrap">
          {loading ? <Spinner /> : bookings.length === 0 ? <EmptyState icon="📋" text="No bookings yet" /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Dates</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-3)', fontSize: '.8rem' }}>#{b.id}</td>
                    <td style={{ fontWeight: 700 }}>{b.car_name}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                      <div style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>{b.customer_phone}</div>
                    </td>
                    <td style={{ fontSize: '.85rem' }}>
                      <div>{b.pickup_date}</div>
                      <div style={{ color: 'var(--text-3)' }}>→ {b.return_date}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${b.total_price}</td>
                    <td><span className={statusClass(b.status)}>{b.status}</span></td>
                    <td>
                      {b.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button className="icon-btn icon-btn-primary" onClick={() => updateStatus(b.id, 'confirmed', b.car_id)} title="Confirm">
                            <CheckCircle size={15} />
                          </button>
                          <button className="icon-btn icon-btn-danger" onClick={() => updateStatus(b.id, 'cancelled', b.car_id)} title="Cancel">
                            <XCircle size={15} />
                          </button>
                        </div>
                      )}
                      {b.status === 'confirmed' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(b.id, 'completed', b.car_id)}>
                          ✅ Complete
                        </button>
                      )}
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

/* ── Settings Page ───────────────────────────────── */
function SettingsPage({ onLogout }) {
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Settings</h1><p>Manage your admin account</p></div>
      </div>
      <div className="admin-card">
        <h3 style={{ marginBottom: '1.5rem' }}>Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div className="form-group">
            <label>Business Name</label>
            <input className="form-input" defaultValue="BENAKA TRAVELS" />
          </div>
          <div className="form-group">
            <label>Contact Email</label>
            <input className="form-input" defaultValue="info@benakatravels.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-input" defaultValue="+91 98765 43210" />
          </div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>Save Changes</button>
        </div>
      </div>
      <div className="admin-card">
        <h3 style={{ marginBottom: '1rem' }}>Security</h3>
        <p style={{ color: 'var(--text-2)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
          Admin password: <code style={{ background: 'var(--surface-2)', padding: '.2rem .5rem', borderRadius: '4px' }}>benakaAdmin2026</code>. Change this directly in your <strong>Worker environment variables</strong> on Cloudflare.
        </p>
        <button className="btn btn-danger btn-sm" onClick={onLogout}><LogOut size={14} /> Logout</button>
      </div>
    </>
  );
}

/* ── Admin Dashboard Root ────────────────────────── */
export default function AdminDashboard() {
  const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem('benaka_auth') === '1');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      sessionStorage.setItem('benaka_auth', '1');
      setIsAuth(true);
      setLoginError('');
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('benaka_auth');
    setIsAuth(false);
    setPassword('');
  };

  if (!isAuth) {
    return (
      <div className="admin-login-page">
        <Toast />
        <div className="admin-login-card">
          <div className="admin-login-logo">🛡️</div>
          <h2>Admin Portal</h2>
          <p>BENAKA TRAVELS Fleet Management System</p>
          {loginError && <div className="login-error">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Master Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}>
              🔐 Login to Dashboard
            </button>
          </form>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-3)', fontSize: '.875rem' }}>← Back to website</Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'fleet', label: 'Fleet', icon: <Car size={18} /> },
    { key: 'bookings', label: 'Bookings', icon: <BookOpen size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="admin-layout">
      <Toast />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <span className="accent">BENAKA</span> Admin
        </div>

        <nav className="admin-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${page === item.key ? 'active' : ''}`}
              onClick={() => { setPage(item.key); setSidebarOpen(false); }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item" style={{ marginBottom: '.5rem' }}>
            ↗ View Website
          </Link>
          <button className="admin-nav-item" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'fleet' && <FleetPage />}
        {page === 'bookings' && <BookingsPage />}
        {page === 'settings' && <SettingsPage onLogout={handleLogout} />}
      </main>

      {/* Mobile toggle */}
      <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );
}
