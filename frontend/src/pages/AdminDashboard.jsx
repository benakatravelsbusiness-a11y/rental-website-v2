import { useState, useEffect } from 'react';
import { Home, Users, BookOpen, Settings, LayoutDashboard, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    // Fetch cars logic here
    setCars([
      { id: 1, name: "Tesla Model S Plaid", category: "Electric", price: 150, available: true },
      { id: 2, name: "Porsche 911 GT3", category: "Sports", price: 280, available: true },
    ]);
  }, []);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="nav-brand" style={{ color: 'white', marginBottom: '3rem' }}>
          <span>BENAKA</span> Admin
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 1, color: 'var(--color-accent)' }}>
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.7 }}>
            <Home size={20} /> Fleet
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.7 }}>
            <BookOpen size={20} /> Bookings
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.7 }}>
            <Users size={20} /> Customers
          </a>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.7 }}>
            <Settings size={20} /> Settings
          </a>
        </nav>
        
        <div style={{ marginTop: 'auto' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.7 }}>
             Back to Site
          </Link>
        </div>
      </aside>
      
      <main className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Fleet Management</h2>
          <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}><Plus size={18} /> Add Vehicle</button>
        </div>
        
        <div className="admin-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle Name</th>
                <th>Category</th>
                <th>Daily Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id}>
                  <td style={{ fontWeight: 500 }}>{car.name}</td>
                  <td>{car.category}</td>
                  <td>${car.price}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      background: car.available ? 'var(--color-primary-light)' : '#fee2e2', 
                      color: car.available ? 'var(--color-primary-dark)' : '#dc2626',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      {car.available ? 'Available' : 'Rented'}
                    </span>
                  </td>
                  <td>
                    <button style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
