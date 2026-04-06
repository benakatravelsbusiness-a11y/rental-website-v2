import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ scrolled = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="nav-brand">
          <span className="accent">BENAKA TOURS</span>&nbsp;AND TRAVELS
        </Link>

        <div className="nav-links">
          <button onClick={() => scrollTo('fleet')} className="nav-link">Fleet</button>
          <button onClick={() => scrollTo('why-us')} className="nav-link">Why Us</button>
          <button onClick={() => scrollTo('faq')} className="nav-link">FAQ</button>
          <button onClick={() => scrollTo('contact')} className="nav-link">Contact</button>
        </div>

        <a href="tel:+918105197768" className="nav-cta" style={{ marginLeft: 'auto', marginRight: '.75rem', display: 'none' }}>
          📞 Call
        </a>

        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{ marginLeft: 'auto' }}
        >
          <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : '' }} />
          <span style={{ opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : '' }} />
        </button>
      </nav>

      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <button onClick={() => scrollTo('fleet')} className="mobile-nav-link">🚗 Our Fleet</button>
        <button onClick={() => scrollTo('why-us')} className="mobile-nav-link">⭐ Why Choose Us</button>
        <button onClick={() => scrollTo('faq')} className="mobile-nav-link">❓ FAQ</button>
        <button onClick={() => scrollTo('contact')} className="mobile-nav-link">📞 Contact</button>
        <a href="tel:+918105197768" className="mobile-nav-link" style={{ color: 'var(--gold)', fontWeight: 700 }}>
          Call: +91 81051 97768
        </a>
      </div>
    </>
  );
}
