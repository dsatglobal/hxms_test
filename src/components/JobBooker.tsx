/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Quotation, LocationGeo, Job, ROT, ConsignmentNote, ScenarioType, ContainerSizeCode, MilestoneStep, WorkflowMilestoneConfig } from '../types';
import { Layers, FilePlus, ShieldAlert, CheckCircle2, FileText, ChevronRight, Lock, Printer, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createMilestonesForScenario } from '../data';

interface JobBookerProps {
  jobs: Job[];
  customers: Customer[];
  quotations: Quotation[];
  locations: LocationGeo[];
  rots: ROT[];
  consignmentNotes: ConsignmentNote[];
  onAddJob: (job: Job, rot: ROT, cn: ConsignmentNote) => void;
  onConfirmRot: (rotId: string, jobId: string) => void;
  workflowConfigs?: WorkflowMilestoneConfig[];
  prefilledBookingContext?: { customerId: string; quoteId: string; rateItemId?: string; } | null;
  onClearPrefilledBookingContext?: () => void;
}

export default function JobBooker({
  jobs,
  customers,
  quotations,
  locations,
  rots,
  consignmentNotes,
  onAddJob,
  onConfirmRot,
  workflowConfigs,
  prefilledBookingContext,
  onClearPrefilledBookingContext
}: JobBookerProps) {
  const [activeTab, setActiveTab] = useState<'booking' | 'rots' | 'cns'>('booking');

  // Booking Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [selectedRateItemId, setSelectedRateItemId] = useState('');
  const [containerNo, setContainerNo] = useState('');
  const [sealNo, setSealNo] = useState('');
  const [weightKg, setWeightKg] = useState(22000);
  const [shippingLine, setShippingLine] = useState('MSC Mediterranean');
  const [vesselName, setVesselName] = useState('MSC Isabella');
  const [voyageNo, setVoyageNo] = useState('V-2405W');
  const [eta, setEta] = useState('2026-05-28');

  // Sync prefilled booking context from Quotation Wizard directly
  React.useEffect(() => {
    if (prefilledBookingContext) {
      setSelectedCustomerId(prefilledBookingContext.customerId);
      setSelectedQuoteId(prefilledBookingContext.quoteId);
      if (prefilledBookingContext.rateItemId) {
        setSelectedRateItemId(prefilledBookingContext.rateItemId);
      }
    }
  }, [prefilledBookingContext]);

  // Filter confirmed quotations for customer
  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => q.customerId === selectedCustomerId && q.status === 'confirmed');
  }, [quotations, selectedCustomerId]);

  // Selected Quotation object
  const activeQuote = useMemo(() => {
    return quotations.find(q => q.id === selectedQuoteId);
  }, [quotations, selectedQuoteId]);

  // Handle selected quotation change
  const handleQuoteChange = (id: string) => {
    setSelectedQuoteId(id);
    setSelectedRateItemId('');
  };

  // Selected rate details to auto fill scenarios and locations
  const activeRateItem = useMemo(() => {
    if (!activeQuote) return null;
    return activeQuote.rates.find(r => r.id === selectedRateItemId);
  }, [activeQuote, selectedRateItemId]);

  const handleBookJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedQuoteId || !selectedRateItemId || !containerNo || !sealNo) {
      alert('Please fill out all mandatory fields: Customer, active quotation pricing line, Container No and Seal No.');
      return;
    }

    if (!activeRateItem) return;

    // Generate Job
    const jobId = `job-${Date.now()}`;
    const jobNo = `JB-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    const rotId = `rot-${Date.now()}`;
    const rotNo = `ROT-99${Math.floor(Math.random() * 9000 + 1000)}`;
    const cnId = `cn-${Date.now()}`;
    const cnNo = `CN-2026-${Math.floor(Math.random() * 90000 + 10000)}`;

    const newJob: Job = {
      id: jobId,
      jobNo,
      tenantId: 'tenant-1',
      customerId: selectedCustomerId,
      quotationId: selectedQuoteId,
      rateItemId: selectedRateItemId,
      scenario: activeRateItem.scenario,
      containerNo: containerNo.toUpperCase().trim(),
      sealNo: sealNo.toUpperCase().trim(),
      containerSize: activeRateItem.containerSize,
      weightKg,
      shippingLine,
      vesselName,
      voyageNo,
      eta,
      originLocationId: activeRateItem.fromLocationId,
      destinationLocationId: activeRateItem.toLocationId,
      emptyReturnLocationId: activeRateItem.scenario === 'IMP' ? 'loc-depot-1' : undefined,
      emptyPickupLocationId: activeRateItem.scenario === 'EXP' ? 'loc-depot-1' : undefined,
      status: 'pending',
      milestones: (() => {
        const customConfig = workflowConfigs?.find(c => c.scenario === activeRateItem.scenario);
        if (customConfig && customConfig.steps.length > 0) {
          return customConfig.steps.map((st, sIdx) => ({
            id: `m-custom-${sIdx}`,
            label: st.label,
            description: st.description,
            completed: sIdx === 0, // Standby / First step completed initially
            timestamp: sIdx === 0 ? new Date().toISOString() : undefined,
            requiresEvidence: st.requiresEvidence
          }));
        }
        return createMilestonesForScenario(activeRateItem.scenario);
      })(),
      currentMilestoneIndex: 0,
      hasDynamicInsertion: false,
      extraSurchargesIncurred: []
    };

    // Dynamic scenario check: Inland, RETURN, and EMTY jobs skip standard port gate Release Order Ticket (ROT) protocols
    const isRotRequired = !(activeRateItem.scenario === 'Inland' || activeRateItem.scenario === 'RETURN' || activeRateItem.scenario === 'EMTY');

    // Spawn draft ROT (Auto-confirm if NOT required)
    const newRot: ROT = {
      id: rotId,
      jobId,
      rotNo,
      status: isRotRequired ? 'draft' as const : 'confirmed' as const,
      verifiedBy: isRotRequired ? undefined : 'SYSTEM (Auto-Bypass)',
      gateReleaseCode: isRotRequired ? `REL-G-${Math.floor(Math.random() * 90000 + 10000)}` : 'N/A (Bypassed)',
      depotExpiry: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
    };

    // Spawn draft Consignment Note (Auto-issue if ROT is bypassed/confirmed)
    const newCn: ConsignmentNote = {
      id: cnId,
      jobId,
      cnNo,
      status: isRotRequired ? 'draft' as const : 'issued' as const,
      printed: false
    };

    onAddJob(newJob, newRot, newCn);
    
    // Clear prefilled context from state
    onClearPrefilledBookingContext?.();
    
    // Reset Form
    setSelectedCustomerId('');
    setSelectedQuoteId('');
    setSelectedRateItemId('');
    setContainerNo('');
    setSealNo('');
    
    // Navigate to ROT verification
    setActiveTab('rots');
  };

  return (
    <div className="space-y-6" id="jobs-booking-and-documenting">
      
      {/* Tab select block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-600 w-5 h-5" /> Operations Booking &amp; Gate Authority
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Validate containers, release tickets (ROT), and print consignment notes before planning dispatcher schedules.
          </p>
        </div>

        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-md shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-1.5 rounded-sm text-xs font-semibold font-sans transition-all ${
              activeTab === 'booking' 
                ? 'bg-blue-605 bg-blue-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Job Booker
          </button>
          <button
            onClick={() => setActiveTab('rots')}
            className={`px-4 py-1.5 rounded-sm text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
              activeTab === 'rots' 
                ? 'bg-blue-605 bg-blue-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Release Tickets (ROT)
          </button>
          <button
            onClick={() => setActiveTab('cns')}
            className={`px-4 py-1.5 rounded-sm text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
              activeTab === 'cns' 
                ? 'bg-blue-605 bg-blue-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Consignment Notes
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'booking' ? (
          
          /* ================== JOB BOOKER ================== */
          <motion.form
            key="booking-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleBookJob}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 space-y-6 shadow-sm">
              
              {prefilledBookingContext && (
                <div className="bg-blue-50/75 border border-blue-250 p-3.5 rounded-lg flex items-center justify-between text-xs transition duration-200">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-blue-600 rounded-md text-white flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-extrabold text-blue-900 font-sans">Pre-filled Commercial Quote Parameters</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Linked quotation references and rates have been loaded automatically.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClearPrefilledBookingContext}
                    className="text-xs text-blue-700 hover:text-blue-900 underline font-bold px-2 py-1 hover:bg-blue-50 border border-blue-200/50 rounded transition"
                  >
                    Reset Link
                  </button>
                </div>
              )}

              {/* Part A: Contract validation */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
                  I. Link active customer quotation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Customer Account</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Choose customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-505">Confirmed Contract (Quote)</label>
                    <select
                      value={selectedQuoteId}
                      disabled={!selectedCustomerId || filteredQuotes.length === 0}
                      onChange={(e) => handleQuoteChange(e.target.value)}
                      className="w-full bg-white border border-slate-202 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Choose Pricing Contract --</option>
                      {filteredQuotes.map(q => (
                        <option key={q.id} value={q.id}>{q.quoteNo} (Expires {q.expiryDate})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Contract Rate Leg Selection</label>
                    <select
                      value={selectedRateItemId}
                      disabled={!selectedQuoteId || !activeQuote}
                      onChange={(e) => setSelectedRateItemId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[11px] text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    >
                      <option value="">-- Choose Rate Leg --</option>
                      {activeQuote?.rates.map(r => {
                        const fromL = locations.find(l => l.id === r.fromLocationId);
                        const toL = locations.find(l => l.id === r.toLocationId);
                        return (
                          <option key={r.id} value={r.id}>
                            [{r.scenario}] {fromL?.code} to {toL?.code} - {r.containerSize} (${r.baseRate})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Part B: Container specs */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
                  II. Input cargo &amp; container details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Container Serial (ISO Standard) *</label>
                    <input
                      type="text"
                      placeholder="e.g. MSCU1234567"
                      value={containerNo}
                      onChange={(e) => setContainerNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Customs Bullet Seal No *</label>
                    <input
                      type="text"
                      placeholder="e.g. SL-10294"
                      value={sealNo}
                      onChange={(e) => setSealNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Gross Weight (KG) *</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Part C: Ocean Vessel schedules */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
                  III. Carrier &amp; Vessel Sailing Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Shipping Ocean Line</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      value={shippingLine}
                      onChange={(e) => setShippingLine(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Vessel Brand Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      value={vesselName}
                      onChange={(e) => setVesselName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Voyage / Ship No</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      value={voyageNo}
                      onChange={(e) => setVoyageNo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Estimated Port Arrival (ETA)</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                      value={eta}
                      onChange={(e) => setEta(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Autofill summary */}
              {activeRateItem && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <p className="font-bold text-blue-800 uppercase tracking-wide">Automatic Scenario Pricing Validated</p>
                    <p className="mt-1">
                      Selecting this pricing rate instantiates a <strong className="text-slate-900">{activeRateItem.scenario}</strong> job, starting at <strong className="text-slate-900">{locations.find(l => l.id === activeRateItem.fromLocationId)?.name}</strong> and ending at <strong className="text-slate-900">{locations.find(l => l.id === activeRateItem.toLocationId)?.name}</strong>.
                    </p>
                    <p className="font-mono text-slate-500 text-[10px] mt-1.5">
                      Base Rate: ${activeRateItem.baseRate}.00 • Chassis requirement: {activeRateItem.containerSize} • Standard milestones: {createMilestonesForScenario(activeRateItem.scenario).length} checkpoints
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom dispatcher book button */}
              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <FilePlus className="w-4 h-4" /> Book Container Job &amp; Issue Gate ROT
                </button>
              </div>

            </div>

            {/* Help block */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Workflow Enforcement</span>
                <h3 className="text-sm font-bold text-slate-800">The ROT &amp; CN Protocol</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  Before a prime mover can be scheduled to collect any container:
                </p>
                <ol className="text-xs text-slate-500 space-y-2.5 list-decimal list-inside pl-1.5 font-sans font-medium">
                  <li><strong>Book the container:</strong> Binds quote rules. Spawns <em>Draft ROT</em>.</li>
                  <li><strong>Confirm ROT:</strong> Dispatcher verifies terminal gate-pass codes with shipping agents, pushing ROT to <em>Confirmed</em>.</li>
                  <li><strong>Print CN:</strong> Publishing a Confirmed ROT automatically generates the <em>Consignment Note (CN)</em> tracking sheet for the driver.</li>
                </ol>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase font-sans tracking-wide text-blue-600">Security Gate pass</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  Port authorities will reject transport entry if the physical vehicle possesses an outstanding road tax alert or if the driver's port pass matches an expired index!
                </p>
              </div>
            </div>
          </motion.form>
        ) : activeTab === 'rots' ? (
          
          /* ================== RELEASE TICKETS / ROTS ================== */
          <motion.div
            key="rots-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {rots.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-white rounded-lg py-12 text-center text-xs text-slate-400 font-sans italic">
                No Release Order Tickets (ROT) created yet. Book a job first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rots.map((rot) => {
                  const correlatedJob = jobs.find(j => j.id === rot.jobId);
                  const custObj = correlatedJob ? customers.find(c => c.id === correlatedJob.customerId) : null;
                  
                  return (
                    <div key={rot.id} className="bg-white border border-slate-200 p-5 rounded-lg flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] rounded font-bold">
                              {rot.rotNo}
                            </span>
                            <span className="text-slate-400 text-xs font-mono font-bold">➔ JOB: {correlatedJob?.jobNo}</span>
                          </div>
                          
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase border ${
                            rot.status === 'confirmed' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {rot.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs font-sans">
                          <div className="font-bold text-slate-705 flex justify-between pr-2">
                            <span>CLIENT:</span>
                            <span className="text-slate-600">{custObj?.name || 'Loading...'}</span>
                          </div>
                          <div className="flex justify-between pr-2 font-sans text-[11px] text-slate-500">
                            <span>CONTAINER:</span>
                            <span className="text-slate-800 font-bold">{correlatedJob?.containerNo} ({correlatedJob?.containerSize})</span>
                          </div>
                          <div className="flex justify-between pr-2 font-sans text-[11px] text-slate-500 items-center">
                            <span>AUTHORITY GATE CODE:</span>
                            <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200 font-mono font-bold">{rot.gateReleaseCode}</span>
                          </div>
                          <div className="flex justify-between pr-2 font-sans text-[11px] text-slate-500">
                            <span>DEPOT EXPIRE WINDOW:</span>
                            <span className="text-red-600 font-bold">{rot.depotExpiry}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                        {rot.verifiedBy ? (
                          <div className="text-slate-500 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Authorized: {rot.verifiedBy}
                          </div>
                        ) : (
                          <div className="text-slate-500 flex items-center gap-1 font-mono text-[10px]">
                            <Lock className="w-3 h-3 text-blue-600" /> Verification Pending
                          </div>
                        )}

                        {rot.status === 'draft' && (
                          <button
                            onClick={() => onConfirmRot(rot.id, rot.jobId)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-[10px] transition shadow-xs"
                          >
                            Approve &amp; Gate Pass Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          
          /* ================== CONSIGNMENT NOTES ================== */
          <motion.div
            key="cns-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {consignmentNotes.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-white rounded-lg py-12 text-center text-xs text-slate-400 font-sans italic">
                No Consignment Notes issued yet. Confirm a Release ROT first.
              </div>
            ) : (
              <div className="space-y-2.5 max-w-4xl mx-auto">
                {consignmentNotes.map((cn) => {
                  const jobObj = jobs.find(j => j.id === cn.jobId);
                  const custObj = jobObj ? customers.find(c => c.id === jobObj.customerId) : null;
                  const fromLoc = jobObj ? locations.find(l => l.id === jobObj.originLocationId) : null;
                  const toLoc = jobObj ? locations.find(l => l.id === jobObj.destinationLocationId) : null;

                  return (
                    <div key={cn.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
                      
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-blue-50 rounded border border-blue-100 text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{cn.cnNo}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-sans font-bold uppercase border ${
                              cn.status === 'signed' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : cn.status === 'issued' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              {cn.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-bold mt-1">
                            {custObj?.name} • Leg: <span className="font-mono text-[10px] text-blue-600">{jobObj?.scenario}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {fromLoc?.code} ({fromLoc?.zone}) ➔ {toLoc?.code} ({toLoc?.zone})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 justify-between md:justify-end border-t border-slate-100 md:border-none pt-3 md:pt-0">
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-slate-400 uppercase">Container / Seal</div>
                          <div className="font-mono text-xs text-slate-700 font-bold">{jobObj?.containerNo || 'N/A'}</div>
                        </div>

                        <button
                          onClick={() => {
                            alert(`Printing layout compiled successfully. Sending document ${cn.cnNo} to AirPrint queue...`);
                            cn.printed = true;
                          }}
                          className="p-2 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition"
                          title="Print Document"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
