/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SurchargeRule, ScenarioType, ContainerSizeCode } from '../types';
import { 
  Flame, 
  Plus, 
  Trash2, 
  Sliders, 
  HelpCircle, 
  Calculator, 
  ShieldAlert, 
  CheckCircle,
  TrendingUp,
  Target,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SurchargeEngineProps {
  surcharges: SurchargeRule[];
  onAddSurcharge: (rule: SurchargeRule) => void;
  onDeleteSurcharge: (code: string) => void;
}

export default function SurchargeEngine({
  surcharges,
  onAddSurcharge,
  onDeleteSurcharge
}: SurchargeEngineProps) {
  // New surcharge form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState<number>(120);
  const [newUnit, setNewUnit] = useState('Flat per Container');
  const [newAutoTrigger, setNewAutoTrigger] = useState('Immediate Applied');

  // Custom simulator calculation states to allow dispatchers to test surcharge triggers
  const [testBaseRate, setTestBaseRate] = useState<number>(550);
  const [testContainerSize, setTestContainerSize] = useState<ContainerSizeCode>('40HC');
  const [testWeight, setTestWeight] = useState<number>(24000);
  const [testDetentionDays, setTestDetentionDays] = useState<number>(5); // 5 days at site!
  const [testFreeTimeDays, setTestFreeTimeDays] = useState<number>(3); // 3 days free

  const handleCreateSurcharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || newAmount <= 0) {
      alert('Surcharge Code, Name and Amount values must be declared with active inputs.');
      return;
    }

    if (surcharges.some(s => s.code.toUpperCase() === newCode.toUpperCase().trim())) {
      alert(`Surcharge key prefix ${newCode} already exists in HMS lookup.`);
      return;
    }

    onAddSurcharge({
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      amount: newAmount,
      unit: newUnit,
      autoTrigger: newAutoTrigger
    });

    // Reset
    setNewCode('');
    setNewName('');
    setNewAmount(80);
    alert('Surcharge rule created and registered in HMS billing daemon pipeline.');
  };

  // Run dynamic testing against surcharges + detention rules
  const testResults = useMemo(() => {
    let triggered: Array<{
      code: string;
      name: string;
      calculatedAmount: number;
      triggerReason: string;
    }> = [];

    let originalTotal = testBaseRate;
    let finalTotal = testBaseRate;

    // 1. Process existing configuration rules
    surcharges.forEach(s => {
      let isTriggered = false;
      let reason = '';
      let calculatedAmt = s.amount;

      // Fuel Adjustment factor (FAF) usually triggers as a % or flat
      if (s.code.toUpperCase() === 'FAF') {
        isTriggered = true;
        reason = "Auto-triggers as standard fuel indices surcharge";
        if (s.unit.includes('%')) {
          calculatedAmt = Math.round((s.amount / 100) * testBaseRate);
        }
      }

      // Overweight rules
      else if (s.autoTrigger.toLowerCase().includes('weight') || s.code.toUpperCase() === 'HEAVY') {
        if (testWeight > 22000) {
          isTriggered = true;
          reason = `Cargo gross weight ${testWeight.toLocaleString()} KG exceeds heavy safety limit (22,000 KG)`;
        }
      }

      // Container High cube volume
      else if (s.autoTrigger.toLowerCase().includes('40hc') || s.autoTrigger.toLowerCase().includes('size')) {
        if (testContainerSize === '40HC') {
          isTriggered = true;
          reason = `High volume equipment height (40HC) triggers wide load fee`;
        }
      }

      // General fallback or contains "immediate"
      else if (s.autoTrigger.toLowerCase().includes('immediate') || s.autoTrigger === '') {
        isTriggered = true;
        reason = "Immediate standard trigger rule";
      }

      if (isTriggered) {
        triggered.push({
          code: s.code,
          name: s.name,
          calculatedAmount: calculatedAmt,
          triggerReason: reason
        });
        finalTotal += calculatedAmt;
      }
    });

    // 2. Detention calculations: Penalties calculated as daily rates above free-time limit
    // Auto-calculates detention.
    const detentionOverdays = Math.max(0, testDetentionDays - testFreeTimeDays);
    const detentionDailyRate = 85; // flat standard
    if (detentionOverdays > 0) {
      const detentionSurcharge = detentionOverdays * detentionDailyRate;
      triggered.push({
        code: 'DET',
        name: 'Demurrage / Yard Detention Penalty',
        calculatedAmount: detentionSurcharge,
        triggerReason: `Exceeded specified client free-time limit of ${testFreeTimeDays} days by ${detentionOverdays} elapsed overdays (charged at $${detentionDailyRate}/day)`
      });
      finalTotal += detentionSurcharge;
    }

    return {
      triggered,
      originalTotal,
      finalTotal,
      chargeIncrease: finalTotal - originalTotal,
      detentionDaysExceeded: detentionOverdays
    };
  }, [surcharges, testBaseRate, testContainerSize, testWeight, testDetentionDays, testFreeTimeDays]);

  return (
    <div className="space-y-6" id="surcharge-engine-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
            <Flame className="text-blue-600 w-5 h-5 animate-bounce" /> Commercial Surcharge &amp; Detention Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build and optimize global surcharges, configure Fuel Adjustment Factors (FAF), set customizable detention rules, and test auto-trigger thresholds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left pane: Rule Registry Form & Active Rules */}
        <div className="lg:col-span-7 space-y-6">
          {/* Create Rule Form */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 font-mono">
              I. Define New Dynamic Surcharge
            </h3>
            
            <form onSubmit={handleCreateSurcharge} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">Surcharge Unique Code *</label>
                <input
                  type="text"
                  placeholder="e.g. FAF, HEAVY, CONG"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none uppercase font-mono font-bold"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-505 font-bold block">Surcharge Name Label *</label>
                <input
                  type="text"
                  placeholder="e.g. Fuel Adjustment Factor, Heavy Load Fee"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none font-sans"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold block">Surcharge Valuation Amount *</label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1.5 text-slate-400 font-bold">$</div>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-6 pr-2.5 py-1.5 focus:outline-none font-mono"
                    value={newAmount}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-505 font-bold block">Rate Mode Unit</label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="Flat per Container">Flat per Container</option>
                  <option value="% of Base Rate">% of Base Rate (e.g. FAF index)</option>
                  <option value="Flat per Trip">Flat per Trip</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-slate-500 font-bold block">Custom Auto-Trigger Rule Condition</label>
                <select
                  value={newAutoTrigger}
                  onChange={(e) => setNewAutoTrigger(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none font-mono text-[11px]"
                >
                  <option value="Immediate Applied">Immediate Applied (Always active on quotations)</option>
                  <option value="Cargo weight > 22000 KG">Overweight Limit (Trigger if total mass &gt; 22,000 KG)</option>
                  <option value="Container size == 40HC">Equipment Size (Trigger if container is 40HC high volume)</option>
                  <option value="Scenario == EXP">Leg Segment Match (Trigger only if scenario matches EXPORT)</option>
                </select>
              </div>

              <div className="flex md:col-span-2 justify-end pt-2">
                <button
                  id="create-surcharge-rule"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-extrabold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Register Surcharge Rule
                </button>
              </div>
            </form>
          </div>

          {/* Active rules registered */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-sans tracking-wide">
              Active Registered Tariff Surcharges ({surcharges.length})
            </h3>

            <div className="grid grid-cols-1 gap-3.5">
              {surcharges.map(s => (
                <div 
                  key={s.code} 
                  id={`surcharge-item-${s.code}`}
                  className="border border-slate-201 border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-slate-300 transition shadow-xs"
                >
                  <div className="space-y-1 ml-1 select-none flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border px-1.5 py-0.5 rounded uppercase">
                        {s.code}
                      </span>
                      <span className="text-xs font-bold text-slate-800 font-sans">{s.name}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono italic">
                      Trigger Rules: {s.autoTrigger || 'Auto-Applied Initially'}
                    </p>
                    
                    <div className="text-[10px] text-slate-400 font-mono">
                      Valuation: <strong className="text-slate-700">${s.amount}</strong> ({s.unit})
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-4">
                    <span className="text-xs font-mono font-extrabold text-blue-600 font-sans bg-blue-50 border border-blue-100 px-2.5 py-1 rounded">
                      ${s.amount}{s.unit.includes('%') ? '%' : ''}
                    </span>

                    {/* Disable deleting key system rules like FAF directly */}
                    <button
                      id={`delete-surcharge-${s.code}`}
                      onClick={() => onDeleteSurcharge(s.code)}
                      disabled={s.code === 'FAF'}
                      className="p-1.5 text-red-650 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:hover:text-red-500 transition-colors"
                      title={s.code === 'FAF' ? "System mandated core surcharge rule cannot be deleted" : "Delete surcharge"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right pane: Dynamic trigger simulator playground */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-lg p-5 shadow-sm space-y-5" id="surcharge-test-harness">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calculator className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 font-mono">TEST HARNESS &amp; DETENTION SIMULATOR</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Test real-time calculation bounds &amp; client liabilities dynamically.</p>
              </div>
            </div>

            {/* Simulated Inputs */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold text-[10px] uppercase font-mono">Quoted Base Rate ($)</label>
                  <input
                    id="sim-base-rate"
                    type="number"
                    value={testBaseRate}
                    onChange={(e) => setTestBaseRate(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-blue-400 font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold text-[10px] uppercase font-mono">Equipment Size</label>
                  <select
                    id="sim-container-size"
                    value={testContainerSize}
                    onChange={(e) => setTestContainerSize(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-blue-400 font-mono focus:outline-none font-bold"
                  >
                    <option value="20GP">20GP Standard</option>
                    <option value="40GP">40GP Standard</option>
                    <option value="40HC">40HC High Cube</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold text-[10px] uppercase font-mono">Gross Weight mass (KG)</label>
                <input
                  id="sim-weight"
                  type="range"
                  min={18000}
                  max={28000}
                  step={500}
                  value={testWeight}
                  onChange={(e) => setTestWeight(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                  <span>18,000 KG</span>
                  <span className="text-blue-400 font-black">{testWeight.toLocaleString()} KG</span>
                  <span>28,000 KG</span>
                </div>
              </div>

              {/* Detention Section */}
              <div className="bg-slate-950 border border-slate-830 border-slate-800/80 p-3 rounded-lg space-y-2">
                <span className="text-slate-400 block text-[10px] font-mono font-bold uppercase tracking-wider text-green-400">Demurrage / Detention rules</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  Free-time represents how many initial calendar days the client is permitted to park containers on-site without charge. Penalty is charged per day thereafter.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[9px] uppercase font-mono">Client Free-time Limit</label>
                    <select
                      id="sim-free-time"
                      value={testFreeTimeDays}
                      onChange={(e) => setTestFreeTimeDays(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-blue-400 focus:outline-none font-bold text-center"
                    >
                      <option value={1}>1 Day limit</option>
                      <option value={2}>2 Days limit</option>
                      <option value={3}>3 Days limit (Std)</option>
                      <option value={5}>5 Days limit (Max)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block text-[9px] uppercase font-mono">Actual Days Taken</label>
                    <select
                      id="sim-detention-days"
                      value={testDetentionDays}
                      onChange={(e) => setTestDetentionDays(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-blue-400 focus:outline-none font-bold text-center"
                    >
                      <option value={1}>1 Day</option>
                      <option value={2}>2 Days</option>
                      <option value={3}>3 Days</option>
                      <option value={4}>4 Days</option>
                      <option value={5}>5 Days</option>
                      <option value={7}>7 Days (Late)</option>
                      <option value={10}>10 Days (Late)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations results */}
            <div className="space-y-3.5 border-t border-slate-800 pt-4 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Quotation Net Base Rate:</span>
                <strong className="text-white font-mono">${testBaseRate}.00</strong>
              </div>

              {/* Dynamic Surcharges list */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Triggered Surcharges &amp; Penalties ({testResults.triggered.length})</span>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {testResults.triggered.map(t => (
                    <div key={t.code} className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-blue-400 uppercase font-extrabold">[{t.code}] {t.name}</span>
                        <strong className="text-white font-extrabold">+${t.calculatedAmount}.00</strong>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">Reason: {t.triggerReason}</p>
                    </div>
                  ))}
                  {testResults.triggered.length === 0 && (
                    <div className="text-[11px] text-slate-500 italic p-3 text-center">No surcharges triggered under specified characteristics.</div>
                  )}
                </div>
              </div>

              {/* Final totals */}
              <div className="border-t border-slate-800 pt-3 space-y-2 text-xs font-mono select-none">
                <div className="flex justify-between font-bold text-slate-400">
                  <span>TOTAL SURCHARGES INCURRED:</span>
                  <span className="text-orange-400">+${testResults.chargeIncrease}.00</span>
                </div>
                <div className="flex justify-between text-base font-black border-t border-slate-800 pt-2 text-white">
                  <span>DRAFT INVOICE TOTAL:</span>
                  <span className="text-green-400">${testResults.finalTotal}.00</span>
                </div>
              </div>

              {testResults.detentionDaysExceeded > 0 && (
                <div className="bg-rose-950/40 border border-rose-900/50 rounded-lg p-3 flex gap-2 text-rose-350 text-rose-350/90 text-[11px] leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-300 block">Detention Exceeded Overdays Liability!</span>
                    Exceeded client free time window parameter by <strong className="text-white font-mono">{testResults.detentionDaysExceeded} days</strong>. Surcharge calculation is attached as a billable liability line to the final invoicing console draft.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
