/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Job, Driver, Vehicle, Customer } from '../types';
import { Calendar, User, Eye, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GanttChartProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  onAssignJob: (jobId: string, driverId: string, vehicleId: string, scheduledTime: string) => void;
}

export default function GanttChart({
  jobs,
  drivers,
  vehicles,
  customers,
  onAssignJob
}: GanttChartProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [allocationHoverState, setAllocationHoverState] = useState<string | null>(null); // track driverId hover

  // Filter unassigned jobs (no driverId assigned yet)
  const unassignedJobs = jobs.filter(j => !j.driverId);

  // Time grid markers (08:00 to 18:00 in 2-hour slots)
  const timeBlocks = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

  // Calculate coordinates or check if driver has assigned job during specific block
  const getJobForDriverInBlock = (driverId: string, blockIndex: number) => {
    // Return job if scheduled and matches
    return jobs.find(j => {
      if (j.driverId !== driverId) return false;
      
      // Rough mapping: Bob is at 08:00 - 12:00 (blockIndex 0 and 1)
      if (j.jobNo === 'JB-2026-1001') {
        return blockIndex === 0 || blockIndex === 1 || blockIndex === 2;
      }
      
      // Alice is at 13:30 (blockIndex 3 and 4)
      if (j.jobNo === 'JB-2026-1002') {
        return blockIndex === 3 || blockIndex === 4;
      }

      // Any newly assigned jobs map to 11:00-15:00 or arbitrary index
      if (j.scheduledTime) {
        // Simple mapping: let's map index based on job id hash
        const hash = j.id.charCodeAt(j.id.length - 1) % 4;
        return blockIndex === (hash + 1) || blockIndex === (hash + 2);
      }
      
      return false;
    });
  };

  const handleAssignActive = (driverObj: Driver) => {
    if (!selectedJobId) return;

    const matchedVeh = vehicles.find(v => v.id === driverObj.assignedVehicleId);
    if (!matchedVeh) {
      alert('Cannot schedule: Driver has no default prime mover vehicle assigned!');
      return;
    }

    // Safety checks: check license expire and cargo vehicle mismatch conflicts
    const activeJob = jobs.find(j => j.id === selectedJobId);
    if (activeJob) {
      const currentDate = new Date('2026-05-29'); // Align with active simulated current timestamp
      const licenseExp = new Date(driverObj.licenseExpiry);
      
      if (licenseExp < currentDate) {
        alert(`SAFETY COMPLIANCE VIOLATION:\nDriver ${driverObj.name}'s professional heavy carrier license expired on ${driverObj.licenseExpiry}! Scheduling is blocked.`);
        return;
      }

      // Check for vehicle axle stability type mismatch on heavy container sizes
      const isHeavyFreight = activeJob.weightKg > 22000;
      const isLightTractor = matchedVeh.type.toLowerCase().includes('2-axle') || matchedVeh.type.toLowerCase().includes('light');

      if (isHeavyFreight && isLightTractor) {
        alert(`FLEET CONFLICT ALERT:\nCargo weight (${activeJob.weightKg.toLocaleString()} KG) exceeds safety ratings for standard lighter-duty vehicles. Assigned Prime Mover (${matchedVeh.plateNumber} - ${matchedVeh.type}) cannot pull this container load. Switch driver to a high-capacity 3-Axle prime mover.`);
        return;
      }
    }

    if (matchedVeh.maintenanceAlert) {
      const proceeds = confirm(`MAINTENANCE WARNING: Prime Mover ${matchedVeh.plateNumber} has an outstanding service check alert. Do you still wish to dispatch?`);
      if (!proceeds) return;
    }

    const blockTime = '2026-05-25 10:00'; // Default assigned block
    onAssignJob(selectedJobId, driverObj.id, matchedVeh.id, blockTime);
    setSelectedJobId(null);
  };

  return (
    <div className="space-y-6" id="gantt-board-module">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600 w-5 h-5" /> Operations Scheduling (Interactive Gantt)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Drag-allocating chassis trailer lines to drivers. System enforces safety verifications and license expiration constraints automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Backlog of Unassigned Container Jobs */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
                Outstanding Backlog Queue ({unassignedJobs.length})
              </span>
              <span className="text-[10px] text-slate-400 font-sans font-medium">Select to Allocate</span>
            </div>

            {unassignedJobs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 font-sans italic">
                Pristine Backlog! All active shipping legs are assigned. Book a new job to schedule.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {unassignedJobs.map((j) => {
                  const custObj = customers.find(c => c.id === j.customerId);
                  const isSelected = selectedJobId === j.id;
                  
                  return (
                    <div 
                      key={j.id}
                      onClick={() => setSelectedJobId(isSelected ? null : j.id)}
                      className={`p-3.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-400 shadow-xs text-blue-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono font-bold text-blue-600 text-[11px]">{j.jobNo}</span>
                        <span className={`px-1.5 py-0.2 rounded font-sans text-[9px] font-bold border ${
                          j.scenario === 'IMP' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {j.scenario}
                        </span>
                      </div>

                      <div className="font-bold text-slate-805 truncate">{custObj?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Size: {j.containerSize} • {j.weightKg.toLocaleString()} KG
                      </div>
                      
                      {isSelected && (
                        <div className="mt-3 pt-2.5 border-t border-blue-200 text-[10px] text-blue-600 font-sans flex items-center gap-1 animate-pulse font-bold">
                          <UserCheck className="w-3.5 h-3.5" /> Click any driver row to assign!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-400 font-sans leading-relaxed">
            <span className="font-bold text-slate-700 block mb-1">Safety Lock Mechanism:</span>
            Unallocated containers must possess an active approved ROT before driver logistics dispatching can occur.
          </div>
        </div>

        {/* Right Hand: Visual timeline Gantt board */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-lg space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans flex items-center gap-1.5">
              Interactive Dispatch Board
            </h2>
            <div className="flex gap-4 text-[10px] font-sans text-slate-400 font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-1 px-1 bg-sky-200 rounded" /> IMP Job</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-1 px-1 bg-emerald-200 rounded" /> EXP Job</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-1 px-1 bg-slate-100 border border-slate-200 rounded" /> Idle</span>
            </div>
          </div>

          {/* Time block layout table */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px] border border-slate-200 rounded-lg overflow-hidden bg-white">
              
              {/* Header Time block */}
              <div className="grid grid-cols-12 bg-slate-50 font-sans text-[10px] text-slate-500 font-bold text-center py-2 border-b border-slate-200">
                <div className="col-span-3 text-left pl-4 border-r border-slate-200">Resources (Active Fleet)</div>
                {timeBlocks.map((blk) => (
                  <div key={blk} className="col-span-1.5 border-r border-slate-200/60 last:border-r-0 font-mono">
                    {blk}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-200">
                {drivers.map((drv) => {
                  const vehObj = vehicles.find(v => v.id === drv.assignedVehicleId);
                  const hovered = selectedJobId && allocationHoverState === drv.id;
                  
                  // Check if driver has impending expiration
                  const now = new Date('2026-05-25');
                  const expDate = new Date(drv.licenseExpiry);
                  const isExpiring = expDate < now;

                  return (
                    <div 
                      key={drv.id}
                      onMouseEnter={() => selectedJobId && setAllocationHoverState(drv.id)}
                      onMouseLeave={() => setAllocationHoverState(null)}
                      onClick={() => handleAssignActive(drv)}
                      className={`grid grid-cols-12 items-center py-3.5 transition-all text-xs cursor-pointer ${
                        hovered 
                          ? 'bg-blue-50/70' 
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Left row resource details */}
                      <div className="col-span-3 border-r border-slate-200 pl-4 pr-2 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center justify-between pr-2 whitespace-nowrap">
                          <span className="truncate">{drv.name}</span>
                          {isExpiring && (
                            <span title="Expired Driving License!" className="cursor-help"><ShieldAlert className="w-3.5 h-3.5 text-red-600" /></span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 flex items-center justify-between pr-4">
                          <span>{vehObj?.plateNumber}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-sans font-bold">{vehObj?.type}</span>
                        </div>
                      </div>

                      {/* Timeline Slots */}
                      <div className="col-span-9 grid grid-cols-6 h-10 gap-1 px-1.5 items-stretch">
                        {Array.from({ length: 6 }).map((_, blockIdx) => {
                          const activeJob = getJobForDriverInBlock(drv.id, blockIdx);
                          
                          let bgClass = 'bg-slate-50 hover:bg-slate-100/70 border border-slate-200 transition-colors';
                          let labelText = '';
                          let scenarioColor = '';
                          
                          if (hovered) {
                            bgClass = 'bg-blue-50 border border-dashed border-blue-400 text-blue-600 animate-pulse';
                            labelText = 'Assign';
                          }

                          if (activeJob) {
                            bgClass = activeJob.scenario === 'IMP' ? 'bg-sky-50 border border-sky-200' : 'bg-emerald-50 border border-emerald-200';
                            scenarioColor = activeJob.scenario === 'IMP' ? 'text-sky-700' : 'text-emerald-700';
                            labelText = activeJob.jobNo;
                          }

                          return (
                            <div 
                              key={blockIdx}
                              className={`rounded flex flex-col justify-center items-center text-[10px] relative font-mono transition-all text-center ${bgClass}`}
                            >
                              <span className={`font-bold ${scenarioColor}`}>
                                {labelText}
                              </span>
                              {activeJob && blockIdx === 1 && (
                                <span className="absolute bottom-1 right-2 text-[8px] text-slate-400 font-sans hidden sm:inline">
                                  {customers.find(c => c.id === activeJob.customerId)?.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Allocation Helper Alert */}
          {selectedJobId && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-blue-50 border border-blue-200 text-xs text-blue-800 rounded-lg flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Ready to dispatch <strong>{jobs.find(j => j.id === selectedJobId)?.jobNo}</strong>. Move your cursor over any driver's row to view trailer compatibility, and click to commit scheduling.
                </span>
              </div>
              <button
                onClick={() => setSelectedJobId(null)}
                className="text-[10px] uppercase font-mono text-slate-400 hover:text-slate-800 font-bold pl-4"
              >
                Clear
              </button>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}
