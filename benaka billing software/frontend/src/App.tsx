import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { FleetManager } from './pages/FleetManager';
import { ClientCRM } from './pages/ClientCRM';
import { BillingEngine } from './pages/BillingEngine';
import { InvoiceView } from './pages/InvoiceView';
import { InvoiceList } from './pages/InvoiceList';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fleet" element={<FleetManager />} />
        <Route path="/clients" element={<ClientCRM />} />
        <Route path="/billing" element={<BillingEngine />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoiceView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
