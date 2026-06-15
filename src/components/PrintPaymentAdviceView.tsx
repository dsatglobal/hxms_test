/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vendor payment advice — print-optimized A4 layout.
 */

import React from 'react';
import { Printer, X } from 'lucide-react';
import { VendorPayment, Vendor, Tenant, InvoiceSettings } from '../types';

interface PrintPaymentAdviceViewProps {
  payment: VendorPayment;
  vendor: Vendor | undefined;
  tenant: Tenant;
  invoiceSettings: InvoiceSettings | undefined;
  onClose: () => void;
}

export default function PrintPaymentAdviceView({
  payment, vendor, tenant, invoiceSettings, onClose,
}: PrintPaymentAdviceViewProps) {
  const currencySymbol = payment.currency === 'INR' ? '₹' : payment.currency === 'AED' ? 'AED ' : payment.currency + ' ';
  const fmt = (n: number) => currencySymbol + n.toLocaleString('en-IN');

  const statusColor = payment.status === 'paid' ? '#16a34a' : payment.status === 'approved' ? '#2563eb' : '#f59e0b';
  const statusLabel = payment.status === 'paid' ? 'PAID' : payment.status === 'approved' ? 'APPROVED — PENDING PAYMENT' : 'PENDING APPROVAL';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      {/* Print controls */}
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
        id="print-advice"
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
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1, color: '#0f172a' }}>PAYMENT ADVICE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#7c3aed', marginTop: 4 }}>{payment.adviceNo}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Date: {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 20, background: statusColor + '20', border: `1px solid ${statusColor}`, color: statusColor, fontSize: 10, fontWeight: 700 }}>
              {statusLabel}
            </div>
          </div>
        </div>

        {/* From / To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 6 }}>Paying Party</div>
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
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 6 }}>Payable To</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{vendor?.vendorName ?? '—'}</div>
            {vendor && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>
                {vendor.contactPerson} · {vendor.phone}<br />
                Tax ID: {vendor.taxId}<br />
                {vendor.address}
              </div>
            )}
          </div>
        </div>

        {/* Preamble */}
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 16, fontStyle: 'italic' }}>
          In settlement of the following completed transport services:
        </div>

        {/* Trip line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              {['Trip ID', 'Job No', 'Service Description', 'Completion', 'Buy Rate', 'Surcharges', 'Total'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '7px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payment.lineItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontSize: 10, color: '#7c3aed' }}>{item.tripId}</td>
                <td style={{ padding: '8px 8px', fontFamily: 'monospace', fontSize: 10, fontWeight: 700 }}>{item.jobNo}</td>
                <td style={{ padding: '8px 8px', color: '#475569', maxWidth: 200 }}>{item.description}</td>
                <td style={{ padding: '8px 8px', color: '#94a3b8', fontSize: 10 }}>—</td>
                <td style={{ padding: '8px 8px' }}>{fmt(item.buyRate)}</td>
                <td style={{ padding: '8px 8px', color: '#f59e0b' }}>{fmt(item.surchargesBuy)}</td>
                <td style={{ padding: '8px 8px', fontWeight: 700 }}>{fmt(item.totalPayable)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #0f172a' }}>
              <td colSpan={6} style={{ padding: '10px 8px', fontWeight: 700, fontSize: 13, textAlign: 'right' }}>Total Payable</td>
              <td style={{ padding: '10px 8px', fontWeight: 900, fontSize: 16, color: '#7c3aed' }}>{fmt(payment.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={{ padding: '4px 8px', fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                Note: No tax deducted at source — subcontractor is responsible for their own tax obligations.
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment details (if paid) */}
        {payment.status === 'paid' && payment.paymentDate && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#94a3b8', marginBottom: 8 }}>Payment Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Method</div>
                <div style={{ fontWeight: 600 }}>{payment.paymentMethod ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Reference</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{payment.referenceNo ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Date Paid</div>
                <div style={{ fontWeight: 600 }}>{new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        )}

        {/* Pending note */}
        {payment.status === 'approved' && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: '#1d4ed8', fontStyle: 'italic' }}>
            Payment will be processed upon approval. Please retain this advice for your records.
          </div>
        )}

        {payment.notes && (
          <div style={{ marginBottom: 24, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
            <strong>Notes:</strong> {payment.notes}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.8 }}>
            Please retain this advice for your records.<br />
            Queries: {tenant.subdomain}@hms-saas.com
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, marginTop: 56, width: 180, fontSize: 10, color: '#64748b' }}>Authorised Signatory</div>
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { margin: 0; } #print-advice { box-shadow: none; max-width: 100%; } }`}</style>
    </div>
  );
}
