/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ROT, Job, Customer, LocationGeo } from '../types';
import { 
  ShieldCheck, 
  Search, 
  Printer, 
  Clock, 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle, 
  Bookmark, 
  FileText,
  Calendar,
  X,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ROTMasterProps {
  rots: ROT[];
  jobs: Job[];
  customers: Customer[];
  locations: LocationGeo[];
  onConfirmRot: (rotId: string, jobId: string) => void;
}

export default function ROTMaster({
  rots,
  jobs,
  customers,
  locations,
  onConfirmRot
}: ROTMasterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'confirmed'>('all');
  const [selectedRotId, setSelectedRotId] = useState<string | null>(null);
  const [printLayoutRotId, setPrintLayoutRotId] = useState<string | null>(null);

  // Filters
  const filteredRots = useMemo(() => {
    return rots.filter(rot => {
      const job = jobs.find(j => j.id === rot.jobId);
      const customer = job ? customers.find(c => c.id === job.customerId) : null;
      
      const matchSearch = 
        rot.rotNo.toLowerCase().includes(search.toLowerCase()) ||
        job?.jobNo.toLowerCase().includes(search.toLowerCase()) ||
        job?.containerNo.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || rot.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [rots, jobs, customers, search, statusFilter]);

  // Selected ROT Details
  const activeRot = useMemo(() => {
    if (!selectedRotId) return rots[0] || null;
    return rots.find(r => r.id === selectedRotId) || rots[0] || null;
  }, [rots, selectedRotId]);

  const activeJob = useMemo(() => {
    if (!activeRot) return null;
    return jobs.find(j => j.id === activeRot.jobId) || null;
  }, [jobs, activeRot]);

  const activeCustomer = useMemo(() => {
    if (!activeJob) return null;
    return customers.find(c => c.id === activeJob.customerId) || null;
  }, [customers, activeJob]);

  const originLoc = useMemo(() => {
    if (!activeJob) return null;
    return locations.find(l => l.id === activeJob.originLocationId) || null;
  }, [locations, activeJob]);

  const destLoc = useMemo(() => {
    if (!activeJob) return null;
    return locations.find(l => l.id === activeJob.destinationLocationId) || null;
  }, [locations, activeJob]);

  const printRot = useMemo(() => {
    if (!printLayoutRotId) return null;
    return rots.find(r => r.id === printLayoutRotId) || null;
  }, [rots, printLayoutRotId]);

  const printJob = useMemo(() => {
    if (!printRot) return null;
    return jobs.find(j => j.id === printRot.jobId) || null;
  }, [jobs, printRot]);

  const printCustomer = useMemo(() => {
    if (!printJob) return null;
    return customers.find(c => c.id === printJob.customerId) || null;
  }, [customers, printJob]);

  return (
    <div className="space-y-6" id="rot-master-container">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600 w-5 h-5 animate-pulse" /> Release Order Tickets (ROT) Master
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standalone register to authorize terminal gate-passes, print release codes and verify security audits prior to yard dispatch.
          </p>
        </div>

        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-sm shrink-0 self-start md:self-auto text-xs font-mono font-bold text-slate-500 shadow-xs">
          TOTAL ROTs: {rots.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Filter and List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="rot-search-input"
                type="text"
                placeholder="Search ROT No, Job No, Container or Client..."
                className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-700 font-sans focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded text-[11px] font-sans font-bold">
              <button
                id="rot-filter-all"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                id="rot-filter-draft"
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'draft' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Draft
              </button>
              <button
                id="rot-filter-confirmed"
                onClick={() => setStatusFilter('confirmed')}
                className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'confirmed' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Confirmed
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredRots.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-white rounded-lg py-12 text-center text-xs text-slate-400 font-sans italic">
                No tickets found matching the query.
              </div>
            ) : (
              filteredRots.map((rot) => {
                const correlatedJob = jobs.find(j => j.id === rot.jobId);
                const cust = correlatedJob ? customers.find(c => c.id === correlatedJob.customerId) : null;
                const isSelected = activeRot?.id === rot.id;

                return (
                  <div
                    key={rot.id}
                    id={`rot-card-${rot.id}`}
                    onClick={() => setSelectedRotId(rot.id)}
                    className={`bg-white border rounded-lg p-4 cursor-pointer transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/5' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{rot.rotNo}</span>
                        <span className="text-slate-400 text-[10px] font-mono">Job: {correlatedJob?.jobNo}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-sans font-bold uppercase border ${
                          rot.status === 'confirmed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {rot.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-semibold truncate max-w-[280px]">
                        {cust?.name || 'Loading Customer...'}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400">
                        <span>EQ: <strong className="text-slate-700 font-bold">{correlatedJob?.containerNo || 'N/A'}</strong></span>
                        <span>SZ: <strong className="text-slate-700 font-bold">{correlatedJob?.containerSize}</strong></span>
                        <span>EXPIRY: <span className="text-red-500 font-bold">{rot.depotExpiry}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`rot-print-btn-${rot.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintLayoutRotId(rot.id);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded border border-slate-200"
                        title="Print Gate Pass"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-blue-600' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detail Panel & Audit trail */}
        <div className="lg:col-span-5">
          {activeRot ? (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden" id="rot-detail-panel">
              <div className="bg-slate-900 text-white p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">RELEASE AUTHORITY</div>
                    <h2 className="text-sm font-black font-mono tracking-tight text-white mt-0.5">{activeRot.rotNo}</h2>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-extrabold uppercase border ${
                    activeRot.status === 'confirmed' 
                      ? 'bg-green-600/30 text-green-300 border-green-500' 
                      : 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                  }`}>
                    {activeRot.status}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Linked job summary */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">I. Bound Consignment Profile</h3>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans font-medium">Associated Job#:</span>
                      <strong className="text-slate-800 font-mono font-bold">{activeJob?.jobNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans font-medium">Customer Account:</span>
                      <strong className="text-slate-800 truncate max-w-[200px] text-right font-semibold">{activeCustomer?.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans font-medium">Container / Seal:</span>
                      <strong className="text-slate-800 font-mono font-bold">{activeJob?.containerNo} / {activeJob?.sealNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans font-medium">Size &amp; Est. Weight:</span>
                      <strong className="text-slate-800 font-bold">{activeJob?.containerSize} • {activeJob?.weightKg.toLocaleString()} KG</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                      <span className="text-slate-400 font-bold">Scenario Mode:</span>
                      <strong className="text-blue-600 font-extrabold">{activeJob?.scenario}</strong>
                    </div>
                  </div>
                </div>

                {/* Gate Authority details */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">II. Gate Authority Release</h3>
                  <div className="border border-slate-200/80 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-mono">GATE RELEASE SECURE CODE</span>
                        <span className="text-sm font-black font-mono text-slate-900 tracking-wider select-all">{activeRot.gateReleaseCode}</span>
                      </div>
                      <Bookmark className="w-5 h-5 text-blue-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Depot Expiry Window</span>
                        <strong className="text-red-600 font-mono font-bold flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-red-500" /> {activeRot.depotExpiry}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Release Depot</span>
                        <strong className="text-slate-800 block mt-0.5 truncate">HZP Depot Gateway Pool</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Checkpoint */}
                <div className="border-t border-slate-100 pt-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Operational Verification</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Review and authorize cargo release codes to trigger draft Consignment Note (CN) issuance.</p>
                    </div>
                  </div>

                  {activeRot.status === 'draft' ? (
                    <button
                      id="rot-details-approve-btn"
                      onClick={() => onConfirmRot(activeRot.id, activeRot.jobId)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-2.5 rounded-md text-xs transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" /> Verify Release &amp; Issue CN
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded p-4 flex items-start gap-2 text-green-800 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Authorized Legally Verified</p>
                        <p className="text-[11px] text-green-700 mt-1">
                          Release verified by: <strong className="font-black">{activeRot.verifiedBy || 'Port Master Dispatcher'}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 bg-white rounded-lg py-12 text-center text-xs text-slate-400 font-sans italic shadow-sm">
              No Release ROTs available to display details.
            </div>
          )}
        </div>
      </div>

      {/* Modern Dialog/Modal Overlay for beautiful physical print template rendering */}
      <AnimatePresence>
        {printLayoutRotId && printRot && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-2xl w-full border border-slate-300 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                id="close-rot-print-modal"
                onClick={() => setPrintLayoutRotId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1 bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Printable Body Area */}
              <div className="p-8 overflow-y-auto space-y-6" id="rot-printable-document-body">
                {/* Print Title Block */}
                <div className="border-b-2 border-slate-900 pb-5 text-center relative space-y-1">
                  <div className="text-[10px] font-black tracking-widest text-blue-600 uppercase font-mono">PORT TERMINAL RELEASE PASS</div>
                  <h1 className="text-xl font-black font-sans text-slate-900 uppercase tracking-tight">RELEASE ORDER TICKET (ROT)</h1>
                  <span className="font-mono text-xs text-slate-500 font-bold">SERIAL AUTH: {printRot.rotNo}</span>
                  <div className="absolute top-0 left-0 text-left">
                    <div className="bg-slate-900 text-white text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">SECURE PASS</div>
                  </div>
                </div>

                {/* Print Grid Details */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Shipping Carrier Client</span>
                    <strong className="text-slate-900 text-sm font-black">{printCustomer?.name}</strong>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Gate Release Code</span>
                    <strong className="text-slate-900 text-sm font-black font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{printRot.gateReleaseCode}</strong>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Container Serial ID</span>
                    <strong className="text-slate-900 font-bold font-mono">{printJob?.containerNo}</strong>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Customs Seal Serial</span>
                    <strong className="text-slate-900 font-bold font-mono">{printJob?.sealNo}</strong>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Logistics Corridor Mode</span>
                    <strong className="text-slate-900 font-bold">{printJob?.scenario} Leg Transit</strong>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Gross Declared Weight</span>
                    <strong className="text-slate-900 font-bold">{printJob?.weightKg.toLocaleString()} KG</strong>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3 col-span-2">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Terminal Expiry Deadline Window</span>
                    <strong className="text-red-600 font-bold block">{printRot.depotExpiry} 23:59:59 (Strict Depot Gate-pass Lockout)</strong>
                  </div>
                </div>

                {/* Sub-disclaimer instructions */}
                <div className="border border-slate-200 bg-slate-50 rounded-lg p-4 text-[11px] text-slate-500 leading-relaxed font-sans font-medium space-y-1.5">
                  <p className="font-bold text-slate-700">Official Port Gate Pass Protocol:</p>
                  <p>1. Present this printable release coupon to the physical terminal gates at least 4 hours before the expiry deadline window.</p>
                  <p>2. Verify container seals have not been tampered with or replaced. If serial mismatch occurs, port security retains authority to inspect cargo.</p>
                </div>

                {/* Dual signatures area */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs font-sans">
                  <div className="text-center pt-8 border-t border-dashed border-slate-300">
                    <div className="text-[10px] font-mono font-bold text-slate-400">AUTHORIZED SYSTEM AUDITOR</div>
                    <div className="font-bold text-slate-800 mt-1">{printRot.verifiedBy || 'PENDING DIGITAL CERT'}</div>
                  </div>
                  <div className="text-center pt-8 border-t border-dashed border-slate-300">
                    <div className="text-[10px] font-mono font-bold text-slate-400">DRIVER RECEIVING ACKNOWLEDGEMENT</div>
                    <div className="text-slate-400 italic mt-1">Signature Required on Gate-Pass Ingestion</div>
                  </div>
                </div>
              </div>

              {/* Print action footer */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3 justify-end shrink-0">
                <button
                  id="cancel-rot-print"
                  onClick={() => setPrintLayoutRotId(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  id="execute-rot-print"
                  onClick={() => {
                    alert(`Sending document ${printRot.rotNo} directly to local system printer spooler...`);
                    printRot.status = 'confirmed'; // confirm implicitly as visual helper
                    setPrintLayoutRotId(null);
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Execute Digital Print
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
