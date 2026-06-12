/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Customer, Quotation, LocationGeo, Job, ROT, ConsignmentNote,
  ScenarioType, WorkflowMilestoneConfig, ShippingLine, ContainerType,
  Vessel, Zone, SurchargeRule, Region, User, InvoiceSettings, JobStatus
} from '../types';
import {
  Layers, FilePlus, ShieldAlert, CheckCircle2, FileText, Lock, Printer,
  Award, Search, ChevronRight, Package, Ship, FileCheck, AlertTriangle,
  Clock, Truck, BarChart3, Calendar, Hash, Info, X, ChevronDown,
  Container, MapPin, Weight, Anchor, BookOpen, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createMilestonesForScenario } from '../data';

interface JobBookerProps {
  jobs: Job[];
  customers: Customer[];
  quotations: Quotation[];
  locations: LocationGeo[];
  rots: ROT[];
  consignmentNotes: ConsignmentNote[];
  shippingLines: ShippingLine[];
  containerTypes: ContainerType[];
  vessels: Vessel[];
  zones: Zone[];
  surcharges: SurchargeRule[];
  regions: Region[];
  currentUser: User;
  jobSequence: number;
  onGenerateJobNo: () => string;
  invoiceSettings: InvoiceSettings[];
  onAddJob: (job: Job, rot: ROT, cn: ConsignmentNote) => void;
  onConfirmRot: (rotId: string, jobId: string) => void;
  workflowConfigs?: WorkflowMilestoneConfig[];
  prefilledBookingContext?: { customerId: string; quoteId: string; rateItemId?: string; } | null;
  onClearPrefilledBookingContext?: () => void;
}

type PanelView = 'list' | 'create' | 'detail';
type DetailTab = 'overview' | 'container' | 'documents' | 'milestones' | 'surcharges' | 'govtrefs';
type CreateStep = 1 | 2 | 3;
type ListTab = 'all' | 'pending' | 'active' | 'completed';

const STATUS_COLOR: Record<JobStatus, string> = {
  pending:    'bg-slate-100 text-slate-600 border-slate-200',
  scheduled:  'bg-blue-50 text-blue-700 border-blue-200',
  dispatched: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  active:     'bg-amber-50 text-amber-700 border-amber-200',
  completed:  'bg-green-50 text-green-700 border-green-200',
  exception:  'bg-red-50 text-red-700 border-red-200',
};

const SCENARIO_COLOR: Record<ScenarioType, string> = {
  IMP:    'bg-blue-100 text-blue-800',
  EXP:    'bg-emerald-100 text-emerald-800',
  Inland: 'bg-purple-100 text-purple-800',
  EMTY:   'bg-slate-100 text-slate-600',
  RETURN: 'bg-orange-100 text-orange-800',
};

export default function JobBooker({
  jobs, customers, quotations, locations, rots, consignmentNotes,
  shippingLines, containerTypes, vessels, zones, surcharges, regions,
  currentUser, jobSequence, onGenerateJobNo, invoiceSettings,
  onAddJob, onConfirmRot, workflowConfigs,
  prefilledBookingContext, onClearPrefilledBookingContext
}: JobBookerProps) {

  // Panel state
  const [panelView, setPanelView] = useState<PanelView>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [listTab, setListTab] = useState<ListTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create form state
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  // Step 1
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedRateItemId, setSelectedRateItemId] = useState('');
  // Step 2
  const [containerNo, setContainerNo] = useState('');
  const [sealNo, setSealNo] = useState('');
  const [weightKg, setWeightKg] = useState(22000);
  const [containerTypeId, setContainerTypeId] = useState('');
  const [shippingLineId, setShippingLineId] = useState('');
  const [vesselId, setVesselId] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [voyageNo, setVoyageNo] = useState('');
  const [eta, setEta] = useState('');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  // Step 3 govt refs
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [customsRefNo, setCustomsRefNo] = useState('');
  const [boeNo, setBoeNo] = useState('');
  const [shippingBillNo, setShippingBillNo] = useState('');

  // Sync prefilled booking context
  React.useEffect(() => {
    if (prefilledBookingContext) {
      setSelectedCustomerId(prefilledBookingContext.customerId);
      setSelectedQuoteId(prefilledBookingContext.quoteId);
      if (prefilledBookingContext.rateItemId) setSelectedRateItemId(prefilledBookingContext.rateItemId);
      setPanelView('create');
      setCreateStep(prefilledBookingContext.rateItemId ? 2 : 1);
    }
  }, [prefilledBookingContext]);

  // Derived
  const filteredQuotes = useMemo(() =>
    quotations.filter(q => q.customerId === selectedCustomerId && q.status === 'confirmed'),
    [quotations, selectedCustomerId]
  );

  const activeQuote = useMemo(() =>
    quotations.find(q => q.id === selectedQuoteId),
    [quotations, selectedQuoteId]
  );

  const activeRateItem = useMemo(() => {
    if (!activeQuote) return null;
    return (activeQuote.rates ?? activeQuote.rateItems ?? []).find(r => r.id === selectedRateItemId);
  }, [activeQuote, selectedRateItemId]);

  const selectedJob = useMemo(() =>
    jobs.find(j => j.id === selectedJobId),
    [jobs, selectedJobId]
  );

  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (listTab !== 'all') {
      const statusMap: Record<ListTab, JobStatus[]> = {
        all: [],
        pending: ['pending', 'scheduled'],
        active: ['active', 'dispatched'],
        completed: ['completed', 'exception'],
      };
      list = list.filter(j => statusMap[listTab].includes(j.status));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j => {
        const cust = customers.find(c => c.id === j.customerId);
        return j.jobNo.toLowerCase().includes(q) ||
          j.containerNo.toLowerCase().includes(q) ||
          cust?.name.toLowerCase().includes(q) ||
          j.scenario.toLowerCase().includes(q);
      });
    }
    return list;
  }, [jobs, listTab, searchQuery, customers]);

  const resetCreateForm = () => {
    setSelectedCustomerId(''); setSelectedQuoteId(''); setSelectedRateItemId('');
    setContainerNo(''); setSealNo(''); setWeightKg(22000); setContainerTypeId('');
    setShippingLineId(''); setVesselId(''); setVesselName(''); setVoyageNo('');
    setEta(''); setTargetDeliveryDate('');
    setEwayBillNo(''); setCustomsRefNo(''); setBoeNo(''); setShippingBillNo('');
    setCreateStep(1);
    onClearPrefilledBookingContext?.();
  };

  const handleConfirmBooking = () => {
    if (!activeRateItem || !selectedCustomerId || !selectedQuoteId || !selectedRateItemId || !containerNo || !sealNo) return;

    const jobId = `job-${Date.now()}`;
    const jobNo = onGenerateJobNo();
    const rotId = `rot-${Date.now()}`;
    const rotNo = `ROT-${Math.floor(Math.random() * 900000 + 100000)}`;
    const cnId = `cn-${Date.now()}`;
    const cnNo = `CN-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;

    const resolvedShippingLine = shippingLines.find(sl => sl.id === shippingLineId);
    const resolvedVessel = vessels.find(v => v.id === vesselId);

    const milestones = (() => {
      const customConfig = workflowConfigs?.find(c => c.scenario === activeRateItem.scenario);
      if (customConfig && customConfig.steps.length > 0) {
        return customConfig.steps.map((st, sIdx) => ({
          id: `m-custom-${sIdx}`,
          label: st.label,
          description: st.description,
          completed: sIdx === 0,
          timestamp: sIdx === 0 ? new Date().toISOString() : undefined,
          requiresEvidence: st.requiresEvidence
        }));
      }
      return createMilestonesForScenario(activeRateItem.scenario);
    })();

    const newJob: Job = {
      id: jobId,
      jobNo,
      tenantId: 'tenant-1',
      regionId: currentUser.regionId || 'IN',
      customerId: selectedCustomerId,
      quotationId: selectedQuoteId,
      rateItemId: selectedRateItemId,
      scenario: activeRateItem.scenario!,
      containerNo: containerNo.toUpperCase().trim(),
      sealNo: sealNo.toUpperCase().trim(),
      containerSize: activeRateItem.containerSize ?? '',
      containerTypeId: containerTypeId || undefined,
      shippingLineId: shippingLineId || undefined,
      vesselId: vesselId || undefined,
      weightKg,
      shippingLine: resolvedShippingLine?.name ?? '',
      vesselName: resolvedVessel?.vesselName ?? vesselName,
      voyageNo,
      eta,
      targetDeliveryDate: targetDeliveryDate || undefined,
      ewayBillNo: ewayBillNo || undefined,
      customsRefNo: customsRefNo || undefined,
      boeNo: boeNo || undefined,
      shippingBillNo: shippingBillNo || undefined,
      originLocationId: activeRateItem.fromLocationId ?? '',
      destinationLocationId: activeRateItem.toLocationId ?? '',
      emptyReturnLocationId: activeRateItem.scenario === 'IMP' ? 'loc-depot-1' : undefined,
      emptyPickupLocationId: activeRateItem.scenario === 'EXP' ? 'loc-depot-1' : undefined,
      status: 'pending',
      milestones,
      currentMilestoneIndex: 0,
      hasDynamicInsertion: false,
      extraSurchargesIncurred: [],
      billingStatus: 'unbilled',
      createdAt: new Date().toISOString(),
    };

    const isRotRequired = !(activeRateItem.scenario === 'Inland' || activeRateItem.scenario === 'RETURN' || activeRateItem.scenario === 'EMTY');
    const newRot: ROT = {
      id: rotId, jobId, rotNo,
      status: isRotRequired ? 'draft' : 'confirmed',
      verifiedBy: isRotRequired ? undefined : 'SYSTEM (Auto-Bypass)',
      gateReleaseCode: isRotRequired ? `REL-G-${Math.floor(Math.random() * 90000 + 10000)}` : 'N/A (Bypassed)',
      depotExpiry: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
    };
    const newCn: ConsignmentNote = {
      id: cnId, jobId, cnNo,
      status: isRotRequired ? 'draft' : 'issued',
      printed: false
    };

    onAddJob(newJob, newRot, newCn);
    resetCreateForm();
    setPanelView('detail');
    setSelectedJobId(jobId);
    setDetailTab('overview');
  };

  const loc = (id?: string) => locations.find(l => l.id === id);
  const cust = (id: string) => customers.find(c => c.id === id);

  // ── Step indicator ──────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-6">
      {([1, 2, 3] as CreateStep[]).map((s, idx) => {
        const labels = ['Select Quote', 'Container & Vessel', 'Review & Confirm'];
        const done = createStep > s;
        const active = createStep === s;
        return (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
              active ? 'bg-blue-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : <span className="font-mono">{s}</span>}
              {labels[idx]}
            </div>
            {idx < 2 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── Left Panel: Booking List ─────────────────────────────────────
  const LeftPanel = () => (
    <div className="w-80 shrink-0 flex flex-col border-r border-slate-200 bg-white h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Bookings
          </h2>
          <button
            onClick={() => { resetCreateForm(); setPanelView('create'); }}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded transition"
          >
            <FilePlus className="w-3 h-3" /> New
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs, containers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-2 pt-2">
        {(['all', 'pending', 'active', 'completed'] as ListTab[]).map(t => (
          <button
            key={t}
            onClick={() => setListTab(t)}
            className={`px-2.5 py-1 text-[10px] font-bold capitalize rounded-t transition ${
              listTab === t ? 'text-blue-700 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className="overflow-y-auto flex-1">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic px-4">
            No bookings found. Click "New" to create one.
          </div>
        ) : (
          filteredJobs.map(job => {
            const customer = cust(job.customerId);
            const isSelected = selectedJobId === job.id && panelView === 'detail';
            return (
              <button
                key={job.id}
                onClick={() => { setSelectedJobId(job.id); setPanelView('detail'); setDetailTab('overview'); }}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold text-blue-700">{job.jobNo}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_COLOR[job.status]}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SCENARIO_COLOR[job.scenario]}`}>
                    {job.scenario}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 truncate">{customer?.name}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{job.containerNo}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Right Panel: Create Form ─────────────────────────────────────
  const CreatePanel = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-slate-900">New Booking</h2>
          <button
            onClick={() => { resetCreateForm(); setPanelView('list'); }}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-5">Convert a confirmed quotation into a container movement order.</p>

        <StepIndicator />

        {prefilledBookingContext && (
          <div className="mb-5 bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-blue-800">Pre-filled from Quotation Wizard</p>
                <p className="text-slate-500 text-[11px]">Linked quote parameters loaded automatically.</p>
              </div>
            </div>
            <button onClick={() => { resetCreateForm(); }} className="text-[11px] text-blue-600 hover:underline font-bold">Reset</button>
          </div>
        )}

        {/* ── Step 1: Select Quote ── */}
        {createStep === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Customer Account *</label>
              <select
                value={selectedCustomerId}
                onChange={e => { setSelectedCustomerId(e.target.value); setSelectedQuoteId(''); setSelectedRateItemId(''); }}
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
              >
                <option value="">-- Select customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Confirmed Quotation *</label>
              <select
                value={selectedQuoteId}
                disabled={!selectedCustomerId || filteredQuotes.length === 0}
                onChange={e => { setSelectedQuoteId(e.target.value); setSelectedRateItemId(''); }}
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400 disabled:opacity-50"
              >
                <option value="">-- Select quotation --</option>
                {filteredQuotes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.quoteNo} (expires {q.expiryDate ?? q.validTo})
                  </option>
                ))}
              </select>
              {selectedCustomerId && filteredQuotes.length === 0 && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> No confirmed quotations for this customer.
                </p>
              )}
            </div>

            {activeQuote && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Rate Leg *</label>
                <div className="space-y-2">
                  {(activeQuote.rates ?? activeQuote.rateItems ?? []).map(r => {
                    const fromL = loc(r.fromLocationId);
                    const toL = loc(r.toLocationId);
                    const isSelected = selectedRateItemId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRateItemId(r.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.scenario ? SCENARIO_COLOR[r.scenario] : 'bg-slate-100 text-slate-600'}`}>
                              {r.scenario}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {fromL?.code ?? '?'} → {toL?.code ?? '?'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-700">{r.containerSize}</span>
                            <span className="text-xs font-bold text-blue-700">${r.baseRate}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                          </div>
                        </div>
                        {(fromL || toL) && (
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">
                            {fromL?.name} → {toL?.name}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!selectedCustomerId || !selectedQuoteId || !selectedRateItemId}
                onClick={() => setCreateStep(2)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded flex items-center gap-1.5 transition"
              >
                Next: Container Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Container & Vessel ── */}
        {createStep === 2 && activeRateItem && (
          <div className="space-y-5">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
              <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-blue-800">
                  {activeRateItem.scenario} · {loc(activeRateItem.fromLocationId)?.name} → {loc(activeRateItem.toLocationId)?.name}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                  Rate: ${activeRateItem.baseRate} · Size: {activeRateItem.containerSize} · {createMilestonesForScenario(activeRateItem.scenario!).length} milestones
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Container Serial (ISO) *</label>
                <input
                  type="text" placeholder="e.g. MSCU1234567"
                  value={containerNo} onChange={e => setContainerNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Customs Seal No *</label>
                <input
                  type="text" placeholder="e.g. SL-10294"
                  value={sealNo} onChange={e => setSealNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Gross Weight (KG) *</label>
                <input
                  type="number" value={weightKg} onChange={e => setWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Container Type</label>
                <select
                  value={containerTypeId} onChange={e => setContainerTypeId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="">-- Optional --</option>
                  {containerTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name} ({ct.isoCode})</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-1.5">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <Anchor className="w-3 h-3" /> Carrier & Vessel Schedule
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-600">Shipping Line</label>
                <select
                  value={shippingLineId}
                  onChange={e => {
                    setShippingLineId(e.target.value);
                    setVesselId('');
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="">-- Select shipping line --</option>
                  {shippingLines.filter(sl => sl.isActive).map(sl => (
                    <option key={sl.id} value={sl.id}>{sl.name} ({sl.scacCode})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Vessel</label>
                <select
                  value={vesselId}
                  onChange={e => {
                    const v = vessels.find(v => v.id === e.target.value);
                    setVesselId(e.target.value);
                    if (v) setVesselName(v.vesselName);
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="">-- Select vessel --</option>
                  {vessels
                    .filter(v => !shippingLineId || v.shippingLineId === shippingLineId)
                    .map(v => <option key={v.id} value={v.id}>{v.vesselName} ({v.imoNumber})</option>)
                  }
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Vessel Name (override)</label>
                <input
                  type="text" placeholder="e.g. MSC Isabella"
                  value={vesselName} onChange={e => setVesselName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Voyage No</label>
                <input
                  type="text" placeholder="e.g. V-2405W"
                  value={voyageNo} onChange={e => setVoyageNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">ETA (Port Arrival)</label>
                <input
                  type="date" value={eta} onChange={e => setEta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Target Delivery Date</label>
                <input
                  type="date" value={targetDeliveryDate} onChange={e => setTargetDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button" onClick={() => setCreateStep(1)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!containerNo || !sealNo}
                onClick={() => setCreateStep(3)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded flex items-center gap-1.5 transition"
              >
                Next: Review <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Confirm ── */}
        {createStep === 3 && activeRateItem && (
          <div className="space-y-5">
            {/* Summary card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Booking Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <SummaryRow label="Customer" value={cust(selectedCustomerId)?.name ?? '—'} />
                <SummaryRow label="Scenario" value={activeRateItem.scenario ?? '—'} />
                <SummaryRow label="Container" value={containerNo.toUpperCase()} />
                <SummaryRow label="Seal" value={sealNo.toUpperCase()} />
                <SummaryRow label="Container Size" value={activeRateItem.containerSize ?? '—'} />
                <SummaryRow label="Weight" value={`${weightKg.toLocaleString()} KG`} />
                <SummaryRow label="Origin" value={loc(activeRateItem.fromLocationId)?.name ?? '—'} />
                <SummaryRow label="Destination" value={loc(activeRateItem.toLocationId)?.name ?? '—'} />
                <SummaryRow label="Vessel" value={vesselName || '—'} />
                <SummaryRow label="Voyage" value={voyageNo || '—'} />
                <SummaryRow label="ETA" value={eta || '—'} />
                <SummaryRow label="Base Rate" value={`$${activeRateItem.baseRate}`} />
              </div>
            </div>

            {/* Optional govt refs */}
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> Government Reference Numbers (Optional)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {activeRateItem.scenario === 'Inland' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">E-Way Bill No</label>
                    <input type="text" value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)}
                      placeholder="EWB-XXXX" className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Customs Reference</label>
                  <input type="text" value={customsRefNo} onChange={e => setCustomsRefNo(e.target.value)}
                    placeholder="CUST-XXX" className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                </div>
                {activeRateItem.scenario === 'IMP' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Bill of Entry (BOE)</label>
                    <input type="text" value={boeNo} onChange={e => setBoeNo(e.target.value)}
                      placeholder="BOE-XXXX" className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                  </div>
                )}
                {activeRateItem.scenario === 'EXP' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Shipping Bill No</label>
                    <input type="text" value={shippingBillNo} onChange={e => setShippingBillNo(e.target.value)}
                      placeholder="SB-XXXX" className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setCreateStep(2)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition">
                ← Back
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition shadow-sm"
              >
                <FilePlus className="w-3.5 h-3.5" /> Confirm Booking & Issue Gate ROT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Right Panel: Job Detail ──────────────────────────────────────
  const DetailPanel = () => {
    if (!selectedJob) return (
      <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
        Select a booking from the list.
      </div>
    );

    const job = selectedJob;
    const customer = cust(job.customerId);
    const jobRot = rots.find(r => r.jobId === job.id);
    const jobCn = consignmentNotes.find(cn => cn.jobId === job.id);
    const origin = loc(job.originLocationId);
    const dest = loc(job.destinationLocationId);
    const quote = quotations.find(q => q.id === job.quotationId);
    const rateLine = (quote?.rates ?? quote?.rateItems ?? []).find(r => r.id === job.rateItemId);
    const shippingLine = shippingLines.find(sl => sl.id === job.shippingLineId) ?? shippingLines.find(sl => sl.name === job.shippingLine);

    const DETAIL_TABS: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
      { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-3 h-3" /> },
      { id: 'container', label: 'Container', icon: <Package className="w-3 h-3" /> },
      { id: 'documents', label: 'Documents', icon: <FileText className="w-3 h-3" /> },
      { id: 'milestones', label: 'Milestones', icon: <CheckCircle2 className="w-3 h-3" /> },
      { id: 'surcharges', label: 'Surcharges', icon: <Zap className="w-3 h-3" /> },
      { id: 'govtrefs', label: 'Govt Refs', icon: <BookOpen className="w-3 h-3" /> },
    ];

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Detail header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-blue-700">{job.jobNo}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_COLOR[job.status]}`}>
                  {job.status}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${SCENARIO_COLOR[job.scenario]}`}>
                  {job.scenario}
                </span>
              </div>
              <p className="text-xs text-slate-500">{customer?.name} · {origin?.code} → {dest?.code}</p>
            </div>
            <button onClick={() => setPanelView('list')} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto">
            {DETAIL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded whitespace-nowrap transition ${
                  detailTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detail content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {detailTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <DetailSection title="Booking Info">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <SummaryRow label="Job No" value={job.jobNo} />
                    <SummaryRow label="Created" value={new Date(job.createdAt).toLocaleDateString()} />
                    <SummaryRow label="Customer" value={customer?.name ?? '—'} />
                    <SummaryRow label="Scenario" value={job.scenario} />
                    <SummaryRow label="Quotation" value={quote?.quoteNo ?? '—'} />
                    <SummaryRow label="Billing" value={job.billingStatus ?? 'unbilled'} />
                  </div>
                </DetailSection>
                <DetailSection title="Route">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <SummaryRow label="Origin" value={`${origin?.name} (${origin?.code})`} />
                    <SummaryRow label="Destination" value={`${dest?.name} (${dest?.code})`} />
                    <SummaryRow label="ETA" value={job.eta} />
                    <SummaryRow label="Target Delivery" value={job.targetDeliveryDate ?? '—'} />
                  </div>
                </DetailSection>
                <DetailSection title="Rate">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <SummaryRow label="Base Rate" value={rateLine ? `$${rateLine.baseRate}` : '—'} />
                    <SummaryRow label="Container Size" value={job.containerSize} />
                  </div>
                </DetailSection>
              </motion.div>
            )}

            {detailTab === 'container' && (
              <motion.div key="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <DetailSection title="Container Details">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <SummaryRow label="Container No" value={job.containerNo} mono />
                    <SummaryRow label="Seal No" value={job.sealNo} mono />
                    <SummaryRow label="Size" value={job.containerSize} />
                    <SummaryRow label="Weight" value={`${job.weightKg.toLocaleString()} KG`} />
                  </div>
                </DetailSection>
                <DetailSection title="Vessel & Carrier">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <SummaryRow label="Shipping Line" value={shippingLine?.name ?? job.shippingLine ?? '—'} />
                    <SummaryRow label="Vessel" value={job.vesselName} />
                    <SummaryRow label="Voyage No" value={job.voyageNo} mono />
                    <SummaryRow label="ETA" value={job.eta} />
                  </div>
                </DetailSection>
              </motion.div>
            )}

            {detailTab === 'documents' && (
              <motion.div key="documents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {jobRot && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-600" /> Release Order Ticket (ROT)
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${jobRot.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        {jobRot.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <SummaryRow label="ROT No" value={jobRot.rotNo} mono />
                      <SummaryRow label="Gate Code" value={jobRot.gateReleaseCode} mono />
                      <SummaryRow label="Depot Expiry" value={jobRot.depotExpiry} />
                      <SummaryRow label="Verified By" value={jobRot.verifiedBy ?? 'Pending'} />
                    </div>
                    {jobRot.status === 'draft' && (
                      <button
                        onClick={() => onConfirmRot(jobRot.id, job.id)}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition"
                      >
                        Approve & Gate Pass Verify
                      </button>
                    )}
                  </div>
                )}
                {jobCn && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Consignment Note (CN)
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        jobCn.status === 'signed' ? 'bg-green-50 text-green-700 border-green-200' :
                        jobCn.status === 'issued' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>{jobCn.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <SummaryRow label="CN No" value={jobCn.cnNo} mono />
                      <SummaryRow label="Printed" value={jobCn.printed ? 'Yes' : 'No'} />
                    </div>
                    <button
                      onClick={() => alert(`Printing CN ${jobCn.cnNo} to AirPrint queue...`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Consignment Note
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {detailTab === 'milestones' && (
              <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {job.milestones.map((m, idx) => (
                  <div key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    m.completed ? 'bg-green-50 border-green-200' :
                    idx === job.currentMilestoneIndex ? 'bg-blue-50 border-blue-200' :
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      m.completed ? 'bg-green-500' : idx === job.currentMilestoneIndex ? 'bg-blue-500' : 'bg-slate-300'
                    }`}>
                      {m.completed ? <CheckCircle2 className="w-3 h-3 text-white" /> : <span className="text-[9px] text-white font-bold">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{m.label}</p>
                      <p className="text-[11px] text-slate-500">{m.description}</p>
                      {m.timestamp && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{new Date(m.timestamp).toLocaleString()}</p>}
                    </div>
                    {m.requiresEvidence && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Evidence</span>}
                  </div>
                ))}
              </motion.div>
            )}

            {detailTab === 'surcharges' && (
              <motion.div key="surcharges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {job.extraSurchargesIncurred.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">No extra surcharges incurred yet.</div>
                ) : (
                  job.extraSurchargesIncurred.map((es, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-xs">
                      <div>
                        <p className="font-bold text-slate-800 font-mono">{es.surchargeCode}</p>
                        <p className="text-slate-500">{es.description}</p>
                        {es.approvedBy && <p className="text-[10px] text-green-600">Approved by: {es.approvedBy}</p>}
                      </div>
                      <span className="font-bold text-slate-800">${es.amount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {detailTab === 'govtrefs' && (
              <motion.div key="govtrefs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <DetailSection title="Government Reference Numbers">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <SummaryRow label="E-Way Bill" value={job.ewayBillNo ?? '—'} mono />
                    <SummaryRow label="Customs Ref" value={job.customsRefNo ?? '—'} mono />
                    <SummaryRow label="Bill of Entry" value={job.boeNo ?? '—'} mono />
                    <SummaryRow label="Shipping Bill" value={job.shippingBillNo ?? '—'} mono />
                  </div>
                </DetailSection>
                {job.exceptionLog && job.exceptionLog.length > 0 && (
                  <DetailSection title="Exception Log">
                    {job.exceptionLog.map((ex, idx) => (
                      <div key={idx} className="p-2.5 bg-red-50 border border-red-200 rounded text-xs mb-2">
                        <p className="text-slate-700">{ex.note}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{new Date(ex.timestamp).toLocaleString()} · {ex.loggedBy}</p>
                      </div>
                    ))}
                  </DetailSection>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" id="jobs-booking-and-documenting">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-0">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-600 w-5 h-5" /> Operations Booking &amp; Gate Authority
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Convert confirmed quotations into container movement orders. Manage ROTs, CNs and milestone tracking.
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white mt-4" style={{ minHeight: '620px' }}>
        <LeftPanel />
        <AnimatePresence mode="wait">
          {panelView === 'create' ? (
            <motion.div key="create" className="flex-1 overflow-hidden" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <CreatePanel />
            </motion.div>
          ) : panelView === 'detail' && selectedJob ? (
            <motion.div key={`detail-${selectedJobId}`} className="flex-1 overflow-hidden flex flex-col" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <DetailPanel />
            </motion.div>
          ) : (
            <motion.div key="empty" className="flex-1 flex flex-col items-center justify-center text-slate-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Layers className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select a booking to view details</p>
              <p className="text-xs mt-1">or click <strong>New</strong> to create a booking</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Helper components ──────────────────────────────────────────────
function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">{label}</span>
      <span className={`text-xs font-bold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  );
}
