/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, Driver, Vehicle, Customer, LocationGeo, User } from '../types';
import {
  CalendarDays, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  Package, X, Plus, Truck, Clock, Users
} from 'lucide-react';

interface ScheduleBuilderProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  locations: LocationGeo[];
  currentUser: User;
  onAssignJob: (jobId: string, driverId: string, vehicleId: string, scheduledTime?: string) => void;
}

const SCENARIO_BAR_COLORS: Record<string, { bar: string; text: string }> = {
  IMP: { bar: 'bg-blue-500', text: 'text-white' },
  EXP: { bar: 'bg-emerald-500', text: 'text-white' },
  Inland: { bar: 'bg-purple-500', text: 'text-white' },
  EMTY: { bar: 'bg-slate-400', text: 'text-white' },
  RETURN: { bar: 'bg-orange-500', text: 'text-white' },
};

interface ConflictInfo {
  type: 'license' | 'port_pass' | 'time_overlap';
  message: string;
}

const GRID_START_HOUR = 5;
const GRID_HOURS = 19; // 05:00 → 24:00

function jobBarPosition(scheduledTime: string | undefined): { left: string; width: string } | null {
  if (!scheduledTime) return null;
  const d = new Date(scheduledTime);
  const startH = d.getHours() + d.getMinutes() / 60;
  if (startH < GRID_START_HOUR || startH >= GRID_START_HOUR + GRID_HOURS) return null;
  const left = ((startH - GRID_START_HOUR) / GRID_HOURS) * 100;
  const width = (4 / GRID_HOURS) * 100;
  return { left: `${Math.min(left, 95)}%`, width: `${Math.min(width, 100 - left)}%` };
}

export default function ScheduleBuilder({
  jobs, drivers, vehicles, customers, locations, currentUser, onAssignJob
}: ScheduleBuilderProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(toDateStr(tomorrow));
  const [assignJobId, setAssignJobId] = useState<string | null>(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignTime, setAssignTime] = useState('08:00');
  const [hoverJobId, setHoverJobId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  };

  const dateJobs = useMemo(() => {
    return jobs.filter(j => j.scheduledTime?.slice(0, 10) === selectedDate);
  }, [jobs, selectedDate]);

  const backlogJobs = useMemo(() => {
    return jobs.filter(j => !j.driverId && j.status !== 'completed');
  }, [jobs]);

  const liveConflicts = useMemo((): ConflictInfo[] => {
    if (!assignDriverId || !assignTime) return [];
    const conflicts: ConflictInfo[] = [];
    const driver = drivers.find(d => d.id === assignDriverId);
    if (!driver) return conflicts;

    if (new Date(driver.licenseExpiry) < new Date(selectedDate)) {
      conflicts.push({ type: 'license', message: `License expired ${driver.licenseExpiry}` });
    }

    const schedMs = new Date(`${selectedDate}T${assignTime}:00`).getTime();
    const estEnd = schedMs + 4 * 3600 * 1000;
    const overlapping = dateJobs.filter(j => {
      if (j.driverId !== assignDriverId || !j.scheduledTime) return false;
      const jStart = new Date(j.scheduledTime).getTime();
      const jEnd = jStart + 4 * 3600 * 1000;
      return schedMs < jEnd && estEnd > jStart;
    });
    if (overlapping.length > 0) {
      conflicts.push({ type: 'time_overlap', message: `Overlaps with ${overlapping[0].jobNo}` });
    }

    return conflicts;
  }, [assignDriverId, assignTime, selectedDate, dateJobs, drivers]);

  const handleAssign = () => {
    if (!assignJobId || !assignDriverId || !assignTime) return;
    const driver = drivers.find(d => d.id === assignDriverId);
    const vehicle = vehicles.find(v => v.id === driver?.assignedVehicleId);
    const scheduledTime = `${selectedDate}T${assignTime}:00`;
    onAssignJob(assignJobId, assignDriverId, vehicle?.id ?? '', scheduledTime);
    const job = jobs.find(j => j.id === assignJobId);
    showToast(`Assigned ${job?.jobNo} → ${driver?.name} at ${assignTime} ✓`);
    setAssignJobId(null);
    setAssignDriverId('');
    setAssignTime('08:00');
  };

  const assigningJob = assignJobId ? jobs.find(j => j.id === assignJobId) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" /> Schedule Builder
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="p-1.5 rounded hover:bg-slate-100 border border-slate-200">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="text-sm font-bold text-slate-800 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-400" />
          <button onClick={() => changeDate(1)} className="p-1.5 rounded hover:bg-slate-100 border border-slate-200">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
          {selectedDate === toDateStr(tomorrow) && (
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Tomorrow</span>
          )}
          {selectedDate === toDateStr(new Date()) && (
            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Today</span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {dateJobs.length} jobs scheduled · {dateJobs.filter(j => !j.driverId).length} unassigned
        </div>
      </div>

      {/* Gantt Area */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">

          {/* Time axis header */}
          <div className="flex items-center border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="w-48 shrink-0 px-4 py-2.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider border-r border-slate-200">
              Driver
            </div>
            <div className="flex-1 flex">
              {Array.from({ length: GRID_HOURS + 1 }, (_, i) => {
                const h = GRID_START_HOUR + i;
                return (
                  <div key={h} className="flex-1 text-center py-2" style={{ minWidth: `${100 / (GRID_HOURS + 1)}%` }}>
                    <span className="text-[10px] font-mono text-slate-400">{String(h % 24).padStart(2, '0')}:00</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver rows */}
          {drivers.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">No drivers configured.</div>
          ) : drivers.map((driver, idx) => {
            const driverJobs = dateJobs.filter(j => j.driverId === driver.id);
            const vehicle = vehicles.find(v => v.id === driver.assignedVehicleId);
            const hasOverlap = driverJobs.length > 1;

            return (
              <div key={driver.id} className={`flex items-stretch border-b border-slate-100 min-h-[64px] group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}>
                <div className="w-48 shrink-0 px-4 py-3 border-r border-slate-200 flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black ${
                    ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'][idx % 5]
                  }`}>
                    {driver.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{driver.name}</div>
                    <div className="text-[9px] text-slate-400 font-mono">{vehicle?.plateNumber ?? '—'}</div>
                    {hasOverlap && (
                      <div className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Overlap
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 relative py-3">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {Array.from({ length: GRID_HOURS }, (_, i) => (
                      <div key={i} className="flex-1 border-r border-slate-100" />
                    ))}
                  </div>

                  {/* Job bars */}
                  {driverJobs.map(job => {
                    const pos = jobBarPosition(job.scheduledTime);
                    if (!pos) return null;
                    const colors = SCENARIO_BAR_COLORS[job.scenario] ?? { bar: 'bg-slate-400', text: 'text-white' };
                    const cust = customers.find(c => c.id === job.customerId);
                    const isHovered = hoverJobId === job.id;

                    return (
                      <motion.div
                        key={job.id}
                        className={`absolute top-1.5 bottom-1.5 rounded cursor-pointer ${colors.bar} ${colors.text} flex items-center px-2 overflow-visible shadow-sm`}
                        style={{ left: pos.left, width: pos.width, minWidth: '60px' }}
                        whileHover={{ scaleY: 1.08 }}
                        onHoverStart={() => setHoverJobId(job.id)}
                        onHoverEnd={() => setHoverJobId(null)}
                      >
                        <div className="truncate text-[10px] font-bold leading-tight">
                          <div className="font-mono">{job.jobNo}</div>
                          <div className="opacity-80 font-normal text-[9px]">{cust?.name?.split(' ')[0]}</div>
                        </div>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 z-30 mt-1 bg-slate-900 text-white rounded-lg shadow-xl p-2.5 text-[10px] w-48 pointer-events-none"
                          >
                            <div className="font-bold font-mono">{job.jobNo}</div>
                            <div className="text-slate-300">{cust?.name}</div>
                            <div className="text-slate-300 mt-0.5">{job.containerNo} · {job.containerSize}</div>
                            <div className="text-slate-300">
                              {job.scheduledTime ? new Date(job.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              {' → '}
                              {job.scheduledTime ? new Date(new Date(job.scheduledTime).getTime() + 4 * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </div>
                            <div className={`mt-1 text-[9px] font-bold px-1 py-0.5 rounded inline-block ${
                              job.status === 'active' ? 'bg-green-600' : job.status === 'scheduled' ? 'bg-blue-600' : 'bg-slate-600'
                            }`}>{job.status}</div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}

                  {driverJobs.length === 0 && (
                    <div className="absolute inset-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-slate-300 italic">No jobs scheduled</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="shrink-0 bg-white border-t border-b border-slate-200 px-5 py-2 flex items-center gap-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend:</span>
        {Object.entries(SCENARIO_BAR_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-4 h-2.5 rounded ${c.bar}`} />
            <span className="text-[10px] text-slate-500 font-bold">{s}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-slate-400">Time overlap detected</span>
        </div>
      </div>

      {/* Backlog Dock */}
      <div className="shrink-0 bg-white border-t border-slate-200 shadow-inner">
        <div className="px-5 py-2.5 flex items-center gap-3">
          <Package className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Backlog — Unassigned Jobs ({backlogJobs.length})</span>
          <span className="text-[10px] text-slate-400">Click a card to schedule it on {selectedDate}</span>
        </div>
        <div className="px-4 pb-3">
          {backlogJobs.length === 0 ? (
            <div className="flex items-center gap-2 py-1 text-green-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> All jobs assigned — great work!
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {backlogJobs.map(job => {
                const cust = customers.find(c => c.id === job.customerId);
                const origin = locations.find(l => l.id === job.originLocationId);
                const dest = locations.find(l => l.id === job.destinationLocationId);
                const isSelected = assignJobId === job.id;

                return (
                  <motion.button
                    key={job.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setAssignJobId(isSelected ? null : job.id); setAssignDriverId(''); }}
                    className={`shrink-0 w-44 p-3 rounded-lg border-l-2 border text-left transition ${
                      isSelected
                        ? 'border-l-blue-600 border-blue-300 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-l-slate-400 border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                        job.scenario === 'IMP' ? 'bg-blue-100 text-blue-700' :
                        job.scenario === 'EXP' ? 'bg-emerald-100 text-emerald-700' :
                        job.scenario === 'Inland' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{job.scenario}</span>
                      {isSelected && <span className="text-[9px] font-bold text-blue-600">Selected</span>}
                    </div>
                    <div className="font-mono text-[10px] font-bold text-slate-800">{job.jobNo}</div>
                    <div className="text-[10px] text-slate-500 truncate">{cust?.name}</div>
                    <div className="text-[9px] font-mono text-slate-400">{job.containerNo}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{origin?.code} → {dest?.code}</div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Panel slide-up */}
      <AnimatePresence>
        {assigningJob && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-400 shadow-2xl z-50 px-6 py-4"
          >
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  Schedule: <span className="text-blue-600 font-mono">{assigningJob.jobNo}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    assigningJob.scenario === 'IMP' ? 'bg-blue-100 text-blue-700' :
                    assigningJob.scenario === 'EXP' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{assigningJob.scenario}</span>
                </h3>
                <button onClick={() => setAssignJobId(null)} className="p-1 rounded hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 items-end">
                <div className="text-xs text-slate-500 space-y-0.5">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Job Details</div>
                  <div>{customers.find(c => c.id === assigningJob.customerId)?.name}</div>
                  <div className="font-mono">{assigningJob.containerNo} · {assigningJob.containerSize}</div>
                  <div>{locations.find(l => l.id === assigningJob.originLocationId)?.code} → {locations.find(l => l.id === assigningJob.destinationLocationId)?.code}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Users className="w-3 h-3" /> Assign Driver
                  </label>
                  <select value={assignDriverId} onChange={e => setAssignDriverId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-400">
                    <option value="">Select driver...</option>
                    {drivers.map(d => {
                      const v = vehicles.find(v => v.id === d.assignedVehicleId);
                      const busy = dateJobs.filter(j => j.driverId === d.id).length;
                      return (
                        <option key={d.id} value={d.id}>
                          {d.name} — {v?.plateNumber ?? '—'} ({busy} job{busy !== 1 ? 's' : ''})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pickup Time
                  </label>
                  <input type="time" value={assignTime} onChange={e => setAssignTime(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-400" />
                </div>

                <div className="space-y-1.5">
                  {liveConflicts.length > 0 ? (
                    liveConflicts.map((c, i) => (
                      <div key={i} className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> {c.message}
                      </div>
                    ))
                  ) : assignDriverId ? (
                    <div className="flex items-center gap-1 text-[10px] text-green-700">
                      <CheckCircle2 className="w-3 h-3" /> No conflicts
                    </div>
                  ) : null}
                  <button
                    onClick={handleAssign}
                    disabled={!assignDriverId || !assignTime || liveConflicts.some(c => c.type === 'time_overlap')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition"
                  >
                    <Truck className="w-3.5 h-3.5" /> Confirm Schedule
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full shadow-xl z-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
