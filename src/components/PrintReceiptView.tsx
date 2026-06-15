/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Customer payment receipt — print-optimized A4 layout.
 */

import React from 'react';
import { Printer, X } from 'lucide-react';
import { CustomerPayment, Customer, Invoice, Tenant, InvoiceSettings } from '../types';

interface PrintReceiptViewProps {
  payment: CustomerPayment;
  customer: Customer | undefined;
  invoices: Invoice[];
  tenant: Tenant;
  invoiceSettings: InvoiceSettings | undefined;
  onClose: () => void;
}

export default function PrintReceiptView({
  payment, customer, invoices, tenant, invoiceSettings, onClose,
}: PrintReceiptViewProps) {
  const currencySymbol = payment.currency === 'INR' ? '₹' : payment.currency === 'AED' ? 'AED ' : payment.currency + ' ';
  const fmt = (n: number) => currencySymbol + n.toLocaleString('en-IN');
  const methodLabel: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    cash: 'Cash',
    online: 'Online Payment',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      {/* Print controls — hidden when printing */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg shadow border border-slate-200"
        >
          <X className="w-4 h-4" /> Close
        </button>
      </div>

      {/* A4 document */}
      <div
        id="print-receipt"
        className="bg-white w-full shadow-2xl"
        style={{ maxWidth: 794, minHeight: 1123, padding: '48px 56px', fontFamily: 'Arial, sans-serif', color: '#0f172a' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 24, marginBottom: 32 }}>
          <div>
            <div style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: tenant.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 22, marginBottom: 8 }}>
              {tenant.name.charAt(0)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{tenant.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{tenant.subdomain}.hms-saas.com</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, color: '#0f172a' }}>PAYMENT RECEIPT</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>{payment.receiptNo}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Date: {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* From / Received From */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 6 }}>From</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{tenant.name}</div>
            {invoiceSettings && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>
                Bank: {invoiceSettings.bankName}<br />
                A/C: {invoiceSettings.bankAccountNo}<br />
                SWIFT: {invoiceSettings.bankSwiftCode}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 6 }}>Received From</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{customer?.name ?? '—'}</div>
            {customer && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>
                Tax ID: {customer.taxId}<br />
                {customer.address}
              </div>
            )}
          </div>
        </div>

        {/* Payment details box */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px', marginBottom: 32 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 12 }}>Payment Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Amount Received</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>{fmt(payment.totalAmount)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Payment Method</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{methodLabel[payment.paymentMethod] ?? payment.paymentMethod}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Reference No</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>{payment.referenceNo}</div>
            </div>
          </div>
        </div>

        {/* Invoice allocation table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 12 }}>Invoice Allocation</div>
          {payment.allocations.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Invoice No', 'Invoice Date', 'Invoice Amount', 'Amount Allocated'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payment.allocations.map((alloc, i) => {
                  const inv = invoices.find(v => v.id === alloc.invoiceId);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{alloc.invoiceNo}</td>
                      <td style={{ padding: '8px 8px', color: '#64748b' }}>{inv ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td style={{ padding: '8px 8px' }}>{inv ? fmt(inv.totalAmount) : '—'}</td>
                      <td style={{ padding: '8px 8px', fontWeight: 700 }}>{fmt(alloc.allocatedAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #0f172a' }}>
                  <td colSpan={3} style={{ padding: '10px 8px', fontWeight: 700, fontSize: 13 }}>Total Allocated</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, fontSize: 15, color: '#16a34a' }}>
                    {fmt(payment.allocations.reduce((s, a) => s + a.allocatedAmount, 0))}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ padding: '4px 8px', fontWeight: 700, fontSize: 12 }}>Balance</td>
                  <td style={{ padding: '4px 8px', fontWeight: 700, fontSize: 13 }}>
                    {fmt(payment.totalAmount - payment.allocations.reduce((s, a) => s + a.allocatedAmount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ padding: '12px 8px', fontSize: 12, color: '#f59e0b', fontStyle: 'italic' }}>
              Payment received but not yet allocated to any invoice.
            </div>
          )}
        </div>

        {/* Notes */}
        {payment.notes && (
          <div style={{ marginBottom: 32, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
            <strong>Notes:</strong> {payment.notes}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.8 }}>
            This is a system-generated receipt.<br />
            No signature required for electronic records.<br />
            {invoiceSettings?.footerNote}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, marginTop: 40, width: 160, fontSize: 10, color: '#64748b' }}>Authorised Signatory</div>
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } #print-receipt { box-shadow: none; max-width: 100%; } }`}</style>
    </div>
  );
}
