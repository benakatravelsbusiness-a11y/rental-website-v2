import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Filter } from 'lucide-react';
import { api } from '../api/client';
import { formatPaise, formatDate, cn } from '../lib/utils';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingScreen } from '../components/ui/Spinner';

interface InvoiceSummary {
  id: string;
  client_id: number;
  car_id: number;
  total_amount_paise: number;
  advance_paid_paise: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  client_name: string;
  client_phone: string;
  car_model: string;
  registration_number: string;
  subtotal_paise: number;
  tax_paise: number;
}

const statusFilters = ['All', 'Draft', 'Unpaid', 'Partially Paid', 'Paid'] as const;

export function InvoiceList() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = statusFilter !== 'All' ? { status: statusFilter } : undefined;
        const data = await api.getInvoices(params);
        setInvoices(data.invoices);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{total} total invoices</p>
        </div>
        <Link to="/billing" className="btn-primary">
          <FileText className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              statusFilter === s
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card-static p-4 border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingScreen message="Loading invoices..." />
      ) : invoices.length === 0 ? (
        <div className="glass-card-static p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">
            {statusFilter !== 'All' ? `No ${statusFilter} invoices` : 'No invoices yet'}
          </p>
        </div>
      ) : (
        <div className="glass-card-static overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Vehicle</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => {
                  const balance = inv.total_amount_paise - inv.advance_paid_paise;
                  return (
                    <tr key={inv.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-accent hover:text-accent-light font-mono text-xs font-medium transition-colors"
                        >
                          {inv.id}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium text-slate-200 text-sm">{inv.client_name}</p>
                      </td>
                      <td>
                        <p className="text-slate-300 text-sm">{inv.car_model}</p>
                        <p className="text-xs text-slate-500 font-mono">{inv.registration_number}</p>
                      </td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(inv.start_date)} — {formatDate(inv.end_date)}
                      </td>
                      <td className="font-mono font-medium text-slate-200 text-sm">
                        {formatPaise(inv.total_amount_paise)}
                      </td>
                      <td className={cn(
                        'font-mono text-sm font-medium',
                        balance > 0 ? 'text-amber-400' : 'text-emerald-400'
                      )}>
                        {balance > 0 ? formatPaise(balance) : 'Nil'}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} pulse={inv.status === 'Unpaid'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
