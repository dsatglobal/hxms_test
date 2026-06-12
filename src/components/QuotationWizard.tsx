/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Customer, Quotation, LocationGeo, SurchargeRule, TariffRate,
  ScenarioType, QuotationRateItem, ShippingLine, ContainerType,
  Zone, Vessel, Region, User, InvoiceSettings, Job
} from '../types';
import {
  FileText, Copy, CheckCircle2, XCircle, Clock,
  ChevronRight, ChevronLeft, Plus, Trash2, RefreshCw,
  ArrowRight, Tag, Percent, DollarSign, AlertCircle, Info,
  Search, Check, X, ExternalLink, Eye, ClipboardList, AlertTriangle,
  RotateCcw, HelpCircle, Package, Ship, MapPin, FileCheck
} from 'lucide-react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer from './shared/DetailDrawer';
import { T, badgeClass, statusLabel } from './shared/ui';

// ── types ────────────────────────────────────────────────────────
interface RateItemDraft {
  id: string;
  containerTypeId: string;
  useZone: boolean;
  originZoneId: string;
  destinationZoneId: string;
  originLocationId: string;
  destinationLocationId: string;
  baseRate: number | '';
  returnLegRate: number | '';
  tariffLoadedMsg: string;
}

interface SurchargeToggle {
  surchargeCode: string;
  surchargeName: string;
  amount: number;
  originalAmount: number;
  calculationMethod: string;
  isIncluded: boolean;
  enabled: boolean;
  autoTrigger: boolean;
}

interface QuotationWizardProps {
  quotations: Quotation[];
  customers: Customer[];
  locations: LocationGeo[];
  zones: Zone[];
  vessels: Vessel[];
  shippingLines: ShippingLine[];
  containerTypes: ContainerType[];
  surcharges: SurchargeRule[];
  tariffs: TariffRate[];
  regions: Region[];
  currentUser: User;
  invoiceSettings: InvoiceSettings[];
  quoteSequence: Record<string, number>;
  jobs: Job[];
  onAddQuotation: (q: Quotation) => void;
  onUpdateQuotation: (q: Quotation) => void;
  onConfirmQuotation: (quoteId: string) => void;
  onNavigate: (tab: string) => void;
  onConvertToBooking: (customerId: string, quoteId: string, rateItemId?: string) => void;
  onIncrementQuoteSequence: (regionId: string) => void;
}

// ── constants ────────────────────────────────────────────────────
const SCENARIO_DESC: Record<ScenarioType, string> = {
  IMP: 'Port → Customer → Empty Return to Depot',
  EXP: 'Depot → Customer → Port (laden)',
  Inland: 'Location to Location (no port)',
  EMTY: 'Depot to Depot (empty)',
  RETURN: 'Return container to shipping line',
};
const SCENARIO_ROT: Record<ScenarioType, 'yes' | 'no' | 'conditional'> = {
  IMP: 'yes', EXP: 'yes', Inland: 'no', EMTY: 'conditional', RETURN: 'no',
};
const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  superseded: 'bg-slate-100 text-slate-400 border-slate-200',
};
const SCENARIO_COLOR: Record<string, string> = {
  IMP: 'bg-blue-100 text-blue-800', EXP: 'bg-emerald-100 text-emerald-800',
  Inland: 'bg-purple-100 text-purple-800', EMTY: 'bg-slate-100 text-slate-600',
  RETURN: 'bg-orange-100 text-orange-800',
};
const today = () => new Date().toISOString().slice(0, 10);
const in90 = () => {
  const d = new Date(); d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
};
const blankItem = (): RateItemDraft => ({
  id: `ri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  containerTypeId: '', useZone: true,
  originZoneId: '', destinationZoneId: '',
  originLocationId: '', destinationLocationId: '',
  baseRate: '', returnLegRate: '', tariffLoadedMsg: '',
});

const INCOTERMS = [
  { code: 'EXW', label: 'EXW — Ex Works', desc: 'Buyer arranges all transport from seller\'s premises', freightPays: 'Consignee Pays' },
  { code: 'FCA', label: 'FCA — Free Carrier', desc: 'Seller delivers to named carrier; haulage from there is buyer\'s', freightPays: 'Consignee Pays' },
  { code: 'FOB', label: 'FOB — Free On Board', desc: 'Seller delivers to port; buyer pays haulage from port', freightPays: 'Consignee Pays' },
  { code: 'CFR', label: 'CFR — Cost & Freight', desc: 'Seller pays freight to destination port; buyer pays haulage from port', freightPays: 'Shipper Pays' },
  { code: 'CIF', label: 'CIF — Cost, Insurance & Freight', desc: 'Like CFR plus seller pays insurance to destination port', freightPays: 'Shipper Pays' },
  { code: 'CPT', label: 'CPT — Carriage Paid To', desc: 'Seller pays transport to named place', freightPays: 'Shipper Pays' },
  { code: 'CIP', label: 'CIP — Carriage & Insurance Paid', desc: 'Like CPT plus seller pays insurance', freightPays: 'Shipper Pays' },
  { code: 'DAP', label: 'DAP — Delivered At Place', desc: 'Seller delivers to destination; buyer handles unloading', freightPays: 'Shipper Pays' },
  { code: 'DDP', label: 'DDP — Delivered Duty Paid', desc: 'Seller responsible for full delivery including duties', freightPays: 'Shipper Pays' },
];

const in14 = () => {
  const d = new Date(); d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};

const getMqcConsumption = (quotation: Quotation, jobs: Job[]) => {
  if (!quotation.mqcVolume || !quotation.mqcPeriod || quotation.mqcPeriod === 'none') {
    return { used: 0, committed: 0, remaining: 0, percentUsed: 0, periodLabel: 'No commitment', isOverCommitted: false, resetDate: '' };
  }
  const now = new Date();
  let periodStart: Date, periodEnd: Date, periodLabel: string, resetDate: string;
  if (quotation.mqcPeriod === 'monthly') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    periodLabel = periodStart.toLocaleString('default', { month: 'long', year: 'numeric' });
    resetDate = `1 ${next.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  } else if (quotation.mqcPeriod === 'quarterly') {
    const q = Math.floor(now.getMonth() / 3);
    periodStart = new Date(now.getFullYear(), q * 3, 1);
    periodEnd = new Date(now.getFullYear(), q * 3 + 3, 0);
    const next = new Date(now.getFullYear(), q * 3 + 3, 1);
    periodLabel = `Q${q + 1} ${now.getFullYear()}`;
    resetDate = `1 ${next.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  } else {
    periodStart = new Date(now.getFullYear(), 0, 1);
    periodEnd = new Date(now.getFullYear(), 11, 31);
    periodLabel = `${now.getFullYear()}`;
    resetDate = `1 Jan ${now.getFullYear() + 1}`;
  }
  const used = jobs.filter(j =>
    j.quotationId === quotation.id &&
    new Date(j.createdAt) >= periodStart &&
    new Date(j.createdAt) <= periodEnd
  ).length;
  const committed = quotation.mqcVolume;
  const remaining = Math.max(0, committed - used);
  const percentUsed = Math.min(115, Math.round((used / committed) * 100));
  return { used, committed, remaining, percentUsed, periodLabel, isOverCommitted: used > committed, resetDate };
};

const HAZMAT_CLASSES = [
  'Class 1 — Explosives', 'Class 2 — Gases', 'Class 3 — Flammable Liquids',
  'Class 4 — Flammable Solids', 'Class 5 — Oxidizers', 'Class 6 — Toxic Substances',
  'Class 7 — Radioactive', 'Class 8 — Corrosives', 'Class 9 — Misc. Dangerous Goods',
];

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 280 : -280, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -280 : 280, opacity: 0 }),
};

export default function QuotationWizard({
  quotations, customers, locations, zones, vessels, shippingLines,
  containerTypes, surcharges, tariffs, regions, currentUser,
  invoiceSettings, quoteSequence, jobs,
  onAddQuotation, onUpdateQuotation, onConfirmQuotation,
  onNavigate, onConvertToBooking, onIncrementQuoteSequence,
}: QuotationWizardProps) {

  // ── left panel state ──────────────────────────────────────────
  const [listSearch, setListSearch] = useState('');
  const [listFilter, setListFilter] = useState<'all' | 'draft' | 'pending_approval' | 'confirmed' | 'expired' | 'superseded'>('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // ── right panel state ────────────────────────────────────────
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [rightView, setRightView] = useState<'empty' | 'detail' | 'create'>('empty');
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);

  // ── wizard form state ─────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [stepDir, setStepDir] = useState(1);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formScenario, setFormScenario] = useState<ScenarioType>('IMP');
  const [formValidFrom, setFormValidFrom] = useState(today());
  const [formValidTo, setFormValidTo] = useState(in90());
  const [formEmtyRot, setFormEmtyRot] = useState(false);
  const [formRateItems, setFormRateItems] = useState<RateItemDraft[]>([blankItem()]);
  const [formSurcharges, setFormSurcharges] = useState<SurchargeToggle[]>([]);
  const [formInternalNotes, setFormInternalNotes] = useState('');
  const [formCustomerNotes, setFormCustomerNotes] = useState('');
  const [clonedFromId, setClonedFromId] = useState<string | null>(null);
  const [formOfferValidUntil, setFormOfferValidUntil] = useState(in14());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── step 2 commercial terms state ────────────────────────────
  const [formPaymentTerms, setFormPaymentTerms] = useState('');
  const [formIncoterm, setFormIncoterm] = useState('');
  const [formFreightResp, setFormFreightResp] = useState('');
  const [formMqcVolume, setFormMqcVolume] = useState<number | ''>('');
  const [formMqcPeriod, setFormMqcPeriod] = useState('None');
  const [formIsHazmat, setFormIsHazmat] = useState(false);
  const [formHazmatClass, setFormHazmatClass] = useState('');
  const [formRequiresGenset, setFormRequiresGenset] = useState(false);
  const [formDemurrageFreeDays, setFormDemurrageFreeDays] = useState<number | ''>('');
  const [formDemurrageFlatRate, setFormDemurrageFlatRate] = useState<number | ''>('');
  const [formDetentionFreeDays, setFormDetentionFreeDays] = useState<number | ''>('');
  const [formDetentionFlatRate, setFormDetentionFlatRate] = useState<number | ''>('');
  const [showIncotermTooltip, setShowIncotermTooltip] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── derived ───────────────────────────────────────────────────
  const selectedQuote = quotations.find(q => q.id === selectedQuoteId) ?? null;
  const convertingQuote = quotations.find(q => q.id === convertingQuoteId) ?? null;

  // Initialize surcharges when scenario changes (only when no surcharges loaded yet)
  useEffect(() => {
    if (rightView !== 'create') return;
    const applicable = surcharges.filter(s =>
      s.isActive && (s.applicableScenarios.length === 0 || s.applicableScenarios.includes(formScenario))
    );
    setFormSurcharges(applicable.map(s => ({
      surchargeCode: s.code,
      surchargeName: s.name,
      amount: s.amount,
      originalAmount: s.amount,
      calculationMethod: s.calculationMethod,
      isIncluded: false,
      enabled: s.autoTrigger,
      autoTrigger: s.autoTrigger,
    })));
  }, [formScenario, rightView]);

  // ── filtered/sorted list ──────────────────────────────────────
  const filteredList = useMemo(() => {
    let list = quotations;
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter(qt => {
        const c = customers.find(cx => cx.id === qt.customerId);
        return qt.quoteNo.toLowerCase().includes(q) || c?.name.toLowerCase().includes(q);
      });
    }
    if (listFilter !== 'all') list = list.filter(qt => qt.status === listFilter);
    if (customerFilter) list = list.filter(qt => qt.customerId === customerFilter);
    if (scenarioFilter) list = list.filter(qt => qt.scenario === scenarioFilter);
    // Validity date range — quote validity window must overlap the selected range
    if (dateRange.from) list = list.filter(qt => (qt.validTo ?? '') >= dateRange.from);
    if (dateRange.to) list = list.filter(qt => (qt.validFrom ?? '') <= dateRange.to);
    return [...list].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [quotations, listSearch, listFilter, customerFilter, scenarioFilter, dateRange, customers]);

  const tabCounts = useMemo(() => ({
    all: quotations.length,
    draft: quotations.filter(q => q.status === 'draft').length,
    pending_approval: quotations.filter(q => q.status === 'pending_approval').length,
    confirmed: quotations.filter(q => q.status === 'confirmed').length,
    expired: quotations.filter(q => q.status === 'expired').length,
    superseded: quotations.filter(q => q.status === 'superseded').length,
  }), [quotations]);

  // ── helpers ───────────────────────────────────────────────────
  const generateQuoteNo = (regionId: string) => {
    const year = new Date().getFullYear();
    const region = regions.find(r => r.id === regionId);
    const code = region?.code ?? regionId.toUpperCase();
    const seq = (quoteSequence[regionId] ?? 0) + 1;
    return `QT-${code}-${year}-${String(seq).padStart(4, '0')}`;
  };

  const daysUntilExpiry = (validTo: string) => {
    const diff = new Date(validTo).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  };

  const loadTariff = (item: RateItemDraft): number | null => {
    const ct = containerTypes.find(c => c.id === item.containerTypeId);
    if (!ct) return null;
    let fromZone = '', toZone = '';
    if (item.useZone) {
      fromZone = zones.find(z => z.id === item.originZoneId)?.name ?? '';
      toZone = zones.find(z => z.id === item.destinationZoneId)?.name ?? '';
    } else {
      fromZone = locations.find(l => l.id === item.originLocationId)?.zone ?? '';
      toZone = locations.find(l => l.id === item.destinationLocationId)?.zone ?? '';
    }
    const match = tariffs.find(t => t.scenario === formScenario && t.fromZone === fromZone && t.toZone === toZone && t.size === ct.code);
    return match?.amount ?? null;
  };

  // ── wizard nav ────────────────────────────────────────────────
  const goNext = () => { setStepDir(1); setStep(s => Math.min(s + 1, 4)); };
  const goBack = () => { setStepDir(-1); setStep(s => Math.max(s - 1, 1)); };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!formCustomerId) return 'Please select a customer.';
      if (!formValidFrom || !formValidTo) return 'Please set validity dates.';
      if (formValidTo <= formValidFrom) return 'Valid To must be after Valid From.';
    }
    if (s === 3) {
      if (formRateItems.length === 0) return 'Add at least one rate line.';
      for (const item of formRateItems) {
        if (!item.containerTypeId) return 'Select container type for all rate lines.';
        if (item.baseRate === '' || Number(item.baseRate) <= 0) return 'Enter base charge for all rate lines.';
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { showToast(err, 'error'); return; }
    goNext();
  };

  // ── open create form (fresh or clone) ─────────────────────────
  const openCreate = (cloneFrom?: Quotation) => {
    setStep(1);
    setStepDir(1);
    if (cloneFrom) {
      setFormCustomerId(cloneFrom.customerId);
      setFormScenario(cloneFrom.scenario ?? 'IMP');
      setFormValidFrom(today());
      setFormValidTo(in90());
      setFormInternalNotes(cloneFrom.internalNotes ?? '');
      setFormCustomerNotes(cloneFrom.customerNotes ?? '');
      setFormRateItems((cloneFrom.rateItems ?? []).map(ri => ({
        id: blankItem().id,
        containerTypeId: ri.containerTypeId ?? '',
        useZone: !!ri.originZoneId,
        originZoneId: ri.originZoneId ?? '',
        destinationZoneId: ri.destinationZoneId ?? '',
        originLocationId: ri.originLocationId ?? '',
        destinationLocationId: ri.destinationLocationId ?? '',
        baseRate: ri.baseRate,
        returnLegRate: ri.returnLegRate ?? 0,
        tariffLoadedMsg: '',
      })));
      // surcharges will be reset by useEffect on formScenario
      setClonedFromId(cloneFrom.id);
    } else {
      setFormCustomerId('');
      setFormScenario('IMP');
      setFormValidFrom(today());
      setFormValidTo(in90());
      setFormOfferValidUntil(in14());
      setFormInternalNotes('');
      setFormCustomerNotes('');
      setFormRateItems([blankItem()]);
      setFormSurcharges([]);
      setClonedFromId(null);
      setFormPaymentTerms('');
      setFormIncoterm('');
      setFormFreightResp('');
      setFormMqcVolume('');
      setFormMqcPeriod('None');
      setFormIsHazmat(false);
      setFormHazmatClass('');
      setFormRequiresGenset(false);
      setFormDemurrageFreeDays('');
      setFormDemurrageFlatRate('');
      setFormDetentionFreeDays('');
      setFormDetentionFlatRate('');
    }
    setRightView('create');
  };

  // ── save quotation ────────────────────────────────────────────
  const handleSave = (saveStatus: 'draft' | 'pending_approval') => {
    const err = validateStep(1) ?? validateStep(3);
    if (err) { showToast(err, 'error'); return; }

    const regionId = currentUser.regionId || 'IN';
    const fafToggle = formSurcharges.find(s => s.surchargeCode === 'FAF' && s.enabled);

    const rateItems: QuotationRateItem[] = formRateItems.map(item => {
      const ct = containerTypes.find(c => c.id === item.containerTypeId);
      const base = Number(item.baseRate) || 0;
      const ret = Number(item.returnLegRate) || 0;
      const faf = fafToggle ? Math.round(base * fafToggle.amount / 100) : 0;
      const rot = SCENARIO_ROT[formScenario] === 'yes' ? true
        : SCENARIO_ROT[formScenario] === 'no' ? false : formEmtyRot;
      return {
        id: item.id,
        containerType: ct?.code ?? '',
        containerTypeId: item.containerTypeId,
        containerSize: ct?.code,
        originZoneId: item.useZone ? item.originZoneId : undefined,
        destinationZoneId: item.useZone ? item.destinationZoneId : undefined,
        originLocationId: !item.useZone ? item.originLocationId : undefined,
        destinationLocationId: !item.useZone ? item.destinationLocationId : undefined,
        baseRate: base,
        currency: 'INR',
        returnLegRate: ret,
        estimatedFuelSurcharge: faf,
        applicableSurcharges: formSurcharges.filter(s => s.enabled).map(s => ({
          surchargeCode: s.surchargeCode,
          surchargeName: s.surchargeName,
          amount: s.amount,
          calculationMethod: s.calculationMethod,
          isIncluded: s.isIncluded,
        })),
        totalEstimatedValue: base + ret + faf,
        rotRequired: rot,
        notes: '',
      };
    });

    const quoteNo = generateQuoteNo(regionId);
    const newQuote: Quotation = {
      id: `quote-${Date.now()}`,
      quoteNo,
      regionId,
      customerId: formCustomerId,
      scenario: formScenario,
      status: saveStatus,
      validFrom: formValidFrom,
      validTo: formValidTo,
      rateItems,
      totalValue: rateItems.reduce((s, r) => s + (r.totalEstimatedValue ?? 0), 0),
      currency: 'INR',
      internalNotes: formInternalNotes,
      customerNotes: formCustomerNotes,
      createdBy: currentUser.id,
      clonedFromId: clonedFromId ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // offer + commercial terms
      offerValidUntil: formOfferValidUntil || undefined,
      paymentTermsOverride: formPaymentTerms || undefined,
      incoterm: formIncoterm || undefined,
      freightResponsibility: formFreightResp || undefined,
      mqcVolume: formMqcVolume !== '' ? Number(formMqcVolume) : undefined,
      mqcPeriod: formMqcPeriod !== 'None' ? formMqcPeriod : undefined,
      isHazmatOnly: formIsHazmat || undefined,
      hazmatClass: formHazmatClass || undefined,
      requiresGenset: formRequiresGenset || undefined,
      demurrageFreeDays: formDemurrageFreeDays !== '' ? Number(formDemurrageFreeDays) : undefined,
      demurrageFlatRate: formDemurrageFlatRate !== '' ? Number(formDemurrageFlatRate) : undefined,
      detentionFreeDays: formDetentionFreeDays !== '' ? Number(formDetentionFreeDays) : undefined,
      detentionFlatRate: formDetentionFlatRate !== '' ? Number(formDetentionFlatRate) : undefined,
    };

    onAddQuotation(newQuote);
    onIncrementQuoteSequence(regionId);
    showToast(`${quoteNo} saved as ${saveStatus === 'draft' ? 'draft' : 'pending approval'} ✓`);
    setSelectedQuoteId(newQuote.id);
    setRightView('detail');
  };

  // ── status actions ────────────────────────────────────────────
  const handleApprove = (q: Quotation) => {
    onUpdateQuotation({ ...q, status: 'confirmed', confirmedBy: currentUser.id, confirmedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    showToast(`${q.quoteNo} confirmed ✓`);
  };
  const handleReject = (q: Quotation) => {
    onUpdateQuotation({ ...q, status: 'draft', updatedAt: new Date().toISOString() });
    showToast(`${q.quoteNo} returned to draft`);
  };
  const handleExpire = (q: Quotation) => {
    onUpdateQuotation({ ...q, status: 'expired', updatedAt: new Date().toISOString() });
    showToast(`${q.quoteNo} manually expired`);
  };

  const requiresApproval = invoiceSettings[0]?.requireApprovalBeforeSend ?? false;
  const isManager = ['administrator', 'region_admin'].includes(currentUser.role);

  // ── render helpers ────────────────────────────────────────────
  const fmtCurrency = (n: number, cur = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);

  // ── table columns ─────────────────────────────────────────────
  const listColumns: DataTableColumn<Quotation>[] = [
    {
      key: 'quoteNo', header: 'Quote No', sortValue: q => q.quoteNo,
      render: q => <span className={T.cellId}>{q.quoteNo}</span>,
    },
    {
      key: 'customer', header: 'Customer',
      sortValue: q => customers.find(c => c.id === q.customerId)?.name ?? '',
      render: q => {
        const cust = customers.find(c => c.id === q.customerId);
        return (
          <div>
            <span className={T.cellPrimary}>{cust?.name ?? '—'}</span>
            {(q.taxId || cust?.taxId) && <span className={`${T.cellMuted} block font-mono`}>{q.taxId ?? cust?.taxId}</span>}
          </div>
        );
      },
    },
    {
      key: 'scenario', header: 'Scenario', sortValue: q => q.scenario ?? '',
      render: q => q.scenario
        ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${SCENARIO_COLOR[q.scenario]}`}>{q.scenario}</span>
        : <span className={T.cellMuted}>—</span>,
    },
    {
      key: 'rates', header: 'Rate Summary',
      render: q => {
        const items = q.rateItems ?? q.rates ?? [];
        const first = items[0];
        if (!first) return <span className={T.cellMuted}>—</span>;
        return (
          <div>
            <span className={T.cellSecondary}>
              <span className="font-mono">{first.containerType ?? first.containerSize}</span>{' '}
              <strong>{fmtCurrency(first.baseRate, first.currency ?? 'INR')}</strong>
            </span>
            {items.length > 1 && <span className={`${T.cellMuted} block`}>+{items.length - 1} more</span>}
          </div>
        );
      },
    },
    {
      key: 'mqc', header: 'MQC',
      render: q => {
        if (!q.mqcVolume || !q.mqcPeriod || q.mqcPeriod === 'none') return <span className={T.cellMuted}>—</span>;
        const mqc = getMqcConsumption(q, jobs);
        const barColor = mqc.isOverCommitted ? 'bg-red-500' : mqc.percentUsed >= 80 ? 'bg-amber-500' : 'bg-green-500';
        return (
          <div className="w-24">
            <div className="text-[10px] font-bold text-slate-600">{mqc.used}/{mqc.committed}</div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, mqc.percentUsed)}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'validity', header: 'Validity', sortValue: q => q.validTo ?? '',
      render: q => {
        const expDays = daysUntilExpiry(q.validTo ?? '');
        const expiringSoon = q.status === 'confirmed' && expDays >= 0 && expDays <= 14;
        const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
        return (
          <div>
            <span className={T.cellMuted}>{fmt(q.validFrom)} → {fmt(q.validTo)}</span>
            {expiringSoon && (
              <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5" /> Expires in {expDays}d
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status', header: 'Status', sortValue: q => q.status,
      render: q => <span className={badgeClass(q.status)}>{statusLabel(q.status)}</span>,
    },
  ];

  const activeFilterCount =
    (listSearch ? 1 : 0) + (listFilter !== 'all' ? 1 : 0) + (customerFilter ? 1 : 0) +
    (scenarioFilter ? 1 : 0) + (dateRange.from || dateRange.to ? 1 : 0);

  const closeDrawer = () => { setRightView('empty'); setSelectedQuoteId(null); setConvertingQuoteId(null); };

  // ═══════════════════════════════════════════════════════════════
  return (
    <div className={rightView === 'create' ? 'flex h-[calc(100vh-110px)] bg-slate-50 overflow-hidden' : 'space-y-4'}>

      {/* ── LIST VIEW (full-width table) ── */}
      {rightView !== 'create' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`${T.pageTitle} flex items-center gap-2`}>
                <FileText className="w-5 h-5 text-blue-600" /> Commercial Quotations Hub
              </h1>
              <p className={T.pageSubtitle}>Draft, approve, and convert customer rate agreements.</p>
            </div>
            <button
              onClick={() => openCreate()}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Proposal
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <FilterBar
              searchPlaceholder="Search quote no or customer…"
              searchValue={listSearch}
              onSearchChange={setListSearch}
              statusOptions={[
                { value: 'all', label: 'All', count: tabCounts.all },
                { value: 'draft', label: 'Draft', count: tabCounts.draft },
                { value: 'pending_approval', label: 'Pending', count: tabCounts.pending_approval },
                { value: 'confirmed', label: 'Confirmed', count: tabCounts.confirmed },
                { value: 'expired', label: 'Expired', count: tabCounts.expired },
                { value: 'superseded', label: 'Superseded', count: tabCounts.superseded },
              ]}
              activeStatus={listFilter}
              onStatusChange={v => setListFilter(v as typeof listFilter)}
              dropdownFilters={[
                {
                  key: 'customer', label: 'Customer',
                  options: customers.map(c => ({ value: c.id, label: c.name })),
                  value: customerFilter, onChange: setCustomerFilter,
                },
                {
                  key: 'scenario', label: 'Scenario',
                  options: ['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'].map(s => ({ value: s, label: s })),
                  value: scenarioFilter, onChange: setScenarioFilter,
                },
              ]}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              dateRangeLabel="Valid"
              onClearAll={() => {
                setListSearch(''); setListFilter('all'); setCustomerFilter('');
                setScenarioFilter(''); setDateRange({ from: '', to: '' });
              }}
              activeFilterCount={activeFilterCount}
            />
            <DataTable
              columns={listColumns}
              rows={filteredList}
              onRowClick={q => { setSelectedQuoteId(q.id); setRightView('detail'); setConvertingQuoteId(null); }}
              rowActions={q => (
                <>
                  <button
                    title="Clone"
                    onClick={() => openCreate(q)}
                    className="h-7 w-7 flex items-center justify-center rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {q.status === 'confirmed' && (
                    <button
                      title="Convert to Booking"
                      onClick={() => { setSelectedQuoteId(q.id); setConvertingQuoteId(q.id); setRightView('detail'); }}
                      className="h-7 w-7 flex items-center justify-center rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
              emptyState={{
                icon: <FileText className="w-10 h-10" />,
                title: 'No quotations found',
                subtitle: 'Adjust the filters or create a new proposal.',
              }}
            />
          </div>
        </>
      )}

      {/* ── DETAIL / CONVERT DRAWER ── */}
      {rightView !== 'create' && (
        <DetailDrawer
          open={rightView === 'detail' && !!selectedQuote}
          onClose={closeDrawer}
          width="640px"
          title={
            convertingQuote ? (
              <span>Convert to Booking</span>
            ) : (
              <>
                <span className="font-mono">{selectedQuote?.quoteNo}</span>
                {selectedQuote && <span className={badgeClass(selectedQuote.status)}>{statusLabel(selectedQuote.status)}</span>}
              </>
            )
          }
          subtitle={
            convertingQuote
              ? `Converting ${convertingQuote.quoteNo}`
              : selectedQuote
                ? `${customers.find(c => c.id === selectedQuote.customerId)?.name ?? ''}${selectedQuote.clonedFromId ? ` · cloned from ${quotations.find(q => q.id === selectedQuote.clonedFromId)?.quoteNo ?? ''}` : ''}`
                : undefined
          }
          footer={
            convertingQuote ? (
              <>
                <button onClick={() => setConvertingQuoteId(null)} className="btn-secondary">Cancel</button>
                <button
                  onClick={() => {
                    const ri = (convertingQuote.rateItems ?? [])[0];
                    onConvertToBooking(convertingQuote.customerId, convertingQuote.id, ri?.id);
                    setConvertingQuoteId(null);
                    showToast('Navigating to Booking — quotation pre-filled ✓');
                  }}
                  className="btn-primary flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Proceed to Booking Form →
                </button>
              </>
            ) : selectedQuote ? (
              <>
                {selectedQuote.status === 'draft' && (
                  <>
                    <button onClick={() => openCreate(selectedQuote)} className="btn-secondary flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Edit</button>
                    <button onClick={() => {
                      onUpdateQuotation({ ...selectedQuote, status: 'pending_approval', updatedAt: new Date().toISOString() });
                      showToast('Submitted for approval ✓');
                    }} className="btn-primary flex items-center gap-1"><ChevronRight className="w-3 h-3" /> Submit for Approval</button>
                  </>
                )}
                {selectedQuote.status === 'pending_approval' && isManager && (
                  <>
                    <button onClick={() => handleReject(selectedQuote)} className="btn-danger flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject → Draft</button>
                    <button onClick={() => handleApprove(selectedQuote)} className="btn-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approve &amp; Confirm</button>
                  </>
                )}
                {selectedQuote.status === 'confirmed' && (
                  <>
                    <button onClick={() => openCreate(selectedQuote)} className="btn-secondary flex items-center gap-1"><Copy className="w-3 h-3" /> Clone</button>
                    <button onClick={() => handleExpire(selectedQuote)} className="btn-danger flex items-center gap-1"><Clock className="w-3 h-3" /> Expire</button>
                    <button onClick={() => setConvertingQuoteId(selectedQuote.id)} className="btn-primary flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Convert to Booking</button>
                  </>
                )}
                {selectedQuote.status === 'expired' && (
                  <button onClick={() => openCreate(selectedQuote)} className="btn-secondary flex items-center gap-1"><Copy className="w-3 h-3" /> Clone</button>
                )}
              </>
            ) : undefined
          }
        >
          {/* ── CONVERT TO BOOKING CONTENT ── */}
          {convertingQuote && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pre-filled from Quotation (locked)</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-400">Customer:</span> <span className="font-bold text-slate-800">{customers.find(c => c.id === convertingQuote.customerId)?.name}</span></div>
                  <div><span className="text-slate-400">Scenario:</span> <span className={`font-bold px-1.5 py-0.5 rounded ${SCENARIO_COLOR[convertingQuote.scenario ?? 'IMP']}`}>{convertingQuote.scenario}</span></div>
                  {(convertingQuote.rateItems ?? [])[0] && <>
                    <div><span className="text-slate-400">Container Type:</span> <span className="font-mono font-bold text-slate-700">{(convertingQuote.rateItems ?? [])[0].containerType}</span></div>
                    <div><span className="text-slate-400">Base Rate:</span> <span className="font-bold text-blue-700">{fmtCurrency((convertingQuote.rateItems ?? [])[0].baseRate, (convertingQuote.rateItems ?? [])[0].currency)}</span></div>
                  </>}
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <div className="text-[10px] font-bold uppercase text-blue-500 tracking-wider flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Still required in Booking Form
                </div>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  {['Container No & Seal No', 'Shipping Line & Vessel', 'Voyage No & ETA', 'Origin & Destination Locations', 'Target Delivery Date'].map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── DETAIL CONTENT (read-only) ── */}
          {!convertingQuote && selectedQuote && (
          <div>
            {/* Info strip */}
            <div className="-mx-5 -mt-4 mb-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-4 flex-wrap text-xs">
              {selectedQuote.scenario && <span className={`font-bold px-2 py-0.5 rounded ${SCENARIO_COLOR[selectedQuote.scenario]}`}>{selectedQuote.scenario}</span>}
              <span className="text-slate-500">Region: <strong>{selectedQuote.regionId}</strong></span>
              <span className="text-slate-500">Currency: <strong>{selectedQuote.currency}</strong></span>
              {selectedQuote.confirmedBy && <span className="text-green-600">Confirmed by {selectedQuote.confirmedBy}</span>}
            </div>

            <div className="space-y-5">


              {/* ── VALIDITY SECTION ── */}
              {(() => {
                const isPreConfirm = ['draft', 'pending_approval'].includes(selectedQuote.status);
                const offerDays = selectedQuote.offerValidUntil ? daysUntilExpiry(selectedQuote.offerValidUntil) : null;
                const contractDays = selectedQuote.status === 'confirmed' ? daysUntilExpiry(selectedQuote.validTo) : null;
                return (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Validity
                      </span>
                    </div>
                    <div className="px-4 py-3 space-y-2.5 text-xs">
                      {selectedQuote.offerValidUntil && (
                        <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${isPreConfirm ? (offerDays !== null && offerDays <= 7 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200') : 'bg-slate-50 border-slate-200'}`}>
                          <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPreConfirm ? (offerDays !== null && offerDays <= 7 ? 'text-red-500' : 'text-amber-500') : 'text-slate-400'}`} />
                          <div>
                            <div className="font-bold text-slate-700">Offer Valid Until: <span className="font-mono">{selectedQuote.offerValidUntil}</span></div>
                            {isPreConfirm && offerDays !== null && (
                              <div className={`text-[10px] font-bold mt-0.5 ${offerDays <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                                {offerDays > 0 ? `⏰ Expires in ${offerDays} day${offerDays !== 1 ? 's' : ''} — customer must approve by ${selectedQuote.offerValidUntil}` : 'Offer deadline has passed'}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">offer approval deadline</div>
                          </div>
                        </div>
                      )}
                      {selectedQuote.status === 'confirmed' && (
                        <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${contractDays !== null && contractDays <= 30 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${contractDays !== null && contractDays <= 30 ? 'text-amber-500' : 'text-green-500'}`} />
                          <div>
                            <div className="font-bold text-slate-700">
                              Contract Period: <span className="font-mono">{selectedQuote.validFrom}</span> → <span className="font-mono">{selectedQuote.validTo}</span>
                            </div>
                            {contractDays !== null && contractDays <= 30 && (
                              <div className="text-[10px] font-bold text-amber-600 mt-0.5">⏰ Contract expires in {contractDays} day{contractDays !== 1 ? 's' : ''}</div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">bookings allowed in this window</div>
                          </div>
                        </div>
                      )}
                      {selectedQuote.status !== 'confirmed' && (
                        <div className="text-[10px] text-slate-400 flex gap-1">
                          <span>Contract period:</span>
                          <span className="font-mono">{selectedQuote.validFrom} → {selectedQuote.validTo}</span>
                          <span>(active once confirmed)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── COMMERCIAL TERMS ── */}
              {(selectedQuote.incoterm || selectedQuote.freightResponsibility || selectedQuote.paymentTermsOverride || selectedQuote.mqcVolume || selectedQuote.isHazmatOnly || selectedQuote.requiresGenset || selectedQuote.demurrageFreeDays || selectedQuote.detentionFreeDays) && (
                <div className="space-y-3">
                  {/* Payment & Trade */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Ship className="w-3 h-3" /> Commercial Terms
                      </span>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-slate-400">Incoterm:</span>{' '}
                        {selectedQuote.incoterm
                          ? <><strong className="font-mono font-black">{selectedQuote.incoterm}</strong>
                            <span className="block text-[10px] text-slate-400 mt-0.5 italic">{INCOTERMS.find(i => i.code === selectedQuote.incoterm)?.desc}</span></>
                          : <span className="text-slate-400">—</span>}
                      </div>
                      <div>
                        <span className="text-slate-400">Freight:</span>{' '}
                        <strong>{selectedQuote.freightResponsibility ?? '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Payment Terms:</span>{' '}
                        <strong>{selectedQuote.paymentTermsOverride ?? customers.find(c => c.id === selectedQuote.customerId)?.paymentTerms ?? '—'}</strong>
                      </div>
                      {selectedQuote.mqcVolume && selectedQuote.mqcPeriod && selectedQuote.mqcPeriod !== 'none' && (
                        <div>
                          <span className="text-slate-400">Volume Commitment:</span>{' '}
                          <strong>{selectedQuote.mqcVolume} containers / {selectedQuote.mqcPeriod}</strong>
                        </div>
                      )}
                      {selectedQuote.isHazmatOnly && (
                        <div className="text-red-700">
                          <span className="text-slate-400">Hazardous Cargo:</span>{' '}
                          <strong>Yes{selectedQuote.hazmatClass ? ` — ${selectedQuote.hazmatClass}` : ''}</strong>
                        </div>
                      )}
                      {selectedQuote.requiresGenset && (
                        <div><span className="text-slate-400">Genset Required:</span> <strong>Yes</strong></div>
                      )}
                    </div>
                  </div>

                  {/* Free time & detention */}
                  {(selectedQuote.demurrageFreeDays || selectedQuote.detentionFreeDays) && (
                    <div className="border border-amber-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" /> Free Time &amp; Detention Policy
                        </span>
                      </div>
                      <div className="px-4 py-3 space-y-1.5 text-xs">
                        {selectedQuote.demurrageFreeDays && (
                          <div className="text-slate-700">
                            Port Demurrage: <strong>{selectedQuote.demurrageFreeDays} days free</strong>
                            {selectedQuote.demurrageFlatRate ? <>, <strong className="text-amber-700">{fmtCurrency(selectedQuote.demurrageFlatRate)}/day</strong> after</> : ''}
                          </div>
                        )}
                        {selectedQuote.detentionFreeDays && (
                          <div className="text-slate-700">
                            Warehouse Detention: <strong>{selectedQuote.detentionFreeDays} days free</strong>
                            {selectedQuote.detentionFlatRate ? <>, <strong className="text-amber-700">{fmtCurrency(selectedQuote.detentionFlatRate)}/day</strong> after</> : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MQC tracking */}
                  {selectedQuote.mqcVolume && selectedQuote.mqcPeriod && selectedQuote.mqcPeriod !== 'none' && (() => {
                    const mqc = getMqcConsumption(selectedQuote, jobs);
                    const barColor = mqc.isOverCommitted ? 'bg-red-500' : mqc.percentUsed >= 80 ? 'bg-amber-500' : 'bg-green-500';
                    return (
                      <div className={`border rounded-lg overflow-hidden ${mqc.isOverCommitted ? 'border-amber-300' : 'border-slate-200'}`}>
                        <div className={`px-4 py-2.5 border-b ${mqc.isOverCommitted ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${mqc.isOverCommitted ? 'text-amber-700' : 'text-slate-500'}`}>
                            {mqc.isOverCommitted ? <AlertTriangle className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                            {mqc.isOverCommitted ? '⚠ Volume Commitment Exceeded' : `Volume Commitment — ${mqc.periodLabel}`}
                          </span>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          <div className="text-xs font-bold text-slate-700">{mqc.used} of {mqc.committed} containers used</div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, mqc.percentUsed)}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{mqc.percentUsed}%</span>
                            {!mqc.isOverCommitted && <span>{mqc.remaining} remaining · Resets: {mqc.resetDate}</span>}
                          </div>
                          {mqc.isOverCommitted && (
                            <div className="text-xs text-amber-700 font-bold bg-amber-50 rounded px-3 py-2 border border-amber-200">
                              {mqc.used - mqc.committed} containers booked beyond commitment. Confirm if spot rate applies to these.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── RATE ITEMS TABLE ── */}
              {/* Rate items table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Rate Items
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        <th className="px-4 py-2.5 text-left">Container</th>
                        <th className="px-4 py-2.5 text-left">Route</th>
                        <th className="px-4 py-2.5 text-right">Base Rate</th>
                        <th className="px-4 py-2.5 text-right">Return Leg</th>
                        <th className="px-4 py-2.5 text-right">FAF (Est)</th>
                        <th className="px-4 py-2.5 text-center">ROT</th>
                        <th className="px-4 py-2.5 text-right">Total Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedQuote.rateItems ?? []).map(ri => (
                        <tr key={ri.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-700">{ri.containerType ?? ri.containerSize}</td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {ri.originZoneId
                              ? `${zones.find(z => z.id === ri.originZoneId)?.code ?? ri.originZoneId} → ${zones.find(z => z.id === ri.destinationZoneId)?.code ?? ri.destinationZoneId}`
                              : `${locations.find(l => l.id === ri.originLocationId)?.code ?? '—'} → ${locations.find(l => l.id === ri.destinationLocationId)?.code ?? '—'}`
                            }
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">{fmtCurrency(ri.baseRate, ri.currency)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-600">{ri.returnLegRate ? fmtCurrency(ri.returnLegRate, ri.currency) : '—'}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-blue-600">{ri.estimatedFuelSurcharge ? fmtCurrency(ri.estimatedFuelSurcharge, ri.currency) : '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {ri.rotRequired ? <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Required</span>
                              : <span className="text-[9px] text-slate-400">No</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-black text-blue-700">{fmtCurrency(ri.totalEstimatedValue ?? ri.baseRate, ri.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan={6} className="px-4 py-2 text-right text-xs font-bold text-slate-600">Total Estimated Value:</td>
                        <td className="px-4 py-2 text-right font-mono font-black text-blue-800">{fmtCurrency(selectedQuote.totalValue ?? 0, selectedQuote.currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Surcharges */}
              {(selectedQuote.rateItems?.[0]?.applicableSurcharges?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5" /> Surcharges
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          <th className="px-4 py-2 text-left">Code</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Method</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedQuote.rateItems?.[0]?.applicableSurcharges ?? []).map(s => (
                          <tr key={s.surchargeCode} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono font-bold text-slate-700">{s.surchargeCode}</td>
                            <td className="px-4 py-2 text-slate-600">{s.surchargeName}</td>
                            <td className="px-4 py-2 text-slate-400">{s.calculationMethod}</td>
                            <td className="px-4 py-2 text-right font-mono font-bold text-slate-700">{s.amount}{s.calculationMethod.includes('%') ? '%' : ''}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.isIncluded ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                {s.isIncluded ? 'Included' : 'Extra'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="grid grid-cols-2 gap-4">
                {selectedQuote.internalNotes && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Internal Notes</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{selectedQuote.internalNotes}</p>
                  </div>
                )}
                {selectedQuote.customerNotes && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5">Customer Notes (printed)</div>
                    <p className="text-xs text-blue-700 leading-relaxed">{selectedQuote.customerNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </DetailDrawer>
      )}

        {/* ── CREATE WIZARD ── */}
        {rightView === 'create' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Progress indicator */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-0">
                {['Customer & Validity', 'Commercial Terms', 'Routes & Rates', 'Review & Save'].map((label, i) => {
                  const n = i + 1;
                  const isActive = step === n;
                  const isDone = step > n;
                  return (
                    <React.Fragment key={n}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          {isDone ? <Check className="w-3 h-3" /> : n}
                        </div>
                        <span className={`text-[11px] font-bold ${isActive ? 'text-blue-700' : isDone ? 'text-green-600' : 'text-slate-400'}`}>{label}</span>
                      </div>
                      {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1" />}
                    </React.Fragment>
                  );
                })}
              </div>
              {clonedFromId && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-1.5 flex items-center gap-1.5">
                  <Copy className="w-3 h-3" />
                  Cloned from <span className="font-mono font-bold">{quotations.find(q => q.id === clonedFromId)?.quoteNo}</span> on {today()}
                </motion.div>
              )}
            </div>

            {/* Step content with slide animation */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait" custom={stepDir}>

                {/* ── STEP 1: Customer & Validity ── */}
                {step === 1 && (
                  <motion.div key="step1" custom={stepDir} variants={stepVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto p-6 space-y-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" /> Customer &amp; Validity
                    </h3>

                    {/* Target customer */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Target Customer Account *</label>
                      <select value={formCustomerId} onChange={e => setFormCustomerId(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400">
                        <option value="">Select customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.taxId}</option>)}
                      </select>
                      {formCustomerId && (() => {
                        const c = customers.find(cx => cx.id === formCustomerId);
                        return c ? (
                          <div className="text-[10px] text-slate-400 mt-1 flex gap-3">
                            <span>Tax: <strong className="font-mono">{c.taxId}</strong></span>
                            <span>Terms: <strong>{c.paymentTerms}</strong></span>
                            <span>Credit: <strong>{fmtCurrency(c.creditLimit)}</strong></span>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Region badge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Region</label>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-600">
                          {regions.find(r => r.id === (currentUser.regionId || 'IN'))?.name ?? currentUser.regionId ?? 'IN'}
                        </span>
                        <span className="text-[10px] text-slate-400">Auto-assigned from your profile</span>
                      </div>
                    </div>

                    {/* Offer valid until */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Offer Valid Until *</label>
                      <input type="date" value={formOfferValidUntil} onChange={e => setFormOfferValidUntil(e.target.value)}
                        className="w-full text-sm border border-amber-200 bg-amber-50/30 rounded px-3 py-2 focus:outline-none focus:border-amber-400" />
                      <p className="text-[10px] text-amber-600">Customer must approve this rate by this date, or it expires and needs re-quoting.</p>
                    </div>

                    {/* Contract validity dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Contract Start Date *</label>
                        <input type="date" value={formValidFrom} onChange={e => setFormValidFrom(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Contract End Date *</label>
                        <input type="date" value={formValidTo} onChange={e => setFormValidTo(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                        <p className="text-[10px] text-slate-400">Bookings can be created against this quote until this date.</p>
                      </div>
                    </div>

                    {/* Scenario */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-slate-500">Scenario Type *</label>
                      <div className="flex gap-2 flex-wrap">
                        {(['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'] as ScenarioType[]).map(s => (
                          <button key={s} onClick={() => setFormScenario(s)}
                            className={`px-3 py-1.5 rounded text-xs font-bold border transition ${formScenario === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">{SCENARIO_DESC[formScenario]}</p>
                      <div className={`text-[10px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1.5 ${SCENARIO_ROT[formScenario] === 'yes' ? 'bg-green-50 text-green-700 border border-green-200' : SCENARIO_ROT[formScenario] === 'no' ? 'bg-slate-50 text-slate-500 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        Release Order (ROT): {SCENARIO_ROT[formScenario] === 'yes' ? 'Required ✓' : SCENARIO_ROT[formScenario] === 'no' ? 'Not Required' : 'Conditional'}
                        {SCENARIO_ROT[formScenario] === 'conditional' && (
                          <label className="flex items-center gap-1 ml-2 cursor-pointer font-normal">
                            <input type="checkbox" checked={formEmtyRot} onChange={e => setFormEmtyRot(e.target.checked)} />
                            Require ROT
                          </label>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: Commercial Terms ── */}
                {step === 2 && (
                  <motion.div key="step2" custom={stepDir} variants={stepVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto p-6 space-y-5"
                  >
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Ship className="w-4 h-4 text-blue-500" /> Commercial Terms
                    </h3>

                    {/* GROUP 1: Payment & Trade Terms */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" /> Payment &amp; Trade Terms
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Payment Terms / Credit</label>
                          <input type="text" placeholder={customers.find(c => c.id === formCustomerId)?.paymentTerms ?? 'e.g. Net 30 Days'}
                            value={formPaymentTerms}
                            onChange={e => setFormPaymentTerms(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                          <p className="text-[9px] text-slate-400">Leave blank to use customer default</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Freight Responsibility</label>
                          <select value={formFreightResp} onChange={e => setFormFreightResp(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400">
                            <option value="">Select...</option>
                            <option value="Consignee Pays">Consignee Pays Freight</option>
                            <option value="Shipper Pays">Shipper Pays Freight</option>
                            <option value="Third Party Pays">Third Party Pays</option>
                          </select>
                        </div>
                      </div>

                      {/* Incoterms — prominent */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          Incoterms (Rules of Freight)
                          <button type="button" onClick={() => setShowIncotermTooltip(v => !v)}
                            className="text-slate-400 hover:text-blue-500 transition">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </label>
                        <AnimatePresence>
                          {showIncotermTooltip && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-[9px] space-y-1">
                              <div className="font-bold text-blue-800 mb-1.5">Incoterm Guide for Haulage</div>
                              {INCOTERMS.map(it => (
                                <div key={it.code} className="grid grid-cols-[3rem_1fr] gap-1">
                                  <span className="font-mono font-bold text-blue-700">{it.code}</span>
                                  <span className="text-blue-600">{it.desc}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <select value={formIncoterm}
                          onChange={e => {
                            const val = e.target.value;
                            setFormIncoterm(val);
                            const suggestion = INCOTERMS.find(it => it.code === val)?.freightPays ?? '';
                            if (suggestion && !formFreightResp) setFormFreightResp(suggestion);
                          }}
                          className="w-full text-xs border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400">
                          <option value="">Select Incoterm...</option>
                          {INCOTERMS.map(it => <option key={it.code} value={it.code}>{it.label}</option>)}
                        </select>
                        {formIncoterm && (
                          <p className="text-[10px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                            {INCOTERMS.find(it => it.code === formIncoterm)?.desc}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* GROUP 2: Volume Commitment */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileCheck className="w-3 h-3" /> Volume Commitment (MQC)
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Minimum Qty (containers)</label>
                          <input type="number" placeholder="e.g. 20" value={formMqcVolume}
                            onChange={e => setFormMqcVolume(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Period</label>
                          <select value={formMqcPeriod} onChange={e => setFormMqcPeriod(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400">
                            {['None', 'Monthly', 'Quarterly', 'Annual'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* GROUP 3: Special Cargo */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> Special Cargo Profile
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-bold">
                          <input type="checkbox" checked={formIsHazmat} onChange={e => { setFormIsHazmat(e.target.checked); if (!e.target.checked) setFormHazmatClass(''); }}
                            className="rounded" />
                          Hazardous Cargo (IMDG)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-bold">
                          <input type="checkbox" checked={formRequiresGenset} onChange={e => setFormRequiresGenset(e.target.checked)} className="rounded" />
                          Genset Required (Reefer)
                        </label>
                      </div>
                      {formIsHazmat && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Hazmat Class</label>
                          <select value={formHazmatClass} onChange={e => setFormHazmatClass(e.target.value)}
                            className="w-full text-xs border border-amber-200 bg-amber-50 rounded px-3 py-2 focus:outline-none focus:border-amber-400">
                            <option value="">Select hazmat class...</option>
                            {HAZMAT_CLASSES.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </motion.div>
                      )}
                    </div>

                    {/* GROUP 4: Free Time & Detention */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Free Time &amp; Detention Policy
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Port Demurrage Free Days</label>
                          <input type="number" placeholder="e.g. 7" value={formDemurrageFreeDays}
                            onChange={e => setFormDemurrageFreeDays(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                          <p className="text-[9px] text-slate-400">Days at port before demurrage starts</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Demurrage Rate (per day)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input type="number" placeholder="e.g. 5000" value={formDemurrageFlatRate}
                              onChange={e => setFormDemurrageFlatRate(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full pl-6 pr-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
                          </div>
                          <p className="text-[9px] text-slate-400">Flat rate charged per day over free period</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Warehouse Detention Free Days</label>
                          <input type="number" placeholder="e.g. 5" value={formDetentionFreeDays}
                            onChange={e => setFormDetentionFreeDays(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400" />
                          <p className="text-[9px] text-slate-400">Days at customer site before detention starts</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">Detention Rate (per day)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input type="number" placeholder="e.g. 3000" value={formDetentionFlatRate}
                              onChange={e => setFormDetentionFlatRate(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full pl-6 pr-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
                          </div>
                          <p className="text-[9px] text-slate-400">Flat rate charged per day over free period</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: Routes & Rates ── */}
                {step === 3 && (
                  <motion.div key="step3" custom={stepDir} variants={stepVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" /> Routes &amp; Rates
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Each line = one route + container combination</p>
                      </div>
                      <button onClick={() => setFormRateItems(prev => [...prev, blankItem()])}
                        className="shrink-0 flex items-center gap-1 text-[11px] px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition">
                        <Plus className="w-3 h-3" /> Add Rate Line
                      </button>
                    </div>

                    {/* Scenario lock reminder */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className={`font-bold px-2 py-0.5 rounded ${SCENARIO_COLOR[formScenario]}`}>{formScenario}</span>
                      <span className="text-slate-500">All rate lines locked to this scenario. Need another? Create a separate quotation.</span>
                    </div>

                    {formRateItems.length === 0 && (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                        <Plus className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-xs italic">No rate lines yet — add at least one.</p>
                      </div>
                    )}

                    {formRateItems.map((item, idx) => {
                      const fafRule = formSurcharges.find(s => s.surchargeCode === 'FAF' && s.enabled);
                      const base = Number(item.baseRate) || 0;
                      const ret = Number(item.returnLegRate) || 0;
                      const faf = fafRule && base > 0 ? Math.round(base * fafRule.amount / 100) : 0;
                      const total = base + ret + faf;
                      return (
                        <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${SCENARIO_COLOR[formScenario]}`}>{formScenario}</span>
                              Rate Line #{idx + 1}
                            </span>
                            {formRateItems.length > 1 && (
                              <button onClick={() => setFormRateItems(prev => prev.filter(x => x.id !== item.id))}
                                className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {/* Container/Size */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <Package className="w-2.5 h-2.5" /> Container / Size
                              </label>
                              <select value={item.containerTypeId}
                                onChange={e => setFormRateItems(prev => prev.map(x => x.id === item.id ? { ...x, containerTypeId: e.target.value, tariffLoadedMsg: '' } : x))}
                                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
                                <option value="">Select...</option>
                                {containerTypes.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                              </select>
                            </div>
                            {/* Route type */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Route Type</label>
                              <div className="flex gap-1">
                                {(['Zone-based', 'Point-to-point'] as const).map(rt => (
                                  <button key={rt} onClick={() => setFormRateItems(prev => prev.map(x => x.id === item.id ? { ...x, useZone: rt === 'Zone-based' } : x))}
                                    className={`flex-1 text-[10px] font-bold py-1.5 rounded border transition ${item.useZone === (rt === 'Zone-based') ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                                    {rt}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Origin node */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> Origin {item.useZone ? 'Zone' : 'Location'}
                              </label>
                              <select value={item.useZone ? item.originZoneId : item.originLocationId}
                                onChange={e => setFormRateItems(prev => prev.map(x => x.id === item.id
                                  ? { ...x, ...(item.useZone ? { originZoneId: e.target.value } : { originLocationId: e.target.value }), tariffLoadedMsg: '' } : x))}
                                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
                                <option value="">Select...</option>
                                {item.useZone
                                  ? zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)
                                  : locations.map(l => <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>)}
                              </select>
                            </div>
                            {/* Destination node */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> Destination {item.useZone ? 'Zone' : 'Location'}
                              </label>
                              <select value={item.useZone ? item.destinationZoneId : item.destinationLocationId}
                                onChange={e => setFormRateItems(prev => prev.map(x => x.id === item.id
                                  ? { ...x, ...(item.useZone ? { destinationZoneId: e.target.value } : { destinationLocationId: e.target.value }), tariffLoadedMsg: '' } : x))}
                                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
                                <option value="">Select...</option>
                                {item.useZone
                                  ? zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)
                                  : locations.map(l => <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Load from tariff */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const rate = loadTariff(item);
                                setFormRateItems(prev => prev.map(x => x.id === item.id
                                  ? { ...x, baseRate: rate ?? x.baseRate, tariffLoadedMsg: rate !== null ? `Loaded ✓ (${fmtCurrency(rate)})` : 'No matching tariff' } : x));
                              }}
                              className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded font-bold text-slate-600 transition flex items-center gap-1"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> ↓ Load from Tariff Card
                            </button>
                            {item.tariffLoadedMsg && (
                              <span className={`text-[10px] font-bold ${item.tariffLoadedMsg.includes('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                                {item.tariffLoadedMsg}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {/* Base charge */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Base Charge</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                <input type="number" placeholder="0" value={item.baseRate}
                                  onChange={e => setFormRateItems(prev => prev.map(x => x.id === item.id ? { ...x, baseRate: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                                  className="w-full pl-6 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
                              </div>
                              <p className="text-[9px] text-slate-400">Per trip, excl. surcharges</p>
                            </div>
                            {/* Return leg — IMP/EXP only */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                <RotateCcw className="w-2.5 h-2.5" /> Return Leg Rate
                                {!['IMP', 'EXP'].includes(formScenario) && <span className="text-slate-300 font-normal">(N/A)</span>}
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                <input type="number" placeholder="0" value={item.returnLegRate}
                                  disabled={!['IMP', 'EXP'].includes(formScenario)}
                                  onChange={e => setFormRateItems(prev => prev.map(x => x.id === item.id ? { ...x, returnLegRate: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                                  className="w-full pl-6 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-300" />
                              </div>
                              {formScenario === 'IMP' && <p className="text-[9px] text-slate-400">Empty return to depot</p>}
                            </div>
                          </div>

                          {/* Live calc */}
                          {base > 0 && (
                            <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded border border-blue-100 text-xs">
                              {faf > 0 && <span className="text-blue-500 flex items-center gap-1"><Percent className="w-3 h-3" /> FAF (est.): <strong>{fmtCurrency(faf)}</strong></span>}
                              <span className="text-blue-800 font-black ml-auto flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Line Total: {fmtCurrency(total)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Running total */}
                    {formRateItems.some(i => Number(i.baseRate) > 0) && (
                      <div className="p-3 bg-slate-800 text-white rounded-lg flex items-center justify-between text-xs">
                        <span className="text-slate-300">Total Estimated Contract Value</span>
                        <span className="font-black text-base">
                          {fmtCurrency(formRateItems.reduce((sum, item) => {
                            const base = Number(item.baseRate) || 0;
                            const ret = Number(item.returnLegRate) || 0;
                            const fafRule = formSurcharges.find(s => s.surchargeCode === 'FAF' && s.enabled);
                            const faf = fafRule && base > 0 ? Math.round(base * fafRule.amount / 100) : 0;
                            return sum + base + ret + faf;
                          }, 0))}
                        </span>
                        <span className="text-slate-400">across {formRateItems.length} rate line{formRateItems.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── STEP 4: Review & Save ── */}
                {step === 4 && (
                  <motion.div key="step4" custom={stepDir} variants={stepVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="absolute inset-0 overflow-y-auto p-6 space-y-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-500" /> Review &amp; Save
                    </h3>

                    {/* Section 1 summary */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Package className="w-3 h-3" /> Customer &amp; Validity</span>
                        <button onClick={() => { setStepDir(-1); setStep(1); }} className="text-[9px] text-blue-500 hover:underline font-bold">Edit</button>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-3 text-xs">
                        <div><span className="text-slate-400">Customer:</span> <strong>{customers.find(c => c.id === formCustomerId)?.name ?? '—'}</strong></div>
                        <div><span className="text-slate-400">Scenario:</span> <span className={`font-bold px-1.5 py-0.5 rounded ${SCENARIO_COLOR[formScenario]}`}>{formScenario}</span></div>
                        <div><span className="text-slate-400">Valid:</span> <span className="font-mono">{formValidFrom} → {formValidTo}</span></div>
                        <div><span className="text-slate-400">ROT:</span> <strong>{SCENARIO_ROT[formScenario] === 'yes' ? 'Required' : SCENARIO_ROT[formScenario] === 'no' ? 'Not Required' : formEmtyRot ? 'Required' : 'Not Required'}</strong></div>
                      </div>
                    </div>

                    {/* Section 2 summary */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Ship className="w-3 h-3" /> Commercial Terms</span>
                        <button onClick={() => { setStepDir(-1); setStep(2); }} className="text-[9px] text-blue-500 hover:underline font-bold">Edit</button>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-2 gap-2 text-xs">
                        {formIncoterm && <div><span className="text-slate-400">Incoterm:</span> <strong className="font-mono">{formIncoterm}</strong></div>}
                        {formFreightResp && <div><span className="text-slate-400">Freight:</span> <strong>{formFreightResp}</strong></div>}
                        {formPaymentTerms && <div><span className="text-slate-400">Payment:</span> <strong>{formPaymentTerms}</strong></div>}
                        {formMqcVolume !== '' && formMqcPeriod !== 'None' && <div><span className="text-slate-400">MQC:</span> <strong>{formMqcVolume} containers / {formMqcPeriod}</strong></div>}
                        {formIsHazmat && <div><span className="text-slate-400">Hazmat:</span> <strong className="text-red-600">{formHazmatClass || 'Yes'}</strong></div>}
                        {formRequiresGenset && <div><span className="text-slate-400">Genset:</span> <strong>Required</strong></div>}
                        {formDemurrageFreeDays !== '' && <div><span className="text-slate-400">Demurrage:</span> <strong>{formDemurrageFreeDays}d free{formDemurrageFlatRate !== '' ? ` @ ${fmtCurrency(Number(formDemurrageFlatRate))}/d` : ''}</strong></div>}
                        {formDetentionFreeDays !== '' && <div><span className="text-slate-400">Detention:</span> <strong>{formDetentionFreeDays}d free{formDetentionFlatRate !== '' ? ` @ ${fmtCurrency(Number(formDetentionFlatRate))}/d` : ''}</strong></div>}
                        {!formIncoterm && !formFreightResp && !formPaymentTerms && <div className="col-span-2 text-slate-400 italic">No commercial terms set — defaults apply.</div>}
                      </div>
                    </div>

                    {/* Section 3 summary */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Routes &amp; Rates</span>
                        <button onClick={() => { setStepDir(-1); setStep(3); }} className="text-[9px] text-blue-500 hover:underline font-bold">Edit</button>
                      </div>
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50/60">
                          <tr className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-4 py-2 text-left">Container</th>
                            <th className="px-4 py-2 text-right">Base</th>
                            <th className="px-4 py-2 text-right">Return</th>
                            <th className="px-4 py-2 text-center">ROT</th>
                            <th className="px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formRateItems.map(item => {
                            const ct = containerTypes.find(c => c.id === item.containerTypeId);
                            const base = Number(item.baseRate) || 0;
                            const ret = Number(item.returnLegRate) || 0;
                            const fafRule = formSurcharges.find(s => s.surchargeCode === 'FAF' && s.enabled);
                            const faf = fafRule && base > 0 ? Math.round(base * fafRule.amount / 100) : 0;
                            const rot = SCENARIO_ROT[formScenario] === 'yes' ? true : SCENARIO_ROT[formScenario] === 'no' ? false : formEmtyRot;
                            return (
                              <tr key={item.id}>
                                <td className="px-4 py-2 font-mono font-bold">{ct?.code ?? '—'}</td>
                                <td className="px-4 py-2 text-right">{fmtCurrency(base)}</td>
                                <td className="px-4 py-2 text-right">{ret ? fmtCurrency(ret) : '—'}</td>
                                <td className="px-4 py-2 text-center">{rot ? <Check className="w-3 h-3 text-green-600 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                                <td className="px-4 py-2 text-right font-bold text-blue-700">{fmtCurrency(base + ret + faf)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="border-t border-slate-200 bg-slate-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-right text-xs font-bold text-slate-600">Total:</td>
                            <td className="px-4 py-2 text-right font-black text-blue-800">
                              {fmtCurrency(formRateItems.reduce((s, item) => {
                                const base = Number(item.baseRate) || 0;
                                const ret = Number(item.returnLegRate) || 0;
                                const fafRule = formSurcharges.find(x => x.surchargeCode === 'FAF' && x.enabled);
                                return s + base + ret + (fafRule && base > 0 ? Math.round(base * fafRule.amount / 100) : 0);
                              }, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Internal Notes</label>
                        <textarea rows={3} value={formInternalNotes} onChange={e => setFormInternalNotes(e.target.value)}
                          placeholder="Not visible to customer..."
                          className="w-full text-xs border border-slate-200 rounded p-2.5 resize-none focus:outline-none focus:border-blue-400 bg-slate-50" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Customer-Facing Notes <span className="text-blue-500">(printed on PDF)</span></label>
                        <textarea rows={3} value={formCustomerNotes} onChange={e => setFormCustomerNotes(e.target.value)}
                          placeholder="Visible to customer..."
                          className="w-full text-xs border border-blue-200 rounded p-2.5 resize-none focus:outline-none focus:border-blue-400 bg-blue-50/30" />
                      </div>
                    </div>

                    {/* Save buttons */}
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => handleSave('draft')}
                        className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded transition">
                        Save as Draft
                      </button>
                      {isManager && (
                        <button onClick={() => {
                          const err = validateStep(1) ?? validateStep(3);
                          if (err) { showToast(err, 'error'); return; }
                          const regionId = currentUser.regionId || 'IN';
                          const fafToggle = formSurcharges.find(s => s.surchargeCode === 'FAF' && s.enabled);
                          const rateItems: QuotationRateItem[] = formRateItems.map(item => {
                            const ct = containerTypes.find(c => c.id === item.containerTypeId);
                            const base = Number(item.baseRate) || 0;
                            const ret = Number(item.returnLegRate) || 0;
                            const faf = fafToggle ? Math.round(base * fafToggle.amount / 100) : 0;
                            const rot = SCENARIO_ROT[formScenario] === 'yes' ? true : SCENARIO_ROT[formScenario] === 'no' ? false : formEmtyRot;
                            return { id: item.id, containerType: ct?.code ?? '', containerTypeId: item.containerTypeId, containerSize: ct?.code, originZoneId: item.useZone ? item.originZoneId : undefined, destinationZoneId: item.useZone ? item.destinationZoneId : undefined, originLocationId: !item.useZone ? item.originLocationId : undefined, destinationLocationId: !item.useZone ? item.destinationLocationId : undefined, baseRate: base, currency: 'INR', returnLegRate: ret, estimatedFuelSurcharge: faf, applicableSurcharges: formSurcharges.filter(s => s.enabled).map(s => ({ surchargeCode: s.surchargeCode, surchargeName: s.surchargeName, amount: s.amount, calculationMethod: s.calculationMethod, isIncluded: s.isIncluded })), totalEstimatedValue: base + ret + faf, rotRequired: rot, notes: '' };
                          });
                          const quoteNo = generateQuoteNo(regionId);
                          const q: Quotation = { id: `quote-${Date.now()}`, quoteNo, regionId, customerId: formCustomerId, scenario: formScenario, status: 'confirmed', validFrom: formValidFrom, validTo: formValidTo, rateItems, totalValue: rateItems.reduce((s, r) => s + (r.totalEstimatedValue ?? 0), 0), currency: 'INR', internalNotes: formInternalNotes, customerNotes: formCustomerNotes, createdBy: currentUser.id, confirmedBy: currentUser.id, confirmedAt: new Date().toISOString(), clonedFromId: clonedFromId ?? undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), paymentTermsOverride: formPaymentTerms || undefined, incoterm: formIncoterm || undefined, freightResponsibility: formFreightResp || undefined, mqcVolume: formMqcVolume !== '' ? Number(formMqcVolume) : undefined, mqcPeriod: formMqcPeriod !== 'None' ? formMqcPeriod : undefined, isHazmatOnly: formIsHazmat || undefined, hazmatClass: formHazmatClass || undefined, requiresGenset: formRequiresGenset || undefined, demurrageFreeDays: formDemurrageFreeDays !== '' ? Number(formDemurrageFreeDays) : undefined, demurrageFlatRate: formDemurrageFlatRate !== '' ? Number(formDemurrageFlatRate) : undefined, detentionFreeDays: formDetentionFreeDays !== '' ? Number(formDetentionFreeDays) : undefined, detentionFlatRate: formDetentionFlatRate !== '' ? Number(formDetentionFlatRate) : undefined };
                          onAddQuotation(q);
                          onIncrementQuoteSequence(regionId);
                          showToast(`${quoteNo} saved and confirmed ✓`);
                          setSelectedQuoteId(q.id);
                          setRightView('detail');
                        }}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded transition flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Save &amp; Confirm
                        </button>
                      )}
                      <button onClick={() => handleSave('pending_approval')}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition">
                        Save &amp; Submit for Approval
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wizard footer nav */}
            <div className="shrink-0 px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
              <button
                onClick={() => {
                  if (step === 1) { setRightView(selectedQuoteId ? 'detail' : 'empty'); return; }
                  goBack();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm font-bold transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {step === 1 ? 'Cancel' : 'Back'}
              </button>
              <span className="text-[11px] text-slate-400">{step} of 4</span>
              {step < 4 && (
                <button onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === 4 && <div />}
            </div>
          </div>
        )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl z-50 flex items-center gap-2 ${toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-white" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

