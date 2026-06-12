/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Job, Customer, SurchargeRule, ShippingLine, Region, User, ScenarioType } from '../types';
import {
  Package, AlertTriangle, Clock, CheckCircle2, XCircle, DollarSign,
  ChevronRight, FileText, RotateCcw, Shield, Scale, Receipt,
  StickyNote, X, Search, Filter, ChevronDown, Anchor, MapPin,
  Info, AlertCircle, TrendingUp, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContainerLifecycleProps {
  jobs: Job[];
  customers: Customer[];
  surcharges: SurchargeRule[];
  shippingLines: ShippingLine[];
  regions: Region[];
  currentUser: User;
  onTriggerReturnJob: (jobId: string) => void;
  onUpdateJob: (job: Job) => void;
}

type ContainerStatus = 'On Track' | 'Due Today' | 'Warning' | 'Overdue' | 'Returned' | 'Disputed';
type SummaryFilter = 'all' | 'overdue' | 'due_today' | 'due_soon' | 'returned' | 'disputed';
type ScenarioFilter = 'ALL' | ScenarioType;

interface EnrichedJob extends Job {
  daysLeft: number;
  containerStatus: ContainerStatus;
  calculatedDetentionAmount: number;
  detentionRate: number;
}

const STATUS_STYLE: Record<ContainerStatus, string> = {
  'On Track':  'bg-green-50 text-green-700 border-green-200',
  'Due Today': 'bg-orange-50 text-orange-700 border-orange-200',
  'Warning':   'bg-amber-50 text-amber-700 border-amber-200',
  'Overdue':   'bg-red-50 text-red-700 border-red-200',
  'Returned':  'bg-slate-100 text-slate-500 border-slate-200',
  'Disputed':  'bg-purple-50 text-purple-700 border-purple-200',
};

const LIABILITY_STYLE: Record<string, string> = {
  customer: 'bg-green-50 text-green-700 border-green-200',
  company:  'bg-red-50 text-red-700 border-red-200',
  disputed: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function ContainerLifecycle({
  jobs, customers, surcharges, shippingLines, regions, currentUser,
  onTriggerReturnJob, onUpdateJob
}: ContainerLifecycleProps) {

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState<ScenarioFilter>('ALL');
  const [detentionNotesDraft, setDetentionNotesDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [liabilitySaved, setLiabilitySaved] = useState(false);

  // Default DET rule rate
  const detentionRate = useMemo(() =>
    surcharges.find(s => s.code === 'DET')?.amount ?? 5000,
    [surcharges]
  );

  // Enrich jobs with computed status + detention amounts
  const monitoredJobs = useMemo((): EnrichedJob[] => {
    return jobs
      .filter(j => j.scenario === 'IMP' || j.scenario === 'EXP')
      .map(job => {
        const lineRule = shippingLines.find(
          sl => sl.id === job.shippingLineId || sl.name === job.shippingLine
        );
        // Per-line detention rate if available, else global DET rule
        const jobDetentionRate = lineRule?.detentionRatePerDay ?? detentionRate;

        let daysLeft = Infinity;
        let containerStatus: ContainerStatus = 'On Track';
        let calculatedDetentionAmount = job.detentionChargeAmount ?? 0;

        if (job.gateInTimestamp) {
          containerStatus = 'Returned';
          daysLeft = 0;
          // Check if returned late
          if (job.freeTimeExpiry) {
            const gate = new Date(job.gateInTimestamp).getTime();
            const expiry = new Date(job.freeTimeExpiry).getTime();
            if (gate > expiry) {
              const lateDays = Math.ceil((gate - expiry) / (1000 * 60 * 60 * 24));
              calculatedDetentionAmount = lateDays * jobDetentionRate;
            } else {
              calculatedDetentionAmount = 0;
            }
          }
        } else if (job.freeTimeExpiry) {
          daysLeft = Math.ceil(
            (new Date(job.freeTimeExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (job.detentionLiability === 'disputed') {
            containerStatus = 'Disputed';
            const overdueDays = Math.abs(Math.min(daysLeft, 0));
            calculatedDetentionAmount = overdueDays * jobDetentionRate;
          } else if (daysLeft < 0) {
            containerStatus = 'Overdue';
            calculatedDetentionAmount = Math.abs(daysLeft) * jobDetentionRate;
          } else if (daysLeft === 0) {
            containerStatus = 'Due Today';
          } else if (daysLeft <= 3) {
            containerStatus = 'Warning';
          }
        }

        return { ...job, daysLeft, containerStatus, calculatedDetentionAmount, detentionRate: jobDetentionRate };
      });
  }, [jobs, detentionRate, shippingLines]);

  const totalAtRisk = useMemo(() =>
    monitoredJobs.reduce((sum, j) => sum + (j.calculatedDetentionAmount ?? 0), 0),
    [monitoredJobs]
  );

  const summaryStats = useMemo(() => ({
    overdue:    monitoredJobs.filter(j => j.containerStatus === 'Overdue').length,
    dueToday:   monitoredJobs.filter(j => j.containerStatus === 'Due Today').length,
    dueSoon:    monitoredJobs.filter(j => j.containerStatus === 'Warning').length,
    accruedAmt: monitoredJobs.reduce((sum, j) => sum + (j.calculatedDetentionAmount ?? 0), 0),
  }), [monitoredJobs]);

  const filteredJobs = useMemo(() => {
    let list = monitoredJobs;
    if (summaryFilter !== 'all') {
      const filterMap: Record<SummaryFilter, ContainerStatus[]> = {
        all:      [],
        overdue:  ['Overdue'],
        due_today:['Due Today'],
        due_soon: ['Warning'],
        returned: ['Returned'],
        disputed: ['Disputed'],
      };
      list = list.filter(j => filterMap[summaryFilter].includes(j.containerStatus));
    }
    if (scenarioFilter !== 'ALL') {
      list = list.filter(j => j.scenario === scenarioFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j => {
        const cust = customers.find(c => c.id === j.customerId);
        return j.containerNo.toLowerCase().includes(q) ||
          cust?.name.toLowerCase().includes(q) ||
          j.shippingLine.toLowerCase().includes(q);
      });
    }
    return list;
  }, [monitoredJobs, summaryFilter, scenarioFilter, searchQuery, customers]);

  const selectedJob = useMemo(() =>
    monitoredJobs.find(j => j.id === selectedJobId) ?? null,
    [monitoredJobs, selectedJobId]
  );

  const handleSelectJob = (id: string) => {
    const job = monitoredJobs.find(j => j.id === id);
    setSelectedJobId(id);
    setDetentionNotesDraft(job?.detentionNotes ?? '');
    setNoteSaved(false);
    setLiabilitySaved(false);
  };

  const handleSaveNotes = () => {
    if (!selectedJob) return;
    onUpdateJob({ ...selectedJob, detentionNotes: detentionNotesDraft });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleLiabilityChange = (jobId: string, liability: Job['detentionLiability']) => {
    const job = monitoredJobs.find(j => j.id === jobId);
    if (!job) return;
    onUpdateJob({ ...job, detentionLiability: liability });
    setLiabilitySaved(true);
    setTimeout(() => setLiabilitySaved(false), 2000);
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const expiryColor = (job: EnrichedJob) => {
    if (job.gateInTimestamp) return 'text-slate-400';
    if (job.daysLeft < 0) return 'text-red-600 font-bold';
    if (job.daysLeft === 0) return 'text-orange-600 font-bold animate-pulse';
    if (job.daysLeft <= 3) return 'text-amber-600 font-bold';
    return 'text-green-600';
  };

  const daysLeftDisplay = (job: EnrichedJob) => {
    if (job.gateInTimestamp) return <span className="text-slate-400 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Returned</span>;
    if (job.daysLeft === Infinity) return <span className="text-slate-400">—</span>;
    if (job.daysLeft < 0) return <span className="text-red-600 font-bold animate-pulse">{Math.abs(job.daysLeft)}d overdue</span>;
    if (job.daysLeft === 0) return <span className="text-orange-600 font-bold animate-pulse">Due Today</span>;
    if (job.daysLeft <= 3) return <span className="text-amber-600 font-bold">+{job.daysLeft}d left</span>;
    return <span className="text-green-600 font-bold">+{job.daysLeft}d left</span>;
  };

  // ── Liability Assessment for detail panel ──────────────────────
  const getLiabilityAssessment = (job: EnrichedJob) => {
    if (job.gateInTimestamp && job.freeTimeExpiry) {
      const gateIn = new Date(job.gateInTimestamp).getTime();
      const expiry = new Date(job.freeTimeExpiry).getTime();
      if (gateIn <= expiry) {
        return { type: 'none' as const, overdueDays: 0 };
      }
      // Gate-in was late. Check if driver "arrived" before expiry (port congestion)
      const arrivedMilestone = job.milestones.find(m =>
        m.completed && (m.label.includes('Arrived') || m.label.includes('Port Entry') || m.label.includes('Reached'))
      );
      if (arrivedMilestone?.timestamp) {
        const arrivedTime = new Date(arrivedMilestone.timestamp).getTime();
        if (arrivedTime <= expiry) {
          return { type: 'disputed_congestion' as const, overdueDays: Math.ceil((gateIn - expiry) / 86400000) };
        }
      }
      return { type: 'late_arrival' as const, overdueDays: Math.ceil((gateIn - expiry) / 86400000) };
    }
    if (!job.gateInTimestamp) {
      if (job.daysLeft < 0) return { type: 'pending_overdue' as const, overdueDays: Math.abs(job.daysLeft) };
      return { type: 'pending_on_time' as const, overdueDays: 0 };
    }
    return { type: 'none' as const, overdueDays: 0 };
  };

  const SUMMARY_CARDS = [
    {
      key: 'overdue' as SummaryFilter,
      label: 'Overdue',
      value: summaryStats.overdue,
      emoji: '🔴',
      color: 'border-red-200 bg-red-50',
      valueColor: 'text-red-600',
    },
    {
      key: 'due_today' as SummaryFilter,
      label: 'Due Today',
      value: summaryStats.dueToday,
      emoji: '🟡',
      color: 'border-amber-200 bg-amber-50',
      valueColor: 'text-amber-600',
    },
    {
      key: 'due_soon' as SummaryFilter,
      label: 'Due in 3 Days',
      value: summaryStats.dueSoon,
      emoji: '🟢',
      color: 'border-green-200 bg-green-50',
      valueColor: 'text-green-600',
    },
    {
      key: 'all' as SummaryFilter,
      label: 'Accrued This Month',
      value: formatCurrency(summaryStats.accruedAmt),
      emoji: '💰',
      color: 'border-slate-200 bg-white',
      valueColor: 'text-slate-800',
      isAmount: true,
    },
  ];

  return (
    <div className="flex h-full w-full bg-slate-50 relative overflow-hidden" id="container-lifecycle-monitor">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 space-y-5 overflow-y-auto">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
                <Package className="text-blue-600 w-5 h-5" /> Container &amp; Demurrage Monitor
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track container detention exposure, manage liability, and avoid shipping line penalties.
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 shrink-0 ${
              totalAtRisk > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              <DollarSign className="w-4 h-4" />
              {formatCurrency(totalAtRisk)} at risk
            </div>
          </div>

          {/* ── Summary Strip ── */}
          <div className="grid grid-cols-4 gap-3">
            {SUMMARY_CARDS.map(card => (
              <motion.button
                key={card.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSummaryFilter(summaryFilter === card.key ? 'all' : card.key)}
                className={`p-4 border-2 rounded-lg text-left transition-all shadow-sm cursor-pointer ${
                  card.color
                } ${summaryFilter === card.key ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                  <span className="text-lg">{card.emoji}</span>
                </div>
                <div className={`text-2xl font-black ${card.valueColor}`}>{card.value}</div>
              </motion.button>
            ))}
          </div>

          {/* ── Filter Bar ── */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search container, customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex bg-white border border-slate-200 rounded-md p-0.5 gap-0.5">
              {(['ALL', 'IMP', 'EXP'] as ScenarioFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScenarioFilter(s)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded transition ${
                    scenarioFilter === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {(summaryFilter !== 'all' || searchQuery || scenarioFilter !== 'ALL') && (
              <button
                onClick={() => { setSummaryFilter('all'); setSearchQuery(''); setScenarioFilter('ALL'); }}
                className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          {/* ── Main Table ── */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 px-4">Container</th>
                  <th className="py-2.5 px-3">Shipping Line</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-2">Scenario</th>
                  <th className="py-2.5 px-3">Gate Out</th>
                  <th className="py-2.5 px-2">Free Time</th>
                  <th className="py-2.5 px-3">Expiry</th>
                  <th className="py-2.5 px-2">Days Left</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-3">Detention</th>
                  <th className="py-2.5 px-3">Liability</th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-10 text-xs text-slate-400 italic">
                      No containers match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map(job => {
                    const customer = customers.find(c => c.id === job.customerId);
                    const shippingLine = shippingLines.find(sl => sl.id === job.shippingLineId || sl.name === job.shippingLine);
                    const isSelected = selectedJobId === job.id;
                    const isOverdueRow = job.containerStatus === 'Overdue';

                    return (
                      <motion.tr
                        key={job.id}
                        animate={isOverdueRow ? { backgroundColor: ['#ffffff', '#fff1f2', '#ffffff'] } : {}}
                        transition={isOverdueRow ? { repeat: Infinity, duration: 3 } : {}}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                        onClick={() => handleSelectJob(job.id)}
                      >
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-slate-900 text-xs">{job.containerNo}</span>
                          <div className="text-[10px] font-mono text-slate-400">{job.sealNo}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-xs text-slate-700 font-medium truncate max-w-[100px]">{job.shippingLine}</div>
                          {shippingLine?.scacCode && (
                            <span className="text-[9px] font-bold font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded">{shippingLine.scacCode}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-[110px] text-xs">{customer?.name ?? '—'}</td>
                        <td className="py-2.5 px-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            job.scenario === 'IMP' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {job.scenario}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">{formatDate(job.gateOutTimestamp)}</td>
                        <td className="py-2.5 px-2 text-xs text-slate-500">{job.freeTimeDays ? `${job.freeTimeDays}d` : '—'}</td>
                        <td className={`py-2.5 px-3 font-mono text-xs ${expiryColor(job)}`}>
                          {formatDate(job.freeTimeExpiry)}
                        </td>
                        <td className="py-2.5 px-2">{daysLeftDisplay(job)}</td>
                        <td className="py-2.5 px-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[job.containerStatus]}`}>
                            {job.containerStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {job.calculatedDetentionAmount > 0 ? (
                            <span className="font-bold text-red-600 font-mono text-xs">
                              {formatCurrency(job.calculatedDetentionAmount)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                          <select
                            value={job.detentionLiability ?? ''}
                            onChange={e => handleLiabilityChange(job.id, (e.target.value || null) as Job['detentionLiability'])}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border cursor-pointer focus:outline-none ${
                              job.detentionLiability ? LIABILITY_STYLE[job.detentionLiability] : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <option value="">—</option>
                            <option value="customer">Customer</option>
                            <option value="company">Company</option>
                            <option value="disputed">Disputed</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            className="text-slate-300 hover:text-blue-600 transition"
                            onClick={e => { e.stopPropagation(); handleSelectJob(job.id); }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Detail Panel (slide-out) ── */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            key={selectedJob.id}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-[380px] shrink-0 bg-white border-l border-slate-200 shadow-2xl overflow-y-auto flex flex-col"
          >
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="font-mono text-lg font-black text-slate-900">{selectedJob.containerNo}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[selectedJob.containerStatus]}`}>
                    {selectedJob.containerStatus}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{selectedJob.jobNo}</span>
                </div>
              </div>
              <button onClick={() => setSelectedJobId(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">

              {/* ── Section A: Container Identity ── */}
              <PanelSection title="Container Identity" icon={<Package className="w-3.5 h-3.5" />}>
                <div className="grid grid-cols-2 gap-2">
                  <PanelRow label="Shipping Line" value={selectedJob.shippingLine || '—'} />
                  <PanelRow label="Container Size" value={selectedJob.containerSize} />
                  <PanelRow label="Scenario" value={selectedJob.scenario} />
                  <PanelRow label="Seal No" value={selectedJob.sealNo} mono />
                </div>
              </PanelSection>

              {/* ── Section B: Timeline ── */}
              <PanelSection title="Detention Timeline" icon={<Clock className="w-3.5 h-3.5" />}>
                <div className="relative pl-5">
                  {/* Vertical line */}
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200" />

                  <TimelineItem
                    icon="📅"
                    label="Gate Out"
                    detail={formatDate(selectedJob.gateOutTimestamp)}
                    sub="Container left port custody"
                    done
                  />

                  <TimelineItem
                    icon="⏱"
                    label={`Free Time Expires (${selectedJob.freeTimeDays ?? '?'} days)`}
                    detail={formatDate(selectedJob.freeTimeExpiry)}
                    sub={`${selectedJob.freeTimeDays ?? '?'} days from gate out`}
                    done={!!selectedJob.freeTimeExpiry}
                    warn={selectedJob.daysLeft < 0 && !selectedJob.gateInTimestamp}
                  />

                  {selectedJob.gateInTimestamp ? (
                    <TimelineItem
                      icon="✅"
                      label="Gate In — Empty Returned"
                      detail={formatDate(selectedJob.gateInTimestamp)}
                      sub="LEGAL EVIDENCE — immutable record"
                      done
                      immutable
                    />
                  ) : (
                    <TimelineItem
                      icon={selectedJob.daysLeft < 0 ? '🚨' : '📍'}
                      label="Today"
                      detail={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      sub={
                        selectedJob.daysLeft < 0
                          ? `OVERDUE by ${Math.abs(selectedJob.daysLeft)} day${Math.abs(selectedJob.daysLeft) !== 1 ? 's' : ''}`
                          : selectedJob.daysLeft === 0
                            ? 'Due today — return required'
                            : `${selectedJob.daysLeft} day${selectedJob.daysLeft !== 1 ? 's' : ''} remaining`
                      }
                      warn={selectedJob.daysLeft <= 0}
                      current
                    />
                  )}

                  {!selectedJob.gateInTimestamp && selectedJob.daysLeft < 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => onTriggerReturnJob(selectedJob.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Trigger Return Job →
                      </button>
                    </div>
                  )}
                </div>
              </PanelSection>

              {/* ── Section C: Liability Assessment ── */}
              <PanelSection title="Penalty Liability" icon={<Scale className="w-3.5 h-3.5" />}>
                <LiabilityPanel job={selectedJob} onUpdate={onUpdateJob} />
              </PanelSection>

              {/* ── Section D: Detention Calculation ── */}
              {selectedJob.calculatedDetentionAmount > 0 && (
                <PanelSection title="Detention Calculation" icon={<Receipt className="w-3.5 h-3.5" />}>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Detention Rate</span>
                      <span className="font-bold">{formatCurrency(selectedJob.detentionRate)}/day</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Overdue Days</span>
                      <span className="font-bold text-red-600">
                        {selectedJob.gateInTimestamp && selectedJob.freeTimeExpiry
                          ? Math.ceil((new Date(selectedJob.gateInTimestamp).getTime() - new Date(selectedJob.freeTimeExpiry).getTime()) / 86400000)
                          : Math.abs(Math.min(selectedJob.daysLeft, 0))
                        } days
                      </span>
                    </div>
                    <div className="flex justify-between py-2 bg-red-50 rounded px-3 -mx-3">
                      <span className="font-bold text-slate-700">Calculated Amount</span>
                      <span className="font-black text-red-600 text-sm">{formatCurrency(selectedJob.calculatedDetentionAmount)}</span>
                    </div>

                    {selectedJob.detentionLiability === 'customer' && (
                      <button
                        onClick={() => alert(`Adding ${formatCurrency(selectedJob.calculatedDetentionAmount)} detention surcharge to next invoice for this customer.`)}
                        className="w-full mt-2 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Add to Customer Invoice →
                      </button>
                    )}
                    {selectedJob.detentionLiability === 'company' && (
                      <button
                        onClick={() => alert(`Recording ${formatCurrency(selectedJob.calculatedDetentionAmount)} as internal cost against job ${selectedJob.jobNo}.`)}
                        className="w-full mt-2 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Record as Internal Cost →
                      </button>
                    )}
                  </div>
                </PanelSection>
              )}

              {/* ── Section E: Notes ── */}
              <PanelSection title="Detention Notes" icon={<StickyNote className="w-3.5 h-3.5" />}>
                <textarea
                  rows={3}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 resize-none"
                  placeholder="Add notes about detention dispute, liability decision, or shipper communications..."
                  value={detentionNotesDraft}
                  onChange={e => setDetentionNotesDraft(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2">
                  {selectedJob.detentionNotes && (
                    <p className="text-[10px] text-slate-400 italic truncate mr-2">
                      Last saved: {selectedJob.detentionNotes.substring(0, 40)}...
                    </p>
                  )}
                  <button
                    onClick={handleSaveNotes}
                    className={`ml-auto px-3 py-1.5 text-xs font-bold rounded transition flex items-center gap-1 ${
                      noteSaved
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {noteSaved ? <><CheckCircle2 className="w-3 h-3" /> Saved</> : 'Save Notes'}
                  </button>
                </div>
              </PanelSection>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liability saved toast */}
      <AnimatePresence>
        {liabilitySaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xl flex items-center gap-2 z-50"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" /> Liability assignment saved
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────────

function PanelSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-slate-100 rounded-lg p-4">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <span className="text-blue-500">{icon}</span> {title}
      </h4>
      {children}
    </div>
  );
}

function PanelRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 block">{label}</span>
      <span className={`text-xs font-bold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function TimelineItem({
  icon, label, detail, sub, done, warn, current, immutable
}: {
  icon: string; label: string; detail: string; sub: string;
  done?: boolean; warn?: boolean; current?: boolean; immutable?: boolean;
}) {
  return (
    <div className={`mb-4 last:mb-0 ${warn ? 'text-red-700' : current ? 'text-blue-700' : 'text-slate-700'}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 relative z-10">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold">{label}</p>
          <p className={`font-mono text-xs ${warn ? 'text-red-600 font-black' : 'text-slate-600'}`}>{detail}</p>
          <p className={`text-[10px] mt-0.5 ${warn ? 'text-red-500' : 'text-slate-400'}`}>{sub}</p>
          {immutable && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
              🔒 Immutable — legal evidence
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LiabilityPanel({ job, onUpdate }: { job: EnrichedJob; onUpdate: (j: Job) => void }) {
  if (job.gateInTimestamp && job.freeTimeExpiry) {
    const gateIn = new Date(job.gateInTimestamp).getTime();
    const expiry = new Date(job.freeTimeExpiry).getTime();

    if (gateIn <= expiry) {
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 font-bold text-green-800 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> No Liability
          </div>
          <p className="text-green-700">Driver returned container before free time expired. Gate-in timestamp recorded as evidence.</p>
          <p className="text-[10px] text-green-600 mt-1.5 font-mono">
            Gate-in: {new Date(job.gateInTimestamp).toLocaleString('en-IN')}
          </p>
        </div>
      );
    }

    // Check for port congestion scenario
    const arrivedMilestone = job.milestones.find(m =>
      m.completed && (m.label.includes('Arrived') || m.label.includes('Port Entry') || m.label.includes('Reached'))
    );
    if (arrivedMilestone?.timestamp && new Date(arrivedMilestone.timestamp).getTime() <= expiry) {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Disputed — Port Congestion
            </div>
            <p className="text-amber-700">Driver arrived at port before deadline but port queue delayed gate-in. Recommend dispute with shipping line.</p>
            <div className="mt-2 space-y-0.5 text-[10px] font-mono text-amber-600">
              <div>Driver arrived: {new Date(arrivedMilestone.timestamp!).toLocaleString('en-IN')}</div>
              <div>Free time expired: {new Date(job.freeTimeExpiry!).toLocaleString('en-IN')}</div>
              <div>Gate-in recorded: {new Date(job.gateInTimestamp).toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onUpdate({ ...job, detentionLiability: 'disputed' })}
              className="flex-1 py-1.5 text-[10px] font-bold bg-purple-600 text-white rounded hover:bg-purple-700 transition">
              Mark Disputed
            </button>
            <button onClick={() => onUpdate({ ...job, detentionLiability: 'customer' })}
              className="flex-1 py-1.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition">
              Customer Liable
            </button>
          </div>
        </div>
      );
    }

    // Driver arrived late
    return (
      <div className="space-y-3">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 font-bold text-red-800 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Driver Arrived Late
          </div>
          <p className="text-red-700">Container was returned after free time expired. Liability must be assigned.</p>
          <p className="text-[10px] text-slate-500 mt-1.5">Customer liable if delay caused by customer. Company liable if dispatch was late.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onUpdate({ ...job, detentionLiability: 'customer' })}
            className="flex-1 py-1.5 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700 transition">
            Customer Liable
          </button>
          <button onClick={() => onUpdate({ ...job, detentionLiability: 'company' })}
            className="flex-1 py-1.5 text-[10px] font-bold bg-red-600 text-white rounded hover:bg-red-700 transition">
            Company Liable
          </button>
        </div>
      </div>
    );
  }

  if (!job.gateInTimestamp && job.daysLeft < 0) {
    return (
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs">
        <div className="flex items-center gap-1.5 font-bold text-orange-800 mb-1">
          <Clock className="w-3.5 h-3.5" /> Overdue — Return Not Yet Recorded
        </div>
        <p className="text-orange-700">Container has not been returned. Liability will be determined on return.</p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
      <div className="flex items-center gap-1.5 font-bold text-blue-800 mb-1">
        <Clock className="w-3.5 h-3.5" /> Pending Return
      </div>
      <p className="text-blue-700">Container not yet returned. Liability determined on return.</p>
    </div>
  );
}
