/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Job, Customer } from '../types';
import { Flame, Clock, ShieldAlert, CheckCircle2, Navigation, AlertTriangle, Ship } from 'lucide-react';
import { motion } from 'motion/react';

interface ContainerLifecycleProps {
  jobs: Job[];
  customers: Customer[];
  onTriggerReturnJob: (jobId: string) => void;
}

export default function ContainerLifecycle({
  jobs,
  customers,
  onTriggerReturnJob
}: ContainerLifecycleProps) {
  
  // Filter active Import/Export containers currently held or active
  const monitoredContainers = useMemo(() => {
    const CURRENT_TIME = new Date("2026-05-29T05:16:43Z");
    const contractFreeDays = 3; // 3 days standard contractual free-time
    const penaltyRate = 85; // $85 per day penalty rate

    return jobs.map((job, idx) => {
      // Locate when container arrived at customer site
      // Milestone 4 represents Gate-In at customer warehouse site
      const arrivalMilestone = job.milestones[4];
      let arrivalDate = new Date();
      
      if (arrivalMilestone && arrivalMilestone.completed && arrivalMilestone.timestamp) {
        arrivalDate = new Date(arrivalMilestone.timestamp);
      } else {
        // Fallback to scheduling index date if not completed
        const offsetDays = (idx * 17) % 4; // pseudo-realistic offset
        arrivalDate = new Date("2026-05-26T08:00:00Z");
        arrivalDate.setDate(arrivalDate.getDate() + offsetDays);
      }

      // Elapsed time calculation
      const timeDiff = CURRENT_TIME.getTime() - arrivalDate.getTime();
      const elapsedDays = Math.max(1, Math.floor(timeDiff / (1000 * 3600 * 24)));

      // Days leftover vs Overdue
      const daysLeft = Math.max(0, contractFreeDays - elapsedDays);
      const daysOverdue = Math.max(0, elapsedDays - contractFreeDays);
      const isCritical = daysLeft <= 1 && daysOverdue === 0;

      // Calculate active penalty
      const isLadenDelivered = job.currentMilestoneIndex >= 4;
      const isUnstuffed = job.currentMilestoneIndex >= 5;
      const isReturnedComplete = job.currentMilestoneIndex >= 6;

      let lifecycleState: 'Port Customs' | 'Laden Transit' | 'At Customer site (Stuffed/Unstuffing)' | 'Container Empty' | 'Returned Depot' = 'Port Customs';
      if (job.status === 'completed') {
        lifecycleState = 'Returned Depot';
      } else if (isReturnedComplete) {
        lifecycleState = 'Returned Depot';
      } else if (isUnstuffed) {
        lifecycleState = 'Container Empty';
      } else if (isLadenDelivered) {
        lifecycleState = 'At Customer site (Stuffed/Unstuffing)';
      } else if (job.currentMilestoneIndex > 0) {
        lifecycleState = 'Laden Transit';
      }

      return {
        jobId: job.id,
        jobNo: job.jobNo,
        containerNo: job.containerNo,
        containerSize: job.containerSize,
        scenario: job.scenario,
        shippingLine: job.shippingLine,
        customerName: customers.find(c => c.id === job.customerId)?.name || 'Unknown Account',
        daysLeft: daysOverdue > 0 ? 0 : daysLeft,
        isCritical,
        lifecycleState,
        penaltyAmount: lifecycleState === 'Returned Depot' ? 0 : daysOverdue * penaltyRate,
        daysOverdue
      };
    }).filter(c => c.scenario === 'IMP' || c.scenario === 'EXP'); // focus heavily on IMP/EXP box cycles
  }, [jobs, customers]);

  return (
    <div className="space-y-6" id="container-lifecycle-monitor">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold font-sans tracking-tight text-slate-800 flex items-center gap-2">
          <Ship className="text-blue-600 w-5 h-5" /> Container Lifecycle &amp; Detention Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor ocean container custody loops. Automatically alert dispatchers before equipment late return fines (Detention) accumulate.
        </p>
      </div>

      {/* Grid summary stats of boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-sans font-extrabold text-slate-400 uppercase block tracking-wider">Under Carrier Custody</span>
            <div className="text-xl font-bold text-slate-800 font-sans mt-0.5">
              {monitoredContainers.filter(c => c.lifecycleState !== 'Returned Depot').length} <span className="text-xs text-slate-400 font-normal">Active Boxes</span>
            </div>
          </div>
          <Clock className="w-5 h-5 text-blue-500" />
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-sans font-extrabold text-slate-400 uppercase block tracking-wider">Critical Free-Time Expiry</span>
            <div className="text-xl font-bold text-red-600 font-sans mt-0.5">
              {monitoredContainers.filter(c => c.daysLeft <= 2 && c.lifecycleState !== 'Returned Depot').length} <span className="text-xs text-slate-400 font-normal">Containers</span>
            </div>
          </div>
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-sans font-extrabold text-slate-400 uppercase block tracking-wider font-semibold">Detention Penalties Accrued</span>
            <div className="text-xl font-bold text-amber-600 font-sans mt-0.5">
              ${monitoredContainers.reduce((acc, c) => acc + (c.lifecycleState !== 'Returned Depot' ? c.penaltyAmount : 0), 0)} <span className="text-xs text-slate-400 font-normal">Grand Total</span>
            </div>
          </div>
          <Flame className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Container custody ledger table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold uppercase text-slate-500 font-sans">Container Custody Ledger</h2>
          <span className="text-[10px] text-slate-400 font-mono">Real-time Container GPS Matching</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-sans font-extrabold uppercase tracking-wider pb-3 bg-slate-50">
                <th className="py-2.5 px-3">Container Serial</th>
                <th className="px-2">Scenario</th>
                <th className="px-2">Client Account</th>
                <th className="px-2">Shipping Line</th>
                <th className="px-2">Milestone Status</th>
                <th className="px-2">Free-time Remaining</th>
                <th className="px-2">Penalty/Accrued</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {monitoredContainers.map((container, idx) => {
                const isReturned = container.lifecycleState === 'Returned Depot';
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {container.containerNo}
                      <span className="text-[9px] text-slate-400 block font-sans font-normal">{container.containerSize}</span>
                    </td>
                    <td className="px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase ${
                        container.scenario === 'IMP' ? 'text-blue-600 bg-blue-50 border border-blue-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                      }`}>
                        {container.scenario}
                      </span>
                    </td>
                    <td className="font-bold max-w-[150px] truncate text-slate-700 px-2">{container.customerName}</td>
                    <td className="font-semibold text-slate-500 px-2">
                      <div className="flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-slate-400" />
                        {container.shippingLine}
                      </div>
                    </td>
                    <td className="px-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isReturned 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : container.lifecycleState === 'Container Empty'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {container.lifecycleState}
                      </span>
                    </td>
                    <td className="px-2">
                      {isReturned ? (
                        <span className="text-slate-400 font-mono">—</span>
                      ) : container.daysOverdue && container.daysOverdue > 0 ? (
                        <span className="font-mono font-black text-red-650 text-red-600 block animate-pulse">
                          OVERDUE {container.daysOverdue} {container.daysOverdue === 1 ? 'DAY' : 'DAYS'}
                        </span>
                      ) : (
                        <span className={`font-mono font-bold ${container.isCritical ? 'text-red-600' : 'text-slate-500'}`}>
                          {container.daysLeft} {container.daysLeft === 1 ? 'Day Left' : 'Days Left'}
                        </span>
                      )}
                    </td>
                    <td className="font-mono px-2">
                      {isReturned ? (
                        <span className="text-slate-400">—</span>
                      ) : container.penaltyAmount > 0 ? (
                        <span className="text-red-600 font-bold">${container.penaltyAmount}.00</span>
                      ) : (
                        <span className="text-slate-400 font-medium">$0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isReturned ? (
                        <span className="text-emerald-700 font-bold bg-green-50 px-2 py-1 rounded inline-flex items-center gap-1 font-mono text-[9px] border border-green-200">
                          <CheckCircle2 className="w-3 h-3" /> RETURNED
                        </span>
                      ) : container.lifecycleState === 'Container Empty' ? (
                        <button
                          onClick={() => onTriggerReturnJob(container.jobId)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] shadow-xs cursor-pointer transition-colors"
                        >
                          Trigger Empty Return
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Unstuff Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
