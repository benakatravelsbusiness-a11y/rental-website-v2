import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Car, Users, BarChart2,
  Settings, HelpCircle, Bell, RefreshCw,
  Plus, Trash2, CheckCircle, XCircle, Menu, X,
  Home, MessageCircle, Printer, Search, Phone, Receipt,
  FileText, CreditCard, Calendar, User, MapPin, Gauge, Eye
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import '../admin.css';

Chart.register(...registerables);

const TOKEN = 'Bearer benakaAdmin2026';

/* ══════════════ GLOBAL MODALS ══════════════ */
let _setManualBookingRef = null;

let _setToasts = null;
function toast(msg, type = 'success') {
  const id = Date.now();
  _setToasts(p => [...p, { id, msg, type }]);
  setTimeout(() => _setToasts(p => p.filter(t => t.id !== id)), 3500);
}
function ToastHub() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { _setToasts = setToasts; }, []);
  return (
    <div className="adm-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`adm-toast adm-toast-${t.type}`}>
          {t.type === 'success' ? '✅' : '❌'} {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ══════════════ HELPERS ══════════════ */
const pillClass = { pending: 'pill-yellow', confirmed: 'pill-blue', completed: 'pill-green', cancelled: 'pill-red' };
const StatusPill = ({ status }) => <span className={`pill ${pillClass[status] || 'pill-gray'}`}>{status}</span>;
const whatsappLink = (phone, msg) => `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
const fmtDate = (d) => { if (!d) return ''; const p = d.split('-'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : d; };
const Loader = () => <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}>⏳ Loading...</div>;
const Empty = ({ icon, text }) => <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)' }}><div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{icon}</div>{text}</div>;

/* CSV Export helper */
function exportCSV(rows, filename) {
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* Print high-fidelity invoice — pixel-perfect replica of physical billing pads */
function printProfessionalInvoice(invoiceData) {
  const i = invoiceData;
  const isGST = i.bill_type === 'GST' || i.bill_type === 'GST2';
  const fmt = (paise) => {
    const v = (paise || 0) / 100;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const w = window.open('', '_blank');
  if (!w) { alert('Please allow popups to view the bill.'); return; }

  const perKmRate = i.extra_km_rate_paise ? (i.extra_km_rate_paise / 100) : 0;
  const vType = perKmRate >= 10 ? 'AC' : 'Non AC';

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Outfit',sans-serif;color:#1a3a7a;background:#fff;padding:18px;font-size:14px;}
    @media print{body{padding:0;}@page{margin:10mm;}}
    .bill{max-width:780px;margin:0 auto;border:3px solid #1a3a7a;padding:22px 28px;}
    .hdr{text-align:center;border-bottom:2.5px solid #1a3a7a;padding-bottom:12px;margin-bottom:15px;position:relative;}
    .hdr .ph{position:absolute;right:0;top:0;text-align:right;font-weight:700;font-size:13px;line-height:1.4;}
    .hdr .gs{position:absolute;left:0;top:0;font-weight:800;font-size:11px;}
    .sp{font-size:10px;font-style:italic;font-weight:600;}
    .bt{font-size:13px;font-weight:800;letter-spacing:1px;margin:3px 0;}
    .bn{font-size:26px;font-weight:800;letter-spacing:-0.3px;}
    .tg{display:inline-block;border:2px solid #1a3a7a;border-radius:3px;padding:2px 14px;font-size:11px;font-weight:700;margin:4px 0;}
    .adr{font-size:12px;font-weight:700;}
    .fr{display:flex;align-items:baseline;margin-bottom:8px;}
    .fl{font-weight:700;white-space:nowrap;font-size:14px;}
    .fv{flex:1;border-bottom:1.5px solid #1a3a7a;color:#000;font-weight:600;padding:0 6px;min-height:1.2em;font-size:14px;}
    .fc{font-weight:700;margin:0 4px;}
    .fg{display:flex;gap:30px;}
    .sig{display:flex;justify-content:space-between;margin-top:50px;font-weight:700;font-style:italic;font-size:13px;}
    .sln{width:150px;border-bottom:1px solid #1a3a7a;margin-bottom:5px;}
  `;

  let htmlContent = '';

  if (!isGST) {
    // ═══════ NON-GST CASH BILL — Physical Pad Image 1 ═══════
    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cash Bill - ${i.id}</title>
<style>${css}
.tr{display:flex;align-items:baseline;margin-bottom:8px;}
.tl{font-weight:800;font-size:15px;width:140px;}
.tc{font-weight:800;margin:0 6px;}
.tv{flex:1;border-bottom:2px solid #1a3a7a;font-weight:800;color:#000;font-size:15px;text-align:right;padding-right:10px;}
.note{margin-top:15px;font-size:11px;font-weight:700;border-top:1.5px solid #1a3a7a;padding-top:8px;}
</style></head><body>
<div class="bill">
  <div class="hdr">
    <div class="ph">Cell : 8105197768<br>6362416120</div>
    <div class="sp">|| Shri Veerabhadreshwara Prasanna ||</div>
    <div class="bt">CASH-BILL</div>
    <div class="bn">SHRI BENAKA TOURS &amp; TRAVELS</div>
    <div class="tg">Contact for All Types of AC &amp; NON AC Vehicles</div>
    <div class="adr">Building No. 127, Panchaxari Nagar, 6th Cross, GADAG-582101</div>
  </div>

  <div class="fg" style="margin-bottom:12px;">
    <div class="fr" style="width:45%;"><span class="fl">No.</span><span class="fv">${i.id}</span></div>
    <div class="fr" style="flex:1;"><span class="fl">Date:</span><span class="fv">${new Date(i.created_at || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'2-digit',year:'numeric'})}</span></div>
  </div>

  <div class="fr"><span class="fl">Name</span><span class="fc">:</span><span class="fv">${i.customer_name || ''}</span></div>
  <div class="fr"><span class="fl">Vehicle No</span><span class="fc">:</span><span class="fv">${i.vehicle_no_override || i.car_model || ''}</span></div>

  <div class="fg">
    <div class="fr" style="flex:1;"><span class="fl">From</span><span class="fc">:</span><span class="fv">${i.place_from || ''}</span></div>
    <div class="fr" style="flex:1;"><span class="fl">To</span><span class="fc">:</span><span class="fv">${i.place_to || ''}</span></div>
  </div>

  <div class="fg">
    <div class="fr" style="flex:1;"><span class="fl">Opening Date</span><span class="fc">:</span><span class="fv">${fmtDate(i.start_date)}</span></div>
    <div class="fr" style="flex:1;"><span class="fl">Closing Date</span><span class="fc">:</span><span class="fv">${fmtDate(i.end_date)}</span></div>
  </div>

  <div class="fr"><span class="fl">Working Days</span><span class="fc">:</span><span class="fv" style="width:50%;flex:none;">${i.working_days || ''}</span></div>

  <div class="fg">
    <div class="fr" style="flex:1;"><span class="fl">Starting Km</span><span class="fc">:</span><span class="fv">${i.start_km || ''}</span></div>
    <div class="fr" style="flex:1;"><span class="fl">Closing Km</span><span class="fc">:</span><span class="fv">${i.end_km || ''}</span></div>
  </div>

  <div class="fr"><span class="fl">Total Km</span><span class="fc">:</span><span class="fv" style="width:50%;flex:none;">${i.total_km || ''}</span></div>
  <div class="fr"><span class="fl">Driver Batta</span><span class="fc">:</span><span class="fv">${i.driver_batta_paise ? fmt(i.driver_batta_paise) : ''}</span></div>
  <div class="fr"><span class="fl">Toll Gate Amount</span><span class="fc">:</span><span class="fv">${i.fastag_paise ? fmt(i.fastag_paise) : ''}</span></div>

  <div style="display:flex;gap:20px;margin-top:15px;border-top:2px solid #1a3a7a;padding-top:12px;">
    <div style="flex:1;">
      <div class="tr"><span class="tl">Total</span><span class="tc">:</span><span class="tv">${fmt(i.total_amount_paise)}</span></div>
      <div class="tr"><span class="tl">Advance</span><span class="tc">:</span><span class="tv">${fmt(i.advance_paid_paise)}</span></div>
      <div class="tr"><span class="tl">Total Balance</span><span class="tc">:</span><span class="tv">${fmt(i.total_amount_paise - (i.advance_paid_paise || 0))}</span></div>
    </div>
    <div style="align-self:flex-end;">
      <svg width="170" height="70" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="35" width="180" height="28" rx="5" fill="#dde3ed" stroke="#1a3a7a" stroke-width="1.5"/>
        <path d="M35 35 Q40 12 80 12 L140 12 Q165 12 170 35" fill="#c5cfe0" stroke="#1a3a7a" stroke-width="1.5"/>
        <rect x="48" y="16" width="32" height="18" rx="2" fill="#b0d4f1" stroke="#1a3a7a" stroke-width="1"/>
        <rect x="92" y="16" width="50" height="18" rx="2" fill="#b0d4f1" stroke="#1a3a7a" stroke-width="1"/>
        <circle cx="52" cy="66" r="11" fill="#555" stroke="#1a3a7a" stroke-width="1.5"/><circle cx="52" cy="66" r="4" fill="#ddd"/>
        <circle cx="152" cy="66" r="11" fill="#555" stroke="#1a3a7a" stroke-width="1.5"/><circle cx="152" cy="66" r="4" fill="#ddd"/>
      </svg>
    </div>
  </div>

  <div class="note"><strong>Note :</strong><br>Rate of Average Per Day (${i.km_limit_per_day || 300} kms) &mdash; ${vType} @ &#8377;${perKmRate}/km</div>

  <div style="text-align:center;margin-top:18px;padding:6px 0;border-top:1.5px dashed #1a3a7a;font-size:12px;font-weight:700;color:#1a3a7a;">
    For booking visit: <span style="color:#c00;font-size:13px;">www.benakatravels.in</span>
  </div>

  <div class="sig">
    <div><div class="sln"></div><em>Client Signature</em></div>
    <div style="text-align:right;"><div class="sln" style="margin-left:auto;"></div><em>Signature</em></div>
  </div>
</div>
</body></html>`;

  } else {
    // ═══════ GST BILL (and GST BILL 2) — Physical Pad Image 2 ═══════
    const exCalc = (i.extra_km_qty && i.extra_km_rate_paise)
      ? i.extra_km_qty + ' x ' + (i.extra_km_rate_paise/100) + ' = ' + fmt(i.extra_km_total_paise)
      : '\u2014';
    const avgCalc = i.avg_monthly_rate_paise
      ? (i.avg_monthly_rate_paise/100) + ' x ' + (i.qty_avg_per_month || 1) + ' = ' + fmt(i.avg_monthly_rate_paise * (i.qty_avg_per_month || 1))
      : '\u2014';
    const billLabel = i.bill_type === 'GST2' ? 'TAX INVOICE' : 'CASH BILL';

    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${billLabel} - ${i.id}</title>
<style>${css}
.cs{margin-top:10px;border-top:1.5px solid #1a3a7a;padding-top:8px;}
.cr{display:flex;align-items:baseline;margin-bottom:10px;}
.cr .cl{flex:1;font-weight:700;font-size:14px;}
.cr .rs{white-space:nowrap;font-weight:700;margin:0 4px;}
.cr .cv{width:210px;border-bottom:1.5px solid #1a3a7a;font-weight:700;color:#000;font-size:14px;text-align:right;padding-right:8px;}
.ct{width:100%;border-collapse:collapse;margin-top:12px;border:2.5px solid #1a3a7a;}
.ct td{border:1.5px solid #1a3a7a;padding:8px 10px;font-weight:700;font-size:14px;vertical-align:top;}
.cr2{display:flex;justify-content:space-between;padding:5px 0;}
.cr2 .rv{font-weight:800;color:#000;min-width:110px;text-align:right;font-size:15px;}
.gt{border-top:2.5px solid #1a3a7a;margin-top:5px;padding-top:8px;font-weight:900;font-size:17px;}
</style></head><body>
<div class="bill">
  <div class="hdr">
    <div class="gs">GSTIN: 29APHPL5323F1ZW</div>
    <div class="ph">Cell : 8105197768<br>6362416120</div>
    <div class="sp">|| Shri Veerabhadreshwara Prasanna ||</div>
    <div class="bt">${billLabel}</div>
    <div class="bn">BENAKA TOURS &amp; TRAVELS</div>
    <div class="tg">Contact for All Types of AC &amp; NON AC Vehicles</div>
    <div class="adr">Building No. 127, Panchaxari Nagar, 6th Cross, GADAG-582101.</div>
  </div>

  <div class="fg" style="margin-bottom:10px;">
    <div class="fr" style="flex:1;"><span class="fl">Invoice No.</span><span class="fv" style="font-weight:900;color:#c00;font-size:18px;">${i.id}</span></div>
    <div class="fr" style="flex:1;"><span class="fl">Date :</span><span class="fv">${new Date(i.created_at || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'2-digit',year:'numeric'})}</span></div>
  </div>

  <div class="fr"><span class="fl">M/s.</span><span class="fv" style="font-size:16px;">${i.company_name || i.customer_name}</span></div>

  <div class="fg" style="margin-top:8px;">
    <div class="fr" style="flex:2;"><span class="fl">Party GSTIN</span><span class="fc">:</span><span class="fv">${i.party_gstin || ''}</span></div>
    <div class="fr" style="flex:1;"><span class="fl">Vehicle No.</span><span class="fv">${i.vehicle_no_override || i.car_model || ''}</span></div>
  </div>

  <div style="margin-top:12px;border-top:1.5px solid #1a3a7a;padding-top:10px;">
    <div class="fr"><span class="fl" style="width:220px;">Opening Date</span><span class="fc">:</span><span class="fv">${fmtDate(i.start_date)}</span></div>
    <div class="fr"><span class="fl" style="width:220px;">Closing Date</span><span class="fc">:</span><span class="fv">${fmtDate(i.end_date)}</span></div>
    <div class="fr"><span class="fl" style="width:220px;">Total Working Days</span><span class="fc">:</span><span class="fv">${i.working_days || ''}</span></div>
    <div class="fr"><span class="fl" style="width:220px;">Starting Km</span><span class="fc">:</span><span class="fv">${i.start_km || ''}</span></div>
    <div class="fr"><span class="fl" style="width:220px;">Ending Km</span><span class="fc">:</span><span class="fv">${i.end_km || ''}</span></div>
    <div class="fr"><span class="fl" style="width:220px;">Total Km</span><span class="fc">:</span><span class="fv">${i.total_km || ''}</span></div>
  </div>

  <div class="cs">
    <div class="cr"><span class="cl">Rate of Extra Kms</span><span class="rs">Rs. :</span><span class="cv">${exCalc}</span></div>
    <div class="cr"><span class="cl">Rate of Average Per Month <u style="padding:0 8px;">${i.km_limit_per_day ? ((i.km_limit_per_day || 300) * (i.working_days || 30)) : ''}</u> Kms</span><span class="rs">Rs. :</span><span class="cv">${avgCalc}</span></div>
    <div class="cr"><span class="cl">Toll Gate Amount</span><span class="rs">Rs. :</span><span class="cv">${i.fastag_paise ? fmt(i.fastag_paise) : '\u2014'}</span></div>
    <div class="cr"><span class="cl">${i.bill_type === 'GST2' ? 'AC Charges' : ('Amount for <u style="padding:0 8px;">' + (i.working_days || '') + '</u> Days')}</span><span class="rs">Rs. :</span><span class="cv">${fmt(i.amount_for_days_paise)}</span></div>
    <div class="cr"><span class="cl">Amount for Extra Kms: <u style="padding:0 8px;">${i.extra_km_qty || 0}</u> Kms</span><span class="rs">Rs. :</span><span class="cv">${fmt(i.extra_km_total_paise)}</span></div>
    <div class="cr"><span class="cl">Driver Extra Duty: <u style="padding:0 8px;">${i.driver_extra_duty_hours || 0} x ${i.driver_extra_duty_rate_paise ? (i.driver_extra_duty_rate_paise/100) : 0}</u> Hours</span><span class="rs">Rs. :</span><span class="cv">${fmt(i.driver_extra_duty_total_paise)}</span></div>
  </div>

  <table class="ct">
    <tr>
      <td style="width:50%;vertical-align:top;">
        <div style="font-weight:800;margin-bottom:5px;">Description:</div>
        <div style="color:#000;font-weight:400;font-size:13px;white-space:pre-line;">${i.trip_description || '&nbsp;'}</div>
      </td>
      <td>
        <div class="cr2" style="border-bottom:1.5px solid #1a3a7a;"><span>Amount</span><span class="rv">${fmt(i.subtotal_paise)}</span></div>
        <div class="cr2"><span>CGST ${i.cgst_rate || 9}%</span><span class="rv">${fmt(i.cgst_paise)}</span></div>
        <div class="cr2"><span>SGST ${i.sgst_rate || 9}%</span><span class="rv">${fmt(i.sgst_paise)}</span></div>
        ${(i.igst_paise && i.igst_paise > 0) ? '<div class="cr2"><span>IGST ' + (i.igst_rate || 0) + '%</span><span class="rv">' + fmt(i.igst_paise) + '</span></div>' : ''}
        <div class="cr2" style="border-top:1px solid #ccc;"><span>Fastag</span><span class="rv">${fmt(i.fastag_paise)}</span></div>
        <div class="cr2 gt"><span>G.TOTAL</span><span class="rv" style="font-size:17px;">${fmt(i.total_amount_paise)}</span></div>
      </td>
    </tr>
  </table>

  <div style="text-align:center;margin-top:18px;padding:6px 0;border-top:1.5px dashed #1a3a7a;font-size:12px;font-weight:700;color:#1a3a7a;">
    For booking visit: <span style="color:#c00;font-size:13px;">www.benakatravels.in</span>
  </div>

  <div class="sig">
    <div><div class="sln"></div><em>Client Signature</em></div>
    <div style="text-align:right;"><div class="sln" style="margin-left:auto;"></div>For, <strong>BENAKA TOURS &amp; TRAVELS</strong></div>
  </div>
</div>
</body></html>`;
  }

  w.document.write(htmlContent);
  w.document.close();
  setTimeout(() => w.print(), 800);
}

// Simple number to words helper
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return 'Large Amount';
  };
  return convert(Math.floor(num));
}

/* ══════════════ REVENUE CHART ══════════════ */
function RevenueChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !data || data.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = data.map(d => d.day).reverse();
    const values = data.map(d => d.revenue).reverse();

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: values,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,.1)',
          borderWidth: 2.5,
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.42,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a28',
            borderColor: 'rgba(16,185,129,.3)',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#fff',
            callbacks: { label: ctx => `₹${ctx.parsed.y.toLocaleString('en-IN')}` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: 'rgba(255,255,255,.4)', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: 'rgba(255,255,255,.4)', font: { size: 11 }, callback: v => `₹${v}` }, beginAtZero: true }
        }
      }
    });
    return () => chartRef.current?.destroy();
  }, [data]);

  return <div style={{ height: '200px' }}><canvas ref={ref} /></div>;
}

/* ══════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════ */
function DashboardPage({ setPage }) {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [chartData, setChartData] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [sr, br, cr] = await Promise.all([
        fetch('/api/admin/billing/dashboard', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/revenue-chart', { headers: { Authorization: TOKEN } })
      ]);
      const res = await sr.json();
      if (res.success && res.data) setStats(res.data);
      const bd = await br.json(); if (Array.isArray(bd)) setBookings(bd);
      const cd = await cr.json(); if (Array.isArray(cd)) setChartData(cd);
    } catch (e) { console.error('Dashboard fetch error', e); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build notifications from real bookings
  const notifications = bookings.slice(0, 5).map(b => {
    const msgs = {
      pending: { text: `New booking from ${b.customer_name} for ${b.car_name}`, color: '#f59e0b' },
      confirmed: { text: `Booking #${b.ref} confirmed — ${b.car_name}`, color: '#22c55e' },
      completed: { text: `Trip completed: ${b.car_name} returned by ${b.customer_name}`, color: '#3b82f6' },
      cancelled: { text: `Booking #${b.ref} was cancelled`, color: '#ef4444' },
    };
    const m = msgs[b.status] || { text: `Booking update: ${b.ref}`, color: '#888' };
    return { id: b.id, ...m, time: b.created_at?.split('T')[0] || '' };
  });

  return (
    <>
      <div className="adm-stats-row">
        {[
          { label: 'Total Bookings', value: stats?.total_bookings ?? '—', sub: `Recent activity`, subClass: 'yellow', icon: '📋', iconClass: 'icon-blue' },
          { label: 'Available Fleet', value: `${(stats?.total_fleet || 0) - (stats?.active_trips || 0)} Cars`, sub: `${stats?.total_fleet || '—'} total`, subClass: 'blue', icon: '🚗', iconClass: 'icon-green' },
          { label: 'Total Revenue', value: `₹${((stats?.revenue_this_month_paise || 0) / 100).toLocaleString('en-IN')}`, sub: `This Month`, subClass: 'green', icon: '💰', iconClass: 'icon-yellow' },
          { label: 'Outstanding', value: `₹${((stats?.outstanding_paise || 0) / 100).toLocaleString('en-IN')}`, sub: `Collect from clients`, subClass: 'blue', icon: '🔑', iconClass: 'icon-red' },
        ].map((s, i) => (
          <div key={i} className="adm-stat-card">
            <div>
              <div className="adm-stat-label">{s.label}</div>
              <div className="adm-stat-value">{s.value}</div>
              <div className={`adm-stat-sub ${s.subClass}`}>{s.sub}</div>
            </div>
            <div className={`adm-stat-icon ${s.iconClass}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="adm-grid-3-1">
        <div>
          {/* Recent Bookings */}
          <div className="adm-panel" style={{ marginBottom: '1.25rem' }}>
            <div className="adm-panel-header">
              <span className="adm-panel-title">Recent Bookings</span>
              <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setPage('bookings')}>View All →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-table">
                <thead><tr><th>Ref</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={6}><Empty icon="📋" text="No bookings yet" /></td></tr>
                  ) : bookings.slice(0, 6).map(b => (
                    <tr key={b.id}>
                      <td style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem', fontFamily: 'monospace' }}>{b.ref}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>{b.customer_email}</div>
                      </td>
                      <td>{b.car_name}</td>
                      <td style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>{b.pickup_date} → {b.return_date}</td>
                      <td style={{ fontWeight: 700, color: '#60a5fa' }}>${b.total_price}</td>
                      <td><StatusPill status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Revenue Overview</span>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>Last 30 days</span>
            </div>
            <div className="revenue-chart-wrap">
              {chartData.length > 0 ? <RevenueChart data={chartData} /> : <Empty icon="📊" text="Complete bookings to see revenue data" />}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="adm-panel">
            <div className="adm-panel-header"><span className="adm-panel-title">Fleet Status</span></div>
            <div className="adm-panel-body" style={{ paddingTop: '.5rem' }}>
              {[
                { label: 'Available', count: stats?.availableCars ?? 0, color: '#22c55e' },
                { label: 'Rented Out', count: stats?.rentedCars ?? 0, color: '#3b82f6' },
                { label: 'Pending Bookings', count: stats?.pendingBookings ?? 0, color: '#f59e0b' },
                { label: 'Total Fleet', count: stats?.totalCars ?? 0, color: '#8b5cf6' },
              ].map((r, i) => (
                <div key={i} className="fleet-status-row">
                  <div className="fleet-status-label"><div className="fleet-status-dot" style={{ background: r.color }} />{r.label}</div>
                  <div className="fleet-status-count" style={{ color: r.color }}>{r.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-panel">
            <div className="adm-panel-header"><span className="adm-panel-title">Quick Actions</span></div>
            <div className="adm-panel-body" style={{ paddingTop: '.5rem' }}>
              <div className="quick-actions-grid">
                <button className="quick-action-btn qa-primary" onClick={() => setPage('bookings')}><Plus size={14} /> Bookings</button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('vehicles')}>🚗 Fleet</button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('reports')}>📊 Reports</button>
                <button className="quick-action-btn qa-secondary" onClick={() => setPage('revenue')}>💰 Revenue</button>
              </div>
            </div>
          </div>

          <div className="adm-panel">
            <div className="adm-panel-header">
              <span className="adm-panel-title">Activity</span>
              {notifications.length > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: '.65rem', fontWeight: 700, padding: '.1rem .4rem', borderRadius: '99px' }}>{notifications.length}</span>}
            </div>
            <div className="adm-panel-body" style={{ paddingTop: '.25rem' }}>
              {notifications.length === 0 ? <Empty icon="🔔" text="No activity" /> : notifications.map(n => (
                <div key={n.id} className="notif-item">
                  <div className="notif-dot-wrap"><div className="notif-dot" style={{ background: n.color }} /></div>
                  <div><div className="notif-text">{n.text}</div><div className="notif-time">{n.time}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   BOOKINGS PAGE
══════════════════════════════════════════════════ */
function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ car_id: '', customer_name: '', customer_phone: '', customer_email: '', pickup_date: '', return_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [br, cr] = await Promise.all([
        fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/cars', { headers: { Authorization: TOKEN } })
      ]);
      const bd = await br.json(); if (Array.isArray(bd)) setBookings(bd);
      const cd = await cr.json(); if (Array.isArray(cd)) setCars(cd.filter(c => c.available));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id, status) => {
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify({ status })
      });
      const d = await r.json();
      if (r.ok) { toast(d.message || 'Status updated', 'success'); fetchAll(); }
      else toast(d.error || 'Failed', 'error');
    } catch { toast('Network error', 'error'); }
  };

  const deleteBooking = async (id, ref) => {
    if (!confirm(`Delete booking ${ref}? This cannot be undone.`)) return;
    try {
      const r = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
      if (r.ok) { toast('Booking deleted', 'success'); fetchAll(); }
      else toast('Delete failed', 'error');
    } catch { toast('Network error', 'error'); }
  };

  const addBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (r.ok) {
        toast(`Booking ${d.ref} created!`, 'success');
        setShowModal(false);
        setForm({ car_id: '', customer_name: '', customer_phone: '', customer_email: '', pickup_date: '', return_date: '' });
        fetchAll();
      } else toast(d.error || 'Failed', 'error');
    } catch { toast('Network error', 'error'); }
    setSubmitting(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter(b => {
    const mf = filter === 'all' || b.status === filter;
    const ms = !search || [b.customer_name, b.car_name, b.ref].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return mf && ms;
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Bookings</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>{bookings.length} total · {bookings.filter(b => b.status === 'pending').length} pending</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> New Booking</button>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header" style={{ flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
              <button key={f} className={`adm-btn adm-btn-sm ${filter === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${bookings.filter(b => b.status === f).length})`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input className="adm-search" placeholder="🔍 Search ref, name..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchAll}><RefreshCw size={14} /></button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? <Loader /> : filtered.length === 0 ? <Empty icon="📋" text="No bookings found" /> : (
            <table className="adm-table">
              <thead>
                <tr><th>Ref</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Days</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>{b.ref}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                      <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>{b.customer_phone}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{b.car_name}</td>
                    <td style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>
                      <div>{fmtDate(b.pickup_date)}</div>
                      <div>→ {fmtDate(b.return_date)}</div>
                    </td>
                    <td>{b.total_days}d</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>₹{b.total_price}</td>
                    <td><StatusPill status={b.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        {b.status === 'pending' && <>
                          <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => updateStatus(b.id, 'confirmed')} title="Confirm"><CheckCircle size={13} /> Confirm</button>
                          <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => updateStatus(b.id, 'cancelled')} title="Cancel"><XCircle size={13} /></button>
                        </>}
                        {b.status === 'confirmed' && (
                          <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => updateStatus(b.id, 'completed')} title="Complete trip & release car">🏁 End Trip</button>
                        )}
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => {
                          const mockInvoice = {
                            id: b.ref,
                            bill_type: 'NON_GST',
                            customer_name: b.customer_name,
                            customer_phone: b.customer_phone,
                            car_model: b.car_name,
                            subtotal_paise: b.total_price * 100,
                            total_amount_paise: b.total_price * 100,
                            start_date: b.pickup_date,
                            end_date: b.return_date,
                            created_at: new Date().toISOString()
                          };
                          printProfessionalInvoice(mockInvoice);
                        }} title="Print Quick Bill" style={{ color: '#a78bfa' }}>
                          <Printer size={13} />
                        </button>
                        <a href={whatsappLink(b.customer_phone, `Hi ${b.customer_name}! BENAKA TRAVELS: This is an update on your booking ${b.ref} for the ${b.car_name} (${b.pickup_date} to ${b.return_date}). Status is now: ${b.status.toUpperCase()}. Total amount: ₹${b.total_price}. Please let us know if you have any questions!`)} target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ color: '#25D366' }} title="WhatsApp Update">
                          <MessageCircle size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Booking Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-hd"><h3>New Booking</h3><button className="adm-modal-close" onClick={() => setShowModal(false)}><X size={15} /></button></div>
            <form onSubmit={addBooking}>
              <div className="adm-form-group">
                <label>Vehicle *</label>
                <select required className="adm-input" value={form.car_id} onChange={e => setForm({ ...form, car_id: e.target.value })}>
                  <option value="">Choose vehicle...</option>
                  {cars.map(c => <option key={c.id} value={c.id}>{c.name} — ₹{c.price}/day</option>)}
                </select>
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Customer Name *</label><input required className="adm-input" placeholder="Full name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div className="adm-form-group"><label>Phone *</label><input required className="adm-input" placeholder="+91..." value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></div>
              </div>
              <div className="adm-form-group"><label>Email *</label><input required type="email" className="adm-input" placeholder="email@example.com" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Pickup *</label><input required type="date" className="adm-input" min={today} value={form.pickup_date} onChange={e => setForm({ ...form, pickup_date: e.target.value })} /></div>
                <div className="adm-form-group"><label>Return *</label><input required type="date" className="adm-input" min={form.pickup_date || today} value={form.return_date} onChange={e => setForm({ ...form, return_date: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════
   VEHICLES PAGE
══════════════════════════════════════════════════ */
function VehiclesPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Sedan', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Diesel' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/cars', { headers: { Authorization: TOKEN } });
      const d = await r.json(); if (Array.isArray(d)) setCars(d);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await fetch('/api/admin/cars', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: TOKEN }, body: JSON.stringify(form) });
      if (r.ok) { toast('Vehicle added!', 'success'); setShowModal(false); setForm({ name: '', category: 'Sedan', price: '', image_url: '', features: '', seats: '5', fuel_type: 'Diesel' }); fetchCars(); }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error'); }
    } catch { toast('Network error', 'error'); }
    setSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? Any pending bookings will be cancelled.`)) return;
    const r = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
    if (r.ok) { toast(`${name} removed`, 'success'); fetchCars(); }
    else toast('Failed', 'error');
  };

  const toggleAvail = async (car) => {
    const r = await fetch(`/api/admin/cars/${car.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
      body: JSON.stringify({ available: !car.available })
    });
    if (r.ok) { toast(`${car.name} → ${!car.available ? 'Available' : 'Unavailable'}`, 'success'); fetchCars(); }
  };

  const filtered = cars.filter(c => !search || [c.name, c.category].some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Vehicles</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>{cars.length} total · {cars.filter(c => c.available).length} available</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <input className="adm-search" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchCars}><RefreshCw size={14} /></button>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => cars.length > 0 && exportCSV(cars.map(c => ({ Name: c.name, Category: c.category, Price: c.price, Seats: c.seats, Fuel: c.fuel_type, Available: c.available ? 'Yes' : 'No' })), 'fleet_export.csv')}>⬇ CSV</button>
          <button className="adm-btn adm-btn-primary" onClick={() => setShowModal(true)}><Plus size={15} /> Add Vehicle</button>
        </div>
      </div>

      <div className="adm-panel">
        <div style={{ overflowX: 'auto' }}>
          {loading ? <Loader /> : (
            <table className="adm-table">
              <thead><tr><th>Vehicle</th><th>Category</th><th>Daily Rate</th><th>Seats</th><th>Fuel</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(car => (
                  <tr key={car.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <img src={car.image_url} alt="" style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px', background: '#1e293b', flexShrink: 0 }} onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=200'; }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{car.name}</div>
                          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>{car.features?.slice(0, 35)}...</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="pill pill-blue">{car.category}</span></td>
                    <td style={{ fontWeight: 700, color: '#60a5fa' }}>${car.price}/day</td>
                    <td>{car.seats}</td>
                    <td>{car.fuel_type}</td>
                    <td>
                      <button className={`pill ${car.available ? 'pill-green' : 'pill-red'}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggleAvail(car)}>
                        {car.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td><button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(car.id, car.name)}><Trash2 size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-hd"><h3>Add Vehicle</h3><button className="adm-modal-close" onClick={() => setShowModal(false)}><X size={15} /></button></div>
            <form onSubmit={handleAdd}>
              <div className="adm-form-group"><label>Name *</label><input required className="adm-input" placeholder="e.g. Lamborghini Urus" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Category *</label><select className="adm-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Sedan', 'SUV', 'MUV', 'Minibus', 'Bus'].map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="adm-form-group"><label>Daily Rate (₹) *</label><input required type="number" className="adm-input" placeholder="1500" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              </div>
              <div className="adm-form-row">
                <div className="adm-form-group"><label>Seats</label><input type="number" className="adm-input" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} /></div>
                <div className="adm-form-group"><label>Fuel Type</label><select className="adm-input" value={form.fuel_type} onChange={e => setForm({ ...form, fuel_type: e.target.value })}>{['Petrol', 'Diesel', 'CNG', 'Electric'].map(f => <option key={f}>{f}</option>)}</select></div>
              </div>
              <div className="adm-form-group"><label>Features *</label><input required className="adm-input" placeholder="AC, ABS, Music System" value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} /></div>
              <div className="adm-form-group"><label>Image URL *</label><input required className="adm-input" placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════
   REPORTS PAGE
══════════════════════════════════════════════════ */
function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats', { headers: { Authorization: TOKEN } }).then(r => r.json()),
      fetch('/api/admin/bookings', { headers: { Authorization: TOKEN } }).then(r => r.json()),
      fetch('/api/admin/revenue-chart', { headers: { Authorization: TOKEN } }).then(r => r.json())
    ]).then(([s, b, c]) => {
      setStats(s);
      if (Array.isArray(b)) setBookings(b);
      if (Array.isArray(c)) setChartData(c);
    }).catch(() => {});
  }, []);

  const statusCounts = bookings.reduce((a, b) => { a[b.status] = (a[b.status] || 0) + 1; return a; }, {});
  const topCars = bookings.reduce((a, b) => { a[b.car_name] = (a[b.car_name] || 0) + 1; return a; }, {});
  const topCarsSorted = Object.entries(topCars).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Reports & Analytics</h2>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>Complete business overview</p>
      </div>

      <div className="adm-stats-row" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', sub: 'Confirmed + Completed' },
          { label: 'This Month', value: `$${(stats?.monthRevenue || 0).toLocaleString()}`, icon: '📅', sub: 'Current month revenue' },
          { label: 'Avg Booking', value: stats?.totalBookings ? `$${Math.round((stats.totalRevenue || 0) / Math.max(1, (stats.confirmedBookings || 0) + (stats.completedBookings || 0)))}` : '$0', icon: '📊', sub: 'Per confirmed booking' },
          { label: 'Completion Rate', value: stats?.totalBookings ? `${Math.round(((stats.completedBookings || 0) / stats.totalBookings) * 100)}%` : '0%', icon: '✅', sub: `${stats?.completedBookings ?? 0} of ${stats?.totalBookings ?? 0}` },
        ].map((s, i) => (
          <div key={i} className="adm-stat-card">
            <div>
              <div className="adm-stat-label">{s.label}</div>
              <div className="adm-stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
              <div className="adm-stat-sub blue">{s.sub}</div>
            </div>
            <div className="adm-stat-icon icon-blue">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="adm-grid-2">
        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Revenue Trend (Last 30 Days)</span></div>
          <div className="revenue-chart-wrap">
            {chartData.length > 0 ? <RevenueChart data={chartData} /> : <Empty icon="📊" text="No revenue data yet" />}
          </div>
        </div>

        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Booking Status</span></div>
          <div className="adm-panel-body">
            {Object.entries(statusCounts).map(([st, cnt]) => {
              const pct = Math.round((cnt / bookings.length) * 100);
              return (
                <div key={st} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                    <StatusPill status={st} />
                    <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{cnt} ({pct}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: '99px', height: '6px' }}>
                    <div style={{ background: '#10b981', borderRadius: '99px', height: '100%', width: `${pct}%`, transition: 'width .5s ease' }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(statusCounts).length === 0 && <Empty icon="📋" text="No data" />}
          </div>
        </div>
      </div>

      {topCarsSorted.length > 0 && (
        <div className="adm-panel" style={{ marginTop: '1.25rem' }}>
          <div className="adm-panel-header"><span className="adm-panel-title">Most Popular Vehicles</span></div>
          <div className="adm-panel-body">
            {topCarsSorted.map(([name, cnt], i) => (
              <div key={name} className="fleet-status-row">
                <div className="fleet-status-label">
                  <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 700, width: '20px' }}>#{i + 1}</span>
                  {name}
                </div>
                <span className="pill pill-blue">{cnt} booking{cnt > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS + SUPPORT (compact)
══════════════════════════════════════════════════ */
function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const save = (e) => { e.preventDefault(); toast('Settings saved', 'success'); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h2>
      <div className="adm-grid-2" style={{ alignItems: 'start' }}>
        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Business Details</span></div>
          <div className="adm-panel-body">
            <form onSubmit={save}>
              {[['Business Name', 'BENAKA TRAVELS'], ['Contact Email', 'benakatravelsbusiness@gmail.com'], ['Phone', '+91 6362416120'], ['Address', 'Panchaxari Nagar, Gadag']].map(([l, v]) => (
                <div key={l} className="adm-form-group"><label>{l}</label><input className="adm-input" defaultValue={v} /></div>
              ))}
              <button type="submit" className="adm-btn adm-btn-primary">{saved ? '✅ Saved' : 'Save'}</button>
            </form>
          </div>
        </div>
        <div className="adm-panel">
          <div className="adm-panel-header"><span className="adm-panel-title">Quick Links</span></div>
          <div className="adm-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <Link to="/" className="adm-btn adm-btn-ghost" style={{ justifyContent: 'flex-start' }}><Home size={15} /> View Website</Link>
            <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="adm-btn adm-btn-ghost" style={{ justifyContent: 'flex-start' }}>☁️ Cloudflare Dashboard</a>
          </div>
        </div>
      </div>
    </>
  );
}

function SupportPage() {
  const faqs = [
    { q: 'How does the booking lifecycle work?', a: 'Customer books → Status is PENDING → You click Confirm → Status is CONFIRMED (car stays rented, revenue counted) → When trip ends, click "End Trip" → Status is COMPLETED (car released back to available, revenue preserved permanently).' },
    { q: 'Why is revenue $0?', a: 'Revenue only counts bookings with status CONFIRMED or COMPLETED. Pending and cancelled bookings are not counted. Make sure to Confirm bookings to see revenue.' },
    { q: 'How to contact a customer?', a: 'Every booking row has a green WhatsApp button that opens a pre-filled message with all booking details. You can also go to Customers page to see all customers with WhatsApp links.' },
    { q: 'How does car availability work?', a: 'When a booking is created → car becomes Unavailable. When booking is Completed or Cancelled → car is automatically released back to Available. You can also manually toggle availability in the Vehicles page.' },
    { q: 'Can I delete a booking?', a: 'You can only delete Completed or Cancelled bookings. Active bookings (Pending/Confirmed) must be cancelled first to release the car.' },
  ];
  return (
    <>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Support & FAQ</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '720px' }}>
        {faqs.map((f, i) => (
          <div key={i} className="adm-panel">
            <div className="adm-panel-body">
              <div style={{ fontWeight: 700, marginBottom: '.5rem', color: '#34d399' }}>Q: {f.q}</div>
              <div style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.7 }}>{f.a}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   BILLING ENGINE PAGE (Iframe Embed)
══════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════
   BILLING ENGINE PAGE (Native Implementation)
   Goal: Replace iframe with robust React UI
══════════════════════════════════════════════════ */
function BillingEnginePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showGST2, setShowGST2] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInvoiceData, setPayInvoiceData] = useState(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null);
  const [cars, setCars] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ir, cr] = await Promise.all([
        fetch('/api/admin/billing/invoices', { headers: { Authorization: TOKEN } }),
        fetch('/api/admin/cars', { headers: { Authorization: TOKEN } })
      ]);
      const idata = await ir.json(); if (idata.success && idata.data?.invoices) setInvoices(idata.data.invoices);
      const cdata = await cr.json(); if (Array.isArray(cdata)) setCars(cdata);
    } catch (e) {
      console.error('Invoices fetch error', e);
      toast('Failed to load invoices', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // (handleSubmit moved inside InvoiceFormModal)

  const executeDelete = async () => {
    if (!deleteInvoiceId) return;
    try {
      const r = await fetch(`/api/admin/billing/invoices/${deleteInvoiceId}`, { method: 'DELETE', headers: { Authorization: TOKEN } });
      if (r.ok) { toast('Invoice deleted', 'success'); fetchAll(); }
      else {
        const d = await r.json();
        toast(d.error || 'Delete failed', 'error');
      }
    } catch { toast('Network error during delete', 'error'); }
    setDeleteInvoiceId(null);
  };

  const handlePayBalance = async (e) => {
    e.preventDefault();
    const paidAmt = document.getElementById('pay-balance-input').value;
    if (!paidAmt) return;
    
    // We update the invoice's advance_paid_paise to exactly what the user entered
    // If it's matching or exceeding the total, we set status to 'Paid'
    try {
      const totalAmt = payInvoiceData.total_amount_paise / 100;
      const newPaid = parseFloat(paidAmt);
      const newStatus = newPaid >= totalAmt ? 'Paid' : 'Partially Paid';
      
      const r = await fetch(`/api/admin/billing/invoices/${payInvoiceData.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify({ status: newStatus, advance_paid_paise: Math.round(newPaid * 100) })
      });
      if (r.ok) { toast('Payment updated successfully!', 'success'); fetchAll(); setShowPayModal(false); }
      else {
        const d = await r.json();
        toast(d.error || 'Failed', 'error');
      }
    } catch { toast('Error updating payment', 'error'); }
  };

  return (
    <div className="adm-page-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Invoices & Billing</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>{invoices.length} total records generated</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="adm-btn adm-btn-ghost" onClick={fetchAll}><RefreshCw size={15} /> Refresh</button>
          <button className="adm-btn adm-btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Non-GST Cash Bill</button>
          <button className="adm-btn adm-btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} onClick={() => setShowGST2(true)}><FileText size={15} /> New GST Bill 2</button>
        </div>
      </div>

      <div className="adm-panel">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <Loader />
          ) : invoices.length === 0 ? (
            <Empty icon="🧾" text="No invoices generated yet" />
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>INV #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Dates</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.id}</td>
                    <td>{inv.customer_name}</td>
                    <td>{inv.car_model}</td>
                    <td style={{ fontSize: '.8rem', color: 'rgba(255,255,255,0.6)' }}>{fmtDate(inv.start_date)} → {fmtDate(inv.end_date)}</td>
                    <td style={{ fontWeight: 700, color: '#34d399', textAlign: 'right' }}>₹{((inv.total_amount_paise || 0) / 100).toLocaleString()}</td>
                    <td><span className={`adm-badge ${(inv.status || 'Draft').toLowerCase()}`}>{inv.status || 'Draft'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
                        {inv.status !== 'Paid' && (
                          <button className="adm-btn adm-btn-success adm-btn-sm" onClick={() => { setPayInvoiceData(inv); setShowPayModal(true); }} style={{ padding: '0 .5rem', fontSize: '.7rem' }}>💳 Pay Balance</button>
                        )}
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => printProfessionalInvoice(inv)} title="View/Print Bill" style={{ color: '#60a5fa' }}><Eye size={15} /></button>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setDeleteInvoiceId(inv.id)} title="Delete" style={{ color: '#ef4444' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <InvoiceFormModal 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => { setShowCreate(false); fetchAll(); }}
          defaultCarId={cars.length > 0 ? cars[0].id : 1}
          cars={cars}
        />
      )}

      {showGST2 && (
        <GSTBillTwoModal
          onClose={() => setShowGST2(false)}
          onSuccess={() => { setShowGST2(false); fetchAll(); }}
          defaultCarId={cars.length > 0 ? cars[0].id : 1}
          cars={cars}
        />
      )}

      {showPayModal && payInvoiceData && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-hd"><h3>Update Payment</h3><button className="adm-modal-close" onClick={() => setShowPayModal(false)}><X size={15} /></button></div>
            <form onSubmit={handlePayBalance} className="adm-panel-body">
              <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)', marginBottom: '1rem' }}>Total Amount: ₹{((payInvoiceData.total_amount_paise || 0) / 100).toLocaleString()}, Paid Previously: ₹{((payInvoiceData.advance_paid_paise || 0) / 100).toLocaleString()}</p>
              <div className="adm-form-group">
                <label>Total Payment Collected Now (Update Total)</label>
                <input required type="number" step="0.01" className="adm-input" defaultValue={(payInvoiceData.total_amount_paise || 0) / 100} id="pay-balance-input" />
              </div>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn-success">Update Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteInvoiceId && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteInvoiceId(null)}>
          <div className="adm-modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="adm-modal-hd" style={{ justifyContent: 'center' }}>
              <h3 style={{ color: '#ef4444' }}>Delete Invoice?</h3>
            </div>
            <div className="adm-panel-body">
              <p>Are you sure you want to permanently delete invoice <strong>{deleteInvoiceId}</strong>? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="adm-btn adm-btn-ghost" onClick={() => setDeleteInvoiceId(null)} style={{ flex: 1 }}>Cancel</button>
                <button className="adm-btn adm-btn-primary" onClick={executeDelete} style={{ flex: 1, background: '#ef4444' }}>Delete Permanently</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RevenuePage() {
  const [data, setData] = useState({ transactions: [], summary: { total_revenue_paise: 0, total_outstanding_paise: 0, count: 0 } });
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/billing/dashboard/revenue-report?start=${dates.start}&end=${dates.end}`, {
        headers: { Authorization: TOKEN }
      });
      const d = await r.json();
      if (d.success) setData(d.data);
    } catch { toast('Error fetching revenue data', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchRevenue(); }, [dates]);

  const fmt = (p) => `₹${((p || 0) / 100).toLocaleString('en-IN')}`;

  return (
    <div className="adm-page-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Revenue & Accounting</h2>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>Tracking all collections and receivables</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', background: '#111113', padding: '.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,.05)' }}>
          <input type="date" className="adm-input adm-input-sm" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} style={{ width: '130px', background: 'transparent', border: 'none' }} />
          <span style={{ opacity: .3 }}>→</span>
          <input type="date" className="adm-input adm-input-sm" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} style={{ width: '130px', background: 'transparent', border: 'none' }} />
        </div>
      </div>

      <div className="adm-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="adm-stat-card">
          <div className="adm-stat-label">Total Collection</div>
          <div className="adm-stat-value" style={{ color: '#10b981' }}>{fmt(data.summary.total_revenue_paise)}</div>
          <div className="adm-stat-sub">Paid / Advance amount</div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-label">Total Outstanding</div>
          <div className="adm-stat-value" style={{ color: '#f59e0b' }}>{fmt(data.summary.total_outstanding_paise)}</div>
          <div className="adm-stat-sub">Pending balance</div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-label">Transactions</div>
          <div className="adm-stat-value">{data.summary.count}</div>
          <div className="adm-stat-sub">In selected period</div>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header"><span className="adm-panel-title">Transaction History</span></div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</div> : data.transactions.length === 0 ? <Empty icon="💸" text="No transactions in this period" /> : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '.8rem' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'monospace' }}>{t.id}</td>
                    <td>{t.customer_name}</td>
                    <td><span className={`adm-badge ${(t.type || 'unknown').toLowerCase()}`}>{t.type}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(t.type === 'Invoice' ? t.advance_paid_paise : t.total_amount_paise)}</td>
                    <td><span className={`adm-badge ${(t.status || 'unknown').toLowerCase()}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}




function GSTBillTwoModal({ onClose, onSuccess, defaultCarId, cars = [] }) {
  const [f, setF] = useState({
    customer_name: '', party_gstin: '', vehicle_details: '',
    opening_date: '', closing_date: '', working_days_text: '',
    vehicle_qty: 1, avg_monthly_rate: '',
    extra_kms: '', extra_km_rate: '',
    duty_hours: '', duty_rate: '',
    ac_charges: '',
    fastag: '',
    igst_rate: '',
    trip_description: '',
    selected_car_id: defaultCarId || ''
  });

  // Strict manual calculation — no auto-derived values
  const baseRent = (parseFloat(f.avg_monthly_rate) || 0) * (parseInt(f.vehicle_qty) || 1);
  const extraKmAmt = (parseFloat(f.extra_kms) || 0) * (parseFloat(f.extra_km_rate) || 0);
  const dutyAmt = (parseFloat(f.duty_hours) || 0) * (parseFloat(f.duty_rate) || 0);
  const acAmt = parseFloat(f.ac_charges) || 0;
  const taxableSubtotal = baseRent + extraKmAmt + dutyAmt + acAmt;
  const cgst = Math.round(taxableSubtotal * 9) / 100;
  const sgst = Math.round(taxableSubtotal * 9) / 100;
  const igstRate = parseFloat(f.igst_rate) || 0;
  const igstAmt = Math.round(taxableSubtotal * igstRate) / 100;
  const fastagAmt = parseFloat(f.fastag) || 0;
  const grandTotal = taxableSubtotal + cgst + sgst + igstAmt + fastagAmt;

  const fmtINR = (v) => '\u20b9' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.customer_name) { toast('Customer name is required', 'error'); return; }
    if (!f.opening_date || !f.closing_date) { toast('Opening and Closing dates are required', 'error'); return; }

    const payload = {
      customer_name: f.customer_name,
      customer_phone: '0000000000',
      car_id: parseInt(f.selected_car_id) || defaultCarId || 1,
      bill_type: 'GST2',
      company_name: f.customer_name,
      party_gstin: f.party_gstin,
      vehicle_no_override: f.vehicle_details,
      start_date: f.opening_date,
      end_date: f.closing_date,
      working_days: parseInt(f.working_days_text) || 0,
      qty_avg_per_month: parseInt(f.vehicle_qty) || 1,
      avg_monthly_rate_paise: Math.round((parseFloat(f.avg_monthly_rate) || 0) * 100),
      amount_for_days_paise: Math.round(acAmt * 100),
      extra_km_rate_paise: Math.round((parseFloat(f.extra_km_rate) || 0) * 100),
      extra_km_qty: parseInt(f.extra_kms) || 0,
      driver_extra_duty_hours: parseFloat(f.duty_hours) || 0,
      driver_extra_duty_rate_paise: Math.round((parseFloat(f.duty_rate) || 0) * 100),
      driver_batta_paise: 0,
      toll_gate_paise: 0,
      fastag_paise: Math.round(fastagAmt * 100),
      advance_paid_paise: 0,
      cgst_rate: 9,
      sgst_rate: 9,
      km_limit_per_day: 300,
      trip_description: f.trip_description,
      line_items: []
    };

    try {
      const r = await fetch('/api/admin/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        toast('GST Bill 2 generated!', 'success');
        onSuccess();
      } else {
        const d = await r.json();
        toast(d.error || 'Failed to generate', 'error');
      }
    } catch { toast('Network error', 'error'); }
  };

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: '780px' }}>
        <div className="adm-modal-hd">
          <h3>GST Bill 2 — Tax Invoice (Manual Entry)</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>

          <div className="adm-form-section-title">{'\ud83c\udfe2'} Client & Invoice Details</div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>Customer Name (M/s.) *</label><input required className="adm-input" placeholder="Company / Party Name" value={f.customer_name} onChange={e => setF({...f, customer_name: e.target.value})} /></div>
            <div className="adm-form-group"><label>Party GSTIN</label><input className="adm-input" placeholder="29XXXXX..." value={f.party_gstin} onChange={e => setF({...f, party_gstin: e.target.value})} /></div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>Select Vehicle</label><select className="adm-input" value={f.selected_car_id} onChange={e => setF({...f, selected_car_id: e.target.value})}><option value="">-- Select Vehicle --</option>{cars.map(c => <option key={c.id} value={c.id}>{c.name} ({c.category})</option>)}</select></div>
            <div className="adm-form-group"><label>Vehicle No. / Details</label><input className="adm-input" placeholder='e.g. "05 vehicles" or KA-01-XX-1234' value={f.vehicle_details} onChange={e => setF({...f, vehicle_details: e.target.value})} /></div>
            <div className="adm-form-group"><label>Total Working Days</label><input className="adm-input" placeholder='e.g. "31"' value={f.working_days_text} onChange={e => setF({...f, working_days_text: e.target.value})} /></div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>Opening Date *</label><input required type="date" className="adm-input" value={f.opening_date} onChange={e => setF({...f, opening_date: e.target.value})} /></div>
            <div className="adm-form-group"><label>Closing Date *</label><input required type="date" className="adm-input" value={f.closing_date} onChange={e => setF({...f, closing_date: e.target.value})} /></div>
          </div>

          <div className="adm-form-section-title">{'\ud83d\udcb0'} Core Service Rates</div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>Vehicle Quantity</label><input type="number" className="adm-input" value={f.vehicle_qty} onChange={e => setF({...f, vehicle_qty: e.target.value})} /></div>
            <div className="adm-form-group"><label>Avg Monthly Rate / Vehicle ({'\u20b9'})</label><input type="number" className="adm-input" placeholder="e.g. 65967" value={f.avg_monthly_rate} onChange={e => setF({...f, avg_monthly_rate: e.target.value})} /></div>
          </div>

          <div className="adm-form-section-title">{'\ud83d\udccb'} Extra Charges</div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>Extra KMs Driven</label><input type="number" className="adm-input" placeholder="e.g. 7339" value={f.extra_kms} onChange={e => setF({...f, extra_kms: e.target.value})} /></div>
            <div className="adm-form-group"><label>Rate per Extra KM ({'\u20b9'})</label><input type="number" className="adm-input" placeholder="e.g. 12" value={f.extra_km_rate} onChange={e => setF({...f, extra_km_rate: e.target.value})} /></div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>Driver Extra Duty Hours</label><input type="number" className="adm-input" placeholder="e.g. 120" value={f.duty_hours} onChange={e => setF({...f, duty_hours: e.target.value})} /></div>
            <div className="adm-form-group"><label>Duty Rate per Hour ({'\u20b9'})</label><input type="number" className="adm-input" placeholder="e.g. 140" value={f.duty_rate} onChange={e => setF({...f, duty_rate: e.target.value})} /></div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>AC Charges ({'\u20b9'}) — Manual Flat Amount</label><input type="number" className="adm-input" placeholder="e.g. 5000" value={f.ac_charges} onChange={e => setF({...f, ac_charges: e.target.value})} /></div>
            <div className="adm-form-group"><label>Fastag / Toll Gate ({'\u20b9'}) — Non-Taxable</label><input type="number" className="adm-input" value={f.fastag} onChange={e => setF({...f, fastag: e.target.value})} /></div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>IGST Rate (%) — Default 0</label><input type="number" step="0.5" className="adm-input" placeholder="0" value={f.igst_rate} onChange={e => setF({...f, igst_rate: e.target.value})} /></div>
          </div>
          <div className="adm-form-row">
            <div className="adm-form-group" style={{ flex: 2 }}><label>Trip Description</label><textarea className="adm-input" rows="2" placeholder="Description for the bill..." value={f.trip_description} onChange={e => setF({...f, trip_description: e.target.value})} style={{ resize: 'vertical', minHeight: '44px' }}></textarea></div>
          </div>

          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1.2rem', marginTop: '1rem' }}>
            <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#10b981', marginBottom: '.8rem', letterSpacing: '.5px' }}>CHARGES BREAKDOWN</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.4rem 1rem', fontSize: '.9rem' }}>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Base Rent ({f.avg_monthly_rate || 0} x {f.vehicle_qty || 1})</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(baseRent)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Extra KMs ({f.extra_kms || 0} x {f.extra_km_rate || 0})</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(extraKmAmt)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Driver Duty ({f.duty_hours || 0} x {f.duty_rate || 0})</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(dutyAmt)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>AC Charges</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(acAmt)}</span>
              <div style={{ gridColumn: '1/-1', borderTop: '1px solid rgba(255,255,255,.1)', margin: '.3rem 0' }}></div>
              <span style={{ fontWeight: 700 }}>Taxable Subtotal</span><span style={{ fontWeight: 800, textAlign: 'right' }}>{fmtINR(taxableSubtotal)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>CGST (9%)</span><span style={{ textAlign: 'right' }}>{fmtINR(cgst)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>SGST (9%)</span><span style={{ textAlign: 'right' }}>{fmtINR(sgst)}</span>
              {igstRate > 0 && <><span style={{ color: 'rgba(255,255,255,.5)' }}>IGST ({igstRate}%)</span><span style={{ textAlign: 'right' }}>{fmtINR(igstAmt)}</span></>}
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Fastag / Toll (Non-Taxable)</span><span style={{ textAlign: 'right' }}>{fmtINR(fastagAmt)}</span>
            </div>
            <div style={{ borderTop: '2px solid #10b981', marginTop: '.8rem', paddingTop: '.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>ESTIMATED GRAND TOTAL</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{fmtINR(grandTotal)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary">Generate GST Bill 2</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceFormModal({ onClose, onSuccess, defaultCarId, cars = [] }) {
  const [f, setF] = useState({
    name: '', mobile: '', vehicle_no: '',
    place_from: '', place_to: '',
    opening_date: '', closing_date: '',
    working_days: '', start_km: '', end_km: '',
    driver_batta: '', toll_gate: '',
    ac_rate_per_km: '', amount_for_days: '',
    advance: '',
    igst_rate: '',
    selected_car_id: defaultCarId || ''
  });

  // Auto-calculate total km and AC charges
  const sKm = parseInt(f.start_km) || 0;
  const eKm = parseInt(f.end_km) || 0;
  const totalKm = eKm > sKm ? eKm - sKm : 0;
  const acRate = parseFloat(f.ac_rate_per_km) || 0;
  const acCharges = acRate * totalKm;
  const amtDays = parseFloat(f.amount_for_days) || 0;
  const batta = parseFloat(f.driver_batta) || 0;
  const toll = parseFloat(f.toll_gate) || 0;
  const igstRateNon = parseFloat(f.igst_rate) || 0;
  const igstAmtNon = Math.round((amtDays + acCharges) * igstRateNon) / 100;
  const total = amtDays + batta + toll + acCharges + igstAmtNon;
  const advance = parseFloat(f.advance) || 0;
  const balance = total - advance;

  const fmtINR = (v) => '\u20b9' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.name) { toast('Customer name is required', 'error'); return; }
    if (!f.opening_date || !f.closing_date) { toast('Opening and Closing dates required', 'error'); return; }

    const payload = {
      customer_name: f.name,
      customer_phone: f.mobile || '0000000000',
      car_id: parseInt(f.selected_car_id) || defaultCarId || 1,
      bill_type: 'NON_GST',
      company_name: '',
      party_gstin: '',
      vehicle_no_override: f.vehicle_no,
      place_from: f.place_from,
      place_to: f.place_to,
      start_date: f.opening_date,
      end_date: f.closing_date,
      working_days: parseInt(f.working_days) || 0,
      start_km: parseInt(f.start_km) || 0,
      end_km: parseInt(f.end_km) || 0,
      km_limit_per_day: 300,
      qty_avg_per_month: 1,
      avg_monthly_rate_paise: 0,
      amount_for_days_paise: Math.round(amtDays * 100),
      extra_km_rate_paise: Math.round(acRate * 100),
      extra_km_qty: 0,
      driver_extra_duty_hours: 0,
      driver_extra_duty_rate_paise: 0,
      driver_batta_paise: Math.round(batta * 100),
      toll_gate_paise: 0,
      fastag_paise: Math.round(toll * 100),
      advance_paid_paise: Math.round(advance * 100),
      cgst_rate: 0,
      sgst_rate: 0,
      trip_description: '',
      line_items: []
    };

    try {
      const r = await fetch('/api/admin/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        toast('Non-GST Cash Bill generated!', 'success');
        onSuccess();
      } else {
        const d = await r.json();
        toast(d.error || 'Failed to generate', 'error');
      }
    } catch { toast('Network error', 'error'); }
  };

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: '680px' }}>
        <div className="adm-modal-hd">
          <h3>Non-GST Cash Bill</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>

          <div className="adm-form-row">
            <div className="adm-form-group" style={{ flex: 2 }}><label>Name *</label><input required className="adm-input" placeholder="Customer / Party Name" value={f.name} onChange={e => setF({...f, name: e.target.value})} /></div>
            <div className="adm-form-group"><label>Mobile</label><input className="adm-input" placeholder="Optional" value={f.mobile} onChange={e => setF({...f, mobile: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Select Vehicle</label><select className="adm-input" value={f.selected_car_id} onChange={e => setF({...f, selected_car_id: e.target.value})}><option value="">-- Select Vehicle --</option>{cars.map(c => <option key={c.id} value={c.id}>{c.name} ({c.category})</option>)}</select></div>
            <div className="adm-form-group"><label>Vehicle No</label><input className="adm-input" placeholder="e.g. KA-25-M-1234" value={f.vehicle_no} onChange={e => setF({...f, vehicle_no: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>From</label><input className="adm-input" placeholder="Place" value={f.place_from} onChange={e => setF({...f, place_from: e.target.value})} /></div>
            <div className="adm-form-group"><label>To</label><input className="adm-input" placeholder="Place" value={f.place_to} onChange={e => setF({...f, place_to: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Opening Date *</label><input required type="date" className="adm-input" value={f.opening_date} onChange={e => setF({...f, opening_date: e.target.value})} /></div>
            <div className="adm-form-group"><label>Closing Date *</label><input required type="date" className="adm-input" value={f.closing_date} onChange={e => setF({...f, closing_date: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Working Days</label><input type="number" className="adm-input" value={f.working_days} onChange={e => setF({...f, working_days: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Starting Km</label><input type="number" className="adm-input" value={f.start_km} onChange={e => setF({...f, start_km: e.target.value})} /></div>
            <div className="adm-form-group"><label>Closing Km</label><input type="number" className="adm-input" value={f.end_km} onChange={e => setF({...f, end_km: e.target.value})} /></div>
            <div className="adm-form-group">
              <label>Total Km</label>
              <div className="adm-input" style={{ background: 'rgba(255,255,255,0.03)', cursor: 'default', fontWeight: 800, color: '#60a5fa' }}>{totalKm || '\u2014'}</div>
            </div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>Driver Batta ({'\u20b9'})</label><input type="number" className="adm-input" placeholder="0" value={f.driver_batta} onChange={e => setF({...f, driver_batta: e.target.value})} /></div>
            <div className="adm-form-group"><label>Toll Gate Amount ({'\u20b9'})</label><input type="number" className="adm-input" placeholder="0" value={f.toll_gate} onChange={e => setF({...f, toll_gate: e.target.value})} /></div>
          </div>

          <div className="adm-form-row">
            <div className="adm-form-group"><label>AC / Non-AC Rate ({'\u20b9'}/km) — Optional</label><input type="number" step="0.5" className="adm-input" placeholder="e.g. 11 for AC, 6 for Non-AC, leave blank if not applicable" value={f.ac_rate_per_km} onChange={e => setF({...f, ac_rate_per_km: e.target.value})} /></div>
            <div className="adm-form-group"><label>IGST Rate (%) — Default 0</label><input type="number" step="0.5" className="adm-input" placeholder="0" value={f.igst_rate} onChange={e => setF({...f, igst_rate: e.target.value})} /></div>
          </div>
          {acRate > 0 && totalKm > 0 && (
            <div style={{ fontSize: '.8rem', color: '#fbbf24', marginBottom: '.75rem', paddingLeft: '.25rem' }}>
              AC/Non-AC: {totalKm} km x {'\u20b9'}{acRate}/km = {fmtINR(acCharges)}
            </div>
          )}

          <div className="adm-form-section-title">{'\ud83d\udcb0'} Amount</div>
          <div className="adm-form-row">
            <div className="adm-form-group"><label>Amount for {f.working_days || 'X'} Days ({'\u20b9'}) *</label><input required type="number" className="adm-input highlight" placeholder="Main rental amount" value={f.amount_for_days} onChange={e => setF({...f, amount_for_days: e.target.value})} /></div>
            <div className="adm-form-group"><label>Advance Received ({'\u20b9'})</label><input type="number" className="adm-input" placeholder="0" value={f.advance} onChange={e => setF({...f, advance: e.target.value})} /></div>
          </div>

          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px', padding: '1.2rem', marginTop: '.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.4rem 1rem', fontSize: '.9rem' }}>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Amount for Days</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(amtDays)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Driver Batta</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(batta)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Toll Gate</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(toll)}</span>
              {acRate > 0 && (<><span style={{ color: 'rgba(255,255,255,.5)' }}>AC/Non-AC ({totalKm} km x {'\u20b9'}{acRate})</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(acCharges)}</span></>)}
              {igstRateNon > 0 && <><span style={{ color: 'rgba(255,255,255,.5)' }}>IGST ({igstRateNon}%)</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtINR(igstAmtNon)}</span></>}
              <div style={{ gridColumn: '1/-1', borderTop: '1px solid rgba(255,255,255,.1)', margin: '.3rem 0' }}></div>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>Total</span><span style={{ fontWeight: 900, textAlign: 'right', fontSize: '1.1rem', color: '#60a5fa' }}>{fmtINR(total)}</span>
              <span style={{ color: 'rgba(255,255,255,.5)' }}>Advance</span><span style={{ textAlign: 'right' }}>{fmtINR(advance)}</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#34d399' }}>Balance</span><span style={{ fontWeight: 900, textAlign: 'right', fontSize: '1.1rem', color: '#34d399' }}>{fmtINR(balance)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary">Generate Cash Bill</button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(sessionStorage.getItem('benaka_admin_auth') === 'true');
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAuthorized) return;
    fetch('/api/admin/stats', { headers: { Authorization: TOKEN } })
      .then(r => r.json())
      .then(d => setPendingCount(d.pendingBookings || 0))
      .catch(() => {});
  }, [page, isAuthorized]);

  if (!isAuthorized) {
    return (
      <>
        <ToastHub />
        <LoginScreen onLogin={() => setIsAuthorized(true)} />
      </>
    );
  }

  const logout = () => {
    sessionStorage.removeItem('benaka_admin_auth');
    setIsAuthorized(false);
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { key: 'bookings', label: 'Bookings', icon: <BookOpen size={17} />, badge: pendingCount },
    { key: 'vehicles', label: 'Vehicles', icon: <Car size={17} /> },
    { key: 'billing', label: 'Billing Engine', icon: <Receipt size={17} /> },
    { key: 'revenue', label: 'Revenue Tab', icon: <CreditCard size={17} /> },
    { key: 'reports', label: 'Reports', icon: <BarChart2 size={17} /> },
  ];

  const titles = {
    dashboard: ['Dashboard', 'Welcome back to BENAKA TRAVELS'],
    bookings: ['Bookings', 'Manage all customer reservations'],
    vehicles: ['Fleet Management', 'Add, edit, and manage your vehicles'],
    revenue: ['Revenue & Accounting', 'Transaction and payments tracker'],
    billing: ['Advanced Billing', 'Invoicing and CRM suite'],
    reports: ['Reports & Analytics', 'Business performance overview'],
    settings: ['Settings', 'Configure your admin panel'],
    support: ['Support', 'Help and FAQ'],
  };

  return (
    <div className="adm-layout">
      <ToastHub />

      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-brand-name">🚗 <span className="dot">BENAKA</span> ADMIN</div>
          <div className="adm-brand-sub">Fleet Management System</div>
        </div>
        <nav className="adm-nav">
          <div className="adm-nav-section">Main</div>
          {navItems.map(item => (
            <button key={item.key} className={`adm-nav-item ${page === item.key ? 'active' : ''}`} onClick={() => { setPage(item.key); setSidebarOpen(false); }}>
              {item.icon} {item.label}
              {item.badge > 0 && <span className="adm-nav-badge">{item.badge}</span>}
            </button>
          ))}
          <div className="adm-nav-section">System</div>
          <button className={`adm-nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => { setPage('settings'); setSidebarOpen(false); }}><Settings size={17} /> Settings</button>
          <button className={`adm-nav-item ${page === 'support' ? 'active' : ''}`} onClick={() => { setPage('support'); setSidebarOpen(false); }}><HelpCircle size={17} /> Support</button>
          <button className="adm-nav-item" style={{ marginTop: 'auto', color: '#ef4444' }} onClick={logout}><XCircle size={17} /> Logout</button>
        </nav>
        <div className="adm-sidebar-footer">
          <Link to="/" className="adm-user-card">
            <div className="adm-avatar">BT</div>
            <div><div className="adm-user-name">BENAKA TRAVELS</div><div className="adm-user-role">Administrator</div></div>
          </Link>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-topbar">
          <div className="adm-topbar-left"><h2>{titles[page]?.[0]}</h2><p>{titles[page]?.[1]}</p></div>
          <div className="adm-topbar-right">
            <button className="adm-icon-btn" onClick={() => setPage('bookings')}>
              <Bell size={16} />
              {pendingCount > 0 && <span className="adm-notif-dot" />}
            </button>
            <Link to="/" className="adm-icon-btn"><Home size={16} /></Link>
            <div className="adm-avatar">BT</div>
          </div>
        </div>
        <div className="adm-content">
          {page === 'dashboard' && <DashboardPage setPage={setPage} />}
          {page === 'bookings' && <BookingsPage />}
          {page === 'vehicles' && <VehiclesPage />}
          {page === 'revenue' && <RevenuePage />}
          {page === 'billing' && <BillingEnginePage />}
          {page === 'reports' && <ReportsPage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'support' && <SupportPage />}
        </div>
      </main>

      <button className="adm-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }} />}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pass === 'benakaAdmin2026') {
      sessionStorage.setItem('benaka_admin_auth', 'true');
      onLogin();
    } else {
      setErr(true);
      toast('Invalid Admin Password', 'error');
      setTimeout(() => setErr(false), 2000);
    }
  };

  return (
    <div className="adm-login-wrap" style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: '#0a0a0b', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div className="adm-login-card" style={{ 
        width: '100%', maxWidth: '400px', padding: '3rem', background: '#111113', 
        borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🚗</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>BENAKA ADMIN</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>Secure Fleet Management Access</p>
        
        <form onSubmit={handleLogin}>
          <div className="adm-form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Password</label>
            <input 
              type="password" 
              className={`adm-input ${err ? 'err' : ''}`} 
              autoFocus 
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              style={{ padding: '0.875rem 1rem', fontSize: '1rem', letterSpacing: '0.1em' }}
            />
          </div>
          <button type="submit" className="adm-btn adm-btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}>
            Unlock Dashboard
          </button>
        </form>
        
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textDecoration: 'none' }}>← Return to Homepage</Link>
        </div>
      </div>
    </div>
  );
}
