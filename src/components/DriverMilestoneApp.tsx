/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Job, Driver, Vehicle } from '../types';
import { 
  Check, 
  Smartphone, 
  Truck, 
  MapPin, 
  Camera, 
  CheckCircle, 
  PenTool, 
  Flame, 
  Image, 
  Signature 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DriverMilestoneAppProps {
  jobs: Job[];
  drivers: Driver[];
  vehicles: Vehicle[];
  previewDriverId?: string;
  onUpdateMilestone: (jobId: string, milestoneId: string, evidenceUrl?: string, signatureName?: string) => void;
}

export default function DriverMilestoneApp({
  jobs,
  drivers,
  vehicles,
  previewDriverId,
  onUpdateMilestone
}: DriverMilestoneAppProps) {
  const targetDriverId = previewDriverId ?? 'drv-1';
  const activeJob = jobs.find(j => j.driverId === targetDriverId && j.status === 'active')
    ?? jobs.find(j => j.driverId === targetDriverId)
    ?? jobs.find(j => j.id === 'job-1');
  const bobDriver = drivers.find(d => d.id === targetDriverId) ?? drivers.find(d => d.id === 'drv-1');
  const bobVeh = vehicles.find(v => v.id === bobDriver?.assignedVehicleId);

  // Sign State block
  const [signatureName, setSignatureName] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSignApplied, setIsSignApplied] = useState(false);

  // Photo simulation state
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoSelected, setPhotoSelected] = useState<string | null>(null);

  if (!activeJob) {
    return (
      <div className="p-10 text-center text-xs text-slate-500 font-mono italic">
        Driver Bob Johnson possesses no active dispatch job assignment at this moment.
      </div>
    );
  }

  const currentStep = activeJob.milestones[activeJob.currentMilestoneIndex];
  const isTripComplete = activeJob.status === 'completed';

  const handleNextMilestone = () => {
    if (!currentStep) return;

    // Check if evidence required
    if (currentStep.requiresEvidence && !photoSelected && currentStep.id !== 'm-imp-7' && currentStep.id !== 'm-imp-5') {
      // Trigger photo upload request
      setShowPhotoUpload(true);
      return;
    }

    if (currentStep.id === 'm-imp-5' && !photoSelected) {
      // Container sweep sweep clean check
      setShowPhotoUpload(true);
      return;
    }

    // Require signature for POD (final step)
    if (currentStep.id === 'm-imp-7' && !isSignApplied) {
      setShowSignaturePad(true);
      return;
    }

    const payloadPhoto = photoSelected || undefined;
    const payloadSignName = signatureName || undefined;

    // Trigger update
    onUpdateMilestone(activeJob.id, currentStep.id, payloadPhoto, payloadSignName);
    
    // Reset inputs
    setPhotoSelected(null);
    setShowPhotoUpload(false);
    setIsSignApplied(false);
    setShowSignaturePad(false);
    setSignatureName('');
  };

  const simulatePhotoCapture = () => {
    // Generate dummy picture representing cargo
    const samples = [
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=200', // cargo
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200'  // warehouse
    ];
    setPhotoSelected(samples[Math.floor(Math.random() * samples.length)]);
  };

  const applySignature = () => {
    if (!signatureName.trim()) {
      alert('Please write the recipient receiver name to authorize Pod.');
      return;
    }
    setIsSignApplied(true);
    setShowSignaturePad(false);
    
    // Instantly confirm milestone with payload
    onUpdateMilestone(activeJob.id, currentStep.id, 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=200', signatureName);
    
    // Reset
    setIsSignApplied(false);
    setSignatureName('');
  };

  return (
    <div className="space-y-4" id="driver-milestones-simulation">
      
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-sm font-bold text-slate-805 uppercase tracking-wider font-sans flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-600" /> Driver Mobile Experience Emulator
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Simulate what Bob Johnson views on his phone during delivery. Tap milestones below to advance Bob's truck in real-time.
        </p>
      </div>

      <div className="flex justify-center py-6">
        {/* Smartphone Skin */}
        <div className="w-[320px] h-[640px] bg-slate-50 border-[6px] border-slate-800 rounded-[36px] shadow-2xl relative overflow-hidden flex flex-col font-sans">
          
          {/* Top Notch & Signal bar */}
          <div className="absolute top-0 inset-x-0 h-7 bg-slate-950 flex items-center justify-between px-6 z-20">
            <span className="text-[10px] font-mono font-bold text-slate-400">09:41</span>
            <div className="w-16 h-3.5 bg-slate-900 rounded-full border border-slate-800 absolute left-1/2 transform -translate-x-1/2 top-1" />
            <div className="flex gap-1 text-[10px] text-slate-400 items-center font-mono">
              <span>5G</span>
              <span className="w-3 h-2 bg-slate-400 rounded-sm" />
            </div>
          </div>

          {/* Smartphone Header Workspace */}
          <div className="pt-9 pb-4 px-4 bg-white border-b border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-850">{bobDriver?.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">
                Plates: {bobVeh?.plateNumber} • Skeletal 40HC
              </div>
            </div>
          </div>

          {/* Scrollable Mobile Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-100">
            
            {/* Active Job Abstract */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>ACTIVE JOB</span>
                <span className="font-bold text-blue-600">{activeJob.jobNo}</span>
              </div>
              <div className="font-bold text-slate-800">
                Pacific Furniture WH 1 Import
              </div>
              <div className="text-[10px] text-slate-550 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" /> Zone A ➔ Zone D
              </div>
            </div>

            {/* Simulated interactive instructions tab */}
            {isTripComplete ? (
              <div className="p-5 bg-green-50 border border-green-200 rounded-xl text-center space-y-3 shadow-xs">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto animate-bounce" />
                <div>
                  <h4 className="font-bold text-green-800">Succeed Dispatch completed!</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Proof of Delivery (POD) signed and synchronized. Container interchange recorded. Great job!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">Milestones Checklist</div>
                
                <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                  {activeJob.milestones.map((st, idx) => {
                    const isCompleted = idx < activeJob.currentMilestoneIndex;
                    const isCurrent = idx === activeJob.currentMilestoneIndex;
                    
                    return (
                      <div 
                        key={st.id} 
                        className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                          isCompleted 
                            ? 'bg-slate-50/50 border-slate-200 text-slate-400' 
                            : isCurrent 
                            ? 'bg-white border-blue-400 text-slate-800 shadow-md ring-1 ring-blue-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isCompleted 
                            ? 'bg-green-600 border-green-600 text-white font-extrabold' 
                            : isCurrent 
                            ? 'border-blue-600 animate-pulse bg-blue-50'
                            : 'border-slate-200 bg-white'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-2.5 h-2.5 stroke-[4px]" />
                          ) : isCurrent ? (
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                          ) : null}
                        </div>

                        <div className="space-y-0.5">
                          <div className={`font-bold ${isCurrent ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{st.label}</div>
                          <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">{st.description}</p>
                          {isCompleted && st.timestamp && (
                            <div className="text-[9px] font-mono text-slate-400 pt-1">
                              Done at: {st.timestamp.split('T')[1]?.substr(0, 5) || '09:22'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signature Pad overlay */}
            {showSignaturePad && (
              <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center gap-1 text-xs font-bold text-blue-700">
                  <PenTool className="w-3.5 h-3.5" /> Sign-off e-POD Signature
                </div>
                <input
                  type="text"
                  placeholder="Receiver Signed Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
                
                {/* Scribble simulator area */}
                <div className="h-16 bg-slate-50 border border-dashed border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400 select-none cursor-pointer">
                  [ Click to Sign Scribble ]
                </div>

                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setShowSignaturePad(false)}
                    className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={applySignature}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px]"
                  >
                    Apply Sign e-POD
                  </button>
                </div>
              </div>
            )}

            {/* Photo Capture simulation */}
            {showPhotoUpload && (
              <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <Camera className="w-3.5 h-3.5" /> Photo Proof Required
                </div>
                
                <p className="text-[10px] text-slate-500">
                  Please capture clean picture representing empty container sweep or EIR receipt:
                </p>

                {photoSelected ? (
                  <div className="relative h-20 rounded overflow-hidden border border-slate-200">
                    <img 
                      src={photoSelected} 
                      alt="capture" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    <span className="absolute bottom-1 right-1 bg-green-600 px-1.5 py-0.5 rounded text-[8px] text-white font-sans font-bold">MATCHED</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={simulatePhotoCapture}
                    className="w-full h-16 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-300 rounded flex flex-col justify-center items-center text-[10px] text-slate-500 transition-colors"
                  >
                    <Camera className="w-5 h-5 text-slate-400 mb-1" />
                    <span>Click to Snap Photo</span>
                  </button>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <button 
                    onClick={() => setShowPhotoUpload(false)}
                    className="px-2 py-1 text-[10px] text-slate-400"
                  >
                    Cancel
                  </button>
                  {photoSelected && (
                    <button 
                      onClick={handleNextMilestone}
                      className="px-3 py-1 bg-blue-600 text-white font-bold rounded text-[10px]"
                    >
                      Verify and Submit
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Core Smartphone CTA action footer */}
          {!isTripComplete && !showSignaturePad && !showPhotoUpload && (
            <div className="p-3.5 bg-white border-t border-slate-200 flex justify-center z-10">
              <button
                type="button"
                onClick={handleNextMilestone}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex justify-center items-center gap-1 transition-colors shadow-sm shrink-0"
              >
                {currentStep?.requiresEvidence ? 'Snap and Confirm Milestone' : 'Confirm Milestone Step ✔'}
              </button>
            </div>
          )}

          {/* Smartphone home bar */}
          <div className="h-4 bg-slate-950 flex items-center justify-center pb-1">
            <div className="w-24 h-1 bg-slate-700 rounded-full" />
          </div>

        </div>
      </div>

    </div>
  );
}
