import { useState, useEffect } from 'react';
import { Users, Fuel, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';
import Toast from '../components/Toast';

const CATEGORIES = ['All', 'Sports', 'SUV', 'Electric', 'Luxury'];

export default function ClientHome() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

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
    if (activeCategory === 'All') {
      setFilteredCars(cars);
    } else {
      setFilteredCars(cars.filter(c => c.category === activeCategory));
    }
  }, [activeCategory, cars]);

  const handleImgError = (id) => {
    setImgErrors(p => ({ ...p, [id]: true }));
  };

  return (
    <div className="app-container">
      <Toast />
      <Navbar />

      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1400&auto=format&fit=crop"
            alt="Luxury car"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=1400'; }}
          />
        </div>

        <div className="hero-content">
          <div className="hero-badge">⚡ Premium Fleet · Immediate Availability</div>
          <h1 className="hero-title">
            Drive the&nbsp;
            <span className="highlight">Extraordinary</span>
          </h1>
          <p className="hero-sub">
            BENAKA TRAVELS brings you India's most exclusive exotic car rental experience.
            From Lamborghinis to Rolls-Royces — unforgettable journeys start here.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => { const el = document.getElementById('fleet'); el && el.scrollIntoView({ behavior: 'smooth' }); }}
            >
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

      {/* ── Quick Booking Bar ─────────────────────── */}
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
          <select className="form-input form-select">
            <option>All Types</option>
            {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { const el = document.getElementById('fleet'); el && el.scrollIntoView({ behavior: 'smooth' }); }}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Search →
        </button>
      </div>

      {/* ── Fleet Section ─────────────────────────── */}
      <section id="fleet" className="cars-section">
        <div className="section-header">
          <div>
            <h2>Our Premium Fleet</h2>
            <p>Choose from {cars.length} meticulously maintained luxury vehicles</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚗</div>
            Loading fleet...
          </div>
        ) : (
          <div className="cars-grid">
            {filteredCars.map(car => (
              <div key={car.id} className="car-card">
                <div className="car-img-wrap">
                  <span className="car-badge">{car.category}</span>
                  {!car.available && <span className="car-unavailable-badge">Rented</span>}
                  <img
                    src={imgErrors[car.id] ? 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=800' : car.image_url}
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
                      className="btn btn-primary btn-sm"
                      disabled={!car.available}
                      onClick={() => car.available && setSelectedCar(car)}
                      style={{ opacity: car.available ? 1 : 0.5, cursor: car.available ? 'pointer' : 'not-allowed' }}
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

      {/* ── Why Us ───────────────────────────────── */}
      <section id="why-us" className="why-section">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '.5rem' }}>Why Choose BENAKA?</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', maxWidth: '450px' }}>
            We go beyond just renting cars — we craft unforgettable driving experiences.
          </p>
          <div className="why-grid">
            {[
              { icon: '🚀', title: 'Instant Booking', desc: 'Confirm your reservation in under 2 minutes. Fast, simple, no paperwork.' },
              { icon: '🛡️', title: 'Fully Insured', desc: 'All vehicles come with comprehensive insurance. Drive with total peace of mind.' },
              { icon: '🔑', title: 'Doorstep Delivery', desc: 'We deliver the car to your home, hotel, or airport. No pickup hassle.' },
              { icon: '📞', title: '24/7 Support', desc: 'Our team is always on standby to assist you throughout your rental journey.' },
              { icon: '🧹', title: 'Pristine Condition', desc: 'Every car is professionally cleaned and inspected before and after each rental.' },
              { icon: '💳', title: 'Flexible Payment', desc: 'Pay online or in cash. We offer flexible booking and cancellation policies.' },
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

      {/* ── Contact / Footer ──────────────────────── */}
      <footer id="contact" className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><span className="accent">BENAKA</span> TRAVELS</div>
            <p>Premium car rentals in Karnataka. Experience luxury, speed, and comfort like never before.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '1.25rem' }}>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">📱</a>
              <a href="mailto:info@benakatravels.com">📧</a>
              <a href="tel:+919876543210">📞</a>
            </div>
          </div>
          <div>
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#fleet">Our Fleet</a></li>
              <li><a href="#why-us">Why Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="/admin">Admin Portal</a></li>
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
          <p>© 2025 BENAKA TRAVELS. All Rights Reserved. Built with ❤️ for luxury mobility.</p>
        </div>
      </footer>

      {/* Booking Modal */}
      {selectedCar && (
        <BookingModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </div>
  );
}
