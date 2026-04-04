import { useState, useEffect } from 'react';
import { Users, Fuel, Star, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';
import Toast from '../components/Toast';

const CATEGORIES = ['All', 'Sports', 'SUV', 'Electric', 'Luxury'];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=800&auto=format&fit=crop';

export default function ClientHome() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  // Booking tracker
  const [trackRef, setTrackRef] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  useEffect(() => {
    fetch('/api/cars')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) { setCars(data); setFilteredCars(data); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory === 'All') setFilteredCars(cars);
    else setFilteredCars(cars.filter(c => c.category === activeCategory));
  }, [activeCategory, cars]);

  const refreshCars = () => {
    fetch('/api/cars').then(r => r.json()).then(data => {
      if (Array.isArray(data)) { setCars(data); }
    }).catch(() => {});
  };

  const handleImgError = (id) => setImgErrors(p => ({ ...p, [id]: true }));

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackRef.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const r = await fetch(`/api/bookings/track/${trackRef.trim()}`);
      const d = await r.json();
      if (r.ok) setTrackResult(d);
      else setTrackError(d.error || 'Booking not found');
    } catch { setTrackError('Network error'); }
    setTrackLoading(false);
  };

  const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444' };

  return (
    <div>
      <Toast />
      <Navbar />

      {/* ═══ HERO ═══════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1800&auto=format&fit=crop"
            alt="Luxury car"
            onError={(e) => { e.target.src = FALLBACK_IMG; }}
          />
        </div>

        <div className="hero-content">
          <div className="hero-badge">✦ Premium Fleet · Immediate Availability</div>
          <h1 className="hero-title">
            Drive the
            <span className="highlight">Extraordinary</span>
          </h1>
          <p className="hero-sub">
            BENAKA TRAVELS brings you India's most exclusive exotic car rental experience.
            From Lamborghinis to Rolls-Royces — unforgettable journeys start here.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Fleet →
            </button>
            <a href="tel:+919876543210" className="btn btn-outline">📞 Call Us Now</a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat"><strong>22+</strong><span>Premium Cars</span></div>
            <div className="hero-stat"><strong>500+</strong><span>Happy Clients</span></div>
            <div className="hero-stat"><strong>24/7</strong><span>Support</span></div>
            <div className="hero-stat"><strong>5★</strong><span>Rated</span></div>
          </div>
        </div>
      </section>

      {/* ═══ QUICK BOOKING BAR ═════════════════════ */}
      <div className="quick-booking">
        <div className="quick-booking-field">
          <label>📍 Pickup Location</label>
          <select className="form-input form-select">
            <option>Bengaluru</option>
            <option>Mysuru</option>
            <option>Hubballi</option>
            <option>Mangaluru</option>
          </select>
        </div>
        <div className="quick-booking-field">
          <label>📅 Pickup Date</label>
          <input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="quick-booking-field">
          <label>📅 Return Date</label>
          <input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="quick-booking-field">
          <label>🚗 Vehicle Type</label>
          <select className="form-input form-select" onChange={(e) => setActiveCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Types' : c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })} style={{ height: '44px', paddingInline: '2rem' }}>
          Search
        </button>
      </div>

      {/* ═══ FLEET ═════════════════════════════════ */}
      <section id="fleet" className="cars-section">
        <div className="section-header">
          <h2 className="serif">Our Premium Fleet</h2>
          <p>Choose from {cars.length} meticulously maintained luxury vehicles</p>
        </div>

        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`filter-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
              {cat} {cat !== 'All' && `(${cars.filter(c => c.category === cat).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚗</div>
            <p>Loading fleet...</p>
          </div>
        ) : filteredCars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
            <p>No vehicles found in this category.</p>
          </div>
        ) : (
          <div className="cars-grid">
            {filteredCars.map(car => (
              <div key={car.id} className="car-card">
                <div className="car-img-wrap">
                  <span className="car-badge">{car.category}</span>
                  {!car.available && <span className="car-unavailable-badge">Rented</span>}
                  <img
                    src={imgErrors[car.id] ? FALLBACK_IMG : car.image_url}
                    alt={car.name}
                    onError={() => handleImgError(car.id)}
                    loading="lazy"
                  />
                </div>
                <div className="car-info">
                  <h3 className="car-name">{car.name}</h3>
                  <div className="car-specs">
                    <span className="car-spec"><Users size={13} /> {car.seats} Seats</span>
                    <span className="car-spec"><Fuel size={13} /> {car.fuel_type}</span>
                    <span className="car-spec"><Star size={13} /> Premium</span>
                  </div>
                  <p className="car-features-text">{car.features}</p>
                  <div className="car-footer">
                    <div className="car-price">
                      <strong>${car.price}</strong>
                      <span>/day</span>
                    </div>
                    <button
                      className={`btn ${car.available ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                      disabled={!car.available}
                      onClick={() => car.available && setSelectedCar(car)}
                    >
                      {car.available ? 'Reserve' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ WHY US ════════════════════════════════ */}
      <section id="why-us" className="why-section">
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 className="serif" style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '.5rem' }}>Why Choose BENAKA?</h2>
          <p style={{ color: 'var(--text-3)', maxWidth: '500px', fontSize: '.95rem' }}>
            We go beyond just renting cars — we craft unforgettable driving experiences.
          </p>
          <div className="why-grid">
            {[
              { icon: '⚡', title: 'Instant Booking', desc: 'Confirm your reservation in under 2 minutes. Fast, simple, zero paperwork needed.' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'Every vehicle comes with comprehensive insurance coverage. Drive with total peace of mind.' },
              { icon: '🔑', title: 'Doorstep Delivery', desc: 'We deliver the car to your home, hotel, or airport — no pickup hassle whatsoever.' },
              { icon: '📞', title: '24/7 Support', desc: 'Our team is always on standby to assist you every step of your rental journey.' },
              { icon: '✨', title: 'Pristine Condition', desc: 'Every car is professionally detailed and inspected before and after each rental.' },
              { icon: '💳', title: 'Flexible Payment', desc: 'Pay online, UPI, or cash. We offer flexible booking and cancellation policies.' },
            ].map((item, i) => (
              <div key={i} className="why-card">
                <div className="why-icon">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRACK BOOKING ════════════════════════ */}
      <section id="track" className="tracker-section">
        <div className="tracker-card">
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📋</div>
          <h3 className="serif">Track Your Booking</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '.9rem', marginBottom: '1.5rem' }}>Enter your booking reference to check status</p>

          <form onSubmit={handleTrack} style={{ display: 'flex', gap: '.5rem' }}>
            <input
              className="form-input"
              placeholder="e.g. BT4K2JFA"
              value={trackRef}
              onChange={e => setTrackRef(e.target.value.toUpperCase())}
              style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: 700, flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={trackLoading}>
              {trackLoading ? '...' : <Search size={16} />}
            </button>
          </form>

          {trackError && <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '.88rem' }}>❌ {trackError}</p>}

          {trackResult && (
            <div className="tracker-result">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold)' }}>{trackResult.ref}</span>
                <span style={{
                  padding: '.25rem .75rem', borderRadius: '99px', fontSize: '.75rem', fontWeight: 700,
                  background: `${statusColors[trackResult.status]}20`, color: statusColors[trackResult.status],
                  border: `1px solid ${statusColors[trackResult.status]}40`
                }}>{trackResult.status}</span>
              </div>
              <div className="booking-detail-card">
                <div className="booking-detail-row"><span>Vehicle</span><span style={{ fontWeight: 600 }}>{trackResult.car_name}</span></div>
                <div className="booking-detail-row"><span>Customer</span><span>{trackResult.customer_name}</span></div>
                <div className="booking-detail-row"><span>Pickup</span><span>{trackResult.pickup_date}</span></div>
                <div className="booking-detail-row"><span>Return</span><span>{trackResult.return_date}</span></div>
                <div className="booking-detail-row"><span>Duration</span><span>{trackResult.total_days} days</span></div>
                <div className="booking-detail-row"><span style={{ fontWeight: 700 }}>Total</span><span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.05rem' }}>${trackResult.total_price}</span></div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════ */}
      <footer id="contact" className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><span className="accent">BENAKA</span> TRAVELS</div>
            <p>Premium car rentals in Karnataka. Experience luxury, speed, and comfort like never before.</p>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', fontSize: '1.1rem' }}>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" title="WhatsApp" style={{ transition: 'transform .2s' }}>📱</a>
              <a href="mailto:info@benakatravels.com" title="Email">📧</a>
              <a href="tel:+919876543210" title="Call">📞</a>
            </div>
          </div>
          <div>
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#fleet">Our Fleet</a></li>
              <li><a href="#why-us">Why Choose Us</a></li>
              <li><a href="#track">Track Booking</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <ul>
              <li><a href="tel:+919876543210">+91 98765 43210</a></li>
              <li><a href="mailto:info@benakatravels.com">info@benakatravels.com</a></li>
              <li><a>Bengaluru, Karnataka</a></li>
              <li><a>Mon–Sun: 8AM – 10PM</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 BENAKA TRAVELS. All Rights Reserved. <a href="/admin" style={{ color: 'inherit', opacity: 0.15, fontSize: '.7rem', marginLeft: '.25rem' }} title="">⚙</a></p>
        </div>
      </footer>

      {/* ═══ BOOKING MODAL ════════════════════════ */}
      {selectedCar && (
        <BookingModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onBooked={refreshCars}
        />
      )}
    </div>
  );
}
