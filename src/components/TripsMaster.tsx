/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Job, Driver, Vehicle, Customer, LocationGeo, MilestoneStep } from '../types';
import { 
  Navigation, 
  Search, 
  RefreshCcw, 
  UserPlus, 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  AlertCircle,
  Clock,
  ExternalLink,
  MapPin,
  ArrowRight,
  Sliders,
  ChevronDown,
  X,
  FileCheck2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TripsMasterProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  locations: LocationGeo[];
  onAssignJob: (jobId: string, driverId: string, vehicleId: string) => void;
  onUpdateJobMilestones?: (jobId: string, milestones: MilestoneStep[], currentMilestoneIndex: number) => void;
}

export default function TripsMaster({
  jobs,
  drivers,
  vehicles,
  customers,
  locations,
  onAssignJob,
  onUpdateJobMilestones
}: TripsMasterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'active' | 'completed'>('all');
  
  // Driver swap modal states
  const [swapJobId, setSwapJobId] = useState<string | null>(null);
  const [swapDriverId, setSwapDriverId] = useState('');
  const [swapVehicleId, setSwapVehicleId] = useState('');

  // Milestone edit modal states
  const [selectedMilestoneJobId, setSelectedMilestoneJobId] = useState<string | null>(null);

  const selectedMilestoneJob = useMemo(() => {
    if (!selectedMilestoneJobId) return null;
    return jobs.find(j => j.id === selectedMilestoneJobId) || null;
  }, [jobs, selectedMilestoneJobId]);

  const handleToggleStep = (stepIndex: number) => {
    if (!selectedMilestoneJob || !onUpdateJobMilestones) return;
    
    const updatedMilestones = selectedMilestoneJob.milestones.map((m, idx) => {
      if (idx === stepIndex) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          timestamp: nextCompleted ? new Date().toISOString() : undefined,
          evidenceUrl: nextCompleted ? (m.requiresEvidence ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300' : undefined) : undefined,
          signatureName: nextCompleted ? (m.requiresEvidence ? 'Dispatcher Override (Tower)' : undefined) : undefined
        };
      }
      return m;
    });

    let nextIndex = updatedMilestones.findIndex(m => !m.completed);
    if (nextIndex === -1) {
      nextIndex = updatedMilestones.length - 1;
    }

    onUpdateJobMilestones(selectedMilestoneJob.id, updatedMilestones, nextIndex);
  };

  const handleAdvanceCurrentStep = () => {
    if (!selectedMilestoneJob || !onUpdateJobMilestones) return;
    const currentIndex = selectedMilestoneJob.currentMilestoneIndex;
    handleToggleStep(currentIndex);
  };

  const handleCompleteAllSteps = () => {
    if (!selectedMilestoneJob || !onUpdateJobMilestones) return;
    
    const updatedMilestones = selectedMilestoneJob.milestones.map(m => ({
      ...m,
      completed: true,
      timestamp: m.timestamp || new Date().toISOString(),
      evidenceUrl: m.evidenceUrl || (m.requiresEvidence ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300' : undefined),
      signatureName: m.signatureName || (m.requiresEvidence ? 'Dispatcher (Bulk Override)' : undefined)
    }));

    onUpdateJobMilestones(selectedMilestoneJob.id, updatedMilestones, updatedMilestones.length - 1);
    alert('All operational transit milestones completed! Cargo container marked fully delivered.');
  };

  const handleResetAllSteps = () => {
    if (!selectedMilestoneJob || !onUpdateJobMilestones) return;
    
    const updatedMilestones = selectedMilestoneJob.milestones.map(m => ({
      ...m,
      completed: false,
      timestamp: undefined,
      evidenceUrl: undefined,
      signatureName: undefined
    }));

    onUpdateJobMilestones(selectedMilestoneJob.id, updatedMilestones, 0);
    alert('Container transit milestones have been reset successfully! Ready for fresh dispatch sequence.');
  };

  // Expand a list of all active trip legs.
  // For each Job, we divide it into legs:
  // - Laden Leg (Leg 1): Origin to Destination
  // - Return Leg (Leg 2): Destination to Empty Return Depot (only for IMP/EXP if empty return location exists)
  const tripLegs = useMemo(() => {
    const legs: Array<{
      id: string; // unique leg ID
      jobId: string;
      jobNo: string;
      customerName: string;
      containerNo: string;
      containerSize: string;
      legNumber: number;
      type: 'Laden Leg' | 'Empty Return Leg' | 'Empty Pickup Leg' | 'Transfer Leg';
      fromLoc: LocationGeo | null;
      toLoc: LocationGeo | null;
      driverId?: string;
      vehicleId?: string;
      status: 'Standby' | 'Dispatched' | 'In-Transit' | 'Arrived' | 'Completed';
      timeEstimate: string;
    }> = [];

    jobs.forEach(job => {
      const cust = customers.find(c => c.id === job.customerId)?.name || 'Unknown Client';
      const orig = locations.find(l => l.id === job.originLocationId) || null;
      const dest = locations.find(l => l.id === job.destinationLocationId) || null;
      
      // Determine Milestone-derived leg status as a rough proxy
      let leg1Status: 'Standby' | 'Dispatched' | 'In-Transit' | 'Arrived' | 'Completed' = 'Standby';
      if (job.status === 'completed') leg1Status = 'Completed';
      else if (job.status === 'active') {
        const activeMIdx = job.currentMilestoneIndex;
        if (activeMIdx >= 4) leg1Status = 'Arrived';
        else if (activeMIdx >= 2) leg1Status = 'In-Transit';
        else leg1Status = 'Dispatched';
      } else if (job.status === 'scheduled') {
        leg1Status = 'Dispatched';
      }

      // 1. First Leg: Primary Transportation (Laden)
      const primaryType = job.scenario === 'IMP' ? 'Laden Leg' : job.scenario === 'EXP' ? 'Laden Leg' : 'Transfer Leg';
      legs.push({
        id: `${job.id}-leg1`,
        jobId: job.id,
        jobNo: job.jobNo,
        customerName: cust,
        containerNo: job.containerNo,
        containerSize: job.containerSize,
        legNumber: 1,
        type: primaryType as any,
        fromLoc: orig,
        toLoc: dest,
        driverId: job.driverId,
        vehicleId: job.vehicleId,
        status: leg1Status,
        timeEstimate: '45 mins'
      });

      // 2. Second Leg: Empty container cycle if applicable (IMP has Empty Return, EXP has Empty Pickup)
      if (job.scenario === 'IMP' && job.emptyReturnLocationId) {
        const depotLoc = locations.find(l => l.id === job.emptyReturnLocationId) || null;
        let leg2Status: typeof leg1Status = 'Standby';
        if (job.status === 'completed') leg2Status = 'Completed';
        else if (job.status === 'active' && job.currentMilestoneIndex >= 5) leg2Status = 'In-Transit';

        legs.push({
          id: `${job.id}-leg2`,
          jobId: job.id,
          jobNo: job.jobNo,
          customerName: cust,
          containerNo: job.containerNo,
          containerSize: job.containerSize,
          legNumber: 2,
          type: 'Empty Return Leg',
          fromLoc: dest, // starts at customer destination
          toLoc: depotLoc, // ends at empties depot
          driverId: job.driverId,
          vehicleId: job.vehicleId,
          status: leg2Status,
          timeEstimate: '35 mins'
        });
      }

      if (job.scenario === 'EXP' && job.emptyPickupLocationId) {
        const depotLoc = locations.find(l => l.id === job.emptyPickupLocationId) || null;
        let leg2Status: typeof leg1Status = 'Standby';
        if (job.status === 'active' || job.status === 'completed') leg2Status = 'Completed';

        legs.push({
          id: `${job.id}-leg2`,
          jobId: job.id,
          jobNo: job.jobNo,
          customerName: cust,
          containerNo: job.containerNo,
          containerSize: job.containerSize,
          legNumber: 2,
          type: 'Empty Pickup Leg',
          fromLoc: depotLoc, // starts at empties depot
          toLoc: orig, // ends at origin customer loading site
          driverId: job.driverId,
          vehicleId: job.vehicleId,
          status: leg2Status,
          timeEstimate: '30 mins'
        });
      }
    });

    return legs;
  }, [jobs, customers, locations]);

  // Filters
  const filteredLegs = useMemo(() => {
    return tripLegs.filter(leg => {
      const matchSearch = 
        leg.jobNo.toLowerCase().includes(search.toLowerCase()) ||
        leg.containerNo.toLowerCase().includes(search.toLowerCase()) ||
        leg.customerName.toLowerCase().includes(search.toLowerCase()) ||
        leg.type.toLowerCase().includes(search.toLowerCase());

      const matchStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'unassigned' && !leg.driverId) ||
        (statusFilter === 'active' && leg.driverId && leg.status !== 'Completed') ||
        (statusFilter === 'completed' && leg.status === 'Completed');

      return matchSearch && matchStatus;
    });
  }, [tripLegs, search, statusFilter]);

  // Available drivers & vehicles lists for swap dropdowns
  const availableDrivers = useMemo(() => {
    return drivers.filter(d => d.currentStatus === 'idle' || d.id === swapDriverId);
  }, [drivers, swapDriverId]);

  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => !v.maintenanceAlert);
  }, [vehicles]);

  const openSwapModal = (leg: typeof tripLegs[0]) => {
    setSwapJobId(leg.jobId);
    setSwapDriverId(leg.driverId || '');
    setSwapVehicleId(leg.vehicleId || '');
  };

  const handleApplySwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapJobId || !swapDriverId || !swapVehicleId) {
      alert('Must select both a driver and a vehicle to perform scheduler swap.');
      return;
    }

    onAssignJob(swapJobId, swapDriverId, swapVehicleId);
    setSwapJobId(null);
    alert('Logistics driver swap completed. Operational manifest updated dynamically.');
  };

  return (
    <div className="space-y-6" id="trips-master-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
            <Navigation className="text-blue-600 w-5 h-5 animate-pulse" /> Movements &amp; Trip Legs Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated operational view of all sequential container trip movements (Laden Deliveries &amp; Empty Return corridors). Perform real-time driver swaps and status updates.
          </p>
        </div>

        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-sm shrink-0 self-start md:self-auto text-xs font-mono font-bold text-slate-500 shadow-xs">
          TOTAL TARIFF CORRIDORS: {tripLegs.length} LEGS
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Trip Legs</span>
          <span className="text-lg font-black text-slate-800 font-mono mt-1 block">{tripLegs.length}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">In Transit/Active Legs</span>
          <span className="text-lg font-black text-blue-600 font-mono mt-1 block">
            {tripLegs.filter(l => l.driverId && l.status !== 'Completed').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Unassigned Pending Queue</span>
          <span className="text-lg font-black text-orange-600 font-mono mt-1 block">
            {tripLegs.filter(l => !l.driverId).length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed Deliveries</span>
          <span className="text-lg font-black text-green-600 font-mono mt-1 block">
            {tripLegs.filter(l => l.status === 'Completed').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Action bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="trips-search-input"
            type="text"
            placeholder="Search Leg Type, Job No, Container or Client..."
            className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-700 font-sans focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded text-[11px] font-sans font-bold">
          <button
            id="trip-filter-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            All Movement Legs
          </button>
          <button
            id="trip-filter-unassigned"
            onClick={() => setStatusFilter('unassigned')}
            className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'unassigned' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Unassigned Leg Units
          </button>
          <button
            id="trip-filter-active"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'active' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            In-Transit / Active
          </button>
          <button
            id="trip-filter-completed"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'completed' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Trip Legs Movement List Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredLegs.length === 0 ? (
          <div className="border border-dashed border-slate-200 bg-white rounded-lg py-16 text-center text-xs text-slate-400 font-sans italic">
            No transit movement legs found matching the selected query filters.
          </div>
        ) : (
          filteredLegs.map((leg) => {
            const drvObj = drivers.find(d => d.id === leg.driverId);
            const vehObj = vehicles.find(v => v.id === leg.vehicleId);
            const jobObj = jobs.find(j => j.id === leg.jobId);
            const activeMilestone = jobObj ? jobObj.milestones[jobObj.currentMilestoneIndex] : null;

            return (
              <div 
                key={leg.id}
                id={`trip-leg-card-${leg.id}`}
                className="bg-white border border-slate-200 hover:border-slate-300 transition-all rounded-lg p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs"
              >
                {/* Leg Core Details */}
                <div className="flex items-start gap-3.5 flex-1 select-none pr-4">
                  <div className={`p-2.5 rounded shrink-0 border uppercase font-sans font-black text-[10px] text-center w-14 ${
                    leg.type === 'Laden Leg' 
                      ? 'bg-blue-50 border-blue-105 border-blue-200 text-blue-700' 
                      : leg.type === 'Transfer Leg'
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    LEG {leg.legNumber}
                    <div className="text-[8px] font-mono font-bold mt-0.5 text-slate-400">STAGE</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-950 font-mono">{leg.jobNo}</span>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">• {leg.customerName}</span>
                      <span className={`px-2 py-0.2 rounded text-[9px] font-sans font-bold uppercase border ${
                        leg.status === 'Completed' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : leg.status === 'In-Transit' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : leg.status === 'Dispatched'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {leg.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 font-mono">
                      CONTAINER: <strong className="text-slate-900 font-black">{leg.containerNo}</strong> ({leg.containerSize})
                    </div>

                    {/* From - To visual path */}
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 font-sans pt-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{leg.fromLoc?.code}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{leg.toLoc?.code}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">({leg.type})</span>
                    </div>

                    {/* Active Milestone preview indicator */}
                    {activeMilestone && (
                      <div className="flex items-center gap-1.5 pt-1.5 text-[10px] font-sans font-bold text-blue-600 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                        Current: <span className="underline">{activeMilestone.label}</span>
                        <span className="text-slate-400 font-normal normal-case ml-1">
                          (Step {jobObj.currentMilestoneIndex + 1} of {jobObj.milestones.length})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver / Scheduling context */}
                <div className="flex items-center gap-6 justify-between lg:justify-end border-t border-slate-100 lg:border-none pt-3 lg:pt-0">
                  <div className="text-left lg:text-right text-xs">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Assigned Crew Member</div>
                    {drvObj ? (
                      <div className="font-sans font-extrabold text-slate-800 flex items-center lg:justify-end gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {drvObj.name} <span className="text-slate-400 text-[10px] font-mono">({vehObj?.plateNumber || 'TRACTOR'})</span>
                      </div>
                    ) : (
                      <div className="text-red-500 font-bold font-mono text-[11px] mt-0.5">UNASSIGNED PENDING DISPATCH</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      id={`trip-milestones-btn-${leg.id}`}
                      onClick={() => setSelectedMilestoneJobId(leg.jobId)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded text-[11px] font-extrabold font-sans transition flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-100" /> Milestones
                    </button>

                    {leg.status !== 'Completed' && (
                      <button
                        id={`trip-swap-btn-${leg.id}`}
                        onClick={() => openSwapModal(leg)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 hover:scale-[1.02] active:scale-[0.98] text-white rounded text-[11px] font-extrabold font-sans transition flex items-center gap-1.5 shadow-xs"
                      >
                        <RefreshCcw className="w-3 h-3 text-orange-400" /> Swap Driver
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Driver Swap Dialog Backdrop */}
      <AnimatePresence>
        {swapJobId && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleApplySwap}
              className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-300 shadow-2xl relative space-y-4"
            >
              {/* Close Icon button */}
              <button 
                id="close-swap-modal"
                type="button"
                onClick={() => setSwapJobId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1 bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="text-[10px] font-bold text-orange-500 font-mono tracking-widest uppercase">DYNAMIC SWAP ENGINE</div>
                <h3 className="text-sm font-black font-sans text-slate-900">Change Scheduled Haulier Crew</h3>
                <p className="text-[11px] text-slate-500">Select another local driver to take over this consignment load immediately.</p>
              </div>

              {/* Selector */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Select Active Driver *</label>
                  <select
                    id="swap-driver-select"
                    value={swapDriverId}
                    onChange={(e) => {
                      setSwapDriverId(e.target.value);
                      const matchingDrv = drivers.find(d => d.id === e.target.value);
                      if (matchingDrv) setSwapVehicleId(matchingDrv.assignedVehicleId);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Idle Driver --</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.currentStatus === 'idle' ? 'IDLE' : 'ASSIGNED STATUS'})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-505 font-bold block">Assigned Transport Vehicle *</label>
                  <select
                    id="swap-vehicle-select"
                    value={swapVehicleId}
                    onChange={(e) => setSwapVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-202 rounded px-3 py-1.5 text-xs focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Heavy Vehicle --</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} ({v.type} Owner: {v.ownerType})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer action */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 text-[11px]">
                <button
                  id="cancel-swap-btn"
                  type="button"
                  onClick={() => setSwapJobId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded font-bold transition"
                >
                  Cancel Swap
                </button>
                <button
                  id="submit-swap-btn"
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  Confirm Fleet Swap
                </button>
              </div>
            </motion.form>
          </div>
        )}

        {/* Milestone Control Tower Modal */}
        {selectedMilestoneJob && (() => {
          const completedStepsCount = selectedMilestoneJob.milestones.filter(m => m.completed).length;
          const totalStepsCount = selectedMilestoneJob.milestones.length;
          const completionPercentage = Math.round((completedStepsCount / (totalStepsCount || 1)) * 100);

          return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="milestones-modal-backdrop">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full border border-slate-300 shadow-2xl relative space-y-5 my-8"
                id="milestones-modal-card"
              >
                {/* Close Icon button */}
                <button 
                  id="close-milestones-modal"
                  type="button"
                  onClick={() => setSelectedMilestoneJobId(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1.5 bg-slate-100 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Title Header */}
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <div className="text-[10px] font-bold text-blue-600 font-mono tracking-widest uppercase flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5" /> Dispatch Control Tower
                  </div>
                  <h3 className="text-base font-black font-sans text-slate-900 flex items-center gap-2">
                    Interactive Milestone Registry
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-[11px] font-sans font-extrabold text-slate-500">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[8px] font-mono text-slate-400 block uppercase font-medium">JOB NUMBER</span>
                      <span className="font-mono text-slate-800">{selectedMilestoneJob.jobNo}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[8px] font-mono text-slate-400 block uppercase font-medium">CONTAINER / SEAL</span>
                      <span className="font-mono text-slate-800">{selectedMilestoneJob.containerNo}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[8px] font-mono text-slate-400 block uppercase font-medium">ROUTE PLAN</span>
                      <span className="text-slate-800">{selectedMilestoneJob.scenario} Type</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[8px] font-mono text-slate-400 block uppercase font-medium">CREW MEMBER</span>
                      <span className="text-emerald-750 text-emerald-600">
                        {drivers.find(d => d.id === selectedMilestoneJob.driverId)?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="bg-blue-50/50 rounded-lg p-3.5 border border-blue-100/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-sans font-extrabold text-blue-900 uppercase">Operational Progress Status</span>
                    <span className="font-mono font-black text-blue-700">{completionPercentage}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans leading-normal">
                    Dispatcher manual override allows direct completion of operational milestones. Clicking individual step checkboxes bypasses normal sensor geofencing telemetry.
                  </p>
                </div>

                {/* Steps Checklist */}
                <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 font-sans">
                  {selectedMilestoneJob.milestones.map((step, idx) => {
                    const isCurrent = idx === selectedMilestoneJob.currentMilestoneIndex;
                    return (
                      <div 
                        key={step.id}
                        id={`milestone-step-item-${step.id}`}
                        onClick={() => handleToggleStep(idx)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer select-none flex items-start gap-3 ${
                          step.completed 
                            ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/60' 
                            : isCurrent 
                            ? 'bg-blue-50/50 border-blue-200 outline-2 outline-blue-500/25 border-dashed hover:bg-blue-50/70'
                            : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox button */}
                        <div
                          id={`milestone-checkbox-${idx}`}
                          className={`w-5 h-5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                            step.completed 
                              ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs' 
                              : isCurrent 
                              ? 'bg-white border-blue-400 text-blue-500 animate-pulse'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                        >
                          <svg className="w-3 h-3 fill-none stroke-current stroke-3" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>

                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black uppercase ${step.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                              {idx + 1}. {step.label}
                            </span>
                            {isCurrent && (
                              <span className="bg-blue-600 text-white rounded text-[8px] font-extrabold px-1.5 py-0.2 tracking-widest uppercase">
                                Active Step
                              </span>
                            )}
                            {step.requiresEvidence && (
                              <span className="bg-amber-100 text-amber-805 text-amber-800 rounded text-[8px] font-extrabold px-1.5 py-0.2 uppercase font-mono">
                                Requires Signed Pod
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            {step.description}
                          </p>
                          
                          {step.completed && (
                            <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-1">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              Completed on {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : 'N/A Override'}
                              {step.signatureName && ` by ${step.signatureName}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-400 uppercase text-[9px]">Tower Controls</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-end">
                    <button
                      id="milestone-reset-all-btn"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleResetAllSteps(); }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 text-slate-600 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCcw className="w-2.5 h-2.5 text-red-500" /> Reset Sequence
                    </button>

                    <button
                      id="milestone-all-complete-btn"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCompleteAllSteps(); }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-205 text-emerald-200" /> Fast-Forward All
                    </button>

                    {selectedMilestoneJob.currentMilestoneIndex < selectedMilestoneJob.milestones.length && (
                      <button
                        id="milestone-advance-btn"
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAdvanceCurrentStep(); }}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-extrabold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        Advance Active Step
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-3 border-t border-slate-100 text-xs">
                  <button
                    id="close-milestones-override"
                    type="button"
                    onClick={() => setSelectedMilestoneJobId(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold transition shadow-xs cursor-pointer"
                  >
                    Close Controller Panel
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
