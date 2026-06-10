/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Job, Customer, Driver, Vehicle, SurchargeRule, Quotation } from '../types';
import { 
  DollarSign, 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  Layers, 
  CheckCircle2, 
  Ship, 
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

interface OverviewDashboardProps {
  jobs: Job[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  quotations: Quotation[];
  onNavigate: (tab: string) => void;
}

export default function OverviewDashboard({
  jobs,
  customers,
  drivers,
  vehicles,
  quotations,
  onNavigate
}: OverviewDashboardProps) {

  // Total calculated revenue from quotations + extra surcharges
  const stats = useMemo(() => {
    let revenue = 0;
    let completedCount = 0;
    let activeCount = 0;
    let pendingCount = 0;
    
    jobs.forEach(job => {
      // Look up actual quotation rates
      const quote = quotations?.find(q => q.id === job.quotationId);
      const rateLine = quote?.rates.find(r => r.id === job.rateItemId);
      let jobRev = rateLine ? rateLine.baseRate : (job.scenario === 'IMP' ? 520 : job.scenario === 'EXP' ? 400 : 300);
      
      // Add extra surcharges
      job.extraSurchargesIncurred.forEach(s => {
        revenue += s.amount;
      });
      
      revenue += jobRev;
      
      if (job.status === 'completed') completedCount++;
      else if (job.status === 'active') activeCount++;
      else if (job.status === 'pending' || job.status === 'scheduled') pendingCount++;
    });

    const activeDrivers = drivers.filter(d => d.currentStatus !== 'idle').length;
    const fleetUtil = vehicles.length > 0 ? (activeDrivers / vehicles.length) * 100 : 0;

    return {
      totalRevenue: revenue,
      completedCount,
      activeCount,
      pendingCount,
      fleetUtilization: Math.round(fleetUtil),
      activeDrivers
    };
  }, [jobs, drivers, vehicles]);

  // Grouped by scenario type for the charts
  const scenarioCounts = useMemo(() => {
    const counts: Record<string, number> = { IMP: 0, EXP: 0, Inland: 0, EMTY: 0, RETURN: 0 };
    jobs.forEach(j => {
      if (counts[j.scenario] !== undefined) {
        counts[j.scenario]++;
      }
    });
    return counts;
  }, [jobs]);

  const maxScenarioCount = Math.max(...(Object.values(scenarioCounts) as number[]), 1);

  // Demurrage warning list (any IMP jobs with yellow warnings remaining)
  const demurrageWarnings = useMemo(() => {
    return jobs.filter(j => j.scenario === 'IMP' && j.status !== 'completed').map(j => {
      const daysLeft = Math.floor(Math.random() * 3) + 1; // Simulated countdown of return window
      return {
        id: j.id,
        containerNo: j.containerNo,
        daysLeft,
        customerName: customers.find(c => c.id === j.customerId)?.name || 'Unknown Client',
        shippingLine: j.shippingLine
      };
    }).sort((a,b) => a.daysLeft - b.daysLeft);
  }, [jobs, customers]);

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-container">
      {/* Dynamic Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight uppercase">
            Operations Control Tower
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time fleet operations, container flow status, and commercial revenue logs.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-3 py-1.5 rounded text-blue-600 shadow-sm font-semibold">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>UTC SERVER LIVE: 2026-05-25 06:54</span>
        </div>
      </div>

      {/* Grid Statistics Cards - Premium Visual Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <motion.div 
          className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
          whileHover={{ y: -2 }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turnover Income</span>
            <div className="text-2xl font-black text-slate-800 font-sans">
              ${stats.totalRevenue.toLocaleString()}.00
            </div>
            <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14.2% since 08:00
            </span>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 2: Active Shipments */}
        <motion.div 
          className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
          whileHover={{ y: -2 }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In-transit Containers</span>
            <div className="text-2xl font-black text-slate-800 font-sans">
              {stats.activeCount} <span className="text-xs text-slate-400 font-normal">/ {jobs.length} units</span>
            </div>
            <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" /> {stats.pendingCount} queued for allocation
            </span>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 3: Fleet Utilization */}
        <motion.div 
          className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
          whileHover={{ y: -2 }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Haulier Utilization</span>
            <div className="text-2xl font-black text-slate-800 font-sans">
              {stats.fleetUtilization}%
            </div>
            <span className="text-[11px] text-blue-605 font-bold">
              {stats.activeDrivers} of {vehicles.length} prime movers active
            </span>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-600">
            <Truck className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 4: Demurrage Warnings */}
        <motion.div 
          className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
          whileHover={{ y: -2 }}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fines Risks</span>
            <div className="text-2xl font-black text-red-650 font-sans">
              {demurrageWarnings.filter(w => w.daysLeft <= 2).length} <span className="text-xs text-slate-400 font-normal">alerts</span>
            </div>
            <span className="text-[11px] text-red-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Potential detention penalty
            </span>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 rounded text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Main Grid Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Middle Content Area: Live Ops Monitor */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Job Feed */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Active Freight Movements</h2>
              </div>
              <button 
                onClick={() => onNavigate('booking')}
                className="text-xs text-blue-600 hover:text-blue-700 transition font-bold flex items-center gap-1"
              >
                Go to Job Center <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Job Ref</th>
                    <th className="px-2">Customer</th>
                    <th className="px-2">Scenario</th>
                    <th className="px-2">Container & Size</th>
                    <th className="px-2">Driver & Prime Mover</th>
                    <th className="px-2">Milestone Progress</th>
                    <th className="px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {jobs.map((job) => {
                    const custName = customers.find(c => c.id === job.customerId)?.name || 'Loading...';
                    const driverObj = drivers.find(d => d.id === job.driverId);
                    const vehicleObj = vehicles.find(v => v.id === job.vehicleId);
                    
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-3 font-bold text-blue-600">{job.jobNo}</td>
                        <td className="font-semibold max-w-[140px] truncate text-slate-800 px-2">{custName}</td>
                        <td className="px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold tracking-tight ${
                            job.scenario === 'IMP' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            job.scenario === 'EXP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            job.scenario === 'Inland' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {job.scenario}
                          </span>
                        </td>
                        <td className="font-sans px-2">
                          <div className="font-bold text-slate-800">{job.containerNo || 'UNASSIGNED'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{job.containerSize} • {job.weightKg} KG</div>
                        </td>
                        <td className="px-2">
                          {driverObj ? (
                            <div>
                              <div className="font-sans font-semibold text-slate-800">{driverObj.name}</div>
                              <div className="font-mono text-[10px] text-slate-405">{vehicleObj?.plateNumber}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono italic">Needs Assignment</span>
                          )}
                        </td>
                        <td className="px-2">
                          <div className="space-y-1 pr-4">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Step {job.currentMilestoneIndex + 1}/{job.milestones.length}</span>
                              <span className="font-bold">{Math.round(((job.currentMilestoneIndex) / (job.milestones.length - 1)) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${((job.currentMilestoneIndex) / (job.milestones.length - 1)) * 100}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
                              {job.milestones[job.currentMilestoneIndex]?.label}
                            </div>
                          </div>
                        </td>
                        <td className="px-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'active' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                            job.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                            job.status === 'scheduled' ? 'bg-indigo-500 border border-indigo-150' :
                            'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              job.status === 'active' ? 'bg-teal-500 animate-pulse' :
                              job.status === 'completed' ? 'bg-green-500' :
                              job.status === 'scheduled' ? 'bg-indigo-500' :
                              'bg-slate-400'
                            }`} />
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphical Split of Scenarios (High Quality Interactive SVG-based Bar Chart) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Volume distribution by Scenario</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Aggregate Count</span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="space-y-4">
              {Object.entries(scenarioCounts).map(([scenario, count]) => {
                const percentage = ((count as number) / maxScenarioCount) * 100;
                let colorClass = 'bg-blue-600';
                let desc = '';
                
                if (scenario === 'IMP') {
                  colorClass = 'bg-blue-500';
                  desc = 'Import (Port ➔ Customer ➔ Return Depot)';
                } else if (scenario === 'EXP') {
                  colorClass = 'bg-emerald-500';
                  desc = 'Export (Depot Empty ➔ Customer ➔ Export Port)';
                } else if (scenario === 'Inland') {
                  colorClass = 'bg-indigo-500';
                  desc = 'Inland Cargo (Point-to-Point Container Haul)';
                } else if (scenario === 'EMTY') {
                  colorClass = 'bg-slate-400';
                  desc = 'Empty Repositioning (Inter-yard transfer)';
                } else if (scenario === 'RETURN') {
                  colorClass = 'bg-amber-600';
                  desc = 'Empty Return to Shipping Line custodians';
                }

                return (
                  <div key={scenario} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-16 font-sans font-bold text-slate-700">{scenario}</span>
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">{desc}</span>
                      </div>
                      <span className="font-sans font-bold text-slate-800">{count} {count === 1 ? 'Job' : 'Jobs'}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-md overflow-hidden border border-slate-100">
                      <motion.div 
                        className={`h-full ${colorClass} rounded-md`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Alerts, Detention Countdown & Operational Feed */}
        <div className="lg:col-span-4 space-y-6">

          {/* Demurrage detention warnings */}
          <div className="bg-white border border-red-100 shadow-sm rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
              <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Fine-Risk Container Alerts</h2>
            </div>

            {demurrageWarnings.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 font-mono">
                No active containers at risk of detention.
              </div>
            ) : (
              <div className="space-y-3">
                {demurrageWarnings.map((w) => (
                  <div 
                    key={w.id} 
                    className={`p-3 rounded-lg border text-xs flex flex-col justify-between gap-1.5 ${
                      w.daysLeft === 1 
                        ? 'bg-rose-50/50 border-rose-100 text-slate-800' 
                        : 'bg-amber-50/50 border-amber-100 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-sans font-bold tracking-wider text-slate-800">{w.containerNo}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                        w.daysLeft === 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {w.daysLeft} {w.daysLeft === 1 ? 'DAY LEFT' : 'DAYS LEFT'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans truncate">
                      {w.customerName}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-1.5 mt-0.5">
                      <span>CUSTODIAN:</span>
                      <span className="text-slate-600 font-bold">{w.shippingLine}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Control Room Live Telemetry Connection Status (Unsolicited metadata removed / simplified for real aesthetics) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Terminal Connections</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-700 font-sans">HZP-T1 (Port Center)</div>
                  <div className="text-slate-400 text-[10px]">Gate Operations: Active</div>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                  ONLINE
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-700 font-sans">HZP-T2 (South Gate)</div>
                  <div className="text-slate-400 text-[10px]">Gate Congestion: High</div>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                  35M WAIT
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-700 font-sans">Apex Central (APX-DEP)</div>
                  <div className="text-slate-400 text-[10px]">Skeletal Chassis: 12 Available</div>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                  BALANCED
                </span>
              </div>
            </div>
          </div>

          {/* Dispatch Shift Notice Board */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Shift Directives</h2>
            </div>
            <div className="text-xs text-slate-600 space-y-3 font-sans">
              <p className="border-l-2 border-blue-600 pl-2.5 leading-relaxed">
                <strong>Triangulation Optimization:</strong> Always check Live Tracking Map when Bob or other drivers return empty. Click "Insert Return task" to utilize empty chassis back-hauls.
              </p>
              <p className="border-l-2 border-slate-400 pl-2.5 leading-relaxed">
                <strong>Vessel Aligned Release Codes:</strong> Confirm ROT release codes prior to driver gate arrival at Terminal 1.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
