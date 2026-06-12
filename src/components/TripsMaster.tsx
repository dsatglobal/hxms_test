/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Job, Driver, Vehicle, Customer, LocationGeo, MilestoneStep, ScenarioType } from '../types';
import {
  Navigation, RefreshCcw, CheckCircle2, Clock, ArrowRight, X, Sparkles, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection, DrawerField, DrawerFieldGrid } from './shared/DetailDrawer';
import { T, badgeClass, SCENARIO_COLORS } from './shared/ui';

interface TripsMasterProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  locations: LocationGeo[];
  onAssignJob: (jobId: string, driverId: string, vehicleId: string) => void;
  onUpdateJobMilestones?: (jobId: string, milestones: MilestoneStep[], currentMilestoneIndex: number) => void;
}

type LegStatus = 'Standby' | 'Dispatched' | 'In-Transit' | 'Arrived' | 'Completed' | 'Exception';

interface TripLeg {
  id: string;
  jobId: string;
  jobNo: string;
  customerName: string;
  containerNo: string;
  containerSize: string;
  scenario: ScenarioType;
  legNumber: number;
  type: 'Laden Leg' | 'Empty Return Leg' | 'Empty Pickup Leg' | 'Transfer Leg';
  fromLoc: LocationGeo | null;
  toLoc: LocationGeo | null;
  driverId?: string;
  vehicleId?: string;
  status: LegStatus;
  scheduledDate: string;
  timeEstimate: string;
}

const LEG_STATUS_BADGE: Record<LegStatus, string> = {
  Standby: 'draft',
  Dispatched: 'dispatched',
  'In-Transit': 'active',
  Arrived: 'confirmed',
  Completed: 'completed',
  Exception: 'exception',
};

export default function TripsMaster({
  jobs, drivers, vehicles, customers, locations, onAssignJob, onUpdateJobMilestones,
}: TripsMasterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Drawer
  const [selectedLegId, setSelectedLegId] = useState<string | null>(null);

  // Driver swap modal
  const [swapJobId, setSwapJobId] = useState<string | null>(null);
  const [swapDriverId, setSwapDriverId] = useState('');
  const [swapVehicleId, setSwapVehicleId] = useState('');

  // Expand jobs into trip legs (laden + empty cycles)
  const tripLegs = useMemo(() => {
    const legs: TripLeg[] = [];
    jobs.forEach(job => {
      const cust = customers.find(c => c.id === job.customerId)?.name || 'Unknown Client';
      const orig = locations.find(l => l.id === job.originLocationId) || null;
      const dest = locations.find(l => l.id === job.destinationLocationId) || null;
      const scheduledDate = job.scheduledTime ? job.scheduledTime.slice(0, 10) : (job.createdAt ?? '').slice(0, 10);

      // Milestone-derived leg status as a rough proxy
      let leg1Status: LegStatus = 'Standby';
      if (job.status === 'exception') leg1Status = 'Exception';
      else if (job.status === 'completed') leg1Status = 'Completed';
      else if (job.status === 'active') {
        const activeMIdx = job.currentMilestoneIndex;
        if (activeMIdx >= 4) leg1Status = 'Arrived';
        else if (activeMIdx >= 2) leg1Status = 'In-Transit';
        else leg1Status = 'Dispatched';
      } else if (job.status === 'scheduled') {
        leg1Status = 'Dispatched';
      }

      const primaryType = job.scenario === 'IMP' || job.scenario === 'EXP' ? 'Laden Leg' : 'Transfer Leg';
      legs.push({
        id: `${job.id}-leg1`,
        jobId: job.id, jobNo: job.jobNo, customerName: cust,
        containerNo: job.containerNo, containerSize: job.containerSize,
        scenario: job.scenario, legNumber: 1, type: primaryType,
        fromLoc: orig, toLoc: dest,
        driverId: job.driverId, vehicleId: job.vehicleId,
        status: leg1Status, scheduledDate, timeEstimate: '45 mins',
      });

      if (job.scenario === 'IMP' && job.emptyReturnLocationId) {
        const depotLoc = locations.find(l => l.id === job.emptyReturnLocationId) || null;
        let leg2Status: LegStatus = 'Standby';
        if (job.status === 'exception') leg2Status = 'Exception';
        else if (job.status === 'completed') leg2Status = 'Completed';
        else if (job.status === 'active' && job.currentMilestoneIndex >= 5) leg2Status = 'In-Transit';
        legs.push({
          id: `${job.id}-leg2`,
          jobId: job.id, jobNo: job.jobNo, customerName: cust,
          containerNo: job.containerNo, containerSize: job.containerSize,
          scenario: job.scenario, legNumber: 2, type: 'Empty Return Leg',
          fromLoc: dest, toLoc: depotLoc,
          driverId: job.driverId, vehicleId: job.vehicleId,
          status: leg2Status, scheduledDate, timeEstimate: '35 mins',
        });
      }

      if (job.scenario === 'EXP' && job.emptyPickupLocationId) {
        const depotLoc = locations.find(l => l.id === job.emptyPickupLocationId) || null;
        let leg2Status: LegStatus = 'Standby';
        if (job.status === 'exception') leg2Status = 'Exception';
        else if (job.status === 'active' || job.status === 'completed') leg2Status = 'Completed';
        legs.push({
          id: `${job.id}-leg2`,
          jobId: job.id, jobNo: job.jobNo, customerName: cust,
          containerNo: job.containerNo, containerSize: job.containerSize,
          scenario: job.scenario, legNumber: 2, type: 'Empty Pickup Leg',
          fromLoc: depotLoc, toLoc: orig,
          driverId: job.driverId, vehicleId: job.vehicleId,
          status: leg2Status, scheduledDate, timeEstimate: '30 mins',
        });
      }
    });
    return legs;
  }, [jobs, customers, locations]);

  const filteredLegs = useMemo(() => {
    return tripLegs.filter(leg => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        leg.jobNo.toLowerCase().includes(q) ||
        leg.containerNo.toLowerCase().includes(q) ||
        leg.customerName.toLowerCase().includes(q) ||
        leg.type.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unassigned' && !leg.driverId) ||
        (statusFilter === 'active' && !!leg.driverId && leg.status !== 'Completed' && leg.status !== 'Exception') ||
        (statusFilter === 'completed' && leg.status === 'Completed') ||
        (statusFilter === 'exception' && leg.status === 'Exception');
      const matchScenario = !scenarioFilter || leg.scenario === scenarioFilter;
      const matchDriver = !driverFilter || leg.driverId === driverFilter;
      const matchDate =
        (!dateRange.from || (leg.scheduledDate && leg.scheduledDate >= dateRange.from)) &&
        (!dateRange.to || (leg.scheduledDate && leg.scheduledDate <= dateRange.to));
      return matchSearch && matchStatus && matchScenario && matchDriver && matchDate;
    });
  }, [tripLegs, search, statusFilter, scenarioFilter, driverFilter, dateRange]);

  const selectedLeg = tripLegs.find(l => l.id === selectedLegId) || null;
  const selectedJob = selectedLeg ? jobs.find(j => j.id === selectedLeg.jobId) || null : null;
  const selectedDriver = selectedLeg ? drivers.find(d => d.id === selectedLeg.driverId) || null : null;
  const selectedVehicle = selectedLeg ? vehicles.find(v => v.id === selectedLeg.vehicleId) || null : null;

  // Milestone manipulation (preserved logic, now targets selected job)
  const handleToggleStep = (stepIndex: number) => {
    if (!selectedJob || !onUpdateJobMilestones) return;
    const updatedMilestones = selectedJob.milestones.map((m, idx) => {
      if (idx === stepIndex) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          timestamp: nextCompleted ? new Date().toISOString() : undefined,
          evidenceUrl: nextCompleted ? (m.requiresEvidence ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300' : undefined) : undefined,
          signatureName: nextCompleted ? (m.requiresEvidence ? 'Dispatcher Override (Tower)' : undefined) : undefined,
        };
      }
      return m;
    });
    let nextIndex = updatedMilestones.findIndex(m => !m.completed);
    if (nextIndex === -1) nextIndex = updatedMilestones.length - 1;
    onUpdateJobMilestones(selectedJob.id, updatedMilestones, nextIndex);
  };

  const handleAdvanceCurrentStep = () => {
    if (!selectedJob || !onUpdateJobMilestones) return;
    handleToggleStep(selectedJob.currentMilestoneIndex);
  };

  const handleCompleteAllSteps = () => {
    if (!selectedJob || !onUpdateJobMilestones) return;
    const updatedMilestones = selectedJob.milestones.map(m => ({
      ...m,
      completed: true,
      timestamp: m.timestamp || new Date().toISOString(),
      evidenceUrl: m.evidenceUrl || (m.requiresEvidence ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300' : undefined),
      signatureName: m.signatureName || (m.requiresEvidence ? 'Dispatcher (Bulk Override)' : undefined),
    }));
    onUpdateJobMilestones(selectedJob.id, updatedMilestones, updatedMilestones.length - 1);
    alert('All operational transit milestones completed! Cargo container marked fully delivered.');
  };

  const handleResetAllSteps = () => {
    if (!selectedJob || !onUpdateJobMilestones) return;
    const updatedMilestones = selectedJob.milestones.map(m => ({
      ...m, completed: false, timestamp: undefined, evidenceUrl: undefined, signatureName: undefined,
    }));
    onUpdateJobMilestones(selectedJob.id, updatedMilestones, 0);
    alert('Container transit milestones have been reset successfully! Ready for fresh dispatch sequence.');
  };

  // Swap modal helpers (preserved)
  const availableDrivers = useMemo(
    () => drivers.filter(d => d.currentStatus === 'idle' || d.id === swapDriverId),
    [drivers, swapDriverId]
  );
  const availableVehicles = useMemo(() => vehicles.filter(v => !v.maintenanceAlert), [vehicles]);

  const openSwapModal = (leg: TripLeg) => {
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

  const columns: DataTableColumn<TripLeg>[] = [
    {
      key: 'tripId', header: 'Trip ID', sortValue: l => l.id,
      render: l => (
        <div>
          <span className={T.cellId}>{l.jobNo}-L{l.legNumber}</span>
          <span className={`${T.cellMuted} block`}>{l.type}</span>
        </div>
      ),
    },
    {
      key: 'jobNo', header: 'Job No', sortValue: l => l.jobNo,
      render: l => <span className={T.cellId}>{l.jobNo}</span>,
    },
    {
      key: 'leg', header: 'Leg', align: 'center', sortValue: l => l.legNumber,
      render: l => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${SCENARIO_COLORS[l.scenario] ?? 'bg-slate-100 text-slate-600'}`}>
          {l.scenario} · L{l.legNumber}
        </span>
      ),
    },
    {
      key: 'customer', header: 'Customer', sortValue: l => l.customerName,
      render: l => (
        <div>
          <span className={T.cellPrimary}>{l.customerName}</span>
          <span className={`${T.cellId} block`}>{l.containerNo}</span>
        </div>
      ),
    },
    {
      key: 'route', header: 'From → To', sortValue: l => l.fromLoc?.code ?? '',
      render: l => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <span className="px-1.5 py-0.5 bg-slate-100 rounded">{l.fromLoc?.code ?? '?'}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="px-1.5 py-0.5 bg-slate-100 rounded">{l.toLoc?.code ?? '?'}</span>
        </div>
      ),
    },
    {
      key: 'driver', header: 'Driver', sortValue: l => drivers.find(d => d.id === l.driverId)?.name ?? '',
      render: l => {
        const drv = drivers.find(d => d.id === l.driverId);
        return drv
          ? <span className={T.cellPrimary}>{drv.name}</span>
          : <span className={badgeClass('unassigned')}>Unassigned</span>;
      },
    },
    {
      key: 'status', header: 'Status', sortValue: l => l.status,
      render: l => <span className={badgeClass(LEG_STATUS_BADGE[l.status])}>{l.status}</span>,
    },
  ];

  const activeFilterCount =
    (search ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (scenarioFilter ? 1 : 0) +
    (driverFilter ? 1 : 0) + (dateRange.from || dateRange.to ? 1 : 0);

  const exceptionLog = selectedJob?.exceptionLog ?? [];

  return (
    <div className="space-y-4" id="trips-master-container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`${T.pageTitle} flex items-center gap-2`}>
            <Navigation className="text-blue-600 w-5 h-5" /> Movements &amp; Trip Legs Registry
          </h1>
          <p className={T.pageSubtitle}>Sequential container trip movements (laden deliveries &amp; empty return corridors), driver swaps, and milestone updates.</p>
        </div>
        <div className="flex bg-slate-100 border border-slate-200 px-3 py-1.5 rounded text-xs font-mono font-bold text-slate-500">
          {tripLegs.length} LEGS
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Trip Legs</span>
          <span className="text-lg font-black text-slate-800 font-mono">{tripLegs.length}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">In Transit / Active</span>
          <span className="text-lg font-black text-blue-600 font-mono">
            {tripLegs.filter(l => l.driverId && l.status !== 'Completed' && l.status !== 'Exception').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Unassigned Queue</span>
          <span className="text-lg font-black text-orange-600 font-mono">{tripLegs.filter(l => !l.driverId).length}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed</span>
          <span className="text-lg font-black text-green-600 font-mono">{tripLegs.filter(l => l.status === 'Completed').length}</span>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <FilterBar
          searchPlaceholder="Search Leg, Job, Container, or Client…"
          searchValue={search}
          onSearchChange={setSearch}
          statusOptions={[
            { value: 'all', label: 'All', count: tripLegs.length },
            { value: 'unassigned', label: 'Unassigned', count: tripLegs.filter(l => !l.driverId).length },
            { value: 'active', label: 'In-Transit / Active', count: tripLegs.filter(l => l.driverId && l.status !== 'Completed' && l.status !== 'Exception').length },
            { value: 'exception', label: 'Exception', count: tripLegs.filter(l => l.status === 'Exception').length },
            { value: 'completed', label: 'Completed', count: tripLegs.filter(l => l.status === 'Completed').length },
          ]}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          dropdownFilters={[
            {
              key: 'scenario', label: 'Scenario',
              options: ['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'].map(s => ({ value: s, label: s })),
              value: scenarioFilter, onChange: setScenarioFilter,
            },
            {
              key: 'driver', label: 'Driver',
              options: drivers.map(d => ({ value: d.id, label: d.name })),
              value: driverFilter, onChange: setDriverFilter,
            },
          ]}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          dateRangeLabel="Scheduled"
          onClearAll={() => { setSearch(''); setStatusFilter('all'); setScenarioFilter(''); setDriverFilter(''); setDateRange({ from: '', to: '' }); }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={filteredLegs}
          onRowClick={l => setSelectedLegId(l.id)}
          rowActions={l => l.status !== 'Completed' ? (
            <button
              id={`trip-swap-btn-${l.id}`}
              onClick={() => openSwapModal(l)}
              className="h-7 px-2 flex items-center gap-1 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-100"
              title="Assign / Swap Driver"
            >
              <RefreshCcw className="w-3 h-3 text-orange-500" /> Swap
            </button>
          ) : null}
          emptyState={{
            icon: <Navigation className="w-10 h-10" />,
            title: 'No transit movement legs found',
            subtitle: 'Adjust the filters to find trip movements.',
          }}
        />
      </div>

      {/* Detail drawer */}
      <DetailDrawer
        open={!!selectedLeg}
        onClose={() => setSelectedLegId(null)}
        width="520px"
        title={
          <>
            <span className="font-mono">{selectedLeg?.jobNo}-L{selectedLeg?.legNumber}</span>
            {selectedLeg && <span className={badgeClass(LEG_STATUS_BADGE[selectedLeg.status])}>{selectedLeg.status}</span>}
          </>
        }
        subtitle={selectedLeg ? `${selectedLeg.type} · ${selectedLeg.customerName}` : undefined}
        footer={
          selectedLeg && selectedLeg.status !== 'Completed' ? (
            <button
              onClick={() => openSwapModal(selectedLeg)}
              className="h-9 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-orange-400" />
              {selectedLeg.driverId ? 'Swap Driver' : 'Assign Driver'}
            </button>
          ) : undefined
        }
      >
        {selectedLeg && selectedJob && (
          <>
            <DrawerSection title="Trip Details">
              <DrawerFieldGrid>
                <DrawerField label="Job No" value={<span className="font-mono text-blue-600">{selectedLeg.jobNo}</span>} />
                <DrawerField label="Customer" value={selectedLeg.customerName} bold />
                <DrawerField label="Container" value={<span className="font-mono text-blue-600">{selectedLeg.containerNo}</span>} />
                <DrawerField label="Size" value={selectedLeg.containerSize} />
                <DrawerField label="Scenario" value={selectedLeg.scenario} />
                <DrawerField label="Leg Type" value={selectedLeg.type} />
                <DrawerField label="Route" value={
                  <span className="inline-flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{selectedLeg.fromLoc?.name} ({selectedLeg.fromLoc?.code})</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{selectedLeg.toLoc?.name} ({selectedLeg.toLoc?.code})</span>
                  </span>
                } full />
                <DrawerField label="Assigned Driver" value={selectedDriver ? selectedDriver.name : 'Unassigned'} bold />
                <DrawerField label="Vehicle" value={selectedVehicle ? <span className="font-mono text-blue-600">{selectedVehicle.plateNumber}</span> : undefined} />
                <DrawerField label="Scheduled" value={selectedLeg.scheduledDate} />
                <DrawerField label="Time Estimate" value={selectedLeg.timeEstimate} />
              </DrawerFieldGrid>
            </DrawerSection>

            {/* Exception log */}
            {exceptionLog.length > 0 && (
              <DrawerSection title="Exception Log">
                <div className="space-y-2">
                  {exceptionLog.map((ex, i) => (
                    <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        {ex.type ?? 'Exception Reported'}
                      </div>
                      {(ex.notes || ex.note) && <p className="mt-1 text-red-700">{ex.notes ?? ex.note}</p>}
                      <div className="mt-1 text-[10px] text-red-400 font-mono">
                        {(ex.reportedAt ?? ex.timestamp) && new Date(ex.reportedAt ?? ex.timestamp!).toLocaleString()}
                        {ex.loggedBy && ` · by ${ex.loggedBy}`}
                      </div>
                    </div>
                  ))}
                </div>
              </DrawerSection>
            )}

            {/* Milestones (interactive control tower, preserved) */}
            <DrawerSection title="Milestones">
              {(() => {
                const completedStepsCount = selectedJob.milestones.filter(m => m.completed).length;
                const totalStepsCount = selectedJob.milestones.length;
                const completionPercentage = Math.round((completedStepsCount / (totalStepsCount || 1)) * 100);
                return (
                  <div className="space-y-3">
                    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-blue-900 uppercase">Progress</span>
                        <span className="font-mono font-black text-blue-700">{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${completionPercentage}%` }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedJob.milestones.map((step, idx) => {
                        const isCurrent = idx === selectedJob.currentMilestoneIndex;
                        return (
                          <div
                            key={step.id}
                            id={`milestone-step-item-${step.id}`}
                            onClick={() => handleToggleStep(idx)}
                            className={`p-2.5 rounded-lg border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                              step.completed
                                ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/60'
                                : isCurrent
                                ? 'bg-blue-50/50 border-blue-200 border-dashed hover:bg-blue-50/70'
                                : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                                step.completed
                                  ? 'bg-emerald-600 border-emerald-700 text-white'
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-black uppercase ${step.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                  {idx + 1}. {step.label}
                                </span>
                                {isCurrent && (
                                  <span className="bg-blue-600 text-white rounded text-[8px] font-extrabold px-1.5 tracking-widest uppercase">Active</span>
                                )}
                                {step.requiresEvidence && (
                                  <span className="bg-amber-100 text-amber-800 rounded text-[8px] font-extrabold px-1.5 uppercase font-mono">POD Required</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal">{step.description}</p>
                              {step.completed && (
                                <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  Completed {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : 'N/A Override'}
                                  {step.signatureName && ` by ${step.signatureName}`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tower controls */}
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 flex gap-2 flex-wrap justify-end text-xs">
                      <button
                        id="milestone-reset-all-btn"
                        type="button"
                        onClick={handleResetAllSteps}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <RefreshCcw className="w-2.5 h-2.5 text-red-500" /> Reset
                      </button>
                      <button
                        id="milestone-all-complete-btn"
                        type="button"
                        onClick={handleCompleteAllSteps}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-200" /> Fast-Forward All
                      </button>
                      {selectedJob.currentMilestoneIndex < selectedJob.milestones.length && (
                        <button
                          id="milestone-advance-btn"
                          type="button"
                          onClick={handleAdvanceCurrentStep}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-extrabold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Advance Step
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* Driver Swap Modal (preserved) */}
      <AnimatePresence>
        {swapJobId && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[60]">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleApplySwap}
              className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-300 shadow-2xl relative space-y-4"
            >
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

              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold block">Select Active Driver *</label>
                  <select
                    id="swap-driver-select"
                    value={swapDriverId}
                    onChange={e => {
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
                  <label className="text-slate-500 font-bold block">Assigned Transport Vehicle *</label>
                  <select
                    id="swap-vehicle-select"
                    value={swapVehicleId}
                    onChange={e => setSwapVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Heavy Vehicle --</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} ({v.type} Owner: {v.ownerType})</option>
                    ))}
                  </select>
                </div>
              </div>

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
      </AnimatePresence>
    </div>
  );
}
