/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ROT, Job, Customer, LocationGeo } from '../types';
import {
  ShieldCheck, Printer, CheckCircle2, Bookmark, Calendar, X, UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection, DrawerField, DrawerFieldGrid } from './shared/DetailDrawer';
import { T, badgeClass, statusLabel } from './shared/ui';

interface ROTMasterProps {
  rots: ROT[];
  jobs: Job[];
  customers: Customer[];
  locations: LocationGeo[];
  onConfirmRot: (rotId: string, jobId: string) => void;
}

export default function ROTMaster({
  rots, jobs, customers, locations, onConfirmRot,
}: ROTMasterProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lineFilter, setLineFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedRotId, setSelectedRotId] = useState<string | null>(null);
  const [printLayoutRotId, setPrintLayoutRotId] = useState<string | null>(null);

  const jobOf = (rot: ROT) => jobs.find(j => j.id === rot.jobId) || null;
  const customerOf = (job: Job | null) => (job ? customers.find(c => c.id === job.customerId) || null : null);

  const shippingLineOptions = useMemo(() => {
    const names = new Set<string>();
    jobs.forEach(j => { if (j.shippingLine) names.add(j.shippingLine); });
    return [...names].map(n => ({ value: n, label: n }));
  }, [jobs]);

  const filteredRots = useMemo(() => {
    return rots.filter(rot => {
      const job = jobOf(rot);
      const customer = customerOf(job);
      const q = search.toLowerCase();
      const matchSearch = !q ||
        rot.rotNo.toLowerCase().includes(q) ||
        (job?.jobNo.toLowerCase().includes(q) ?? false) ||
        (job?.containerNo.toLowerCase().includes(q) ?? false) ||
        (customer?.name.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter === 'all' || rot.status === statusFilter;
      const matchLine = !lineFilter || job?.shippingLine === lineFilter;
      const matchDate =
        (!dateRange.from || rot.depotExpiry >= dateRange.from) &&
        (!dateRange.to || rot.depotExpiry <= dateRange.to);
      return matchSearch && matchStatus && matchLine && matchDate;
    });
  }, [rots, jobs, customers, search, statusFilter, lineFilter, dateRange]);

  const selectedRot = rots.find(r => r.id === selectedRotId) || null;
  const selectedJob = selectedRot ? jobOf(selectedRot) : null;
  const selectedCustomer = customerOf(selectedJob);
  const originLoc = selectedJob ? locations.find(l => l.id === selectedJob.originLocationId) || null : null;
  const destLoc = selectedJob ? locations.find(l => l.id === selectedJob.destinationLocationId) || null : null;

  const printRot = printLayoutRotId ? rots.find(r => r.id === printLayoutRotId) || null : null;
  const printJob = printRot ? jobOf(printRot) : null;
  const printCustomer = customerOf(printJob);

  const columns: DataTableColumn<ROT>[] = [
    {
      key: 'rotNo', header: 'ROT No', sortValue: r => r.rotNo,
      render: r => <span className={T.cellId}>{r.rotNo}</span>,
    },
    {
      key: 'jobNo', header: 'Job No', sortValue: r => jobOf(r)?.jobNo ?? '',
      render: r => <span className={T.cellId}>{jobOf(r)?.jobNo ?? '—'}</span>,
    },
    {
      key: 'container', header: 'Container', sortValue: r => jobOf(r)?.containerNo ?? '',
      render: r => {
        const job = jobOf(r);
        return (
          <div>
            <span className={T.cellId}>{job?.containerNo ?? 'N/A'}</span>
            <span className={`${T.cellMuted} block`}>{job?.containerSize}</span>
          </div>
        );
      },
    },
    {
      key: 'customer', header: 'Customer', sortValue: r => customerOf(jobOf(r))?.name ?? '',
      render: r => <span className={T.cellPrimary}>{customerOf(jobOf(r))?.name ?? '—'}</span>,
    },
    {
      key: 'line', header: 'Shipping Line', sortValue: r => jobOf(r)?.shippingLine ?? '',
      render: r => <span className={T.cellSecondary}>{jobOf(r)?.shippingLine ?? '—'}</span>,
    },
    {
      key: 'expiry', header: 'Depot Expiry', sortValue: r => r.depotExpiry,
      render: r => <span className="text-sm font-mono text-red-600 font-semibold">{r.depotExpiry}</span>,
    },
    {
      key: 'status', header: 'Status', sortValue: r => r.status,
      render: r => <span className={badgeClass(r.status)}>{statusLabel(r.status)}</span>,
    },
  ];

  const activeFilterCount =
    (search ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (lineFilter ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0);

  return (
    <div className="space-y-4" id="rot-master-container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`${T.pageTitle} flex items-center gap-2`}>
            <ShieldCheck className="text-blue-600 w-5 h-5" /> Release Order Tickets (ROT)
          </h1>
          <p className={T.pageSubtitle}>Authorize terminal gate-passes, print release codes, and verify security audits prior to yard dispatch.</p>
        </div>
        <div className="flex bg-slate-100 border border-slate-200 px-3 py-1.5 rounded text-xs font-mono font-bold text-slate-500">
          TOTAL ROTs: {rots.length}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <FilterBar
          searchPlaceholder="Search ROT, Job, Container, or Client…"
          searchValue={search}
          onSearchChange={setSearch}
          statusOptions={[
            { value: 'all', label: 'All', count: rots.length },
            { value: 'draft', label: 'Draft', count: rots.filter(r => r.status === 'draft').length },
            { value: 'confirmed', label: 'Confirmed', count: rots.filter(r => r.status === 'confirmed').length },
          ]}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          dropdownFilters={[{
            key: 'line', label: 'Shipping Line',
            options: shippingLineOptions,
            value: lineFilter, onChange: setLineFilter,
          }]}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          dateRangeLabel="Expiry"
          onClearAll={() => { setSearch(''); setStatusFilter('all'); setLineFilter(''); setDateRange({ from: '', to: '' }); }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={filteredRots}
          onRowClick={r => setSelectedRotId(r.id)}
          rowActions={r => (
            <button
              id={`rot-print-btn-${r.id}`}
              onClick={() => setPrintLayoutRotId(r.id)}
              className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Print Gate Pass"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
          emptyState={{
            icon: <ShieldCheck className="w-10 h-10" />,
            title: 'No tickets found',
            subtitle: 'Adjust the filters to find release order tickets.',
          }}
        />
      </div>

      {/* Detail drawer */}
      <DetailDrawer
        open={!!selectedRot}
        onClose={() => setSelectedRotId(null)}
        title={
          <>
            <span className="font-mono">{selectedRot?.rotNo}</span>
            {selectedRot && <span className={badgeClass(selectedRot.status)}>{statusLabel(selectedRot.status)}</span>}
          </>
        }
        subtitle="Release Authority"
        headerActions={
          selectedRot ? (
            <button
              onClick={() => setPrintLayoutRotId(selectedRot.id)}
              className="h-8 px-2.5 flex items-center gap-1 rounded-md text-sm text-slate-600 hover:bg-slate-100"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          ) : undefined
        }
        footer={
          selectedRot?.status === 'draft' ? (
            <button
              id="rot-details-approve-btn"
              onClick={() => onConfirmRot(selectedRot.id, selectedRot.jobId)}
              className="h-9 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <UserCheck className="w-4 h-4" /> Verify Release &amp; Issue CN
            </button>
          ) : undefined
        }
      >
        {selectedRot && (
          <>
            <DrawerSection title="Bound Consignment Profile">
              <DrawerFieldGrid>
                <DrawerField label="Associated Job" value={<span className="font-mono text-blue-600">{selectedJob?.jobNo}</span>} />
                <DrawerField label="Customer" value={selectedCustomer?.name} bold />
                <DrawerField label="Container / Seal" value={<span className="font-mono">{selectedJob?.containerNo} / {selectedJob?.sealNo}</span>} />
                <DrawerField label="Size & Weight" value={selectedJob ? `${selectedJob.containerSize} · ${selectedJob.weightKg.toLocaleString()} KG` : undefined} />
                <DrawerField label="Scenario" value={selectedJob?.scenario} />
                <DrawerField label="Route" value={originLoc && destLoc ? `${originLoc.name} → ${destLoc.name}` : undefined} full />
              </DrawerFieldGrid>
            </DrawerSection>

            <DrawerSection title="Gate Authority Release">
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">GATE RELEASE SECURE CODE</span>
                    <span className="text-sm font-black font-mono text-slate-900 tracking-wider select-all">{selectedRot.gateReleaseCode}</span>
                  </div>
                  <Bookmark className="w-5 h-5 text-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Depot Expiry Window</span>
                    <strong className="text-red-600 font-mono font-bold flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-red-500" /> {selectedRot.depotExpiry}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Release Depot</span>
                    <strong className="text-slate-800 block mt-0.5 truncate">HZP Depot Gateway Pool</strong>
                  </div>
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Operational Verification">
              {selectedRot.status === 'draft' ? (
                <p className="text-xs text-slate-500">
                  Review and authorize cargo release codes to trigger draft Consignment Note (CN) issuance. Use the button below to confirm.
                </p>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-4 flex items-start gap-2 text-green-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Authorized Legally Verified</p>
                    <p className="text-[11px] text-green-700 mt-1">
                      Release verified by: <strong className="font-black">{selectedRot.verifiedBy || 'Port Master Dispatcher'}</strong>
                    </p>
                  </div>
                </div>
              )}
            </DrawerSection>
          </>
        )}
      </DetailDrawer>

      {/* Print preview modal (preserved) */}
      <AnimatePresence>
        {printLayoutRotId && printRot && (
          <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-2xl w-full border border-slate-300 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button
                id="close-rot-print-modal"
                onClick={() => setPrintLayoutRotId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition p-1 bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8 overflow-y-auto space-y-6" id="rot-printable-document-body">
                <div className="border-b-2 border-slate-900 pb-5 text-center relative space-y-1">
                  <div className="text-[10px] font-black tracking-widest text-blue-600 uppercase font-mono">PORT TERMINAL RELEASE PASS</div>
                  <h1 className="text-xl font-black font-sans text-slate-900 uppercase tracking-tight">RELEASE ORDER TICKET (ROT)</h1>
                  <span className="font-mono text-xs text-slate-500 font-bold">SERIAL AUTH: {printRot.rotNo}</span>
                  <div className="absolute top-0 left-0 text-left">
                    <div className="bg-slate-900 text-white text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">SECURE PASS</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Shipping Carrier Client</span>
                    <strong className="text-slate-900 text-sm font-black">{printCustomer?.name}</strong>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Gate Release Code</span>
                    <strong className="text-slate-900 text-sm font-black font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{printRot.gateReleaseCode}</strong>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Container Serial ID</span>
                    <strong className="text-slate-900 font-bold font-mono">{printJob?.containerNo}</strong>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Customs Seal Serial</span>
                    <strong className="text-slate-900 font-bold font-mono">{printJob?.sealNo}</strong>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Logistics Corridor Mode</span>
                    <strong className="text-slate-900 font-bold">{printJob?.scenario} Leg Transit</strong>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Gross Declared Weight</span>
                    <strong className="text-slate-900 font-bold">{printJob?.weightKg.toLocaleString()} KG</strong>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3 col-span-2">
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Terminal Expiry Deadline Window</span>
                    <strong className="text-red-600 font-bold block">{printRot.depotExpiry} 23:59:59 (Strict Depot Gate-pass Lockout)</strong>
                  </div>
                </div>

                <div className="border border-slate-200 bg-slate-50 rounded-lg p-4 text-[11px] text-slate-500 leading-relaxed font-sans font-medium space-y-1.5">
                  <p className="font-bold text-slate-700">Official Port Gate Pass Protocol:</p>
                  <p>1. Present this printable release coupon to the physical terminal gates at least 4 hours before the expiry deadline window.</p>
                  <p>2. Verify container seals have not been tampered with or replaced. If serial mismatch occurs, port security retains authority to inspect cargo.</p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs font-sans">
                  <div className="text-center pt-8 border-t border-dashed border-slate-300">
                    <div className="text-[10px] font-mono font-bold text-slate-400">AUTHORIZED SYSTEM AUDITOR</div>
                    <div className="font-bold text-slate-800 mt-1">{printRot.verifiedBy || 'PENDING DIGITAL CERT'}</div>
                  </div>
                  <div className="text-center pt-8 border-t border-dashed border-slate-300">
                    <div className="text-[10px] font-mono font-bold text-slate-400">DRIVER RECEIVING ACKNOWLEDGEMENT</div>
                    <div className="text-slate-400 italic mt-1">Signature Required on Gate-Pass Ingestion</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3 justify-end shrink-0">
                <button
                  id="cancel-rot-print"
                  onClick={() => setPrintLayoutRotId(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  id="execute-rot-print"
                  onClick={() => {
                    alert(`Sending document ${printRot.rotNo} directly to local system printer spooler...`);
                    printRot.status = 'confirmed'; // confirm implicitly as visual helper
                    setPrintLayoutRotId(null);
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Execute Digital Print
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
