import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, CheckCircle2, Printer, StopCircle, Share2
} from 'lucide-react';
import { api } from '../api/client';
import { formatPaise, formatDate, daysBetween, rupeesToPaise } from '../lib/utils';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingScreen } from '../components/ui/Spinner';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { InvoiceTemplate } from '../components/invoice/InvoiceTemplate';

interface InvoiceData {
  id: string;
  client_id: number;
  car_id: number;
  start_date: string;
  end_date: string;
  start_km: number | null;
  end_km: number | null;
  subtotal_paise: number;
  tax_paise: number;
  total_amount_paise: number;
  advance_paid_paise: number;
  status: string;
  created_at: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  client_dl: string | null;
  client_gstin: string | null;
  car_model: string;
  registration_number: string;
  daily_rate_paise: number;
  line_items: Array<{
    id: number;
    invoice_id: string;
    description: string;
    amount_paise: number;
  }>;
}

export function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const templateRef = useRef<HTMLDivElement>(null);

  // End Trip State
  const [showEndTrip, setShowEndTrip] = useState(false);
  const [endKm, setEndKm] = useState('');
  const [extraCharge, setExtraCharge] = useState('');
  const [endingTrip, setEndingTrip] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await api.getInvoice(id) as InvoiceData;
        setInvoice(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!templateRef.current) return;
    setDownloading(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: `${invoice?.id || 'invoice'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(templateRef.current)
        .save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF. Please try printing instead.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !templateRef.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${invoice?.id || 'Invoice'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          body { font-family: 'Inter', system-ui, sans-serif; }
        </style>
      </head>
      <body>${templateRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    try {
      await api.updateInvoiceStatus(invoice.id, 'Paid', invoice.total_amount_paise);
      setInvoice({ ...invoice, status: 'Paid', advance_paid_paise: invoice.total_amount_paise });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleEndTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !endKm) return;
    setEndingTrip(true);
    try {
      const result = await api.endTrip(invoice.id, {
        end_km: parseInt(endKm, 10),
        extra_charge_paise: extraCharge ? rupeesToPaise(extraCharge) : undefined,
      });
      // We must completely reload the invoice to get the updated line items
      const data = await api.getInvoice(invoice.id) as InvoiceData;
      setInvoice(data);
      setShowEndTrip(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end trip');
    } finally {
      setEndingTrip(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!invoice) return;
    const balance = Math.max(0, invoice.total_amount_paise - invoice.advance_paid_paise);
    
    // Construct WhatsApp message
    const msg = `*Invoice: ${invoice.id}*\n\n` +
      `Hello ${invoice.client_name},\n` +
      `Thank you for choosing Benaka Rentals.\n\n` +
      `Vehicle: ${invoice.car_model} (${invoice.registration_number})\n` +
      `Period: ${formatDate(invoice.start_date)} to ${formatDate(invoice.end_date)}\n` +
      `Total Amount: ${formatPaise(invoice.total_amount_paise)}\n` +
      `Advance Paid: ${formatPaise(invoice.advance_paid_paise)}\n` +
      `*Balance Due: ${formatPaise(balance)}*\n\n` +
      `Please contact us for any queries.`;

    const encoded = encodeURIComponent(msg);
    // Assuming Indian numbers, ensure +91 if missing
    let phone = invoice.client_phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  if (loading) return <LoadingScreen message="Loading invoice..." />;

  if (error && !invoice) {
    return (
      <div className="glass-card-static p-12 text-center max-w-md mx-auto">
        <p className="text-rose-400 mb-4">{error}</p>
        <Link to="/invoices" className="btn-secondary">← Back to Invoices</Link>
      </div>
    );
  }

  if (!invoice) return null;

  const balance = invoice.total_amount_paise - invoice.advance_paid_paise;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex-col items-start sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/invoices" className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono">{invoice.id}</h1>
              <StatusBadge status={invoice.status} pulse={invoice.status !== 'Paid'} />
            </div>
            <p className="page-subtitle">
              Created {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.end_km === null && (
            <button onClick={() => setShowEndTrip(true)} className="btn-secondary text-amber-400 border-amber-400/20 hover:bg-amber-400/10">
              <StopCircle className="w-4 h-4" />
              End Trip
            </button>
          )}
          {invoice.status !== 'Paid' && (
            <button onClick={handleMarkPaid} className="btn-secondary text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10">
              <CheckCircle2 className="w-4 h-4" />
              Mark Paid
            </button>
          )}
          <button onClick={handleWhatsAppShare} className="btn-secondary">
            <Share2 className="w-4 h-4 text-emerald-500" />
            Share
          </button>
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={handleDownloadPdf} disabled={downloading} className="btn-primary">
            {downloading ? <Spinner size="sm" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card-static p-4 border-rose-500/20 bg-rose-500/[0.05] text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Invoice details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card-static p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Client</p>
          <p className="text-sm font-medium text-white">{invoice.client_name}</p>
          <p className="text-xs text-slate-400 font-mono">{invoice.client_phone}</p>
          {invoice.client_email && <p className="text-xs text-slate-500 mt-1">{invoice.client_email}</p>}
        </div>
        <div className="glass-card-static p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vehicle</p>
          <p className="text-sm font-medium text-white">{invoice.car_model}</p>
          <p className="text-xs text-slate-400 font-mono">{invoice.registration_number}</p>
          <p className="text-xs text-slate-500 mt-1">KM: {invoice.start_km ?? '—'} → {invoice.end_km ?? '—'}</p>
        </div>
        <div className="glass-card-static p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Trip Period</p>
          <p className="text-sm text-white">{formatDate(invoice.start_date)} → {formatDate(invoice.end_date)}</p>
          <p className="text-xs text-slate-400">{daysBetween(invoice.start_date, invoice.end_date)} day(s)</p>
        </div>
        <div className="glass-card-static p-4 border-accent/20 bg-accent/[0.02]">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
          <p className="text-xl font-bold text-accent font-mono">{formatPaise(invoice.total_amount_paise)}</p>
          {balance > 0 && (
            <p className="text-xs text-amber-400 mt-1 font-semibold">Balance: {formatPaise(balance)}</p>
          )}
        </div>
      </div>

      {/* Line items table */}
      <div className="glass-card-static overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Line Items</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item, i) => (
              <tr key={item.id}>
                <td className="text-slate-500">{i + 1}</td>
                <td className="text-slate-200">{item.description}</td>
                <td className="text-right font-mono text-slate-200">{formatPaise(item.amount_paise)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/[0.08]">
              <td colSpan={2} className="text-right text-sm text-slate-400 px-4 py-2">Subtotal</td>
              <td className="text-right font-mono text-slate-200 px-4 py-2">{formatPaise(invoice.subtotal_paise)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="text-right text-sm text-slate-400 px-4 py-1">CGST (9%)</td>
              <td className="text-right font-mono text-slate-300 px-4 py-1">{formatPaise(Math.round(invoice.tax_paise / 2))}</td>
            </tr>
            <tr>
              <td colSpan={2} className="text-right text-sm text-slate-400 px-4 py-1">SGST (9%)</td>
              <td className="text-right font-mono text-slate-300 px-4 py-1">{formatPaise(invoice.tax_paise - Math.round(invoice.tax_paise / 2))}</td>
            </tr>
            <tr className="border-t border-white/[0.1]">
              <td colSpan={2} className="text-right text-base font-bold text-white px-4 py-3">Grand Total</td>
              <td className="text-right font-mono font-bold text-accent text-lg px-4 py-3">{formatPaise(invoice.total_amount_paise)}</td>
            </tr>
            {invoice.advance_paid_paise > 0 && (
              <>
                <tr>
                  <td colSpan={2} className="text-right text-sm text-emerald-400 px-4 py-1">Advance Paid</td>
                  <td className="text-right font-mono text-emerald-400 px-4 py-1">-{formatPaise(invoice.advance_paid_paise)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-right text-sm font-semibold text-amber-400 px-4 py-1">Balance Due</td>
                  <td className="text-right font-mono font-semibold text-amber-400 px-4 py-1">{formatPaise(Math.max(0, balance))}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>
      </div>

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <InvoiceTemplate ref={templateRef} invoice={invoice} />
      </div>

      {/* End Trip Modal */}
      <Modal open={showEndTrip} onClose={() => setShowEndTrip(false)} title="End Trip & Return Vehicle">
        <form onSubmit={handleEndTrip} className="space-y-4">
          <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.05] mb-2">
            <p className="text-sm text-slate-300">
              Ending this trip will mark the vehicle as <strong>Available</strong> for new bookings.
            </p>
            {invoice.start_km != null && (
              <p className="text-xs text-slate-500 mt-1">Starting KM was: {invoice.start_km}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="end-km">End Odometer (KM) *</label>
            <input
              id="end-km"
              type="number"
              value={endKm}
              onChange={(e) => setEndKm(e.target.value)}
              min={invoice.start_km || 0}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="extra-charge">Extra Charges (e.g. Extra KM, Damages) (₹)</label>
            <input
              id="extra-charge"
              type="number"
              placeholder="0"
              value={extraCharge}
              onChange={(e) => setExtraCharge(e.target.value)}
              step="0.01"
              min="0"
            />
            <p className="text-xs text-slate-500 mt-1">This will be added to the invoice as a new line item.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowEndTrip(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={endingTrip} className="btn-primary flex-1">
              {endingTrip ? <Spinner size="sm" /> : <StopCircle className="w-4 h-4" />}
              {endingTrip ? 'Processing...' : 'Confirm End Trip'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
