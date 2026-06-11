/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Region } from '../types';
import { 
  Globe, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Info,
  Calendar,
  DollarSign,
  Clock,
  BookOpen,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegionMasterProps {
  regions: Region[];
  onAddRegion: (region: Region) => void;
  onUpdateRegion: (region: Region) => void;
  onDeleteRegion: (id: string) => void;
}

export default function RegionMaster({
  regions,
  onAddRegion,
  onUpdateRegion,
  onDeleteRegion
}: RegionMasterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [taxLabel, setTaxLabel] = useState('VAT');
  const [taxRate, setTaxRate] = useState(10);
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [secondaryLanguage, setSecondaryLanguage] = useState('');
  const [govtRefFields, setGovtRefFields] = useState<string[]>([]);
  const [freeTimeDays, setFreeTimeDays] = useState(5);
  const [isActive, setIsActive] = useState(true);
  
  // UI helper for dynamic tags
  const [newTagInput, setNewTagInput] = useState('');
  
  // Custom Delete Confirmation state
  const [regionToDeleteId, setRegionToDeleteId] = useState<string | null>(null);

  // Filter regions based on search
  const filteredRegions = regions.filter(r => {
    const term = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.code.toLowerCase().includes(term) ||
      (r.country || '').toLowerCase().includes(term) ||
      (r.taxLabel || '').toLowerCase().includes(term)
    );
  });

  const handleOpenAdd = () => {
    setEditingRegion(null);
    setName('');
    setCode('');
    setCountry('');
    setCurrency('USD');
    setCurrencySymbol('$');
    setTimezone('UTC');
    setDateFormat('DD/MM/YYYY');
    setTaxLabel('VAT');
    setTaxRate(10);
    setPrimaryLanguage('English');
    setSecondaryLanguage('');
    setGovtRefFields(['E-way Bill No', 'BOE No']);
    setFreeTimeDays(5);
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (r: Region) => {
    setEditingRegion(r);
    setName(r.name);
    setCode(r.code);
    setCountry(r.country || '');
    setCurrency(r.currency || 'USD');
    setCurrencySymbol(r.currencySymbol || '$');
    setTimezone(r.timezone || 'UTC');
    setDateFormat(r.dateFormat || 'DD/MM/YYYY');
    setTaxLabel(r.taxLabel || 'VAT');
    setTaxRate(r.taxRate !== undefined ? r.taxRate : 10);
    setPrimaryLanguage(r.primaryLanguage || 'English');
    setSecondaryLanguage(r.secondaryLanguage || '');
    setGovtRefFields(r.govtRefFields || []);
    setFreeTimeDays(r.freeTimeDays !== undefined ? r.freeTimeDays : 5);
    setIsActive(r.isActive !== undefined ? r.isActive : true);
    setShowModal(true);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (tag && !govtRefFields.includes(tag)) {
      setGovtRefFields([...govtRefFields, tag]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setGovtRefFields(govtRefFields.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !country.trim()) {
      alert('Please fill in Name, Code, and Country.');
      return;
    }

    if (code.trim().length > 4) {
      alert('Code must be 4 characters or fewer.');
      return;
    }

    const regionData: Region = {
      id: editingRegion ? editingRegion.id : `reg-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      country: country.trim(),
      currency: currency.trim().toUpperCase(),
      currencySymbol: currencySymbol.trim(),
      timezone: timezone.trim(),
      dateFormat: dateFormat.trim(),
      taxLabel: taxLabel.trim().toUpperCase(),
      taxRate: Number(taxRate),
      primaryLanguage: primaryLanguage.trim(),
      secondaryLanguage: secondaryLanguage.trim(),
      govtRefFields: govtRefFields,
      freeTimeDays: Number(freeTimeDays),
      isActive: isActive,
      createdAt: editingRegion ? (editingRegion.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    if (editingRegion) {
      onUpdateRegion(regionData);
    } else {
      onAddRegion(regionData);
    }
    setShowModal(false);
  };

  const handleToggleActive = (r: Region) => {
    onUpdateRegion({
      ...r,
      isActive: r.isActive !== undefined ? !r.isActive : false
    });
  };

  const executeDelete = () => {
    if (regionToDeleteId) {
      onDeleteRegion(regionToDeleteId);
      setRegionToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6" id="region-master-section">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600 animate-pulse" /> Standalone Region Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure sovereign corporate trade boundaries, legal entity localization pairs, billing currencies, and tax standards.
          </p>
        </div>

        <button
          id="btn-add-new-region"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm shadow-blue-150 transition-all flex items-center justify-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" /> Define Brand Region
        </button>
      </div>

      {/* Info Banner on Standalone Scoping */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-start gap-3 text-xs text-slate-600 font-sans shadow-xs">
        <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">Corporate Admin Hierarchy & Scope Standards</span>
          <p className="leading-relaxed">
            All transaction directories, including <strong className="font-bold text-slate-700">Fleet Assets, Drivers, Location Hubs, and Customers</strong> map back to these Region definitions via foreign keys. Setting regional parameters here dictates the automated tax application, local calendar formats, Consignment Note custom metadata labels, and default detention thresholds during live operations.
          </p>
        </div>
      </div>

      {/* Toolbar Search Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-200 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search regions by code, name, country or label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded pl-9 pr-3 py-1.5 focus:outline-none focus:border-blue-500 text-xs font-semibold"
          />
        </div>
        <div className="text-slate-500 font-mono text-[11px] font-bold">
          Active Global Regions: <span className="text-slate-800 font-black">{regions.length}</span> (Active)
        </div>
      </div>

      {/* Regions table listing */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
              <tr>
                <th className="px-5 py-3">Region Code</th>
                <th className="px-5 py-3">Region Name & Country</th>
                <th className="px-5 py-3">Currency</th>
                <th className="px-5 py-3">Timezone / Format</th>
                <th className="px-5 py-3">Local Tax Rules</th>
                <th className="px-5 py-3">Bilingual Config</th>
                <th className="px-5 py-3">Ref Headers</th>
                <th className="px-5 py-3">Free Days</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-650">
              {filteredRegions.map((r) => {
                const isRegActive = r.isActive !== false;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Region Code */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 font-mono text-[10px] font-bold bg-slate-900 text-slate-100 border border-slate-950 rounded uppercase tracking-wider">
                        {r.code}
                      </span>
                    </td>

                    {/* Name & Country */}
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm leading-tight">{r.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" /> {r.country || 'Not Specified'}
                        </div>
                      </div>
                    </td>

                    {/* Currency */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800">
                        {r.currencySymbol || '$'} <span className="text-slate-400 font-sans text-[10px] font-medium">{r.currency || 'USD'}</span>
                      </div>
                    </td>

                    {/* Timezone / Date format */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="font-mono text-[10px] text-slate-650 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {r.timezone || 'UTC'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          Format: {r.dateFormat || 'DD/MM/YYYY'}
                        </div>
                      </div>
                    </td>

                    {/* Tax label & rate */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-extrabold text-indigo-700 font-mono text-[10px]">{r.taxLabel || 'VAT'}</span> 
                        <span className="font-bold text-slate-800 ml-1">@{r.taxRate || 0}%</span>
                      </div>
                    </td>

                    {/* Primary & Secondary language */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-0.5 font-medium">
                        <div className="text-slate-800">{r.primaryLanguage || 'English'}</div>
                        {r.secondaryLanguage && (
                          <div className="text-[9px] text-slate-400 flex items-center gap-1 italic">
                            <span>Dual:</span> <span className="font-mono text-indigo-600 bg-indigo-50/50 px-1 rounded">{r.secondaryLanguage}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Custom Government Ref fields */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {r.govtRefFields && r.govtRefFields.length > 0 ? (
                          r.govtRefFields.map((field, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-600 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                              {field}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">None defined</span>
                        )}
                      </div>
                    </td>

                    {/* Detention free threshold */}
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-center">
                      <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm">{r.freeTimeDays || 0}</span>
                      <span className="text-[9px] text-slate-400 ml-1 font-sans font-semibold">days</span>
                    </td>

                    {/* Status Toggle control */}
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleActive(r)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all border ${
                          isRegActive 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-red-50 text-red-800 border-red-150'
                        }`}
                        title="Click to toggle regional operational status"
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isRegActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {isRegActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1 px-2 rounded hover:bg-slate-100 text-slate-700 border border-slate-100 flex items-center gap-0.5 text-[10px] font-bold transition-all"
                          title="Modify corporate and localization fields"
                        >
                          <Edit className="w-3 h-3 text-blue-500" /> Edit
                        </button>
                        <button
                          onClick={() => setRegionToDeleteId(r.id)}
                          className="p-1 rounded hover:bg-red-50 text-red-650 flex items-center gap-0.5 text-[10px] font-bold transition-all"
                          title="Permanently remove region parameters list"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRegions.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400 italic">
                    No active or historical operational regions matched the search filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DDL Architecture mapping notice */}
      <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl text-slate-300 text-xs font-sans shadow-inner space-y-2">
        <span className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-extrabold block">Relational Database Integration mapping</span>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          The fields declared above write back to the <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded font-mono">logistics_regions</code> tables. During active quotation generation, the app looks up <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded font-mono">logistics_regions.currency</code> to auto-apply rates, and binds custom headers defined in <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded font-mono">govtRefFields</code> as dynamic entry cells on Consignment notes, generating compliant bilateral tax invoices, preventing system conflicts and multi-million revenue leakages.
        </p>
      </div>

      {/* Add / Edit Modal Drawer */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            {/* Container for scroll and spacing */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans text-xs text-slate-700"
              >
                {/* Header */}
                <div className="bg-slate-900 text-white p-5 border-b border-slate-850 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                      {editingRegion ? 'Edit Operating Territory Parameters' : 'Create Global Regional Branch'}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Define strict corporate codes, billing details, and customized legal billing parameters.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Region name */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650">Region Name <span className="text-blue-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. India Operations"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* Short Code */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650">Region Short Code <span className="text-blue-500">*</span> <span className="text-[10px] text-slate-400 font-mono">(Max 4 characters)</span></label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        placeholder="e.g. IN"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-bold uppercase tracking-wide"
                      />
                    </div>

                    {/* Country context */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650">Country <span className="text-blue-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. India"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* Currency Code */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Accounting Currency
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. INR"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-extrabold uppercase"
                      />
                    </div>

                    {/* Currency Symbol */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650">Currency Symbol</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ₹"
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-bold cursor-pointer"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (MYT)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                      </select>
                    </div>

                    {/* Date format */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650">Date Format Style</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. DD/MM/YYYY"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>

                    {/* Tax Label */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650 font-mono">Tax Descriptor Label</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. GST"
                        value={taxLabel}
                        onChange={(e) => setTaxLabel(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-bold uppercase"
                      />
                    </div>

                    {/* Tax Rate Percentage */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650">Tax Percentage (%)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 18"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>

                    {/* Primary Language */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Primary Language
                      </label>
                      <input
                        type="text"
                        required
                        value={primaryLanguage}
                        onChange={(e) => setPrimaryLanguage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>

                    {/* Secondary Language */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650">Secondary (Bilingual Paperwork)</label>
                      <input
                        type="text"
                        placeholder="e.g. Tamil or Arabic"
                        value={secondaryLanguage}
                        onChange={(e) => setSecondaryLanguage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none placeholder:italic"
                      />
                    </div>

                    {/* Free-time threshold detention */}
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-650 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Free Detention Days
                      </label>
                      <input
                        type="number"
                        required
                        value={freeTimeDays}
                        onChange={(e) => setFreeTimeDays(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Corporate status check */}
                    <div className="md:col-span-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer mt-0.5"
                        />
                        <span>Enable Regional Operations (Allow Billing/Dispatch Routing)</span>
                      </label>
                    </div>

                  </div>

                  {/* Consignment Note Government Reference Fields Array section */}
                  <div className="border-t border-slate-100 pt-3.5 space-y-2">
                    <label className="block font-bold text-slate-650 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" /> 
                      CN Government Reference Input Form Fields 
                      <span className="text-[10px] text-slate-400 font-mono">(Custom headers e.g. E-way Bill No)</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add parameter header (e.g. BOE Number)"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const tag = newTagInput.trim();
                            if (tag && !govtRefFields.includes(tag)) {
                              setGovtRefFields([...govtRefFields, tag]);
                            }
                            setNewTagInput('');
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleAddTag(e)}
                        className="px-3.5 py-1.5 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 text-xs shadow-xs"
                      >
                        Add Tag
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[48px]">
                      {govtRefFields.map((f, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-white border border-slate-200/90 text-[10px] font-extrabold text-slate-700 px-2.5 py-1 rounded shadow-2xs">
                          {f}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(f)}
                            className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-105 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}

                      {govtRefFields.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic p-1">No custom government headers defined for bilateral shipping papers.</span>
                      )}
                    </div>
                  </div>

                  {/* Submission and controls */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    >
                      Close Form
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded shadow transition text-xs"
                    >
                      {editingRegion ? 'Save Changes' : 'Initialize Active Region'}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Drawer */}
      <AnimatePresence>
        {regionToDeleteId && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRegionToDeleteId(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            />
            
            {/* Modal Dialog */}
            <div className="flex min-h-screen items-center justify-center p-4 w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white max-w-sm w-full rounded-xl border border-slate-200 shadow-xl overflow-hidden font-sans text-xs text-slate-700 p-5 space-y-4"
              >
                <div className="flex items-center gap-2.5 text-red-650">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <strong className="font-extrabold text-sm uppercase tracking-wide">Confirm Permanent Deletion</strong>
                </div>

                <p className="text-slate-500 leading-relaxed font-semibold">
                  Are you absolutely sure you want to delete this region configuration? Doing so may isolate assets, drivers, or quotations that carry references to this system ID!
                </p>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-105">
                  <button
                    type="button"
                    onClick={() => setRegionToDeleteId(null)}
                    className="px-3 py-1.5 font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeDelete}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black rounded"
                  >
                    Verify Deletion
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
