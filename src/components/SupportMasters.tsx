/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShippingLine, 
  Vessel, 
  Vendor, 
  ContainerType, 
  Region,
  SupportedLanguage,
  MasterTranslation
} from '../types';
import { 
  Ship, 
  Container, 
  Building2, 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  Globe, 
  Coins 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LanguageSwitcher from './LanguageSwitcher';

interface SupportMastersProps {
  shippingLines: ShippingLine[];
  vessels: Vessel[];
  vendors: Vendor[];
  containerTypes: ContainerType[];
  regions: Region[];
  onAddShippingLine: (record: ShippingLine) => void;
  onUpdateShippingLine: (record: ShippingLine) => void;
  onDeleteShippingLine: (id: string) => void;
  onAddVessel: (record: Vessel) => void;
  onUpdateVessel: (record: Vessel) => void;
  onDeleteVessel: (id: string) => void;
  onAddVendor: (record: Vendor) => void;
  onUpdateVendor: (record: Vendor) => void;
  onDeleteVendor: (id: string) => void;
  onAddContainerType: (record: ContainerType) => void;
  onUpdateContainerType: (record: ContainerType) => void;
  onDeleteContainerType: (id: string) => void;
  supportedLanguages: SupportedLanguage[];
  masterTranslations: MasterTranslation[];
  onAddMasterTranslation: (entry: MasterTranslation) => void;
  onUpdateMasterTranslation: (entry: MasterTranslation) => void;
}

type TabType = 'shipping-lines' | 'vessels' | 'vendors' | 'container-types';

export default function SupportMasters({
  shippingLines,
  vessels,
  vendors,
  containerTypes,
  regions,
  onAddShippingLine,
  onUpdateShippingLine,
  onDeleteShippingLine,
  onAddVessel,
  onUpdateVessel,
  onDeleteVessel,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onAddContainerType,
  onUpdateContainerType,
  onDeleteContainerType,
  supportedLanguages,
  masterTranslations,
  onAddMasterTranslation,
  onUpdateMasterTranslation
}: SupportMastersProps) {
  const [activeTab, setActiveTab] = useState<TabType>('shipping-lines');

  // Modal and Editing states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Delete confirmations
  const [deletingRecord, setDeletingRecord] = useState<{ id: string, type: TabType } | null>(null);

  // Translation States
  const [translatedName, setTranslatedName] = useState('');
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [activeLanguageCode, setActiveLanguageCode] = useState('en');
  const [saveMessage, setSaveMessage] = useState('');

  React.useEffect(() => {
    if (editingRecord && activeLanguageCode !== 'en') {
      const type = activeTab === 'vendors' ? 'vendor' : 'container_type';
      const existing = masterTranslations.find(
        t => t.masterRecordId === editingRecord.id && 
             t.languageCode === activeLanguageCode && 
             t.masterType === type
      );
      setTranslatedName(existing?.translatedName || '');
      setTranslatedDescription(existing?.translatedDescription || '');
    } else {
      setTranslatedName('');
      setTranslatedDescription('');
    }
  }, [editingRecord, activeLanguageCode, activeTab, masterTranslations]);

  // Form states - Shipping Line
  const [slName, setSlName] = useState('');
  const [slScacCode, setSlScacCode] = useState('');
  const [slShortCode, setSlShortCode] = useState('');
  const [slLogoColor, setSlLogoColor] = useState('#2563EB');
  const [slFreeTime, setSlFreeTime] = useState(7);
  const [slDetention, setSlDetention] = useState(5000);
  const [slCurrency, setSlCurrency] = useState('INR');
  const [slRegionId, setSlRegionId] = useState('IN');
  const [slIsActive, setSlIsActive] = useState(true);

  // Form states - Vessel
  const [vsName, setVsName] = useState('');
  const [vsImo, setVsImo] = useState('');
  const [vsShippingLineId, setVsShippingLineId] = useState('');
  const [vsFlag, setVsFlag] = useState('Panama');
  const [vsType, setVsType] = useState('Container Ship');
  const [vsIsActive, setVsIsActive] = useState(true);

  // Form states - Vendor
  const [vnName, setVnName] = useState('');
  const [vnCode, setVnCode] = useState('');
  const [vnContact, setVnContact] = useState('');
  const [vnPhone, setVnPhone] = useState('');
  const [vnEmail, setVnEmail] = useState('');
  const [vnAddress, setVnAddress] = useState('');
  const [vnRegionId, setVnRegionId] = useState('IN');
  const [vnTaxId, setVnTaxId] = useState('');
  const [vnPaymentTerms, setVnPaymentTerms] = useState('Net 30');
  const [vnSpec, setVnSpec] = useState<'Haulage' | 'Customs' | 'Both'>('Haulage');
  const [vnIsActive, setVnIsActive] = useState(true);

  // Form states - Container Type
  const [ctCode, setCtCode] = useState('');
  const [ctName, setCtName] = useState('');
  const [ctIsoCode, setCtIsoCode] = useState('');
  const [ctLength, setCtLength] = useState(40);
  const [ctHeight, setCtHeight] = useState(9.5);
  const [ctTare, setCtTare] = useState(3800);
  const [ctPayload, setCtPayload] = useState(28000);
  const [ctCategory, setCtCategory] = useState<'Dry' | 'Reefer' | 'Flat Rack' | 'Open Top' | 'Tank'>('Dry');
  const [ctIsActive, setCtIsActive] = useState(true);

  const resetFormValues = () => {
    setEditingRecord(null);

    // Shipping
    setSlName('');
    setSlScacCode('');
    setSlShortCode('');
    setSlLogoColor('#2563EB');
    setSlFreeTime(7);
    setSlDetention(5000);
    setSlCurrency('INR');
    setSlRegionId('IN');
    setSlIsActive(true);

    // Vessel
    setVsName('');
    setVsImo('');
    setVsShippingLineId(shippingLines[0]?.id || '');
    setVsFlag('Panama');
    setVsType('Container Ship');
    setVsIsActive(true);

    // Vendor
    setVnName('');
    setVnCode('');
    setVnContact('');
    setVnPhone('');
    setVnEmail('');
    setVnAddress('');
    setVnRegionId('IN');
    setVnTaxId('');
    setVnPaymentTerms('Net 30');
    setVnSpec('Haulage');
    setVnIsActive(true);

    // Container Type
    setCtCode('');
    setCtName('');
    setCtIsoCode('');
    setCtLength(40);
    setCtHeight(9.5);
    setCtTare(3800);
    setCtPayload(28000);
    setCtCategory('Dry');
    setCtIsActive(true);
    setActiveLanguageCode('en');
    setSaveMessage('');
  };

  const handleOpenAddModal = () => {
    resetFormValues();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: any) => {
    setEditingRecord(record);
    if (activeTab === 'shipping-lines') {
      const r = record as ShippingLine;
      setSlName(r.name);
      setSlScacCode(r.scacCode);
      setSlShortCode(r.shortCode);
      setSlLogoColor(r.logoColor);
      setSlFreeTime(r.freeTimeDays);
      setSlDetention(r.detentionRatePerDay);
      setSlCurrency(r.currency);
      setSlRegionId(r.regionId || 'IN');
      setSlIsActive(r.isActive);
    } else if (activeTab === 'vessels') {
      const r = record as Vessel;
      setVsName(r.vesselName);
      setVsImo(r.imoNumber);
      setVsShippingLineId(r.shippingLineId);
      setVsFlag(r.flag);
      setVsType(r.vesselType);
      setVsIsActive(r.isActive);
    } else if (activeTab === 'vendors') {
      const r = record as Vendor;
      setVnName(r.vendorName);
      setVnCode(r.vendorCode);
      setVnContact(r.contactPerson);
      setVnPhone(r.phone);
      setVnEmail(r.email);
      setVnAddress(r.address);
      setVnRegionId(r.regionId || 'IN');
      setVnTaxId(r.taxId);
      setVnPaymentTerms(r.paymentTerms);
      setVnSpec(r.specialization as 'Haulage' | 'Customs' | 'Both');
      setVnIsActive(r.isActive);
    } else if (activeTab === 'container-types') {
      const r = record as ContainerType;
      setCtCode(r.code);
      setCtName(r.name);
      setCtIsoCode(r.isoCode);
      setCtLength(r.lengthFt);
      setCtHeight(r.heightFt);
      setCtTare(r.tareWeightKg);
      setCtPayload(r.maxPayloadKg);
      setCtCategory(r.category);
      setCtIsActive(r.isActive);
    }
    setIsModalOpen(true);
  };

  const handleToggleActive = (record: any, type: TabType) => {
    if (type === 'shipping-lines') {
      const r = record as ShippingLine;
      onUpdateShippingLine({ ...r, isActive: !r.isActive });
    } else if (type === 'vessels') {
      const r = record as Vessel;
      onUpdateVessel({ ...r, isActive: !r.isActive });
    } else if (type === 'vendors') {
      const r = record as Vendor;
      onUpdateVendor({ ...r, isActive: !r.isActive });
    } else if (type === 'container-types') {
      const r = record as ContainerType;
      onUpdateContainerType({ ...r, isActive: !r.isActive });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRecord && activeLanguageCode !== 'en') {
      const type = activeTab === 'vendors' ? 'vendor' : 'container_type';
      const existing = masterTranslations.find(
        t => t.masterRecordId === editingRecord.id && 
             t.languageCode === activeLanguageCode && 
             t.masterType === type
      );
      
      const updatedTrans: MasterTranslation = {
        id: existing?.id || `mt-${Date.now()}`,
        languageCode: activeLanguageCode,
        masterType: type as any,
        masterRecordId: editingRecord.id,
        translatedName: translatedName.trim(),
        translatedDescription: translatedDescription.trim(),
        isVerified: existing?.isVerified || false,
        updatedAt: new Date().toISOString()
      };
      
      if (existing) {
        onUpdateMasterTranslation(updatedTrans);
      } else {
        onAddMasterTranslation(updatedTrans);
      }
      
      const langName = supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode;
      setSaveMessage(`${langName} saved ✓`);
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    if (activeTab === 'shipping-lines') {
      if (!slName || !slScacCode || !slShortCode) {
        alert('Please fill out all required fields.');
        return;
      }
      const recordData: ShippingLine = {
        id: editingRecord?.id || `ship-${Date.now()}`,
        name: slName.trim(),
        scacCode: slScacCode.toUpperCase().trim(),
        shortCode: slShortCode.trim(),
        logoColor: slLogoColor,
        freeTimeDays: Number(slFreeTime),
        detentionRatePerDay: Number(slDetention),
        currency: slCurrency,
        regionId: slRegionId,
        isActive: slIsActive
      };

      if (editingRecord) {
        onUpdateShippingLine(recordData);
      } else {
        onAddShippingLine(recordData);
      }
    } else if (activeTab === 'vessels') {
      if (!vsName || !vsImo || !vsShippingLineId) {
        alert('Please fill out all required fields.');
        return;
      }
      const recordData: Vessel = {
        id: editingRecord?.id || `vess-${Date.now()}`,
        vesselName: vsName.trim(),
        imoNumber: vsImo.trim(),
        shippingLineId: vsShippingLineId,
        flag: vsFlag,
        vesselType: vsType,
        isActive: vsIsActive
      };

      if (editingRecord) {
        onUpdateVessel(recordData);
      } else {
        onAddVessel(recordData);
      }
    } else if (activeTab === 'vendors') {
      if (!vnName || !vnCode || !vnTaxId) {
        alert('Please fill out all required fields.');
        return;
      }
      const recordData: Vendor = {
        id: editingRecord?.id || `vend-${Date.now()}`,
        vendorName: vnName.trim(),
        vendorCode: vnCode.toUpperCase().trim(),
        contactPerson: vnContact.trim(),
        phone: vnPhone.trim(),
        email: vnEmail.trim(),
        address: vnAddress.trim(),
        regionId: vnRegionId,
        taxId: vnTaxId.toUpperCase().trim(),
        paymentTerms: vnPaymentTerms,
        specialization: vnSpec,
        isActive: vnIsActive
      };

      if (editingRecord) {
        onUpdateVendor(recordData);
      } else {
        onAddVendor(recordData);
      }
    } else if (activeTab === 'container-types') {
      if (!ctCode || !ctName || !ctIsoCode) {
        alert('Please fill out all required fields.');
        return;
      }
      const recordData: ContainerType = {
        id: editingRecord?.id || `ct-${Date.now()}`,
        code: ctCode.toUpperCase().trim(),
        name: ctName.trim(),
        isoCode: ctIsoCode.toUpperCase().trim(),
        lengthFt: Number(ctLength),
        heightFt: Number(ctHeight),
        tareWeightKg: Number(ctTare),
        maxPayloadKg: Number(ctPayload),
        category: ctCategory,
        isActive: ctIsActive
      };

      if (editingRecord) {
        onUpdateContainerType(recordData);
      } else {
        onAddContainerType(recordData);
      }
    }
    setIsModalOpen(false);
    resetFormValues();
  };

  const confirmDelete = () => {
    if (!deletingRecord) return;
    const { id, type } = deletingRecord;
    if (type === 'shipping-lines') {
      onDeleteShippingLine(id);
    } else if (type === 'vessels') {
      onDeleteVessel(id);
    } else if (type === 'vendors') {
      onDeleteVendor(id);
    } else if (type === 'container-types') {
      onDeleteContainerType(id);
    }
    setDeletingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Upper Navigation & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">System Support Masters</h2>
          <p className="text-xs text-slate-500">Configure global supply chain masters, ocean carriers, regional subhauliers, and equipment formats.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition duration-150 self-start md:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'shipping-lines' && 'Add Shipping Line'}
          {activeTab === 'vessels' && 'Add Ocean Vessel'}
          {activeTab === 'vendors' && 'Add Vendor Broker'}
          {activeTab === 'container-types' && 'Add Equipment Type'}
        </button>
      </div>

      {/* Tabs Menu Section */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Support Master tabs">
          {[
            { id: 'shipping-lines', label: 'Shipping Lines', count: shippingLines.length, icon: Ship },
            { id: 'vessels', label: 'Ocean Vessels', count: vessels.length, icon: Ship },
            { id: 'vendors', label: 'Vendors & Subcontractors', count: vendors.length, icon: Building2 },
            { id: 'container-types', label: 'Equipment Sizes', count: containerTypes.length, icon: Container }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  resetFormValues();
                }}
                className={`py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition duration-200 ${
                  isActive 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Tables */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {activeTab === 'shipping-lines' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <th className="px-6 py-4">Carrier Identity</th>
                  <th className="px-6 py-4">SCAC Badge</th>
                  <th className="px-6 py-4">Sovereign Gate</th>
                  <th className="px-6 py-4">Free Time (Import/Export)</th>
                  <th className="px-6 py-4">Detention Daily Tariff</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {shippingLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/70 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span 
                          className="h-3 w-3 rounded-full shrink-0" 
                          style={{ backgroundColor: line.logoColor || '#cbd5e1' }}
                        />
                        <div>
                          <p className="font-extrabold text-slate-800">{line.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Acronym: {line.shortCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60 font-bold">
                        {line.scacCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">
                      {line.regionId || 'Global'}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-700">
                      {line.freeTimeDays} Days Default
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-slate-800">
                        ₹{line.detentionRatePerDay.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans tracking-wide">
                        Per Container / {line.currency || 'INR'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(line, 'shipping-lines')}
                        className={`px-2 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full border transition duration-150 ${
                          line.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {line.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(line)}
                          className="text-slate-500 hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded transition duration-150"
                          title="Edit Master Record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRecord({ id: line.id, type: 'shipping-lines' })}
                          className="text-slate-400 hover:text-red-650 hover:bg-red-50 p-1.5 rounded transition duration-150"
                          title="Delete Master Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shippingLines.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                      No shipping lines defined. Map ocean carriers to bootstrap booking rosters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'vessels' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <th className="px-6 py-4">Vessel Name</th>
                  <th className="px-6 py-4">IMO Registry</th>
                  <th className="px-6 py-4">Shipping Line Parent</th>
                  <th className="px-6 py-4">Flag Certificate</th>
                  <th className="px-6 py-4">Hull Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {vessels.map((vs) => {
                  const correlatedCarrier = shippingLines.find(l => l.id === vs.shippingLineId);
                  return (
                    <tr key={vs.id} className="hover:bg-slate-50/70 transition duration-150">
                      <td className="px-6 py-4 font-extrabold text-slate-800">
                        {vs.vesselName}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-600">
                        IMO {vs.imoNumber}
                      </td>
                      <td className="px-6 py-4">
                        {correlatedCarrier ? (
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: correlatedCarrier.logoColor }}
                            />
                            <span className="font-extrabold text-slate-700">{correlatedCarrier.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Undefined Liner</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        🇺🇳 {vs.flag}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {vs.vesselType}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(vs, 'vessels')}
                          className={`px-2 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full border transition duration-150 ${
                            vs.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {vs.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(vs)}
                            className="text-slate-500 hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded transition duration-150"
                            title="Edit Master Record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingRecord({ id: vs.id, type: 'vessels' })}
                            className="text-slate-400 hover:text-red-650 hover:bg-red-50 p-1.5 rounded transition duration-150"
                            title="Delete Master Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {vessels.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                      No ocean vessels defined. Index regional feeder ships to schedule booking manifests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <th className="px-6 py-4">Vendor Identity</th>
                  <th className="px-6 py-4">Licensing / Tax ID</th>
                  <th className="px-6 py-4">Key Contact Desk</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Payment Terms</th>
                  <th className="px-6 py-4">Languages</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {vendors.map((vend) => (
                  <tr key={vend.id} className="hover:bg-slate-50/70 transition duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-extrabold text-slate-800">{vend.vendorName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Code: {vend.vendorCode} / Region: {vend.regionId || 'IN'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60 font-bold text-[11px]">
                          {vend.taxId}
                        </span>
                        <p className="text-[9px] text-slate-400 tracking-wide font-mono line-clamp-1 max-w-[150px]">{vend.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-700">{vend.contactPerson}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{vend.email} • {vend.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {vend.specialization === 'Haulage' && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                          Intermodal Hauler
                        </span>
                      )}
                      {vend.specialization === 'Customs' && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                          Customs Broker
                        </span>
                      )}
                      {vend.specialization === 'Both' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                          Consolidated Hub
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">
                      {vend.paymentTerms}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span 
                          onClick={() => {
                            handleOpenEditModal(vend);
                            setActiveLanguageCode('en');
                          }}
                          className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-1 py-0.5 rounded text-[9px] font-extrabold uppercase"
                          title="English (Master View)"
                        >
                          EN
                        </span>
                        {supportedLanguages.map(lang => {
                          const hasTrans = masterTranslations.some(
                            t => t.masterRecordId === vend.id && 
                                 t.languageCode === lang.code && 
                                 t.masterType === 'vendor'
                          );
                          return (
                            <span
                              key={lang.code}
                              onClick={() => {
                                handleOpenEditModal(vend);
                                setActiveLanguageCode(lang.code);
                              }}
                              className={`cursor-pointer px-1 py-0.5 rounded text-[9px] font-bold border transition ${
                                hasTrans
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200 border-dashed'
                              }`}
                              title={hasTrans ? `${lang.name} Complete` : `Add ${lang.name} Translation`}
                            >
                              {lang.code.toUpperCase()}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(vend, 'vendors')}
                        className={`px-2 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full border transition duration-150 ${
                          vend.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {vend.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(vend)}
                          className="text-slate-500 hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded transition duration-150"
                          title="Edit Master Record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRecord({ id: vend.id, type: 'vendors' })}
                          className="text-slate-400 hover:text-red-650 hover:bg-red-50 p-1.5 rounded transition duration-150"
                          title="Delete Master Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                      No subcontractors listed. Standardize dry drayage and duty broker vendors.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'container-types' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  <th className="px-6 py-4">Format / ISO Code</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Dimensions (L × H)</th>
                  <th className="px-6 py-4">Tare Mass</th>
                  <th className="px-6 py-4">Max Weight Capacity</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Languages</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {containerTypes.map((ct) => (
                  <tr key={ct.id} className="hover:bg-slate-50/70 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Container className="h-4 w-4 text-indigo-500 shrink-0" />
                        <div>
                          <p className="font-extrabold text-slate-800">{ct.code}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ISO: {ct.isoCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {ct.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono font-bold">
                      {ct.lengthFt}ft × {ct.heightFt}ft
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                      {ct.tareWeightKg.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className="font-black text-slate-800">
                        {(ct.maxPayloadKg / 1000).toFixed(1)} MT
                      </span>
                      <span className="text-[10px] text-slate-400 block tracking-normal uppercase font-sans">
                        {ct.maxPayloadKg.toLocaleString()} kg payload
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ct.category === 'Dry' && (
                        <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">
                          General Cargo (Dry)
                        </span>
                      )}
                      {ct.category === 'Reefer' && (
                        <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">
                          Temperature Controlled
                        </span>
                      )}
                      {ct.category === 'Flat Rack' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">
                          OOG / Flat Rack
                        </span>
                      )}
                      {ct.category === 'Open Top' && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">
                          Open Top Crane Load
                        </span>
                      )}
                      {ct.category === 'Tank' && (
                        <span className="bg-blue-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider">
                          ISO Tanker Gas/Liq
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span 
                          onClick={() => {
                            handleOpenEditModal(ct);
                            setActiveLanguageCode('en');
                          }}
                          className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-1 py-0.5 rounded text-[9px] font-extrabold uppercase"
                          title="English (Master View)"
                        >
                          EN
                        </span>
                        {supportedLanguages.map(lang => {
                          const hasTrans = masterTranslations.some(
                            t => t.masterRecordId === ct.id && 
                                 t.languageCode === lang.code && 
                                 t.masterType === 'container_type'
                          );
                          return (
                            <span
                              key={lang.code}
                              onClick={() => {
                                handleOpenEditModal(ct);
                                setActiveLanguageCode(lang.code);
                              }}
                              className={`cursor-pointer px-1 py-0.5 rounded text-[9px] font-bold border transition ${
                                hasTrans
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200 border-dashed'
                              }`}
                              title={hasTrans ? `${lang.name} Complete` : `Add ${lang.name} Translation`}
                            >
                              {lang.code.toUpperCase()}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(ct, 'container-types')}
                        className={`px-2 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full border transition duration-150 ${
                          ct.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {ct.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(ct)}
                          className="text-slate-500 hover:text-indigo-600 hover:bg-slate-100 p-1.5 rounded transition duration-150"
                          title="Edit Master Record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRecord({ id: ct.id, type: 'container-types' })}
                          className="text-slate-400 hover:text-red-650 hover:bg-red-50 p-1.5 rounded transition duration-150"
                          title="Delete Master Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {containerTypes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400 italic">
                      No heavy container sizes catalogued. Standardize ISO TEU types to trigger bookings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                  {editingRecord ? 'Modify Record' : 'Create New Record'} — {
                    activeTab === 'shipping-lines' ? 'Shipping Line' :
                    activeTab === 'vessels' ? 'Ocean Vessel' :
                    activeTab === 'vendors' ? 'Vendor Broker' :
                    'Equipment Size'
                  }
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {editingRecord && (activeTab === 'vendors' || activeTab === 'container-types') && (
                  <LanguageSwitcher
                    supportedLanguages={supportedLanguages}
                    activeLanguageCode={activeLanguageCode}
                    onChange={setActiveLanguageCode}
                  />
                )}
                {activeTab === 'shipping-lines' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Carrier Name*</label>
                        <input
                          type="text"
                          required
                          value={slName}
                          onChange={(e) => setSlName(e.target.value)}
                          placeholder="e.g. Ocean Network Express"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Standard Carrier Code (SCAC)*</label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={slScacCode}
                          onChange={(e) => setSlScacCode(e.target.value)}
                          placeholder="e.g. ONEY"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Short Brand Acronym*</label>
                        <input
                          type="text"
                          required
                          value={slShortCode}
                          onChange={(e) => setSlShortCode(e.target.value)}
                          placeholder="e.g. ONE"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">UI Hex Color Accent</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={slLogoColor}
                            onChange={(e) => setSlLogoColor(e.target.value)}
                            className="h-8 w-10 border rounded cursor-pointer p-0 w-12"
                          />
                          <input
                            type="text"
                            maxLength={7}
                            value={slLogoColor}
                            onChange={(e) => setSlLogoColor(e.target.value)}
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Free Storage Time (Days)*</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={slFreeTime}
                          onChange={(e) => setSlFreeTime(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Detention Demurrage Rate Per Day*</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min={0}
                            value={slDetention}
                            onChange={(e) => setSlDetention(Number(e.target.value))}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none pl-6 font-mono"
                          />
                          <Coins className="h-3.5 w-3.5 text-slate-400 absolute left-2 top-3" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Billing Currency</label>
                        <input
                          type="text"
                          required
                          value={slCurrency}
                          onChange={(e) => setSlCurrency(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Sovereign Land Region</label>
                        <select
                          value={slRegionId}
                          onChange={(e) => setSlRegionId(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                          {regions.map((reg) => (
                            <option key={reg.code} value={reg.code}>{reg.code} — {reg.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="slIsActive"
                        checked={slIsActive}
                        onChange={(e) => setSlIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="slIsActive" className="text-xs font-semibold text-slate-700 select-none">
                        Mark liner as active for live booking manifest workflows
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'vessels' && (
                  <div className="space-y-4 font-sans">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Ocean Liner Carrier Parent*</label>
                      <select
                        required
                        value={vsShippingLineId}
                        onChange={(e) => setVsShippingLineId(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold"
                      >
                        <option value="">-- Choose Shipping Line Master --</option>
                        {shippingLines.map(line => (
                          <option key={line.id} value={line.id}>{line.scacCode} — {line.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">International Vessel Name*</label>
                        <input
                          type="text"
                          required
                          value={vsName}
                          onChange={(e) => setVsName(e.target.value)}
                          placeholder="e.g. EVER GENTLE"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-extrabold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">IMO Regulatory Registry*</label>
                        <input
                          type="text"
                          required
                          pattern="\d{7}"
                          title="IMO is exactly a 7-digit numbers string"
                          value={vsImo}
                          onChange={(e) => setVsImo(e.target.value)}
                          placeholder="e.g. 9811000"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Sovereign Flag Carrier</label>
                        <input
                          type="text"
                          required
                          value={vsFlag}
                          onChange={(e) => setVsFlag(e.target.value)}
                          placeholder="e.g. Singapore"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Vessel Type Format</label>
                        <select
                          value={vsType}
                          onChange={(e) => setVsType(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="Container Ship">Container Ship (Cellular)</option>
                          <option value="Feeder Ship">Feeder Ship</option>
                          <option value="ULCV">Ultra Large Container Vessel</option>
                          <option value="Ro-Ro Cargo">Roll-on/Roll-off Cargo</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="vsIsActive"
                        checked={vsIsActive}
                        onChange={(e) => setVsIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="vsIsActive" className="text-xs font-semibold text-slate-700 select-none">
                        Ship catalogued as active for vessel scheduling
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'vendors' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        {activeLanguageCode === 'en' ? (
                          <>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Subcontractor Corporate Name*</label>
                            <input
                              type="text"
                              required
                              value={vnName}
                              onChange={(e) => setVnName(e.target.value)}
                              placeholder="e.g. Apex Drayage Agencies"
                              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                          </>
                        ) : (
                          <>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Subcontractor Corporate Name Translation*</label>
                            <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-lg mb-1 leading-snug">
                              <strong>English Reference:</strong> {vnName}
                            </div>
                            <input
                              type="text"
                              required
                              dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                              value={translatedName}
                              onChange={(e) => setTranslatedName(e.target.value)}
                              placeholder="Type translation here..."
                              className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white"
                            />
                          </>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Internal Master Ref Code*</label>
                        <input
                          type="text"
                          required
                          disabled={activeLanguageCode !== 'en'}
                          value={vnCode}
                          onChange={(e) => setVnCode(e.target.value)}
                          placeholder="e.g. APX-IN-09"
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Specialization</label>
                        <select
                          disabled={activeLanguageCode !== 'en'}
                          value={vnSpec}
                          onChange={(e) => setVnSpec(e.target.value as any)}
                          className={`w-full text-[11px] px-2 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        >
                          <option value="Haulage">Intermodal Hauler</option>
                          <option value="Customs">Customs Broker</option>
                          <option value="Both">Consolidated (Both)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Tax Identification (GST)*</label>
                        <input
                          type="text"
                          required
                          disabled={activeLanguageCode !== 'en'}
                          value={vnTaxId}
                          onChange={(e) => setVnTaxId(e.target.value)}
                          placeholder="e.g. 24AAAAA3210A1Z1"
                          className={`w-full text-[11px] px-2 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono uppercase ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Payment Terms</label>
                        <select
                          disabled={activeLanguageCode !== 'en'}
                          value={vnPaymentTerms}
                          onChange={(e) => setVnPaymentTerms(e.target.value)}
                          className={`w-full text-[11px] px-2 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        >
                          <option value="Net 15">Net 15 Days</option>
                          <option value="Net 30">Net 30 Days</option>
                          <option value="Net 45">Net 45 Days</option>
                          <option value="Net 60">Net 60 Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Operations desk contact</label>
                        <input
                          type="text"
                          disabled={activeLanguageCode !== 'en'}
                          value={vnContact}
                          onChange={(e) => setVnContact(e.target.value)}
                          placeholder="e.g. John Doe"
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Phone</label>
                        <input
                          type="tel"
                          disabled={activeLanguageCode !== 'en'}
                          value={vnPhone}
                          onChange={(e) => setVnPhone(e.target.value)}
                          placeholder="e.g. +91 99999..."
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Email</label>
                        <input
                          type="email"
                          disabled={activeLanguageCode !== 'en'}
                          value={vnEmail}
                          onChange={(e) => setVnEmail(e.target.value)}
                          placeholder="ops@apex agencies.com"
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Sovereign Office Region</label>
                        <select
                          disabled={activeLanguageCode !== 'en'}
                          value={vnRegionId}
                          onChange={(e) => setVnRegionId(e.target.value)}
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        >
                          {regions.map((reg) => (
                            <option key={reg.code} value={reg.code}>{reg.code} — {reg.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Physical Office Address</label>
                        <input
                          type="text"
                          disabled={activeLanguageCode !== 'en'}
                          value={vnAddress}
                          onChange={(e) => setVnAddress(e.target.value)}
                          placeholder="Address, street, city..."
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="vnIsActive"
                        disabled={activeLanguageCode !== 'en'}
                        checked={vnIsActive}
                        onChange={(e) => setVnIsActive(e.target.checked)}
                        className={`rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <label htmlFor="vnIsActive" className={`text-xs font-semibold text-slate-700 select-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Vendor active for haulier subcontract assignments
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === 'container-types' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Liner Size Code*</label>
                        <input
                          type="text"
                          required
                          disabled={activeLanguageCode !== 'en'}
                          value={ctCode}
                          onChange={(e) => setCtCode(e.target.value)}
                          placeholder="e.g. 40HC"
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-black ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">ISO 6346 Code*</label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          disabled={activeLanguageCode !== 'en'}
                          value={ctIsoCode}
                          onChange={(e) => setCtIsoCode(e.target.value)}
                          placeholder="e.g. 45G1"
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                      <div>
                        {activeLanguageCode === 'en' ? (
                          <>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Equipment Category</label>
                            <select
                              value={ctCategory}
                              onChange={(e) => setCtCategory(e.target.value as any)}
                              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold"
                            >
                              <option value="Dry">Standard Dry Cargo</option>
                              <option value="Reefer">Reefer Container</option>
                              <option value="Flat Rack">Flat Rack / open side</option>
                              <option value="Open Top">Open Top tarp loads</option>
                              <option value="Tank">ISO Tanker format</option>
                            </select>
                          </>
                        ) : (
                          <>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Equipment Category translation*</label>
                            <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded mb-1">
                              <strong>English:</strong> {ctCategory}
                            </div>
                            <input
                              type="text"
                              required
                              dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                              value={translatedDescription}
                              onChange={(e) => setTranslatedDescription(e.target.value)}
                              placeholder="Type translation..."
                              className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white"
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      {activeLanguageCode === 'en' ? (
                        <>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">System Descriptive Designation*</label>
                          <input
                            type="text"
                            required
                            value={ctName}
                            onChange={(e) => setCtName(e.target.value)}
                            placeholder="e.g. 40ft High Cube Container"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">System Descriptive Designation Translation*</label>
                          <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-lg mb-1 leading-snug">
                            <strong>English Reference:</strong> {ctName}
                          </div>
                          <input
                            type="text"
                            required
                            dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                            value={translatedName}
                            onChange={(e) => setTranslatedName(e.target.value)}
                            placeholder="Type translation here..."
                            className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white"
                          />
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Length Profile (Ft)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          disabled={activeLanguageCode !== 'en'}
                          value={ctLength}
                          onChange={(e) => setCtLength(Number(e.target.value))}
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Height Profile (Ft)</label>
                        <input
                          type="number"
                          required
                          step="0.1"
                          disabled={activeLanguageCode !== 'en'}
                          value={ctHeight}
                          onChange={(e) => setCtHeight(Number(e.target.value))}
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Tare Empty Weights (Kg)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          disabled={activeLanguageCode !== 'en'}
                          value={ctTare}
                          onChange={(e) => setCtTare(Number(e.target.value))}
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Max Payload Weight Capacity (Kg)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          disabled={activeLanguageCode !== 'en'}
                          value={ctPayload}
                          onChange={(e) => setCtPayload(Number(e.target.value))}
                          className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="ctIsActive"
                        disabled={activeLanguageCode !== 'en'}
                        checked={ctIsActive}
                        onChange={(e) => setCtIsActive(e.target.checked)}
                        className={`rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <label htmlFor="ctIsActive" className={`text-xs font-semibold text-slate-700 select-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Equipment size active for logistics job generation
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
                  {saveMessage && (
                    <span className="text-xs text-green-600 font-bold animate-pulse mr-2">
                      {saveMessage}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-lg transition shadow-sm"
                  >
                    {activeLanguageCode === 'en' 
                      ? 'Commit Storage' 
                      : `Save ${supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode} Translation`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-650">
                <div className="bg-red-50 p-2 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-650" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800">
                    Irreversible Deletion Alert
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Are you absolutely sure you want to drop this support master index record?
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 font-mono border border-slate-200/50">
                ID Code Reference: <span className="font-bold text-indigo-600">{deletingRecord.id}</span>
              </div>

              <div className="flex justify-end items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingRecord(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  Retreat
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Drop Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
