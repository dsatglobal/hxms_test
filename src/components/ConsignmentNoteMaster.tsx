/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ConsignmentNote, Job, Customer, LocationGeo } from '../types';
import { 
  FileText, 
  Search, 
  Printer, 
  Globe2, 
  Signature, 
  CheckCircle2, 
  Eye, 
  X, 
  ChevronRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Language Dictionaries for dual language prints
const TRANSLATIONS: Record<string, Record<string, string>> = {
  AR: {
    consignment_note: "تذكرة الشحن / وثيقة شحن",
    cn_serial: "الرقم التسلسلي لوثيقة الشحن",
    customer: "العميل / المستورد",
    container_no: "رقم الحاوية",
    seal_no: "رقم الختم الجمركي",
    leg_transit: "وضع النقل والترانزيت",
    origin: "نقطة انطلاق الشحنة",
    destination: "وجهة التسليم النهائية",
    weight: "الوزن الإجمالي المصرح به",
    recipient_sig: "توقيع المستلم وتأكيد الاستلام",
    status: "حالة الوثيقة",
    carrier_disclaimer: "الشروط العامة: مسؤولية الناقل خاضعة للوائح النقل البري المعمول بها ومراجعة بوابات الجمارك مسبقاً."
  },
  FR: {
    consignment_note: "LETTRE DE VOITURE / NOTE DE CONSIGNATION",
    cn_serial: "Numéro de Série CN",
    customer: "Client / Importateur",
    container_no: "Numéro de Conteneur",
    seal_no: "Numéro de Scellé",
    leg_transit: "Mode Transit & Transit Leg",
    origin: "Terminal d'Origine",
    destination: "Destination Finale",
    weight: "Masse Brut Déclaré",
    recipient_sig: "Signature du Destinataire & Accusé",
    status: "Statut du Document",
    carrier_disclaimer: "Conditions Générales: La responsabilité du transporteur est régie par la législation nationale sur le transport routier routier local."
  },
  BM: {
    consignment_note: "NOTA KONSIGNASI / SURAT CARA ANGKUTAN",
    cn_serial: "No Siri Surat Konsignasi",
    customer: "Pelanggan / Pengimport",
    container_no: "No Kontena",
    seal_no: "No Metri Kuatkuasa",
    leg_transit: "Mod Koridor Transit",
    origin: "Lokasi Asal Terminal",
    destination: "Destinasi Destinasi Utama",
    weight: "Berat Kasar Diisytiharkan",
    recipient_sig: "Tandatangan Penerima & Tarikh",
    status: "Status Dokumen",
    carrier_disclaimer: "Terma Am: Liabiliti pembawa tertakluk di bawah Seksyen Pengangkutan Jalan Tempatan dengan pematuhan kastam pelabuhan penuh."
  },
  TA: {
    consignment_note: "ஏற்றுமதி வழிசீட்டு / சரக்கு அனுப்பீட்டு குறிப்பு",
    cn_serial: "சரக்கு அனுப்பீட்டு வரிசை எண்",
    customer: "வாடிக்கையாளர் / இறக்குமதியாளர்",
    container_no: "கொள்கலன் எண்",
    seal_no: "முத்திரை எண்",
    leg_transit: "போக்குவரத்து முறை",
    origin: "துவக்க துறைமுகம்",
    destination: "இறுதி சேருமிடம்",
    weight: "மொத்த எடை அறிவிப்பு",
    recipient_sig: "பெறுநர் கையொப்பம்",
    status: "ஆவண நிலை",
    carrier_disclaimer: "பொதுவான விதிமுறைகள்: உள்ளூர் சாலை போக்குவரத்து சட்டங்களின்படி கேரியர் பொறுப்பு வரம்புகளுக்கு உட்பட்டது."
  }
};

interface ConsignmentNoteMasterProps {
  consignmentNotes: ConsignmentNote[];
  jobs: Job[];
  customers: Customer[];
  locations: LocationGeo[];
  onUpdateCns?: (cns: ConsignmentNote[]) => void;
}

export default function ConsignmentNoteMaster({
  consignmentNotes,
  jobs,
  customers,
  locations,
  onUpdateCns
}: ConsignmentNoteMasterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'issued' | 'signed'>('all');
  const [selectedCnId, setSelectedCnId] = useState<string | null>(null);
  const [printCnId, setPrintCnId] = useState<string | null>(null);
  
  // Locale Selector for printed template
  const [selectedLanguage, setSelectedLanguage] = useState<'AR' | 'FR' | 'BM' | 'TA'>('AR');

  // Recipient signature state
  const [signName, setSignName] = useState('');
  const [isSigningOpen, setIsSigningOpen] = useState(false);

  // Filters
  const filteredCns = useMemo(() => {
    return consignmentNotes.filter(cn => {
      const job = jobs.find(j => j.id === cn.jobId);
      const customer = job ? customers.find(c => c.id === job.customerId) : null;

      const matchesSearch = 
        cn.cnNo.toLowerCase().includes(search.toLowerCase()) ||
        job?.jobNo.toLowerCase().includes(search.toLowerCase()) ||
        job?.containerNo.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || cn.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [consignmentNotes, jobs, customers, search, statusFilter]);

  // Selected Detail Object
  const activeCn = useMemo(() => {
    if (!selectedCnId) return consignmentNotes[0] || null;
    return consignmentNotes.find(c => c.id === selectedCnId) || consignmentNotes[0] || null;
  }, [consignmentNotes, selectedCnId]);

  const activeJob = useMemo(() => {
    if (!activeCn) return null;
    return jobs.find(j => j.id === activeCn.jobId) || null;
  }, [jobs, activeCn]);

  const activeCustomer = useMemo(() => {
    if (!activeJob) return null;
    return customers.find(c => c.id === activeJob.customerId) || null;
  }, [customers, activeJob]);

  const fromLoc = useMemo(() => {
    if (!activeJob) return null;
    return locations.find(l => l.id === activeJob.originLocationId) || null;
  }, [locations, activeJob]);

  const toLoc = useMemo(() => {
    if (!activeJob) return null;
    return locations.find(l => l.id === activeJob.destinationLocationId) || null;
  }, [locations, activeJob]);

  // Printable references
  const printCn = useMemo(() => {
    if (!printCnId) return null;
    return consignmentNotes.find(c => c.id === printCnId) || null;
  }, [consignmentNotes, printCnId]);

  const printJob = useMemo(() => {
    if (!printCn) return null;
    return jobs.find(j => j.id === printCn.jobId) || null;
  }, [jobs, printCn]);

  const printCustomer = useMemo(() => {
    if (!printJob) return null;
    return customers.find(c => c.id === printJob.customerId) || null;
  }, [customers, printJob]);

  const printFromLoc = useMemo(() => {
    if (!printJob) return null;
    return locations.find(l => l.id === printJob.originLocationId) || null;
  }, [locations, printJob]);

  const printToLoc = useMemo(() => {
    if (!printJob) return null;
    return locations.find(l => l.id === printJob.destinationLocationId) || null;
  }, [locations, printJob]);

  // Handle Recipient Digital Sign-off
  const executeRecipientSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim() || !activeCn) return;

    const updated = consignmentNotes.map(cn => {
      if (cn.id === activeCn.id) {
        return {
          ...cn,
          status: 'signed' as const,
          recipientSignedBy: signName,
          signatureTimestamp: new Date().toISOString()
        };
      }
      return cn;
    });

    if (onUpdateCns) {
      onUpdateCns(updated);
    } else {
      // In-line mutation if state callback missing
      activeCn.status = 'signed';
      activeCn.recipientSignedBy = signName;
      activeCn.signatureTimestamp = new Date().toISOString();
      const storedKey = Object.keys(localStorage).find(k => k.endsWith('_cns'));
      if (storedKey) {
        localStorage.setItem(storedKey, JSON.stringify(updated));
      }
    }

    setIsSigningOpen(false);
    setSignName('');
    alert(`Recipient signature validated. Consignment ${activeCn.cnNo} flagged as completed/signed.`);
  };

  const currentLangDict = TRANSLATIONS[selectedLanguage];

  return (
    <div className="space-y-6" id="cn-master-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600 w-5 h-5" /> Standalone Consignment Notes (CN) Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate bill of lading equivalents, configure dual-language layout templates, print physical receipt cards, and log consignee hand-overs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-slate-400" />
          <select
            id="cn-lang-selector"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as any)}
            className="bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="AR">Arabic / English (العربية)</option>
            <option value="FR">French / English (Français)</option>
            <option value="BM">Malay / English (Bahasa Melayu)</option>
            <option value="TA">Tamil / English (தமிழ்)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: List to filter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="cn-search-input"
                type="text"
                placeholder="Search CN serial, Job No, Container or Client..."
                className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-700 font-sans focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded text-[11px] font-sans font-bold">
              <button
                id="cn-filter-all"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                id="cn-filter-draft"
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'draft' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Draft
              </button>
              <button
                id="cn-filter-issued"
                onClick={() => setStatusFilter('issued')}
                className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'issued' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Issued
              </button>
              <button
                id="cn-filter-signed"
                onClick={() => setStatusFilter('signed')}
                className={`px-3 py-1 rounded-sm transition-all ${statusFilter === 'signed' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Signed
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredCns.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-white rounded-lg py-12 text-center text-xs text-slate-400 font-sans italic">
                No Consignment Notes registered under the active filters.
              </div>
            ) : (
              filteredCns.map((cn) => {
                const jobObj = jobs.find(j => j.id === cn.jobId);
                const cust = jobObj ? customers.find(c => c.id === jobObj.customerId) : null;
                const isSelected = activeCn?.id === cn.id;

                return (
                  <div
                    key={cn.id}
                    id={`cn-card-${cn.id}`}
                    onClick={() => setSelectedCnId(cn.id)}
                    className={`bg-white border rounded-lg p-4 cursor-pointer transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/5' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{cn.cnNo}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-sans font-bold uppercase border ${
                          cn.status === 'signed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : cn.status === 'issued' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {cn.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-semibold truncate max-w-[280px]">
                        {cust?.name || 'Loading Client...'}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        EQ: <strong className="text-slate-600">{jobObj?.containerNo || 'N/A'}</strong> • {jobObj?.scenario}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`cn-print-icon-${cn.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintCnId(cn.id);
                        }}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded border border-slate-200"
                        title="Print CN Sheet"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'translate-x-1 text-blue-600' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Info details, sign-off card */}
        <div className="lg:col-span-5">
          {activeCn ? (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden" id="cn-detail-panel">
              <div className="bg-slate-800 border-b border-slate-700 text-white p-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-black">HAULIER MANIFEST NOTE</span>
                  <h2 className="text-sm font-bold font-mono tracking-tight text-white mt-0.5">{activeCn.cnNo}</h2>
                </div>
                
                <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-black uppercase border ${
                  activeCn.status === 'signed' 
                    ? 'bg-green-600/30 text-green-300 border-green-500' 
                    : activeCn.status === 'issued' 
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                    : 'bg-slate-600/30 text-slate-300 border-slate-500'
                }`}>
                  {activeCn.status}
                </span>
              </div>

              <div className="p-5 space-y-4 font-sans text-xs">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-450 uppercase font-mono text-slate-400">Business Consigner</div>
                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Client:</span>
                      <span className="text-slate-800 font-bold">{activeCustomer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tax ID Reference:</span>
                      <span className="text-slate-800 font-mono">{activeCustomer?.taxId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email Contact:</span>
                      <span className="text-slate-800 truncate max-w-[200px]">{activeCustomer?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-450 uppercase font-mono text-slate-400">Cargo Information</div>
                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Container Serial:</span>
                      <strong className="text-slate-800 font-bold">{activeJob?.containerNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customs Seal No:</span>
                      <strong className="text-slate-800 font-bold">{activeJob?.sealNo}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Equipment Size:</span>
                      <strong className="text-slate-800 font-bold">{activeJob?.containerSize}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gross cargo Weight:</span>
                      <strong className="text-slate-800 font-bold">{activeJob?.weightKg.toLocaleString()} KG</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-450 uppercase font-mono text-slate-400">Operational Log Corridor</div>
                  <div className="border border-slate-200 p-3 rounded space-y-2 text-[11px] leading-relaxed">
                    <div className="font-semibold text-slate-600">Route leg ({activeJob?.scenario}):</div>
                    <div className="font-mono text-slate-700 bg-slate-100 border border-slate-200/60 p-2 rounded">
                      <div>FROM: {fromLoc?.name} ({fromLoc?.code})</div>
                      <div className="text-blue-600 my-0.5 font-bold">➔ TRANSIT CORRIDOR ➔</div>
                      <div>TO: {toLoc?.name} ({toLoc?.code})</div>
                    </div>
                  </div>
                </div>

                {/* Receiver Actions */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800">Direct Recipient Sign-off</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Log physical consignee delivery confirmation on site.</p>
                    </div>
                  </div>

                  {activeCn.status === 'signed' ? (
                    <div className="bg-green-50 border border-green-200 p-3 rounded font-bold text-green-800">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Shipment Signed For Successfully</span>
                      </div>
                      <div className="font-normal text-[11px] text-green-700 mt-1 pl-5">
                        <p>Receiver Name: <strong className="font-black">{activeCn.recipientSignedBy}</strong></p>
                        <p>Timestamp: <span className="font-mono font-bold">{new Date(activeCn.signatureTimestamp || '').toLocaleString()}</span></p>
                      </div>
                    </div>
                  ) : activeCn.status === 'issued' ? (
                    isSigningOpen ? (
                      <form onSubmit={executeRecipientSignOff} className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">Recipient Full name *</label>
                          <input
                            id="cn-recipient-sign-name"
                            type="text"
                            placeholder="e.g. Jean-Luc Picard"
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none"
                            value={signName}
                            onChange={(e) => setSignName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex gap-2 justify-end text-[10px]">
                          <button
                            id="cn-cancel-sign-btn"
                            type="button"
                            onClick={() => {
                              setIsSigningOpen(false);
                              setSignName('');
                            }}
                            className="px-3 py-1 bg-slate-100 text-slate-500 hover:text-slate-800 rounded font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            id="cn-confirm-sign-btn"
                            type="submit"
                            className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Signature className="w-3 h-3" /> Commit Digital Signature
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        id="cn-open-sign-btn"
                        onClick={() => setIsSigningOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 rounded-md text-xs transition flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Signature className="w-4 h-4" /> Simulate Consignee Delivery Signature
                      </button>
                    )
                  ) : (
                    <div className="text-[11px] text-amber-600 bg-amber-50 rounded border border-amber-200 p-3 italic">
                      This Consignment Note is under draft. Confirm the gate-pass ROT to issue this CN for deliveries and sign-offs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 bg-white rounded-lg py-12 text-center text-xs text-slate-400 font-sans italic shadow-sm">
              No CNs created yet. Link a confirmed quotation to spawn draft manifests.
            </div>
          )}
        </div>
      </div>

      {/* Multilingual Printable template modal dialogue overlay */}
      <AnimatePresence>
        {printCnId && printCn && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-2xl w-full border border-slate-300 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Close Cross icon */}
              <button 
                id="close-cn-print-modal"
                onClick={() => setPrintCnId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1 bg-slate-100 rounded-full z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Printable container */}
              <div className="p-8 overflow-y-auto space-y-6" id="cn-bilingual-print-body">
                {/* Print Title block in dual language */}
                <div className="border-b-2 border-slate-900 pb-5 text-center relative space-y-1">
                  <div className="font-extrabold tracking-widest text-slate-500 text-[10px] uppercase font-mono">BILINGUAL HAULAGE CONSIGNMENT SHEET</div>
                  <h1 className="text-lg font-black font-sans text-slate-950 uppercase tracking-tight">CONSIGNMENT NOTE (C.N.)</h1>
                  <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide font-sans">{currentLangDict.consignment_note}</h2>
                  <div className="font-mono text-xs text-slate-500 font-bold mt-1">
                    CN SERIAL: {printCn.cnNo} • {currentLangDict.cn_serial}
                  </div>
                  <div className="absolute top-0 left-0">
                    <span className="bg-slate-950 text-white font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase select-none">HMS-SAAS</span>
                  </div>
                </div>

                {/* Printable Fields Table in Dual Language */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                  {/* Field 1: Customer */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>CUSTOMER REGISTERED</span>
                      <span className="text-right">{currentLangDict.customer}</span>
                    </div>
                    <strong className="text-slate-900 block font-bold text-sm">{printCustomer?.name}</strong>
                  </div>

                  {/* Field 2: Leg scenario */}
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>TRANSIT CORRIDOR</span>
                      <span className="text-right">{currentLangDict.leg_transit}</span>
                    </div>
                    <strong className="text-blue-700 block font-bold font-mono uppercase">[{printJob?.scenario}] Inter-Zone Leg</strong>
                  </div>

                  {/* Field 3: Container ID */}
                  <div className="space-y-1 border-b border-slate-100 pb-2">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>CONTAINER SERIAL ID</span>
                      <span className="text-right">{currentLangDict.container_no}</span>
                    </div>
                    <strong className="text-slate-900 block font-mono font-bold text-sm mt-1">{printJob?.containerNo || 'N/A'}</strong>
                  </div>

                  {/* Field 4: Seal No */}
                  <div className="space-y-1 border-b border-slate-100 pb-2">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>CUSTOMS SEAL BULLET ID</span>
                      <span className="text-right">{currentLangDict.seal_no}</span>
                    </div>
                    <strong className="text-slate-900 block font-mono font-bold text-sm mt-1">{printJob?.sealNo || 'N/A'}</strong>
                  </div>

                  {/* Field 5: Origin */}
                  <div className="space-y-1 border-b border-slate-100 pb-2 col-span-2">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>TRANSIT DEPOT RANGE ORIGIN</span>
                      <span className="text-right">{currentLangDict.origin}</span>
                    </div>
                    <strong className="text-slate-800 text-xs mt-1 block">{printFromLoc?.name} ({printFromLoc?.code})</strong>
                  </div>

                  {/* Field 6: Destination */}
                  <div className="space-y-1 border-b border-slate-100 pb-2 col-span-2">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>DELIVERY POINT DESPATCH</span>
                      <span className="text-right">{currentLangDict.destination}</span>
                    </div>
                    <strong className="text-slate-800 text-xs mt-1 block">{printToLoc?.name} ({printToLoc?.code})</strong>
                  </div>

                  {/* Field 7: Weight */}
                  <div className="space-y-2 col-span-2 pt-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                      <span>OFFICIAL WEIGHT CERTIFIED</span>
                      <span className="text-right">{currentLangDict.weight}</span>
                    </div>
                    <strong className="text-slate-900 block font-mono font-bold whitespace-nowrap">
                      {printJob?.weightKg.toLocaleString()} KG • {Math.round((printJob?.weightKg || 1) * 2.20462).toLocaleString()} LBS (Dual standard)
                    </strong>
                  </div>
                </div>

                {/* General Disclaimer Carrier block in dual language */}
                <div className="border border-slate-200 bg-slate-50 rounded-lg p-4 text-[10px] text-slate-500 leading-relaxed font-sans font-medium space-y-2.5">
                  <p className="font-bold text-slate-700">HMS Conditions of Carriage / حد المخطط والشروط القانونية:</p>
                  <p>{currentLangDict.carrier_disclaimer}</p>
                  <p>English Translation: Cargo remains at owner's liability inside depots after road tax validations have been completed unless gross misconduct is proved by local terminal authorities.</p>
                </div>

                {/* Handover signs and stamps */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
                  <div className="text-center pt-8 border-t border-dashed border-slate-300 space-y-1">
                    <div className="text-[10px] font-mono font-bold text-slate-400">DESPATCH COURIER STAMP</div>
                    <div className="font-black text-slate-800 italic mt-1">ATLAS CENTRAL LINES</div>
                  </div>
                  <div className="text-center pt-8 border-t border-dashed border-slate-300 space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-400 flex justify-between">
                      <span>CONSIGNEE RECEIVER SIGN</span>
                      <span>{currentLangDict.recipient_sig}</span>
                    </div>
                    {printCn.status === 'signed' ? (
                      <div className="font-sans font-extrabold text-blue-600 bg-blue-50 py-1 rounded inline-block px-3 border border-blue-200">
                        Signed: {printCn.recipientSignedBy}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic mt-1">Signature Pending Site Handover</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom footer button area */}
              <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3 justify-end shrink-0">
                <button
                  id="cancel-cn-print"
                  onClick={() => setPrintCnId(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-850 rounded text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  id="execute-cn-print"
                  onClick={() => {
                    alert(`Document ${printCn.cnNo} processed successfully with dual language ${selectedLanguage} printing template.`);
                    printCn.printed = true;
                    setPrintCnId(null);
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Multilingual CN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
