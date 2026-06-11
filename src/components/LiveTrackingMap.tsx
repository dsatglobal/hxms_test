import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, Driver, Vehicle, LocationGeo, SurchargeRule, Region, User } from '../types';
import { MapPin, Navigation, Truck, Phone, AlertTriangle, Share2, Copy, Eye, ChevronRight, ChevronLeft, Plus, RotateCcw, ZoomIn, ZoomOut, Crosshair, Search } from 'lucide-react';

interface LiveTrackingMapProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  locations: LocationGeo[];
  surcharges: SurchargeRule[];
  regions: Region[];
  currentUser: User;
  onAssignJob: (jobId: string, driverId: string, vehicleId: string, scheduledTime: string) => void;
  onUpdateJob: (job: Job) => void;
  onTriggerDynamicInsertion: (jobId: string, insertedJobId: string) => void;
}

export default function LiveTrackingMap({
  jobs,
  drivers,
  vehicles,
  locations,
  surcharges,
  regions,
  currentUser,
  onAssignJob,
  onUpdateJob,
  onTriggerDynamicInsertion
}: LiveTrackingMapProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [simulationTick, setSimulationTick] = useState(0);

  // Simulated positions for vehicles on road
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, {x: number, y: number}>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimulationTick(prev => prev + 1);
        // Simple movement logic: shift positions slightly
        setVehiclePositions(prev => {
          const next = { ...prev };
          jobs.filter(j => j.status === 'active' && j.driverId).forEach(job => {
            const current = next[job.driverId] || { x: Math.random() * 500, y: Math.random() * 500 };
            next[job.driverId] = {
              x: current.x + (Math.random() - 0.5) * 5,
              y: current.y + (Math.random() - 0.5) * 5
            };
          });
          return next;
        });
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, jobs]);

  const activeJobs = useMemo(() => jobs.filter(j => j.status === 'active' || j.status === 'exception'), [jobs]);
  
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [drivers, searchTerm]);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-slate-100 overflow-hidden" id="live-map-module">
      {/* Left Panel: Vehicle List */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search driver or vehicle..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-4">
            {['All', 'On Road', 'Idle', 'Exception'].map(tab => (
              <button key={tab} className="px-3 py-1 text-[10px] font-bold uppercase border-b-2 border-transparent hover:border-blue-500">{tab}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredDrivers.map(driver => {
            const job = jobs.find(j => j.driverId === driver.id && (j.status === 'active' || j.status === 'exception'));
            return (
              <div 
                key={driver.id} 
                className={`p-4 border-b cursor-pointer hover:bg-slate-50 ${selectedDriverId === driver.id ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedDriverId(driver.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${job ? (job.status === 'exception' ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-300'}`} />
                    <span className="font-bold text-sm">{driver.name}</span>
                  </div>
                  {job && <span className="text-[10px] font-bold text-blue-600">[{job.scenario}]</span>}
                </div>
                <div className="text-xs text-slate-500 mt-1">{driver.assignedVehicleId || 'No vehicle'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Panel: Map View */}
      <div className="flex-1 relative bg-slate-100 flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
         
         <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden border border-slate-200">
             {/* Pins */}
             {locations.map(loc => (
                <div key={loc.id} className="absolute flex flex-col items-center" style={{ left: `${loc.lat}%`, top: `${loc.lng}%` }}>
                    <MapPin className="text-blue-900 w-6 h-6" />
                    <span className="text-[10px] font-bold">{loc.code}</span>
                </div>
             ))}

             {activeJobs.map(job => (
                 <motion.div 
                    key={job.id}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-lg"
                    style={{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%` }}
                 >
                     {drivers.find(d => d.id === job.driverId)?.name.charAt(0)}
                 </motion.div>
             ))}
         </div>
      </div>

      {/* Right Panel: Action Panel */}
      <div className={`w-80 bg-white border-l border-slate-200 transition-all ${isPanelCollapsed ? 'w-12' : ''}`}>
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <button onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}>
                {isPanelCollapsed ? <ChevronLeft /> : <ChevronRight />}
            </button>
            {!isPanelCollapsed && <span className="font-bold text-sm">Action Panel</span>}
          </div>
          {!isPanelCollapsed && selectedDriverId && (
              <div className="p-4">
                  <h2 className="font-bold text-lg">{drivers.find(d => d.id === selectedDriverId)?.name}</h2>
                  <div className="mt-4 p-4 bg-slate-50 rounded">
                      <div className="text-xs text-slate-500">Insertion</div>
                      <select className="w-full mt-2 p-2 border rounded text-sm">
                          <option>Select unassigned job...</option>
                      </select>
                      <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded text-sm font-bold">Insert Job</button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}
