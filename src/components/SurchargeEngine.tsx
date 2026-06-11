/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SurchargeRule, ScenarioType, Region, ShippingLine, SupportedLanguage, MasterTranslation } from '../types';
import { 
  Flame, 
  Plus, 
  Trash2, 
  Calculator, 
  ShieldAlert, 
  CheckCircle,
  Edit2,
  X,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LanguageSwitcher from './LanguageSwitcher';

interface SurchargeEngineProps {
  surcharges: SurchargeRule[];
  regions: Region[];
  shippingLines: ShippingLine[];
  onAddSurcharge: (rule: SurchargeRule) => void;
  onUpdateSurcharge: (rule: SurchargeRule) => void;
  onDeleteSurcharge: (code: string) => void;
  supportedLanguages: SupportedLanguage[];
  masterTranslations: MasterTranslation[];
  onAddMasterTranslation: (mt: MasterTranslation) => void;
  onUpdateMasterTranslation: (mt: MasterTranslation) => void;
}

export default function SurchargeEngine({
  surcharges,
  regions,
  shippingLines,
  onAddSurcharge,
  onUpdateSurcharge,
  onDeleteSurcharge,
  supportedLanguages = [],
  masterTranslations = [],
  onAddMasterTranslation,
  onUpdateMasterTranslation
}: SurchargeEngineProps) {
  // Active editing rule state (null means form is closed)
  const [formRule, setFormRule] = useState<SurchargeRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Translation States
  const [activeLanguageCode, setActiveLanguageCode] = useState('en');
  const [translatedName, setTranslatedName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  React.useEffect(() => {
    if (formRule && activeLanguageCode !== 'en') {
      const existing = masterTranslations.find(
        t => t.masterRecordId === formRule.id && 
             t.languageCode === activeLanguageCode && 
             t.masterType === 'surcharge'
      );
      setTranslatedName(existing?.translatedName || '');
    } else {
      setTranslatedName('');
    }
  }, [formRule, activeLanguageCode, masterTranslations]);

  // Default parameters for simple testing simulator
  const [simBaseRate, setSimBaseRate] = useState<number>(35000);
  const [simScenario, setSimScenario] = useState<ScenarioType>('IMP');
  const [simShippingLine, setSimShippingLine] = useState<string>('');
  const [simElapsedTime, setSimElapsedTime] = useState<number>(10); // days or hours
  const [simRegion, setSimRegion] = useState<string>('IN');

  const defaultNewRule = (defaultRegion: string): SurchargeRule => ({
    id: `surch_${Math.random().toString(36).substr(2, 9)}`,
    code: '',
    name: '',
    category: 'Other',
    calculationMethod: 'Flat',
    amount: 0,
    currency: 'INR',
    freePeriod: 0,
    freePeriodUnit: 'None',
    maxChargeCap: null,
    applicableScenarios: ['IMP', 'EXP'],
    applicableShippingLines: [],
    autoTrigger: false,
    autoTriggerCondition: '',
    billToCustomer: true,
    payToSubcontractor: false,
    subcontractorAmount: 0,
    regionId: defaultRegion || 'IN',
    isActive: true,
    createdAt: new Date().toISOString()
  });

  const categoryBadgeColors: Record<string, string> = {
    Fuel: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    Detention: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    'Waiting Time': 'bg-orange-50 text-orange-700 border border-orange-200/60',
    'Port Fee': 'bg-blue-50 text-blue-700 border border-blue-200/60',
    Chassis: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    Other: 'bg-slate-50 text-slate-700 border border-slate-200/60'
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      INR: '₹',
      AED: 'AED ',
      MYR: 'RM ',
      USD: '$',
      GBP: '£'
    };
    return symbols[currency] || '$';
  };

  const formatAmount = (amount: number, method: string, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    if (method === 'Percentage of Base') {
      return `${amount}%`;
    }
    const suffixes: Record<string, string> = {
      'Per Hour': '/hour',
      'Per Day': '/day',
      Flat: '',
      'Percentage of Base': '',
      Tiered: ' (Tiered)'
    };
    return `${symbol}${amount.toLocaleString()}${suffixes[method] || ''}`;
  };

  const handleOpenAddNew = () => {
    const defRegion = regions[0]?.id || 'IN';
    setFormRule(defaultNewRule(defRegion));
    setIsEditing(false);
    setErrorMsg('');
    setActiveLanguageCode('en');
    setSaveMessage('');
  };

  const handleOpenEdit = (rule: SurchargeRule) => {
    setFormRule({ ...rule });
    setIsEditing(true);
    setErrorMsg('');
    setActiveLanguageCode('en');
    setSaveMessage('');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRule) return;

    if (activeLanguageCode !== 'en') {
      if (!translatedName.trim()) {
        setErrorMsg('Please enter a translated name');
        return;
      }
      const existing = masterTranslations.find(
        t => t.masterRecordId === formRule.id && 
             t.languageCode === activeLanguageCode && 
             t.masterType === 'surcharge'
      );
      const updatedTrans: MasterTranslation = {
        id: existing?.id || `mt-${Date.now()}`,
        languageCode: activeLanguageCode,
        masterType: 'surcharge',
        masterRecordId: formRule.id,
        translatedName: translatedName.trim(),
        translatedDescription: '',
        isVerified: existing?.isVerified || false,
        updatedAt: new Date().toISOString()
      };

      if (existing) {
        onUpdateMasterTranslation(updatedTrans);
      } else {
        onAddMasterTranslation(updatedTrans);
      }

      setErrorMsg('');
      const langName = supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode;
      setSaveMessage(`${langName} translation saved ✓`);
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    if (!formRule.code.trim()) {
      setErrorMsg('Surcharge identifier code is required');
      return;
    }
    if (!formRule.name.trim()) {
      setErrorMsg('Pleas enter a descriptive name for the surcharge');
      return;
    }

    const cleanedCode = formRule.code.toUpperCase().trim();

    // Check duplicate code ONLY in Add mode
    if (!isEditing) {
      const exists = surcharges.some(s => s.code.toUpperCase() === cleanedCode);
      if (exists) {
        setErrorMsg(`Surcharge code "${cleanedCode}" already exists in registry.`);
        return;
      }
    }

    const payload: SurchargeRule = {
      ...formRule,
      code: cleanedCode,
      name: formRule.name.trim()
    };

    if (isEditing) {
      onUpdateSurcharge(payload);
    } else {
      onAddSurcharge(payload);
    }

    setFormRule(null);
    setErrorMsg('');
  };

  const handleToggleScenario = (sc: ScenarioType) => {
    if (!formRule) return;
    const current = formRule.applicableScenarios;
    if (current.includes(sc)) {
      setFormRule({
        ...formRule,
        applicableScenarios: current.filter(item => item !== sc)
      });
    } else {
      setFormRule({
        ...formRule,
        applicableScenarios: [...current, sc]
      });
    }
  };

  const handleToggleShippingLine = (lineId: string) => {
    if (!formRule) return;
    const current = formRule.applicableShippingLines;
    if (current.includes(lineId)) {
      setFormRule({
        ...formRule,
        applicableShippingLines: current.filter(item => item !== lineId)
      });
    } else {
      setFormRule({
        ...formRule,
        applicableShippingLines: [...current, lineId]
      });
    }
  };

  const simResults = useMemo(() => {
    const triggered: Array<{
      rule: SurchargeRule;
      calculated: number;
      actualElapsedTimeUsed: number;
      billableUnitCharged: number;
      freePeriodGranted: number;
      explanation: string;
    }> = [];

    let totalSurchagesCustomer = 0;
    let totalSurchagesSubcontractor = 0;

    surcharges.forEach(rule => {
      if (!rule.isActive) return;

      // Region check
      if (rule.regionId !== simRegion) return;

      // Scenario check
      if (rule.applicableScenarios.length > 0 && !rule.applicableScenarios.includes(simScenario)) {
        return;
      }

      // Shipping line check
      if (rule.applicableShippingLines.length > 0 && simShippingLine && !rule.applicableShippingLines.includes(simShippingLine)) {
        return;
      }

      // Calculation of duration-based surcharges
      let freeUnits = rule.freePeriod;
      let usedUnits = 0;
      let chargeableUnits = 0;
      let calculatedAmt = 0;
      let explanation = '';

      if (rule.calculationMethod === 'Percentage of Base') {
        calculatedAmt = Math.round((rule.amount / 100) * simBaseRate);
        explanation = `${rule.amount}% applied on base rate (${getCurrencySymbol(rule.currency)}${simBaseRate.toLocaleString()})`;
      } else if (rule.calculationMethod === 'Per Hour' || rule.calculationMethod === 'Per Day') {
        usedUnits = simElapsedTime;
        chargeableUnits = Math.max(0, usedUnits - freeUnits);
        calculatedAmt = chargeableUnits * rule.amount;
        
        const unitLabel = rule.calculationMethod === 'Per Hour' ? 'hours' : 'days';
        explanation = `${simElapsedTime} elapsed ${unitLabel} minus ${freeUnits} free ${unitLabel}. Charged for ${chargeableUnits} ${unitLabel} @ ${getCurrencySymbol(rule.currency)}${rule.amount}/${rule.calculationMethod === 'Per Hour' ? 'hr' : 'day'}`;
      } else {
        // Flat or other
        calculatedAmt = rule.amount;
        explanation = `Flat core surcharge item applied.`;
      }

      // Max Cap Limit check
      if (rule.maxChargeCap !== null && calculatedAmt > rule.maxChargeCap) {
        explanation += ` (Capped at maximum of ${getCurrencySymbol(rule.currency)}${rule.maxChargeCap.toLocaleString()})`;
        calculatedAmt = rule.maxChargeCap;
      }

      if (rule.billToCustomer && (rule.autoTrigger || rule.code === 'FAF')) {
        totalSurchagesCustomer += calculatedAmt;
      }

      let subconPart = 0;
      if (rule.payToSubcontractor) {
        if (rule.calculationMethod === 'Per Hour' || rule.calculationMethod === 'Per Day') {
          const charUnits = Math.max(0, simElapsedTime - freeUnits);
          subconPart = charUnits * rule.subcontractorAmount;
        } else {
          subconPart = rule.subcontractorAmount;
        }
        totalSurchagesSubcontractor += subconPart;
      }

      triggered.push({
        rule,
        calculated: calculatedAmt,
        actualElapsedTimeUsed: usedUnits,
        billableUnitCharged: chargeableUnits,
        freePeriodGranted: freeUnits,
        explanation
      });
    });

    return {
      triggered,
      totalSurchagesCustomer,
      totalSurchagesSubcontractor
    };
  }, [surcharges, simBaseRate, simScenario, simShippingLine, simElapsedTime, simRegion]);

  return (
    <div className="space-y-6" id="surcharge-engine-panel">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
            <Flame className="text-blue-600 w-5 h-5 animate-bounce" /> Commercial Surcharge Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure, regionalize, and maintain dynamic freight and container surcharges. Map triggering thresholds for India, UAE, and other operational regions.
          </p>
        </div>
        <button
          id="btn-define-surcharge"
          onClick={handleOpenAddNew}
          className="px-4 py-2 bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Define New Surcharge
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Surcharge List (40% width / lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Surcharge Registry ({surcharges.length})
              </h2>
              <span className="text-[10px] font-mono text-slate-400 font-bold">Region Filter Integrated</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">Code &amp; Name</th>
                    <th scope="col" className="px-3 py-3 text-left">Languages</th>
                    <th scope="col" className="px-3 py-3 text-left">Calc &amp; Rate</th>
                    <th scope="col" className="px-3 py-3 text-left">Trigger / Reg</th>
                    <th scope="col" className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-xs">
                  {surcharges.map(s => {
                    const isSelected = formRule?.id === s.id;
                    const translations = masterTranslations.filter(t => t.masterRecordId === s.id && t.masterType === 'surcharge');
                    return (
                      <tr 
                        key={s.id} 
                        id={`surcharge-row-${s.code}`}
                        className={`hover:bg-slate-50/40 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1.5">
                            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${categoryBadgeColors[s.category] || categoryBadgeColors['Other']}`}>
                              {s.code}
                            </span>
                            <span className="font-extrabold text-slate-900 leading-tight block">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {translations.map(t => (
                              <span
                                key={t.languageCode}
                                onClick={() => handleOpenEdit(s)}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono font-bold cursor-pointer hover:bg-slate-200"
                              >
                                {t.languageCode}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="font-mono font-bold text-slate-800 block text-[13px]">
                            {formatAmount(s.amount, s.calculationMethod, s.currency)}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="text-[10px] font-mono font-bold text-slate-750 bg-slate-100 px-1 py-0.2 border rounded">
                            {s.regionId}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-surcharge-${s.code}`}
                              onClick={() => handleOpenEdit(s)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {surcharges.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No surcharges registered. Select "Define New Surcharge" to populate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick simulator playground inside Left Column for extra density */}
          <div className="bg-slate-900 text-white rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calculator className="w-4 h-4 text-blue-400" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-450 text-blue-400">Surcharge Simulator</h3>
                <p className="text-[10px] text-slate-500">Simulate triggers and calculation logic under selected parameters.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold text-[9px] uppercase font-mono">Quoted Base Rate</label>
                <input 
                  type="number"
                  value={simBaseRate}
                  onChange={(e) => setSimBaseRate(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-blue-400 font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold text-[9px] uppercase font-mono">Test Region</label>
                <select 
                  value={simRegion}
                  onChange={(e) => setSimRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-blue-400 focus:outline-none font-bold"
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                  ))}
                  {regions.length === 0 && <option value="IN">India (IN)</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold text-[9px] uppercase font-mono">Ocean Line Client</label>
                <select 
                  value={simShippingLine}
                  onChange={(e) => setSimShippingLine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-blue-400 focus:outline-none font-bold"
                >
                  <option value="">Any Ocean Line</option>
                  {shippingLines.map(sl => (
                    <option key={sl.id} value={sl.id}>{sl.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold text-[9px] uppercase font-mono">Test Scenario Type</label>
                <select 
                  value={simScenario}
                  onChange={(e) => setSimScenario(e.target.value as ScenarioType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-blue-400 focus:outline-none font-bold"
                >
                  <option value="IMP">Import (IMP)</option>
                  <option value="EXP">Export (EXP)</option>
                  <option value="Inland">Inland (Inland)</option>
                  <option value="EMTY">Empty Repositioning (EMTY)</option>
                  <option value="RETURN">Return Logistics (RETURN)</option>
                </select>
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-slate-400 block font-bold text-[9px] uppercase font-mono">ElapsedTime duration on-site ({simElapsedTime} Units)</label>
                <input 
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={simElapsedTime}
                  onChange={(e) => setSimElapsedTime(parseInt(e.target.value) || 0)}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>0 Units (Immediate release)</span>
                  <span>15 Units</span>
                  <span>30 Units maximum</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Triggered lines ({simResults.triggered.length})</span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {simResults.triggered.map(t => (
                  <div key={t.rule.id} className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition flex justify-between items-start text-[11px] font-mono">
                    <div className="space-y-0.5">
                      <span className="text-blue-400 font-bold uppercase">[{t.rule.code}] {t.rule.name}</span>
                      <p className="text-[10px] text-slate-400 leading-tight">{t.explanation}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">+{getCurrencySymbol(t.rule.currency)}{t.calculated.toLocaleString()}</span>
                      {t.rule.payToSubcontractor && (
                        <div className="text-[9px] text-orange-400">Subcon: +{getCurrencySymbol(t.rule.currency)}{(t.rule.subcontractorAmount * (t.rule.calculationMethod.includes('Hour') || t.rule.calculationMethod.includes('Day') ? Math.max(0, simElapsedTime - t.rule.freePeriod) : 1)).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                ))}
                {simResults.triggered.length === 0 && (
                  <p className="text-[11px] text-slate-500 italic text-center py-2">No surcharges match specified filter context.</p>
                )}
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between font-mono text-[13px] font-black">
                <span className="text-slate-300">ESTIMATED FREIGHT INVOICE BILLED:</span>
                <span className="text-emerald-400">{getCurrencySymbol('INR')}{(simBaseRate + simResults.totalSurchagesCustomer).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Add/Edit Form Panel (60% width / lg:col-span-7) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {formRule ? (
              <motion.div
                key="form-opened"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-blue-50 text-blue-600 rounded">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {isEditing ? `Edit Surcharge: ${formRule.code}` : 'Define New Tariff Surcharge'}
                      </h3>
                      <p className="text-[11px] text-slate-500">Provide calculation characteristics and trigger terms</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormRule(null)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2 text-red-700 text-xs text-[11px] leading-relaxed">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Error compiling rules:</span> {errorMsg}
                    </div>
                  </div>
                )}

                <LanguageSwitcher
                  supportedLanguages={supportedLanguages}
                  activeLanguageCode={activeLanguageCode}
                  onChange={setActiveLanguageCode}
                />

                <form onSubmit={handleSaveForm} className="space-y-6 text-xs text-slate-700 font-sans">
                  
                  {/* SECTION 1 — Basic Info */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 font-mono">
                      <span>SECTION 1</span> • BASIC IDENTIFICATION &amp; RANGE
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold block">Surcharge Unique Code *</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. FAF, DET, WAIT"
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none uppercase font-mono font-bold text-slate-900 focus:border-blue-500 transition-colors"
                          value={formRule.code}
                          onChange={(e) => setFormRule({ ...formRule, code: e.target.value })}
                          disabled={isEditing || activeLanguageCode !== 'en'}
                          required
                        />
                        <p className="text-[10px] text-slate-400">Unique identifier, capitalized, maximum 6 characters.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-505 font-bold block">
                          {activeLanguageCode === 'en' ? 'Surcharge Name Label *' : 'Surcharge Name Translation *'}
                        </label>
                        {activeLanguageCode === 'en' ? (
                          <input
                            type="text"
                            placeholder="e.g. Fuel Surcharge, Container Late Detention"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-sans text-slate-900 focus:border-blue-500 transition-colors"
                            value={formRule.name}
                            onChange={(e) => setFormRule({ ...formRule, name: e.target.value })}
                            required
                          />
                        ) : (
                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded leading-snug font-sans">
                              <strong>English Reference:</strong> {formRule.name}
                            </div>
                            <input
                              type="text"
                              required
                              dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                              placeholder="Enter translated surcharge name..."
                              className="w-full bg-white border-2 border-indigo-500 rounded px-3 py-1.5 focus:outline-none font-bold text-slate-900"
                              value={translatedName}
                              onChange={(e) => setTranslatedName(e.target.value)}
                            />
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400">Human descriptive name of the charge line.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold block">Category Classification *</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-sans text-slate-900 focus:border-blue-500 transition-colors"
                          value={formRule.category}
                          onChange={(e) => setFormRule({ ...formRule, category: e.target.value as any })}
                          disabled={activeLanguageCode !== 'en'}
                        >
                          <option value="Fuel">Fuel</option>
                          <option value="Detention">Detention</option>
                          <option value="Waiting Time">Waiting Time</option>
                          <option value="Port Fee">Port Fee</option>
                          <option value="Chassis">Chassis</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-bold block">Operating Region *</label>
                          <select
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-sans text-slate-900 focus:border-blue-500 transition-colors font-bold"
                            value={formRule.regionId}
                            onChange={(e) => setFormRule({ ...formRule, regionId: e.target.value })}
                            disabled={activeLanguageCode !== 'en'}
                          >
                            {regions.map(r => (
                              <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                            ))}
                            {regions.length === 0 && <option value="IN">India (IN)</option>}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-550 font-bold block">Active Status</label>
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="form-is-active"
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-opacity-25"
                              checked={formRule.isActive}
                              onChange={(e) => setFormRule({ ...formRule, isActive: e.target.checked })}
                              disabled={activeLanguageCode !== 'en'}
                            />
                            <label htmlFor="form-is-active" className="text-slate-700 font-bold">Enabled</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2 — Calculation */}
                  <fieldset disabled={activeLanguageCode !== 'en'} className="space-y-6">
                    <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 font-mono">
                      <span>SECTION 2</span> • CALCULATION ENGINE &amp; VALUE
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-500 font-bold block">Calculation Method *</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-sans text-slate-900 focus:border-blue-500 transition-colors"
                          value={formRule.calculationMethod}
                          onChange={(e) => setFormRule({ ...formRule, calculationMethod: e.target.value as any })}
                        >
                          <option value="Flat">Flat Fee</option>
                          <option value="Per Hour">Per Hour (Waiting Time)</option>
                          <option value="Per Day">Per Day (Detention / Chassis)</option>
                          <option value="Percentage of Base">Percentage of Base Rate (e.g. Fuel %)</option>
                          <option value="Tiered">Tiered Slabs</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-bold block">Selling Charge Amount *</label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="Amount"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-mono text-slate-900 focus:border-blue-500 transition-colors font-bold"
                            value={formRule.amount || ''}
                            onChange={(e) => setFormRule({ ...formRule, amount: parseFloat(e.target.value) || 0 })}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-500 font-bold block">Currency *</label>
                          <select
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none font-sans text-slate-900 focus:border-blue-500 transition-colors font-mono"
                            value={formRule.currency}
                            onChange={(e) => setFormRule({ ...formRule, currency: e.target.value })}
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="AED">AED (Dh)</option>
                            <option value="MYR">MYR (RM)</option>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-bold block">Free Period Limit (Units)</label>
                          <input
                            type="number"
                            min={0}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-mono text-slate-900 focus:border-blue-500 transition-colors"
                            value={formRule.freePeriod}
                            onChange={(e) => setFormRule({ ...formRule, freePeriod: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-505 font-bold block">Free Units Unit</label>
                          <select
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-sans text-slate-900 focus:border-blue-500 transition-colors"
                            value={formRule.freePeriodUnit}
                            onChange={(e) => setFormRule({ ...formRule, freePeriodUnit: e.target.value as any })}
                          >
                            <option value="None">None (Charged immediately)</option>
                            <option value="Hours">Hours</option>
                            <option value="Days">Days</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-slate-500 font-bold block">Max Charge Cap Limit</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              id="enable-cap-checkbox"
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded"
                              checked={formRule.maxChargeCap !== null}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormRule({ ...formRule, maxChargeCap: 5000 });
                                } else {
                                  setFormRule({ ...formRule, maxChargeCap: null });
                                }
                              }}
                            />
                            <label htmlFor="enable-cap-checkbox" className="text-[10px] text-slate-500 font-bold cursor-pointer">Enable Limit Cap</label>
                          </div>
                        </div>
                        <input
                          type="number"
                          min={0}
                          placeholder="No upper ceiling cap"
                          disabled={formRule.maxChargeCap === null}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-mono text-slate-900 focus:border-blue-500 transition-colors disabled:opacity-50"
                          value={formRule.maxChargeCap ?? ''}
                          onChange={(e) => setFormRule({ ...formRule, maxChargeCap: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-[10px] text-slate-400">Maximum possible charge for a single container trip line item.</p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3 — Trigger Rules */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 font-mono">
                      <span>SECTION 3</span> • OPERATIONAL AUTO TRIGGER SYSTEM
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold block">Applicable Shipment Scenarios (Check to apply)</label>
                        <div className="flex flex-wrap gap-2.5">
                          {(['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'] as ScenarioType[]).map(sc => {
                            const isChecked = formRule.applicableScenarios.includes(sc);
                            return (
                              <button
                                key={sc}
                                type="button"
                                onClick={() => handleToggleScenario(sc)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                                  isChecked 
                                    ? 'bg-blue-50 border-blue-250 text-blue-700' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-blue-600' : 'bg-slate-350'}`} />
                                {sc}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-500 font-bold block">Restricted to Specific Shipping Lines</label>
                        <p className="text-[10px] text-slate-400 pb-1">Select specific carrier lines. If none are selected, the surcharge triggers for all shipping lines.</p>
                        
                        <div className="border border-slate-200 rounded bg-slate-50 p-2.5 max-h-[140px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                          {shippingLines.map(sl => {
                            const isChecked = formRule.applicableShippingLines.includes(sl.id);
                            return (
                              <label key={sl.id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:bg-slate-100/50 rounded px-1.5 transition-colors">
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded"
                                  checked={isChecked}
                                  onChange={() => handleToggleShippingLine(sl.id)}
                                />
                                <span className="font-bold text-slate-800">{sl.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({sl.scacCode})</span>
                              </label>
                            );
                          })}
                          {shippingLines.length === 0 && (
                            <div className="col-span-2 text-center text-slate-400 py-4 font-bold text-[11px]">
                              No shipping lines available. Manage support masters first.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-bold block">Auto-Trigger System Placement</label>
                          <div className="flex items-center gap-2.5 pt-1">
                            <input
                              type="checkbox"
                              id="form-auto-trigger"
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                              checked={formRule.autoTrigger}
                              onChange={(e) => setFormRule({ ...formRule, autoTrigger: e.target.checked })}
                            />
                            <label htmlFor="form-auto-trigger" className="text-slate-700 font-bold">Auto-apply trigger rule on matching quotations</label>
                          </div>
                          <p className="text-[10px] text-slate-400">If unchecked, dispatcher must apply this line manually.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-505 font-bold block">Auto Trigger Condition (Description)</label>
                          <textarea
                            rows={2}
                            placeholder="Describe trigger condition..."
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none font-sans text-slate-900 focus:border-blue-500 transition-colors"
                            value={formRule.autoTriggerCondition}
                            onChange={(e) => setFormRule({ ...formRule, autoTriggerCondition: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4 — Billing Split */}
                  <div className="space-y-3.5 bg-slate-50 p-4 border border-slate-200/80 rounded-lg">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-650 text-blue-600 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 font-mono">
                      <span>SECTION 4</span> • FINANCIAL SPLIT &amp; SUBCONTRACTING
                    </h4>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="form-bill-to-customer"
                              className="w-4 h-4 text-blue-650 text-blue-600 border-slate-300 rounded"
                              checked={formRule.billToCustomer}
                              onChange={(e) => setFormRule({ ...formRule, billToCustomer: e.target.checked })}
                            />
                            <label htmlFor="form-bill-to-customer" className="text-slate-800 font-bold cursor-pointer">Billed to End-Customer</label>
                          </div>
                          <p className="text-[10px] text-slate-500 pl-6 leading-normal">Attach as a receivables line to the standard customer commercial freight invoice.</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="form-pay-to-subcon"
                              className="w-4 h-4 text-blue-650 text-blue-600 border-slate-300 rounded"
                              checked={formRule.payToSubcontractor}
                              onChange={(e) => setFormRule({ ...formRule, payToSubcontractor: e.target.checked })}
                            />
                            <label htmlFor="form-pay-to-subcon" className="text-slate-800 font-bold cursor-pointer">Payable to Haulage Partner (Subcontractor)</label>
                          </div>
                          <p className="text-[10px] text-slate-500 pl-6 leading-normal">Enable this to generate a mirror payables line tracking subcontractor buy-rate expenses.</p>
                        </div>
                      </div>

                      {formRule.payToSubcontractor && (
                        <div className="p-3 bg-white border border-slate-200 rounded gap-4 flex flex-col md:flex-row md:items-center justify-between animate-fade-in">
                          <div className="space-y-1 flex-1">
                            <label className="text-slate-650 font-bold block">Haulage Partner Buy Amount ({getCurrencySymbol(formRule.currency)}) *</label>
                            <input
                              type="number"
                              min={0}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none font-mono text-slate-900 focus:border-blue-500 transition-colors font-bold"
                              value={formRule.subcontractorAmount}
                              onChange={(e) => setFormRule({ ...formRule, subcontractorAmount: parseFloat(e.target.value) || 0 })}
                              required
                            />
                            <p className="text-[10px] text-slate-400">Merchant cost/buy rate allocated for this auxiliary event.</p>
                          </div>

                          <div className="bg-slate-50 border px-4 py-3 rounded text-center md:min-w-[150px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Live Margin Estimate</span>
                            <span className="text-sm font-mono font-black text-emerald-600 block mt-0.5">
                              {getCurrencySymbol(formRule.currency)}
                              {(formRule.amount - formRule.subcontractorAmount).toLocaleString()} Margin
                            </span>
                            <span className="text-[9px] text-slate-400 font-sans mt-0.5 block">
                              {(formRule.amount - formRule.subcontractorAmount) >= 0 ? 'Profit Margin safe' : 'Loss Threshold alert'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </fieldset>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    {saveMessage && (
                      <span className="text-xs text-emerald-600 font-bold self-center animate-pulse mr-auto">
                        {saveMessage}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormRule(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded transition shadow-sm"
                    >
                      {activeLanguageCode === 'en' ? (isEditing ? 'Update Surcharge' : 'Create Surcharge Rule') : `Save ${supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode} Translation`}
                    </button>
                  </div>

                </form>
              </motion.div>
            ) : (
              <motion.div
                key="form-closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 rounded-lg p-10 shadow-sm text-center space-y-4 border-dashed py-16"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500 border border-blue-105">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-sm font-black text-slate-800">Dynamic Commercial Tariff Rules</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Configure detention penalties, fuel surcharge percentages, chassis holding fees and port gateway expenses.
                    Select an existing surcharge to modify or select "<strong className="text-blue-600">Define New Surcharge</strong>" to create a fresh tariff rule.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleOpenAddNew}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200 transition"
                  >
                    Define New Surcharge
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
