/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Job, Quotation, Invoice, Tenant } from '../types';
import { FileSpreadsheet, DollarSign, Receipt, Printer, CheckCircle2, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BillingInvoiceConsoleProps {
  jobs: Job[];
  customers: Customer[];
  quotations: Quotation[];
  invoices: Invoice[];
  activeTenant: Tenant;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: 'paid' | 'unpaid') => void;
}

export default function BillingInvoiceConsole({
  jobs,
  customers,
  quotations,
  invoices,
  activeTenant,
  onAddInvoice,
  onUpdateInvoiceStatus
}: BillingInvoiceConsoleProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'invoiced'>('pending');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Completed jobs that are still pending invoicing
  const pendingJobs = useMemo(() => {
    return jobs.filter(j => j.status === 'completed' && (!j.billingStatus || j.billingStatus === 'pending'));
  }, [jobs]);

  const handleCreateInvoice = (job: Job) => {
    const custObj = customers.find(c => c.id === job.customerId);
    const quoteObj = quotations.find(q => q.id === job.quotationId);
    
    if (!custObj) return;

    // Determine Base Rate from Quotation pricing line if found
    let baseRate = job.scenario === 'IMP' ? 520 : job.scenario === 'EXP' ? 400 : 300;
    const rateLine = quoteObj?.rates.find(r => r.id === job.rateItemId);
    if (rateLine) {
      baseRate = rateLine.baseRate;
    }

    // Build itemized invoice list
    const items = [
      { description: `Base Container Haulage - ${job.scenario} (${job.containerSize})`, amount: baseRate }
    ];

    // Add Fuel FAF from quote surcharges if exists (often 45%)
    let fuelSurcharge = baseRate * 0.45;
    items.push({ description: `Fuel Adjustment Factor (FAF) - Contractual`, amount: Math.round(fuelSurcharge) });

    // Add Port Gate fee if applicable
    if (job.scenario === 'IMP' || job.scenario === 'EXP') {
      items.push({ description: `Port Terminal Gate Surcharge (HZP-Lift)`, amount: 80 });
    }

    // Add any extra incidentals recorded
    job.extraSurchargesIncurred.forEach(e => {
      items.push({ description: `Incidental: ${e.name} (${e.reason})`, amount: e.amount });
    });

    const subTotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxAmount = Math.round(subTotal * 0.08); // 8% sales VAT tax
    const totalAmount = subTotal + taxAmount;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      jobId: job.id,
      customerId: job.customerId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'unpaid',
      subTotal,
      taxAmount,
      totalAmount,
      items
    };

    onAddInvoice(newInvoice);
    alert(`INVOICE GENERATED SUCCESSFULLY! Link established to container receipt.`);
  };

  return (
    <div className="space-y-6" id="billing-invoices-module">
      
      {/* Tab Select */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600 w-5 h-5" /> Commercial Invoices &amp; Settlement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit container completion milestones, verify auxiliary detention incidentals, and issue legal customer invoices.
          </p>
        </div>

        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-md" style={{ background: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 rounded-sm text-xs font-semibold font-sans transition-all cursor-pointer ${
              activeTab === 'pending' 
                ? 'bg-blue-600 text-white font-bold shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending Invoicing ({pendingJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('invoiced')}
            className={`px-4 py-1.5 rounded-sm text-xs font-semibold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'invoiced' 
                ? 'bg-blue-600 text-white font-bold shadow-xs' 
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            Invoice Registry ({invoices.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'pending' ? (
          
          /* ================== PENDING INVOICING LIST ================== */
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {pendingJobs.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-lg p-12 text-center text-xs text-slate-400 font-sans italic">
                All completed container journeys has been successfully balanced and invoiced!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingJobs.map((job) => {
                  const custObj = customers.find(c => c.id === job.customerId);
                  return (
                    <div key={job.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600">{job.jobNo}</span>
                          <span className="text-[10px] bg-blue-50 border border-blue-200 rounded px-1.5 text-blue-700 font-mono font-bold">{job.scenario}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{custObj?.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Container No: {job.containerNo} ({job.containerSize}) • Completed on: 2026-05-25 09:12
                        </p>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end border-t border-slate-100 md:border-none pt-2.5 md:pt-0">
                        <div className="text-right">
                          <span className="text-[9px] font-mono text-slate-400 uppercase block">Extra Incidentals</span>
                          <span className={`text-[11px] font-bold ${job.extraSurchargesIncurred.length > 0 ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}>
                            {job.extraSurchargesIncurred.length} surcharges applied
                          </span>
                        </div>

                        <button
                          onClick={() => handleCreateInvoice(job)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs animate-pulse"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Issue Final Invoice
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          
          /* ================== INVOICE HISTORIC REGISTRY ================== */
          <motion.div
            key="registry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* List side */}
            <div className={`space-y-3 ${selectedInvoice ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans pb-2 border-b border-slate-200 mb-2">
                Published Invoices
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded text-xs text-slate-400 font-sans italic bg-white">
                  No published invoice entries available. Balance a completed job.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {invoices.map((inv) => {
                    const custObj = customers.find(c => c.id === inv.customerId);
                    const isFocus = selectedInvoice?.id === inv.id;
                    
                    return (
                      <div 
                        key={inv.id}
                        onClick={() => setSelectedInvoice(isFocus ? null : inv)}
                        className={`p-4 rounded-lg border text-xs cursor-pointer select-none transition-all flex justify-between items-center shadow-xs ${
                          isFocus 
                            ? 'bg-blue-50 border-blue-500' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{inv.invoiceNo}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${
                              inv.status === 'paid' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-700">{custObj?.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Issued: {inv.issueDate} • Due: {inv.dueDate}</div>
                        </div>

                        <div className="text-right font-mono font-bold text-slate-800 text-sm">
                          ${inv.totalAmount.toLocaleString()}.00
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Preview Sheet side */}
            {selectedInvoice && (
              <motion.div 
                className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-lg space-y-6 relative flex flex-col justify-between shadow-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div>
                  {/* Visual PDF Frame Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-800 font-sans uppercase tracking-tight">{activeTenant.name}</div>
                      <div className="text-[10px] text-slate-500 leading-normal font-sans pt-0.5">
                        Haulage Logistics Wharf Division<br />
                        Port Gate Wharf Sector B, Terminal 1
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-blue-600 font-sans font-bold text-xs uppercase">OFFICIAL INVOICE</div>
                      <div className="text-slate-500 font-mono text-[10px]">{selectedInvoice.invoiceNo}</div>
                    </div>
                  </div>

                  {/* Recipient details */}
                  <div className="grid grid-cols-2 gap-4 text-[11px] pt-4 leading-relaxed">
                    <div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Billed To:</div>
                      <strong className="text-slate-700">{customers.find(c => c.id === selectedInvoice.customerId)?.name}</strong>
                      <div className="text-slate-500">
                        {customers.find(c => c.id === selectedInvoice.customerId)?.address}<br />
                        Tax Identifier: {customers.find(c => c.id === selectedInvoice.customerId)?.taxId}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Invoice Terms:</div>
                      <div className="text-slate-600">
                        Date Released: {selectedInvoice.issueDate}<br />
                        Settle Windows: {customers.find(c => c.id === selectedInvoice.customerId)?.paymentTerms}<br />
                        Deadline: <span className="text-red-600 font-mono font-bold">{selectedInvoice.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line items table */}
                  <div className="mt-6">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase pb-2">
                          <th className="pb-1.5 px-2 bg-slate-50">Line Description</th>
                          <th className="text-right pb-1.5 px-2 bg-slate-50">Fee Amount (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {selectedInvoice.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-2">{it.description}</td>
                            <td className="text-right px-2 font-mono text-slate-800 font-bold">${it.amount}.00</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Balance aggregate */}
                  <div className="border-t border-slate-200 mt-4 pt-3 flex flex-col items-end text-xs space-y-1.5 leading-normal">
                    <div className="flex justify-between w-48 text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-mono text-slate-700">${selectedInvoice.subTotal}.00</span>
                    </div>
                    <div className="flex justify-between w-48 text-slate-500">
                      <span>VAT Sales Tax (8%):</span>
                      <span className="font-mono text-slate-700">${selectedInvoice.taxAmount}.00</span>
                    </div>
                    <div className="flex justify-between w-48 border-t border-slate-200 pt-1.5 font-bold text-slate-800">
                      <span>Final Total:</span>
                      <span className="font-mono text-blue-600 text-sm font-extrabold">${selectedInvoice.totalAmount}.00</span>
                    </div>
                  </div>
                </div>

                {/* Print and Change state actions */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs">
                  <div>
                    {selectedInvoice.status === 'unpaid' ? (
                      <button
                        onClick={() => onUpdateInvoiceStatus(selectedInvoice.id, 'paid')}
                        className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-[11px] transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Settled Paid
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateInvoiceStatus(selectedInvoice.id, 'unpaid')}
                        className="px-3.5 py-1.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-55 rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Revert to Unpaid
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => alert('Compiling high-resolution PDF download stream... Check system popup')}
                      className="p-1 px-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer font-bold"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" /> PDF
                    </button>
                    <button
                      onClick={() => alert('Sending print signals to Horizon dispatch spooler...')}
                      className="p-1 px-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-[11px] flex items-center gap-1 transition shadow-xs cursor-pointer font-bold"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" /> Print Invoice
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
