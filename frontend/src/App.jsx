import { Routes, Route } from 'react-router-dom';
import ClientHome from './pages/ClientHome';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<ClientHome />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
