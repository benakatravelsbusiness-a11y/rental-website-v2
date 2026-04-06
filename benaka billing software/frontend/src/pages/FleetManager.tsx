import { useEffect, useState } from 'react';
import { Car, ToggleLeft, ToggleRight, Filter } from 'lucide-react';
import { api } from '../api/client';
import { formatPaise, cn } from '../lib/utils';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingScreen } from '../components/ui/Spinner';

interface Vehicle {
  id: number;
  registration_number: string;
  car_model: string;
  daily_rate_paise: number;
  status: string;
  created_at: string;
}

const statusOptions = ['All', 'Available', 'On-Trip', 'Maintenance'] as const;

const statusColorMap: Record<string, string> = {
  Available: 'border-emerald-500/30 bg-emerald-500/[0.03]',
  'On-Trip': 'border-blue-500/30 bg-blue-500/[0.03]',
  Maintenance: 'border-amber-500/30 bg-amber-500/[0.03]',
};

export function FleetManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [error, setError] = useState('');

  const fetchFleet = async () => {
    try {
      const data = await api.getFleet();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFleet(); }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      await api.updateFleetStatus(id, newStatus);
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const cycleStatus = (current: string): string => {
    const cycle = ['Available', 'On-Trip', 'Maintenance'];
    const idx = cycle.indexOf(current);
    return cycle[(idx + 1) % cycle.length];
  };

  const filteredVehicles = filter === 'All'
    ? vehicles
    : vehicles.filter((v) => v.status === filter);

  const counts = {
    All: vehicles.length,
    Available: vehicles.filter((v) => v.status === 'Available').length,
    'On-Trip': vehicles.filter((v) => v.status === 'On-Trip').length,
    Maintenance: vehicles.filter((v) => v.status === 'Maintenance').length,
  };

  if (loading) return <LoadingScreen message="Loading fleet..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Manager</h1>
          <p className="page-subtitle">
            {counts.Available} available · {counts['On-Trip']} on road · {counts.Maintenance} in maintenance
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card-static p-4 border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              filter === s
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
            )}
          >
            {s}
            <span className="ml-2 text-xs opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredVehicles.map((vehicle, i) => (
          <div
            key={vehicle.id}
            className={cn(
              'glass-card p-5 animate-slide-up border-l-[3px]',
              statusColorMap[vehicle.status] || ''
            )}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                  <Car className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white leading-tight">{vehicle.car_model}</p>
                  <p className="text-xs text-slate-500 font-mono">{vehicle.registration_number}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Daily Rate</p>
                <p className="text-sm font-semibold text-slate-200 font-mono">
                  {formatPaise(vehicle.daily_rate_paise)}
                </p>
              </div>
              <StatusBadge status={vehicle.status} pulse={vehicle.status === 'On-Trip'} />
            </div>

            {/* Quick toggle */}
            <button
              onClick={() => handleStatusChange(vehicle.id, cycleStatus(vehicle.status))}
              disabled={updating === vehicle.id}
              className={cn(
                'mt-4 w-full btn-secondary btn-sm justify-center',
                updating === vehicle.id && 'opacity-50 cursor-not-allowed'
              )}
            >
              {updating === vehicle.id ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <>
                  <ToggleRight className="w-3.5 h-3.5" />
                  Set {cycleStatus(vehicle.status)}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="glass-card-static p-12 text-center">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm text-slate-400">No vehicles match the filter "{filter}"</p>
        </div>
      )}
    </div>
  );
}
