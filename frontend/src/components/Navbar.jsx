import { useState } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <span className="accent">BENAKA</span>&nbsp;TRAVELS
        </Link>

        <div className="nav-links">
          <button onClick={() => scrollTo('fleet')} className="nav-link">Fleet</button>
          <button onClick={() => scrollTo('why-us')} className="nav-link">Why Us</button>
          <button onClick={() => scrollTo('track')} className="nav-link">Track Booking</button>
          <button onClick={() => scrollTo('contact')} className="nav-link">Contact</button>
        </div>

        <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button onClick={() => scrollTo('fleet')} className="mobile-nav-link">🚗 Our Fleet</button>
        <button onClick={() => scrollTo('why-us')} className="mobile-nav-link">⭐ Why Us</button>
        <button onClick={() => scrollTo('track')} className="mobile-nav-link">📋 Track Booking</button>
        <button onClick={() => scrollTo('contact')} className="mobile-nav-link">📞 Contact</button>
      </div>
    </>
  );
}
