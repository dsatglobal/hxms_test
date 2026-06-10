/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, Country } from '../types';
import { 
  Plus, 
  User, 
  CheckCircle2, 
  Shield, 
  Phone, 
  Mail, 
  Building, 
  Globe, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowRight, 
  XCircle, 
  Check, 
  AlertCircle, 
  Info, 
  Lock, 
  Eye, 
  Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerMasterProps {
  customers: Customer[];
  countries: Country[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

type SimulationOffice = 'global' | 'cnt-in' | 'cnt-us' | 'cnt-sg';

export default function CustomerMaster({
  customers,
  countries,
  onAddCustomer,
  onUpdateCustomer
}: CustomerMasterProps) {
  // Simulator active session
  const [activeOffice, setActiveOffice] = useState<SimulationOffice>('global');
  
  // Create customer form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formCountryId, setFormCountryId] = useState('');

  // Rejection input modal state
  const [rejectingCustomerId, setRejectingCustomerId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'approved' | 'pending' | 'draft-rejected'>('all');

  // Multi-Region strict data access scoping
  const activeCountry = countries.find(c => c.id === activeOffice);
  const isGlobalMode = activeOffice === 'global';

  // 1. STAGE LEVEL ISOLATION: A user logged in as "India Ops" can ONLY see India customers.
  // This physically blocks unauthorized database queries in real world architectures.
  const filteredByRegion = customers.filter(c => {
    if (isGlobalMode) return true;
    return c.countryId === activeOffice;
  });

  // Apply search queries and status subfilters
  const finalFilteredCustomers = filteredByRegion.filter(c => {
    const matchedCountry = countries.find(co => co.id === c.countryId);
    const countryName = matchedCountry ? matchedCountry.name : '';
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.taxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      countryName.toLowerCase().includes(searchQuery.toLowerCase());

    const status = c.status || 'approved';
    if (statusTab === 'approved') return matchesSearch && status === 'approved';
    if (statusTab === 'pending') return matchesSearch && status === 'pending_global_approval';
    if (statusTab === 'draft-rejected') return matchesSearch && (status === 'draft' || status === 'rejected');
    return matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !taxId || !email) {
      alert('Please fill out Company Name, Tax ID, and Email contacts.');
      return;
    }

    // Determine country assignment. Enforce local country if logged in to regional office.
    const finalCountryId = isGlobalMode ? formCountryId : activeOffice;
    if (!finalCountryId) {
      alert('Sovereign country assignment is mandatory.');
      return;
    }

    // Determine initial workflow status
    // In real-world enterprise suites, regional managers can only save client as "Draft"
    // or submit standard parameters. They have ZERO authorization to instantly "Approve" credit accounts.
    const initialStatus = isGlobalMode ? 'approved' : 'draft';

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      taxId: taxId.toUpperCase().trim(),
      address: address.trim(),
      creditLimit: Number(creditLimit),
      paymentTerms,
      phone: phone.trim(),
      email: email.trim(),
      countryId: finalCountryId,
      status: initialStatus
    };

    onAddCustomer(newCust);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setTaxId('');
    setAddress('');
    setPhone('');
    setEmail('');
    setFormCountryId('');
    setCreditLimit(50000);
    setPaymentTerms('Net 30');
    setShowCreateForm(false);
  };

  // State machine workflow transitions
  const handleTransitionStatus = (customer: Customer, newStatus: Customer['status'], reason?: string) => {
    const updated: Customer = {
      ...customer,
      status: newStatus,
      rejectionReason: reason || undefined
    };
    onUpdateCustomer(updated);
  };

  const submitToGlobalReview = (customer: Customer) => {
    if (!customer.countryId) {
      alert('Missing physical country code mapping. Provide country context before submitting.');
      return;
    }
    handleTransitionStatus(customer, 'pending_global_approval');
  };

  const handleGlobalApprove = (customer: Customer) => {
    handleTransitionStatus(customer, 'approved');
  };

  const handleGlobalReject = (customer: Customer, reason: string) => {
    if (!reason.trim()) {
      alert('Please state the audit rejection findings/evidence requirements.');
      return;
    }
    handleTransitionStatus(customer, 'rejected', reason.trim());
    setRejectingCustomerId(null);
    setRejectionReasonInput('');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="customers-master-module">
      
      {/* Simulation Office Selection Console */}
      <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl shadow-lg text-slate-100 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[9px] font-black uppercase tracking-wider">
                Simulation Console
              </span>
              <span className="text-slate-400 font-mono text-xs font-bold">
                Logged-In Active User Identity Scoping
              </span>
            </div>
            <h3 className="text-sm font-black text-white mt-1 uppercase tracking-wide">
              {isGlobalMode 
                ? '🌍 Currently Operating as: CORPORATE HQ GLOBAL RISK PANEL (ADMINISTRATOR)'
                : `🇮🇳 Regional Branch Instance: ${activeCountry?.name} Localized Operations`}
            </h3>
            <p className="text-[11px] text-slate-400 max-w-2xl mt-0.5">
              {isGlobalMode 
                ? 'Authorized permissions: Complete cross-border visibility. Execute regulatory audit sign-offs, grant sovereign financial limits, inspect tax records, and resolve global disputes.'
                : `Security Scope Active: Enforces strict data isolation. You are restricted to regional operations for ${activeCountry?.name}. You CANNOT retrieve raw client files, tax indexes, or financial parameters for other territories.`}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono pl-2">Session:</span>
            <select
              value={activeOffice}
              onChange={(e) => {
                setActiveOffice(e.target.value as SimulationOffice);
                resetForm();
              }}
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

      {/* Corporate Warning/Aesthetic Scoping Notice */}
      {!isGlobalMode && (
        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg text-xs text-blue-800 flex items-start gap-2.5">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-blue-900 uppercase tracking-wider mb-0.5">Physical Territory Data Isolation Active</strong>
            As a localized regional operator in <strong className="font-bold underline">{activeCountry?.name}</strong>, you have been assigned container haulage records limited to localized tax bounds ({activeCountry?.code}). Standard security compliance standards prevent you from reviewing USA or Germany credit records, avoiding horizontal data spills and strictly satisfying GDPR/Sovereign jurisdiction mandates.
          </div>
        </div>
      )}

      {/* Tab select block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <User className="text-blue-600 w-5 h-5" /> Sovereign Client Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain customer commercial credit profiles, local sovereign Tax GST/VAT identifiers, and country scopes under risk oversight.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            // Default select the office's country if country-scoped
            if (!isGlobalMode) {
              setFormCountryId(activeOffice);
            }
            setShowCreateForm(!showCreateForm);
          }}
          className="px-4 py-2 self-start sm:self-center rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans transition flex items-center gap-1.5 shadow-sm shadow-blue-100"
        >
          <Plus className="w-3.5 h-3.5" /> 
          {isGlobalMode ? 'Add Sovereign Client' : `Register Local Client Profile`}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showCreateForm && (
          <motion.form
            key="customer-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-white border-2 border-blue-500 p-5 rounded-lg space-y-4 max-w-3xl overflow-hidden shadow-md"
          >
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-blue-650 uppercase font-mono tracking-wide">
                {isGlobalMode 
                  ? '🛡️ Corporate HQ: Define Pre-Approved Sovereign Client Profile' 
                  : `🖊️ ${activeCountry?.name} Branch: Create Draft Client Application (Awaiting Global Risk Review)`}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isGlobalMode 
                  ? 'Global Admins can immediately approve credit lines and register verified corporate accounts across any jurisdiction.' 
                  : 'Newly declared clients start in a locked "Draft" state. You must compile the tax details, and officially request Corporate Risk HQ sign-off before this client can bind rates.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pacific Logistics Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tax Identifier ID *</label>
                <input
                  type="text"
                  required
                  placeholder={!isGlobalMode && activeOffice === 'cnt-in' ? 'e.g. GSTIN-33AAACP8511Z' : 'e.g. TX-440182-X'}
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono uppercase tracking-wide font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Sovereign Regulatory Country Assignment *</label>
                <select
                  required
                  disabled={!isGlobalMode}
                  value={isGlobalMode ? formCountryId : activeOffice}
                  onChange={(e) => setFormCountryId(e.target.value)}
                  className="w-full bg-slate-100 disabled:bg-slate-100/70 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">-- Assigned Sovereign Country --</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.currency}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="logistics@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Registered Office Address</label>
                <textarea
                  placeholder="Building No, Industrial block, City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-14 transition-colors font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  Proposed Credit Limit ({isGlobalMode ? 'Corporate Granted' : 'Branch Proposed'})
                  <span className="text-[10px] text-slate-400 font-mono">(USD equivalent)</span>
                </label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="COD">Due on Delivery (COD)</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-600">Phone Contact</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+91 22 1234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-3">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-md"
              >
                {isGlobalMode ? 'Approve & Save Customer' : 'Save Draft Client Profile'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Top Banner indicating Pending Approvals if Global Mode is active */}
      {isGlobalMode && customers.some(c => c.status === 'pending_global_approval') && (
        <div id="pending-approvals-alert" className="bg-amber-50 border-2 border-amber-300 p-4 rounded-xl space-y-3 shadow-sm font-sans animate-pulse">
          <div className="flex items-center gap-2 text-amber-800">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <h4 className="text-xs font-black uppercase tracking-wider">
              Corporate Action Required: Outstanding Regional Sign-Offs ({customers.filter(c => c.status === 'pending_global_approval').length})
            </h4>
          </div>
          <p className="text-xs text-slate-600">
            Regional offices have uploaded target profiles and requested credit limit allocations. Execute risk assessment and tax verification audits below to authorize them.
          </p>
        </div>
      )}

      {/* Directory Filter Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs">
        {/* Sublist Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              statusTab === 'all' 
                ? 'bg-white text-slate-800 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Accounts ({filteredByRegion.length})
          </button>
          <button
            onClick={() => setStatusTab('approved')}
            className={`px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              statusTab === 'approved' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            Approved ({filteredByRegion.filter(c => !c.status || c.status === 'approved').length})
          </button>
          <button
            onClick={() => setStatusTab('pending')}
            className={`px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              statusTab === 'pending' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-slate-500 hover:text-amber-700'
            }`}
          >
            Awaiting Approval ({filteredByRegion.filter(c => c.status === 'pending_global_approval').length})
          </button>
          <button
            onClick={() => setStatusTab('draft-rejected')}
            className={`px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              statusTab === 'draft-rejected' 
                ? 'bg-slate-700 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Draft / Rejected ({filteredByRegion.filter(c => c.status === 'draft' || c.status === 'rejected').length})
          </button>
        </div>

        {/* Dynamic Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search company or Tax ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 text-xs font-medium"
          />
        </div>
      </div>

      {/* Global Admin Rejection Backdrop dialog */}
      {rejectingCustomerId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs font-sans">
          <div className="bg-white border-2 border-red-500 rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <strong className="font-extrabold uppercase">Reject Regional Application</strong>
            </div>
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">Audit Discrepancy Description / Correction Requirements <span className="text-red-500">*</span></label>
              <textarea
                placeholder="e.g. Please upload PAN Card/GSTIN filings; GSTIN format does not correspond to specified Chennai corporate register."
                required
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-medium text-slate-800 focus:outline-none focus:border-red-500 h-24"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectingCustomerId(null);
                  setRejectionReasonInput('');
                }}
                className="px-3 py-1.5 font-bold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
              <button
                type="button"
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

      {/* Registry Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm" id="customer-registry-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
              <tr>
                <th className="px-5 py-3">Jurisdiction</th>
                <th className="px-5 py-3">Company Details & Address</th>
                <th className="px-5 py-3">Sovereign Tax ID</th>
                <th className="px-5 py-3">Credit Limit Allocation</th>
                <th className="px-5 py-3">Payment Terms</th>
                <th className="px-5 py-3">Sovereign Contact Channels</th>
                <th className="px-5 py-3 text-right">Approval Workflow & Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-600">
              {finalFilteredCustomers.map((c) => {
                const matchedCountry = countries.find(co => co.id === c.countryId);
                const status = c.status || 'approved';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Country Jurisdiction Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-extrabold text-slate-900 leading-none">
                            {matchedCountry ? matchedCountry.code : 'N/A'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {matchedCountry ? matchedCountry.name : 'Corporate'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Company Details & Address */}
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate" title={c.address}>
                          {c.address ? c.address : 'No Address Specified'}
                        </div>
                        {status === 'rejected' && c.rejectionReason && (
                          <div className="mt-1 bg-red-50 border border-red-100 text-[10px] text-red-700 p-1.5 rounded leading-normal max-w-xs">
                            <span className="font-bold block uppercase tracking-wide">Correction Requested:</span>
                            {c.rejectionReason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Tax ID */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono bg-slate-10/40 bg-slate-50 border border-slate-200 px-2 py-1 rounded font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                        {c.taxId}
                      </span>
                    </td>

                    {/* Credit Limit */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-black text-slate-800 block text-sm">
                        ${c.creditLimit.toLocaleString()}.00 
                        <span className="text-[9px] text-slate-400 font-sans font-medium block">USD equivalent</span>
                      </span>
                    </td>

                    {/* Payment Terms */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded font-mono text-[9px] uppercase font-black tracking-widest">
                        {c.paymentTerms}
                      </span>
                    </td>

                    {/* Contacts */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px] font-medium" title={c.email}>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Workflow Status badges & Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end gap-1.5">
                        
                        {/* 1. Show descriptive status badge */}
                        {status === 'approved' && (
                          <div className="inline-flex items-center gap-1 font-black text-emerald-600 text-[9px] uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-sm">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> AUDITED &amp; APPROVED
                          </div>
                        )}

                        {status === 'pending_global_approval' && (
                          <div className="inline-flex items-center gap-1 font-black text-amber-600 text-[9px] uppercase tracking-wider bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-sm anim-pulse">
                            <Eye className="w-3 h-3 text-amber-500 shrink-0" /> HQ RISK AUDIT PENDING
                          </div>
                        )}

                        {status === 'draft' && (
                          <div className="inline-flex items-center gap-1 font-black text-indigo-600 text-[9px] uppercase tracking-wider bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-sm">
                            <Info className="w-3 h-3 text-indigo-500 shrink-0" /> LOCAL DRAFT
                          </div>
                        )}

                        {status === 'rejected' && (
                          <div className="inline-flex items-center gap-1 font-black text-red-600 text-[9px] uppercase tracking-wider bg-red-50 border border-red-150 px-2.5 py-0.5 rounded-sm">
                            <XCircle className="w-3 h-3 text-red-500 shrink-0" /> CORRECTION REQUIRED
                          </div>
                        )}

                        {/* 2. Actions depending on current simulated role */}
                        <div className="mt-1 flex items-center justify-end gap-1.5">
                          {isGlobalMode ? (
                            // Global HQ Controls
                            status === 'pending_global_approval' && (
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-md">
                                <button
                                  id={`btn-approve-${c.id}`}
                                  onClick={() => handleGlobalApprove(c)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-sm text-[9px] uppercase tracking-wider flex items-center gap-0.5 transition"
                                  title="Approve credit limit and flag approved in system global index"
                                >
                                  <Check className="w-2.5 h-2.5" /> Approve Account
                                </button>
                                <button
                                  id={`btn-reject-${c.id}`}
                                  onClick={() => setRejectingCustomerId(c.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-black rounded-sm text-[9px] uppercase tracking-wider flex items-center gap-0.5 transition"
                                  title="Reject profile and request compliance corrections"
                                >
                                  <XCircle className="w-2.5 h-2.5" /> Request Corrections
                                </button>
                              </div>
                            )
                          ) : (
                            // Regional local operations controls
                            <>
                              {status === 'draft' && (
                                <button
                                  id={`btn-submitReview-${c.id}`}
                                  onClick={() => submitToGlobalReview(c)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-black rounded text-[9px] uppercase tracking-wider transition flex items-center gap-1"
                                >
                                  Submit for HQ Audit <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}

                              {status === 'rejected' && (
                                <button
                                  id={`btn-reSubmit-${c.id}`}
                                  onClick={() => submitToGlobalReview(c)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded text-[9px] uppercase tracking-wider transition flex items-center gap-1"
                                >
                                  Re-Submit to Audit <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>

                      </div>
                    </td>
                  </tr>
                );
              })}

              {finalFilteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 italic">
                    No client profiles registered under search and status criteria for this operational branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DDL / SQL Schema Relational Audit Hint */}
      <div className="bg-slate-900 border border-slate-950 rounded-xl p-4 text-slate-300 text-xs space-y-2 font-sans shadow-inner">
        <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">Relational Integrity Scope (DDL Architecture Mapping)</div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          In our PostgreSQL physical schema, the <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded font-mono">customer_masters</code> table exposes a strict <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded font-mono">country_id VARCHAR(50) REFERENCES logistics_countries(id) ON DELETE RESTRICT</code> foreign-key restraint. In real-world enterprise architectures, localized user session context filters queries such that <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded font-mono">SELECT * FROM customer_masters WHERE country_id = ?</code>, effectively quarantining customer credit reports within sovereign physical boundaries and completely barring horizontal data breaches under international risk policy.
        </p>
      </div>

    </div>
  );
}
