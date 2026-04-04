import { useState } from 'react';
import { Users, Fuel, X, Printer } from 'lucide-react';
import { showToast } from './Toast';

export default function BookingModal({ car, onClose, onBooked }) {
  const [step, setStep] = useState(1); // 1=form, 2=invoice
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', pickup_date: '', return_date: '' });
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
        setInvoice(data);
        setStep(2);
        showToast('Booking confirmed!', 'success');
        if (onBooked) onBooked();
      } else {
        showToast(data.error || 'Booking failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setLoading(false);
  };

  const printInvoice = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>Booking Invoice - ${invoice.ref}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 28px; color: #0ea5e9; margin-bottom: 4px; }
        .header p { color: #666; font-size: 13px; }
        .ref-badge { display: inline-block; background: #f0f9ff; color: #0284c7; padding: 8px 20px; border-radius: 99px; font-size: 14px; font-weight: 700; margin: 15px 0; border: 1px solid #bae6fd; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 25px 0; }
        .section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; }
        .section p { font-size: 14px; margin: 5px 0; }
        .section p strong { color: #333; }
        .total-row { display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; padding: 18px 24px; border-radius: 10px; margin-top: 25px; }
        .total-row .label { font-size: 14px; color: #666; }
        .total-row .amount { font-size: 30px; font-weight: 900; color: #0ea5e9; }
        .breakdown { margin-top: 15px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #555; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; }
        .status { display: inline-block; background: #fef3c7; color: #92400e; padding: 3px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>
        <div class="header">
          <h1>⚡ BENAKA TRAVELS</h1>
          <p>Premium Car Rental Services · Bengaluru, Karnataka</p>
        </div>
        <div style="text-align:center">
          <div class="ref-badge">Booking Ref: ${invoice.ref}</div>
          <div style="margin-top:8px"><span class="status">⏳ Pending Confirmation</span></div>
        </div>
        <div class="grid">
          <div class="section">
            <h3>Customer Details</h3>
            <p><strong>${invoice.customer_name}</strong></p>
            <p>📞 ${invoice.customer_phone}</p>
            <p>📧 ${invoice.customer_email}</p>
          </div>
          <div class="section">
            <h3>Vehicle</h3>
            <p><strong>${invoice.car}</strong></p>
            <p>🏷️ ${invoice.category}</p>
          </div>
        </div>
        <div class="grid">
          <div class="section">
            <h3>Pickup Date</h3>
            <p><strong>${invoice.pickup_date}</strong></p>
          </div>
          <div class="section">
            <h3>Return Date</h3>
            <p><strong>${invoice.return_date}</strong></p>
          </div>
        </div>
        <div class="breakdown">
          <div class="breakdown-row"><span>Daily Rate</span><span>$${invoice.daily_rate}/day</span></div>
          <div class="breakdown-row"><span>Duration</span><span>${invoice.days} day${invoice.days > 1 ? 's' : ''}</span></div>
          <div class="breakdown-row"><span>Subtotal</span><span>$${invoice.total_price}</span></div>
          <div class="breakdown-row"><span>Tax</span><span>Included</span></div>
        </div>
        <div class="total-row">
          <div class="label">Total Amount Due</div>
          <div class="amount">$${invoice.total_price}</div>
        </div>
        <div class="footer">
          <p>Thank you for choosing BENAKA TRAVELS!</p>
          <p>📞 +91 98765 43210 · 📧 info@benakatravels.com</p>
          <p style="margin-top:8px">Our team will contact you within 30 minutes to confirm your booking.</p>
        </div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {step === 1 ? (
          <>
            <div className="modal-header">
              <div>
                <h3>Reserve {car.name}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: '.9rem', marginTop: '.2rem' }}>
                  <strong style={{ color: 'var(--primary)' }}>${car.price}</strong>/day · {car.category}
                </p>
              </div>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '.85rem', color: 'var(--text-2)' }}>
              <span><Users size={14} style={{ display: 'inline', marginRight: '4px' }} />{car.seats} Seats</span>
              <span><Fuel size={14} style={{ display: 'inline', marginRight: '4px' }} />{car.fuel_type}</span>
              <span>🏷️ {car.category}</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="form-input" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input className="form-input" required value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input className="form-input" type="email" required value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} placeholder="you@example.com" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Date *</label>
                  <input className="form-input" type="date" required min={today} value={form.pickup_date} onChange={e => setForm({ ...form, pickup_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Return Date *</label>
                  <input className="form-input" type="date" required min={form.pickup_date || today} value={form.return_date} onChange={e => setForm({ ...form, return_date: e.target.value })} />
                </div>
              </div>

              {calcDays() > 0 && (
                <div className="booking-detail-card">
                  <div className="booking-detail-row"><span>Duration</span><span>{calcDays()} day{calcDays() > 1 ? 's' : ''}</span></div>
                  <div className="booking-detail-row"><span>Daily Rate</span><span>${car.price}/day</span></div>
                  <div className="booking-detail-row"><span style={{ fontWeight: 700 }}>Total Price</span><span style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800 }}>${totalPrice}</span></div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }} disabled={loading}>
                {loading ? 'Processing...' : `Confirm Booking — $${totalPrice || '?'}`}
              </button>
            </form>
          </>
        ) : (
          <div className="booking-success">
            <div className="check-icon">🎉</div>
            <h3>Booking Placed!</h3>
            <p style={{ color: 'var(--text-2)', marginBottom: '.25rem' }}>Reference: <strong style={{ color: 'var(--primary)' }}>{invoice.ref}</strong></p>
            <p style={{ color: 'var(--text-3)', fontSize: '.82rem' }}>Save this reference to track your booking</p>

            <div className="booking-detail-card">
              <div className="booking-detail-row"><span>Vehicle</span><span>{invoice.car}</span></div>
              <div className="booking-detail-row"><span>Pickup</span><span>{invoice.pickup_date}</span></div>
              <div className="booking-detail-row"><span>Return</span><span>{invoice.return_date}</span></div>
              <div className="booking-detail-row"><span>Duration</span><span>{invoice.days} days</span></div>
              <div className="booking-detail-row"><span>Rate</span><span>${invoice.daily_rate}/day</span></div>
              <div className="booking-detail-row"><span style={{ fontWeight: 700 }}>Total</span><span style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800 }}>${invoice.total_price}</span></div>
            </div>

            <p style={{ color: 'var(--text-3)', fontSize: '.82rem', marginBottom: '1.25rem' }}>
              Our team will contact you on <strong>{invoice.customer_phone}</strong> within 30 minutes to confirm pickup details.
            </p>

            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-outline" onClick={printInvoice} style={{ flex: 1, justifyContent: 'center' }}>
                <Printer size={16} /> Print Invoice
              </button>
              <button className="btn btn-primary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
