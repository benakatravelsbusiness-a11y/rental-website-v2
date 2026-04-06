import { useEffect, useState, useCallback } from 'react';
import { Search, UserPlus, Phone, Mail, FileText, Download, Edit2 } from 'lucide-react';
import { api } from '../api/client';
import { formatDate, cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { LoadingScreen } from '../components/ui/Spinner';
import { Spinner } from '../components/ui/Spinner';

interface Client {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  driving_license_number: string | null;
  gstin: string | null;
  created_at: string;
}

export function ClientCRM() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    driving_license_number: '',
    gstin: '',
  });

  const fetchClients = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      const data = await api.getClients(searchTerm);
      setClients(data.clients);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchClients]);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setForm({
        full_name: client.full_name,
        phone_number: client.phone_number,
        email: client.email || '',
        driving_license_number: client.driving_license_number || '',
        gstin: client.gstin || '',
      });
    } else {
      setEditingClient(null);
      setForm({ full_name: '', phone_number: '', email: '', driving_license_number: '', gstin: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone_number) return;

    setSaving(true);
    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, {
          full_name: form.full_name,
          phone_number: form.phone_number,
          email: form.email || undefined,
          driving_license_number: form.driving_license_number || undefined,
          gstin: form.gstin || undefined,
        });
      } else {
        await api.createClient({
          full_name: form.full_name,
          phone_number: form.phone_number,
          email: form.email || undefined,
          driving_license_number: form.driving_license_number || undefined,
          gstin: form.gstin || undefined,
        });
      }
      setModalOpen(false);
      fetchClients(search || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (clients.length === 0) return;
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'DL Number', 'GSTIN', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...clients.map((c) => [
        c.id,
        `"${c.full_name}"`,
        c.phone_number,
        c.email ? `"${c.email}"` : '',
        c.driving_license_number ? `"${c.driving_license_number}"` : '',
        c.gstin ? `"${c.gstin}"` : '',
        c.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Client CRM</h1>
          <p className="page-subtitle">{total} total clients</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary" disabled={clients.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card-static p-4 border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 w-full"
          id="client-search"
        />
      </div>

      {/* Table */}
      {loading && clients.length === 0 ? (
        <LoadingScreen message="Loading clients..." />
      ) : (
        <div className="glass-card-static overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>License</th>
                  <th>GSTIN</th>
                  <th>Since</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <p className="text-slate-500 text-sm">
                        {search ? `No clients matching "${search}"` : 'No clients yet. Add your first client!'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  clients.map((client, i) => (
                    <tr key={client.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-accent">
                              {client.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-200">{client.full_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="font-mono text-xs">{client.phone_number}</span>
                        </div>
                      </td>
                      <td>
                        {client.email ? (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span className="text-xs">{client.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {client.driving_license_number ? (
                          <span className="font-mono text-xs text-slate-400">
                            {client.driving_license_number}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {client.gstin ? (
                          <span className="font-mono text-xs text-slate-400">{client.gstin}</span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors inline-block"
                          title="Edit Client"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingClient ? "Edit Client" : "Add New Client"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="client-name">Full Name *</label>
            <input
              id="client-name"
              type="text"
              placeholder="e.g. Rajesh Kumar"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-phone">Phone Number *</label>
            <input
              id="client-phone"
              type="tel"
              placeholder="e.g. +919876543210"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-email">Email</label>
            <input
              id="client-email"
              type="email"
              placeholder="e.g. rajesh@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-dl">Driving License Number</label>
            <input
              id="client-dl"
              type="text"
              placeholder="e.g. KA-0120230001234"
              value={form.driving_license_number}
              onChange={(e) => setForm({ ...form, driving_license_number: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="client-gstin">GSTIN (optional)</label>
            <input
              id="client-gstin"
              type="text"
              placeholder="e.g. 29AABCU9603R1ZM"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner size="sm" /> : <UserPlus className="w-4 h-4" />}
              {saving ? 'Saving...' : (editingClient ? 'Save Changes' : 'Add Client')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
