/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LocationGeo, Job, Driver, Vehicle } from '../types';
import { MapPin, ArrowRight, ShieldAlert, Sparkles, Navigation, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LiveTrackingMapProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  locations: LocationGeo[];
  onTriggerDynamicInsertion: (jobId: string, insertedJobId: string) => void;
}

export default function LiveTrackingMap({
  jobs,
  drivers,
  vehicles,
  locations,
  onTriggerDynamicInsertion
}: LiveTrackingMapProps) {
  // We'll simulate Driver Bob (drv-1) in real-time
  const bobJob = jobs.find(j => j.id === 'job-1'); // JB-2026-1001
  const returnJob = jobs.find(j => j.id === 'job-3'); // JB-2026-1003 (RETURN)

  // Position state (from 0 to 100% along the path)
  const [progress, setProgress] = useState(38);
  const [isSimulating, setIsSimulating] = useState(true);

  // Path coordinates mapping (pixel SVG coordinates)
  // Origin HZP-T1 (80, 320) -> Customer PF-WH1 (280, 160)
  const xStart = 80;
  const yStart = 320;
  const xCust = 280;
  const yCust = 160;
  
  // Backhaul Endpoint: Apex depot (340, 520)
  const xDepot = 340;
  const yDepot = 520;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        setProgress(prev => {
          // Slowly bounce bob along his route coordinates
          if (prev >= 98) {
            return 38; // loop simulation
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Current calculated truck coordinates depending on progress and dynamic insertion state
  const truckCoords = React.useMemo(() => {
    // Stage 1: En-route from T1 to Customer WH (progress 0 to 60)
    // Stage 2: If dynamic insertion triggered, go backhaul to Depot.
    // If not triggered, go back to Port empty.
    
    if (bobJob?.hasDynamicInsertion && progress > 60) {
      // Curve towards depot (340, 520)
      const ratio = (progress - 60) / 40; // 0 to 1
      const x = xCust + (xDepot - xCust) * ratio;
      const y = yCust + (yDepot - yCust) * ratio;
      return { x, y, heading: 130 };
    } else if (progress > 60) {
      // Heading back empty to Start port (80, 320)
      const ratio = (progress - 60) / 40;
      const x = xCust + (xStart - xCust) * ratio;
      const y = yCust + (yStart - yCust) * ratio;
      return { x, y, heading: 250 };
    } else {
      // Heading to Customer Warehouse
      const ratio = progress / 60;
      const x = xStart + (xCust - xStart) * ratio;
      const y = yCust + (yStart - yCust) * (1 - ratio);
      return { x, y, heading: 50 };
    }
  }, [progress, bobJob?.hasDynamicInsertion]);

  const handleInsertActiveTriangulation = () => {
    if (!bobJob || !returnJob) return;
    
    onTriggerDynamicInsertion(bobJob.id, returnJob.id);
    alert(`DYNAMIC DISPATCH CONFIRMED! 
    
    1. Direct instructing signal sent to Driver Bob.
    2. Route updated dynamically on map (Triangulation Backhaul).
    3. New milestones auto-injected directly into driver Milestone log.`);
  };

  return (
    <div className="space-y-6" id="live-map-module">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-800 flex items-center gap-2">
            <Navigation className="text-blue-600 w-5 h-5 animate-pulse" /> Live Tracking &amp; Dynamic Dispatch Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Display live vehicle GPS. Allows dispatchers to push dynamic job alterations mid-route to avoid unladen miles.
          </p>
        </div>

        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border border-slate-200 hover:bg-slate-100 hover:border-slate-300 bg-white text-slate-800 font-bold shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          {isSimulating ? 'Simulating Live' : 'Simulation Paused'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual Map Layout */}
        <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-hidden shadow-inner relative flex flex-col items-center">
          
          <div className="absolute top-4 left-4 bg-white/95 border border-slate-200 px-3 py-2 rounded text-[11px] font-sans text-slate-500 space-y-1 z-10 shadow-md backdrop-blur">
            <div className="font-bold text-slate-800">Terminal Control Tower Radar</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full" /> Ports Terminal</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-indigo-505 rounded-full" /> Depot Storage</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Customer Warehouse</div>
          </div>

          {/* SVG Map Canvas */}
          <svg 
            viewBox="0 0 600 600" 
            className="w-full max-w-[520px] aspect-square bg-white rounded-lg rounded-t border border-slate-200 shadow-sm relative text-slate-800"
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#64748b" strokeOpacity="0.06" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Simulated Ocean Boundary */}
            <path d="M 0,350 Q 150,300 250,360 T 500,420 Q 550,450 600,400 L 600,600 L 0,600 Z" fill="#ebf8ff" fillOpacity="0.7" />

            {/* Visual Route Lines */}
            {/* Primary Leg: Horizon Port (80, 320) to Furniture Co. (280, 160) */}
            <line 
              x1={xStart} y1={yStart} 
              x2={xCust} y2={yCust} 
              stroke="#0a85ea" 
              strokeWidth="2.5" 
              strokeDasharray="6 3"
              opacity="0.6"
            />

            {/* Double Leg Alternative: Empty return back to start */}
            {!bobJob?.hasDynamicInsertion && (
              <line 
                x1={xCust} y1={yCust} 
                x2={xStart} y2={yStart} 
                stroke="#94a3b8" 
                strokeWidth="1.5" 
                strokeDasharray="5"
                opacity="0.5"
              />
            )}

            {/* Dynamic Insertion Route: Furniture Co. (280, 160) to Apex Empty Depot (340, 520) */}
            {bobJob?.hasDynamicInsertion && (
              <motion.line 
                x1={xCust} y1={yCust} 
                x2={xDepot} y2={yDepot} 
                stroke="#2563eb" 
                strokeWidth="2.5" 
                strokeDasharray="6 3"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              />
            )}

            {/* Node Pins */}
            {locations.map((loc) => {
              let pinColor = '#a855f7'; // purple default
              if (loc.type === 'port') pinColor = '#0284c7'; // sky
              else if (loc.type === 'depot') pinColor = '#4f46e5'; // indigo
              else if (loc.type === 'customer') pinColor = '#ea580c'; // amber

              return (
                <g key={loc.id} className="cursor-pointer group">
                  <circle cx={loc.lat} cy={loc.lng} r="22" fill={pinColor} fillOpacity="0.08" />
                  <circle cx={loc.lat} cy={loc.lng} r="8" fill={pinColor} fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '4s' }} />
                  <circle cx={loc.lat} cy={loc.lng} r="4" fill={pinColor} />
                  
                  {/* Styled Labels */}
                  <rect 
                    x={loc.lat - 35} 
                    y={loc.lng - 32} 
                    width="70" 
                    height="16" 
                    rx="3" 
                    fill="#ffffff" 
                    fillOpacity="0.95" 
                    stroke="#e2e8f0" 
                    strokeWidth="1" 
                  />
                  <text 
                    x={loc.lat} 
                    y={loc.lng - 21} 
                    fill="#0f172a" 
                    fontSize="8" 
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {loc.code}
                  </text>
                </g>
              );
            })}

            {/* ANIMATED TRUCK ICON MARKER */}
            <g transform={`translate(${truckCoords.x}, ${truckCoords.y}) rotate(${truckCoords.heading - 90})`}>
              {/* Pulse ripple */}
              <circle r="15" fill={bobJob?.hasDynamicInsertion ? '#2563eb' : '#0ea5e9'} fillOpacity="0.15" className="animate-ping" />
              
              {/* Truck shape vector */}
              <rect x="-8" y="-14" width="16" height="28" rx="4" fill="#ffffff" stroke={bobJob?.hasDynamicInsertion ? '#2563eb' : '#0ea5e9'} strokeWidth="2.5" />
              {/* Cab windshield */}
              <rect x="-6" y="-11" width="12" height="6" rx="1" fill="#64748b" />
              {/* Container loaded body */}
              <rect x="-5" y="-3" width="10" height="14" fill={bobJob?.hasDynamicInsertion ? '#1d4ed8' : '#0284c7'} rx="1" />
              <text x="0" y="6" fill="#0f172a" fontSize="6" fontWeight="extrabold" textAnchor="middle" transform="rotate(90)">Bob</text>
            </g>
          </svg>

          {/* Map bottom stats */}
          <div className="w-full bg-white border-t border-slate-200 p-4 text-xs font-mono grid grid-cols-3 text-center rounded-b divide-x divide-slate-200">
            <div>
              <div className="text-slate-400 uppercase text-[9px]">Speed</div>
              <div className="text-slate-700 font-bold">54 km/h</div>
            </div>
            <div>
              <div className="text-slate-400 uppercase text-[9px]">Heading</div>
              <div className="text-slate-700 font-bold">{truckCoords.heading}° North-East</div>
            </div>
            <div>
              <div className="text-slate-400 uppercase text-[9px]">EIR Status</div>
              <div className="text-blue-600 font-bold">Laden Inward</div>
            </div>
          </div>

        </div>

        {/* Right Side: Operations Console & Dynamic Action Portal */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-lg flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Fleet Controller Panel</span>
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 font-sans">Active Driver: Bob Johnson</span>
                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans text-[9px] rounded font-bold">EN-ROUTE</span>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span>Plates:</span>
                  <strong className="text-slate-700 font-mono">PM-8821-X</strong>
                </div>
                <div className="flex justify-between">
                  <span>Container:</span>
                  <strong className="text-slate-700 font-mono">MSCU1234567 (40HC)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Carrier:</span>
                  <strong className="text-slate-700 font-mono">MSC Mediterranean</strong>
                </div>
              </div>

              <div className="space-y-1.5 pr-2 pt-1 border-t border-slate-200">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Path Progress (T1 ➔ FurnitureWH)</span>
                  <span className="font-bold text-slate-700">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-1.5 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Insertion Opportunity Flag */}
            {!bobJob?.hasDynamicInsertion ? (
              <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: [0.98, 1, 0.98] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                  <span className="text-xs font-bold text-blue-800 font-sans uppercase tracking-tight">Triangulation Backhaul Opportunity!</span>
                </div>
                
                <p className="text-xs text-slate-600 font-sans leading-relaxed font-semibold">
                  Bob Johnson is delivering furniture container at <strong className="text-slate-800 text-bold">Zone D (PF-WH1)</strong> and scheduled to return the empty to depot <strong className="text-slate-800">Zone B</strong>. 
                </p>
                <p className="text-xs text-blue-700 font-mono leading-relaxed bg-white/80 p-2 border border-blue-100 rounded">
                  Pending Return Job <strong className="text-blue-905 font-bold">JB-2026-1003</strong> is in the same zone! Click below to insert this task mid-route on Bob's schedule. This saves 24 miles of empty chassis hauling!
                </p>

                <button
                  type="button"
                  onClick={handleInsertActiveTriangulation}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-xs"
                >
                  Insert Backhaul returning Empty
                </button>
              </motion.div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                  <span className="text-xs font-bold text-green-700 font-sans uppercase tracking-tight">Backhaul Assigned (Active)</span>
                </div>
                <p className="text-xs text-slate-600 font-sans font-medium">
                  Bob's skeletal chassis is successfully lock-routed for container triangulation: 
                </p>
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  <div>• Pick up EMPTY body <code>HDMU7721839</code> at Furniture CO yard</div>
                  <div>• Reposit returning box directly inside Depot <code>loc-depot-1</code></div>
                  <div className="text-green-700 mt-1.5 font-bold">Estimated Waste Mileage reduction: 82%</div>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 font-sans leading-relaxed">
            <span className="font-bold text-slate-500">Dynamic Insertion Layer:</span> In typical logistics, drivers are dispatch-locked. Dynamic routing signals automatically recalculate fuel and FAF variables for the final corporate invoice sheet.
          </div>
        </div>

      </div>
    </div>
  );
}
