import React, { useState, useMemo } from 'react';
import { Job, Driver, Vehicle, Customer, Region, SurchargeRule, User } from '../types';
import { CalendarDays, Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Truck, Users, Filter, XCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GanttChartProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  surcharges: SurchargeRule[];
  regions: Region[];
  currentUser: User;
  onAssignJob: (jobId: string, driverId: string, vehicleId: string, scheduledTime: string) => void;
}

export default function GanttChart({
  jobs,
  drivers,
  vehicles,
  customers,
  surcharges,
  regions,
  currentUser,
  onAssignJob
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [resourceMode, setResourceMode] = useState<'driver' | 'vehicle'>('driver');
  const [selectedBacklogJobId, setSelectedBacklogJobId] = useState<string | null>(null);
  const [conflictJob, setConflictJob] = useState<any>(null); // For conflict modal

  const backlogJobs = useMemo(() => jobs.filter(j => !j.driverId), [jobs]);

  const checkConflicts = (job: Job, driver: Driver, time: string) => {
    const today = '2026-06-11'; 
    const conflicts = [];
    
    // Check 1: License
    if (driver.licenseExpiry < today) {
      conflicts.push({ type: 'blocking', message: `Driver license expired on ${driver.licenseExpiry}` });
    }
    
    // Check 2: Port pass
    if ((job.scenario === "IMP" || job.scenario === "EXP") && driver.portPassNumber === "") {
      conflicts.push({ type: 'blocking', message: `Driver requires port pass for ${job.scenario} jobs` });
    }
    
    // Check 4: Time overlap (simplified)
    const hasOverlap = jobs.some(j => j.driverId === driver.id && j.scheduledTime === time);
    if (hasOverlap) {
      conflicts.push({ type: 'blocking', message: "Driver already has a job at this time" });
    }
    
    return conflicts;
  };

  const handleAssign = (driver: Driver, time: string) => {
    if (!selectedBacklogJobId) return;
    const job = jobs.find(j => j.id === selectedBacklogJobId);
    if (!job) return;
    
    const conflicts = checkConflicts(job, driver, time);
    const blocking = conflicts.filter(c => c.type === 'blocking');
    
    if (blocking.length > 0) {
      setConflictJob({ job, driver, conflicts });
    } else {
      onAssignJob(job.id, driver.id, driver.assignedVehicleId, time);
      setSelectedBacklogJobId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4 p-4 bg-slate-50" id="gantt-board-module">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-slate-300 rounded shadow-sm">
            <button className="p-2 hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-4 text-sm font-bold">Wednesday, 11 Jun 2026</span>
            <button className="p-2 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex border border-slate-300 rounded overflow-hidden">
            <button onClick={() => setViewMode('day')} className={`px-4 py-2 text-sm font-bold ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Day</button>
            <button onClick={() => setViewMode('week')} className={`px-4 py-2 text-sm font-bold ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Week</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setResourceMode('driver')} className={`px-4 py-2 text-sm font-bold rounded ${resourceMode === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>Drivers</button>
           <button onClick={() => setResourceMode('vehicle')} className={`px-4 py-2 text-sm font-bold rounded ${resourceMode === 'vehicle' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>Vehicles</button>
        </div>
      </div>

      {/* Gantt Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-auto">
        <div className="min-w-[1000px]">
          {/* Timeline Grid header */}
          <div className="flex border-b border-slate-200">
            <div className="w-[180px] p-4 text-xs font-bold text-slate-500 uppercase">Resources</div>
            <div className="flex-1 grid grid-cols-24">
              {Array.from({length: 24}).map((_, i) => (
                <div key={i} className="text-center text-[10px] py-2 border-r last:border-r-0 text-slate-400 font-mono">{String(i).padStart(2, '0')}</div>
              ))}
            </div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-200">
            {drivers.map((drv) => {
              const vehObj = vehicles.find(v => v.id === drv.assignedVehicleId);
              return (
                <div key={drv.id} className="grid grid-cols-[180px_1fr] items-center py-2 h-14">
                  <div className="border-r border-slate-200 pl-4">
                    <div className="text-xs font-bold">{drv.name}</div>
                    <div className="text-[10px] text-slate-500">{vehObj?.plateNumber || 'No vehicle'}</div>
                  </div>
                  <div className="grid grid-cols-24 h-full">
                    {Array.from({length: 24}).map((_, hour) => (
                      <div 
                        key={hour} 
                        className="border-r last:border-r-0 border-slate-100 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleAssign(drv, `2026-06-11 ${String(hour).padStart(2, '0')}:00`)}
                      >
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backlog Section */}
      <div className="h-1/3 bg-white border border-slate-200 rounded-lg shadow-sm p-4 overflow-x-auto">
        <div className="text-sm font-bold mb-4">Unassigned Jobs ({backlogJobs.length})</div>
        <div className="flex gap-4">
          {backlogJobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => setSelectedBacklogJobId(job.id)}
              className={`w-64 p-3 rounded-lg border cursor-pointer ${selectedBacklogJobId === job.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
            >
              <div className="font-bold text-sm">{job.jobNo}</div>
              <div className="text-xs text-slate-500">{job.scenario}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
