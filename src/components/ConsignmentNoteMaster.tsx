/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ConsignmentNote, Job, Customer, LocationGeo, SupportedLanguage, TranslationEntry, Region, Driver, Vehicle } from '../types';
import {
  FileText, Printer, Globe2, Signature, CheckCircle2, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection, DrawerField, DrawerFieldGrid } from './shared/DetailDrawer';
import { T, badgeClass, statusLabel } from './shared/ui';

interface ConsignmentNoteMasterProps {
  consignmentNotes: ConsignmentNote[];
  jobs: Job[];
  customers: Customer[];
  locations: LocationGeo[];
  onUpdateCns?: (cns: ConsignmentNote[]) => void;
  translations: TranslationEntry[];
  supportedLanguages: SupportedLanguage[];
  regions: Region[];
  drivers?: Driver[];
  vehicles?: Vehicle[];
}

export default function ConsignmentNoteMaster({
  consignmentNotes, jobs, customers, locations, onUpdateCns,
  translations, supportedLanguages, regions, drivers = [], vehicles = [],
}: ConsignmentNoteMasterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedCnId, setSelectedCnId] = useState<string | null>(null);
  const [printCnId, setPrintCnId] = useState<string | null>(null);

  // Recipient signature state
  const [signName, setSignName] = useState('');
  const [isSigningOpen, setIsSigningOpen] = useState(false);

  const jobOf = (cn: ConsignmentNote) => jobs.find(j => j.id === cn.jobId) || null;
  const customerOf = (job: Job | null) => (job ? customers.find(c => c.id === job.customerId) || null : null);
  // CN type has no explicit issue date; derive from the linked job's schedule
  const issueDateOf = (cn: ConsignmentNote) => {
    const job = jobOf(cn);
    return job?.scheduledTime ? job.scheduledTime.slice(0, 10) : (job?.createdAt ?? '').slice(0, 10);
  };

  const filteredCns = useMemo(() => {
    return consignmentNotes.filter(cn => {
      const job = jobOf(cn);
      const customer = customerOf(job);
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        cn.cnNo.toLowerCase().includes(q) ||
        (job?.jobNo.toLowerCase().includes(q) ?? false) ||
        (job?.containerNo.toLowerCase().includes(q) ?? false) ||
        (customer?.name.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === 'all' || cn.status === statusFilter;
      const matchesCustomer = !customerFilter || job?.customerId === customerFilter;
      const issue = issueDateOf(cn);
      const matchesDate =
        (!dateRange.from || (issue && issue >= dateRange.from)) &&
        (!dateRange.to || (issue && issue <= dateRange.to));
      return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
    });
  }, [consignmentNotes, jobs, customers, search, statusFilter, customerFilter, dateRange]);

  const activeCn = consignmentNotes.find(c => c.id === selectedCnId) || null;
  const activeJob = activeCn ? jobOf(activeCn) : null;
  const activeCustomer = customerOf(activeJob);
  const fromLoc = activeJob ? locations.find(l => l.id === activeJob.originLocationId) || null : null;
  const toLoc = activeJob ? locations.find(l => l.id === activeJob.destinationLocationId) || null : null;

  const printCn = printCnId ? consignmentNotes.find(c => c.id === printCnId) || null : null;

  const executeRecipientSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim() || !activeCn) return;
    const updated = consignmentNotes.map(cn =>
      cn.id === activeCn.id
        ? { ...cn, status: 'signed' as const, recipientSignedBy: signName, signatureTimestamp: new Date().toISOString() }
        : cn
    );
    if (onUpdateCns) {
      onUpdateCns(updated);
    } else {
      activeCn.status = 'signed';
      activeCn.recipientSignedBy = signName;
      activeCn.signatureTimestamp = new Date().toISOString();
      const storedKey = Object.keys(localStorage).find(k => k.endsWith('_cns'));
      if (storedKey) localStorage.setItem(storedKey, JSON.stringify(updated));
    }
    setIsSigningOpen(false);
    setSignName('');
    alert(`Recipient signature validated. Consignment ${activeCn.cnNo} flagged as completed/signed.`);
  };

  const columns: DataTableColumn<ConsignmentNote>[] = [
    {
      key: 'cnNo', header: 'CN No', sortValue: c => c.cnNo,
      render: c => <span className={T.cellId}>{c.cnNo}</span>,
    },
    {
      key: 'jobNo', header: 'Job No', sortValue: c => jobOf(c)?.jobNo ?? '',
      render: c => <span className={T.cellId}>{jobOf(c)?.jobNo ?? '—'}</span>,
    },
    {
      key: 'customer', header: 'Customer', sortValue: c => customerOf(jobOf(c))?.name ?? '',
      render: c => <span className={T.cellPrimary}>{customerOf(jobOf(c))?.name ?? '—'}</span>,
    },
    {
      key: 'container', header: 'Container', sortValue: c => jobOf(c)?.containerNo ?? '',
      render: c => {
        const job = jobOf(c);
        return (
          <div>
            <span className={T.cellId}>{job?.containerNo ?? 'N/A'}</span>
            <span className={`${T.cellMuted} block`}>{job?.scenario}</span>
          </div>
        );
      },
    },
    {
      key: 'issue', header: 'Issue Date', sortValue: c => issueDateOf(c),
      render: c => <span className={T.cellMuted}>{issueDateOf(c) || '—'}</span>,
    },
    {
      key: 'status', header: 'Status', sortValue: c => c.status,
      render: c => <span className={badgeClass(c.status)}>{statusLabel(c.status)}</span>,
    },
  ];

  const activeFilterCount =
    (search ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (customerFilter ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0);

  return (
    <div className="space-y-4" id="cn-master-container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`${T.pageTitle} flex items-center gap-2`}>
            <FileText className="text-blue-600 w-5 h-5" /> Consignment Notes (CN) Register
          </h1>
          <p className={T.pageSubtitle}>Generate bill of lading equivalents, print bilingual receipt sheets, and log consignee hand-overs.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Globe2 className="w-4 h-4" /> Bilingual print supported
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <FilterBar
          searchPlaceholder="Search CN, Job, Container, or Client…"
          searchValue={search}
          onSearchChange={setSearch}
          statusOptions={[
            { value: 'all', label: 'All', count: consignmentNotes.length },
            { value: 'draft', label: 'Draft', count: consignmentNotes.filter(c => c.status === 'draft').length },
            { value: 'issued', label: 'Issued', count: consignmentNotes.filter(c => c.status === 'issued').length },
            { value: 'signed', label: 'Signed', count: consignmentNotes.filter(c => c.status === 'signed').length },
          ]}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          dropdownFilters={[{
            key: 'customer', label: 'Customer',
            options: customers.map(c => ({ value: c.id, label: c.name })),
            value: customerFilter, onChange: setCustomerFilter,
          }]}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          dateRangeLabel="Issued"
          onClearAll={() => { setSearch(''); setStatusFilter('all'); setCustomerFilter(''); setDateRange({ from: '', to: '' }); }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={filteredCns}
          onRowClick={c => { setSelectedCnId(c.id); setIsSigningOpen(false); }}
          rowActions={c => (
            <button
              id={`cn-print-icon-${c.id}`}
              onClick={() => setPrintCnId(c.id)}
              className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Print CN Sheet"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
          emptyState={{
            icon: <FileText className="w-10 h-10" />,
            title: 'No Consignment Notes found',
            subtitle: 'Link a confirmed quotation to spawn draft manifests.',
          }}
        />
      </div>

      {/* Detail drawer */}
      <DetailDrawer
        open={!!activeCn}
        onClose={() => { setSelectedCnId(null); setIsSigningOpen(false); setSignName(''); }}
        title={
          <>
            <span className="font-mono">{activeCn?.cnNo}</span>
            {activeCn && <span className={badgeClass(activeCn.status)}>{statusLabel(activeCn.status)}</span>}
          </>
        }
        subtitle="Haulier Manifest Note"
        headerActions={
          activeCn ? (
            <button
              onClick={() => setPrintCnId(activeCn.id)}
              className="h-8 px-2.5 flex items-center gap-1 rounded-md text-sm text-slate-600 hover:bg-slate-100"
            >
              <Printer className="w-3.5 h-3.5" /> Print Bilingual
            </button>
          ) : undefined
        }
        footer={
          activeCn?.status === 'issued' && !isSigningOpen ? (
            <button
              id="cn-open-sign-btn"
              onClick={() => setIsSigningOpen(true)}
              className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <Signature className="w-4 h-4" /> Consignee Delivery Signature
            </button>
          ) : undefined
        }
      >
        {activeCn && (
          <>
            <DrawerSection title="Business Consigner">
              <DrawerFieldGrid>
                <DrawerField label="Account Client" value={activeCustomer?.name} bold full />
                <DrawerField label="Tax ID" value={activeCustomer?.taxId ? <span className="font-mono text-blue-600">{activeCustomer.taxId}</span> : undefined} />
                <DrawerField label="Email" value={activeCustomer?.email} />
              </DrawerFieldGrid>
            </DrawerSection>

            <DrawerSection title="Cargo Information">
              <DrawerFieldGrid>
                <DrawerField label="Container Serial" value={<span className="font-mono text-blue-600">{activeJob?.containerNo}</span>} />
                <DrawerField label="Customs Seal" value={<span className="font-mono">{activeJob?.sealNo}</span>} />
                <DrawerField label="Equipment Size" value={activeJob?.containerSize} />
                <DrawerField label="Gross Weight" value={activeJob ? `${activeJob.weightKg.toLocaleString()} KG` : undefined} />
                <DrawerField label="Associated Job" value={<span className="font-mono text-blue-600">{activeJob?.jobNo}</span>} />
                <DrawerField label="Scenario" value={activeJob?.scenario} />
              </DrawerFieldGrid>
            </DrawerSection>

            <DrawerSection title="Operational Corridor">
              <div className="font-mono text-xs text-slate-700 bg-slate-100 border border-slate-200/60 p-3 rounded">
                <div>FROM: {fromLoc?.name} ({fromLoc?.code})</div>
                <div className="text-blue-600 my-0.5 font-bold">➔ TRANSIT CORRIDOR ➔</div>
                <div>TO: {toLoc?.name} ({toLoc?.code})</div>
              </div>
            </DrawerSection>

            <DrawerSection title="Recipient Sign-off">
              {activeCn.status === 'signed' ? (
                <div className="bg-green-50 border border-green-200 p-3 rounded font-bold text-green-800 text-xs">
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
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        value={signName}
                        onChange={e => setSignName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end text-[10px]">
                      <button
                        id="cn-cancel-sign-btn"
                        type="button"
                        onClick={() => { setIsSigningOpen(false); setSignName(''); }}
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
                  <p className="text-xs text-slate-500">Log physical consignee delivery confirmation on site using the button below.</p>
                )
              ) : (
                <div className="text-[11px] text-amber-600 bg-amber-50 rounded border border-amber-200 p-3 italic">
                  This Consignment Note is under draft. Confirm the gate-pass ROT to issue this CN for deliveries and sign-offs.
                </div>
              )}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* Multilingual printable modal (preserved) */}
      <AnimatePresence>
        {printCnId && printCn && (() => {
          const pJob = jobs.find(j => j.id === printCn.jobId);
          const pRegion = regions.find(r => r.id === pJob?.regionId || r.code === pJob?.regionId);
          const secondaryLanguageCode = pRegion?.secondaryLanguage || 'ta';
          const secondaryLangConfig = supportedLanguages.find(l => l.code === secondaryLanguageCode) || {
            code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', isRTL: false, isActive: true,
          };
          const isRTL = secondaryLangConfig.isRTL;

          const pDriver = drivers.find(d => d.id === pJob?.driverId);
          const pVehicle = vehicles.find(v => v.id === pJob?.vehicleId);
          const pCustomer = pJob ? customers.find(c => c.id === pJob.customerId) : null;
          const pFromLoc = pJob ? locations.find(l => l.id === pJob.originLocationId) : null;
          const pToLoc = pJob ? locations.find(l => l.id === pJob.destinationLocationId) : null;

          const getTranslation = (key: string, languageCode: string): string =>
            translations.find(t => t.key === key && t.languageCode === languageCode)?.translatedValue ?? key;

          const dualFields = [
            { key: 'shipper', enLabel: 'Shipper Details', arTaKey: 'shipper', value: pCustomer?.name || 'ATLAS LOGISTICS HUB' },
            { key: 'consignee', enLabel: 'Consignee Details', arTaKey: 'consignee', value: pCustomer?.name || 'CONSIGNEE TERMINAL CO' },
            { key: 'container_no', enLabel: 'Container No', arTaKey: 'container_no', value: pJob?.containerNo || 'N/A' },
            { key: 'seal_no', enLabel: 'Seal No', arTaKey: 'seal_no', value: pJob?.sealNo || 'N/A' },
            { key: 'gross_weight', enLabel: 'Gross Weight', arTaKey: 'gross_weight', value: pJob?.weightKg ? `${pJob.weightKg.toLocaleString()} KG` : 'N/A' },
            { key: 'description', enLabel: 'Description of Goods', arTaKey: 'description', value: 'GENERAL IMPORT FREIGHT CONTAINER' },
            { key: 'driver_name', enLabel: 'Driver Name', arTaKey: 'driver_name', value: pDriver?.name || 'UNASSIGNED FLEET DRIVER' },
            { key: 'vehicle_no', enLabel: 'Vehicle No', arTaKey: 'vehicle_no', value: pVehicle?.plateNumber || 'N/A' },
            { key: 'date_of_issue', enLabel: 'Date of Issue', arTaKey: 'date_of_issue', value: pJob?.scheduledTime ? new Date(pJob.scheduledTime).toLocaleDateString() : new Date().toLocaleDateString() },
            { key: 'place_of_loading', enLabel: 'Place of Loading', arTaKey: 'place_of_loading', value: pFromLoc ? `${pFromLoc.name} (${pFromLoc.code})` : 'N/A' },
            { key: 'place_of_delivery', enLabel: 'Place of Delivery', arTaKey: 'place_of_delivery', value: pToLoc ? `${pToLoc.name} (${pToLoc.code})` : 'N/A' },
            { key: 'signature', enLabel: 'Signature / Handover status', arTaKey: 'signature', value: printCn.recipientSignedBy ? `Signed: ${printCn.recipientSignedBy}` : 'Pending Consignee Stamp' },
          ];

          return (
            <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[60]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg max-w-2xl w-full border border-slate-300 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
              >
                <button
                  id="close-cn-print-modal"
                  onClick={() => setPrintCnId(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1 bg-slate-100 rounded-full z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-8 overflow-y-auto space-y-6" id="cn-bilingual-print-body">
                  <div className="border-b-2 border-slate-900 pb-5 text-center relative space-y-1">
                    <div className="font-extrabold tracking-widest text-slate-500 text-[10px] uppercase font-mono">BILINGUAL HAULAGE CONSIGNMENT SHEET</div>
                    <h1 className="text-lg font-black font-sans text-slate-950 uppercase tracking-tight">CONSIGNMENT NOTE (C.N.)</h1>
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold pt-1">
                      <div className="text-left text-slate-600">English Language Version</div>
                      <div className={`text-indigo-700 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                        {secondaryLangConfig.name} Overlay ({secondaryLangConfig.nativeName})
                      </div>
                    </div>
                    <div className="font-mono text-xs text-slate-500 font-bold mt-1">CN SERIAL: {printCn.cnNo}</div>
                    <div className="absolute top-0 left-0">
                      <span className="bg-slate-950 text-white font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase select-none">HMS-SAAS</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-150 border-t border-b border-slate-200">
                    {dualFields.map(field => {
                      const translatedLabel = getTranslation(field.arTaKey, secondaryLanguageCode);
                      return (
                        <div key={field.key} className="py-3 grid grid-cols-2 gap-6 items-start">
                          <div className="space-y-1 text-left">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{field.enLabel}</span>
                            <span className="block text-xs font-semibold text-slate-800 break-words font-mono">{field.value}</span>
                          </div>
                          <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                            <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{translatedLabel}</span>
                            <span className="block text-xs font-extrabold text-slate-900 break-words font-mono">{field.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border border-slate-200 bg-slate-50 rounded-lg p-4 text-[10px] text-slate-500 leading-relaxed font-sans font-medium space-y-2.5">
                    <p className="font-bold text-slate-700">HMS Conditions of Carriage / நிபந்தனைகள்:</p>
                    <p>English: Local carrier responsibility guidelines apply as dictated by national transportation statutes.</p>
                    <p className={isRTL ? 'text-right' : 'text-left'} dir={isRTL ? 'rtl' : 'ltr'}>
                      {getTranslation('carrier_disclaimer', secondaryLanguageCode)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-6 text-xs">
                    <div className="text-center pt-6 border-t border-dashed border-slate-300 space-y-1">
                      <div className="text-[10px] font-mono font-bold text-slate-400">DESPATCH COURIER STAMP</div>
                      <div className="font-black italic mt-1 text-slate-700">ATLAS CONTAINER LINE</div>
                    </div>
                    <div className="text-center pt-6 border-t border-dashed border-slate-300 space-y-1.5">
                      <div className="text-[10px] font-mono font-bold text-slate-400 flex justify-between">
                        <span>CONSIGNEE RECEIVER SIGN</span>
                        <span dir={isRTL ? 'rtl' : 'ltr'}>{getTranslation('signature', secondaryLanguageCode)}</span>
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

                <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3 justify-end shrink-0">
                  <button
                    id="cancel-cn-print"
                    onClick={() => setPrintCnId(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="execute-cn-print"
                    onClick={() => {
                      alert(`Document ${printCn.cnNo} processed successfully with dual language ${secondaryLangConfig.name} overlay.`);
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
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
