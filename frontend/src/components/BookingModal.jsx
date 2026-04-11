import { useState } from 'react';
import { Users, Fuel, X, Printer, CheckCircle, Info } from 'lucide-react';
import { showToast } from './Toast';

const PRICING_NOTES = {
  "Maruti Swift Dzire": "Daily (300km): ₹3,300 (AC) / ₹3,000 (Non-AC) | Extra KM: ₹11 (AC) / ₹10 (Non-AC) | Short Trip (<150km): ₹2,200 | Driver Bata: ₹200/day",
  "Maruti Ertiga": "Daily (300km): ₹4,200 | Short Trip (<150km): ₹3,500 | Driver Bata: ₹300/day",
  "Mahindra Bolero": "Daily (300km): ₹4,200 | Short Trip (<150km): ₹3,500 | Driver Bata: ₹300/day",
  "Toyota Innova Crysta": "Daily (300km): ₹5,400 (AC) / ₹5,100 (Non-AC) | Short Trip (<150km): ₹3,800 | Driver Bata: ₹300/day",
  "Mahindra Scorpio": "Daily (300km): ₹4,800 | Driver Bata: ₹300/day",
  "Mahindra Thar": "Daily (300km): ₹5,400 | Short Trip (<150km): ₹4,500 | Driver Bata: ₹300/day",
  "Tempo Traveller": "Daily (300km): ₹6,600 (AC) / ₹5,400 (Non-AC) | Short Trip (<150km): ₹4,500 | Driver Bata: ₹300/day & ₹300/night",
  "Maruti Grand Vitara": "Flat Rate: ₹13 per km",
  "Maruti Brezza": "Flat Rate: ₹13 per km",
  "25-Seater Bus": "Flat Rate: ₹28 per km",
  "Force Toofan Cruiser": "Rates pending manual update."
};

export default function BookingModal({ car, onClose, onBooked }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', pickup_date: '', return_date: ''
  });
  const [invoice, setInvoice] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const calcDays = () => {
    if (!form.pickup_date || !form.return_date) return 0;
    const d = Math.ceil((new Date(form.return_date) - new Date(form.pickup_date)) / 86400000);
    return Math.max(1, d); // Minimum 1 day even if same day
  };

  const pricingNote = PRICING_NOTES[car.name] || "Request a custom quote based on your journey.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        car_id: car.id,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: 'guest@benakatravels.in', // Backend requires it, so we bypass it here
        pickup_date: form.pickup_date,
        return_date: form.return_date || form.pickup_date
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setInvoice(data); setStep(2);
        showToast('🎉 Booking placed successfully!', 'success');
        if (onBooked) onBooked();
      } else showToast(data.error || 'Booking failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '450px' }}>
        {step === 1 ? (
          <>
            <div className="modal-header">
              <div>
                <h3>Book {car.name}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: '.88rem', marginTop: '.2rem' }}>
                  {car.category}
                </p>
              </div>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(201, 149, 43, 0.1)', border: '1px solid var(--gold)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--gold)', fontWeight: '700', marginBottom: '.5rem', fontSize: '.9rem' }}>
                <Info size={16} /> Estimated Pricing
              </div>
              <div style={{ fontSize: '.85rem', color: 'var(--text-1)', lineHeight: '1.6' }}>
                {pricingNote.split(' | ').map((part, i) => (
                  <div key={i} style={{ marginBottom: '2px' }}>• {part}</div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input className="form-input" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
              </div>
              
              <div className="form-group">
                <label>Mobile Number *</label>
                <input className="form-input" required value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} placeholder="+91 63624 16120" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pickup Date *</label>
                  <input className="form-input" type="date" required min={today} value={form.pickup_date} onChange={e => setForm({ ...form, pickup_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Return Date (Optional)</label>
                  <input className="form-input" type="date" min={form.pickup_date || today} value={form.return_date} onChange={e => setForm({ ...form, return_date: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }} disabled={loading}>
                {loading ? 'Processing...' : 'Confirm Booking Request'}
              </button>
            </form>
          </>
        ) : (
          <div className="booking-success" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="check-icon" style={{ fontSize: '3rem', margin: '0 auto 1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>Request Received!</h3>
            <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Your booking request for <strong>{car.name}</strong> has been sent. Our team will contact you shortly on <strong>{form.customer_phone}</strong> to confirm the exact quotation and details.
            </p>

            <div style={{ background: 'var(--bg-2)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', textAlign: 'left', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '.8rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '.5rem' }}>Booking Details</div>
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>{car.name}</div>
              <div style={{ fontSize: '.9rem', color: 'var(--text-2)' }}>From: {form.pickup_date}</div>
              {form.return_date && form.return_date !== form.pickup_date && (
                <div style={{ fontSize: '.9rem', color: 'var(--text-2)' }}>To: {form.return_date}</div>
              )}
            </div>

            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
              <CheckCircle size={18} style={{ marginRight: '6px' }} /> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
