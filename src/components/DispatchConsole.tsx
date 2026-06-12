/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, Driver, Vehicle, Customer, LocationGeo, Quotation, Region, User } from '../types';
import {
  LayoutDashboard, Map, List, Zap, AlertTriangle, CheckCircle2, Clock,
  Truck, Users, Star, ChevronRight, ChevronDown, Plus, Search,
  Navigation, MapPin, Phone, RefreshCw, ArrowRight, BarChart3,
  CalendarDays, X, Package, Shield, AlertCircle, Filter
} from 'lucide-react';

interface DispatchConsoleProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  locations: LocationGeo[];
  quotations: Quotation[];
  regions: Region[];
  currentUser: User;
  onAssignJob: (jobId: string, driverId: string, vehicleId: string, scheduledTime?: string) => void;
  onTriggerDynamicInsertion: (jobId: string, insertedJobId: string) => void;
  onLogException: (jobId: string, exceptionType: string, notes: string, evidenceFlag: boolean) => void;
  onUpdateJob: (updatedJob: Job) => void;
  onNavigate: (tab: string) => void;
}

type ActiveView = 'priority' | 'map' | 'list';
type DriverFilter = 'all' | 'on-road' | 'idle' | 'exception';
type ListStatusFilter = 'all' | 'active' | 'unassigned' | 'completed' | 'exception' | 'scheduled';
type ListScenarioFilter = 'ALL' | 'IMP' | 'EXP' | 'Inland' | 'EMTY' | 'RETURN';
type BacklogScenarioFilter = 'ALL' | 'IMP' | 'EXP' | 'Inland' | 'EMTY' | 'RETURN';

const SCENARIO_COLOR: Record<string, string> = {
  IMP: 'bg-blue-100 text-blue-800',
  EXP: 'bg-emerald-100 text-emerald-800',
  Inland: 'bg-purple-100 text-purple-800',
  EMTY: 'bg-slate-100 text-slate-600',
  RETURN: 'bg-orange-100 text-orange-800',
};

const DRIVER_INITIALS_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'
];

interface RatedDriver {
  driver: Driver;
  vehicle: Vehicle | undefined;
  activeJob: Job | undefined;
  isIdle: boolean;
  stars: 1 | 2 | 3;
  estFinishLabel: string;
}

export default function DispatchConsole({
  jobs, drivers, vehicles, customers, locations, quotations, regions,
  currentUser, onAssignJob, onTriggerDynamicInsertion, onLogException, onUpdateJob, onNavigate
}: DispatchConsoleProps) {
  const [activeView, setActiveView] = useState<ActiveView>('priority');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [driverFilter, setDriverFilter] = useState<DriverFilter>('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [autoSuggestJobId, setAutoSuggestJobId] = useState<string | null>(null);
  const [urgentCollapsed, setUrgentCollapsed] = useState(false);
  const [actionCollapsed, setActionCollapsed] = useState(false);
  const [onTrackCollapsed, setOnTrackCollapsed] = useState(true);
  const [listSearch, setListSearch] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<ListStatusFilter>('all');
  const [listScenarioFilter, setListScenarioFilter] = useState<ListScenarioFilter>('ALL');
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [bulkAssignDriverId, setBulkAssignDriverId] = useState('');
  const [backlogScenarioFilter, setBacklogScenarioFilter] = useState<BacklogScenarioFilter>('ALL');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [exceptionJobId, setExceptionJobId] = useState<string | null>(null);
  const [exceptionType, setExceptionType] = useState('');
  const [exceptionNotes, setExceptionNotes] = useState('');
  const [insertJobId, setInsertJobId] = useState('');
  const [insertPosition, setInsertPosition] = useState<'after_current' | 'after_next' | 'end'>('after_current');
  const [isSimulating, setIsSimulating] = useState(true);
  const [simTick, setSimTick] = useState(0);
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Map simulation
  useEffect(() => {
    if (!isSimulating) return;
    const t = setInterval(() => {
      setSimTick(p => p + 1);
      setVehiclePositions(prev => {
        const next = { ...prev };
        jobs.filter(j => j.status === 'active' && j.driverId).forEach(job => {
          const cur = next[job.driverId!] ?? { x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 };
          next[job.driverId!] = {
            x: Math.max(5, Math.min(95, cur.x + (Math.random() - 0.5) * 2)),
            y: Math.max(5, Math.min(95, cur.y + (Math.random() - 0.5) * 2))
          };
        });
        return next;
      });
    }, 8000);
    return () => clearInterval(t);
  }, [isSimulating, jobs]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Stats
  const stats = useMemo(() => ({
    onRoad: jobs.filter(j => j.status === 'active').length,
    unassigned: jobs.filter(j => !j.driverId && j.status !== 'completed').length,
    exceptions: jobs.filter(j => j.status === 'exception').length,
    idle: drivers.filter(d => !jobs.some(j => j.driverId === d.id && (j.status === 'active' || j.status === 'dispatched'))).length,
  }), [jobs, drivers]);

  // Priority queue buckets
  const now = Date.now();
  const urgentJobs = useMemo(() => jobs.filter(j => {
    if (j.status === 'exception') return true;
    if (!j.driverId && j.scheduledTime) {
      const pickup = new Date(j.scheduledTime).getTime();
      if (pickup < now + 2 * 3600 * 1000) return true;
    }
    if (j.freeTimeExpiry && !j.gateInTimestamp) {
      const exp = new Date(j.freeTimeExpiry);
      const today = new Date();
      if (exp.toDateString() === today.toDateString()) return true;
    }
    return false;
  }), [jobs, now]);

  const actionJobs = useMemo(() => jobs.filter(j => {
    if (urgentJobs.find(u => u.id === j.id)) return false;
    if (!j.driverId && j.scheduledTime) {
      const pickup = new Date(j.scheduledTime).getTime();
      if (pickup < now + 6 * 3600 * 1000) return true;
    }
    if (!j.driverId && j.status === 'pending') return true;
    return false;
  }), [jobs, urgentJobs, now]);

  const onTrackJobs = useMemo(() => jobs.filter(j =>
    !urgentJobs.find(u => u.id === j.id) &&
    !actionJobs.find(a => a.id === j.id) &&
    j.status !== 'completed'
  ), [jobs, urgentJobs, actionJobs]);

  // Driver priority sort
  const sortedDrivers = useMemo(() => {
    const hasException = (d: Driver) => jobs.some(j => j.driverId === d.id && j.status === 'exception');
    const isActive = (d: Driver) => jobs.some(j => j.driverId === d.id && j.status === 'active');
    const isIdle = (d: Driver) => !jobs.some(j => j.driverId === d.id && (j.status === 'active' || j.status === 'dispatched' || j.status === 'scheduled'));
    return [...drivers]
      .filter(d => {
        if (driverSearch && !d.name.toLowerCase().includes(driverSearch.toLowerCase()) &&
          !(vehicles.find(v => v.id === d.assignedVehicleId)?.plateNumber ?? '').toLowerCase().includes(driverSearch.toLowerCase())) return false;
        if (driverFilter === 'on-road') return isActive(d);
        if (driverFilter === 'idle') return isIdle(d);
        if (driverFilter === 'exception') return hasException(d);
        return true;
      })
      .sort((a, b) => {
        const ap = hasException(a) ? 0 : isActive(a) ? 1 : 2;
        const bp = hasException(b) ? 0 : isActive(b) ? 1 : 2;
        return ap - bp;
      });
  }, [drivers, driverFilter, driverSearch, jobs, vehicles]);

  // Auto-suggest drivers for a job
  const suggestDriversForJob = useCallback((job: Job): RatedDriver[] => {
    const pickupMs = job.scheduledTime ? new Date(job.scheduledTime).getTime() : now + 4 * 3600 * 1000;
    return drivers.map(d => {
      const activeJob = jobs.find(j => j.driverId === d.id && (j.status === 'active' || j.status === 'dispatched'));
      const vehicle = vehicles.find(v => v.id === d.assignedVehicleId);
      const isIdle = !activeJob;
      const estFinishMs = isIdle ? now : now + 2 * 3600 * 1000;
      const bufferHours = (pickupMs - estFinishMs) / 3600000;
      const stars: 1 | 2 | 3 = isIdle || bufferHours >= 2 ? 3 : bufferHours >= 1 ? 2 : 1;
      const estFinishLabel = isIdle ? 'Currently idle' : `Finishes ~${new Date(estFinishMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      return { driver: d, vehicle, activeJob, isIdle, stars, estFinishLabel };
    }).sort((a, b) => b.stars - a.stars);
  }, [drivers, jobs, vehicles, now]);

  const handleAssign = (jobId: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
    onAssignJob(jobId, driverId, vehicle?.id ?? '', new Date().toISOString());
    setAutoSuggestJobId(null);
    const job = jobs.find(j => j.id === jobId);
    showToast(`Assigned ${job?.jobNo} → ${driver.name} ✓`);
  };

  const handleBulkAssign = () => {
    if (!bulkAssignDriverId || selectedJobIds.size === 0) return;
    const driver = drivers.find(d => d.id === bulkAssignDriverId);
    if (!driver) return;
    const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
    selectedJobIds.forEach(jobId => {
      onAssignJob(jobId, bulkAssignDriverId, vehicle?.id ?? '', new Date().toISOString());
    });
    showToast(`Assigned ${selectedJobIds.size} jobs → ${driver.name} ✓`);
    setSelectedJobIds(new Set());
    setBulkAssignDriverId('');
  };

  const handleAutoAssignAll = () => {
    const unassigned = jobs.filter(j => !j.driverId && j.status !== 'completed');
    let count = 0;
    unassigned.forEach(job => {
      const suggestions = suggestDriversForJob(job);
      const best = suggestions.find(s => s.stars >= 2);
      if (best) {
        onAssignJob(job.id, best.driver.id, best.vehicle?.id ?? '', new Date().toISOString());
        count++;
      }
    });
    showToast(`Auto-assigned ${count} of ${unassigned.length} jobs ✓`);
  };

  // Filtered jobs for list view
  const listJobs = useMemo(() => {
    let list = jobs;
    if (listStatusFilter !== 'all') {
      if (listStatusFilter === 'unassigned') list = list.filter(j => !j.driverId && j.status !== 'completed');
      else list = list.filter(j => j.status === listStatusFilter);
    }
    if (listScenarioFilter !== 'ALL') list = list.filter(j => j.scenario === listScenarioFilter);
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter(j => {
        const c = customers.find(c => c.id === j.customerId);
        return j.jobNo.toLowerCase().includes(q) || j.containerNo.toLowerCase().includes(q) || c?.name.toLowerCase().includes(q);
      });
    }
    return list;
  }, [jobs, listStatusFilter, listScenarioFilter, listSearch, customers]);

  // Backlog jobs
  const backlogJobs = useMemo(() => {
    let list = jobs.filter(j => !j.driverId && j.status !== 'completed');
    if (backlogScenarioFilter !== 'ALL') list = list.filter(j => j.scenario === backlogScenarioFilter);
    return list.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });
  }, [jobs, backlogScenarioFilter]);

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const selectedDriverJob = selectedDriver ? jobs.find(j => j.driverId === selectedDriver.id && j.status === 'active') : undefined;
  const unassignedJobs = jobs.filter(j => !j.driverId && j.status !== 'completed');

  const driverInitialColor = (name: string) =>
    DRIVER_INITIALS_COLORS[name.charCodeAt(0) % DRIVER_INITIALS_COLORS.length];

  const driverStatusDot = (driver: Driver) => {
    const job = jobs.find(j => j.driverId === driver.id);
    if (!job) return 'bg-slate-300';
    if (job.status === 'exception') return 'bg-red-500 animate-pulse';
    if (job.status === 'active') return 'bg-green-500';
    if (job.status === 'dispatched') return 'bg-blue-500';
    if (job.status === 'scheduled') return 'bg-amber-500';
    return 'bg-slate-300';
  };

  // ── Star renderer ──────────────────────────────────────────────
  const StarRating = ({ stars }: { stars: 1 | 2 | 3 }) => (
    <span className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
    </span>
  );

  // ── Driver Card (left panel) ───────────────────────────────────
  const DriverCard = ({ driver }: { driver: Driver }) => {
    const job = jobs.find(j => j.driverId === driver.id && (j.status === 'active' || j.status === 'exception' || j.status === 'dispatched'));
    const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
    const isSelected = selectedDriverId === driver.id;
    const cust = job ? customers.find(c => c.id === job.customerId) : null;
    const progress = job ? Math.round((job.currentMilestoneIndex / Math.max(job.milestones.length - 1, 1)) * 100) : 0;

    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setSelectedDriverId(isSelected ? null : driver.id)}
        className={`p-3 rounded-lg border mb-2 cursor-pointer transition-all ${
          isSelected ? 'border-blue-400 bg-blue-50' :
          job?.status === 'exception' ? 'border-red-200 bg-red-50' :
          job ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className={`w-8 h-8 rounded-full ${driverInitialColor(driver.name)} flex items-center justify-center text-white text-xs font-black`}>
              {driver.name.charAt(0)}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${driverStatusDot(driver)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">{driver.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{vehicle?.plateNumber ?? '—'}</div>
          </div>
          {job?.status === 'exception' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />}
        </div>
        {job ? (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SCENARIO_COLOR[job.scenario]}`}>{job.scenario}</span>
              <span className="text-[10px] font-mono text-blue-600 font-bold">{job.jobNo}</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">{cust?.name}</div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 bg-slate-200 rounded-full h-1">
                <div className="bg-blue-500 rounded-full h-1 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[9px] text-slate-400 shrink-0">{job.currentMilestoneIndex}/{job.milestones.length}</span>
            </div>
          </div>
        ) : (
          <div className="mt-1.5 text-[10px] text-slate-400 italic">Available · {vehicle?.type ?? '—'}</div>
        )}
      </motion.div>
    );
  };

  // ── Auto-Suggest Inline Panel ──────────────────────────────────
  const AutoSuggestPanel = ({ jobId }: { jobId: string }) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;
    const suggestions = suggestDriversForJob(job);
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="mx-4 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Suggested Drivers for {job.jobNo}
          </div>
          {suggestions.slice(0, 3).map(({ driver, vehicle, isIdle, stars, estFinishLabel }) => (
            <div key={driver.id} className={`flex items-center justify-between p-2.5 rounded border bg-white ${stars === 1 ? 'border-amber-200' : 'border-slate-200'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StarRating stars={stars} />
                  <span className="text-xs font-bold text-slate-800">{driver.name}</span>
                  {stars === 1 && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">⚠ Tight</span>}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{estFinishLabel} · {vehicle?.plateNumber} · {vehicle?.type}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-500" /> License valid
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-500 ml-1" /> Port pass valid
                </div>
              </div>
              <button
                onClick={() => handleAssign(jobId, driver.id)}
                className="ml-2 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded transition"
              >
                Assign →
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // ── Job Row (Priority Queue) ───────────────────────────────────
  const PriorityJobRow = ({ job, urgency }: { job: Job; urgency: 'urgent' | 'action' | 'on-track' }) => {
    const cust = customers.find(c => c.id === job.customerId);
    const driver = job.driverId ? drivers.find(d => d.id === job.driverId) : null;
    const origin = locations.find(l => l.id === job.originLocationId);
    const dest = locations.find(l => l.id === job.destinationLocationId);
    const isExpanded = autoSuggestJobId === job.id;

    const borderColor = urgency === 'urgent' ? 'border-l-red-500' : urgency === 'action' ? 'border-l-amber-500' : 'border-l-green-500';
    const bgColor = urgency === 'urgent' ? 'bg-red-50/40' : urgency === 'action' ? 'bg-amber-50/40' : 'bg-white';

    return (
      <>
        <div className={`flex items-center gap-3 px-4 py-3 border-l-2 ${borderColor} ${bgColor} border-b border-slate-100 last:border-b-0`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700">{job.jobNo}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SCENARIO_COLOR[job.scenario]}`}>{job.scenario}</span>
              {job.status === 'exception' && (
                <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 animate-pulse">
                  EXCEPTION
                </span>
              )}
              {!job.driverId && <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">Unassigned</span>}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {cust?.name} · {origin?.code} → {dest?.code}
              {job.scheduledTime && ` · Pickup ${new Date(job.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </div>
            {driver && <div className="text-[10px] text-slate-400 mt-0.5">Driver: {driver.name}</div>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {job.status === 'exception' ? (
              <button
                onClick={() => setExceptionJobId(job.id)}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded transition"
              >
                View Exception →
              </button>
            ) : (
              <button
                onClick={() => setAutoSuggestJobId(isExpanded ? null : job.id)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition flex items-center gap-1 ${
                  isExpanded ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isExpanded ? 'Close' : (urgency === 'urgent' ? 'Quick Assign →' : 'Auto-Suggest →')}
              </button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isExpanded && <AutoSuggestPanel jobId={job.id} />}
        </AnimatePresence>
      </>
    );
  };

  // ── Priority Queue View ────────────────────────────────────────
  const PriorityView = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Priority Queue</h3>
        <button
          onClick={handleAutoAssignAll}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded transition"
        >
          <Zap className="w-3 h-3" /> Auto-Assign All Unassigned
        </button>
      </div>

      {/* URGENT */}
      <div className="bg-white border border-red-200 rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => setUrgentCollapsed(!urgentCollapsed)}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-red-800 flex-1 text-left">URGENT ({urgentJobs.length})</span>
          <ChevronDown className={`w-3.5 h-3.5 text-red-500 transition-transform ${urgentCollapsed ? '-rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {!urgentCollapsed && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              {urgentJobs.length === 0
                ? <div className="px-4 py-3 text-xs text-slate-400 italic">No urgent items.</div>
                : urgentJobs.map(j => <React.Fragment key={j.id}><PriorityJobRow job={j} urgency="urgent" /></React.Fragment>)
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ACTION NEEDED */}
      <div className="bg-white border border-amber-200 rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => setActionCollapsed(!actionCollapsed)}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-xs font-bold text-amber-800 flex-1 text-left">ACTION NEEDED ({actionJobs.length})</span>
          <ChevronDown className={`w-3.5 h-3.5 text-amber-500 transition-transform ${actionCollapsed ? '-rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {!actionCollapsed && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              {actionJobs.length === 0
                ? <div className="px-4 py-3 text-xs text-slate-400 italic">No action needed.</div>
                : actionJobs.map(j => <React.Fragment key={j.id}><PriorityJobRow job={j} urgency="action" /></React.Fragment>)
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ON TRACK */}
      <div className="bg-white border border-green-200 rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => setOnTrackCollapsed(!onTrackCollapsed)}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-100"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-xs font-bold text-green-800 flex-1 text-left">
            ON TRACK — {onTrackJobs.length} jobs running smoothly
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-green-500 transition-transform ${onTrackCollapsed ? '-rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {!onTrackCollapsed && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              {onTrackJobs.length === 0
                ? <div className="px-4 py-3 text-xs text-slate-400 italic">No jobs in this state.</div>
                : onTrackJobs.map(j => <React.Fragment key={j.id}><PriorityJobRow job={j} urgency="on-track" /></React.Fragment>)
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // ── Map View ───────────────────────────────────────────────────
  const MapView = () => {
    // Normalise location lat/lng to viewport %
    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const toX = (lng: number) => maxLng === minLng ? 50 : ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
    const toY = (lat: number) => maxLat === minLat ? 50 : (1 - (lat - minLat) / (maxLat - minLat)) * 80 + 10;

    const selectedJob = selectedDriverId ? jobs.find(j => j.driverId === selectedDriverId && j.status === 'active') : null;
    const destLoc = selectedJob ? locations.find(l => l.id === selectedJob.destinationLocationId) : null;
    const selectedPos = selectedDriverId ? vehiclePositions[selectedDriverId] : null;

    return (
      <div className="flex-1 relative overflow-hidden">
        {/* Exception banner */}
        {stats.exceptions > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            {stats.exceptions} exception{stats.exceptions > 1 ? 's' : ''} need attention
            <button onClick={() => { setActiveView('priority'); setUrgentCollapsed(false); }} className="underline ml-1">View →</button>
          </div>
        )}

        {/* Map controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
          <button onClick={() => setIsSimulating(!isSimulating)}
            className={`p-2 rounded-lg border text-xs font-bold shadow ${isSimulating ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200'}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Simulated map canvas */}
        <div className="absolute inset-0 bg-slate-100 overflow-hidden">
          {/* Grid background */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Simulated roads */}
            <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 4" />
            <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 4" />
            <line x1="20%" y1="20%" x2="80%" y2="80%" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6 3" />
          </svg>

          {/* Location markers */}
          {locations.map(loc => {
            const x = toX(loc.lng);
            const y = toY(loc.lat);
            const iconColor = loc.type === 'port' ? '#1d4ed8' : loc.type === 'depot' ? '#6b7280' : '#16a34a';
            return (
              <div key={loc.id} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                <div className="relative group">
                  <div className="w-3 h-3 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: iconColor }} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-30">
                    {loc.code} — {loc.type}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Route line for selected driver */}
          {selectedPos && destLoc && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1={`${selectedPos.x}%`} y1={`${selectedPos.y}%`}
                x2={`${toX(destLoc.lng)}%`} y2={`${toY(destLoc.lat)}%`}
                stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" opacity="0.7"
              />
            </svg>
          )}

          {/* Vehicle pins */}
          {jobs.filter(j => j.status === 'active' && j.driverId).map(job => {
            const pos = vehiclePositions[job.driverId!] ?? { x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 };
            const isSelected = selectedDriverId === job.driverId;
            const isException = job.status === 'exception';
            return (
              <motion.div
                key={job.driverId}
                animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                transition={{ duration: 2, ease: 'linear' }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={() => setSelectedDriverId(job.driverId === selectedDriverId ? null : job.driverId!)}
              >
                <div className={`relative flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-all ${
                  isSelected ? 'w-10 h-10' : 'w-7 h-7'
                } ${isException ? 'bg-red-500' : SCENARIO_MAP_COLORS[job.scenario]}`}>
                  <Truck className={`text-white ${isSelected ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </div>
                {isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900 text-white text-[9px] font-mono font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg">
                    {job.jobNo}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 border border-slate-200 rounded-lg p-2.5 text-[9px] space-y-1.5 backdrop-blur-sm">
          <div className="font-bold text-slate-600 uppercase tracking-wider mb-1">Legend</div>
          {Object.entries(SCENARIO_MAP_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.replace('bg-', '') }} />
              <span className="text-slate-600">{s}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 border-t border-slate-100 pt-1 mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-700" />
            <span className="text-slate-600">Port</span>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-500 ml-2" />
            <span className="text-slate-600">Depot</span>
          </div>
        </div>

        {/* Dynamic insertion panel when driver selected */}
        <AnimatePresence>
          {selectedDriverId && selectedDriverJob && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-slate-200 shadow-xl p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800">Dynamic Insertion</h4>
                <button onClick={() => setSelectedDriverId(null)} className="p-1 rounded hover:bg-slate-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 mb-3 text-xs">
                <div className="font-bold text-slate-700">{drivers.find(d => d.id === selectedDriverId)?.name}</div>
                <div className="text-slate-500 font-mono">{selectedDriverJob.jobNo} · {selectedDriverJob.scenario}</div>
                <div className="text-slate-500">{customers.find(c => c.id === selectedDriverJob.customerId)?.name}</div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Insert Unassigned Job</label>
                  <select value={insertJobId} onChange={e => setInsertJobId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
                    <option value="">-- Select job --</option>
                    {unassignedJobs.map(j => (
                      <option key={j.id} value={j.id}>{j.jobNo} · {customers.find(c => c.id === j.customerId)?.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Insert Position</label>
                  {(['after_current', 'after_next', 'end'] as const).map(pos => (
                    <label key={pos} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="radio" value={pos} checked={insertPosition === pos} onChange={() => setInsertPosition(pos)} />
                      {pos === 'after_current' ? 'After current milestone' : pos === 'after_next' ? 'After next drop-off' : 'End of route'}
                    </label>
                  ))}
                </div>
                {insertJobId && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-[10px] text-slate-600">
                    <div className="font-bold text-blue-800 mb-0.5">Route Preview</div>
                    Current: {locations.find(l => l.id === selectedDriverJob.originLocationId)?.code} → {locations.find(l => l.id === selectedDriverJob.destinationLocationId)?.code} (~8h)<br />
                    After insertion: +1h 30m estimated
                  </div>
                )}
                <button
                  disabled={!insertJobId}
                  onClick={() => {
                    if (!insertJobId) return;
                    onTriggerDynamicInsertion(selectedDriverJob.id, insertJobId);
                    showToast(`Inserted ${insertJobId} into route ✓`);
                    setInsertJobId('');
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Insert Job
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ── List View ──────────────────────────────────────────────────
  const ListView = () => {
    const allSelected = listJobs.length > 0 && listJobs.every(j => selectedJobIds.has(j.id));

    return (
      <div className="flex-1 overflow-y-auto">
        {/* Filter bar */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 space-y-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input type="text" placeholder="Search job, container, customer..."
                value={listSearch} onChange={e => setListSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none" />
            </div>
            <select value={listScenarioFilter} onChange={e => setListScenarioFilter(e.target.value as ListScenarioFilter)}
              className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
              {['ALL', 'IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'active', 'unassigned', 'scheduled', 'exception', 'completed'] as ListStatusFilter[]).map(s => (
              <button key={s} onClick={() => setListStatusFilter(s)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded capitalize transition ${listStatusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selectedJobIds.size > 0 && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center gap-3">
              <span className="text-xs font-bold text-blue-800">{selectedJobIds.size} jobs selected</span>
              <select value={bulkAssignDriverId} onChange={e => setBulkAssignDriverId(e.target.value)}
                className="text-xs border border-blue-300 rounded px-2 py-1 bg-white focus:outline-none">
                <option value="">Assign to driver...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button onClick={handleBulkAssign} disabled={!bulkAssignDriverId}
                className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded disabled:opacity-40 transition">
                Assign
              </button>
              <button onClick={() => setSelectedJobIds(new Set())}
                className="text-[10px] text-slate-500 hover:text-slate-700 ml-auto">Clear</button>
            </motion.div>
          )}
        </AnimatePresence>

        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              <th className="py-2.5 px-3">
                <input type="checkbox" checked={allSelected}
                  onChange={() => setSelectedJobIds(allSelected ? new Set() : new Set(listJobs.map(j => j.id)))} />
              </th>
              <th className="py-2.5 px-3 text-left">Job No</th>
              <th className="py-2.5 px-3 text-left">Customer</th>
              <th className="py-2.5 px-2 text-left">Scenario</th>
              <th className="py-2.5 px-3 text-left">Container</th>
              <th className="py-2.5 px-3 text-left">Driver</th>
              <th className="py-2.5 px-2 text-left">Status</th>
              <th className="py-2.5 px-3 text-left">Pickup</th>
              <th className="py-2.5 px-3 text-left">Milestone</th>
              <th className="py-2.5 px-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {listJobs.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-xs text-slate-400 italic">No jobs match filters.</td></tr>
            ) : listJobs.map(job => {
              const cust = customers.find(c => c.id === job.customerId);
              const driver = job.driverId ? drivers.find(d => d.id === job.driverId) : null;
              const isSelected = selectedJobIds.has(job.id);
              const isExpanded = expandedRowIds.has(job.id);
              const origin = locations.find(l => l.id === job.originLocationId);
              const dest = locations.find(l => l.id === job.destinationLocationId);
              const progress = Math.round((job.currentMilestoneIndex / Math.max(job.milestones.length - 1, 1)) * 100);

              const statusStyle: Record<string, string> = {
                active: 'bg-green-50 text-green-700 border-green-200',
                scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
                pending: 'bg-amber-50 text-amber-700 border-amber-200',
                exception: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
                completed: 'bg-slate-100 text-slate-500 border-slate-200',
                dispatched: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              };

              return (
                <React.Fragment key={job.id}>
                  <tr className={`cursor-pointer hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => setExpandedRowIds(prev => { const n = new Set(prev); n.has(job.id) ? n.delete(job.id) : n.add(job.id); return n; })}>
                    <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected}
                        onChange={() => setSelectedJobIds(prev => { const n = new Set(prev); n.has(job.id) ? n.delete(job.id) : n.add(job.id); return n; })} />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{job.jobNo}</td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[110px]">{cust?.name ?? '—'}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SCENARIO_COLOR[job.scenario]}`}>{job.scenario}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{job.containerNo}</td>
                    <td className="py-2.5 px-3 text-slate-600">{driver?.name ?? <span className="text-amber-500 font-bold">Unassigned</span>}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusStyle[job.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">
                      {job.scheduledTime ? new Date(job.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-200 rounded-full h-1">
                          <div className="bg-blue-500 rounded-full h-1" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-400">{job.currentMilestoneIndex}/{job.milestones.length}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2" onClick={e => e.stopPropagation()}>
                      {!driver ? (
                        <button onClick={() => setAutoSuggestJobId(job.id === autoSuggestJobId ? null : job.id)}
                          className="px-2 py-1 bg-blue-600 text-white text-[9px] font-bold rounded hover:bg-blue-700">
                          Assign
                        </button>
                      ) : job.status === 'exception' ? (
                        <button onClick={() => setExceptionJobId(job.id)}
                          className="px-2 py-1 bg-red-600 text-white text-[9px] font-bold rounded animate-pulse">
                          Resolve
                        </button>
                      ) : (
                        <button onClick={() => setExpandedRowIds(prev => { const n = new Set(prev); n.has(job.id) ? n.delete(job.id) : n.add(job.id); return n; })}
                          className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded hover:bg-slate-200">
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                  {autoSuggestJobId === job.id && (
                    <tr><td colSpan={10} className="p-0"><AutoSuggestPanel jobId={job.id} /></td></tr>
                  )}
                  <AnimatePresence>
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <div className="font-bold text-slate-600 mb-1.5">Container Details</div>
                                <div className="text-slate-500">Container: <span className="font-mono font-bold text-slate-800">{job.containerNo}</span></div>
                                <div className="text-slate-500">Size: {job.containerSize}</div>
                                <div className="text-slate-500">Weight: {job.weightKg.toLocaleString()} KG</div>
                              </div>
                              <div>
                                <div className="font-bold text-slate-600 mb-1.5">Route</div>
                                <div className="text-slate-500">{origin?.name ?? '—'}</div>
                                <div className="flex items-center gap-1 my-1"><ArrowRight className="w-3 h-3 text-slate-400" /></div>
                                <div className="text-slate-500">{dest?.name ?? '—'}</div>
                              </div>
                              <div>
                                <div className="font-bold text-slate-600 mb-1.5">References</div>
                                <div className="text-slate-500 font-mono text-[10px]">Quote: {job.quotationId}</div>
                                <div className="text-slate-500 font-mono text-[10px]">Scenario: {job.scenario}</div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] bg-slate-50" id="dispatch-console">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-blue-600" /> Dispatch Console
          </h1>
          <span className="text-xs font-mono text-slate-500">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">{currentUser.regionId ?? 'ALL'}</span>
        </div>

        <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg gap-0.5">
          {([
            { id: 'priority', label: 'Priority Queue', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
            { id: 'map', label: 'Map View', icon: <Map className="w-3.5 h-3.5" /> },
            { id: 'list', label: 'List View', icon: <List className="w-3.5 h-3.5" /> },
          ] as { id: ActiveView; label: string; icon: React.ReactNode }[]).map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition ${activeView === v.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {[
            { label: `${stats.onRoad} On Road`, color: 'bg-green-50 text-green-700 border-green-200', filter: 'on-road' as DriverFilter },
            { label: `${stats.unassigned} Unassigned`, color: 'bg-amber-50 text-amber-700 border-amber-200', filter: 'all' as DriverFilter },
            { label: `${stats.exceptions} Exceptions`, color: 'bg-red-50 text-red-700 border-red-200', filter: 'exception' as DriverFilter },
            { label: `${stats.idle} Idle`, color: 'bg-slate-50 text-slate-600 border-slate-200', filter: 'idle' as DriverFilter },
          ].map(({ label, color, filter }) => (
            <button key={label} onClick={() => setDriverFilter(driverFilter === filter ? 'all' : filter)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded border transition ${color} ${driverFilter === filter ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Drivers &amp; Fleet
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input type="text" placeholder="Search driver or plate..." value={driverSearch} onChange={e => setDriverSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded focus:outline-none" />
            </div>
            <div className="flex gap-1">
              {(['all', 'on-road', 'idle', 'exception'] as DriverFilter[]).map(f => {
                const labels = { all: 'All', 'on-road': 'On Road', idle: 'Idle', exception: 'Exception' };
                return (
                  <button key={f} onClick={() => setDriverFilter(f)}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition capitalize flex-1 ${driverFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {sortedDrivers.length === 0
              ? <div className="text-center py-6 text-xs text-slate-400 italic">No drivers match filter.</div>
              : sortedDrivers.map(d => <React.Fragment key={d.id}><DriverCard driver={d} /></React.Fragment>)
            }
          </div>
        </div>

        {/* ── Center + Bottom ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Center view */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {activeView === 'priority' && (
                <motion.div key="priority" className="flex-1 overflow-hidden flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PriorityView />
                </motion.div>
              )}
              {activeView === 'map' && (
                <motion.div key="map" className="flex-1 overflow-hidden flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MapView />
                </motion.div>
              )}
              {activeView === 'list' && (
                <motion.div key="list" className="flex-1 overflow-hidden flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ListView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom Backlog Bar ── */}
          <div className="shrink-0 bg-white border-t border-slate-200 shadow-lg">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-700">Unassigned Jobs ({backlogJobs.length})</h3>
                <div className="flex gap-0.5">
                  {(['ALL', 'IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'] as BacklogScenarioFilter[]).map(s => (
                    <button key={s} onClick={() => setBacklogScenarioFilter(s)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${backlogScenarioFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 pb-3">
              {backlogJobs.length === 0 ? (
                <div className="flex items-center gap-2 py-2 text-green-700 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> All jobs assigned
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {backlogJobs.map(job => {
                    const cust = customers.find(c => c.id === job.customerId);
                    const origin = locations.find(l => l.id === job.originLocationId);
                    const dest = locations.find(l => l.id === job.destinationLocationId);
                    const isUrgent = job.scheduledTime && new Date(job.scheduledTime).getTime() < now + 2 * 3600 * 1000;
                    return (
                      <motion.div key={job.id} whileHover={{ scale: 1.02 }}
                        className={`shrink-0 w-48 p-3 rounded-lg border-l-2 border text-left ${
                          isUrgent ? 'border-l-red-500 border-red-200 bg-red-50 animate-pulse' :
                          job.scenario === 'IMP' ? 'border-l-blue-500 border-slate-200 bg-white' :
                          job.scenario === 'EXP' ? 'border-l-emerald-500 border-slate-200 bg-white' :
                          'border-l-purple-500 border-slate-200 bg-white'
                        }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${SCENARIO_COLOR[job.scenario]}`}>{job.scenario}</span>
                          {isUrgent && <span className="text-[9px] font-bold text-red-600">⚠ Urgent</span>}
                        </div>
                        <div className="font-mono text-[10px] font-bold text-slate-800">{job.jobNo}</div>
                        <div className="text-[10px] text-slate-500 truncate">{cust?.name}</div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">{job.containerNo} · {job.containerSize}</div>
                        {job.scheduledTime && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Pickup: {new Date(job.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-400 truncate">{origin?.code} → {dest?.code}</div>
                        <button onClick={() => setAutoSuggestJobId(job.id === autoSuggestJobId ? null : job.id)}
                          className="mt-2 w-full text-[9px] font-bold text-blue-600 hover:text-blue-800 text-left">
                          Auto-Suggest →
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Driver Action Slide-out ── */}
      <AnimatePresence>
        {selectedDriver && activeView !== 'map' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-72 bg-white border-l border-slate-200 shadow-2xl z-40 overflow-y-auto"
          >
            <div className="px-4 py-4 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${driverInitialColor(selectedDriver.name)} flex items-center justify-center text-white text-sm font-black`}>
                  {selectedDriver.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{selectedDriver.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${driverStatusDot(selectedDriver)}`} />
                    {selectedDriverJob ? 'On Road' : 'Idle'}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDriverId(null)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Vehicle info */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle</div>
                {(() => {
                  const veh = vehicles.find(v => v.id === selectedDriver.assignedVehicleId);
                  return veh ? (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                      <div className="font-bold font-mono">{veh.plateNumber}</div>
                      <div className="text-slate-500">{veh.type} · {veh.ownerType}</div>
                    </div>
                  ) : <div className="text-xs text-slate-400">No vehicle assigned</div>;
                })()}
              </div>

              {/* Current job */}
              {selectedDriverJob && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current Job</div>
                  <div className="p-2.5 bg-blue-50 rounded border border-blue-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${SCENARIO_COLOR[selectedDriverJob.scenario]}`}>{selectedDriverJob.scenario}</span>
                      <span className="font-mono font-bold text-blue-700">{selectedDriverJob.jobNo}</span>
                    </div>
                    <div className="text-slate-600">{customers.find(c => c.id === selectedDriverJob.customerId)?.name}</div>
                    <div className="font-mono text-slate-500">{selectedDriverJob.containerNo}</div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-slate-200 rounded-full h-1">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${Math.round((selectedDriverJob.currentMilestoneIndex / Math.max(selectedDriverJob.milestones.length - 1, 1)) * 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400">{selectedDriverJob.currentMilestoneIndex}/{selectedDriverJob.milestones.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Today's schedule */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Today's Schedule</div>
                {(() => {
                  const driverJobs = jobs.filter(j => j.driverId === selectedDriver.id && j.status !== 'completed');
                  return driverJobs.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No jobs scheduled today.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {driverJobs.map(j => (
                        <div key={j.id} className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${j.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="font-mono text-slate-500 text-[10px]">
                            {j.scheduledTime ? new Date(j.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                          <span className="text-slate-700 font-bold">{j.jobNo}</span>
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${j.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{j.status}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Dynamic insertion */}
              {selectedDriverJob && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Add Task to Route</div>
                  <select value={insertJobId} onChange={e => setInsertJobId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 mb-2 focus:outline-none">
                    <option value="">Select unassigned job...</option>
                    {unassignedJobs.map(j => <option key={j.id} value={j.id}>{j.jobNo} — {customers.find(c => c.id === j.customerId)?.name}</option>)}
                  </select>
                  <button disabled={!insertJobId}
                    onClick={() => {
                      if (!insertJobId) return;
                      onTriggerDynamicInsertion(selectedDriverJob.id, insertJobId);
                      showToast('Job inserted into route ✓');
                      setInsertJobId('');
                    }}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded transition">
                    Insert Job
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <button onClick={() => alert(`Calling ${selectedDriver.name}: ${selectedDriver.phone}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-xs font-bold text-slate-700 transition">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> Contact Driver
                </button>
                {selectedDriverJob && (
                  <button onClick={() => setExceptionJobId(selectedDriverJob.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 rounded border border-red-200 text-xs font-bold text-red-700 transition">
                    <AlertTriangle className="w-3.5 h-3.5" /> Report Exception
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Exception Modal ── */}
      <AnimatePresence>
        {exceptionJobId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setExceptionJobId(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Report Exception
                </h3>
                <button onClick={() => setExceptionJobId(null)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Exception Type</label>
                  <select value={exceptionType} onChange={e => setExceptionType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none">
                    <option value="">Select type...</option>
                    {['Vehicle Breakdown', 'Accident', 'Customs Hold', 'Customer Refused', 'Wrong Address', 'Port Delay', 'Driver Missing', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Notes</label>
                  <textarea rows={3} value={exceptionNotes} onChange={e => setExceptionNotes(e.target.value)}
                    placeholder="Describe the exception..."
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 resize-none focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setExceptionJobId(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded">Cancel</button>
                <button
                  disabled={!exceptionType}
                  onClick={() => {
                    if (!exceptionJobId || !exceptionType) return;
                    onLogException(exceptionJobId, exceptionType, exceptionNotes, false);
                    showToast('Exception logged ✓');
                    setExceptionJobId(null);
                    setExceptionType('');
                    setExceptionNotes('');
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded disabled:opacity-40 transition">
                  Log Exception
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl z-50 flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
            }`}>
            <CheckCircle2 className="w-4 h-4 text-green-400" /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SCENARIO_MAP_COLORS: Record<string, string> = {
  IMP: '#3b82f6',
  EXP: '#10b981',
  Inland: '#8b5cf6',
  EMTY: '#6b7280',
  RETURN: '#f97316',
};
