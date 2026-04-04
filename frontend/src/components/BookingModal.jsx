import { useState } from 'react';
import { Users, Fuel, Calendar, X } from 'lucide-react';
import { showToast } from './Toast';

export default function BookingModal({ car, onClose }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', pickup_date: '', return_date: '' });
  const [result, setResult] = useState(null);

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
        setResult(data);
        setStep(2);
        showToast('Booking confirmed! Check your details.', 'success');
      } else {
        showToast(data.error || 'Booking failed. Try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
    setLoading(false);
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
                  <strong style={{ color: 'var(--primary)'}}>${car.price}</strong>/day
                </p>
              </div>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            {/* Car quick info */}
            <div style={{ display: 'flex', gap: '1.25rem', padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '.85rem', color: 'var(--text-2)' }}>
              <span><Users size={14} style={{ display: 'inline', marginRight: '4px' }} />{car.seats} Seats</span>
              <span><Fuel size={14} style={{ display: 'inline', marginRight: '4px' }} />{car.fuel_type}</span>
              <span>🏷️ {car.category}</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="form-input" required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input className="form-input" required value={form.customer_phone} onChange={e => setForm({...form, customer_phone: e.target.value})} placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input className="form-input" type="email" required value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} placeholder="you@example.com" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Date *</label>
                  <input className="form-input" type="date" required min={today} value={form.pickup_date} onChange={e => setForm({...form, pickup_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Return Date *</label>
                  <input className="form-input" type="date" required min={form.pickup_date || today} value={form.return_date} onChange={e => setForm({...form, return_date: e.target.value})} />
                </div>
              </div>

              {calcDays() > 0 && (
                <div className="booking-detail-card">
                  <div className="booking-detail-row"><span>Duration</span><span>{calcDays()} day{calcDays() > 1 ? 's' : ''}</span></div>
                  <div className="booking-detail-row"><span>Daily Rate</span><span>${car.price}/day</span></div>
                  <div className="booking-detail-row"><span>Total Price</span><span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>${totalPrice}</span></div>
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
            <h3>Booking Confirmed!</h3>
            <p>Your reservation for <strong>{result?.car}</strong> has been received.</p>
            <div className="booking-detail-card">
              <div className="booking-detail-row"><span>Vehicle</span><span>{result?.car}</span></div>
              <div className="booking-detail-row"><span>Pickup</span><span>{result?.pickup_date}</span></div>
              <div className="booking-detail-row"><span>Return</span><span>{result?.return_date}</span></div>
              <div className="booking-detail-row"><span>Duration</span><span>{result?.days} days</span></div>
              <div className="booking-detail-row"><span>Total Amount</span><span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>${result?.total_price}</span></div>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: '.875rem', marginBottom: '1.5rem' }}>Our team will contact you shortly to confirm your pickup details.</p>
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
