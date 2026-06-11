import React, { useMemo, useState } from 'react';
import { Job, Customer } from '../types';
import { Flame, Clock, ShieldAlert, CheckCircle2, Navigation, AlertTriangle, Ship, ChevronRight, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContainerLifecycleProps {
  jobs: Job[];
  customers: Customer[];
  onTriggerReturnJob: (jobId: string) => void;
  onUpdateJob: (job: Job) => void;
}

export default function ContainerLifecycle({
  jobs,
  customers,
  onTriggerReturnJob,
  onUpdateJob
}: ContainerLifecycleProps) {
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

  const selectedContainer = useMemo(() => 
    selectedContainerId ? jobs.find(j => j.id === selectedContainerId) : null,
  [selectedContainerId, jobs]);

  const monitoredContainers = useMemo(() => {
    // Current time fixed for mockup
    const CURRENT_TIME = new Date("2026-05-29T05:16:43Z");
    
    return jobs.filter(j => j.scenario === 'IMP' || j.scenario === 'EXP').map((job) => {
      // Calculate days Left and overdue days based on gateOutTimestamp and freeTimeDays
      let daysLeft = 0;
      let daysOverdue = 0;
      let status: 'On Time' | 'Due Today' | 'Warning' | 'Overdue' | 'Returned' | 'Disputed' = 'On Time';
      
      if (job.status === 'completed') {
          status = 'Returned';
      } else if (job.freeTimeExpiry) {
          const expiryDate = new Date(job.freeTimeExpiry);
          const diff = expiryDate.getTime() - CURRENT_TIME.getTime();
          const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
          
          if (diffDays < 0) {
              daysOverdue = Math.abs(diffDays);
              status = 'Overdue';
          } else if (diffDays === 0) {
              status = 'Due Today';
          } else if (diffDays <= 3) {
              status = 'Warning';
          }
          daysLeft = Math.max(0, diffDays);
      }

      return { ...job, daysLeft, daysOverdue, status };
    });
  }, [jobs]);

  return (
    <div className="flex h-full w-full bg-slate-50 relative overflow-hidden" id="container-lifecycle-monitor">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900">Container & Demurrage Monitor</h1>
            <p className="text-sm text-slate-500">Track container detention exposure and manage demurrage liability.</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm font-semibold">
              ₹{monitoredContainers.reduce((acc, c) => acc + (c.detentionChargeAmount || 0), 0).toLocaleString()} at risk
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-4 gap-4">
            {[
                { label: 'Overdue', value: monitoredContainers.filter(j => j.status === 'Overdue').length, color: 'text-red-600' },
                { label: 'Due Today', value: monitoredContainers.filter(j => j.status === 'Due Today').length, color: 'text-orange-600' },
                { label: 'Due in 3 Days', value: monitoredContainers.filter(j => j.status === 'Warning').length, color: 'text-amber-600' },
                { label: 'Accrued This Month', value: `₹${monitoredContainers.reduce((acc, j) => acc + (j.detentionChargeAmount || 0), 0)/1000}k`, color: 'text-slate-800' }
            ].map(stat => (
                <div key={stat.label} className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 uppercase block">{stat.label}</span>
                    <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
            ))}
        </div>

        {/* Main Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                <th className="py-3 px-4">Container</th>
                <th className="py-3 px-2">Line</th>
                <th className="py-3 px-2">Customer</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Expiry</th>
                <th className="py-3 px-2">Liability</th>
                <th className="py-3 px-2">Amt</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monitoredContainers.map(job => (
                <tr key={job.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedContainerId(job.id)}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{job.containerNo}</td>
                    <td className="py-3 px-2 text-slate-600">{job.shippingLine}</td>
                    <td className="py-3 px-2 text-slate-600 truncate max-w-[120px]">{customers.find(c => c.id === job.customerId)?.name}</td>
                    <td className="py-3 px-2"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${job.status === 'Overdue' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{job.status}</span></td>
                    <td className={`py-3 px-2 font-mono font-bold ${job.status === 'Overdue' ? 'text-red-600' : 'text-slate-600'}`}>{job.freeTimeExpiry ? new Date(job.freeTimeExpiry).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-2">
                        <select 
                            className="text-[10px] bg-transparent border-none outline-none font-bold text-slate-700 uppercase"
                            value={job.detentionLiability || ''}
                            onChange={(e) => onUpdateJob({...job, detentionLiability: e.target.value as any})}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="">-</option>
                            <option value="customer">Customer</option>
                            <option value="company">Company</option>
                            <option value="disputed">Disputed</option>
                        </select>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-red-600">{job.detentionChargeAmount ? `₹${job.detentionChargeAmount}` : '-'}</td>
                    <td className="py-3 px-3 text-right">
                        <button className="text-slate-400 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); setSelectedContainerId(job.id);}}><ChevronRight className="w-4 h-4"/></button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedContainer && (
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="w-[360px] bg-white border-l border-slate-200 shadow-xl p-6 overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-lg text-slate-900">Container Details</h2>
                    <button onClick={() => setSelectedContainerId(null)}><X className="w-5 h-5"/></button>
                </div>
                <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded border border-slate-100">
                        <div className="text-xs text-slate-500">Container No</div>
                        <div className="font-mono font-bold text-slate-900">{selectedContainer.containerNo}</div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="font-bold text-sm text-slate-900">Timeline</div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Gate Out</span>
                            <span className="font-semibold">{selectedContainer.gateOutTimestamp ? new Date(selectedContainer.gateOutTimestamp).toLocaleDateString() : '-'}</span>
                          </div>
                           <div className="flex justify-between">
                            <span className="text-slate-500">Free Time Expiry</span>
                            <span className="font-semibold">{selectedContainer.freeTimeExpiry ? new Date(selectedContainer.freeTimeExpiry).toLocaleDateString() : '-'}</span>
                          </div>
                        </div>
                    </div>

                    {selectedContainer.status === 'Overdue' && (
                      <div className="p-3 bg-red-50 rounded border border-red-200 text-red-800">
                          <div className="font-bold text-xs">Overdue</div>
                          <div className="text-sm">Days Overdue: {selectedContainer.daysOverdue}</div>
                          <div className="font-bold text-lg">Penalty: ₹{selectedContainer.detentionChargeAmount}</div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="font-bold text-sm text-slate-900">Detention Notes</label>
                      <textarea 
                        className="w-full h-24 p-2 text-sm border border-slate-200 rounded" 
                        value={selectedContainer.detentionNotes || ''} 
                        onChange={(e) => onUpdateJob({...selectedContainer, detentionNotes: e.target.value})}
                      />
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
