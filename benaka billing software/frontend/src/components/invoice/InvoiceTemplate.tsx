import { forwardRef } from 'react';
import { formatPaise, formatDate, numberToWords, daysBetween } from '../../lib/utils';

interface InvoiceData {
  id: string;
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
    description: string;
    amount_paise: number;
  }>;
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice }, ref) => {
    const cgst = Math.round(invoice.tax_paise / 2);
    const sgst = invoice.tax_paise - cgst;
    const balance = invoice.total_amount_paise - invoice.advance_paid_paise;

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          color: '#1a1a2e',
          background: '#ffffff',
          fontSize: '12px',
          lineHeight: '1.5',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '3px solid #10b981', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
              BENAKA RENTALS
            </h1>
            <p style={{ fontSize: '11px', color: '#666', margin: '2px 0' }}>
              Premium Car Rental Services
            </p>
            <p style={{ fontSize: '10px', color: '#888', margin: '2px 0' }}>
              123, MG Road, Bengaluru, Karnataka - 560001
            </p>
            <p style={{ fontSize: '10px', color: '#888', margin: '2px 0' }}>
              Phone: +91 98765 43210 | Email: info@benakarentals.in
            </p>
            <p style={{ fontSize: '10px', color: '#888', margin: '2px 0' }}>
              GSTIN: 29XXXXX0000X1ZX
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px 0' }}>
              TAX INVOICE
            </h2>
            <table style={{ marginLeft: 'auto', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '2px 12px 2px 0', color: '#888', textAlign: 'right' }}>Invoice No:</td>
                  <td style={{ padding: '2px 0', fontWeight: '600', fontFamily: 'monospace' }}>{invoice.id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 12px 2px 0', color: '#888', textAlign: 'right' }}>Date:</td>
                  <td style={{ padding: '2px 0' }}>{formatDate(invoice.created_at)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 12px 2px 0', color: '#888', textAlign: 'right' }}>Status:</td>
                  <td style={{
                    padding: '2px 0',
                    fontWeight: '600',
                    color: invoice.status === 'Paid' ? '#10b981' : invoice.status === 'Unpaid' ? '#ef4444' : '#f59e0b'
                  }}>{invoice.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill To / Trip Details */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ flex: 1, padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Bill To</p>
            <p style={{ fontWeight: '600', fontSize: '14px', margin: '0 0 4px 0' }}>{invoice.client_name}</p>
            <p style={{ fontSize: '11px', color: '#555', margin: '2px 0' }}>📞 {invoice.client_phone}</p>
            {invoice.client_email && (
              <p style={{ fontSize: '11px', color: '#555', margin: '2px 0' }}>✉ {invoice.client_email}</p>
            )}
            {invoice.client_dl && (
              <p style={{ fontSize: '11px', color: '#555', margin: '2px 0' }}>DL: {invoice.client_dl}</p>
            )}
            {invoice.client_gstin && (
              <p style={{ fontSize: '11px', color: '#555', margin: '2px 0', fontFamily: 'monospace' }}>GSTIN: {invoice.client_gstin}</p>
            )}
          </div>

          <div style={{ flex: 1, padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Trip Details</p>
            <table style={{ fontSize: '11px', borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '2px 0', color: '#888', width: '40%' }}>Vehicle:</td>
                  <td style={{ padding: '2px 0', fontWeight: '500' }}>{invoice.car_model}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0', color: '#888' }}>Reg. No:</td>
                  <td style={{ padding: '2px 0', fontFamily: 'monospace', fontWeight: '500' }}>{invoice.registration_number}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0', color: '#888' }}>Period:</td>
                  <td style={{ padding: '2px 0' }}>{formatDate(invoice.start_date)} – {formatDate(invoice.end_date)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0', color: '#888' }}>Duration:</td>
                  <td style={{ padding: '2px 0' }}>{daysBetween(invoice.start_date, invoice.end_date)} day(s)</td>
                </tr>
                {invoice.start_km != null && invoice.end_km != null && (
                  <tr>
                    <td style={{ padding: '2px 0', color: '#888' }}>KM:</td>
                    <td style={{ padding: '2px 0' }}>{invoice.start_km} → {invoice.end_km} ({invoice.end_km - invoice.start_km} km)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#1a1a2e' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', borderRadius: '6px 0 0 0' }}>#</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Description</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: '#fff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', borderRadius: '0 6px 0 0' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px', color: '#888', fontSize: '11px' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontSize: '12px' }}>{item.description}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', fontWeight: '500' }}>{formatPaise(item.amount_paise)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <table style={{ width: '280px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 12px', fontSize: '12px', color: '#666' }}>Subtotal</td>
                <td style={{ padding: '6px 12px', fontSize: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{formatPaise(invoice.subtotal_paise)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 12px', fontSize: '12px', color: '#666' }}>CGST (9%)</td>
                <td style={{ padding: '6px 12px', fontSize: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{formatPaise(cgst)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 12px', fontSize: '12px', color: '#666' }}>SGST (9%)</td>
                <td style={{ padding: '6px 12px', fontSize: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{formatPaise(sgst)}</td>
              </tr>
              <tr style={{ borderTop: '2px solid #1a1a2e' }}>
                <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: '700' }}>Grand Total</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: '#10b981' }}>{formatPaise(invoice.total_amount_paise)}</td>
              </tr>
              {invoice.advance_paid_paise > 0 && (
                <>
                  <tr>
                    <td style={{ padding: '4px 12px', fontSize: '11px', color: '#10b981' }}>Advance Paid</td>
                    <td style={{ padding: '4px 12px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>-{formatPaise(invoice.advance_paid_paise)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: balance > 0 ? '#ef4444' : '#10b981' }}>Balance Due</td>
                    <td style={{ padding: '6px 12px', fontSize: '12px', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace', color: balance > 0 ? '#ef4444' : '#10b981' }}>{formatPaise(Math.max(0, balance))}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Amount in words */}
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Amount in Words</p>
          <p style={{ fontSize: '12px', fontWeight: '600', fontStyle: 'italic' }}>
            {numberToWords(invoice.total_amount_paise)}
          </p>
        </div>

        {/* Terms & Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Terms & Conditions</p>
            <ol style={{ fontSize: '10px', color: '#888', paddingLeft: '16px', margin: '0', lineHeight: '1.8' }}>
              <li>Payment is due on receipt unless otherwise agreed.</li>
              <li>Fuel charges are not included in the rental amount.</li>
              <li>Any damages to the vehicle will be charged separately.</li>
              <li>Cancellation charges may apply as per company policy.</li>
            </ol>
          </div>
          <div style={{ textAlign: 'center', marginLeft: '40px' }}>
            <div style={{ width: '180px', borderBottom: '1px solid #ccc', marginBottom: '8px', paddingBottom: '60px' }} />
            <p style={{ fontSize: '11px', fontWeight: '600' }}>Authorized Signatory</p>
            <p style={{ fontSize: '10px', color: '#888' }}>Benaka Rentals</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '30px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', color: '#aaa' }}>
            This is a computer-generated invoice. Thank you for choosing Benaka Rentals!
          </p>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
