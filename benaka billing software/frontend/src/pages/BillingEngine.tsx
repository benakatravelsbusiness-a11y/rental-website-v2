import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Car, Calendar, ListPlus, CheckCircle2, Plus, Trash2,
  ChevronLeft, ChevronRight, Search, UserPlus
} from 'lucide-react';
import { api } from '../api/client';
import {
  formatPaise, rupeesToPaise, paiseToRupees, daysBetween, cn,
} from '../lib/utils';
import { Spinner, LoadingScreen } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

// -------- Types --------

interface Client {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
  gstin: string | null;
}

interface Vehicle {
  id: number;
  registration_number: string;
  car_model: string;
  daily_rate_paise: number;
  status: string;
}

interface LineItem {
  description: string;
  amount: string; // in rupees, user input
}

const STEPS = [
  { label: 'Client', icon: User },
  { label: 'Vehicle', icon: Car },
  { label: 'Dates', icon: Calendar },
  { label: 'Line Items', icon: ListPlus },
  { label: 'Review', icon: CheckCircle2 },
];

export function BillingEngine() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clientSearch, setClientSearch] = useState('');

  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Base Rental', amount: '' },
  ]);

  // Add client modal
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({
    full_name: '', phone_number: '', email: '', driving_license_number: '', gstin: '',
  });
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [clientData, fleetData] = await Promise.all([
          api.getClients(),
          api.getFleet(),
        ]);
        setClients(clientData.clients);
        setVehicles(fleetData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-calculate base rental when vehicle and dates change
  useEffect(() => {
    if (selectedVehicle && startDate && endDate) {
      const days = daysBetween(startDate, endDate);
      const baseAmount = paiseToRupees(selectedVehicle.daily_rate_paise * days);
      setLineItems((prev) => {
        const updated = [...prev];
        if (updated[0]?.description === 'Base Rental') {
          updated[0] = { description: 'Base Rental', amount: baseAmount.toString() };
        }
        return updated;
      });
    }
  }, [selectedVehicle, startDate, endDate]);

  // Calculations
  const subtotalPaise = lineItems.reduce(
    (sum, item) => sum + (item.amount ? rupeesToPaise(item.amount) : 0),
    0
  );
  const taxPaise = Math.round((subtotalPaise * 18) / 100);
  const cgstPaise = Math.round(taxPaise / 2);
  const sgstPaise = taxPaise - cgstPaise;
  const totalPaise = subtotalPaise + taxPaise;
  const advancePaise = advancePaid ? rupeesToPaise(advancePaid) : 0;
  const balancePaise = totalPaise - advancePaise;

  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone_number.includes(clientSearch)
      )
    : clients;

  const availableVehicles = vehicles.filter((v) => v.status === 'Available');

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!selectedClient;
      case 1: return !!selectedVehicle;
      case 2: return !!startDate && !!endDate;
      case 3: return lineItems.length > 0 && lineItems.every((l) => l.description && l.amount);
      default: return true;
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', amount: '' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    if (lineItems[index].description === 'Base Rental') {
      setError('Cannot remove the Base Rental line item.');
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
    setError('');
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClient(true);
    try {
      const created = await api.createClient({
        full_name: newClient.full_name,
        phone_number: newClient.phone_number,
        email: newClient.email || undefined,
        driving_license_number: newClient.driving_license_number || undefined,
        gstin: newClient.gstin || undefined,
      }) as Client;
      setClients((prev) => [created, ...prev]);
      setSelectedClient(created);
      setShowAddClient(false);
      setNewClient({ full_name: '', phone_number: '', email: '', driving_license_number: '', gstin: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setSavingClient(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedVehicle || !startDate || !endDate) return;

    setSaving(true);
    setError('');
    try {
      const result = await api.createInvoice({
        client_id: selectedClient.id,
        car_id: selectedVehicle.id,
        start_date: startDate,
        end_date: endDate,
        start_km: startKm ? parseInt(startKm, 10) : undefined,
        end_km: endKm ? parseInt(endKm, 10) : undefined,
        advance_paid_paise: advancePaise || undefined,
        line_items: lineItems.map((item) => ({
          description: item.description,
          amount_paise: rupeesToPaise(item.amount),
        })),
      }) as { id: string };
      navigate(`/invoices/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading billing data..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="page-title">Create Invoice</h1>
        <p className="page-subtitle">Follow the steps to generate a new invoice.</p>
      </div>

      {/* Stepper */}
      <div className="glass-card-static p-4 sm:p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              <button
                onClick={() => i < step && setStep(i)}
                className={cn(
                  'step-dot',
                  i < step && 'completed',
                  i === step && 'active',
                  i > step && 'pending'
                )}
                disabled={i > step}
              >
                {i < step ? '✓' : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('step-line mx-2', i < step ? 'active' : 'pending')} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => (
            <p
              key={i}
              className={cn(
                'text-[10px] sm:text-xs font-medium transition-colors',
                i === step ? 'text-accent' : i < step ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              {s.label}
            </p>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card-static p-4 border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Step Content */}
      <div className="glass-card-static p-5 sm:p-8 animate-fade-in" key={step}>
        {/* Step 0: Select Client */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Select Client</h2>
              <button onClick={() => setShowAddClient(true)} className="btn-secondary btn-sm">
                <UserPlus className="w-3.5 h-3.5" /> New Client
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200',
                    selectedClient?.id === client.id
                      ? 'bg-accent/10 border border-accent/30'
                      : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05]'
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-accent">
                      {client.full_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{client.full_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{client.phone_number}</p>
                  </div>
                  {selectedClient?.id === client.id && (
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No clients found</p>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Select Vehicle */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Select Vehicle</h2>
            <p className="text-sm text-slate-400">
              {availableVehicles.length} of {vehicles.length} vehicles available
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {availableVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200',
                    selectedVehicle?.id === vehicle.id
                      ? 'bg-accent/10 border border-accent/30'
                      : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05]'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{vehicle.car_model}</p>
                    <p className="text-xs text-slate-500 font-mono">{vehicle.registration_number}</p>
                    <p className="text-xs text-accent mt-0.5 font-semibold">
                      {formatPaise(vehicle.daily_rate_paise)}/day
                    </p>
                  </div>
                  {selectedVehicle?.id === vehicle.id && (
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Dates & KM */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Trip Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="start-date">Start Date *</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="end-date">End Date *</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="start-km">Start KM (Optional)</label>
                <input
                  id="start-km"
                  type="number"
                  placeholder="e.g. 45230"
                  value={startKm}
                  onChange={(e) => setStartKm(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="end-km">End KM (Optional)</label>
                <input
                  id="end-km"
                  type="number"
                  placeholder="e.g. 45780"
                  value={endKm}
                  onChange={(e) => setEndKm(e.target.value)}
                  min={startKm}
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="glass-card-static p-4 bg-accent/[0.03] border-accent/10 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-white font-medium">
                    {daysBetween(startDate, endDate)} day(s)
                  </p>
                  {selectedVehicle && (
                    <p className="text-xs text-slate-400">
                      Base: {formatPaise(selectedVehicle.daily_rate_paise)} × {daysBetween(startDate, endDate)} = {formatPaise(selectedVehicle.daily_rate_paise * daysBetween(startDate, endDate))}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Line Items */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Line Items</h2>
              <button onClick={handleAddLineItem} className="btn-secondary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 animate-fade-in">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Description (e.g. Extra KM charge)"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-40">
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={item.amount}
                      onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                      className="w-full text-right font-mono"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveLineItem(index)}
                    disabled={lineItems.length <= 1}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      lineItems.length <= 1
                        ? 'text-slate-700 cursor-not-allowed'
                        : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Live math */}
            <div className="glass-card-static p-5 mt-6 space-y-2.5 bg-surface-50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-200 font-mono">{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">CGST (9%)</span>
                <span className="text-slate-200 font-mono">{formatPaise(cgstPaise)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">SGST (9%)</span>
                <span className="text-slate-200 font-mono">{formatPaise(sgstPaise)}</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2.5 flex justify-between text-base">
                <span className="font-semibold text-white">Grand Total</span>
                <span className="font-bold text-accent font-mono">{formatPaise(totalPaise)}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="advance-paid">Advance Paid (₹)</label>
              <input
                id="advance-paid"
                type="number"
                placeholder="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                step="0.01"
                min="0"
                className="font-mono"
              />
              {advancePaise > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Balance due: <span className="text-amber-400 font-semibold">{formatPaise(Math.max(0, balancePaise))}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Review Invoice</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client */}
              <div className="glass-card-static p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Client</p>
                <p className="text-sm font-medium text-white">{selectedClient?.full_name}</p>
                <p className="text-xs text-slate-400 font-mono">{selectedClient?.phone_number}</p>
                {selectedClient?.gstin && (
                  <p className="text-xs text-slate-500">GSTIN: {selectedClient.gstin}</p>
                )}
              </div>

              {/* Vehicle */}
              <div className="glass-card-static p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Vehicle</p>
                <p className="text-sm font-medium text-white">{selectedVehicle?.car_model}</p>
                <p className="text-xs text-slate-400 font-mono">{selectedVehicle?.registration_number}</p>
                <p className="text-xs text-accent">{selectedVehicle && formatPaise(selectedVehicle.daily_rate_paise)}/day</p>
              </div>

              {/* Trip */}
              <div className="glass-card-static p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Trip Period</p>
                <p className="text-sm text-white">{startDate} → {endDate}</p>
                <p className="text-xs text-slate-400">{startDate && endDate ? `${daysBetween(startDate, endDate)} day(s)` : ''}</p>
              </div>

              {/* KM */}
              <div className="glass-card-static p-4 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Odometer</p>
                <p className="text-sm text-white">
                  {startKm || '—'} → {endKm || '—'}
                </p>
                {startKm && endKm && (
                  <p className="text-xs text-slate-400">{parseInt(endKm) - parseInt(startKm)} km driven</p>
                )}
              </div>
            </div>

            {/* Line items summary */}
            <div className="glass-card-static overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="text-slate-200">{item.description}</td>
                      <td className="text-right font-mono text-slate-200">
                        {item.amount ? formatPaise(rupeesToPaise(item.amount)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="glass-card-static p-5 space-y-2.5 bg-accent/[0.02] border-accent/10">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-200 font-mono">{formatPaise(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">CGST (9%)</span>
                <span className="text-slate-200 font-mono">{formatPaise(cgstPaise)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">SGST (9%)</span>
                <span className="text-slate-200 font-mono">{formatPaise(sgstPaise)}</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2 flex justify-between text-lg">
                <span className="font-bold text-white">Grand Total</span>
                <span className="font-bold text-accent font-mono">{formatPaise(totalPaise)}</span>
              </div>
              {advancePaise > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Advance Paid</span>
                    <span className="text-emerald-400 font-mono">-{formatPaise(advancePaise)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-amber-400">Balance Due</span>
                    <span className="text-amber-400 font-mono">{formatPaise(Math.max(0, balancePaise))}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className={cn('btn-secondary', step === 0 && 'opacity-50 cursor-not-allowed')}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={cn('btn-primary', !canProceed() && 'opacity-50 cursor-not-allowed')}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving || !canProceed()}
            className={cn('btn-primary', (saving || !canProceed()) && 'opacity-50 cursor-not-allowed')}
          >
            {saving ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        )}
      </div>

      {/* Add Client Modal */}
      <Modal open={showAddClient} onClose={() => setShowAddClient(false)} title="Quick Add Client">
        <form onSubmit={handleAddClient} className="space-y-4">
          <div className="form-group">
            <label htmlFor="new-name">Full Name *</label>
            <input
              id="new-name"
              type="text"
              value={newClient.full_name}
              onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-phone">Phone *</label>
            <input
              id="new-phone"
              type="tel"
              value={newClient.phone_number}
              onChange={(e) => setNewClient({ ...newClient, phone_number: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddClient(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={savingClient} className="btn-primary flex-1">
              {savingClient ? <Spinner size="sm" /> : 'Add & Select'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
