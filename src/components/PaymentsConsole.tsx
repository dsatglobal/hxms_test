import React, { useState } from 'react';
import { Invoice, PaymentRecord } from '../types';
import { DollarSign, Plus, CheckCircle, FileText, Sliders, Receipt, RefreshCw } from 'lucide-react';

interface PaymentsConsoleProps {
  invoices: Invoice[];
  payments: PaymentRecord[];
  onAddPayment: (r: PaymentRecord) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: 'paid' | 'unpaid') => void;
}

export default function PaymentsConsole({
  invoices,
  payments,
  onAddPayment,
  onUpdateInvoiceStatus
}: PaymentsConsoleProps) {

  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Credit Card' | 'Cheque' | 'GIRO'>('Bank Transfer');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');

  // Filtering
  const [searchInvoice, setSearchInvoice] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !refNo.trim()) {
      alert('Invoice assignment and Bank Remittance reference number are required.');
      return;
    }

    if (!selectedInvoice) return;

    // Record payment receipt
    onAddPayment({
      id: `pay-${Date.now()}`,
      invoiceId: selectedInvoice.id,
      invoiceNo: selectedInvoice.invoiceNo,
      customerId: selectedInvoice.customerId,
      amountPaid: selectedInvoice.totalAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      refNo: refNo.trim().toUpperCase(),
      notes: notes.trim()
    });

    // Mark invoice paid
    onUpdateInvoiceStatus(selectedInvoice.id, 'paid');

    setSelectedInvoiceId('');
    setRefNo('');
    setNotes('');
    setShowAddForm(false);
    alert('Invoice Settle-Off Receipt posted. Payments accounts ledger updated.');
  };

  const filteredPayments = payments.filter(p => {
    const matchInvoice = p.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase());
    const matchMethod = filterMethod === 'all' || p.paymentMethod === filterMethod;
    return matchInvoice && matchMethod;
  });

  // Filter out already settled invoices for form dropdown
  const outstandingInvoices = invoices.filter(i => i.status === 'unpaid');

  return (
    <div id="payments-console-container" className="space-y-6">

      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 text-xs">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <Receipt className="text-blue-600 w-5 h-5 animate-pulse" /> Payments &amp; Settle Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Post payment clearance receipts against outstanding debit invoices. Reconcile bank transmissions and GIRO codes.
          </p>
        </div>

        <button
          id="btn-receive-payment"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Receive Cash Receipt
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">

        {/* Filters and Help Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5 text-xs">
              <Sliders className="w-3.5 h-3.5 text-slate-400" /> Filter Ledger
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">INVOICE NO SEARCH</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">METHOD</label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 font-medium"
                >
                  <option value="all">-- All Methods --</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Credit Card">Corp Credit Card</option>
                  <option value="Cheque">Standard Cheque</option>
                  <option value="GIRO">Automatic GIRO</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-slate-500 leading-normal text-[11px] space-y-1.5">
            <strong>Debit Status Reconcile:</strong> Settling an invoice automatically reflects as "PAID" on the Billing &amp; Invoices console, releasing credit-line buffers for matched customers.
          </div>
        </div>

        {/* Form and payments ledger list */}
        <div className="lg:col-span-3 space-y-6">

          {showAddForm && (
            <div id="payment-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-blue-600 font-mono tracking-wide uppercase">
                  Log Remittance / Clearance Record
                </span>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 font-bold">Cancel</button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <div className="space-y-1">
                  <label className="block">Outstanding Unpaid Invoice <span className="text-red-500">*</span></label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-extrabold"
                  >
                    <option value="">-- Choose Outstanding Invoice --</option>
                    {outstandingInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNo} (Total Due: ${inv.totalAmount}.00)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block">Remittance Mode Type</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-bold"
                  >
                    <option value="Bank Transfer">Bank Wire Transfer</option>
                    <option value="Credit Card">Corporation Credit Card</option>
                    <option value="Cheque">Direct Clearing Cheque</option>
                    <option value="GIRO">Pre-Authorized Interbank GIRO</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block">Clearing / Reference Wire Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. wire-tt-8841092"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">Audit Note/Comment</label>
                  <input
                    type="text"
                    placeholder="Verified at Citi Clearing Center..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800"
                  />
                </div>

                {selectedInvoice && (
                  <div className="md:col-span-2 bg-slate-50 border border-slate-200/60 p-3 rounded text-[11px] text-slate-500 text-slate-600 leading-relaxed font-mono">
                    <span className="font-bold text-slate-800">Clearance Invoice Info:</span>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>Invoice Number: {selectedInvoice.invoiceNo}</li>
                      <li>Customer Reference Code: {selectedInvoice.customerId}</li>
                      <li>Calculated Base Remit: ${selectedInvoice.subTotal}.00</li>
                      <li>Tax Surcharges: ${selectedInvoice.taxAmount}.00</li>
                      <li>Net Settle Out Amount: ${selectedInvoice.totalAmount}.00</li>
                    </ul>
                  </div>
                )}

                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition shadow-xs text-xs"
                  >
                    Record &amp; Clear Balance
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Clearing Receipts list table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <table className="w-full border-collapse text-left text-xs bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">CLEARING DATE</th>
                  <th className="py-3 px-4">SETTLED INVOICE</th>
                  <th className="py-3 px-4">METHOD</th>
                  <th className="py-3 px-4">BANK WIRE REF NO</th>
                  <th className="py-3 px-4">AMOUNT DISCHARGED</th>
                  <th className="py-3 px-4">AUDIT STATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-mono italic">No cleared transaction receipts posted in system context yet.</td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-650">{p.paymentDate}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-blue-600 uppercase hover:underline cursor-pointer">{p.invoiceNo}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] border border-slate-100 bg-slate-50 text-slate-600 font-bold uppercase">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-mono font-bold uppercase">{p.refNo}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-green-700 text-[13px]">+${p.amountPaid}.00</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3 text-green-600" /> RECONCILED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DDL Schema Hint inside Payments config */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs space-y-2 border border-slate-950">
            <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">PostgreSQL Compatibility Mapping</div>
            <p className="text-slate-400">
              Payments receipts map into the <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">finance_payments</code> mapping table. This enforces a constraint linked to the parent invoices: <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">FOREIGN KEY (invoice_id) REFERENCES custom_invoices(id) ON DELETE CASCADE</code>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
