import { useState } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ onBookNow }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <Zap size={22} color="var(--primary)" />
          <span className="accent">BENAKA</span>&nbsp;TRAVELS
        </Link>

        <div className="nav-links">
          <button onClick={() => scrollTo('fleet')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Fleet</button>
          <button onClick={() => scrollTo('why-us')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Why Us</button>
          <button onClick={() => scrollTo('contact')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Contact</button>
          <Link to="/admin" className="btn btn-outline btn-sm">Admin Portal</Link>
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button onClick={() => scrollTo('fleet')} className="mobile-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>🚗 Fleet</button>
        <button onClick={() => scrollTo('why-us')} className="mobile-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>⭐ Why Us</button>
        <button onClick={() => scrollTo('contact')} className="mobile-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>📞 Contact</button>
        <Link to="/admin" className="btn btn-primary btn-sm" onClick={() => setMobileOpen(false)}>Admin Portal</Link>
      </div>
    </>
  );
}
