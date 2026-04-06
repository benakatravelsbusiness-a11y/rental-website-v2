import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  AlertCircle,
  Car,
  Users,
  Warehouse,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import { api } from '../api/client';
import { formatPaise, formatDate } from '../lib/utils';
import { MetricCard, MetricCardSkeleton } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/Spinner';

interface DashboardData {
  revenue_this_month_paise: number;
  outstanding_paise: number;
  active_trips: number;
  total_clients: number;
  total_fleet: number;
}

interface RecentInvoice {
  id: string;
  total_amount_paise: number;
  advance_paid_paise: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  client_name: string;
  client_phone: string;
  registration_number: string;
  car_model: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [invoices, setInvoices] = useState<RecentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashData, recentData] = await Promise.all([
          api.getDashboard(),
          api.getRecentInvoices(),
        ]);
        setStats(dashData);
        setInvoices(recentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-card-static p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <p className="text-xs text-slate-500">
            Make sure the API server is running on port 8787
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here's your business at a glance.</p>
        </div>
        <Link to="/billing" className="btn-primary">
          <FileText className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : stats ? (
          <>
            <MetricCard
              label="Revenue This Month"
              value={formatPaise(stats.revenue_this_month_paise)}
              icon={IndianRupee}
              accentColor="emerald"
              delay={0}
            />
            <MetricCard
              label="Outstanding Dues"
              value={formatPaise(stats.outstanding_paise)}
              icon={AlertCircle}
              accentColor="rose"
              delay={100}
            />
            <MetricCard
              label="Cars on Road"
              value={stats.active_trips.toString()}
              subtitle={`of ${stats.total_fleet} total fleet`}
              icon={Car}
              accentColor="blue"
              delay={200}
            />
            <MetricCard
              label="Total Clients"
              value={stats.total_clients.toString()}
              icon={Users}
              accentColor="violet"
              delay={300}
            />
          </>
        ) : null}
      </div>

      {/* Recent Invoices */}
      <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
          <Link to="/invoices" className="btn-ghost text-xs">
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : invoices.length === 0 ? (
          <div className="glass-card-static p-12 text-center">
            <Warehouse className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-slate-300 mb-1">No invoices yet</h3>
            <p className="text-xs text-slate-500">
              Create your first invoice to see it here.
            </p>
          </div>
        ) : (
          <div className="glass-card-static overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Vehicle</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-accent hover:text-accent-light font-mono text-xs font-medium transition-colors"
                        >
                          {inv.id}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-200">{inv.client_name}</p>
                          <p className="text-xs text-slate-500">{inv.client_phone}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-slate-200">{inv.car_model}</p>
                          <p className="text-xs text-slate-500 font-mono">{inv.registration_number}</p>
                        </div>
                      </td>
                      <td className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(inv.start_date)} — {formatDate(inv.end_date)}
                      </td>
                      <td className="font-mono font-medium text-slate-200">
                        {formatPaise(inv.total_amount_paise)}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} pulse={inv.status === 'Unpaid'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
