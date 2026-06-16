/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Job, Quotation, Invoice, Tenant, SurchargeRule, Region, User, InvoiceSettings } from '../types';
import {
  Receipt, FileText, CheckCircle, Send, TrendingUp, Settings, Trash2, Edit2,
  Download, Printer, Plus, Building, X, CreditCard,
} from 'lucide-react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection } from './shared/DetailDrawer';
import { T, badgeClass, statusLabel } from './shared/ui';

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
  onUpdateInvoiceSettings,
}: BillingInvoiceConsoleProps) {

  // Drawer / view states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRegionTab, setSelectedRegionTab] = useState<string>('IN');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateField, setDateField] = useState<'issue' | 'due'>('issue');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Invoice form state
  const [formJobId, setFormJobId] = useState('');
  const [formRegionId, setFormRegionId] = useState('IN');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 30');
  const [formBaseRate, setFormBaseRate] = useState<number>(0);
  const [surchargeInputLines, setSurchargeInputLines] = useState<Array<{
    code: string; description: string; amount: number; billToCustomer: boolean;
  }>>([]);
  const [costInputLines, setCostInputLines] = useState<Array<{ description: string; amount: number }>>([]);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const isAdminOrFinance = useMemo(
    () => currentUser?.role === 'administrator' || currentUser?.role === 'billing',
    [currentUser]
  );
  const isCorpAdmin = useMemo(
    () => currentUser?.regionAccess?.includes('ALL') || currentUser?.role === 'administrator',
    [currentUser]
  );

  const selectedInvoice = useMemo(
    () => invoices.find(inv => inv.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId]
  );

  const completedNotInvoicedJobs = useMemo(() => {
    const invoicedJobIds = new Set(invoices.filter(i => i.status !== 'cancelled').map(i => i.jobId));
    return jobs.filter(j =>
      j.status === 'completed' &&
      !invoicedJobIds.has(j.id) &&
      (!j.billingStatus || j.billingStatus === 'unbilled')
    );
  }, [jobs, invoices]);

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (inv: Invoice) => inv.dueDate < today && !['paid', 'cancelled'].includes(inv.status);

  const filteredInvoicesList = useMemo(() => {
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (regionFilter && inv.regionId !== regionFilter) return false;
      if (customerFilter && inv.customerId !== customerFilter) return false;
      const dateVal = dateField === 'issue' ? inv.issueDate : inv.dueDate;
      if (dateRange.from && dateVal < dateRange.from) return false;
      if (dateRange.to && dateVal > dateRange.to) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const custObj = customers.find(c => c.id === inv.customerId);
        const nameMatch = custObj?.name.toLowerCase().includes(query) || false;
        const noMatch = (inv.invoiceNumber || inv.invoiceNo || '').toLowerCase().includes(query);
        if (!nameMatch && !noMatch) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, regionFilter, customerFilter, searchQuery, customers, dateField, dateRange]);

  const formatInvoiceCurrency = (amount: any, regionId: string) => {
    const value = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
    const region = regions.find(r => r.code === regionId);
    const symbol = region?.currencySymbol ?? '₹';
    return `${symbol} ${value.toLocaleString()}`;
  };

  // Populate form on completed-job selection (preserved logic)
  const handleJobSelect = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    setFormJobId(jobId);
    const regionId = job.regionId || 'IN';
    setFormRegionId(regionId);

    const settings = invoiceSettings.find(s => s.regionId === regionId) || {
      defaultPaymentTerms: 'Net 30', defaultDueDays: 30, taxLabel: 'GST', taxRate: 18,
    };
    setFormPaymentTerms(settings.defaultPaymentTerms);
    const dueDays = settings.defaultDueDays || 30;
    setFormDueDate(new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    let baseRate = job.scenario === 'IMP' ? 520 : job.scenario === 'EXP' ? 400 : 300;
    const quoteObj = quotations.find(q => q.id === job.quotationId);
    const rateLine = (quoteObj?.rateItems ?? []).find(r => r.id === job.rateItemId);
    if (rateLine) baseRate = rateLine.baseRate;
    setFormBaseRate(baseRate);

    const surchargesLines: typeof surchargeInputLines = [];
    job.extraSurchargesIncurred.forEach(es => {
      surchargesLines.push({
        code: es.surchargeCode || 'INCIDENTAL',
        description: `Incidental: ${es.description}`,
        amount: es.amount,
        billToCustomer: true,
      });
    });
    setSurchargeInputLines(surchargesLines);

    const subcontractorsCosts = [
      { description: `Subcontractor Base Haulage Cost (Buy Rate)`, amount: Math.round(baseRate * 0.7) },
    ];
    job.extraSurchargesIncurred.forEach(es => {
      subcontractorsCosts.push({
        description: `Subcontractor surcharge coverage (${es.description})`,
        amount: Math.round(es.amount * 0.7),
      });
    });
    setCostInputLines(subcontractorsCosts);
  };

  const formCalculations = useMemo(() => {
    const settings = invoiceSettings.find(s => s.regionId === formRegionId);
    const taxRate = settings?.taxRate ?? 18;
    const taxLabel = settings?.taxLabel ?? 'GST';
    const surchargeTotal = surchargeInputLines.filter(l => l.billToCustomer).reduce((sum, l) => sum + l.amount, 0);
    const subTotal = formBaseRate + surchargeTotal;
    const taxAmount = Math.round(subTotal * (taxRate / 100));
    const totalAmount = subTotal + taxAmount;
    const totalCost = costInputLines.reduce((sum, c) => sum + c.amount, 0);
    const grossMargin = totalAmount - totalCost;
    const marginPercent = totalAmount > 0 ? (grossMargin / totalAmount) * 100 : 0;
    return { subTotal, taxLabel, taxRate, taxAmount, totalAmount, totalCost, grossMargin, marginPercent };
  }, [formBaseRate, formRegionId, surchargeInputLines, costInputLines, invoiceSettings]);

  const handleSaveInvoiceSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formJobId) { alert('Please select a completed job to invoice.'); return; }
    const job = jobs.find(j => j.id === formJobId);
    if (!job) return;
    const settings = invoiceSettings.find(s => s.regionId === formRegionId);
    if (!settings) { alert('Invoice settings matching this region are missing.'); return; }

    const isEditing = drawerMode === 'edit';
    const year = new Date().getFullYear();
    const formattedNo = isEditing && selectedInvoice
      ? (selectedInvoice.invoiceNumber || selectedInvoice.invoiceNo)
      : `${settings.invoicePrefix}-${year}-${String(settings.currentSequence).padStart(4, '0')}`;

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
        ...surchargeInputLines.map(s => ({ description: s.description, amount: s.amount })),
      ],
    };

    onAddInvoice(newInvoice);
    setSelectedInvoiceId(newInvoice.id);
    setDrawerMode('view');
    alert(isEditing
      ? 'Invoice configurations edited successfully.'
      : `Invoice ${formattedNo} registered in registry as drafting ledger.`);
    setFormJobId('');
    setFormNotes('');
  };

  const startEditInvoice = (inv: Invoice) => {
    setFormJobId(inv.jobId);
    setFormRegionId(inv.regionId);
    setFormDate(inv.issueDate);
    setFormDueDate(inv.dueDate);
    setFormNotes(inv.notes || '');
    const baseRateLine = inv.items.find(i => i.description.startsWith('Base Container'));
    setFormBaseRate(baseRateLine?.amount ?? 400);
    setSurchargeInputLines(inv.surchargeLines || []);
    setCostInputLines(inv.costLines || []);
    setDrawerMode('edit');
  };

  const openCreate = () => {
    setSelectedInvoiceId(null);
    setFormJobId('');
    setFormRegionId('IN');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDueDate('');
    setFormNotes('');
    setFormBaseRate(0);
    setSurchargeInputLines([]);
    setCostInputLines([]);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedInvoiceId(null);
    setDrawerMode('view');
  };

  const activeRegionSettings = useMemo(
    () => invoiceSettings.find(s => s.regionId === selectedRegionTab),
    [invoiceSettings, selectedRegionTab]
  );

  const handleUpdateRegionSettingField = (field: keyof InvoiceSettings, value: any) => {
    if (!activeRegionSettings) return;
    onUpdateInvoiceSettings({ ...activeRegionSettings, [field]: value });
  };

  // ── Table columns ──
  const columns: DataTableColumn<Invoice>[] = [
    {
      key: 'no', header: 'Invoice No', sortValue: i => i.invoiceNumber || i.invoiceNo,
      render: i => <span className={T.cellId}>{i.invoiceNumber || i.invoiceNo}</span>,
    },
    {
      key: 'customer', header: 'Customer', sortValue: i => customers.find(c => c.id === i.customerId)?.name ?? '',
      render: i => (
        <div>
          <span className={T.cellPrimary}>{customers.find(c => c.id === i.customerId)?.name ?? 'Unknown client'}</span>
          <span className={`${T.cellMuted} block`}>{i.regionId} · {i.currency}</span>
        </div>
      ),
    },
    {
      key: 'subtotal', header: 'Subtotal', align: 'right', sortValue: i => i.subTotal,
      render: i => <span className={`${T.cellSecondary} tabular-nums`}>{formatInvoiceCurrency(i.subTotal, i.regionId)}</span>,
    },
    {
      key: 'tax', header: 'Tax', align: 'right', sortValue: i => i.taxAmount,
      render: i => <span className={`${T.cellSecondary} tabular-nums`}>{formatInvoiceCurrency(i.taxAmount, i.regionId)}</span>,
    },
    {
      key: 'total', header: 'Total', align: 'right', sortValue: i => i.totalAmount,
      render: i => <span className={T.cellAmount}>{formatInvoiceCurrency(i.totalAmount, i.regionId)}</span>,
    },
    {
      key: 'due', header: 'Due Date', sortValue: i => i.dueDate,
      render: i => (
        <div>
          <span className={`text-sm font-mono ${isOverdue(i) ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{i.dueDate}</span>
          {isOverdue(i) && <span className="text-[10px] font-bold text-red-500 block">OVERDUE</span>}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', sortValue: i => i.status,
      render: i => <span className={badgeClass(i.status)}>{statusLabel(i.status)}</span>,
    },
  ];

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (regionFilter ? 1 : 0) +
    (customerFilter ? 1 : 0) + (dateRange.from || dateRange.to ? 1 : 0);

  // ── Workflow footer actions per status ──
  const workflowFooter = (inv: Invoice) => (
    <>
      {inv.status === 'draft' && (
        <>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel this draft?')) {
                onUpdateInvoiceStatus(inv.id, 'cancelled');
              }
            }}
            className="h-9 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button
            onClick={() => startEditInvoice(inv)}
            className="h-9 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-md text-sm font-semibold flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" /> Revise
          </button>
          <button
            onClick={() => {
              onUpdateInvoiceStatus(inv.id, 'approved');
              alert(`Ledger ${inv.invoiceNumber} verified and approved for mailing.`);
            }}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm flex items-center gap-1 shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
        </>
      )}
      {inv.status === 'approved' && (
        <button
          onClick={() => {
            onUpdateInvoiceStatus(inv.id, 'sent');
            alert(`Mailing signals sent matching SMTP configurations.`);
          }}
          className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-sm flex items-center gap-1 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" /> Mail to Client
        </button>
      )}
      {(inv.status === 'sent' || inv.status === 'unpaid' || inv.status === 'overdue') && (
        <button
          onClick={() => {
            setPaymentAmount(inv.totalAmount);
            setShowPaymentModal(true);
          }}
          className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-sm flex items-center gap-1 shadow-sm"
        >
          <CreditCard className="w-3.5 h-3.5" /> Record Payment
        </button>
      )}
      {inv.status === 'paid' && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 h-9 rounded-md text-xs font-bold font-mono">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" /> SETTLED
        </div>
      )}
      <button
        onClick={() => alert(`Compiling high-resolution PDF metadata for ${inv.invoiceNumber}...`)}
        className="h-9 px-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-sm flex items-center gap-1"
      >
        <Download className="w-3.5 h-3.5 text-blue-600" /> PDF
      </button>
    </>
  );

  return (
    <div className="space-y-4" id="invoice-module-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`${T.pageTitle} flex items-center gap-2`}>
            <Receipt className="text-blue-600 w-5 h-5" /> Region-Aware Billing &amp; Settlement Console
          </h1>
          <p className={T.pageSubtitle}>Publish ledger matching regional tax policies, record subcontractor margins, and audit sequential receipts.</p>
        </div>
        <div className="flex gap-2">
          {isAdminOrFinance && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm font-semibold bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              {showSettings ? 'Hide Settings' : 'Regional Settings'}
            </button>
          )}
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Draw New Invoice
          </button>
        </div>
      </div>

      {/* Pending jobs hint */}
      {completedNotInvoicedJobs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800 font-semibold">
          {completedNotInvoicedJobs.length} completed job(s) pending invoicing — use "Draw New Invoice" to reconcile.
        </div>
      )}

      {/* Regional settings panel (collapsible, preserved) */}
      {isAdminOrFinance && showSettings && (
        <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-950 space-y-4 shadow-md max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Region parameters
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex space-x-1.5 bg-slate-950 p-1 rounded border border-slate-800 text-[10px] font-black">
            {regions.map(r => (
              <button
                key={r.code}
                onClick={() => setSelectedRegionTab(r.code)}
                className={`flex-1 py-1 rounded text-center transition ${selectedRegionTab === r.code ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {r.name} ({r.code})
              </button>
            ))}
          </div>
          {activeRegionSettings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-xs text-slate-300">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">No. Sequential Prefix</label>
                <input
                  type="text"
                  value={activeRegionSettings.invoicePrefix}
                  onChange={e => handleUpdateRegionSettingField('invoicePrefix', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded font-mono font-bold text-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tax Label</label>
                  <input
                    type="text"
                    value={activeRegionSettings.taxLabel}
                    onChange={e => handleUpdateRegionSettingField('taxLabel', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={activeRegionSettings.taxRate}
                    onChange={e => handleUpdateRegionSettingField('taxRate', Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment Terms Duration</label>
                <select
                  value={activeRegionSettings.defaultPaymentTerms}
                  onChange={e => {
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
                    onChange={e => handleUpdateRegionSettingField('bankName', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-[11px] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold block">ACCOUNT NUMBER</label>
                  <input
                    type="text"
                    value={activeRegionSettings.bankAccountNo}
                    onChange={e => handleUpdateRegionSettingField('bankAccountNo', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded font-mono text-[11px] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold block">SWIFT/BIC CODE</label>
                  <input
                    type="text"
                    value={activeRegionSettings.bankSwiftCode}
                    onChange={e => handleUpdateRegionSettingField('bankSwiftCode', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded font-mono text-[11px] text-white uppercase"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <strong>Auto-Create on Job Close</strong>
                    <p className="text-[10px] text-slate-500 mt-0.5">Generate automatically when trip completes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeRegionSettings.autoCreateOnJobClose}
                    onChange={e => handleUpdateRegionSettingField('autoCreateOnJobClose', e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <strong>Approval Before Send</strong>
                    <p className="text-[10px] text-slate-500 mt-0.5">Requires audit checklist confirmation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeRegionSettings.requireApprovalBeforeSend}
                    onChange={e => handleUpdateRegionSettingField('requireApprovalBeforeSend', e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="space-y-1 pt-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Legal footer Note Description</label>
                  <textarea
                    value={activeRegionSettings.footerNote}
                    onChange={e => handleUpdateRegionSettingField('footerNote', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-300 text-[11px]"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-xs text-slate-500 italic">No settings mapped.</div>
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <FilterBar
          searchPlaceholder="Search invoice no or client…"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusOptions={[
            { value: 'all', label: 'All', count: invoices.length },
            ...['draft', 'approved', 'sent', 'paid', 'unpaid', 'overdue'].map(s => ({
              value: s, label: statusLabel(s), count: invoices.filter(i => i.status === s).length,
            })),
          ]}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          dropdownFilters={[
            {
              key: 'customer', label: 'Customer',
              options: customers.map(c => ({ value: c.id, label: c.name })),
              value: customerFilter, onChange: setCustomerFilter,
            },
            ...(isCorpAdmin ? [{
              key: 'region', label: 'Region',
              options: regions.map(r => ({ value: r.code, label: `${r.name} (${r.code})` })),
              value: regionFilter, onChange: setRegionFilter,
            }] : []),
            {
              key: 'dateField', label: 'Date By',
              options: [{ value: 'issue', label: 'Invoice Date' }, { value: 'due', label: 'Due Date' }],
              value: dateField, onChange: v => setDateField((v || 'issue') as 'issue' | 'due'),
            },
          ]}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          dateRangeLabel={dateField === 'issue' ? 'Issued' : 'Due'}
          onClearAll={() => {
            setSearchQuery(''); setStatusFilter('all'); setRegionFilter('');
            setCustomerFilter(''); setDateRange({ from: '', to: '' }); setDateField('issue');
          }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={filteredInvoicesList}
          onRowClick={inv => { setSelectedInvoiceId(inv.id); setDrawerMode('view'); setDrawerOpen(true); }}
          rowActions={inv => (
            <button
              onClick={() => alert(`Compiling high-resolution PDF metadata for ${inv.invoiceNumber || inv.invoiceNo}...`)}
              className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          emptyState={{
            icon: <Receipt className="w-10 h-10" />,
            title: 'No matching ledger rows',
            subtitle: 'Adjust filters or draw a new invoice from a completed job.',
          }}
        />
      </div>

      {/* Drawer: detail or create/edit form */}
      <DetailDrawer
        open={drawerOpen && (drawerMode === 'create' || !!selectedInvoice)}
        onClose={closeDrawer}
        width="560px"
        title={
          drawerMode === 'create'
            ? 'New Invoice'
            : <>
                <span className="font-mono">{selectedInvoice?.invoiceNumber || selectedInvoice?.invoiceNo}</span>
                {selectedInvoice && <span className={badgeClass(selectedInvoice.status)}>{statusLabel(selectedInvoice.status)}</span>}
              </>
        }
        subtitle={
          drawerMode === 'create'
            ? 'Generate consolidated commercial invoice'
            : selectedInvoice
              ? `${customers.find(c => c.id === selectedInvoice.customerId)?.name ?? ''} · ${regions.find(r => r.code === selectedInvoice.regionId)?.name ?? selectedInvoice.regionId}`
              : undefined
        }
        headerActions={
          drawerMode === 'view' && selectedInvoice ? (
            <button
              onClick={() => alert('Sending raw print spooler instructions to harbor terminal billing port...')}
              className="h-8 px-2.5 flex items-center gap-1 rounded-md text-sm text-slate-600 hover:bg-slate-100"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          ) : undefined
        }
        footer={
          drawerMode === 'view' && selectedInvoice ? (
            workflowFooter(selectedInvoice)
          ) : (
            <>
              <button
                onClick={() => drawerMode === 'create' ? closeDrawer() : setDrawerMode('view')}
                className="h-9 px-4 rounded-md text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveInvoiceSubmit()}
                className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                {drawerMode === 'edit' ? 'Save Revisions' : 'Approve & Release'}
              </button>
            </>
          )
        }
      >
        {drawerMode === 'view' && selectedInvoice ? (
          <>
            {/* Billed-to / metadata */}
            <DrawerSection title="Billing Parties">
              <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
                <div>
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Billed To:</div>
                  <strong className="text-slate-800 text-xs block pt-0.5">{customers.find(c => c.id === selectedInvoice.customerId)?.name || 'Unknown Client'}</strong>
                  <div className="text-slate-500 font-medium mt-1">
                    {customers.find(c => c.id === selectedInvoice.customerId)?.address}<br />
                    Tax ID: <span className="font-mono text-slate-800 font-bold">{customers.find(c => c.id === selectedInvoice.customerId)?.taxId || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Metadata:</div>
                  <div className="text-slate-600 font-medium mt-1">
                    Issued: <span className="font-mono text-slate-800">{selectedInvoice.issueDate}</span><br />
                    Due: <span className={`font-mono ${isOverdue(selectedInvoice) ? 'text-red-600 font-bold' : 'text-slate-800'}`}>{selectedInvoice.dueDate}</span><br />
                    Terms: <span className="text-blue-600 font-bold">{customers.find(c => c.id === selectedInvoice.customerId)?.paymentTerms || 'Net 30'}</span><br />
                    Issuer: <span className="font-bold">{activeTenant.name}</span>
                  </div>
                </div>
              </div>
            </DrawerSection>

            {/* Line items */}
            <DrawerSection title="Line Items">
              <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono text-[9px] uppercase bg-slate-50">
                    <th className="py-2 px-3 font-extrabold">Description</th>
                    <th className="text-right py-2 px-3">Amount ({selectedInvoice.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  <tr>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800">Standard Container Haulage Base Tariff</span>
                      <div className="text-[9px] text-slate-400">Job No: {jobs.find(j => j.id === selectedInvoice.jobId)?.jobNo}</div>
                    </td>
                    <td className="text-right px-3 font-mono text-slate-800 font-bold">
                      {formatInvoiceCurrency(selectedInvoice.subTotal - (selectedInvoice.surchargeLines?.filter(s => s.billToCustomer).reduce((sum, s) => sum + s.amount, 0) || 0), selectedInvoice.regionId)}
                    </td>
                  </tr>
                  {selectedInvoice.surchargeLines?.filter(line => line.billToCustomer).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{it.description}</td>
                      <td className="text-right px-3 font-mono text-slate-800 font-bold">{formatInvoiceCurrency(it.amount, selectedInvoice.regionId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-3 flex flex-col items-end text-xs space-y-1.5">
                <div className="flex justify-between w-60 text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatInvoiceCurrency(selectedInvoice.subTotal, selectedInvoice.regionId)}</span>
                </div>
                <div className="flex justify-between w-60 text-slate-500">
                  <span>{selectedInvoice.taxLabel || 'Tax'} ({selectedInvoice.taxRate || 0}%):</span>
                  <span className="font-mono text-slate-800 font-semibold">{formatInvoiceCurrency(selectedInvoice.taxAmount, selectedInvoice.regionId)}</span>
                </div>
                <div className="flex justify-between w-60 border-t border-slate-200 pt-2 font-black text-slate-900">
                  <span>TOTAL DUE:</span>
                  <span className="font-mono text-blue-600 text-sm font-black">{formatInvoiceCurrency(selectedInvoice.totalAmount, selectedInvoice.regionId)}</span>
                </div>
              </div>
            </DrawerSection>

            {/* Cost / margin — admin & finance only */}
            {isAdminOrFinance && (
              <DrawerSection title="Internal Cost & Margin (Not Printed)">
                <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg space-y-2.5">
                  <div className="flex items-center gap-1.5 text-teal-800 font-extrabold text-[10.5px] uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Partner Cost Breakdown
                  </div>
                  <div className="text-[10px] text-teal-700 font-mono space-y-0.5">
                    {selectedInvoice.costLines?.map((cl, cIdx) => (
                      <div key={cIdx} className="flex justify-between">
                        <span className="truncate max-w-[280px]">{cl.description}:</span>
                        <strong>{formatInvoiceCurrency(cl.amount, selectedInvoice.regionId)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-bold border-t border-teal-200 pt-1.5 flex justify-between text-teal-800">
                    <span>Total Partner Cost:</span>
                    <span className="font-mono">{formatInvoiceCurrency(selectedInvoice.costLines?.reduce((sum, c) => sum + c.amount, 0) || 0, selectedInvoice.regionId)}</span>
                  </div>
                  <div className="text-xs font-bold flex justify-between text-teal-800">
                    <span>NET HUB MARGIN:</span>
                    <span className="text-green-700 font-mono">
                      {formatInvoiceCurrency(selectedInvoice.grossMargin, selectedInvoice.regionId)} ({(((selectedInvoice.grossMargin || 0) / (selectedInvoice.totalAmount || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </DrawerSection>
            )}

            {/* Notes */}
            {selectedInvoice.notes && (
              <DrawerSection title="Memo">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-500 leading-relaxed italic">
                  {selectedInvoice.notes}
                </div>
              </DrawerSection>
            )}

            {/* Bank remittance */}
            {selectedInvoice.status !== 'unpaid' && (
              <DrawerSection title="Bank Remittance">
                <div className="bg-slate-50/50 p-3 border border-slate-200/50 rounded-lg text-[10px] text-slate-500 grid grid-cols-3 gap-2 leading-tight">
                  <div>
                    <strong>BANK:</strong><br />
                    {selectedInvoice.regionId === 'IN' ? 'HDFC Bank' : 'Emirates NBD'}
                  </div>
                  <div>
                    <strong>ACCOUNT:</strong><br />
                    {selectedInvoice.regionId === 'IN' ? 'XXXX-XXXX-1234' : 'AE070331234567890123456'}
                  </div>
                  <div className="text-right">
                    <strong>SWIFT:</strong><br />
                    {selectedInvoice.regionId === 'IN' ? 'HDFCINBB' : 'EBILAEAD'}
                  </div>
                </div>
              </DrawerSection>
            )}
          </>
        ) : (
          /* Create / edit form (preserved logic, drawer layout) */
          <form onSubmit={handleSaveInvoiceSubmit} className="space-y-4">
            {drawerMode === 'create' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-amber-900 uppercase tracking-tight flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-amber-700" /> Choose Completed Job
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
                    onChange={e => handleJobSelect(e.target.value)}
                    className="w-full bg-white border border-amber-300 p-2 rounded text-xs text-slate-800 font-bold"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.drawerLabel}>Billing Region</label>
                <input type="text" value={formRegionId} readOnly className="mt-1 w-full bg-slate-100 border border-slate-200 p-2 rounded text-xs select-none font-bold" />
              </div>
              <div>
                <label className={T.drawerLabel}>Payment Terms</label>
                <input type="text" value={formPaymentTerms} readOnly className="mt-1 w-full bg-slate-100 border border-slate-200 p-2 rounded text-xs select-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.drawerLabel}>Issue Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required
                  className="mt-1 w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800" />
              </div>
              <div>
                <label className={T.drawerLabel}>Due Date</label>
                <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} required
                  className="mt-1 w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800 font-semibold" />
              </div>
            </div>

            {formJobId && (
              <div className="space-y-3.5 border-t border-slate-100 pt-4">
                <h4 className={T.sectionHeader}>Billing Lines Verification</h4>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-800">Base Haulage Tariff</strong>
                    <div className="text-[10px] text-slate-400">Pulled from regional Quotation Agreement</div>
                  </div>
                  <input
                    type="number"
                    value={formBaseRate}
                    onChange={e => setFormBaseRate(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-200 p-1 rounded text-right font-mono font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <span className={T.drawerLabel}>Extra Surcharge Adjustments</span>
                  {surchargeInputLines.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">No extra incidentals were recorded for this job.</div>
                  ) : (
                    <div className="space-y-2">
                      {surchargeInputLines.map((line, idx) => (
                        <div key={idx} className="flex gap-2 items-center text-xs bg-slate-50 p-2 border border-slate-100 rounded">
                          <input
                            type="checkbox"
                            checked={line.billToCustomer}
                            onChange={e => {
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
                            onChange={e => {
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

                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-teal-800 font-extrabold text-[10.5px] uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Subcontractor Buy Rates (Margin Forecast)
                  </div>
                  <p className="text-[10px] text-teal-600 leading-normal">
                    Standard partner buy rate index (Contractor Share: 70%). Not printed on customer's layout.
                  </p>
                  <div className="space-y-2 divide-y divide-teal-100 pt-1 text-xs">
                    {costInputLines.map((cline, cidx) => (
                      <div key={cidx} className="flex justify-between items-center py-1.5 first:pt-0">
                        <span className="text-teal-700 truncate font-medium">{cline.description}</span>
                        <input
                          type="number"
                          value={cline.amount}
                          onChange={e => {
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

                <div className="border-t border-slate-100 pt-3 flex flex-col items-end text-xs space-y-1.5 font-bold text-slate-800 bg-slate-50/50 p-3 rounded">
                  <div className="flex justify-between w-60 text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatInvoiceCurrency(formCalculations.subTotal, formRegionId)}</span>
                  </div>
                  <div className="flex justify-between w-60 text-slate-500 font-medium">
                    <span>{formCalculations.taxLabel} ({formCalculations.taxRate}%):</span>
                    <span className="font-mono">{formatInvoiceCurrency(formCalculations.taxAmount, formRegionId)}</span>
                  </div>
                  <div className="flex justify-between w-60 border-t border-slate-200 pt-1.5 font-extrabold text-blue-600 text-sm">
                    <span>Total:</span>
                    <span className="font-mono">{formatInvoiceCurrency(formCalculations.totalAmount, formRegionId)}</span>
                  </div>
                  <div className="w-full border-t border-slate-200 pt-2.5 mt-1.5 flex justify-between items-center text-[10.5px] font-medium text-slate-500">
                    <span>Vendor Cost: <strong className="font-mono text-red-600">{formatInvoiceCurrency(formCalculations.totalCost, formRegionId)}</strong></span>
                    <span>Net Margin: <strong className="font-mono text-green-600">{formatInvoiceCurrency(formCalculations.grossMargin, formRegionId)} ({formCalculations.marginPercent.toFixed(1)}%)</strong></span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className={T.drawerLabel}>Public Notes / Memo</label>
              <textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Add auxiliary directives, customs reference number, bank tracking numbers..."
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs text-slate-800"
                rows={2}
              />
            </div>
          </form>
        )}
      </DetailDrawer>

      {/* Payment settlement modal (preserved) */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 font-sans">
          <div className="bg-white border border-slate-200 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <strong className="text-slate-800 text-sm uppercase tracking-wide flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-emerald-500" /> Record Settlement Remittance
              </strong>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-medium leading-relaxed">
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
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded font-semibold font-mono"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">AMOUNT RECEIVED ({selectedInvoice.currency})</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded font-bold font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded text-xs font-semibold"
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
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-xs transition flex items-center gap-1 shadow-sm"
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
