/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Country } from '../types';
import {
  Plus, User, ShieldAlert, ArrowRight, XCircle, Check, Users, Lock, Pencil,
} from 'lucide-react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection, DrawerField, DrawerFieldGrid } from './shared/DetailDrawer';
import { T, badgeClass, statusLabel } from './shared/ui';

interface CustomerMasterProps {
  customers: Customer[];
  countries: Country[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

type SimulationOffice = 'global' | 'cnt-in' | 'cnt-us' | 'cnt-sg';

const STATUS_DISPLAY: Record<string, string> = {
  approved: 'approved',
  pending_global_approval: 'pending_approval',
  draft: 'draft',
  rejected: 'rejected',
};

const emptyForm = {
  name: '', taxId: '', address: '', creditLimit: 50000,
  paymentTerms: 'Net 30', phone: '', email: '', countryId: '',
};

export default function CustomerMaster({
  customers, countries, onAddCustomer, onUpdateCustomer,
}: CustomerMasterProps) {
  const [activeOffice, setActiveOffice] = useState<SimulationOffice>('global');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');

  // Drawer
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [form, setForm] = useState({ ...emptyForm });

  // Rejection modal
  const [rejectingCustomerId, setRejectingCustomerId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const activeCountry = countries.find(c => c.id === activeOffice);
  const isGlobalMode = activeOffice === 'global';

  // Region (country) isolation — regional sessions only see their own country's customers
  const regionScoped = customers.filter(c => isGlobalMode || c.countryId === activeOffice);

  const statusOf = (c: Customer) => c.status || 'approved';

  const filtered = regionScoped.filter(c => {
    const country = countries.find(co => co.id === c.countryId);
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.taxId.toLowerCase().includes(q) ||
      (country?.name.toLowerCase().includes(q) ?? false);
    const matchesCountry = !countryFilter || c.countryId === countryFilter;
    const s = statusOf(c);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && s === 'approved') ||
      (statusFilter === 'pending' && s === 'pending_global_approval') ||
      (statusFilter === 'draft-rejected' && (s === 'draft' || s === 'rejected'));
    return matchesSearch && matchesCountry && matchesStatus;
  });

  const selected = customers.find(c => c.id === selectedId) ?? null;

  const openDrawer = (c: Customer) => {
    setSelectedId(c.id);
    setDrawerMode('view');
  };

  const openCreate = () => {
    setForm({ ...emptyForm, countryId: isGlobalMode ? '' : activeOffice });
    setSelectedId(null);
    setDrawerMode('create');
  };

  const startEdit = (c: Customer) => {
    setForm({
      name: c.name, taxId: c.taxId, address: c.address,
      creditLimit: c.creditLimit, paymentTerms: c.paymentTerms,
      phone: c.phone, email: c.email, countryId: c.countryId ?? '',
    });
    setDrawerMode('edit');
  };

  const closeDrawer = () => { setSelectedId(null); setDrawerMode('view'); };

  const handleSaveForm = () => {
    if (!form.name || !form.taxId || !form.email) {
      alert('Please fill out Company Name, Tax ID, and Email.');
      return;
    }
    const finalCountryId = isGlobalMode ? form.countryId : activeOffice;
    if (!finalCountryId) {
      alert('Sovereign country assignment is mandatory.');
      return;
    }
    if (drawerMode === 'create') {
      // Regional users can only create drafts; global admins create pre-approved accounts
      onAddCustomer({
        id: `cust-${Date.now()}`,
        name: form.name.trim(),
        taxId: form.taxId.toUpperCase().trim(),
        address: form.address.trim(),
        creditLimit: Number(form.creditLimit),
        paymentTerms: form.paymentTerms,
        phone: form.phone.trim(),
        email: form.email.trim(),
        countryId: finalCountryId,
        status: isGlobalMode ? 'approved' : 'draft',
      });
      closeDrawer();
    } else if (selected) {
      onUpdateCustomer({
        ...selected,
        name: form.name.trim(),
        taxId: form.taxId.toUpperCase().trim(),
        address: form.address.trim(),
        creditLimit: Number(form.creditLimit),
        paymentTerms: form.paymentTerms,
        phone: form.phone.trim(),
        email: form.email.trim(),
        countryId: finalCountryId,
      });
      setDrawerMode('view');
    }
  };

  // Workflow transitions
  const transition = (customer: Customer, newStatus: Customer['status'], reason?: string) =>
    onUpdateCustomer({ ...customer, status: newStatus, rejectionReason: reason || undefined });

  const submitToGlobalReview = (customer: Customer) => {
    if (!customer.countryId) {
      alert('Missing country mapping. Provide country context before submitting.');
      return;
    }
    transition(customer, 'pending_global_approval');
  };

  const handleGlobalReject = (customer: Customer, reason: string) => {
    if (!reason.trim()) {
      alert('Please state the audit rejection findings/evidence requirements.');
      return;
    }
    transition(customer, 'rejected', reason.trim());
    setRejectingCustomerId(null);
    setRejectionReasonInput('');
  };

  const workflowActions = (c: Customer) => {
    const s = statusOf(c);
    if (isGlobalMode && s === 'pending_global_approval') {
      return (
        <>
          <button
            onClick={() => transition(c, 'approved')}
            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] uppercase tracking-wide flex items-center gap-1"
            title="Approve credit limit"
          >
            <Check className="w-3 h-3" /> Approve
          </button>
          <button
            onClick={() => setRejectingCustomerId(c.id)}
            className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px] uppercase tracking-wide flex items-center gap-1"
            title="Reject and request corrections"
          >
            <XCircle className="w-3 h-3" /> Reject
          </button>
        </>
      );
    }
    if (!isGlobalMode && (s === 'draft' || s === 'rejected')) {
      return (
        <button
          onClick={() => submitToGlobalReview(c)}
          className={`h-7 px-2 font-bold rounded text-[10px] uppercase tracking-wide flex items-center gap-1 text-white ${s === 'draft' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'}`}
        >
          {s === 'draft' ? 'Submit' : 'Re-Submit'} <ArrowRight className="w-3 h-3" />
        </button>
      );
    }
    return null;
  };

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'name', header: 'Company Name',
      sortValue: c => c.name,
      render: c => (
        <div>
          <div className={T.cellPrimary}>{c.name}</div>
          {c.address && <div className={`${T.cellMuted} truncate max-w-[260px]`} title={c.address}>{c.address}</div>}
        </div>
      ),
    },
    {
      key: 'taxId', header: 'Tax ID',
      sortValue: c => c.taxId,
      render: c => <span className={T.cellId}>{c.taxId}</span>,
    },
    {
      key: 'region', header: 'Region',
      sortValue: c => countries.find(co => co.id === c.countryId)?.name ?? '',
      render: c => {
        const country = countries.find(co => co.id === c.countryId);
        return (
          <div>
            <div className={T.cellSecondary}>{country?.code ?? 'N/A'}</div>
            <div className={T.cellMuted}>{country?.name ?? 'Corporate'}</div>
          </div>
        );
      },
    },
    {
      key: 'terms', header: 'Payment Terms',
      sortValue: c => c.paymentTerms,
      render: c => <span className={T.cellSecondary}>{c.paymentTerms}</span>,
    },
    {
      key: 'credit', header: 'Credit Limit', align: 'right',
      sortValue: c => c.creditLimit,
      render: c => <span className={T.cellAmount}>${c.creditLimit.toLocaleString()}</span>,
    },
    {
      key: 'status', header: 'Status',
      sortValue: c => statusOf(c),
      render: c => <span className={badgeClass(STATUS_DISPLAY[statusOf(c)] ?? statusOf(c))}>{statusLabel(STATUS_DISPLAY[statusOf(c)] ?? statusOf(c))}</span>,
    },
  ];

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (countryFilter ? 1 : 0);

  const formBody = (
    <div className="space-y-4">
      <div>
        <label className={T.drawerLabel}>Company Name *</label>
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Pacific Logistics Corp"
          className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={T.drawerLabel}>Tax Identifier *</label>
          <input
            value={form.taxId}
            onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
            placeholder="e.g. GSTIN-33AAACP8511Z"
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className={T.drawerLabel}>Country *</label>
          <select
            disabled={!isGlobalMode}
            value={isGlobalMode ? form.countryId : activeOffice}
            onChange={e => setForm(f => ({ ...f, countryId: e.target.value }))}
            className="mt-1 w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">-- Select --</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={T.drawerLabel}>Registered Address</label>
        <textarea
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder="Building No, City, State, ZIP"
          className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm h-16 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={T.drawerLabel}>Credit Limit (USD)</label>
          <input
            type="number"
            value={form.creditLimit}
            onChange={e => setForm(f => ({ ...f, creditLimit: Number(e.target.value) }))}
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className={T.drawerLabel}>Payment Terms</label>
          <select
            value={form.paymentTerms}
            onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="COD">Due on Delivery (COD)</option>
            <option value="Net 15">Net 15 Days</option>
            <option value="Net 30">Net 30 Days</option>
            <option value="Net 45">Net 45 Days</option>
            <option value="Net 60">Net 60 Days</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={T.drawerLabel}>Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="logistics@company.com"
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className={T.drawerLabel}>Phone</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+91 22 1234 5678"
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      {drawerMode === 'create' && !isGlobalMode && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-800">
          New clients start as <strong>Draft</strong> and must be submitted for Corporate HQ risk review before binding rates.
        </div>
      )}
    </div>
  );

  const selectedCountry = selected ? countries.find(co => co.id === selected.countryId) : null;
  const selectedStatus = selected ? statusOf(selected) : 'approved';

  return (
    <div className="space-y-4 animate-fade-in" id="customers-master-module">
      {/* Simulation Office Console */}
      <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl shadow-lg text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider">Simulation Console</span>
              <span className="text-slate-400 font-mono text-xs font-bold">Logged-In Active User Identity Scoping</span>
            </div>
            <h3 className="text-sm font-black text-white mt-1 uppercase tracking-wide">
              {isGlobalMode
                ? '🌍 Operating as: CORPORATE HQ GLOBAL RISK PANEL'
                : `Regional Branch Instance: ${activeCountry?.name} Localized Operations`}
            </h3>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono pl-2">Session:</span>
            <select
              value={activeOffice}
              onChange={e => { setActiveOffice(e.target.value as SimulationOffice); closeDrawer(); }}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="global">Global HQ (Corporate Admin)</option>
              <option value="cnt-in">India Ops (Chennai Office)</option>
              <option value="cnt-us">USA Ops (Los Angeles Office)</option>
              <option value="cnt-sg">Singapore Ops (SGP Office)</option>
            </select>
          </div>
        </div>
      </div>

      {!isGlobalMode && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-800 flex items-start gap-2.5">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-blue-900 uppercase tracking-wider mb-0.5">Territory Data Isolation Active</strong>
            You are restricted to records for <strong>{activeCountry?.name}</strong> ({activeCountry?.code}). Records from other territories are not retrievable.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`${T.pageTitle} flex items-center gap-2`}>
            <User className="text-blue-600 w-5 h-5" /> Client Directory
          </h1>
          <p className={T.pageSubtitle}>Customer credit profiles, tax identifiers, and country scopes under risk oversight.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> {isGlobalMode ? 'Add Client' : 'Register Local Client'}
        </button>
      </div>

      {/* HQ pending alert */}
      {isGlobalMode && regionScoped.some(c => c.status === 'pending_global_approval') && (
        <div className="bg-amber-50 border border-amber-300 p-3 rounded-lg flex items-center gap-2 text-amber-800 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <strong className="font-bold uppercase tracking-wide">
            {regionScoped.filter(c => c.status === 'pending_global_approval').length} regional sign-off(s) awaiting HQ risk audit
          </strong>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm" id="customer-registry-table">
        <FilterBar
          searchPlaceholder="Search company, Tax ID, or country…"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusOptions={[
            { value: 'all', label: 'All', count: regionScoped.length },
            { value: 'approved', label: 'Approved', count: regionScoped.filter(c => statusOf(c) === 'approved').length },
            { value: 'pending', label: 'Pending', count: regionScoped.filter(c => statusOf(c) === 'pending_global_approval').length },
            { value: 'draft-rejected', label: 'Draft / Rejected', count: regionScoped.filter(c => ['draft', 'rejected'].includes(statusOf(c))).length },
          ]}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          dropdownFilters={isGlobalMode ? [{
            key: 'country', label: 'Country',
            options: countries.map(c => ({ value: c.id, label: c.name })),
            value: countryFilter, onChange: setCountryFilter,
          }] : []}
          onClearAll={() => { setSearchQuery(''); setStatusFilter('all'); setCountryFilter(''); }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          onRowClick={openDrawer}
          rowActions={workflowActions}
          emptyState={{
            icon: <Users className="w-10 h-10" />,
            title: 'No client profiles found',
            subtitle: 'Adjust the filters or register a new client.',
          }}
        />
      </div>

      {/* Detail / edit / create drawer */}
      <DetailDrawer
        open={drawerMode === 'create' || !!selected}
        onClose={closeDrawer}
        title={
          drawerMode === 'create'
            ? 'New Client'
            : <>
                <span>{selected?.name}</span>
                {selected && <span className={badgeClass(STATUS_DISPLAY[selectedStatus] ?? selectedStatus)}>{statusLabel(STATUS_DISPLAY[selectedStatus] ?? selectedStatus)}</span>}
              </>
        }
        subtitle={drawerMode === 'create' ? (isGlobalMode ? 'Pre-approved corporate account' : `Draft application — ${activeCountry?.name}`) : selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : undefined}
        headerActions={
          drawerMode === 'view' && selected ? (
            <button
              onClick={() => startEdit(selected)}
              className="h-8 px-2.5 flex items-center gap-1 rounded-md text-sm text-slate-600 hover:bg-slate-100"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          ) : undefined
        }
        footer={
          drawerMode === 'view' && selected ? (
            <>
              {workflowActions(selected)}
              <button onClick={() => startEdit(selected)} className="h-9 px-4 rounded-md border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Edit</button>
            </>
          ) : (
            <>
              <button
                onClick={() => drawerMode === 'create' ? closeDrawer() : setDrawerMode('view')}
                className="h-9 px-4 rounded-md text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveForm}
                className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
              >
                {drawerMode === 'create' ? (isGlobalMode ? 'Approve & Save' : 'Save Draft') : 'Save Changes'}
              </button>
            </>
          )
        }
      >
        {drawerMode === 'view' && selected ? (
          <>
            {selectedStatus === 'rejected' && selected.rejectionReason && (
              <div className="mb-4 bg-red-50 border border-red-200 text-xs text-red-700 p-3 rounded-lg">
                <span className="font-bold block uppercase tracking-wide mb-0.5">Correction Requested</span>
                {selected.rejectionReason}
              </div>
            )}
            <DrawerSection title="Identity">
              <DrawerFieldGrid>
                <DrawerField label="Company Name" value={selected.name} bold full />
                <DrawerField label="Tax ID" value={<span className="font-mono text-blue-600">{selected.taxId}</span>} />
                <DrawerField label="Country" value={selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : 'Corporate'} />
                <DrawerField label="Address" value={selected.address} full />
              </DrawerFieldGrid>
            </DrawerSection>
            <DrawerSection title="Commercial">
              <DrawerFieldGrid>
                <DrawerField label="Payment Terms" value={selected.paymentTerms} />
                <DrawerField label="Credit Limit" value={`$${selected.creditLimit.toLocaleString()} USD`} />
                <DrawerField label="Currency" value={selectedCountry?.currency} />
                <DrawerField label="Active Quotations" value={selected.activeQuotationsCount ?? 0} />
              </DrawerFieldGrid>
            </DrawerSection>
            <DrawerSection title="Contacts">
              <DrawerFieldGrid>
                <DrawerField label="Email" value={selected.email} />
                <DrawerField label="Phone" value={selected.phone} />
              </DrawerFieldGrid>
            </DrawerSection>
          </>
        ) : formBody}
      </DetailDrawer>

      {/* Rejection modal */}
      {rejectingCustomerId && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[60] text-xs">
          <div className="bg-white border-2 border-red-500 rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <strong className="font-extrabold uppercase">Reject Regional Application</strong>
            </div>
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Audit Discrepancy / Correction Requirements <span className="text-red-500">*</span></label>
              <textarea
                placeholder="e.g. GSTIN format does not correspond to specified corporate register."
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-medium text-slate-800 focus:outline-none focus:border-red-500 h-24"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => { setRejectingCustomerId(null); setRejectionReasonInput(''); }}
                className="px-3 py-1.5 font-bold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const cust = customers.find(c => c.id === rejectingCustomerId);
                  if (cust) handleGlobalReject(cust, rejectionReasonInput);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md"
              >
                Issue Audit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
