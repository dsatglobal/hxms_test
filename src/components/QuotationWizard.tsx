/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Quotation, LocationGeo, SurchargeRule, TariffRate, ScenarioType, ContainerSizeCode, QuotationRateItem } from '../types';
import { Plus, Check, FileText, ChevronRight, AlertCircle, Sparkles, DollarSign, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SURCHARGE_CATALOG, BASE_TARIFFS } from '../data';

interface QuotationWizardProps {
  quotations: Quotation[];
  customers: Customer[];
  locations: LocationGeo[];
  onAddQuotation: (quote: Quotation) => void;
  onConfirmQuotation: (quoteId: string) => void;
  onNavigate: (tab: string) => void;
}

export default function QuotationWizard({
  quotations,
  customers,
  locations,
  onAddQuotation,
  onConfirmQuotation,
  onNavigate
}: QuotationWizardProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'create'>('directory');
  
  // Create state
  const [customerId, setCustomerId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-05-25');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [rates, setRates] = useState<QuotationRateItem[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedSurchargeCodes, setSelectedSurchargeCodes] = useState<string[]>(['FAF', 'PORT_FEE']);

  // Rate item draft state
  const [scenarioType, setScenarioType] = useState<ScenarioType>('IMP');
  const [fromLocId, setFromLocId] = useState('');
  const [toLocId, setToLocId] = useState('');
  const [contSize, setContSize] = useState<ContainerSizeCode>('40HC');
  const [customRate, setCustomRate] = useState<number | ''>('');

  // Lookup zones for automatic base tariff suggestion
  const autoTariffLookup = useMemo(() => {
    if (!fromLocId || !toLocId) return null;
    const fromLoc = locations.find(l => l.id === fromLocId);
    const toLoc = locations.find(l => l.id === toLocId);
    if (!fromLoc || !toLoc) return null;

    const matchedBase = BASE_TARIFFS.find(
      t => t.scenario === scenarioType && 
           t.fromZone === fromLoc.zone && 
           t.toZone === toLoc.zone && 
           t.size === contSize
    );

    return matchedBase ? matchedBase.amount : null;
  }, [fromLocId, toLocId, scenarioType, contSize, locations]);

  // Set suggested rate when auto lookup changes
  React.useEffect(() => {
    if (autoTariffLookup !== null) {
      setCustomRate(autoTariffLookup);
    } else {
      setCustomRate('');
    }
  }, [autoTariffLookup]);

  const handleAddRateLine = () => {
    if (!fromLocId || !toLocId || !customRate) {
      alert('Please fill out Origin, Destination, and Rate values to load this pricing line.');
      return;
    }

    const newLine: QuotationRateItem = {
      id: `qr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      scenario: scenarioType,
      fromLocationId: fromLocId,
      toLocationId: toLocId,
      containerSize: contSize,
      baseRate: Number(customRate),
      additionalSurcharges: selectedSurchargeCodes.map(code => {
        const fullSurcharge = SURCHARGE_CATALOG.find(s => s.code === code);
        return {
          code,
          amount: fullSurcharge ? fullSurcharge.amount : 0
        };
      })
    };

    setRates([...rates, newLine]);
    setFromLocId('');
    setToLocId('');
  };

  const handleRemoveRateLine = (id: string) => {
    setRates(rates.filter(r => r.id !== id));
  };

  const handleSaveQuotation = (status: 'draft' | 'confirmed') => {
    if (!customerId) {
      alert('Please select a Customer for this commercial rate agreement.');
      return;
    }
    if (rates.length === 0) {
      alert('A quotation must contain at least one configured pricing line.');
      return;
    }

    const calculatedSurcharges: SurchargeRule[] = SURCHARGE_CATALOG.filter(s => 
      selectedSurchargeCodes.includes(s.code)
    );

    const newQuote: Quotation = {
      id: `quote-${Date.now()}`,
      quoteNo: `QT-22${Math.floor(Math.random() * 9000 + 1000)}`,
      tenantId: 'tenant-1',
      customerId,
      status,
      effectiveDate,
      expiryDate,
      rates,
      surcharges: calculatedSurcharges,
      notes: notes || undefined
    };

    onAddQuotation(newQuote);
    // Reset wizard
    setCustomerId('');
    setRates([]);
    setNotes('');
    setActiveTab('directory');
  };

  return (
    <div className="space-y-6" id="quotation-module">
      
      {/* Tab Navigation */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <FileText className="text-blue-650 w-5 h-5 animate-pulse" /> Commercial Quotations Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Build specialized customer-specific freight contracts and lock billing rules.
          </p>
        </div>

        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-md">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-1.5 rounded-sm text-xs font-extrabold font-sans transition ${
              activeTab === 'directory' 
                ? 'bg-blue-600 text-white font-bold shadow-sm' 
                : 'text-slate-500 hover:text-slate-855'
            }`}
          >
            Quotation Registry ({quotations.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-sm text-xs font-extrabold font-sans transition flex items-center gap-1.5 ${
              activeTab === 'create' 
                ? 'bg-blue-600 text-white font-bold shadow-sm' 
                : 'text-slate-500 hover:text-slate-855'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Create Proposal
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'directory' ? (
          /* ================== LIST DIRECTORY ================== */
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {quotations.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-white rounded-lg p-10 text-center shadow-xs">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-800 font-bold">No Quotations Found</h3>
                <p className="text-xs text-slate-400 mt-1">Get started by creating your first customer tariff quotation proposal.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow shadow-blue-100"
                >
                  Create Quotation Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotations.map((quote) => {
                  const customerObj = customers.find(c => c.id === quote.customerId);
                  return (
                    <motion.div
                      key={quote.id}
                      className="bg-white border border-slate-200 p-5 rounded-lg flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition space-y-4 relative overflow-hidden"
                      whileHover={{ y: -3 }}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs text-blue-600 font-bold tracking-wider">
                            {quote.quoteNo}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            quote.status === 'confirmed' 
                              ? 'bg-green-50 text-green-755 border border-green-200' 
                              : quote.status === 'draft' 
                              ? 'bg-blue-50 text-blue-755 border border-blue-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {quote.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-800 font-sans truncate">
                            {customerObj ? customerObj.name : 'Unknown Account'}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Valid: {quote.effectiveDate} to {quote.expiryDate}
                          </p>
                        </div>
                        
                        {/* Summary of rate items inside quote */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1.5 text-xs">
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Configured Scenarios</div>
                          <div className="flex flex-wrap gap-1.5">
                            {quote.rates.map((r, idx) => (
                              <span key={idx} className="bg-white px-2 py-1 rounded text-[10px] border border-slate-200 font-mono flex items-center gap-1 text-slate-700 shadow-xs">
                                <strong>{r.scenario}</strong> (${r.baseRate} • {r.containerSize})
                              </span>
                            ))}
                          </div>
                        </div>

                        {quote.notes && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                            "{quote.notes}"
                          </p>
                        )}
                      </div>

                      {/* Bottom action trigger */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-mono text-slate-400">
                          {quote.surcharges.length} Active Surcharges
                        </span>
                        
                        {quote.status === 'draft' ? (
                          <button
                            onClick={() => onConfirmQuotation(quote.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-[10px] flex items-center gap-1 transition shadow-sm"
                          >
                            <Check className="w-3 h-3" /> Approve Agreement
                          </button>
                        ) : (
                          <div className="text-xs text-green-600 flex items-center gap-1 font-bold">
                            <Check className="w-3.5 h-3.5" /> Quotation Locked
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* ================== CREATE TARIFF BUILDER ================== */
          <motion.div
            key="create-wizard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Form Column */}
            <div className="lg:col-span-8 bg-white border border-slate-200 p-5 rounded-lg space-y-6 shadow-sm">
              
              {/* Client & Date Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 font-sans">Target Customer Account *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.taxId})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 font-sans">Agreement Effective *</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 font-sans">Agreement Expiration *</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Build Tariff Pricing Leg */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-650 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Append Scenario Pricing Lines
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Build point-to-point legs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Scenario Type</label>
                    <select
                      value={scenarioType}
                      onChange={(e) => setScenarioType(e.target.value as ScenarioType)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="IMP">IMP (Import)</option>
                      <option value="EXP">EXP (Export)</option>
                      <option value="Inland">Inland Moves</option>
                      <option value="EMTY">EMTY Reposition</option>
                      <option value="RETURN">RETURN Depot</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Origin Node</label>
                    <select
                      value={fromLocId}
                      onChange={(e) => setFromLocId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">Origin Node...</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Destination Node</label>
                    <select
                      value={toLocId}
                      onChange={(e) => setToLocId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="">Destination Node...</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Container / Size</label>
                    <select
                      value={contSize}
                      onChange={(e) => setContSize(e.target.value as ContainerSizeCode)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="20GP">20GP - Standard (8'6)</option>
                      <option value="40GP">40GP - Heavy (8'6)</option>
                      <option value="40HC">40HC - High Cube (9'6)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 flex justify-between">
                      Base Charge
                      {autoTariffLookup !== null && (
                        <span className="text-[9px] text-blue-600 font-mono font-bold">Auto Suggest</span>
                      )}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                      <input
                        type="number"
                        placeholder="Rate in USD"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded pl-6 pr-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 md:col-span-5 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddRateLine}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Append Rate Leg
                    </button>
                  </div>
                </div>
              </div>

              {/* Installed / Active pricing list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500">Negotiated Rate Leg Register ({rates.length})</h4>
                {rates.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 bg-slate-50 rounded text-xs text-slate-400 font-sans italic">
                    Add at least one point-to-point pricing leg to calculate commercial parameters.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                    {rates.map((rateLine, index) => {
                      const fromL = locations.find(l => l.id === rateLine.fromLocationId);
                      const toL = locations.find(l => l.id === rateLine.toLocationId);
                      return (
                        <div key={rateLine.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded border border-slate-200 hover:border-slate-300 text-xs transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-mono bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                              {rateLine.scenario}
                            </span>
                            <div>
                              <div className="font-bold text-slate-800">
                                {fromL?.name || 'Unknown'} ➔ {toL?.name || 'Unknown'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Chassis: {rateLine.containerSize} • Includes Fuel FAF/Surcharges
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right font-sans font-bold text-slate-900">
                              ${rateLine.baseRate}.00
                            </div>
                            <button
                              onClick={() => handleRemoveRateLine(rateLine.id)}
                              className="text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Surcharge configs checkboxes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 border-b border-slate-150 pb-1.5 flex items-center justify-between">
                  <span>Authorized Auxiliary Surcharges</span>
                  <span className="text-[10px] font-mono text-slate-400">Auto-billed on demand</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {SURCHARGE_CATALOG.map((sch) => {
                    const active = selectedSurchargeCodes.includes(sch.code);
                    return (
                      <div 
                        key={sch.code}
                        onClick={() => {
                          setSelectedSurchargeCodes(prev => 
                            prev.includes(sch.code) 
                              ? prev.filter(c => c !== sch.code)
                              : [...prev, sch.code]
                          );
                        }}
                        className={`p-3 rounded-lg border text-xs cursor-pointer select-none flex items-start gap-2.5 transition ${
                          active 
                            ? 'bg-blue-50/60 border-blue-200 text-slate-800 font-semibold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'
                        }`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded border border-slate-300 flex items-center justify-center transition ${
                          active ? 'bg-blue-600 border-blue-600' : 'bg-white'
                        }`}>
                          {active && <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />}
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="font-bold text-slate-700">{sch.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Amount: ${sch.amount} • {sch.unit}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes Context and Terms */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Logistics Caveats & Special Clauses (Pre-Invoice Contract Notes)</label>
                <textarea
                  placeholder="Insert custom demurrage terms, extended chassis hold over clauses, free hours at customer site restrictions, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500 h-20 leading-relaxed transition-all"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
                >
                  Cancel proposal
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveQuotation('draft')}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 bg-white text-slate-705 font-bold rounded text-xs transition"
                  >
                    Save Draft Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveQuotation('confirmed')}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-sm shadow-blue-100"
                  >
                    Confirm & Publish Contract
                  </button>
                </div>
              </div>

            </div>

            {/* Simulation Helpers & Informational Column */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-6">
              
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" /> Operational Scenarios
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                  Haulage logistics requires managing double-legged movements. Creating explicit point-to-point legs in your quotation ensures billing transparency.
                </p>
                <p className="text-xs text-blue-700 leading-relaxed font-semibold">
                  Confirming a quotation secures the electronic rate validation. Instantly generate Job orders linking actual cargo containers without manually entering numbers.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">System Tariff Index</div>
                
                <div className="space-y-2 max-h-[195px] overflow-y-auto text-[11px] font-sans">
                  {BASE_TARIFFS.map((t) => (
                    <div key={t.id} className="p-2.5 bg-white rounded border border-slate-200 flex justify-between items-center shadow-xs">
                      <div>
                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="bg-blue-50 border border-blue-200 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold text-blue-700">
                            {t.scenario}
                          </span>
                          {t.fromZone}
                        </div>
                        <div className="text-slate-400 text-[10px] ml-1 pt-0.5">➔ {t.toZone} / {t.size}</div>
                      </div>
                      <span className="font-mono font-bold text-slate-800">${t.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
