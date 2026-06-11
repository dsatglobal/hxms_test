import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, Driver, Vehicle, Customer, LocationGeo, Quotation, Region, User } from '../types';
import { LayoutGrid, Map, List, Zap, AlertTriangle, CheckCircle2, Clock, Truck, Users, Star, ChevronRight, ChevronDown, Plus, Filter, Search, Navigation, MapPin, Phone, RefreshCw, ArrowRight, BarChart3, CalendarDays } from 'lucide-react';

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

export default function DispatchConsole({ jobs, drivers, vehicles, customers, locations, quotations, regions, currentUser, onAssignJob, onTriggerDynamicInsertion, onLogException, onUpdateJob, onNavigate }: DispatchConsoleProps) {
  const [activeView, setActiveView] = useState<'priority' | 'map' | 'list'>('priority');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => ({
    onRoad: jobs.filter(j => j.status === 'active').length,
    unassigned: jobs.filter(j => !j.driverId).length,
    exceptions: jobs.filter(j => j.status === 'exception').length,
    idle: drivers.filter(d => !jobs.some(j => j.driverId === d.id && j.status === 'active')).length
  }), [jobs, drivers]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">Dispatch Console</h1>
            <div className="text-sm font-mono text-slate-500">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{currentUser.regionId}</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveView('priority')} className={`flex items-center gap-2 px-4 py-2 rounded ${activeView === 'priority' ? 'bg-white shadow' : ''}`}><LayoutGrid className="w-4 h-4" />Priority</button>
            <button onClick={() => setActiveView('map')} className={`flex items-center gap-2 px-4 py-2 rounded ${activeView === 'map' ? 'bg-white shadow' : ''}`}><Map className="w-4 h-4" />Map</button>
            <button onClick={() => setActiveView('list')} className={`flex items-center gap-4 px-4 py-2 rounded ${activeView === 'list' ? 'bg-white shadow' : ''}`}><List className="w-4 h-4" />List</button>
        </div>
        <div className="flex gap-2">
            <div className="text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded">🟢 {stats.onRoad} On Road</div>
            <div className="text-xs font-bold text-amber-600 px-2 py-1 bg-amber-50 rounded">🟡 {stats.unassigned} Unassigned</div>
            <div className="text-xs font-bold text-red-600 px-2 py-1 bg-red-50 rounded">🔴 {stats.exceptions} Exceptions</div>
            <div className="text-xs font-bold text-slate-600 px-2 py-1 bg-slate-100 rounded">⚪ {stats.idle} Idle</div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-64 border-r border-slate-200 p-4 bg-white overflow-y-auto">
            <h2 className="font-bold mb-4">Drivers & Fleet</h2>
            <input className="w-full p-2 border rounded text-sm mb-4" placeholder="Search driver..." />
            <div className="flex gap-2 mb-4">
                {['All', 'On Road', 'Idle', 'Exception'].map(t => <button key={t} className="text-[10px] font-bold uppercase">{t}</button>)}
            </div>
            {drivers.map(d => (
                <div key={d.id} className="p-3 border rounded mb-2 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedDriverId(d.id)}>
                    <div className="text-sm font-bold flex items-center gap-2">● {d.name}</div>
                    <div className="text-xs text-slate-500">{d.assignedVehicleId}</div>
                </div>
            ))}
        </div>
        
        {/* Center Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
            {activeView === 'priority' && <div className="text-sm italic">Priority Queue view active...</div>}
            {activeView === 'map' && <div className="text-sm italic">Simulated map view active...</div>}
            {activeView === 'list' && <div className="text-sm italic">List view active...</div>}
        </div>
      </div>
    </div>
  );
}
