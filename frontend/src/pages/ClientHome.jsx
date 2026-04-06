import { useState, useEffect, useCallback } from 'react';
import { Users, Fuel, Star, Search, MapPin, Calendar, Car, Shield, Zap, Phone, ChevronRight, Navigation } from 'lucide-react';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';
import Toast from '../components/Toast';

const CATEGORIES = ['All', 'Sedan', 'SUV', 'MUV', 'Minibus', 'Bus'];

const TESTIMONIALS = [
  { name: 'Suresh Kulkarni', city: 'Gadag', stars: 5, text: 'Highly reliable service for outstation trips. We booked a Toyota Innova for our family visit to Hubballi. The driver knew the routes perfectly and was very polite. Best travel agency in Gadag!' },
  { name: 'Deepa G.', city: 'Gadag', stars: 5, text: 'Outstanding support and well-maintained cars. We rented a Maruti Ertiga for a weekend wedding. The inquiry process was smooth on WhatsApp and the door-step pickup saved us so much time.' },
  { name: 'Vijay Hiremath', city: 'Gadag', stars: 5, text: 'Our go-to choice for corporate tours. The 13-seater Tempo Traveller was in top condition and very comfortable for a long journey. Special thanks to the driver for his patience.' },
];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=800&auto=format&fit=crop';

export default function ClientHome() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  // Navbar scroll effect
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchCars = useCallback(() => {
    fetch('/api/cars')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) { setCars(data); setFilteredCars(data); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  useEffect(() => {
    if (activeCategory === 'All') setFilteredCars(cars);
    else setFilteredCars(cars.filter(c => c.category === activeCategory));
  }, [activeCategory, cars]);

  const handleImgError = (id) => setImgErrors(p => ({ ...p, [id]: true }));


  return (
    <div>
      <Toast />
      {/* Pass scrolled for navbar styling */}
      <Navbar scrolled={scrolled} />

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-bg">
          <img
            src="/heropage.png"
            alt="Benaka Travels Fleet"
            onError={(e) => { e.target.src = FALLBACK_IMG; }}
          />
        </div>
        <div className="hero-content">
          <div className="hero-badge">✦ Gadag's Premier Rental Fleet</div>
          <h1 className="hero-title">
            Benaka Tours <span className="highlight">& Travels</span>
          </h1>
          <p className="hero-sub">
            The most trusted transportation partner in Panchaxari Nagar, Gadag. 
            Providing premium Sedans, SUVs, and Buses for all your travel needs since 2019.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary"
              onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore Fleet <ChevronRight size={18} />
            </button>
            <a href="tel:+918105197768" className="btn btn-outline">
              <Phone size={16} /> Call Now
            </a>
          </div>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>11+</strong>
              <span>Premium Fleet</span>
            </div>
            <div className="hero-stat">
              <strong>500+</strong>
              <span>Happy Clients</span>
            </div>
            <div className="hero-stat">
              <strong>21+</strong>
              <span>Reviews</span>
            </div>
            <div className="hero-stat">
              <strong>4.9★</strong>
              <span>Rating</span>
            </div>
          </div>

          {/* Sparkle Decoration from Mockup */}
          <div style={{ position: 'absolute', right: '5%', bottom: '5%', opacity: 0.6, pointerEvents: 'none' }}>
            <Star color="var(--gold-light)" size={32} fill="var(--gold-light)" />
          </div>
        </div>
      </section>

      {/* Quick Booking bar removed for inquiry-only model */}

      {/* ═══ FLEET SECTION ══════════════════════════════════ */}
      <section id="fleet" className="cars-section" style={{ paddingTop: '2rem' }}>
        <div className="section-header">
          <div className="section-tag">Our Fleet</div>
          <h2 className="serif">Curated Premium Vehicles</h2>
          <p>Choose from {cars.length} meticulously maintained exotic vehicles — updated live</p>
        </div>

        <div className="filter-bar">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}>
              {cat} {cat !== 'All' && `(${cars.filter(c => c.category === cat).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🚗</div>
            <p>Loading premium fleet...</p>
            <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
          </div>
        ) : filteredCars.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p>No vehicles in this category.</p>
            <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => setActiveCategory('All')}>View All</button>
          </div>
        ) : (
          <div className="cars-grid">
            {filteredCars.map(car => (
              <div key={car.id} className="car-card">
                <div className="car-img-wrap">
                  <span className="car-badge">{car.category}</span>
                  {!car.available && <span className="car-unavailable-badge">Booked</span>}
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
                  <div className="car-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '.9rem', display: 'flex', gap: '.5rem' }}>
                    <a href="https://wa.me/918105197768" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      <Phone size={14} style={{ marginRight: '4px' }} /> WhatsApp
                    </a>
                    <a href="tel:+918105197768" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      <Phone size={14} style={{ marginRight: '4px' }} /> Call Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ WHY US ═════════════════════════════════════════ */}
      <section id="why-us" className="why-section">
        <div className="why-section-inner">
          <div className="section-tag">Why BENAKA</div>
          <h2 className="serif" style={{ fontSize: 'clamp(1.8rem,3vw,2.8rem)', marginBottom: '.5rem' }}>
            The Finest Rental Experience
          </h2>
          <p style={{ color: 'var(--text-2)', maxWidth: '500px', fontSize: '.95rem' }}>
            Benaka Tours and Travels in Panchaxari Nagar, Gadag is a premier transportation company committed to excellence and passion for customer service. With a 4.9 rating based on 21 reviews, we deliver exceptional experiences that exceed expectations.
          </p>
          <div className="why-grid">
            {[
              { icon: '⚡', title: 'Quick Inquiry', desc: 'Get pricing and availability instantly via WhatsApp or Call. Fast & seamless.' },
              { icon: '🚐', title: 'Diverse Fleet', desc: 'Our fleet includes perfectly maintained Sedans, SUVs, Tempo Travellers, and large Buses for all your needs.' },
              { icon: '🚪', title: 'Pick-up & Drop', desc: 'Professional chauffeur-driven service from your doorstep. No self-drive hassles.' },
              { icon: '📞', title: 'Our Commitment', desc: 'Space, comfort, and safety. A dedicated team ready to select the right vehicle for your memorable journey.' },
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

      {/* ═══ TESTIMONIALS ═══════════════════════════════════ */}
      <section className="testimonials-section">
        <div className="section-header">
          <div className="section-tag">Client Stories</div>
          <h2 className="serif">Loved by Thousands</h2>
          <p>Real experiences from real BENAKA TRAVELS customers</p>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars">{'★'.repeat(t.stars)}</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-meta">{t.city}, Karnataka</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FAQ SECTION ══════════════════════════════════════ */}
      <section id="faq" className="faq-section" style={{ padding: '5rem 2.5rem', background: 'var(--bg-2)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="section-header" style={{ textAlign: 'left', marginBottom: '3rem' }}>
            <div className="section-tag">FAQ</div>
            <h2 className="serif">Frequently Asked Questions</h2>
          </div>

          <div className="faq-list">
            {[
              { q: 'Can I rent a car for a few weeks?', a: 'Yes, you can! We offer flexible long-term rental plans at competitive rates. Please contact us for a customized monthly quote.' },
              { q: 'Do you provide a driver with the car?', a: 'Yes, at Benaka Travels, all our rentals are chauffeur-driven. Our professional and experienced drivers ensure a safe and stress-free journey.' },
              { q: 'Will I be required to pay for any accidental damage?', a: 'No, since all our cars come with professional drivers, you are not responsible for any accidental or mechanical damage to the vehicle during your trip.' },
              { q: 'Where is the office of Benaka Tours and Travels in Panchaxari Nagar?', a: 'Our office is located at Panchaxari Nagar 5th Cross, Gadag. Feel free to visit us!' },
              { q: 'What are the operating hours in Gadag?', a: 'We are available 24 Hours a day, 7 days a week (Monday to Sunday) for all your booking needs.' },
              { q: 'Do you have different types of cars available?', a: 'Yes, we have a diverse fleet including Sedans, MUVs, SUVs, and luxury Buses to suit every travel requirement.' },
              { q: 'Can I hire a car for a weekend trip?', a: 'Absolutely! We specialize in outstation trips and weekend getaways. We recommend booking in advance to secure your preferred vehicle.' }
            ].map((item, i) => (
              <div key={i} className="faq-item" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--gold)', marginBottom: '.75rem', fontWeight: 600 }}>{i + 1}. {item.q}</h4>
                <p style={{ color: 'var(--text-2)', fontSize: '.95rem', lineHeight: 1.6 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MAP SECTION ═════════════════════════════════════ */}
      <section id="location" className="map-section" style={{ padding: '0', background: 'var(--bg)' }}>
        <div style={{ width: '100%', height: '450px', position: 'relative' }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3846.053594895669!2d75.6409631!3d15.427651!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTXCsDI1JzM5LjUiTiA3N8KwMzgnMzYuNyJF!5e0!3m2!1sen!2sin!4v1775486111304!5m2!1sen!2sin" 
            width="100%" 
            height="100%" 
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade">
          </iframe>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '20px', 
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(24, 29, 41, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            borderRadius: 'var(--radius)',
            maxWidth: '320px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h4 className="serif" style={{ color: 'var(--gold)', marginBottom: '1rem', fontSize: '1.1rem' }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a href="tel:+918105197768" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#fff' }}>
                <span style={{ color: 'var(--gold)' }}>📞</span> +91 81051 97768
              </a>
              <a href="mailto:benakatravelsbusiness@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#fff' }}>
                <span style={{ color: 'var(--gold)' }}>✉️</span> benakatravelsbusiness@gmail.com
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-3)' }}>
                <span style={{ color: 'var(--gold)' }}>📍</span> Panchaxari Nagar, Gadag
              </div>
            </div>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=15.427651,75.6409631" 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-primary" 
              style={{ padding: '.5rem 1rem', fontSize: '.8rem', marginTop: '1.25rem', width: '100%', justifyContent: 'center' }}
            >
              Get Directions <Navigation size={14} style={{ marginLeft: '6px' }} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════ */}
      <footer id="contact" className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><span className="accent">BENAKA TOURS</span> AND TRAVELS</div>
            <p className="footer-desc">
              Karnataka's most trusted luxury car rental platform. Premium vehicles, professional service, memorable journeys — since 2019.
            </p>
            <div className="footer-socials">
              <a href="https://wa.me/918105197768" target="_blank" rel="noreferrer" className="footer-social" title="WhatsApp">📱</a>
              <a href="mailto:benakatravelsbusiness@gmail.com" className="footer-social" title="Email">📧</a>
              <a href="tel:+918105197768" className="footer-social" title="Call">📞</a>
              <a href="#" className="footer-social" title="Instagram">📸</a>
            </div>
          </div>
          <div>
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#fleet">Our Fleet</a></li>
              <li><a href="#why-us">Why Choose Us</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h5>Fleet</h5>
            <ul>
              <li><a href="#fleet" onClick={() => setActiveCategory('Sedan')}>Sedans</a></li>
              <li><a href="#fleet" onClick={() => setActiveCategory('SUV')}>SUVs</a></li>
              <li><a href="#fleet" onClick={() => setActiveCategory('MUV')}>MUVs</a></li>
              <li><a href="#fleet" onClick={() => setActiveCategory('Bus')}>Buses & Minibuses</a></li>
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <ul>
              <li><a href="tel:+918105197768">+91 81051 97768</a></li>
              <li><a href="mailto:benakatravelsbusiness@gmail.com">benakatravelsbusiness@gmail.com</a></li>
              <li><a>Panchaxari Nagar, Gadag, Karnataka</a></li>
              <li><a>Open 24 Hours (Mon–Sun)</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 BENAKA TRAVELS. All Rights Reserved.</p>
          <a href="/admin" style={{ opacity: 0.15, fontSize: '.7rem', color: 'inherit' }} title="Admin">⚙</a>
        </div>
      </footer>

      {/* ═══ BOOKING MODAL ══════════════════════════════════ */}
      {selectedCar && (
        <BookingModal car={selectedCar} onClose={() => setSelectedCar(null)} onBooked={fetchCars} />
      )}
    </div>
  );
}
