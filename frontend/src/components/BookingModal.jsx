import { useState } from 'react';
import { Users, Fuel, X, Printer, CheckCircle } from 'lucide-react';
import { showToast } from './Toast';

export default function BookingModal({ car, onClose, onBooked }) {
  const [step, setStep] = useState(1); // 1=form, 2=invoice
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    pickup_date: '', return_date: ''
  });
  const [invoice, setInvoice] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const calcDays = () => {
    if (!form.pickup_date || !form.return_date) return 0;
    const d = Math.ceil((new Date(form.return_date) - new Date(form.pickup_date)) / 86400000);
    return d > 0 ? d : 0;
  };

  const totalPrice = calcDays() * car.price;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (calcDays() < 1) { showToast('Return date must be after pickup date', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car_id: car.id, ...form })
      });
      const data = await res.json();
      if (res.ok) {
        setInvoice(data); setStep(2);
        showToast('🎉 Booking confirmed!', 'success');
        if (onBooked) onBooked();
      } else showToast(data.error || 'Booking failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setLoading(false);
  };

  const printInvoice = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice – ${invoice.ref}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',sans-serif; padding:48px; color:#111; background:#fff; }
        .header { text-align:center; border-bottom:3px solid #c9952b; padding-bottom:24px; margin-bottom:32px; }
        .logo  { font-size:26px; font-weight:900; color:#c9952b; letter-spacing:1px; }
        .sub   { color:#888; font-size:12px; margin-top:4px; }
        .ref   { display:inline-block; background:#fef3c7; color:#92400e; padding:8px 20px; border-radius:99px; font-size:13px; font-weight:700; margin:16px 0; border:1px solid #fcd34d; }
        .status{ display:inline-block; background:#fef9c3; color:#713f12; padding:4px 14px; border-radius:99px; font-size:11px; font-weight:700; }
        .grid  { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin:28px 0; }
        .section h4 { font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#888; margin-bottom:10px; }
        .section p  { font-size:14px; margin:4px 0; }
        .table { width:100%; border-collapse:collapse; margin:24px 0; }
        .table th { background:#f5f5f5; padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; color:#666; }
        .table td { padding:12px 14px; border-bottom:1px solid #eee; font-size:14px; }
        .total { background:#fffbeb; border:1px solid #fcd34d; border-radius:10px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; margin-top:24px; }
        .total-label { color:#666; font-size:14px; }
        .total-amount { font-size:32px; font-weight:900; color:#c9952b; }
        .footer { text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid #eee; font-size:12px; color:#999; }
        @media print { body { padding:24px; } }
      </style></head><body>
      <div class="header">
        <div class="logo">⚡ BENAKA TOURS AND TRAVELS</div>
        <div class="sub">Premium Car Rental Services · Panchaxari Nagar, Gadag</div>
      </div>
      <div style="text-align:center">
        <div class="ref">Booking Ref: ${invoice.ref}</div><br/>
        <div class="status">⏳ Pending Confirmation</div>
      </div>
      <div class="grid">
        <div class="section"><h4>Customer</h4><p><strong>${invoice.customer_name}</strong></p><p>📞 ${invoice.customer_phone}</p><p>📧 ${invoice.customer_email || '—'}</p></div>
        <div class="section"><h4>Vehicle</h4><p><strong>${invoice.car}</strong></p><p>🏷️ ${invoice.category}</p></div>
      </div>
      <table class="table">
        <thead><tr><th>Description</th><th>Rate</th><th>Days</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>${invoice.car} Rental</td><td>$${invoice.daily_rate}/day</td><td>${invoice.days}</td><td>$${invoice.total_price}</td></tr>
          <tr><td>Insurance & Support</td><td colspan="2">Included</td><td>—</td></tr>
        </tbody>
      </table>
      <div class="total"><div class="total-label">Pickup: ${invoice.pickup_date} &rarr; Return: ${invoice.return_date}</div><div class="total-amount">$${invoice.total_price}</div></div>
      <div class="footer"><p>Thank you for choosing BENAKA TOURS AND TRAVELS!</p><p>📞 +91 81051 97768 · 📧 benakatravelsbusiness@gmail.com</p><p style="margin-top:8px">Our team will contact you within 30 minutes to confirm.</p></div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {step === 1 ? (
          <>
            <div className="modal-header">
              <div>
                <h3>Reserve {car.name}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: '.88rem', marginTop: '.2rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 800 }}>${car.price}</span>/day · {car.category}
                </p>
              </div>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', padding: '.85rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '.8rem', color: 'var(--text-2)', flexWrap: 'wrap' }}>
              <span><Users size={13} style={{ display: 'inline', marginRight: '4px' }} />{car.seats} Seats</span>
              <span><Fuel size={13} style={{ display: 'inline', marginRight: '4px' }} />{car.fuel_type}</span>
              <span>🏷️ {car.category}</span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="form-input" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input className="form-input" required value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="+91 81051 97768" />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input className="form-input" type="email" required value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} placeholder="you@example.com" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Date *</label>
                  <input className="form-input" type="date" required min={new Date().toISOString().split('T')[0]} value={form.pickup_date} onChange={e => setForm({ ...form, pickup_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Return Date *</label>
                  <input className="form-input" type="date" required min={form.pickup_date || new Date().toISOString().split('T')[0]} value={form.return_date} onChange={e => setForm({ ...form, return_date: e.target.value })} />
                </div>
              </div>

              {calcDays() > 0 && (
                <div className="booking-detail-card">
                  <div className="booking-detail-row"><span>Duration</span><span>{calcDays()} day{calcDays() > 1 ? 's' : ''}</span></div>
                  <div className="booking-detail-row"><span>Daily Rate</span><span>${car.price}/day</span></div>
                  <div className="booking-detail-row">
                    <span style={{ fontWeight: 700 }}>Total Amount</span>
                    <span style={{ color: 'var(--gold-light)', fontSize: '1.1rem', fontWeight: 900 }}>${totalPrice}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.25rem' }} disabled={loading}>
                {loading ? 'Processing...' : `Confirm Reservation — $${totalPrice || '?'}`}
              </button>
            </form>
          </>
        ) : (
          <div className="booking-success">
            <div className="check-icon">🎉</div>
            <h3>Booking Placed!</h3>
            <p style={{ color: 'var(--text-2)', marginBottom: '.25rem' }}>
              Reference: <strong style={{ color: 'var(--gold)', fontFamily: 'monospace', letterSpacing: '2px' }}>{invoice.ref}</strong>
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: '.82rem', marginBottom: '1.5rem' }}>
              Save this code — you'll need it to track your booking
            </p>

            <div className="booking-detail-card" style={{ textAlign: 'left' }}>
              {[
                ['Vehicle', invoice.car],
                ['Pickup', invoice.pickup_date],
                ['Return', invoice.return_date],
                ['Duration', `${invoice.days} days`],
                ['Rate', `$${invoice.daily_rate}/day`],
              ].map(([k, v]) => (
                <div key={k} className="booking-detail-row"><span>{k}</span><span>{v}</span></div>
              ))}
              <div className="booking-detail-row">
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ color: 'var(--gold-light)', fontSize: '1.15rem', fontWeight: 900 }}>${invoice.total_price}</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-3)', fontSize: '.8rem', margin: '.75rem 0 1.5rem' }}>
              Our team will call <strong style={{ color: 'var(--text-2)' }}>{invoice.customer_phone}</strong> within 30 minutes to confirm pickup details.
            </p>

            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={printInvoice} style={{ flex: 1, justifyContent: 'center' }}>
                <Printer size={15} /> Print
              </button>
              <button className="btn btn-primary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
                <CheckCircle size={15} /> Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
