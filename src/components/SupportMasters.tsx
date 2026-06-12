/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShippingLine, Vessel, Vendor, ContainerType, Region,
  SupportedLanguage, MasterTranslation,
} from '../types';
import {
  Ship, Container, Building2, Plus, Edit2, Trash2, X, AlertTriangle, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LanguageSwitcher from './LanguageSwitcher';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection, DrawerField, DrawerFieldGrid } from './shared/DetailDrawer';
import { T, badgeClass } from './shared/ui';

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

const SPEC_BADGE: Record<string, string> = {
  Haulage: 'bg-blue-50 text-blue-700 border border-blue-200',
  Customs: 'bg-purple-50 text-purple-700 border border-purple-200',
  Both: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const CT_CATEGORY_BADGE: Record<string, string> = {
  Dry: 'bg-slate-50 text-slate-700 border border-slate-200',
  Reefer: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  'Flat Rack': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Open Top': 'bg-rose-50 text-rose-700 border border-rose-200',
  Tank: 'bg-blue-50 text-indigo-700 border border-indigo-200',
};

export default function SupportMasters({
  shippingLines, vessels, vendors, containerTypes, regions,
  onAddShippingLine, onUpdateShippingLine, onDeleteShippingLine,
  onAddVessel, onUpdateVessel, onDeleteVessel,
  onAddVendor, onUpdateVendor, onDeleteVendor,
  onAddContainerType, onUpdateContainerType, onDeleteContainerType,
  supportedLanguages, masterTranslations,
  onAddMasterTranslation, onUpdateMasterTranslation,
}: SupportMastersProps) {
  const [activeTab, setActiveTab] = useState<TabType>('shipping-lines');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Delete confirmation
  const [deletingRecord, setDeletingRecord] = useState<{ id: string, type: TabType } | null>(null);

  // Filters (per active tab; reset on tab switch)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [extraFilter, setExtraFilter] = useState('');

  // Translation states
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
    setSlName(''); setSlScacCode(''); setSlShortCode(''); setSlLogoColor('#2563EB');
    setSlFreeTime(7); setSlDetention(5000); setSlCurrency('INR'); setSlRegionId('IN'); setSlIsActive(true);
    setVsName(''); setVsImo(''); setVsShippingLineId(shippingLines[0]?.id || '');
    setVsFlag('Panama'); setVsType('Container Ship'); setVsIsActive(true);
    setVnName(''); setVnCode(''); setVnContact(''); setVnPhone(''); setVnEmail('');
    setVnAddress(''); setVnRegionId('IN'); setVnTaxId(''); setVnPaymentTerms('Net 30');
    setVnSpec('Haulage'); setVnIsActive(true);
    setCtCode(''); setCtName(''); setCtIsoCode(''); setCtLength(40); setCtHeight(9.5);
    setCtTare(3800); setCtPayload(28000); setCtCategory('Dry'); setCtIsActive(true);
    setActiveLanguageCode('en');
    setSaveMessage('');
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRecord(null);
    resetFormValues();
    setDrawerMode('view');
  };

  const openView = (record: any) => {
    setSelectedRecord(record);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const openCreate = () => {
    resetFormValues();
    setSelectedRecord(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const openEdit = (record: any, langCode = 'en') => {
    setEditingRecord(record);
    setSelectedRecord(record);
    if (activeTab === 'shipping-lines') {
      const r = record as ShippingLine;
      setSlName(r.name); setSlScacCode(r.scacCode); setSlShortCode(r.shortCode);
      setSlLogoColor(r.logoColor); setSlFreeTime(r.freeTimeDays); setSlDetention(r.detentionRatePerDay);
      setSlCurrency(r.currency); setSlRegionId(r.regionId || 'IN'); setSlIsActive(r.isActive);
    } else if (activeTab === 'vessels') {
      const r = record as Vessel;
      setVsName(r.vesselName); setVsImo(r.imoNumber); setVsShippingLineId(r.shippingLineId);
      setVsFlag(r.flag); setVsType(r.vesselType); setVsIsActive(r.isActive);
    } else if (activeTab === 'vendors') {
      const r = record as Vendor;
      setVnName(r.vendorName); setVnCode(r.vendorCode); setVnContact(r.contactPerson);
      setVnPhone(r.phone); setVnEmail(r.email); setVnAddress(r.address);
      setVnRegionId(r.regionId || 'IN'); setVnTaxId(r.taxId); setVnPaymentTerms(r.paymentTerms);
      setVnSpec(r.specialization as 'Haulage' | 'Customs' | 'Both'); setVnIsActive(r.isActive);
    } else if (activeTab === 'container-types') {
      const r = record as ContainerType;
      setCtCode(r.code); setCtName(r.name); setCtIsoCode(r.isoCode);
      setCtLength(r.lengthFt); setCtHeight(r.heightFt); setCtTare(r.tareWeightKg);
      setCtPayload(r.maxPayloadKg); setCtCategory(r.category); setCtIsActive(r.isActive);
    }
    setActiveLanguageCode(langCode);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleToggleActive = (record: any, type: TabType) => {
    if (type === 'shipping-lines') onUpdateShippingLine({ ...record, isActive: !record.isActive });
    else if (type === 'vessels') onUpdateVessel({ ...record, isActive: !record.isActive });
    else if (type === 'vendors') onUpdateVendor({ ...record, isActive: !record.isActive });
    else if (type === 'container-types') onUpdateContainerType({ ...record, isActive: !record.isActive });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

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
        updatedAt: new Date().toISOString(),
      };
      if (existing) onUpdateMasterTranslation(updatedTrans);
      else onAddMasterTranslation(updatedTrans);
      const langName = supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode;
      setSaveMessage(`${langName} saved ✓`);
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    if (activeTab === 'shipping-lines') {
      if (!slName || !slScacCode || !slShortCode) { alert('Please fill out all required fields.'); return; }
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
        isActive: slIsActive,
      };
      if (editingRecord) onUpdateShippingLine(recordData);
      else onAddShippingLine(recordData);
    } else if (activeTab === 'vessels') {
      if (!vsName || !vsImo || !vsShippingLineId) { alert('Please fill out all required fields.'); return; }
      const recordData: Vessel = {
        id: editingRecord?.id || `vess-${Date.now()}`,
        vesselName: vsName.trim(),
        imoNumber: vsImo.trim(),
        shippingLineId: vsShippingLineId,
        flag: vsFlag,
        vesselType: vsType,
        isActive: vsIsActive,
      };
      if (editingRecord) onUpdateVessel(recordData);
      else onAddVessel(recordData);
    } else if (activeTab === 'vendors') {
      if (!vnName || !vnCode || !vnTaxId) { alert('Please fill out all required fields.'); return; }
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
        isActive: vnIsActive,
      };
      if (editingRecord) onUpdateVendor(recordData);
      else onAddVendor(recordData);
    } else if (activeTab === 'container-types') {
      if (!ctCode || !ctName || !ctIsoCode) { alert('Please fill out all required fields.'); return; }
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
        isActive: ctIsActive,
      };
      if (editingRecord) onUpdateContainerType(recordData);
      else onAddContainerType(recordData);
    }
    closeDrawer();
  };

  const confirmDelete = () => {
    if (!deletingRecord) return;
    const { id, type } = deletingRecord;
    if (type === 'shipping-lines') onDeleteShippingLine(id);
    else if (type === 'vessels') onDeleteVessel(id);
    else if (type === 'vendors') onDeleteVendor(id);
    else if (type === 'container-types') onDeleteContainerType(id);
    setDeletingRecord(null);
  };

  // Language pill cluster for vendors / container types
  const langPills = (record: any, masterType: 'vendor' | 'container_type') => (
    <div className="flex flex-wrap gap-1 items-center">
      <span
        onClick={() => openEdit(record, 'en')}
        className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-1 py-0.5 rounded text-[9px] font-extrabold uppercase"
        title="English (Master View)"
      >
        EN
      </span>
      {supportedLanguages.map(lang => {
        const hasTrans = masterTranslations.some(
          t => t.masterRecordId === record.id && t.languageCode === lang.code && t.masterType === masterType
        );
        return (
          <span
            key={lang.code}
            onClick={() => openEdit(record, lang.code)}
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
  );

  const activeToggle = (record: any, type: TabType) => (
    <button
      onClick={() => handleToggleActive(record, type)}
      className={badgeClass(record.isActive ? 'active' : 'completed')}
      title="Toggle active status"
    >
      {record.isActive ? 'Active' : 'Inactive'}
    </button>
  );

  const rowActions = (record: any) => (
    <>
      <button
        onClick={() => openEdit(record)}
        className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
        title="Edit Master Record"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setDeletingRecord({ id: record.id, type: activeTab })}
        className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
        title="Delete Master Record"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </>
  );

  // ── Column definitions per tab ──
  const slColumns: DataTableColumn<ShippingLine>[] = [
    {
      key: 'name', header: 'Carrier', sortValue: r => r.name,
      render: r => (
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: r.logoColor || '#cbd5e1' }} />
          <div>
            <div className={T.cellPrimary}>{r.name}</div>
            <div className={T.cellMuted}>{r.shortCode}</div>
          </div>
        </div>
      ),
    },
    { key: 'scac', header: 'SCAC', sortValue: r => r.scacCode, render: r => <span className={T.cellId}>{r.scacCode}</span> },
    { key: 'region', header: 'Region', sortValue: r => r.regionId ?? '', render: r => <span className={T.cellSecondary}>{r.regionId || 'Global'}</span> },
    { key: 'freeTime', header: 'Free Time', align: 'right', sortValue: r => r.freeTimeDays, render: r => <span className={T.cellSecondary}>{r.freeTimeDays} days</span> },
    {
      key: 'detention', header: 'Detention / Day', align: 'right', sortValue: r => r.detentionRatePerDay,
      render: r => (
        <div>
          <span className={T.cellAmount}>{r.detentionRatePerDay.toLocaleString()}</span>
          <span className={`${T.cellMuted} block`}>{r.currency || 'INR'}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sortValue: r => (r.isActive ? 0 : 1), render: r => activeToggle(r, 'shipping-lines') },
  ];

  const vsColumns: DataTableColumn<Vessel>[] = [
    { key: 'name', header: 'Vessel Name', sortValue: r => r.vesselName, render: r => <span className={T.cellPrimary}>{r.vesselName}</span> },
    { key: 'imo', header: 'IMO Registry', sortValue: r => r.imoNumber, render: r => <span className={T.cellId}>IMO {r.imoNumber}</span> },
    {
      key: 'line', header: 'Shipping Line',
      sortValue: r => shippingLines.find(l => l.id === r.shippingLineId)?.name ?? '',
      render: r => {
        const line = shippingLines.find(l => l.id === r.shippingLineId);
        return line ? (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: line.logoColor }} />
            <span className={T.cellSecondary}>{line.name}</span>
          </div>
        ) : <span className={T.cellMuted}>Undefined Liner</span>;
      },
    },
    { key: 'flag', header: 'Flag', sortValue: r => r.flag, render: r => <span className={T.cellSecondary}>{r.flag}</span> },
    { key: 'type', header: 'Hull Type', sortValue: r => r.vesselType, render: r => <span className={T.cellSecondary}>{r.vesselType}</span> },
    { key: 'status', header: 'Status', sortValue: r => (r.isActive ? 0 : 1), render: r => activeToggle(r, 'vessels') },
  ];

  const vnColumns: DataTableColumn<Vendor>[] = [
    {
      key: 'name', header: 'Vendor Name', sortValue: r => r.vendorName,
      render: r => (
        <div>
          <div className={T.cellPrimary}>{r.vendorName}</div>
          <div className={T.cellMuted}>Code: {r.vendorCode} · {r.regionId || 'IN'}</div>
        </div>
      ),
    },
    { key: 'taxId', header: 'Tax ID', sortValue: r => r.taxId, render: r => <span className={T.cellId}>{r.taxId}</span> },
    {
      key: 'contact', header: 'Contact', sortValue: r => r.contactPerson,
      render: r => (
        <div>
          <div className={T.cellSecondary}>{r.contactPerson}</div>
          <div className={T.cellMuted}>{r.email}</div>
        </div>
      ),
    },
    {
      key: 'spec', header: 'Specialization', sortValue: r => r.specialization,
      render: r => (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${SPEC_BADGE[r.specialization] ?? SPEC_BADGE.Haulage}`}>
          {r.specialization === 'Haulage' ? 'Intermodal Hauler' : r.specialization === 'Customs' ? 'Customs Broker' : 'Consolidated Hub'}
        </span>
      ),
    },
    { key: 'terms', header: 'Terms', sortValue: r => r.paymentTerms, render: r => <span className={T.cellSecondary}>{r.paymentTerms}</span> },
    { key: 'langs', header: 'Languages', render: r => langPills(r, 'vendor') },
    { key: 'status', header: 'Status', sortValue: r => (r.isActive ? 0 : 1), render: r => activeToggle(r, 'vendors') },
  ];

  const ctColumns: DataTableColumn<ContainerType>[] = [
    {
      key: 'code', header: 'Code / ISO', sortValue: r => r.code,
      render: r => (
        <div className="flex items-center gap-2.5">
          <Container className="h-4 w-4 text-indigo-500 shrink-0" />
          <div>
            <div className={T.cellPrimary}>{r.code}</div>
            <div className={T.cellId}>{r.isoCode}</div>
          </div>
        </div>
      ),
    },
    { key: 'name', header: 'Description', sortValue: r => r.name, render: r => <span className={T.cellSecondary}>{r.name}</span> },
    { key: 'dims', header: 'L × H', sortValue: r => r.lengthFt, render: r => <span className={`${T.cellSecondary} font-mono`}>{r.lengthFt}ft × {r.heightFt}ft</span> },
    { key: 'tare', header: 'Tare', align: 'right', sortValue: r => r.tareWeightKg, render: r => <span className={T.cellAmount}>{r.tareWeightKg.toLocaleString()} kg</span> },
    {
      key: 'payload', header: 'Max Payload', align: 'right', sortValue: r => r.maxPayloadKg,
      render: r => (
        <div>
          <span className={T.cellAmount}>{(r.maxPayloadKg / 1000).toFixed(1)} MT</span>
          <span className={`${T.cellMuted} block`}>{r.maxPayloadKg.toLocaleString()} kg</span>
        </div>
      ),
    },
    {
      key: 'category', header: 'Category', sortValue: r => r.category,
      render: r => (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${CT_CATEGORY_BADGE[r.category] ?? CT_CATEGORY_BADGE.Dry}`}>
          {r.category}
        </span>
      ),
    },
    { key: 'langs', header: 'Languages', render: r => langPills(r, 'container_type') },
    { key: 'status', header: 'Status', sortValue: r => (r.isActive ? 0 : 1), render: r => activeToggle(r, 'container-types') },
  ];

  // ── Filtered rows per tab ──
  const q = searchQuery.toLowerCase();
  const statusMatch = (isActive: boolean) =>
    statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive);

  const filteredShippingLines = shippingLines.filter(r =>
    (r.name.toLowerCase().includes(q) || r.scacCode.toLowerCase().includes(q) || r.shortCode.toLowerCase().includes(q)) &&
    statusMatch(r.isActive) && (!extraFilter || r.regionId === extraFilter));
  const filteredVessels = vessels.filter(r =>
    (r.vesselName.toLowerCase().includes(q) || r.imoNumber.toLowerCase().includes(q)) &&
    statusMatch(r.isActive) && (!extraFilter || r.shippingLineId === extraFilter));
  const filteredVendors = vendors.filter(r =>
    (r.vendorName.toLowerCase().includes(q) || r.vendorCode.toLowerCase().includes(q) || r.taxId.toLowerCase().includes(q)) &&
    statusMatch(r.isActive) && (!extraFilter || r.specialization === extraFilter));
  const filteredContainerTypes = containerTypes.filter(r =>
    (r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.isoCode.toLowerCase().includes(q)) &&
    statusMatch(r.isActive) && (!extraFilter || r.category === extraFilter));

  const tabConfig: Record<TabType, {
    rows: any[]; total: any[]; columns: DataTableColumn<any>[];
    searchPlaceholder: string; addLabel: string; emptyTitle: string;
    dropdown?: { key: string; label: string; options: { value: string; label: string }[] };
  }> = {
    'shipping-lines': {
      rows: filteredShippingLines, total: shippingLines, columns: slColumns,
      searchPlaceholder: 'Search carrier or SCAC…', addLabel: 'Add Shipping Line',
      emptyTitle: 'No shipping lines defined',
      dropdown: { key: 'region', label: 'Region', options: regions.map(r => ({ value: r.code, label: r.name })) },
    },
    'vessels': {
      rows: filteredVessels, total: vessels, columns: vsColumns,
      searchPlaceholder: 'Search vessel or IMO…', addLabel: 'Add Ocean Vessel',
      emptyTitle: 'No ocean vessels defined',
      dropdown: { key: 'line', label: 'Line', options: shippingLines.map(l => ({ value: l.id, label: l.name })) },
    },
    'vendors': {
      rows: filteredVendors, total: vendors, columns: vnColumns,
      searchPlaceholder: 'Search vendor, code, or tax ID…', addLabel: 'Add Vendor Broker',
      emptyTitle: 'No subcontractors listed',
      dropdown: {
        key: 'spec', label: 'Specialization',
        options: [{ value: 'Haulage', label: 'Haulage' }, { value: 'Customs', label: 'Customs' }, { value: 'Both', label: 'Both' }],
      },
    },
    'container-types': {
      rows: filteredContainerTypes, total: containerTypes, columns: ctColumns,
      searchPlaceholder: 'Search code, ISO, or name…', addLabel: 'Add Equipment Type',
      emptyTitle: 'No container sizes catalogued',
      dropdown: {
        key: 'cat', label: 'Category',
        options: ['Dry', 'Reefer', 'Flat Rack', 'Open Top', 'Tank'].map(c => ({ value: c, label: c })),
      },
    },
  };

  const cfg = tabConfig[activeTab];
  const activeFilterCount = (searchQuery ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (extraFilter ? 1 : 0);

  // ── Drawer view body per tab ──
  const drawerViewBody = () => {
    const r = selectedRecord;
    if (!r) return null;
    if (activeTab === 'shipping-lines') {
      const line = r as ShippingLine;
      return (
        <>
          <DrawerSection title="Carrier Identity">
            <DrawerFieldGrid>
              <DrawerField label="Carrier Name" value={line.name} bold full />
              <DrawerField label="SCAC" value={<span className="font-mono text-blue-600">{line.scacCode}</span>} />
              <DrawerField label="Short Code" value={line.shortCode} />
              <DrawerField label="Region" value={line.regionId || 'Global'} />
              <DrawerField label="Brand Color" value={
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: line.logoColor }} />
                  <span className="font-mono">{line.logoColor}</span>
                </span>
              } />
            </DrawerFieldGrid>
          </DrawerSection>
          <DrawerSection title="Free Time & Detention">
            <DrawerFieldGrid>
              <DrawerField label="Free Time" value={`${line.freeTimeDays} days`} />
              <DrawerField label="Detention / Day" value={`${line.detentionRatePerDay.toLocaleString()} ${line.currency || 'INR'}`} />
            </DrawerFieldGrid>
          </DrawerSection>
        </>
      );
    }
    if (activeTab === 'vessels') {
      const vs = r as Vessel;
      const line = shippingLines.find(l => l.id === vs.shippingLineId);
      return (
        <DrawerSection title="Vessel">
          <DrawerFieldGrid>
            <DrawerField label="Vessel Name" value={vs.vesselName} bold full />
            <DrawerField label="IMO Registry" value={<span className="font-mono text-blue-600">{vs.imoNumber}</span>} />
            <DrawerField label="Shipping Line" value={line?.name ?? 'Undefined Liner'} />
            <DrawerField label="Flag" value={vs.flag} />
            <DrawerField label="Hull Type" value={vs.vesselType} />
          </DrawerFieldGrid>
        </DrawerSection>
      );
    }
    if (activeTab === 'vendors') {
      const vn = r as Vendor;
      return (
        <>
          <DrawerSection title="Identity">
            <DrawerFieldGrid>
              <DrawerField label="Vendor Name" value={vn.vendorName} bold full />
              <DrawerField label="Code" value={<span className="font-mono text-blue-600">{vn.vendorCode}</span>} />
              <DrawerField label="Tax ID" value={<span className="font-mono text-blue-600">{vn.taxId}</span>} />
              <DrawerField label="Region" value={vn.regionId || 'IN'} />
              <DrawerField label="Specialization" value={vn.specialization} />
              <DrawerField label="Address" value={vn.address} full />
            </DrawerFieldGrid>
          </DrawerSection>
          <DrawerSection title="Commercial & Contacts">
            <DrawerFieldGrid>
              <DrawerField label="Payment Terms" value={vn.paymentTerms} />
              <DrawerField label="Contact Person" value={vn.contactPerson} bold />
              <DrawerField label="Email" value={vn.email} />
              <DrawerField label="Phone" value={vn.phone} />
            </DrawerFieldGrid>
          </DrawerSection>
          <DrawerSection title="Translations">{langPills(vn, 'vendor')}</DrawerSection>
        </>
      );
    }
    const ct = r as ContainerType;
    return (
      <>
        <DrawerSection title="Equipment">
          <DrawerFieldGrid>
            <DrawerField label="Code" value={ct.code} bold />
            <DrawerField label="ISO 6346" value={<span className="font-mono text-blue-600">{ct.isoCode}</span>} />
            <DrawerField label="Description" value={ct.name} full />
            <DrawerField label="Category" value={ct.category} />
            <DrawerField label="Dimensions" value={`${ct.lengthFt}ft × ${ct.heightFt}ft`} />
            <DrawerField label="Tare Weight" value={`${ct.tareWeightKg.toLocaleString()} kg`} />
            <DrawerField label="Max Payload" value={`${ct.maxPayloadKg.toLocaleString()} kg (${(ct.maxPayloadKg / 1000).toFixed(1)} MT)`} />
          </DrawerFieldGrid>
        </DrawerSection>
        <DrawerSection title="Translations">{langPills(ct, 'container_type')}</DrawerSection>
      </>
    );
  };

  // ── Drawer edit/create form per tab (markup preserved from original modal) ──
  const drawerFormBody = () => (
    <form id="support-master-form" onSubmit={handleSubmit} className="space-y-4">
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
              <input type="text" required value={slName} onChange={e => setSlName(e.target.value)}
                placeholder="e.g. Ocean Network Express"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">SCAC Code*</label>
              <input type="text" required maxLength={4} value={slScacCode} onChange={e => setSlScacCode(e.target.value)}
                placeholder="e.g. ONEY"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Short Brand Acronym*</label>
              <input type="text" required value={slShortCode} onChange={e => setSlShortCode(e.target.value)}
                placeholder="e.g. ONE"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">UI Hex Color Accent</label>
              <div className="flex gap-2">
                <input type="color" value={slLogoColor} onChange={e => setSlLogoColor(e.target.value)}
                  className="h-8 border rounded cursor-pointer p-0 w-12" />
                <input type="text" maxLength={7} value={slLogoColor} onChange={e => setSlLogoColor(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-mono" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Free Storage Time (Days)*</label>
              <input type="number" required min={0} value={slFreeTime} onChange={e => setSlFreeTime(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Detention Rate / Day*</label>
              <div className="relative">
                <input type="number" required min={0} value={slDetention} onChange={e => setSlDetention(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none pl-6 font-mono" />
                <Coins className="h-3.5 w-3.5 text-slate-400 absolute left-2 top-3" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Billing Currency</label>
              <input type="text" required value={slCurrency} onChange={e => setSlCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Region</label>
              <select value={slRegionId} onChange={e => setSlRegionId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none">
                {regions.map(reg => <option key={reg.code} value={reg.code}>{reg.code} — {reg.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="slIsActive" checked={slIsActive} onChange={e => setSlIsActive(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="slIsActive" className="text-xs font-semibold text-slate-700 select-none">
              Mark liner as active for live booking manifest workflows
            </label>
          </div>
        </div>
      )}

      {activeTab === 'vessels' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Ocean Liner Carrier Parent*</label>
            <select required value={vsShippingLineId} onChange={e => setVsShippingLineId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold">
              <option value="">-- Choose Shipping Line Master --</option>
              {shippingLines.map(line => <option key={line.id} value={line.id}>{line.scacCode} — {line.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Vessel Name*</label>
              <input type="text" required value={vsName} onChange={e => setVsName(e.target.value)}
                placeholder="e.g. EVER GENTLE"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-extrabold" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">IMO Registry*</label>
              <input type="text" required pattern="\d{7}" title="IMO is exactly a 7-digit numbers string"
                value={vsImo} onChange={e => setVsImo(e.target.value)} placeholder="e.g. 9811000"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Flag</label>
              <input type="text" required value={vsFlag} onChange={e => setVsFlag(e.target.value)}
                placeholder="e.g. Singapore"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Vessel Type</label>
              <select value={vsType} onChange={e => setVsType(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none">
                <option value="Container Ship">Container Ship (Cellular)</option>
                <option value="Feeder Ship">Feeder Ship</option>
                <option value="ULCV">Ultra Large Container Vessel</option>
                <option value="Ro-Ro Cargo">Roll-on/Roll-off Cargo</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="vsIsActive" checked={vsIsActive} onChange={e => setVsIsActive(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
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
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Vendor Corporate Name*</label>
                  <input type="text" required value={vnName} onChange={e => setVnName(e.target.value)}
                    placeholder="e.g. Apex Drayage Agencies"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none" />
                </>
              ) : (
                <>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Vendor Name Translation*</label>
                  <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-lg mb-1 leading-snug">
                    <strong>English Reference:</strong> {vnName}
                  </div>
                  <input type="text" required
                    dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                    value={translatedName} onChange={e => setTranslatedName(e.target.value)}
                    placeholder="Type translation here..."
                    className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white" />
                </>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Internal Ref Code*</label>
              <input type="text" required disabled={activeLanguageCode !== 'en'} value={vnCode}
                onChange={e => setVnCode(e.target.value)} placeholder="e.g. APX-IN-09"
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Specialization</label>
              <select disabled={activeLanguageCode !== 'en'} value={vnSpec} onChange={e => setVnSpec(e.target.value as any)}
                className={`w-full text-[11px] px-2 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}>
                <option value="Haulage">Intermodal Hauler</option>
                <option value="Customs">Customs Broker</option>
                <option value="Both">Consolidated (Both)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Tax ID (GST)*</label>
              <input type="text" required disabled={activeLanguageCode !== 'en'} value={vnTaxId}
                onChange={e => setVnTaxId(e.target.value)} placeholder="e.g. 24AAAAA3210A1Z1"
                className={`w-full text-[11px] px-2 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono uppercase ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Payment Terms</label>
              <select disabled={activeLanguageCode !== 'en'} value={vnPaymentTerms} onChange={e => setVnPaymentTerms(e.target.value)}
                className={`w-full text-[11px] px-2 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Contact Person</label>
              <input type="text" disabled={activeLanguageCode !== 'en'} value={vnContact}
                onChange={e => setVnContact(e.target.value)} placeholder="e.g. John Doe"
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Phone</label>
              <input type="tel" disabled={activeLanguageCode !== 'en'} value={vnPhone}
                onChange={e => setVnPhone(e.target.value)} placeholder="e.g. +91 99999..."
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Email</label>
              <input type="email" disabled={activeLanguageCode !== 'en'} value={vnEmail}
                onChange={e => setVnEmail(e.target.value)} placeholder="ops@apex.com"
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Region</label>
              <select disabled={activeLanguageCode !== 'en'} value={vnRegionId} onChange={e => setVnRegionId(e.target.value)}
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}>
                {regions.map(reg => <option key={reg.code} value={reg.code}>{reg.code} — {reg.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Office Address</label>
              <input type="text" disabled={activeLanguageCode !== 'en'} value={vnAddress}
                onChange={e => setVnAddress(e.target.value)} placeholder="Address, street, city..."
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="vnIsActive" disabled={activeLanguageCode !== 'en'} checked={vnIsActive}
              onChange={e => setVnIsActive(e.target.checked)}
              className={`rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`} />
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
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Size Code*</label>
              <input type="text" required disabled={activeLanguageCode !== 'en'} value={ctCode}
                onChange={e => setCtCode(e.target.value)} placeholder="e.g. 40HC"
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-black ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">ISO 6346 Code*</label>
              <input type="text" required maxLength={4} disabled={activeLanguageCode !== 'en'} value={ctIsoCode}
                onChange={e => setCtIsoCode(e.target.value)} placeholder="e.g. 45G1"
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none uppercase font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
            <div>
              {activeLanguageCode === 'en' ? (
                <>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Category</label>
                  <select value={ctCategory} onChange={e => setCtCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold">
                    <option value="Dry">Standard Dry Cargo</option>
                    <option value="Reefer">Reefer Container</option>
                    <option value="Flat Rack">Flat Rack / open side</option>
                    <option value="Open Top">Open Top tarp loads</option>
                    <option value="Tank">ISO Tanker format</option>
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Category translation*</label>
                  <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded mb-1">
                    <strong>English:</strong> {ctCategory}
                  </div>
                  <input type="text" required
                    dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                    value={translatedDescription} onChange={e => setTranslatedDescription(e.target.value)}
                    placeholder="Type translation..."
                    className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white" />
                </>
              )}
            </div>
          </div>
          <div>
            {activeLanguageCode === 'en' ? (
              <>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Descriptive Designation*</label>
                <input type="text" required value={ctName} onChange={e => setCtName(e.target.value)}
                  placeholder="e.g. 40ft High Cube Container"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none" />
              </>
            ) : (
              <>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Designation Translation*</label>
                <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-lg mb-1 leading-snug">
                  <strong>English Reference:</strong> {ctName}
                </div>
                <input type="text" required
                  dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                  value={translatedName} onChange={e => setTranslatedName(e.target.value)}
                  placeholder="Type translation here..."
                  className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white" />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Length (Ft)</label>
              <input type="number" required min={1} disabled={activeLanguageCode !== 'en'} value={ctLength}
                onChange={e => setCtLength(Number(e.target.value))}
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Height (Ft)</label>
              <input type="number" required step="0.1" disabled={activeLanguageCode !== 'en'} value={ctHeight}
                onChange={e => setCtHeight(Number(e.target.value))}
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Tare Weight (Kg)</label>
              <input type="number" required min={0} disabled={activeLanguageCode !== 'en'} value={ctTare}
                onChange={e => setCtTare(Number(e.target.value))}
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Max Payload (Kg)</label>
              <input type="number" required min={0} disabled={activeLanguageCode !== 'en'} value={ctPayload}
                onChange={e => setCtPayload(Number(e.target.value))}
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="ctIsActive" disabled={activeLanguageCode !== 'en'} checked={ctIsActive}
              onChange={e => setCtIsActive(e.target.checked)}
              className={`rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`} />
            <label htmlFor="ctIsActive" className={`text-xs font-semibold text-slate-700 select-none ${activeLanguageCode !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Equipment size active for logistics job generation
            </label>
          </div>
        </div>
      )}
    </form>
  );

  const recordTitle = (r: any) => {
    if (!r) return '';
    if (activeTab === 'shipping-lines') return r.name;
    if (activeTab === 'vessels') return r.vesselName;
    if (activeTab === 'vendors') return r.vendorName;
    return r.code;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={T.pageTitle}>System Support Masters</h2>
          <p className={T.pageSubtitle}>Configure ocean carriers, vessels, regional subhauliers, and equipment formats.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-md flex items-center justify-center gap-1.5 transition self-start md:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" /> {cfg.addLabel}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Support Master tabs">
          {[
            { id: 'shipping-lines', label: 'Shipping Lines', count: shippingLines.length, icon: Ship },
            { id: 'vessels', label: 'Ocean Vessels', count: vessels.length, icon: Ship },
            { id: 'vendors', label: 'Vendors & Subcontractors', count: vendors.length, icon: Building2 },
            { id: 'container-types', label: 'Equipment Sizes', count: containerTypes.length, icon: Container },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setSearchQuery(''); setStatusFilter('all'); setExtraFilter('');
                  closeDrawer();
                }}
                className={`py-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition ${
                  isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
                <span className={`text-[10px] px-1.5 rounded-full font-bold ${isActive ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <FilterBar
          searchPlaceholder={cfg.searchPlaceholder}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusOptions={[
            { value: 'all', label: 'All', count: cfg.total.length },
            { value: 'active', label: 'Active', count: cfg.total.filter((r: any) => r.isActive).length },
            { value: 'inactive', label: 'Inactive', count: cfg.total.filter((r: any) => !r.isActive).length },
          ]}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          dropdownFilters={cfg.dropdown ? [{
            key: cfg.dropdown.key, label: cfg.dropdown.label,
            options: cfg.dropdown.options,
            value: extraFilter, onChange: setExtraFilter,
          }] : []}
          onClearAll={() => { setSearchQuery(''); setStatusFilter('all'); setExtraFilter(''); }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={cfg.columns}
          rows={cfg.rows}
          onRowClick={openView}
          rowActions={rowActions}
          emptyState={{
            icon: <Container className="w-10 h-10" />,
            title: cfg.emptyTitle,
            subtitle: 'Adjust the filters or add a new record.',
          }}
        />
      </div>

      {/* Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        width="520px"
        title={
          drawerMode === 'create'
            ? `New ${cfg.addLabel.replace('Add ', '')}`
            : <>
                <span>{recordTitle(selectedRecord)}</span>
                {selectedRecord && <span className={badgeClass(selectedRecord.isActive ? 'active' : 'completed')}>{selectedRecord.isActive ? 'Active' : 'Inactive'}</span>}
              </>
        }
        headerActions={
          drawerMode === 'view' && selectedRecord ? (
            <button onClick={() => openEdit(selectedRecord)} className="h-8 px-2.5 flex items-center gap-1 rounded-md text-sm text-slate-600 hover:bg-slate-100">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          ) : undefined
        }
        footer={
          drawerMode === 'view' && selectedRecord ? (
            <>
              <button
                onClick={() => setDeletingRecord({ id: selectedRecord.id, type: activeTab })}
                className="h-9 px-4 rounded-md border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <button onClick={() => openEdit(selectedRecord)} className="h-9 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold">Edit</button>
            </>
          ) : (
            <>
              {saveMessage && <span className="text-xs text-green-600 font-bold animate-pulse mr-auto">{saveMessage}</span>}
              <button
                onClick={() => drawerMode === 'create' ? closeDrawer() : (setDrawerMode('view'), setEditingRecord(null), setActiveLanguageCode('en'))}
                className="h-9 px-4 rounded-md text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit()}
                className="h-9 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm"
              >
                {activeLanguageCode === 'en'
                  ? 'Commit Storage'
                  : `Save ${supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode} Translation`}
              </button>
            </>
          )
        }
      >
        {drawerMode === 'view' ? drawerViewBody() : drawerFormBody()}
      </DetailDrawer>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800">Irreversible Deletion Alert</h4>
                  <p className="text-[11px] text-slate-500">Are you absolutely sure you want to drop this support master index record?</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 font-mono border border-slate-200/50">
                ID Code Reference: <span className="font-bold text-indigo-600">{deletingRecord.id}</span>
              </div>
              <div className="flex justify-end items-center gap-2 pt-2">
                <button
                  onClick={() => setDeletingRecord(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  Retreat
                </button>
                <button
                  onClick={() => { confirmDelete(); closeDrawer(); }}
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
