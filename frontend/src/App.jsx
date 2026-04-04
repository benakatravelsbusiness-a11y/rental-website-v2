import { Routes, Route } from 'react-router-dom';
import ClientHome from './pages/ClientHome';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ClientHome />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
