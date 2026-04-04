import { useState, useEffect } from 'react';
import { Shield, Map, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientHome() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    // In production, fetch from backend. Using mock data for demo if backend is offline.
    fetch('/api/cars')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCars(data);
        } else {
          // Fallback mock
          setCars([
            { id: 1, name: "Tesla Model S Plaid", category: "Electric", price: 150, image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800", features: "Autopilot, 1020hp" },
            { id: 2, name: "Porsche 911 GT3", category: "Sports", price: 280, image_url: "https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=800", features: "Track Ready, 502hp" },
            { id: 3, name: "Range Rover Sport", category: "SUV", price: 120, image_url: "https://images.unsplash.com/photo-1606016159991-d85c4bf41849?q=80&w=800", features: "AWD, Luxury Interior" },
          ]);
        }
      })
      .catch((e) => {
        console.error("Backend offline, using fallback data.");
        setCars([
          { id: 1, name: "Tesla Model S Plaid", category: "Electric", price: 150, image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800", features: "Autopilot, 1020hp" },
          { id: 2, name: "Porsche 911 GT3", category: "Sports", price: 280, image_url: "https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=800", features: "Track Ready, 502hp" },
          { id: 3, name: "Range Rover Sport", category: "SUV", price: 120, image_url: "https://images.unsplash.com/photo-1606016159991-d85c4bf41849?q=80&w=800", features: "AWD, Luxury Interior" },
        ]);
      });
  }, []);

  return (
    <div className="main-content">
      <nav className="navbar">
        <div className="nav-brand">
          <Zap size={24} className="text-primary" />
          <span>BENAKA</span> TRAVELS
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link">Fleet</a>
          <a href="#" className="nav-link">Locations</a>
          <a href="#" className="nav-link">Pricing</a>
          <Link to="/admin" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Admin Login</Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-background">
          <img src="/hero_car_placeholder.png" alt="Futuristic sports car" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2670&auto=format&fit=crop"; }} />
        </div>
        <div className="hero-content">
          <div className="hero-badge">Premium Fleet Available</div>
          <h1 className="hero-title">Experience the <span>Future</span> of Mobility</h1>
          <p className="hero-subtitle">
             Elevate your journey with Benaka Travels. Discover ultra-premium sports cars, state-of-the-art electric vehicles, and unparalleled luxury SUVs.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary">Book Now</button>
            <button className="btn btn-outline">Explore Fleet</button>
          </div>
        </div>
      </section>

      <section className="cars-section">
        <div className="section-header">
          <h2 className="section-title">Our Premium Selection</h2>
          <p>Choose from our meticulously maintained fleet of high-end vehicles.</p>
        </div>
        
        <div className="cars-grid">
          {cars.map(car => (
            <div className="car-card" key={car.id}>
              <div className="car-img-wrapper">
                <div className="car-category">{car.category}</div>
                <img src={car.image_url} alt={car.name} />
              </div>
              <div className="car-info">
                <h3 className="car-title">{car.name}</h3>
                <div className="car-features">
                  <Shield size={16} /> <span>{car.features}</span>
                </div>
                <div className="car-footer">
                  <div className="car-price">${car.price}<span>/day</span></div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Reserve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
