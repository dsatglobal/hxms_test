/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Two-way Payments Module:
 *   Tab 1 — Customer Receipts (Money IN)
 *   Tab 2 — Vendor Payables  (Money OUT)
 *   Tab 3 — Reconciliation   (Margin Summary)
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, Receipt,
  FileText, Printer, CheckCircle2, Clock, AlertTriangle, ChevronDown,
  ArrowUpRight, ArrowDownRight, Wallet, Scale, Plus, X,
  ChevronRight, CheckSquare, Square,
} from 'lucide-react';

import {
  CustomerPayment, VendorPayment, Invoice, Job, Customer, Vendor,
  Region, User, Tenant, InvoiceSettings,
} from '../types';
import { T, badgeClass } from './shared/ui';
import DetailDrawer from './shared/DetailDrawer';
import PrintReceiptView from './PrintReceiptView';
import PrintPaymentAdviceView from './PrintPaymentAdviceView';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtAmount = (n: number, symbol: string) =>
  symbol + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const PERIOD_OPTIONS = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'Last Quarter', value: 'last_quarter' },
  { label: 'This Year', value: 'this_year' },
];

function inPeriod(dateStr: string, period: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = Math.floor(m / 3);
  if (period === 'this_month') return d.getFullYear() === y && d.getMonth() === m;
  if (period === 'last_month') {
    const lm = m === 0 ? 11 : m - 1;
    const ly = m === 0 ? y - 1 : y;
    return d.getFullYear() === ly && d.getMonth() === lm;
  }
  if (period === 'this_quarter') {
    const qm = q * 3;
    return d.getFullYear() === y && d.getMonth() >= qm && d.getMonth() < qm + 3;
  }
  if (period === 'last_quarter') {
    const lq = q === 0 ? 3 : q - 1;
    const lqy = q === 0 ? y - 1 : y;
    const qm = lq * 3;
    return d.getFullYear() === lqy && d.getMonth() >= qm && d.getMonth() < qm + 3;
  }
  if (period === 'this_year') return d.getFullYear() === y;
  return true;
}

function currencySymbolFor(currency: string) {
  if (currency === 'INR') return '₹';
  if (currency === 'AED') return 'AED ';
  if (currency === 'GBP') return '£';
  if (currency === 'USD') return '$';
  return currency + ' ';
}

function ageDays(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

const RECEIPT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  cash: 'Cash',
  online: 'Online',
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, sub, icon: Icon, color = 'blue', amber = false,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string; amber?: boolean;
}) {
  const bg = amber ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200';
  const valColor = amber ? 'text-amber-700' : 'text-slate-900';
  const iconColor = amber ? 'text-amber-500' : `text-${color}-500`;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`${bg} border rounded-lg p-4 flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className={`text-xl font-black tabular-nums ${valColor}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentsConsoleProps {
  customerPayments: CustomerPayment[];
  vendorPayments: VendorPayment[];
  invoices: Invoice[];
  jobs: Job[];
  customers: Customer[];
  vendors: Vendor[];
  regions: Region[];
  currentUser: User;
  invoiceSettings: InvoiceSettings[];
  activeTenant: Tenant;
  receiptSequence: Record<string, number>;
  adviceSequence: Record<string, number>;
  onAddCustomerPayment: (p: CustomerPayment) => void;
  onAddVendorPayment: (p: VendorPayment) => void;
  onUpdateVendorPayment: (p: VendorPayment) => void;
  onIncrementReceiptSequence: (regionId: string) => void;
  onIncrementAdviceSequence: (regionId: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentsConsole({
  customerPayments, vendorPayments, invoices, jobs, customers, vendors,
  regions, currentUser, invoiceSettings, activeTenant,
  receiptSequence, adviceSequence,
  onAddCustomerPayment, onAddVendorPayment, onUpdateVendorPayment,
  onIncrementReceiptSequence, onIncrementAdviceSequence,
}: PaymentsConsoleProps) {

  const [activeTab, setActiveTab] = useState<'receipts' | 'payables' | 'reconciliation'>('receipts');
  const [period, setPeriod] = useState('this_month');

  const myRegion = regions.find(r =>
    currentUser.regionAccess?.includes('ALL')
      ? r.code === 'IN'
      : r.code === currentUser.regionId
  );
  const currency = myRegion?.currency ?? 'INR';
  const sym = currencySymbolFor(currency);
  const isCorp = currentUser.regionAccess?.includes('ALL');
  const invSettings = invoiceSettings.find(s => s.regionId === (myRegion?.code ?? 'IN')) ?? invoiceSettings[0];

  // ── Print state
  const [printReceipt, setPrintReceipt] = useState<CustomerPayment | null>(null);
  const [printAdvice, setPrintAdvice] = useState<VendorPayment | null>(null);

  // ── Customer Receipts state
  const [recordDrawerCustomerId, setRecordDrawerCustomerId] = useState<string | null>(null);
  const [viewReceiptPayment, setViewReceiptPayment] = useState<CustomerPayment | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [pAmount, setPAmount] = useState('');
  const [pDate, setPDate] = useState(new Date().toISOString().split('T')[0]);
  const [pMethod, setPMethod] = useState<CustomerPayment['paymentMethod']>('bank_transfer');
  const [pRef, setPRef] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [pAllocations, setPAllocations] = useState<{ [invoiceId: string]: number }>({});
  const [pSuccess, setPSuccess] = useState<string | null>(null);

  // ── Vendor Payables state
  const [vendorDrawerId, setVendorDrawerId] = useState<string | null>(null);
  const [vendorDrawerTab, setVendorDrawerTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());
  const [pendingAdvicesOpen, setPendingAdvicesOpen] = useState(true);
  const [markPaidAdviceId, setMarkPaidAdviceId] = useState<string | null>(null);
  const [mpDate, setMpDate] = useState(new Date().toISOString().split('T')[0]);
  const [mpMethod, setMpMethod] = useState('bank_transfer');
  const [mpRef, setMpRef] = useState('');

  // ─── Derived data ──────────────────────────────────────────────────────────

  const periodInvoices = useMemo(() =>
    invoices.filter(inv => inPeriod(inv.issueDate, period)), [invoices, period]);

  const periodCustomerPayments = useMemo(() =>
    customerPayments.filter(p => inPeriod(p.paymentDate, period)), [customerPayments, period]);

  const totalBilled = useMemo(() => periodInvoices.reduce((s, i) => s + i.totalAmount, 0), [periodInvoices]);

  const totalCollected = useMemo(() =>
    periodCustomerPayments.filter(p => p.status !== 'unallocated').reduce((s, p) => s + p.totalAmount, 0),
    [periodCustomerPayments]);

  const totalOutstanding = useMemo(() =>
    invoices.reduce((s, i) => {
      if (i.status === 'paid') return s;
      return s + (i.balanceDue ?? i.totalAmount);
    }, 0), [invoices]);

  const totalUnallocated = useMemo(() =>
    customerPayments.filter(p => p.status === 'unallocated').reduce((s, p) => s + p.totalAmount, 0),
    [customerPayments]);

  const agingRows = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, { customer: Customer; buckets: [number, number, number, number]; lastPayment?: string }>();
    invoices.forEach(inv => {
      if (inv.status === 'paid') return;
      const bal = inv.balanceDue ?? inv.totalAmount;
      if (bal <= 0) return;
      const cust = customers.find(c => c.id === inv.customerId);
      if (!cust) return;
      const days = Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000);
      const entry = map.get(inv.customerId) ?? { customer: cust, buckets: [0, 0, 0, 0] as [number, number, number, number] };
      if (days <= 0) entry.buckets[0] += bal;
      else if (days <= 30) entry.buckets[1] += bal;
      else if (days <= 60) entry.buckets[2] += bal;
      else entry.buckets[3] += bal;
      map.set(inv.customerId, entry);
    });
    customerPayments.forEach(p => {
      const entry = map.get(p.customerId);
      if (entry && (!entry.lastPayment || p.paymentDate > entry.lastPayment)) {
        entry.lastPayment = p.paymentDate;
      }
    });
    return [...map.values()].sort((a, b) => b.buckets[3] - a.buckets[3]);
  }, [invoices, customers, customerPayments]);

  const outstandingForCustomer = (custId: string) =>
    invoices.filter(inv => inv.customerId === custId && inv.status !== 'paid' && (inv.balanceDue ?? inv.totalAmount) > 0);

  const vendorRows = useMemo(() => {
    const map = new Map<string, { vendor: Vendor; totalBuy: number; totalPaid: number }>();
    vendorPayments.forEach(vp => {
      let entry = map.get(vp.vendorId);
      if (!entry) {
        const v = vendors.find(x => x.id === vp.vendorId);
        if (!v) return;
        entry = { vendor: v, totalBuy: 0, totalPaid: 0 };
        map.set(vp.vendorId, entry);
      }
      entry.totalBuy += vp.subtotal;
      if (vp.status === 'paid') entry.totalPaid += vp.subtotal;
    });
    return [...map.values()];
  }, [vendors, vendorPayments]);

  const pendingAdvices = vendorPayments.filter(vp => vp.status !== 'paid');

  const totalVendorOwed = vendorPayments.reduce((s, v) => s + v.subtotal, 0);
  const totalVendorPaid = vendorPayments.filter(v => v.status === 'paid').reduce((s, v) => s + v.subtotal, 0);
  const netMargin = totalCollected - totalVendorPaid;
  const marginPct = totalCollected > 0 ? (netMargin / totalCollected) * 100 : 0;
  const collectPct = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
  const collectColor = collectPct >= 80 ? 'bg-green-500' : collectPct >= 60 ? 'bg-amber-500' : 'bg-red-500';

  const scenarioBreakdown = useMemo(() => {
    const scenarios = ['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'] as const;
    return scenarios.map(sc => {
      const scInvoices = invoices.filter(inv => {
        const job = jobs.find(j => j.id === inv.jobId);
        return job?.scenario === sc;
      });
      const revenue = scInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const cost = scInvoices.reduce((s, i) => s + i.costLines.reduce((cs, cl) => cs + cl.amount, 0), 0);
      const margin = revenue - cost;
      const pct = revenue > 0 ? (margin / revenue) * 100 : 0;
      return { scenario: sc, jobs: scInvoices.length, revenue, cost, margin, pct };
    }).filter(r => r.jobs > 0);
  }, [invoices, jobs]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { customer: Customer; invoiced: number; collected: number }>();
    invoices.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      if (!cust) return;
      const entry = map.get(inv.customerId) ?? { customer: cust, invoiced: 0, collected: 0 };
      entry.invoiced += inv.totalAmount;
      entry.collected += inv.paidAmount ?? 0;
      map.set(inv.customerId, entry);
    });
    return [...map.values()].sort((a, b) => b.invoiced - a.invoiced).slice(0, 5);
  }, [invoices, customers]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const autoAllocate = (custId: string) => {
    const outstanding = outstandingForCustomer(custId);
    let remaining = parseFloat(pAmount) || 0;
    const allocs: Record<string, number> = {};
    for (const inv of outstanding) {
      if (remaining <= 0) break;
      const bal = inv.balanceDue ?? inv.totalAmount;
      const apply = Math.min(remaining, bal);
      allocs[inv.id] = apply;
      remaining -= apply;
    }
    setPAllocations(allocs);
  };

  const handleSavePayment = (custId: string) => {
    const amt = parseFloat(pAmount);
    if (!amt || !pRef.trim()) return;
    const regionCode = myRegion?.code ?? 'IN';
    const seq = (receiptSequence[regionCode] ?? 0) + 1;
    const receiptNo = `RCP-${regionCode}-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
    const allocArr: { invoiceId: string; invoiceNo: string; allocatedAmount: number }[] =
      Object.entries(pAllocations)
        .filter(([, v]) => (v as number) > 0)
        .map(([invId, allocAmt]) => {
          const inv = invoices.find(i => i.id === invId)!;
          return { invoiceId: invId, invoiceNo: inv.invoiceNo ?? inv.invoiceNumber, allocatedAmount: allocAmt as number };
        });
    const allocated = allocArr.reduce((s, a) => s + a.allocatedAmount, 0);
    const status: CustomerPayment['status'] =
      allocated === 0 ? 'unallocated' : allocated >= amt ? 'allocated' : 'partial';
    const payment: CustomerPayment = {
      id: `cp-${Date.now()}`,
      receiptNo,
      regionId: regionCode,
      customerId: custId,
      invoiceIds: allocArr.map(a => a.invoiceId),
      allocations: allocArr,
      totalAmount: amt,
      currency,
      paymentDate: pDate,
      paymentMethod: pMethod,
      referenceNo: pRef.trim(),
      status,
      notes: pNotes.trim() || undefined,
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };
    onAddCustomerPayment(payment);
    onIncrementReceiptSequence(regionCode);
    setPSuccess(receiptNo);
    setPAmount(''); setPRef(''); setPNotes(''); setPAllocations({});
  };

  const handleGenerateAdvice = () => {
    if (selectedTrips.size === 0 || !vendorDrawerId) return;
    const regionCode = myRegion?.code ?? 'IN';
    const seq = (adviceSequence[regionCode] ?? 0) + 1;
    const adviceNo = `PA-${regionCode}-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;
    const lineItems = [...selectedTrips].map(jobNo => {
      const job = jobs.find(j => j.jobNo === jobNo || j.id === jobNo);
      return {
        tripId: job?.id ?? jobNo,
        jobNo,
        description: `${job?.scenario ?? ''} leg — ${job?.originLocationId ?? ''} to ${job?.destinationLocationId ?? ''}`,
        buyRate: 10000,
        surchargesBuy: 1000,
        totalPayable: 11000,
      };
    });
    const payment: VendorPayment = {
      id: `vp-${Date.now()}`,
      adviceNo,
      regionId: regionCode,
      vendorId: vendorDrawerId,
      tripIds: [...selectedTrips],
      lineItems,
      subtotal: lineItems.reduce((s, l) => s + l.totalPayable, 0),
      currency,
      status: 'pending',
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
    };
    onAddVendorPayment(payment);
    onIncrementAdviceSequence(regionCode);
    setSelectedTrips(new Set());
    setPrintAdvice(payment);
  };

  const handleMarkPaid = (advice: VendorPayment) => {
    onUpdateVendorPayment({ ...advice, status: 'paid', paymentDate: mpDate, paymentMethod: mpMethod, referenceNo: mpRef, paidAt: new Date().toISOString() });
    setMarkPaidAdviceId(null);
    setMpDate(new Date().toISOString().split('T')[0]);
    setMpMethod('bank_transfer');
    setMpRef('');
  };

  const handleApprove = (advice: VendorPayment) => {
    onUpdateVendorPayment({ ...advice, status: 'approved', approvedBy: currentUser.email, approvedAt: new Date().toISOString() });
  };

  // ─── Drawers ───────────────────────────────────────────────────────────────

  const RecordDrawer = () => {
    const custId = recordDrawerCustomerId;
    if (!custId) return null;
    const cust = customers.find(c => c.id === custId);
    const outstanding = outstandingForCustomer(custId);
    const amt = parseFloat(pAmount) || 0;
    const allocated = (Object.values(pAllocations) as number[]).reduce((s, v) => s + v, 0);
    const unallocated = amt - allocated;
    return (
      <DetailDrawer isOpen onClose={() => { setRecordDrawerCustomerId(null); setPSuccess(null); setPAllocations({}); }}
        title={`Record Payment — ${cust?.name ?? '…'}`} width={520}>
        {pSuccess ? (
          <div className="p-6 flex flex-col items-center gap-4">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </motion.div>
            <div className="text-center">
              <div className="text-base font-bold text-slate-900">Payment Recorded ✓</div>
              <div className="text-sm text-slate-500 mt-1">Receipt No: <span className="font-mono font-bold text-blue-600">{pSuccess}</span></div>
            </div>
            <button onClick={() => { const p = customerPayments.find(x => x.receiptNo === pSuccess); if (p) setPrintReceipt(p); }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">
              <Printer className="w-4 h-4 text-blue-600" /> Print Receipt
            </button>
            <button onClick={() => setPSuccess(null)} className="text-xs text-slate-400 hover:text-slate-600">Record another payment</button>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            <div>
              <div className={`${T.sectionHeader} mb-3`}>Payment Details</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={T.drawerLabel}>Amount Received *</label>
                  <input type="number" min={0} value={pAmount} onChange={e => { setPAmount(e.target.value); setPAllocations({}); }}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="0.00" />
                </div>
                <div>
                  <label className={T.drawerLabel}>Payment Date *</label>
                  <input type="date" value={pDate} onChange={e => setPDate(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className={T.drawerLabel}>Payment Method *</label>
                  <select value={pMethod} onChange={e => setPMethod(e.target.value as CustomerPayment['paymentMethod'])}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={T.drawerLabel}>Reference No *</label>
                  <input type="text" value={pRef} onChange={e => setPRef(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Bank ref / cheque no" />
                </div>
                <div className="col-span-2">
                  <label className={T.drawerLabel}>Notes</label>
                  <textarea rows={2} value={pNotes} onChange={e => setPNotes(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
                </div>
              </div>
            </div>
            {outstanding.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={T.sectionHeader}>Invoice Allocation</div>
                  {amt > 0 && (
                    <button onClick={() => autoAllocate(custId)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> Auto-allocate (FIFO)
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-2 text-left text-slate-400 font-bold uppercase tracking-wide text-[10px]">Invoice</th>
                        <th className="p-2 text-right text-slate-400 font-bold uppercase tracking-wide text-[10px]">Balance</th>
                        <th className="p-2 text-right text-slate-400 font-bold uppercase tracking-wide text-[10px]">Allocate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {outstanding.map(inv => (
                        <tr key={inv.id}>
                          <td className="p-2">
                            <div className="font-mono font-bold text-blue-600">{inv.invoiceNo ?? inv.invoiceNumber}</div>
                            <div className="text-slate-400 text-[10px]">{inv.issueDate}</div>
                          </td>
                          <td className="p-2 text-right font-semibold">{sym}{(inv.balanceDue ?? inv.totalAmount).toLocaleString()}</td>
                          <td className="p-2">
                            <input type="number" min={0} max={inv.balanceDue ?? inv.totalAmount}
                              value={(pAllocations[inv.id] as number | undefined) ?? ''}
                              onChange={e => setPAllocations(prev => ({ ...prev, [inv.id]: parseFloat(e.target.value) || 0 }))}
                              className="w-24 border border-slate-200 rounded px-2 py-1 text-right font-bold focus:outline-none focus:ring-1 focus:ring-blue-300" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {amt > 0 && (
                  <div className={`mt-3 p-3 rounded-lg text-xs space-y-1 ${unallocated < 0 ? 'bg-red-50 border border-red-100' : unallocated > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-green-50 border border-green-100'}`}>
                    <div className="flex justify-between"><span className="text-slate-500">Payment amount:</span><span className="font-bold">{fmtAmount(amt, sym)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Allocated:</span><span className="font-bold text-green-700">{fmtAmount(allocated, sym)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-1">
                      <span className="font-semibold">{unallocated < 0 ? 'Over-payment:' : 'Unallocated:'}</span>
                      <span className={`font-bold ${unallocated < 0 ? 'text-red-600' : unallocated > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {fmtAmount(Math.abs(unallocated), sym)}
                      </span>
                    </div>
                    {unallocated > 0 && unallocated < amt && (
                      <div className="text-amber-600 text-[10px] italic">{fmtAmount(unallocated, sym)} will be held as advance credit against future invoices.</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => handleSavePayment(custId)} disabled={!pAmount || !pRef.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-lg transition">
              Save Payment
            </button>
          </div>
        )}
      </DetailDrawer>
    );
  };

  const ViewReceiptDrawer = () => {
    if (!viewReceiptPayment) return null;
    const p = viewReceiptPayment;
    const cust = customers.find(c => c.id === p.customerId);
    return (
      <DetailDrawer isOpen onClose={() => setViewReceiptPayment(null)} title={`Receipt — ${p.receiptNo}`} width={480}>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><div className={T.drawerLabel}>Customer</div><div className={T.drawerValue}>{cust?.name ?? p.customerId}</div></div>
            <div><div className={T.drawerLabel}>Amount</div><div className="text-lg font-black text-green-600">{sym}{p.totalAmount.toLocaleString()}</div></div>
            <div><div className={T.drawerLabel}>Date</div><div className={T.drawerValue}>{p.paymentDate}</div></div>
            <div><div className={T.drawerLabel}>Method</div><div className={T.drawerValue}>{RECEIPT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</div></div>
            <div className="col-span-2"><div className={T.drawerLabel}>Reference</div><div className="font-mono font-bold text-slate-700">{p.referenceNo}</div></div>
            <div className="col-span-2"><div className={T.drawerLabel}>Status</div><span className={badgeClass(p.status)}>{p.status}</span></div>
          </div>
          {p.allocations.length > 0 && (
            <div>
              <div className={`${T.sectionHeader} mb-2`}>Allocation Breakdown</div>
              {p.allocations.map((a, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-slate-50 text-xs">
                  <span className="font-mono text-blue-600">{a.invoiceNo}</span>
                  <span className="font-bold">{sym}{a.allocatedAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setPrintReceipt(p)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">
            <Printer className="w-4 h-4 text-blue-600" /> Print Receipt
          </button>
        </div>
      </DetailDrawer>
    );
  };

  const VendorDrawer = () => {
    if (!vendorDrawerId) return null;
    const vendor = vendors.find(v => v.id === vendorDrawerId);
    const vendorAdvicesPaid = vendorPayments.filter(vp => vp.vendorId === vendorDrawerId && vp.status === 'paid');
    const balance = vendorPayments.filter(vp => vp.vendorId === vendorDrawerId && vp.status !== 'paid').reduce((s, v) => s + v.subtotal, 0);
    const unpaidJobs = jobs.filter(j => j.status === 'completed' && !j.vendorPaymentId);
    const selTotal = [...selectedTrips].length * 11000; // placeholder

    return (
      <DetailDrawer isOpen onClose={() => { setVendorDrawerId(null); setSelectedTrips(new Set()); }}
        title={vendor?.vendorName ?? '…'} width={560}
        footer={vendorDrawerTab === 'unpaid' && selectedTrips.size > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">{selectedTrips.size} trips · {sym}{selTotal.toLocaleString()}</span>
            <button onClick={handleGenerateAdvice}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-lg flex items-center gap-2">
              <FileText className="w-4 h-4" /> Generate Payment Advice
            </button>
          </div>
        ) : undefined}>
        <div className="p-5">
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${balance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              Balance: {sym}{balance.toLocaleString()}
            </span>
          </div>
          <div className="flex border-b border-slate-100 mb-4 gap-4 text-xs font-bold uppercase">
            {(['unpaid', 'paid'] as const).map(t => (
              <button key={t} onClick={() => setVendorDrawerTab(t)}
                className={`pb-2 border-b-2 transition ${vendorDrawerTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>
                {t === 'unpaid' ? 'Unpaid Trips' : 'Paid'}
              </button>
            ))}
          </div>
          {vendorDrawerTab === 'unpaid' && (
            unpaidJobs.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">No unpaid completed trips</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase">
                    <th className="p-1.5 text-left w-6">
                      <button onClick={() => setSelectedTrips(selectedTrips.size === unpaidJobs.length ? new Set() : new Set(unpaidJobs.map(j => j.jobNo)))}>
                        {selectedTrips.size === unpaidJobs.length ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="p-1.5 text-left">Job No</th>
                    <th className="p-1.5 text-left">Scenario</th>
                    <th className="p-1.5 text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {unpaidJobs.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="p-1.5">
                        <button onClick={() => setSelectedTrips(prev => { const n = new Set(prev); n.has(j.jobNo) ? n.delete(j.jobNo) : n.add(j.jobNo); return n; })}>
                          {selectedTrips.has(j.jobNo) ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                        </button>
                      </td>
                      <td className="p-1.5 font-mono font-bold text-slate-700">{j.jobNo}</td>
                      <td className="p-1.5"><span className={badgeClass(j.scenario)}>{j.scenario}</span></td>
                      <td className="p-1.5 text-right text-slate-400">{ageDays(j.completionTime ?? j.createdAt)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {vendorDrawerTab === 'paid' && (
            vendorAdvicesPaid.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">No paid advices yet</div>
            ) : vendorAdvicesPaid.map(vp => (
              <div key={vp.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <div className="font-mono font-bold text-violet-600 text-xs">{vp.adviceNo}</div>
                  <div className="text-[10px] text-slate-400">{vp.tripIds.length} trips · {vp.paidAt?.slice(0, 10)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{sym}{vp.subtotal.toLocaleString()}</span>
                  <button onClick={() => setPrintAdvice(vp)} className="text-violet-600 hover:text-violet-800"><Printer className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </DetailDrawer>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'receipts' as const, label: 'Customer Receipts', icon: Receipt },
    { id: 'payables' as const, label: 'Vendor Payables', icon: TrendingDown },
    { id: 'reconciliation' as const, label: 'Reconciliation', icon: Scale },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className={T.pageTitle}>Payments</h1>
          <p className={T.pageSubtitle}>Receipts, payables &amp; reconciliation</p>
        </div>
        <div className="flex items-center gap-3">
          {!isCorp && myRegion && (
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">{myRegion.code}</span>
          )}
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════ TAB 1 — CUSTOMER RECEIPTS ══════ */}
        {activeTab === 'receipts' && (
          <motion.div key="receipts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Total Billed" value={fmtAmount(totalBilled, sym)} icon={FileText} color="slate" sub="This period" />
              <SummaryCard label="Collected" value={fmtAmount(totalCollected, sym)} icon={ArrowUpRight} color="green" />
              <SummaryCard label="Outstanding" value={fmtAmount(totalOutstanding, sym)} icon={Clock} color="orange" />
              <SummaryCard label="Unallocated" value={fmtAmount(totalUnallocated, sym)} icon={Wallet} color="amber" amber={totalUnallocated > 0} />
            </div>

            {/* Aging table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Customer Aging</h3>
                <span className="text-xs text-slate-400">{agingRows.length} customers with outstanding balances</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-right">Outstanding</th>
                      <th className="p-3 text-right">≤ 30d</th>
                      <th className="p-3 text-right">31–60d</th>
                      <th className="p-3 text-right">61–90d</th>
                      <th className="p-3 text-right text-red-400">90d+</th>
                      <th className="p-3 text-right">Last Payment</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agingRows.length === 0 ? (
                      <tr><td colSpan={8} className="p-6 text-center text-slate-400">No outstanding balances</td></tr>
                    ) : agingRows.map(({ customer, buckets, lastPayment }) => {
                      const total = buckets.reduce((s, v) => s + v, 0);
                      return (
                        <tr key={customer.id} className="hover:bg-slate-50/50">
                          <td className="p-3"><div className={T.cellPrimary}>{customer.name}</div><div className={T.cellMuted}>{customer.taxId}</div></td>
                          <td className="p-3 text-right font-bold text-slate-900">{sym}{total.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-500">{buckets[0] > 0 ? sym + buckets[0].toLocaleString() : '—'}</td>
                          <td className={`p-3 text-right font-semibold ${buckets[1] > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{buckets[1] > 0 ? sym + buckets[1].toLocaleString() : '—'}</td>
                          <td className={`p-3 text-right font-semibold ${buckets[2] > 0 ? 'text-orange-600' : 'text-slate-300'}`}>{buckets[2] > 0 ? sym + buckets[2].toLocaleString() : '—'}</td>
                          <td className={`p-3 text-right font-bold ${buckets[3] > 0 ? 'text-red-600' : 'text-slate-300'}`}>{buckets[3] > 0 ? sym + buckets[3].toLocaleString() : '—'}</td>
                          <td className="p-3 text-right text-slate-400">{lastPayment ?? '—'}</td>
                          <td className="p-3">
                            <button onClick={() => { setRecordDrawerCustomerId(customer.id); setPSuccess(null); setPAllocations({}); }}
                              className="px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center gap-1 whitespace-nowrap">
                              <Plus className="w-3 h-3" /> Record Payment
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {agingRows.length > 0 && (
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td className="p-3 font-bold text-slate-700">Totals</td>
                        {[
                          agingRows.reduce((s, r) => s + r.buckets.reduce((a, b) => a + b, 0), 0),
                          agingRows.reduce((s, r) => s + r.buckets[0], 0),
                          agingRows.reduce((s, r) => s + r.buckets[1], 0),
                          agingRows.reduce((s, r) => s + r.buckets[2], 0),
                          agingRows.reduce((s, r) => s + r.buckets[3], 0),
                        ].map((v, i) => (
                          <td key={i} className={`p-3 text-right font-bold ${i === 4 && v > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {v > 0 ? sym + v.toLocaleString() : '—'}
                          </td>
                        ))}
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Payment history */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <button onClick={() => setHistoryOpen(h => !h)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <span className="font-bold text-slate-800 text-sm">Recent Payments ({customerPayments.length})</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {historyOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-y border-slate-100 text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                          <th className="p-3 text-left">Receipt No</th>
                          <th className="p-3 text-left">Customer</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-left">Method</th>
                          <th className="p-3 text-left">Reference</th>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {customerPayments.length === 0 ? (
                          <tr><td colSpan={7} className="p-6 text-center text-slate-400">No payments recorded yet</td></tr>
                        ) : customerPayments.map(p => {
                          const cust = customers.find(c => c.id === p.customerId);
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setViewReceiptPayment(p)}>
                              <td className="p-3 font-mono font-bold text-blue-600">{p.receiptNo}</td>
                              <td className="p-3 font-semibold text-slate-900">{cust?.name ?? p.customerId}</td>
                              <td className="p-3 text-right font-bold">{sym}{p.totalAmount.toLocaleString()}</td>
                              <td className="p-3 text-slate-500">{RECEIPT_METHOD_LABELS[p.paymentMethod]}</td>
                              <td className="p-3 font-mono text-slate-500">{p.referenceNo}</td>
                              <td className="p-3 text-slate-500">{p.paymentDate}</td>
                              <td className="p-3"><span className={badgeClass(p.status)}>{p.status}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ══════ TAB 2 — VENDOR PAYABLES ══════ */}
        {activeTab === 'payables' && (
          <motion.div key="payables" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard label="Total Owed" value={fmtAmount(totalVendorOwed, sym)} icon={ArrowDownRight} color="purple" />
              <SummaryCard label="Paid" value={fmtAmount(totalVendorPaid, sym)} icon={CheckCircle2} color="green" />
              <SummaryCard label="Outstanding" value={fmtAmount(totalVendorOwed - totalVendorPaid, sym)} icon={Clock} color="amber" />
              <SummaryCard label="Pending Advices" value={`${pendingAdvices.length}`} icon={FileText} color="orange" amber={pendingAdvices.length > 0} />
            </div>

            {/* Vendor summary table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-sm">Vendor Summary</h3></div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                    <th className="p-3 text-left">Vendor</th>
                    <th className="p-3 text-right">Buy Amount</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vendorRows.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400">No vendor payment records</td></tr>
                  ) : vendorRows.map(({ vendor, totalBuy, totalPaid }) => {
                    const balance = totalBuy - totalPaid;
                    return (
                      <tr key={vendor.id} className="hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => { setVendorDrawerId(vendor.id); setVendorDrawerTab('unpaid'); setSelectedTrips(new Set()); }}>
                        <td className="p-3"><div className={T.cellPrimary}>{vendor.vendorName}</div><div className={T.cellMuted}>{vendor.vendorCode} · {vendor.specialization}</div></td>
                        <td className="p-3 text-right font-semibold">{sym}{totalBuy.toLocaleString()}</td>
                        <td className="p-3 text-right text-green-600 font-semibold">{sym}{totalPaid.toLocaleString()}</td>
                        <td className={`p-3 text-right font-bold ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>{sym}{balance.toLocaleString()}</td>
                        <td className="p-3"><span className={badgeClass(balance <= 0 ? 'allocated' : 'partial')}>{balance <= 0 ? 'Settled' : 'Outstanding'}</span></td>
                        <td className="p-3"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pending advices */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <button onClick={() => setPendingAdvicesOpen(o => !o)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  Pending Payment Advices
                  {pendingAdvices.length > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{pendingAdvices.length}</span>}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${pendingAdvicesOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {pendingAdvicesOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-y border-slate-100 text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                          <th className="p-3 text-left">Advice No</th>
                          <th className="p-3 text-left">Vendor</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-left">Generated</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pendingAdvices.length === 0 ? (
                          <tr><td colSpan={6} className="p-6 text-center text-slate-400">No pending advices</td></tr>
                        ) : pendingAdvices.map(vp => {
                          const vend = vendors.find(v => v.id === vp.vendorId);
                          return (
                            <tr key={vp.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-violet-600">{vp.adviceNo}</td>
                              <td className="p-3 font-semibold text-slate-900">{vend?.vendorName ?? vp.vendorId}</td>
                              <td className="p-3 text-right font-bold">{sym}{vp.subtotal.toLocaleString()}</td>
                              <td className="p-3 text-slate-500">{vp.createdAt.slice(0, 10)}</td>
                              <td className="p-3"><span className={badgeClass(vp.status)}>{vp.status}</span></td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {vp.status === 'pending' && (
                                    <button onClick={() => handleApprove(vp)}
                                      className="px-2 py-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100">
                                      Approve
                                    </button>
                                  )}
                                  <button onClick={() => setMarkPaidAdviceId(markPaidAdviceId === vp.id ? null : vp.id)}
                                    className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
                                    Record Payment
                                  </button>
                                  <button onClick={() => setPrintAdvice(vp)} className="text-violet-500 hover:text-violet-700"><Printer className="w-4 h-4" /></button>
                                </div>
                                {markPaidAdviceId === vp.id && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                                        <input type="date" value={mpDate} onChange={e => setMpDate(e.target.value)}
                                          className="w-full mt-0.5 border border-slate-200 rounded px-2 py-1 text-xs" />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Method</label>
                                        <select value={mpMethod} onChange={e => setMpMethod(e.target.value)}
                                          className="w-full mt-0.5 border border-slate-200 rounded px-2 py-1 text-xs">
                                          <option value="bank_transfer">Bank Transfer</option>
                                          <option value="cheque">Cheque</option>
                                          <option value="cash">Cash</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Reference</label>
                                        <input type="text" value={mpRef} onChange={e => setMpRef(e.target.value)}
                                          className="w-full mt-0.5 border border-slate-200 rounded px-2 py-1 text-xs font-mono" />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleMarkPaid(vp)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">
                                        Mark as Paid ✓
                                      </button>
                                      <button onClick={() => setMarkPaidAdviceId(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                                    </div>
                                  </motion.div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ══════ TAB 3 — RECONCILIATION ══════ */}
        {activeTab === 'reconciliation' && (
          <motion.div key="recon" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenue */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                <div className={T.sectionHeader}>Revenue Side</div>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: 'Total Invoiced', val: totalBilled },
                    { label: 'Collected', val: totalCollected, color: 'text-green-600' },
                    { label: 'Outstanding', val: totalOutstanding, color: 'text-orange-500' },
                    { label: 'Unallocated Cash', val: totalUnallocated, color: 'text-amber-500' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-slate-500">{r.label}</span>
                      <span className={`font-bold ${r.color ?? 'text-slate-900'}`}>{sym}{r.val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Collection rate</span><span className="font-bold">{collectPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${collectColor} transition-all`} style={{ width: `${Math.min(collectPct, 100)}%` }} />
                  </div>
                </div>
              </div>
              {/* Cost */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                <div className={T.sectionHeader}>Cost Side</div>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: 'Total Vendor Payable', val: totalVendorOwed },
                    { label: 'Paid', val: totalVendorPaid, color: 'text-green-600' },
                    { label: 'Outstanding Payable', val: totalVendorOwed - totalVendorPaid, color: 'text-amber-500' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-slate-500">{r.label}</span>
                      <span className={`font-bold ${r.color ?? 'text-slate-900'}`}>{sym}{r.val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Margin card */}
            <div className={`bg-white border-2 rounded-xl p-6 ${marginPct >= 40 ? 'border-green-200' : marginPct >= 20 ? 'border-amber-200' : 'border-red-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Margin Summary</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{PERIOD_OPTIONS.find(o => o.value === period)?.label}</div>
                </div>
                <Scale className={`w-7 h-7 ${marginPct >= 40 ? 'text-green-500' : marginPct >= 20 ? 'text-amber-500' : 'text-red-500'}`} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Revenue Collected</span>
                  <span className="font-bold text-green-700">{sym}{totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor Costs Paid</span>
                  <span className="font-bold text-red-500">({sym}{totalVendorPaid.toLocaleString()})</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                  <span className="font-bold text-slate-900">Net Margin</span>
                  <span className={`font-black text-lg ${netMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>{sym}{netMargin.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Margin %</span>
                  <span className={`font-bold ${marginPct >= 40 ? 'text-green-600' : marginPct >= 20 ? 'text-amber-600' : 'text-red-600'}`}>{marginPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-400 italic">Based on collected revenue only — excludes outstanding receivables</div>
            </div>

            {/* Scenario breakdown */}
            {scenarioBreakdown.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-sm">Breakdown by Scenario</h3></div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                      <th className="p-3 text-left">Scenario</th><th className="p-3 text-right">Jobs</th>
                      <th className="p-3 text-right">Revenue</th><th className="p-3 text-right">Cost</th>
                      <th className="p-3 text-right">Margin</th><th className="p-3 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {scenarioBreakdown.map(r => (
                      <tr key={r.scenario} className="hover:bg-slate-50/50">
                        <td className="p-3"><span className={badgeClass(r.scenario)}>{r.scenario}</span></td>
                        <td className="p-3 text-right text-slate-500">{r.jobs}</td>
                        <td className="p-3 text-right font-semibold">{sym}{r.revenue.toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-500">{sym}{r.cost.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold">{sym}{r.margin.toLocaleString()}</td>
                        <td className={`p-3 text-right font-bold ${r.pct >= 60 ? 'text-green-600' : r.pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{r.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top customers */}
            {topCustomers.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-sm">Top Customers by Revenue</h3></div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wide text-[10px]">
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-right">Invoiced</th>
                      <th className="p-3 text-right">Collected</th>
                      <th className="p-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topCustomers.map(({ customer, invoiced, collected }) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">{customer.name}</td>
                        <td className="p-3 text-right">{sym}{invoiced.toLocaleString()}</td>
                        <td className="p-3 text-right text-green-600 font-semibold">{sym}{collected.toLocaleString()}</td>
                        <td className={`p-3 text-right font-bold ${invoiced - collected > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{sym}{(invoiced - collected).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drawers & Print ─────────────────────────────────────────────── */}
      <RecordDrawer />
      <ViewReceiptDrawer />
      <VendorDrawer />

      {printReceipt && (
        <PrintReceiptView payment={printReceipt} customer={customers.find(c => c.id === printReceipt.customerId)}
          invoices={invoices} tenant={activeTenant} invoiceSettings={invSettings} onClose={() => setPrintReceipt(null)} />
      )}
      {printAdvice && (
        <PrintPaymentAdviceView payment={printAdvice} vendor={vendors.find(v => v.id === printAdvice.vendorId)}
          tenant={activeTenant} invoiceSettings={invSettings} onClose={() => setPrintAdvice(null)} />
      )}
    </div>
  );
}
