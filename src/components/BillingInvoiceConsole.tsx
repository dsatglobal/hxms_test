/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Job, Quotation, Invoice, Tenant, SurchargeRule, Region, User, InvoiceSettings } from '../types';
import { 
  Receipt, 
  FileText, 
  CheckCircle, 
  Send, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Search, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  Download, 
  Printer, 
  Plus, 
  Building, 
  X,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BillingInvoiceConsoleProps {
  jobs: Job[];
  customers: Customer[];
  quotations: Quotation[];
  invoices: Invoice[];
  activeTenant: Tenant;
  invoiceSettings: InvoiceSettings[];
  surcharges: SurchargeRule[];
  regions: Region[];
  currentUser: User;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoiceStatus: (
    invoiceId: string, 
    status: "draft" | "approved" | "sent" | "paid" | "unpaid" | "overdue" | "cancelled"
  ) => void;
  onUpdateInvoiceSettings: (settings: InvoiceSettings) => void;
}

export default function BillingInvoiceConsole({
  jobs = [],
  customers = [],
  quotations = [],
  invoices = [],
  activeTenant,
  invoiceSettings = [],
  surcharges = [],
  regions = [],
  currentUser,
  onAddInvoice,
  onUpdateInvoiceStatus,
  onUpdateInvoiceSettings
}: BillingInvoiceConsoleProps) {

  // Layout and view states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRegionTab, setSelectedRegionTab] = useState<string>('IN');

  // Left Panel Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Invoice / Edit Invoice Form State
  const [formJobId, setFormJobId] = useState('');
  const [formRegionId, setFormRegionId] = useState('IN');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30');
  const [formBaseRate, setFormBaseRate] = useState<number>(0);
  const [surchargeInputLines, setSurchargeInputLines] = useState<Array<{
    code: string;
    description: string;
    amount: number;
    billToCustomer: boolean;
  }>>([]);
  const [costInputLines, setCostInputLines] = useState<Array<{
    description: string;
    amount: number;
  }>>([]);

  // Payment Record Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Administrative / Finance Role check
  const isAdminOrFinance = useMemo(() => {
    return currentUser?.role === 'administrator' || currentUser?.role === 'billing';
  }, [currentUser]);

  const isCorpAdmin = useMemo(() => {
    return currentUser?.regionAccess?.includes('ALL') || currentUser?.role === 'administrator';
  }, [currentUser]);

  // Selected Invoice object
  const selectedInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

  // Jobs that are completed but not yet invoiced
  const completedNotInvoicedJobs = useMemo(() => {
    const invoicedJobIds = new Set(invoices.filter(i => i.status !== 'cancelled').map(i => i.jobId));
    return jobs.filter(j => 
      j.status === 'completed' && 
      !invoicedJobIds.has(j.id) && 
      (!j.billingStatus || j.billingStatus === 'unbilled')
    );
  }, [jobs, invoices]);

  // Invoice Filters configuration
  const filteredInvoicesList = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && inv.status !== statusFilter.toLowerCase()) {
        return false;
      }
      // 2. Region Filter
      if (regionFilter !== 'ALL' && inv.regionId !== regionFilter) {
        return false;
      }
      // 3. Search Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const custObj = customers.find(c => c.id === inv.customerId);
        const nameMatch = custObj?.name.toLowerCase().includes(query) || false;
        const noMatch = (inv.invoiceNumber || inv.invoiceNo || '').toLowerCase().includes(query);
        if (!nameMatch && !noMatch) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, regionFilter, searchQuery, customers]);

  // Format Currency string per region
  const formatInvoiceCurrency = (amount: any, regionId: string) => {
    const value = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
    const region = regions.find(r => r.code === regionId);
    const symbol = region?.currencySymbol ?? '₹';
    return `${symbol} ${value.toLocaleString()}`;
  };

  // Populate form fields on completed job selection
  const handleJobSelect = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    setFormJobId(jobId);
    const regionId = job.regionId || 'IN';
    setFormRegionId(regionId);
    
    // Fetch settings
    const settings = invoiceSettings.find(s => s.regionId === regionId) || {
      defaultPaymentTerms: 'Net 30',
      defaultDueDays: 30,
      taxLabel: 'GST',
      taxRate: 18,
    };

    setFormPaymentTerms(settings.defaultPaymentTerms);
    const dueDays = settings.defaultDueDays || 30;
    const due = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormDueDate(due);

    // Calculate base rate from quotation
    let baseRate = job.scenario === 'IMP' ? 520 : job.scenario === 'EXP' ? 400 : 300;
    const quoteObj = quotations.find(q => q.id === job.quotationId);
    const rateLine = (quoteObj?.rates ?? quoteObj?.rateItems ?? []).find(r => r.id === job.rateItemId);
    if (rateLine) {
      baseRate = rateLine.baseRate;
    }
    setFormBaseRate(baseRate);

    // Surcharges from Job
    const surchargesLines = [];
    
    // Extra incidentals
    job.extraSurchargesIncurred.forEach(es => {
      surchargesLines.push({
        code: es.surchargeCode || 'INCIDENTAL',
        description: `Incidental: ${es.description}`,
        amount: es.amount,
        billToCustomer: true
      });
    });

    setSurchargeInputLines(surchargesLines);

    // Cost lines from Job
    const subcontractorsCosts = [
      { description: `Subcontractor Base Haulage Cost (Buy Rate)`, amount: Math.round(baseRate * 0.7) }
    ];
    job.extraSurchargesIncurred.forEach(es => {
      subcontractorsCosts.push({
        description: `Subcontractor surcharge coverage (${es.description})`,
        amount: Math.round(es.amount * 0.7)
      });
    });
    setCostInputLines(subcontractorsCosts);
  };

  // Dynamic calculations for the creation/editing form
  const formCalculations = useMemo(() => {
    const settings = invoiceSettings.find(s => s.regionId === formRegionId);
    const taxRate = settings?.taxRate ?? 18;
    const taxLabel = settings?.taxLabel ?? 'GST';

    const surchargeTotal = surchargeInputLines
      .filter(l => l.billToCustomer)
      .reduce((sum, l) => sum + l.amount, 0);

    const subTotal = formBaseRate + surchargeTotal;
    const taxAmount = Math.round(subTotal * (taxRate / 100));
    const totalAmount = subTotal + taxAmount;

    const totalCost = costInputLines.reduce((sum, c) => sum + c.amount, 0);
    const grossMargin = totalAmount - totalCost;
    const marginPercent = totalAmount > 0 ? (grossMargin / totalAmount) * 100 : 0;

    return {
      subTotal,
      taxLabel,
      taxRate,
      taxAmount,
      totalAmount,
      totalCost,
      grossMargin,
      marginPercent
    };
  }, [formBaseRate, formRegionId, surchargeInputLines, costInputLines, invoiceSettings]);

  // Invoice creation submission handler
  const handleSaveInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJobId) {
      alert('Please select a completed job to invoice.');
      return;
    }

    const job = jobs.find(j => j.id === formJobId);
    if (!job) return;

    const settings = invoiceSettings.find(s => s.regionId === formRegionId);
    if (!settings) {
      alert('Invoice settings matching this region are missing.');
      return;
    }

    const year = new Date().getFullYear();
    const formattedNo = `${settings.invoicePrefix}-${year}-${String(settings.currentSequence).padStart(4, '0')}`;

    const region = regions.find(r => r.code === formRegionId);
    const newInvoice: Invoice = {
      id: isEditing && selectedInvoice ? selectedInvoice.id : `inv-${Date.now()}`,
      regionId: formRegionId,
      invoiceNo: formattedNo,
      invoiceNumber: formattedNo,
      jobId: formJobId,
      customerId: job.customerId,
      quotationId: job.quotationId,
      issueDate: formDate,
      dueDate: formDueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: settings.requireApprovalBeforeSend ? 'draft' : 'approved',
      subTotal: formCalculations.subTotal,
      taxLabel: formCalculations.taxLabel,
      taxRate: formCalculations.taxRate,
      taxAmount: formCalculations.taxAmount,
      totalAmount: formCalculations.totalAmount,
      currency: region?.currency ?? 'INR',
      surchargeLines: surchargeInputLines,
      costLines: costInputLines,
      grossMargin: formCalculations.grossMargin,
      notes: formNotes,
      items: [
        { description: `Base Container Haulage - ${job.scenario} (${job.containerSize})`, amount: formBaseRate },
        ...surchargeInputLines.map(s => ({ description: s.description, amount: s.amount }))
      ]
    };

    if (isEditing) {
      // For simplicity, we trigger status rewrite as edit updates
      onAddInvoice(newInvoice); 
      setIsEditing(false);
      setSelectedInvoiceId(newInvoice.id);
      alert('Invoice configurations edited successfully.');
    } else {
      onAddInvoice(newInvoice);
      setIsCreating(false);
      setSelectedInvoiceId(newInvoice.id);
      alert(`Invoice ${formattedNo} registered in registry as drafting ledger.`);
    }

    // Reset Form
    setFormJobId('');
    setFormNotes('');
  };

  // Helper values for selected Region Settings card
  const activeRegionSettings = useMemo(() => {
    return invoiceSettings.find(s => s.regionId === selectedRegionTab);
  }, [invoiceSettings, selectedRegionTab]);

  const handleUpdateRegionSettingField = (field: keyof InvoiceSettings, value: any) => {
    if (!activeRegionSettings) return;
    const updated = {
      ...activeRegionSettings,
      [field]: value
    };
    onUpdateInvoiceSettings(updated);
  };

  return (
    <div className="space-y-6" id="invoice-module-container">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-800 flex items-center gap-2">
            <Receipt className="text-blue-600 w-5 h-5 animate-pulse" /> Region-Aware Billing & Settlement console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish ledger matching regional tax policies, record subcontractor margins, and audit sequential receipts.
          </p>
        </div>

        <div className="flex gap-2">
          {isAdminOrFinance && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              {showSettings ? 'Hide Settings' : 'Regional Settings'}
            </button>
          )}

          <button
            onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              setSelectedInvoiceId(null);
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Draw New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT PANEL (25% column): INVOICE REGISTRY & FILTERS ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider block">Registry Queries</h3>
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="No, Client name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-805"
              />
            </div>

            {/* Region Filter - Corporate view */}
            {isCorpAdmin && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gateway Region</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded text-xs text-slate-800 font-semibold"
                >
                  <option value="ALL">ALL REGIONS (Cross)</option>
                  {regions.map(r => (
                    <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filters Stack */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">State filter</label>
              <div className="flex flex-wrap gap-1">
                {['ALL', 'Draft', 'Approved', 'Sent', 'Paid', 'Unpaid', 'Overdue'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                      statusFilter === st 
                        ? 'bg-blue-600 border-blue-600 text-white font-extrabold' 
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Combined Invoiced & Pending tabs display in Sidebar */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-extrabold text-[10px] uppercase text-slate-500 tracking-wider flex justify-between items-center">
              <span>Matching Documents ({filteredInvoicesList.length})</span>
              {completedNotInvoicedJobs.length > 0 && (
                <span className="bg-amber-100 border border-amber-200 text-amber-850 px-1.5 py-0.2 rounded text-[8px] animate-pulse">
                  {completedNotInvoicedJobs.length} PENDING JOB(S)
                </span>
              )}
            </div>

            {filteredInvoicesList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No matching ledger rows found. Try adjusting criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-105 max-h-[500px] overflow-y-auto">
                {filteredInvoicesList.map((inv) => {
                  const custObj = customers.find(c => c.id === inv.customerId);
                  const isSelected = selectedInvoiceId === inv.id;
                  
                  // Style based on status
                  const statusColors: Record<string, string> = {
                    draft: 'bg-slate-100 text-slate-700 border-slate-200',
                    approved: 'bg-sky-50 text-sky-800 border-sky-200',
                    sent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    paid: 'bg-green-100 text-green-800 border-green-200',
                    unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
                    overdue: 'bg-red-50 text-red-700 border-red-200 animate-pulse font-extrabold',
                    cancelled: 'bg-slate-55 text-slate-450 border-slate-200 line-through'
                  };

                  return (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setIsCreating(false);
                        setIsEditing(false);
                      }}
                      className={`p-3 text-left transition text-xs cursor-pointer select-none space-y-1.5 ${
                        isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber || inv.invoiceNo}</span>
                        <span className={`px-1 rounded text-[8.5px] uppercase font-semibold border ${statusColors[inv.status] || 'bg-slate-100'}`}>
                          {inv.status}
                        </span>
                      </div>
                      
                      <div className="font-sans font-bold text-slate-850 truncate">{custObj?.name || 'Unknown client'}</div>
                      
                      <div className="flex justify-between items-center font-mono text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                        <span>Due: {inv.dueDate}</span>
                        <strong className="text-slate-800">{formatInvoiceCurrency(inv.totalAmount, inv.regionId)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= CENTER PANEL (50% or 75% column): INVOICE DETAILS OR EDIT/CREATE FORM ================= */}
        <div className={showSettings && isAdminOrFinance ? 'lg:col-span-6 space-y-6' : 'lg:col-span-9 space-y-6'}>
          <AnimatePresence mode="wait">
            
            {/* --- SCENARIO 1: CREATION OR EDITING FORM --- */}
            {(isCreating || isEditing) ? (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="font-bold text-slate-850 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="text-blue-500 w-4 h-4" />
                    {isEditing ? 'Revise Draft Invoice' : 'Generate Consolidated Commercial Invoice'}
                  </h2>
                  <button 
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveInvoiceSubmit} className="space-y-4">
                  {/* Job Selector is only visible in creation mode */}
                  {!isEditing && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-amber-900 uppercase tracking-tight flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-amber-700" /> Choose Completed dispatch Job
                        </label>
                        <span className="text-[10px] text-amber-700 font-mono font-bold">Pending: {completedNotInvoicedJobs.length}</span>
                      </div>

                      {completedNotInvoicedJobs.length === 0 ? (
                        <div className="p-3 text-center text-xs text-amber-800 italic bg-white/60 border border-amber-200 rounded">
                          No completed container runs require invoicing at this gateway.
                        </div>
                      ) : (
                        <select
                          value={formJobId}
                          onChange={(e) => handleJobSelect(e.target.value)}
                          className="w-full bg-white border border-amber-350 p-2 rounded text-xs text-slate-800 font-bold"
                          required
                        >
                          <option value="">-- SELECT COMPLETED CONTAINER DISPATCH --</option>
                          {completedNotInvoicedJobs.map(job => {
                            const client = customers.find(c => c.id === job.customerId);
                            return (
                              <option key={job.id} value={job.id}>
                                {job.jobNo} • {client?.name} ({job.scenario} • {job.containerSize})
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase">Billing Region</label>
                      <input
                        type="text"
                        value={formRegionId}
                        readOnly
                        className="w-full bg-slate-100 border border-slate-200 p-2 rounded text-xs select-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase">Payment Terms</label>
                      <input
                        type="text"
                        value={formPaymentTerms}
                        readOnly
                        className="w-full bg-slate-100 border border-slate-200 p-2 rounded text-xs select-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase">Issue Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase">Due Date</label>
                      <input
                        type="date"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800 font-semibold text-red-650"
                        required
                      />
                    </div>
                  </div>

                  {formJobId && (
                    <div className="space-y-3.5 border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wide">Expected billing lines verification</h4>
                      
                      {/* Base Rate */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-800">Standard Container Haulage Base Tariff</strong>
                          <div className="text-[10px] text-slate-400">Pulled automatically from regional Quotation Agreement</div>
                        </div>
                        <input
                          type="number"
                          value={formBaseRate}
                          onChange={(e) => setFormBaseRate(Number(e.target.value))}
                          className="w-24 bg-white border border-slate-200 p-1 rounded text-right font-mono font-bold"
                        />
                      </div>

                      {/* Dynamic Surcharges Section */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Extra Surcharge Incidental Adjustments</span>
                        {surchargeInputLines.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">No extra incidentals were recorded for this job.</div>
                        ) : (
                          <div className="space-y-2">
                            {surchargeInputLines.map((line, idx) => (
                              <div key={idx} className="flex gap-2 items-center text-xs bg-slate-50 p-2 border border-slate-150 rounded">
                                <input
                                  type="checkbox"
                                  checked={line.billToCustomer}
                                  onChange={(e) => {
                                    const copy = [...surchargeInputLines];
                                    copy[idx].billToCustomer = e.target.checked;
                                    setSurchargeInputLines(copy);
                                  }}
                                  className="rounded"
                                />
                                <span className="flex-1 truncate leading-tight">{line.description}</span>
                                <input
                                  type="number"
                                  value={line.amount}
                                  onChange={(e) => {
                                    const copy = [...surchargeInputLines];
                                    copy[idx].amount = Number(e.target.value);
                                    setSurchargeInputLines(copy);
                                  }}
                                  className="w-20 bg-white border border-slate-200 p-1 rounded text-right font-mono text-[11px]"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Internal Subcontractor Costs section */}
                      <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-1.5 text-teal-800 font-extrabold text-[10.5px] uppercase tracking-wider">
                          <TrendingUp className="w-3.5 h-3.5 text-teal-600 font-black animate-pulse" />
                          Internal Subcontractor buy Rates Audit (Margin Forecast)
                        </div>
                        <p className="text-[10px] text-teal-600 leading-normal mb-1">
                          Calculated automatically at standard partner buy rate index (Contractor Share: 70%). Not printed on customer's layout.
                        </p>
                        
                        <div className="space-y-2 divide-y divide-teal-150 pt-1 text-xs">
                          {costInputLines.map((cline, cidx) => (
                            <div key={cidx} className="flex justify-between items-center py-1.5 first:pt-0">
                              <span className="text-teal-700 truncate font-medium">{cline.description}</span>
                              <input
                                type="number"
                                value={cline.amount}
                                onChange={(e) => {
                                    const copy = [...costInputLines];
                                    copy[cidx].amount = Number(e.target.value);
                                    setCostInputLines(copy);
                                }}
                                className="w-20 bg-white border border-teal-200 p-1 rounded text-right font-mono text-[11px] font-bold text-teal-800"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary Aggregates */}
                      <div className="border-t border-slate-100 pt-3 flex flex-col items-end text-xs space-y-1.5 font-bold text-slate-800 bg-slate-50/50 p-3 rounded">
                        <div className="flex justify-between w-64 text-slate-500 font-medium">
                          <span>Subtotal Base + Fees:</span>
                          <span className="font-mono">{formatInvoiceCurrency(formCalculations.subTotal, formRegionId)}</span>
                        </div>
                        <div className="flex justify-between w-64 text-slate-500 font-medium">
                          <span>{formCalculations.taxLabel} Tax ({formCalculations.taxRate}%):</span>
                          <span className="font-mono">{formatInvoiceCurrency(formCalculations.taxAmount, formRegionId)}</span>
                        </div>
                        <div className="flex justify-between w-64 border-t border-slate-205/85 pt-1.5 font-extrabold text-blue-600 text-sm">
                          <span>Consolidated Total:</span>
                          <span className="font-mono">{formatInvoiceCurrency(formCalculations.totalAmount, formRegionId)}</span>
                        </div>

                        {/* Margin validation preview */}
                        <div className="w-full border-t border-slate-200 pt-2.5 mt-1.5 flex justify-between items-center text-[10.5px] font-medium text-slate-500">
                          <span>Total Vendor Cost: <strong className="font-mono font-bold text-red-650">{formatInvoiceCurrency(formCalculations.totalCost, formRegionId)}</strong></span>
                          <span>Company Net Margin: <strong className="font-mono font-black text-green-650 font-sans">{formatInvoiceCurrency(formCalculations.grossMargin, formRegionId)} ({formCalculations.marginPercent.toFixed(1)}%)</strong></span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">Invoice Public Notes / Memo</label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Add auxiliary directives, customs reference number, bank tracking numbers..."
                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-sm flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      {isEditing ? 'Save Revisions' : 'Approve & Release to Registry'}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : selectedInvoice ? (
              
              /* --- SCENARIO 2: DETAILED PREVIEW & WORKFLOW --- */
              <motion.div
                key="preview-panel"
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 p-6 rounded-lg space-y-6 relative flex flex-col justify-between shadow-sm font-sans"
              >
                <div>
                  {/* Visual PDF Frame Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <div className="text-sm font-black text-slate-900 font-sans uppercase tracking-tight flex items-center gap-2">
                        {activeTenant.name}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-normal font-sans pt-0.5 font-medium">
                        Multimodal Port Gateway & Transport System<br />
                        Gate Customs Hub Division, Terminal {selectedInvoice.regionId === 'IN' ? '1' : '3'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-blue-600 font-sans font-extrabold text-xs uppercase tracking-widest">OFFICIAL INVOICE</div>
                      <div className="text-slate-500 font-mono text-[10px] font-bold pt-0.5">{selectedInvoice.invoiceNumber || selectedInvoice.invoiceNo}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[8.5px] bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold rounded">
                        Gateway: {regions.find(r => r.code === selectedInvoice.regionId)?.name || selectedInvoice.regionId}
                      </span>
                    </div>
                  </div>

                  {/* Recipient Details & Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-[11px] pt-4 leading-relaxed border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Billed To Unit:</div>
                      <strong className="text-slate-800 text-xs block pt-0.5">{customers.find(c => c.id === selectedInvoice.customerId)?.name || 'Unknown Client'}</strong>
                      <div className="text-slate-500 font-medium mt-1">
                        {customers.find(c => c.id === selectedInvoice.customerId)?.address}<br />
                        Regional Tax ID: <span className="font-mono text-slate-800 font-bold">{customers.find(c => c.id === selectedInvoice.customerId)?.taxId || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Billing Metadata:</div>
                      <div className="text-slate-600 font-medium mt-1">
                        Release Date: <span className="font-mono text-slate-800">{selectedInvoice.issueDate}</span><br />
                        Due Period: <span className="font-mono text-slate-800">{selectedInvoice.dueDate}</span><br />
                        Settlement Window: <span className="font-sans text-blue-600 font-bold">{customers.find(c => c.id === selectedInvoice.customerId)?.paymentTerms || 'Net 30'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mt-5 space-y-3">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Billed haulage and auxiliary items</span>
                    <table className="w-full text-left font-sans text-xs border border-slate-100 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase bg-slate-50">
                          <th className="py-2 px-3 font-extrabold pb-1.5">Line Description</th>
                          <th className="text-right py-2 px-3 pb-1.5">Amount ({selectedInvoice.currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        {/* Base rate first */}
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800">Standard Container Haulage Base Tariff</span>
                            <div className="text-[9px] text-slate-400">Cargo Link Associated Job No: {jobs.find(j => j.id === selectedInvoice.jobId)?.jobNo}</div>
                          </td>
                          <td className="text-right px-3 font-mono text-slate-800 font-bold">
                            {formatInvoiceCurrency(selectedInvoice.subTotal - (selectedInvoice.surchargeLines?.filter(s => s.billToCustomer).reduce((sum, s) => sum + s.amount, 0) || 0), selectedInvoice.regionId)}
                          </td>
                        </tr>

                        {/* Extra surcharges */}
                        {selectedInvoice.surchargeLines?.filter(line => line.billToCustomer).map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-medium text-slate-700">{it.description}</td>
                            <td className="text-right px-3 font-mono text-slate-800 font-bold">{formatInvoiceCurrency(it.amount, selectedInvoice.regionId)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Internal Subcontractor cost vs sell rate split – EXCLUSIVE FOR ADMIN/FINANCE ROLE */}
                  {isAdminOrFinance && (
                    <div className="mt-5 bg-teal-50 border border-teal-150 p-4 rounded-lg space-y-2.5">
                      <div className="flex items-center gap-1.5 text-teal-800 font-extrabold text-[10.5px] uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Administrative Audit (Internal Partner Cost Breakdowns) 
                        <span className="bg-teal-200 text-teal-900 border border-teal-300 text-[8.5px] px-1.5 py-0.2 rounded font-mono font-bold tracking-tight uppercase shrink-0">
                          Not Printed on Invoice layout
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-medium leading-relaxed divide-y sm:divide-y-0 sm:divide-x divide-teal-150 pt-1">
                        <div className="space-y-1">
                          <span className="text-teal-600 block text-[9px] uppercase font-bold tracking-wider">Customer Revenue</span>
                          <div className="font-mono text-slate-900 text-xs font-bold">Customer Total: {formatInvoiceCurrency(selectedInvoice.totalAmount, selectedInvoice.regionId)}</div>
                          <div className="font-mono text-slate-500 text-[10px]">Contracted Rate Ex-Tax: {formatInvoiceCurrency(selectedInvoice.subTotal, selectedInvoice.regionId)}</div>
                        </div>

                        <div className="sm:pl-3 space-y-1">
                          <span className="text-teal-600 block text-[9px] uppercase font-bold tracking-wider">Partner Share and Commissions</span>
                          <div className="font-mono text-slate-900 text-xs font-bold">
                            Total Partner Cost: {formatInvoiceCurrency(selectedInvoice.costLines?.reduce((sum, c) => sum + c.amount, 0) || 0, selectedInvoice.regionId)}
                          </div>
                          
                          {/* List cost units */}
                          <div className="text-[10px] text-teal-700 font-mono space-y-0.5 pt-1">
                            {selectedInvoice.costLines?.map((cl, cIdx) => (
                              <div key={cIdx} className="flex justify-between">
                                <span className="truncate max-w-[200px]">{cl.description}:</span>
                                <strong>{formatInvoiceCurrency(cl.amount, selectedInvoice.regionId)}</strong>
                              </div>
                            ))}
                          </div>

                          <div className="text-[10.5px] font-bold border-t border-teal-150 pt-1.5 mt-1.5 flex justify-between text-teal-850">
                            <span>NET HUB MARGIN:</span>
                            <span className="text-green-700">{formatInvoiceCurrency(selectedInvoice.grossMargin, selectedInvoice.regionId)} ({(((selectedInvoice.grossMargin || 0) / (selectedInvoice.totalAmount || 1)) * 100).toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Balance ledger aggregate */}
                  <div className="border-t border-slate-200 mt-5 pt-4 flex flex-col items-end text-xs space-y-1.5 leading-normal">
                    <div className="flex justify-between w-60 text-slate-500">
                      <span>Subtotal (Net of Surcharges):</span>
                      <span className="font-mono text-slate-800 font-semibold">{formatInvoiceCurrency(selectedInvoice.subTotal, selectedInvoice.regionId)}</span>
                    </div>
                    <div className="flex justify-between w-60 text-slate-500">
                      <span>{selectedInvoice.taxLabel || 'Tax'} ({selectedInvoice.taxRate || 0}%):</span>
                      <span className="font-mono text-slate-800 font-semibold">{formatInvoiceCurrency(selectedInvoice.taxAmount, selectedInvoice.regionId)}</span>
                    </div>
                    <div className="flex justify-between w-60 border-t border-slate-205/60 pt-2 font-black text-slate-900">
                      <span>CONSOLIDATED COMPLETED DUE:</span>
                      <span className="font-mono text-blue-600 text-sm font-black">{formatInvoiceCurrency(selectedInvoice.totalAmount, selectedInvoice.regionId)}</span>
                    </div>
                  </div>

                  {/* Public note memo block */}
                  {selectedInvoice.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-500 mt-4 leading-relaxed italic">
                      <strong className="font-mono font-bold text-slate-400 not-italic uppercase text-[9px] block mb-1">Invoicing Directives Memo:</strong>
                      {selectedInvoice.notes}
                    </div>
                  )}

                  {/* Dynamic payment banking note */}
                  {selectedInvoice.status !== 'unpaid' && (
                    <div className="bg-slate-50/50 p-4 border border-slate-200/50 rounded-lg text-[10px] text-slate-400 grid grid-cols-3 mt-4 gap-2 leading-tight">
                      <div>
                        <strong>BANK REMITTANCE:</strong><br />
                        {selectedInvoice.regionId === 'IN' ? 'HDFC Bank' : 'Emirates NBD'}
                      </div>
                      <div>
                        <strong>ACCOUNT DEPOSIT:</strong><br />
                        {selectedInvoice.regionId === 'IN' ? 'XXXX-XXXX-1234' : 'AE070331234567890123456'}
                      </div>
                      <div className="text-right">
                        <strong>SWIFT CODE:</strong><br />
                        {selectedInvoice.regionId === 'IN' ? 'HDFCINBB' : 'EBILAEAD'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Workflow state machines actions - Bottom area */}
                <div className="border-t border-slate-200 mt-6 pt-4 flex flex-wrap justify-between items-center gap-3 text-xs">
                  <div className="flex gap-2">
                    {/* State: Draft */}
                    {selectedInvoice.status === 'draft' && (
                      <>
                        <button
                          onClick={() => {
                            onUpdateInvoiceStatus(selectedInvoice.id, 'approved');
                            // Record approvals log
                            alert(`Ledger ${selectedInvoice.invoiceNumber} verified and approved for mailing.`);
                          }}
                          className="px-3.5 py-1.5 bg-blue-650 hover:bg-blue-700 text-white font-extrabold rounded text-[11px] transition flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve Ledger
                        </button>

                        <button
                          onClick={() => {
                            // Populate editing state
                            setFormJobId(selectedInvoice.jobId);
                            setFormRegionId(selectedInvoice.regionId);
                            setFormDate(selectedInvoice.issueDate);
                            setFormDueDate(selectedInvoice.dueDate);
                            setFormNotes(selectedInvoice.notes || '');
                            
                            // Find and extract rates
                            const baseRateLine = selectedInvoice.items.find(i => i.description.startsWith('Base Container'));
                            setFormBaseRate(baseRateLine?.amount ?? 400);

                            setSurchargeInputLines(selectedInvoice.surchargeLines || []);
                            setCostInputLines(selectedInvoice.costLines || []);
                            setIsEditing(true);
                            setIsCreating(false);
                          }}
                          className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded text-[11px] transition flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Revise
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this draft?')) {
                              onUpdateInvoiceStatus(selectedInvoice.id, 'cancelled');
                            }
                          }}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded text-[11px] transition flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-550" /> Delete
                        </button>
                      </>
                    )}

                    {/* State: Approved */}
                    {selectedInvoice.status === 'approved' && (
                      <button
                        onClick={() => {
                          onUpdateInvoiceStatus(selectedInvoice.id, 'sent');
                          alert(`Mailing signals sent matching SMTP configurations.`);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded text-[11px] transition flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Mail to Client
                      </button>
                    )}

                    {/* State: Sent or Unpaid */}
                    {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'unpaid' || selectedInvoice.status === 'overdue') && (
                      <button
                        onClick={() => {
                          setPaymentAmount(selectedInvoice.totalAmount);
                          setShowPaymentModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-[11px] transition flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Settle Remittance
                      </button>
                    )}

                    {/* Paid badges status */}
                    {selectedInvoice.status === 'paid' && (
                      <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3.5 py-1.5 rounded text-[11px] font-extrabold font-mono">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" /> SETTLED PAID (2026-06-10)
                      </div>
                    )}

                    {selectedInvoice.status === 'cancelled' && (
                      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 px-3.5 py-1.5 rounded text-[11px] font-extrabold text-slate-400">
                        CANCELLED DEBT LEDGER
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => alert(`Compiling high-resolution PDF metadata for ${selectedInvoice.invoiceNumber}...`)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 rounded text-[11px] transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" /> Download PDF
                    </button>
                    <button
                      onClick={() => alert('Sending raw print spooler instructions to harbor terminal billing port...')}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 rounded text-[11px] transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" /> Print
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* --- DEFAULT SCENARIO: EMPTY STATE OR JOB WORKFLOW ASSISTANT --- */
              <div className="bg-slate-50 border border-dashed border-slate-250 rounded-xl p-16 text-center space-y-4">
                <Receipt className="w-12 h-12 text-slate-350 mx-auto animate-bounce" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="font-extrabold text-slate-700 text-sm uppercase tracking-wide">Invoicing Ledger Interface</h3>
                  <p className="text-xs text-slate-450 leading-relaxed font-sans">
                    Select a transaction draft from the left side registry, click "Draw New Invoice" to reconcile completed trips, or toggle configuration panels on the right side.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= RIGHT PANEL (25% column): COLLAPSIBLE REGIONAL INVOICE SETTINGS ================= */}
        {isAdminOrFinance && showSettings && (
          <div className="lg:col-span-3">
            <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-950 space-y-4 shadow-md leading-relaxed font-sans relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-400" /> Region parameters
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Selector Tabs for regional configurations */}
              <div className="flex space-x-1.5 bg-slate-950 p-1 rounded border border-slate-800 text-[10px] font-black">
                {regions.map(r => (
                  <button
                    key={r.code}
                    onClick={() => setSelectedRegionTab(r.code)}
                    className={`flex-1 py-1 rounded text-center transition ${
                      selectedRegionTab === r.code 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r.name} ({r.code})
                  </button>
                ))}
              </div>

              {activeRegionSettings ? (
                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">No. Sequential Prefix</label>
                    <input
                      type="text"
                      value={activeRegionSettings.invoicePrefix}
                      onChange={(e) => handleUpdateRegionSettingField('invoicePrefix', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded font-mono font-bold text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tax Label</label>
                      <input
                        type="text"
                        value={activeRegionSettings.taxLabel}
                        onChange={(e) => handleUpdateRegionSettingField('taxLabel', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tax Rate (%)</label>
                      <input
                        type="number"
                        value={activeRegionSettings.taxRate}
                        onChange={(e) => handleUpdateRegionSettingField('taxRate', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment Terms Duration</label>
                    <select
                      value={activeRegionSettings.defaultPaymentTerms}
                      onChange={(e) => {
                        const terms = e.target.value;
                        const days = terms === 'Net 15' ? 15 : terms === 'Net 30' ? 30 : 60;
                        handleUpdateRegionSettingField('defaultPaymentTerms', terms);
                        handleUpdateRegionSettingField('defaultDueDays', days);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white text-xs"
                    >
                      <option value="Net 15">Net 15 (UAE Policy)</option>
                      <option value="Net 30">Net 30 (IN Policy)</option>
                      <option value="Net 60">Net 60 Standard</option>
                    </select>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-md space-y-2.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bank Remit particulars</span>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold block">BANK NAME</label>
                      <input
                        type="text"
                        value={activeRegionSettings.bankName}
                        onChange={(e) => handleUpdateRegionSettingField('bankName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-[11px] text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold block">ACCOUNT NUMBER</label>
                      <input
                        type="text"
                        value={activeRegionSettings.bankAccountNo}
                        onChange={(e) => handleUpdateRegionSettingField('bankAccountNo', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded font-mono text-[11px] text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold block">SWIFT/BIC CODE</label>
                      <input
                        type="text"
                        value={activeRegionSettings.bankSwiftCode}
                        onChange={(e) => handleUpdateRegionSettingField('bankSwiftCode', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded font-mono text-[11px] text-white uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    {/* Auto Create of Job close */}
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong>Auto-Create on Job Close</strong>
                        <p className="text-[10px] text-slate-500 leading-none mt-0.5 pt-0.5">Generate automatically when trip completes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={activeRegionSettings.autoCreateOnJobClose}
                        onChange={(e) => handleUpdateRegionSettingField('autoCreateOnJobClose', e.target.checked)}
                        className="rounded"
                      />
                    </div>

                    {/* Require Approval */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <strong>Approval Before Send</strong>
                        <p className="text-[10px] text-slate-500 leading-none mt-0.5 pt-0.5">Requires audit checklist confirmation</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={activeRegionSettings.requireApprovalBeforeSend}
                        onChange={(e) => handleUpdateRegionSettingField('requireApprovalBeforeSend', e.target.checked)}
                        className="rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-slate-800 pt-3">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Legal footer Note Description</label>
                    <textarea
                      value={activeRegionSettings.footerNote}
                      onChange={(e) => handleUpdateRegionSettingField('footerNote', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-300 text-[11px]"
                      rows={2.5}
                    />
                  </div>

                </div>
              ) : (
                <div className="text-center p-4 text-xs text-slate-500 italic">No settings mapped.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= PAYMENT SETTLEMENT DIALOG MODAL ================= */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-sans">
          <div className="bg-white border border-slate-200 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
              <strong className="text-slate-850 text-sm uppercase tracking-wide flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-emerald-550" /> Record Settlement Remittance
              </strong>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-655 font-medium leading-relaxed">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-md space-y-1 font-mono">
                <div>Document: <strong>{selectedInvoice.invoiceNumber || selectedInvoice.invoiceNo}</strong></div>
                <div>Outstanding Due: <strong className="text-blue-600">{formatInvoiceCurrency(selectedInvoice.totalAmount, selectedInvoice.regionId)}</strong></div>
                <div>Client: <strong>{customers.find(c => c.id === selectedInvoice.customerId)?.name}</strong></div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">PAYMENT SETTLEMENT DATE</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-slate-855 font-semibold font-mono"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">AMOUNT RECEIVED ({selectedInvoice.currency})</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-slate-855 font-bold font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateInvoiceStatus(selectedInvoice.id, 'paid');
                  setShowPaymentModal(false);
                  alert(`Payment of ${formatInvoiceCurrency(paymentAmount, selectedInvoice.regionId)} successfully recorded for Invoice ${selectedInvoice.invoiceNumber || selectedInvoice.invoiceNo}. Ledger accounts cleared.`);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold rounded text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Book Payment Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
