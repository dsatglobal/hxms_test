/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Quotation, LocationGeo, SurchargeRule, TariffRate, ScenarioType, ContainerSizeCode, QuotationRateItem } from '../types';
import { Plus, Check, FileText, ChevronRight, AlertCircle, Sparkles, DollarSign, Trash2, Printer, Eye, RotateCcw, ShieldAlert, ExternalLink, Award, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SURCHARGE_CATALOG, BASE_TARIFFS } from '../data';

interface QuotationWizardProps {
  quotations: Quotation[];
  customers: Customer[];
  locations: LocationGeo[];
  onAddQuotation: (quote: Quotation) => void;
  onConfirmQuotation: (quoteId: string) => void;
  onNavigate: (tab: string) => void;
  onConvertToBooking: (customerId: string, quoteId: string, rateItemId?: string) => void;
}

export default function QuotationWizard({
  quotations,
  customers,
  locations,
  onAddQuotation,
  onConfirmQuotation,
  onNavigate,
  onConvertToBooking
}: QuotationWizardProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'create'>('directory');
  
  // Create state
  const [customerId, setCustomerId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-05-25');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [rates, setRates] = useState<QuotationRateItem[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedSurchargeCodes, setSelectedSurchargeCodes] = useState<string[]>(['FAF', 'PORT_FEE']);
  const [surchargeOverrides, setSurchargeOverrides] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SURCHARGE_CATALOG.forEach(s => {
      initial[s.code] = s.amount;
    });
    return initial;
  });

  // State overrides representing the 7 points of premium commercial logic
  const [paymentTermsOverride, setPaymentTermsOverride] = useState('Net 30 Days');
  const [mqcVolume, setMqcVolume] = useState<number | ''>('');
  const [mqcPeriod, setMqcPeriod] = useState<'Monthly' | 'Quarterly' | 'Yearly' | 'Per Contract'>('Monthly');
  const [version, setVersion] = useState(0);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isHazmatOnly, setIsHazmatOnly] = useState(false);
  const [requiresGenset, setRequiresGenset] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);

  // Trigger auto surcharges based on special equipment cargo options
  React.useEffect(() => {
    if (isHazmatOnly) {
      if (!selectedSurchargeCodes.includes('WASH_FEE')) {
        setSelectedSurchargeCodes(prev => [...prev, 'WASH_FEE']);
      }
    }
  }, [isHazmatOnly]);

  React.useEffect(() => {
    if (requiresGenset) {
      if (!selectedSurchargeCodes.includes('CHAS_HOLD')) {
        setSelectedSurchargeCodes(prev => [...prev, 'CHAS_HOLD']);
      }
    }
  }, [requiresGenset]);

  const [incoterm, setIncoterm] = useState<'FOB' | 'EXW' | 'DAP' | 'DDP' | 'CIF' | 'FCA' | 'FAS' | 'CFR' | 'CIP' | 'CPT'>('FOB');
  const [freightResponsibility, setFreightResponsibility] = useState<'Shipper' | 'Consignee' | 'Third-Party'>('Consignee');
  const [demurrageFreeDays, setDemurrageFreeDays] = useState<number | ''>(7);
  const [detentionFreeDays, setDetentionFreeDays] = useState<number | ''>(5);
  const [demurrageFlatRate, setDemurrageFlatRate] = useState<number | ''>(150);
  const [detentionFlatRate, setDetentionFlatRate] = useState<number | ''>(150);

  // Automatically suggest/adjust freight responsibility based on Incoterm selection
  React.useEffect(() => {
    if (['EXW', 'FCA', 'FAS', 'FOB'].includes(incoterm)) {
      setFreightResponsibility('Consignee');
    } else {
      setFreightResponsibility('Shipper');
    }
  }, [incoterm]);

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
        const overriddenAmt = surchargeOverrides[code] ?? 0;
        return {
          code,
          amount: overriddenAmt
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
    ).map(s => ({
      ...s,
      amount: surchargeOverrides[s.code] ?? s.amount
    }));

    const finalQuoteNo = version > 0 
      ? `QT-22${Math.floor(Math.random() * 9000 + 1000)}-R${version}`
      : `QT-22${Math.floor(Math.random() * 9000 + 1000)}`;

    const newQuote: Quotation = {
      id: `quote-${Date.now()}`,
      quoteNo: finalQuoteNo,
      tenantId: 'tenant-1',
      customerId,
      status,
      effectiveDate,
      expiryDate,
      rates,
      surcharges: calculatedSurcharges,
      notes: notes || undefined,
      paymentTermsOverride,
      mqcVolume: mqcVolume !== '' ? Number(mqcVolume) : undefined,
      mqcPeriod: mqcVolume !== '' ? mqcPeriod : undefined,
      version,
      revisionNotes: revisionNotes || undefined,
      isHazmatOnly,
      requiresGenset,
      incoterm,
      freightResponsibility,
      demurrageFreeDays: demurrageFreeDays !== '' ? Number(demurrageFreeDays) : undefined,
      detentionFreeDays: detentionFreeDays !== '' ? Number(detentionFreeDays) : undefined,
      demurrageFlatRate: demurrageFlatRate !== '' ? Number(demurrageFlatRate) : undefined,
      detentionFlatRate: detentionFlatRate !== '' ? Number(detentionFlatRate) : undefined,
    };

    onAddQuotation(newQuote);
    // Reset wizard
    setCustomerId('');
    setRates([]);
    setNotes('');
    setPaymentTermsOverride('Net 30 Days');
    setMqcVolume('');
    setMqcPeriod('Monthly');
    setVersion(0);
    setRevisionNotes('');
    setIsHazmatOnly(false);
    setRequiresGenset(false);
    setIncoterm('FOB');
    setFreightResponsibility('Consignee');
    setDemurrageFreeDays(7);
    setDetentionFreeDays(5);
    setDemurrageFlatRate(150);
    setDetentionFlatRate(150);
    setSelectedSurchargeCodes(['FAF', 'PORT_FEE']);
    setSurchargeOverrides(() => {
      const initial: Record<string, number> = {};
      SURCHARGE_CATALOG.forEach(s => {
        initial[s.code] = s.amount;
      });
      return initial;
    });
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
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                      <tr>
                        <th className="px-5 py-3">Quotation No & Status</th>
                        <th className="px-5 py-3">Customer Account</th>
                        <th className="px-5 py-3">Validity Period</th>
                        <th className="px-5 py-3">Configured Routes & Rates</th>
                        <th className="px-5 py-3">Active Surcharges</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-600">
                      {quotations.map((quote) => {
                        const customerObj = customers.find(c => c.id === quote.customerId);
                        
                        // Point 1: Reactive validity evaluation
                        const today = new Date('2026-06-03');
                        const exp = new Date(quote.expiryDate);
                        const isExpired = today > exp;
                        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
                        const isExpiringSoon = quote.status === 'confirmed' && diffDays >= 0 && diffDays <= 30;

                        return (
                          <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-mono text-xs text-blue-600 font-extrabold tracking-wider flex items-center gap-1">
                                  {quote.quoteNo}
                                  {(quote.version !== undefined && quote.version > 0) && (
                                    <span className="bg-amber-100 border border-amber-250 text-amber-800 text-[8px] font-sans px-1 rounded">
                                      Rev {quote.version}
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {isExpired ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                                      Expired
                                    </span>
                                  ) : isExpiringSoon ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                      Expiring (In {diffDays}d)
                                    </span>
                                  ) : quote.status === 'confirmed' ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                                      Active Contract
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                      Draft Proposal
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <h3 className="text-sm font-extrabold text-slate-900 font-sans tracking-tight">
                                  {customerObj ? customerObj.name : 'Unknown Account'}
                                </h3>
                                <div className="flex flex-wrap gap-1 items-center">
                                  {customerObj && (
                                    <span className="text-[10px] text-slate-400 font-mono pr-2">Tax ID: {customerObj.taxId}</span>
                                  )}
                                  {/* Incoterms (Rules of Freight Responsibility) */}
                                  {quote.incoterm && (
                                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 select-none text-[9px] font-mono font-black rounded border border-blue-250 uppercase" title="Rules of Freight Responsibility">
                                      {quote.incoterm} • {quote.freightResponsibility || 'Collect'}
                                    </span>
                                  )}
                                  {/* Point 2: Credits Display */}
                                  {quote.paymentTermsOverride && (
                                    <span className="bg-slate-100/80 hover:bg-slate-200/50 text-slate-600 px-1.5 py-0.2 select-none text-[9px] font-sans font-bold rounded border border-slate-200">
                                      Terms: {quote.paymentTermsOverride}
                                    </span>
                                  )}
                                  {/* Point 3: MQC Volume display */}
                                  {quote.mqcVolume !== undefined && (
                                    <span className="bg-blue-50 text-blue-800 px-1.5 py-0.2 text-[9px] font-sans font-bold rounded border border-blue-100">
                                      MQC: {quote.mqcVolume} TEU / {quote.mqcPeriod}
                                    </span>
                                  )}
                                  {/* Point 7: Special Cargo Warnings */}
                                  {quote.isHazmatOnly && (
                                    <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 text-[9px] font-sans font-black rounded border border-emerald-100 uppercase tracking-wide">
                                      HAZ
                                    </span>
                                  )}
                                  {quote.requiresGenset && (
                                    <span className="bg-sky-50 text-sky-850 px-1.5 py-0.2 text-[9px] font-sans font-black rounded border border-sky-100 uppercase tracking-wide">
                                      GENSET
                                    </span>
                                  )}
                                  {quote.demurrageFreeDays !== undefined && (
                                    <span className="bg-amber-50/70 text-amber-900 px-1.5 py-0.2 text-[9px] font-sans font-bold rounded border border-amber-200" title={`Port Demurrage: ${quote.demurrageFreeDays} Free Days, thereafter $${quote.demurrageFlatRate || 150}/day`}>
                                      Demurrage: {quote.demurrageFreeDays}d Free (${quote.demurrageFlatRate || 150}/d)
                                    </span>
                                  )}
                                  {quote.detentionFreeDays !== undefined && (
                                    <span className="bg-amber-50/70 text-amber-900 px-1.5 py-0.2 text-[9px] font-sans font-bold rounded border border-amber-200" title={`Warehouse Detention: ${quote.detentionFreeDays} Free Days, thereafter $${quote.detentionFlatRate || 150}/day`}>
                                      Detention: {quote.detentionFreeDays}d Free (${quote.detentionFlatRate || 150}/d)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 font-medium">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1 font-bold text-slate-800">
                                  <span>{quote.effectiveDate}</span>
                                  <span className="text-slate-400 font-normal">➔</span>
                                  <span>{quote.expiryDate}</span>
                                </div>
                                <span className="text-[9px] text-slate-405 font-sans pt-0.5 font-semibold">Valid 365 Days Contract</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-1.5 max-w-sm">
                                <div className="flex flex-wrap gap-1.5">
                                  {quote.rates.map((r, idx) => (
                                    <span key={idx} className="bg-slate-50 px-2 py-0.5 rounded text-[10px] border border-slate-200 font-mono text-slate-705 inline-flex items-center gap-1">
                                      <strong className="text-blue-700">{r.scenario}</strong> • {r.containerSize} (${r.baseRate})
                                    </span>
                                  ))}
                                </div>
                                {quote.notes && (
                                  <p className="text-[10px] text-slate-400 italic line-clamp-1" title={quote.notes}>
                                    "{quote.notes}"
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                {quote.surcharges.map((s, idx) => {
                                  const originalSurcharge = SURCHARGE_CATALOG.find(orig => orig.code === s.code);
                                  const isOverridden = originalSurcharge && originalSurcharge.amount !== s.amount;
                                  return (
                                    <span 
                                      key={idx} 
                                      className={`border rounded px-1.5 py-0.5 text-[9px] font-mono font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                                        isOverridden 
                                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                          : 'bg-blue-50 text-blue-800 border-blue-100'
                                      }`}
                                      title={`${s.name} (${s.unit})`}
                                    >
                                      {s.code}: ${s.amount}
                                      {isOverridden && <span className="text-[7px] bg-amber-200 font-sans px-1 text-amber-900 rounded scale-90 font-black">NEG</span>}
                                    </span>
                                  );
                                })}
                                {quote.surcharges.length === 0 && (
                                  <span className="text-slate-400 text-[10px] italic">No Surcharges</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* Point 4: Preview Modal activation */}
                                <button
                                  type="button"
                                  onClick={() => setPreviewQuote(quote)}
                                  className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                                  title="Print Preview Proposal Sheet"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Point 6: Revision triggers */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomerId(quote.customerId);
                                    setEffectiveDate(quote.effectiveDate);
                                    setExpiryDate(quote.expiryDate);
                                    setRates(quote.rates);
                                    setNotes(quote.notes || '');
                                    setPaymentTermsOverride(quote.paymentTermsOverride || 'Net 30 Days');
                                    setMqcVolume(quote.mqcVolume || '');
                                    setMqcPeriod(quote.mqcPeriod || 'Monthly');
                                    setVersion((quote.version || 0) + 1);
                                    setRevisionNotes(`Revision of ${quote.quoteNo} - Rate update`);
                                    setIsHazmatOnly(quote.isHazmatOnly || false);
                                    setRequiresGenset(quote.requiresGenset || false);
                                    setIncoterm(quote.incoterm || 'FOB');
                                    setFreightResponsibility(quote.freightResponsibility || 'Consignee');
                                    setDemurrageFreeDays(quote.demurrageFreeDays !== undefined ? quote.demurrageFreeDays : 7);
                                    setDetentionFreeDays(quote.detentionFreeDays !== undefined ? quote.detentionFreeDays : 5);
                                    setDemurrageFlatRate(quote.demurrageFlatRate !== undefined ? quote.demurrageFlatRate : 150);
                                    setDetentionFlatRate(quote.detentionFlatRate !== undefined ? quote.detentionFlatRate : 150);
                                    setSelectedSurchargeCodes(quote.surcharges.map(s => s.code));
                                    
                                    const overrides: Record<string, number> = {};
                                    SURCHARGE_CATALOG.forEach(s => {
                                      const existing = quote.surcharges.find(sc => sc.code === s.code);
                                      overrides[s.code] = existing ? existing.amount : s.amount;
                                    });
                                    setSurchargeOverrides(overrides);
                                    setActiveTab('create');
                                  }}
                                  className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 hover:text-slate-900 transition"
                                  title="Revise Quote Surcharges/Rates"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                {/* Point 5: Convert Directly to Booking */}
                                {quote.status === 'confirmed' && (
                                  <button
                                    type="button"
                                    onClick={() => onConvertToBooking(quote.customerId, quote.id, quote.rates[0]?.id)}
                                    className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                                    title="Convert directly to container booking order"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Booking
                                  </button>
                                )}

                                {quote.status === 'draft' && (
                                  <button
                                    id={`approve-quote-${quote.id}`}
                                    onClick={() => onConfirmQuotation(quote.id)}
                                    className="bg-green-600 hover:bg-green-700 hover:scale-[1.01] active:scale-[0.99] text-white font-extrabold px-3 py-1.5 rounded text-[10px] inline-flex items-center gap-1 transition shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
            <div className="lg:col-span-12 bg-white border border-slate-200 p-5 rounded-lg space-y-6 shadow-sm">
              
              {/* Part A: Target Customer & Validity Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 bg-slate-50/30 p-4 rounded-lg animate-fade-in">
                <div className="col-span-1 md:col-span-3 border-b border-dashed border-slate-200 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wide font-sans">
                      Part A: Target Customer & Validity Parameters
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono italic font-semibold">General agreement scope</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 font-sans">Target Customer Account *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 font-sans">Agreement Expiration *</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Part B: Commercial Parameters, Incoterms, & Special Equipment Profiles */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-blue-200 bg-blue-50/15 rounded-lg animate-fade-in">
                <div className="col-span-1 md:col-span-5 border-b border-dashed border-blue-200 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wide font-sans">
                      Part B: Commercial Parameters & Special Cargo Profiles
                    </span>
                  </div>
                  <span className="text-[9px] text-blue-500 font-mono italic font-semibold">Incoterms, payment terms & cargo equipment options</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">Payment Terms / Credit Limit</label>
                  <select
                    value={paymentTermsOverride}
                    onChange={(e) => setPaymentTermsOverride(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500"
                  >
                    <option value="Net 30 Days">Net 30 Days (Standard)</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 45 Days">Net 45 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                    <option value="Net 7 Days">Net 7 Days</option>
                    <option value="Prepaid">Prepaid (Prior to Release)</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">Incoterms Rules (Rules of Freight)</label>
                  <select
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-black text-blue-700 bg-blue-50/20 font-sans focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="FOB">FOB (Free On Board)</option>
                    <option value="EXW">EXW (Ex Works)</option>
                    <option value="FCA">FCA (Free Carrier)</option>
                    <option value="FAS">FAS (Free Alongside Ship)</option>
                    <option value="DAP">DAP (Delivered at Place)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                    <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    <option value="CFR">CFR (Cost & Freight)</option>
                    <option value="CPT">CPT (Carriage Paid To)</option>
                    <option value="CIP">CIP (Carriage & Insurance Paid To)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">Freight Responsibility Class</label>
                  <select
                    value={freightResponsibility}
                    onChange={(e) => setFreightResponsibility(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500"
                  >
                    <option value="Consignee">Consignee Pays Freight (Collect)</option>
                    <option value="Shipper">Shipper Pays Freight (Prepaid)</option>
                    <option value="Third-Party">Third-Party Logistics (3PL)</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">Vol Commit (MQC)</label>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={mqcVolume}
                      onChange={(e) => setMqcVolume(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans">Period</label>
                    <select
                      value={mqcPeriod}
                      onChange={(e) => setMqcPeriod(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-805 font-sans focus:outline-none focus:border-blue-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="Per Contract">Per Contract</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Special Cargo Profiles</span>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-755 hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={isHazmatOnly}
                        onChange={(e) => setIsHazmatOnly(e.target.checked)}
                        className="rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                      />
                      <span>Hazardous Cargo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-755 hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={requiresGenset}
                        onChange={(e) => setRequiresGenset(e.target.checked)}
                        className="rounded border-slate-300 accent-blue-600 focus:ring-blue-500"
                      />
                      <span>Genset Required</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Part C: Localized Demurrage & Detention Free-Time Parameter Policies */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-slate-200 bg-slate-50/50 rounded-lg animate-fade-in space-y-0.5 md:space-y-0">
                <div className="col-span-1 md:col-span-4 border-b border-dashed border-slate-200 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wide font-sans">
                      Part C: Localized Demurrage & Detention Free-Time Parameter Policies
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono italic">Highly negotiated client-specific settings</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans flex items-center gap-1">
                    Port Demurrage Free Time (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 7"
                    value={demurrageFreeDays}
                    onChange={(e) => setDemurrageFreeDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[9px] text-slate-400">Permitted calendar days free at port terminals before storage charges apply.</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans flex items-center gap-1">
                    Over-Time Demurrage Flat Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 150"
                      value={demurrageFlatRate}
                      onChange={(e) => setDemurrageFlatRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded pl-6 pr-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400">Daily storage rate ($) assessed after port free-time has expired.</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans flex items-center gap-1">
                    Warehouse Detention Free Time (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={detentionFreeDays}
                    onChange={(e) => setDetentionFreeDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-sans focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[9px] text-slate-400">Permitted holding days at client consignee depot/warehouse before fine.</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide font-sans flex items-center gap-1">
                    Over-Time Detention Flat Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 150"
                      value={detentionFlatRate}
                      onChange={(e) => setDetentionFlatRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded pl-6 pr-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400">Daily cost ($) charged for extra container-on-chassis warehouse retention.</p>
                </div>
              </div>

              {version > 0 && (
                <div className="bg-amber-50/75 border border-amber-250 p-3.5 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Configuring Revision (Round {version})</span>
                  </div>
                  <p className="text-[11px] text-slate-500">You are editing an active revision of this quotation contract. Please specify the commercial justification notes below:</p>
                  <input
                    type="text"
                    placeholder="e.g., Adjusting fuel surcharge due to index shift or terminal congestion updates"
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded px-3 py-1.5 mt-1 text-xs text-amber-900 placeholder:text-amber-300 focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
              )}

              {isHazmatOnly && (
                <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="font-medium animate-pulse">
                    <strong className="font-extrabold uppercase text-[9px] tracking-wide inline-block bg-emerald-100 px-1.5 rounded mr-1.5">Hazmat Verified</strong> 
                    Steam clean Wash Surcharge (<strong>WASH_FEE</strong>) has been automatically selected at default rate ($150.00).
                  </p>
                </div>
              )}

              {requiresGenset && (
                <div className="bg-sky-50/50 border border-sky-200 p-3 rounded-lg flex items-center gap-2.5 text-xs text-sky-850">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <p className="font-medium">
                    <strong className="font-extrabold uppercase text-[9px] tracking-wide inline-block bg-sky-100 px-1.5 rounded mr-1.5">Genset Verified</strong> 
                    Extended chassis idle parking surcharge (<strong>CHAS_HOLD</strong>) is recommended and auto-selected for Night Holdovers.
                  </p>
                </div>
              )}

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
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[9px] font-extrabold">
                          <tr>
                            <th className="px-4 py-2">Scenario</th>
                            <th className="px-4 py-2">Commercial Route</th>
                            <th className="px-4 py-2">Container Size</th>
                            <th className="px-4 py-2 text-right">Base Charge</th>
                            <th className="px-4 py-2 text-right">Remove</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-600">
                          {rates.map((rateLine, index) => {
                            const fromL = locations.find(l => l.id === rateLine.fromLocationId);
                            const toL = locations.find(l => l.id === rateLine.toLocationId);
                            return (
                              <tr key={rateLine.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  <span className="font-mono bg-blue-50 text-blue-700 font-extrabold px-1.5 py-0.5 rounded text-[9px] border border-blue-100">
                                    {rateLine.scenario}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-bold text-slate-800">
                                  <span title={fromL?.name}>{fromL?.code || 'Unknown'}</span>
                                  <span className="text-slate-400 mx-1.5">➔</span>
                                  <span title={toL?.name}>{toL?.code || 'Unknown'}</span>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-500 font-semibold">
                                  {rateLine.containerSize}
                                </td>
                                <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono font-black text-slate-900">
                                  ${rateLine.baseRate}.00
                                </td>
                                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                  <button
                                    id={`remove-draft-line-${rateLine.id}`}
                                    type="button"
                                    onClick={() => handleRemoveRateLine(rateLine.id)}
                                    className="text-slate-400 hover:text-red-650 hover:bg-slate-100 p-1 rounded transition text-red-500"
                                    title="Delete line"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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
                    const currentVal = surchargeOverrides[sch.code] ?? sch.amount;
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
                        <div className={`mt-1.5 w-3.5 h-3.5 rounded border border-slate-300 flex items-center justify-center transition shrink-0 ${
                          active ? 'bg-blue-600 border-blue-600' : 'bg-white'
                        }`}>
                          {active && <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="font-bold text-slate-700 truncate" title={sch.name}>{sch.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Standard: ${sch.amount} • {sch.unit}
                          </div>
                          
                          {/* Surcharge Amount Override Input Field */}
                          <div className="pt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-slate-500 font-medium">Contract Rate ($):</span>
                            <input
                              type="number"
                              min="0"
                              value={currentVal}
                              disabled={!active}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setSurchargeOverrides(prev => ({
                                  ...prev,
                                  [sch.code]: val === '' ? 0 : val
                                }));
                              }}
                              className={`w-16 px-1.5 py-0.5 rounded border text-[11px] font-mono font-bold transition-all ${
                                active 
                                  ? 'bg-white border-blue-300 text-blue-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10' 
                                  : 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            />
                            {active && currentVal !== sch.amount && (
                              <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-250 font-sans px-1 rounded font-extrabold uppercase scale-90 shrink-0">
                                Overridden
                              </span>
                            )}
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

          </motion.div>
        )}
      </AnimatePresence>

      {/* Point 4: Interactive Proposal PDF / Print Preview Sheet Modal */}
      {previewQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print animate-fade-in">
          {/* Custom Print Stylesheet to hide surrounding elements and isolate invoice during system print */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body > div:not(.z-50) {
                display: none !important;
              }
              body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              .print-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                width: 100% !important;
              }
            }
          `}} />

          <div className="bg-white border border-slate-250 shadow-2xl rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col font-sans print-container">
            {/* Modal Header Actions (Hidden in Print) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
               <div className="flex items-center gap-2">
                 <Award className="w-5 h-5 text-blue-600" />
                 <h3 className="text-sm font-bold text-slate-800">Commercial Proposal Print Preview</h3>
               </div>
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => window.print()}
                   className="px-4 py-1.8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition shadow shadow-blue-100"
                 >
                   <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                 </button>
                 <button
                   type="button"
                   onClick={() => setPreviewQuote(null)}
                   className="px-3 py-1.8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-xs font-semibold transition"
                 >
                   Close Preview
                 </button>
               </div>
            </div>

            {/* Official Letterhead Document Sheet */}
            <div className="p-8 sm:p-10 space-y-6 flex-1 text-slate-700 leading-normal">
               
               {/* 1. Header Corporate Badge */}
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-blue-600 pb-5 gap-4">
                 <div>
                   <h1 className="text-xl font-black text-slate-905 tracking-tight font-sans uppercase">
                     Globelink Drayage & Ports Co.
                   </h1>
                   <p className="text-xs text-slate-400 font-mono mt-1">Intermodal Transport • Container Haulage • Wharf Logistics</p>
                   <p className="text-[10px] text-slate-400 mt-0.5">Unit 406A-E, East Terminal, Wharfside Logistics Blvd, Port Area</p>
                 </div>
                 <div className="text-right sm:text-right text-xs">
                   <div className="bg-blue-605 bg-blue-600 text-white px-3 py-1 text-[11px] font-black tracking-widest font-mono rounded inline-block uppercase">
                     Commercial Proposal
                   </div>
                   <p className="text-slate-900 font-mono font-bold mt-2 text-sm">{previewQuote.quoteNo}</p>
                   {previewQuote.version !== undefined && previewQuote.version > 0 && (
                     <p className="text-amber-600 font-bold text-[10px] uppercase font-mono mt-0.5">Amendment Revision {previewQuote.version}</p>
                   )}
                 </div>
               </div>

               {/* 2. Stakeholders & Agreement Timelines */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/75 border border-slate-200/85 p-5 rounded-lg text-xs leading-relaxed">
                 <div className="space-y-1">
                   <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Target Client Account</div>
                   <h4 className="text-sm font-extrabold text-slate-900">
                     {(() => {
                       const c = customers.find(item => item.id === previewQuote.customerId);
                       return c ? c.name : 'Unknown Customer';
                     })()}
                   </h4>
                   <p className="text-[11px] text-slate-505">
                     Tax Identifier Number: {(() => {
                       const c = customers.find(item => item.id === previewQuote.customerId);
                       return c ? c.taxId : 'N/A';
                     })()}
                   </p>
                   <p className="text-[11px] text-slate-505">Commercial Credit Term Limit: <strong className="text-slate-800">{previewQuote.paymentTermsOverride || 'Net 30 Days'}</strong></p>
                    {previewQuote.incoterm && (
                      <p className="text-[11px] text-slate-505">
                        Incoterms Rule: <span className="font-extrabold text-blue-700 font-mono bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">{previewQuote.incoterm}</span>
                        <span className="text-slate-400 font-normal"> (Rules of Freight Responsibility)</span>
                      </p>
                    )}
                    {previewQuote.freightResponsibility && (
                      <p className="text-[11px] text-slate-505">
                        Freight Payment Class: <strong className="text-slate-800">{previewQuote.freightResponsibility === 'Consignee' ? 'Collect (Consignee pays carrier)' : previewQuote.freightResponsibility === 'Shipper' ? 'Prepaid (Shipper pays carrier)' : 'Third-Party Logistics (3PL)'}</strong>
                      </p>
                    )}
                 </div>
                 <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-6">
                   <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Contract Timeline Parameters</div>
                   <div className="flex items-center gap-1.5 font-bold text-slate-900">
                     <span>Effective Date:</span>
                     <span className="font-mono text-blue-700">{previewQuote.effectiveDate}</span>
                   </div>
                   <div className="flex items-center gap-1.5 font-bold text-slate-900">
                     <span>Expiration Date:</span>
                     <span className="font-mono text-red-600">{previewQuote.expiryDate}</span>
                   </div>
                   {previewQuote.mqcVolume !== undefined && (
                     <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[11px]">
                       <span className="font-semibold text-slate-500">Min Quantity Commitment (MQC):</span>
                       <strong className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">{previewQuote.mqcVolume} Containers / {previewQuote.mqcPeriod}</strong>
                     </div>
                   )}
                 </div>
               </div>

               {/* 3. Leg Pricing Lines Table */}
               <div className="space-y-2">
                 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                   Schedule I — Point-to-Point Base Carriage Tariff Rates
                 </h4>
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <table className="w-full text-left text-xs">
                     <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[9px] font-extrabold">
                       <tr>
                         <th className="px-4 py-2.5">Flow Scenario</th>
                         <th className="px-4 py-2.5">Origin Dispatch Node</th>
                         <th className="px-4 py-2.5">Destination Delivery Node</th>
                         <th className="px-4 py-2.5">Container Spec</th>
                         <th className="px-4 py-2.5 text-right">Carriage Rate (Base Fee)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-105 font-medium">
                       {previewQuote.rates.map((rate, rIdx) => {
                         const fromLoc = locations.find(l => l.id === rate.fromLocationId);
                         const toLoc = locations.find(l => l.id === rate.toLocationId);
                         return (
                           <tr key={rate.id || rIdx} className="hover:bg-slate-50/20">
                             <td className="px-4 py-2 text-blue-750 font-bold font-mono text-[10px]">{rate.scenario}</td>
                             <td className="px-4 py-2 font-semibold text-slate-800">{fromLoc ? `${fromLoc.name} (${fromLoc.zone})` : rate.fromLocationId}</td>
                             <td className="px-4 py-2 font-semibold text-slate-800">{toLoc ? `${toLoc.name} (${toLoc.zone})` : rate.toLocationId}</td>
                             <td className="px-4 py-2 font-mono text-[11px] text-slate-500 font-bold">{rate.containerSize}</td>
                             <td className="px-4 py-2 font-mono text-right text-slate-900 font-black">${rate.baseRate.toFixed(2)}</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>

               {/* 4. Authorized Auxiliary Surcharges Table */}
               <div className="space-y-2">
                 <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                   Schedule II — Authorized Auxiliary Surcharges & Accessorial Valuation
                 </h4>
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <table className="w-full text-left text-xs">
                     <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[9px] font-extrabold">
                       <tr>
                         <th className="px-4 py-2.5">Code</th>
                         <th className="px-4 py-2.5 font-sans">Surcharge / Accessorial Category Description</th>
                         <th className="px-4 py-2.5">Trigger Condition</th>
                         <th className="px-4 py-2.5 text-right">Agreement Price (Negotiated)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-105 font-medium">
                       {previewQuote.surcharges.map((sur, sIdx) => {
                         const originalSurcharge = SURCHARGE_CATALOG.find(orig => orig.code === sur.code);
                         const isOverridden = originalSurcharge && originalSurcharge.amount !== sur.amount;
                         return (
                           <tr key={sur.code || sIdx} className="hover:bg-slate-50/20">
                             <td className="px-4 py-2 font-mono text-[10px] font-bold text-slate-800">{sur.code}</td>
                             <td className="px-4 py-2 text-slate-600">{sur.name} ({sur.unit})</td>
                             <td className="px-4 py-2 font-semibold text-[10px] text-slate-400">{sur.autoTrigger}</td>
                             <td className="px-4 py-2 text-right">
                               <div className="inline-flex items-center gap-1 justify-end font-mono">
                                 {isOverridden && (
                                   <span className="text-[8px] font-sans font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded uppercase mr-1.5 shrink-0 scale-90">
                                     Negotiated
                                   </span>
                                 )}
                                 <span className={isOverridden ? 'font-black text-amber-800' : 'font-semibold text-slate-800'}>
                                   ${sur.amount.toFixed(2)}
                                 </span>
                               </div>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>

               
               
                {/* Schedule III — Demurrage & Detention Free-Time Policies */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Schedule III — Demurrage & Detention Free-Time Policies
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-1.5 font-sans">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Port Demurrage Rule</span>
                      </div>
                      <p className="text-slate-605 font-sans leading-normal">
                        The client is granted exactly <strong className="text-blue-700">{previewQuote.demurrageFreeDays !== undefined ? previewQuote.demurrageFreeDays : 7} calendar days</strong> of free time at ocean terminals/port yards. 
                      </p>
                      <p className="text-[11px] text-slate-400 italic font-sans mt-1">
                        Thereafter, a storage surcharge of <strong className="text-slate-705">${previewQuote.demurrageFlatRate !== undefined ? previewQuote.demurrageFlatRate : 150} per day</strong> shall be applied automatically.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-1.5 font-sans">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Warehouse Detention Rule</span>
                      </div>
                      <p className="text-slate-605 font-sans leading-normal">
                        The client is granted exactly <strong className="text-blue-700">{previewQuote.detentionFreeDays !== undefined ? previewQuote.detentionFreeDays : 5} calendar days</strong> of free trailer chassis retention at their private warehouses. 
                      </p>
                      <p className="text-[11px] text-slate-500 italic font-sans mt-1">
                        Thereafter, a chassis holding fee of <strong className="text-slate-705">${previewQuote.detentionFlatRate !== undefined ? previewQuote.detentionFlatRate : 150} per day</strong> shall be assessed and included in the trip invoice.
                      </p>
                    </div>
                  </div>
                </div>



                                  <div className="space-y-4 pt-4 border-t border-slate-200">



                    <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Legal Standard Freight Carriage Terms</div>
                   <p className="text-[10px] text-slate-400 leading-relaxed text-justify font-sans">
                     All transportation services rendered hereunder are subject exclusively to the Globelink drayage standard Terms of Carriage. Demurrage free-time at customer depot is locked at exactly 3 hours per event, after which waiting detention rates apply at $80.00/hour. Base fuel pricing index adjustments are calculated on the first Monday of each operational calendar month based on state petroleum guidelines. Quoted pricing excludes direct customs entry fees, terminal handling storage expenses, or broker clearance charges.
                   </p>
                 </div>

                 {previewQuote.notes && (
                   <div className="bg-slate-50 border border-slate-150 p-4 rounded-lg text-xs leading-relaxed italic">
                     <p className="font-extrabold text-slate-800 uppercase text-[9px] tracking-wide font-mono not-italic mb-1">Contractor Special Clauses / Notes:</p>
                     "{previewQuote.notes}"
                   </div>
                 )}

                 {previewQuote.revisionNotes && (
                   <div className="bg-amber-50/40 border border-amber-200/60 p-4 rounded-lg text-xs leading-relaxed italic">
                     <p className="font-extrabold text-amber-800 uppercase text-[9px] tracking-wide font-mono not-italic mb-1">Revision Amendment Justification Notes:</p>
                     "{previewQuote.revisionNotes}"
                   </div>
                 )}

                 {/* Signature Blocks */}
                 <div className="grid grid-cols-2 gap-10 pt-10 text-xs text-slate-600">
                   <div className="space-y-8">
                     <p className="font-bold text-slate-800">Issued on behalf of Globelink Ports & Drayage Co.</p>
                     <div className="border-b border-slate-200 w-3/4 pt-6"></div>
                     <div>
                       <p className="text-slate-805 font-extrabold">Authorized Commercial Analyst</p>
                       <p className="text-[10px] text-slate-400 mt-0.5">Commercial Contracts Desk</p>
                     </div>
                   </div>
                   <div className="space-y-8">
                     <p className="font-bold text-slate-800">Accepted on behalf of Client Account</p>
                     <div className="border-b border-slate-200 w-3/4 pt-6"></div>
                     <div>
                       <p className="text-slate-805 font-extrabold">Client Representative Name & Title</p>
                       <p className="text-[10px] text-slate-400 mt-0.5">Authorized Billing Officer Signatory</p>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
