/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Tenant, 
  Customer, 
  LocationGeo, 
  Vehicle, 
  Driver, 
  Quotation, 
  Job, 
  ROT, 
  ConsignmentNote, 
  Invoice,
  Zone,
  ZoneType,
  User,
  SmtpConfig,
  EmailTemplate,
  WorkflowMilestoneConfig,
  PaymentRecord,
  CustomerPayment,
  VendorPayment,
  TariffRate,
  ScenarioType,
  SurchargeRule,
  MilestoneStep,
  Region,
  Country,
  ShippingLine,
  Vessel,
  Vendor,
  ContainerType,
  InvoiceSettings,
  SupportedLanguage,
  TranslationEntry,
  MasterTranslation,
  AuthSession
} from './types';
import { 
  MOCK_TENANTS, 
  INITIAL_CUSTOMERS, 
  MOCK_LOCATIONS, 
  DEFAULT_VEHICLES, 
  DEFAULT_DRIVERS, 
  INITIAL_QUOTATIONS, 
  INITIAL_JOBS, 
  INITIAL_ROTS, 
  INITIAL_CONS_NOTES,
  createMilestonesForScenario,
  DEFAULT_ZONES,
  DEFAULT_ZONE_TYPES,
  INITIAL_USERS,
  INITIAL_SMTP_CONFIG,
  INITIAL_EMAIL_TEMPLATES,
  BASE_TARIFFS,
  SURCHARGE_CATALOG,
  INITIAL_REGIONS,
  INITIAL_COUNTRIES,
  INITIAL_SHIPPING_LINES,
  INITIAL_VESSELS,
  INITIAL_VENDORS,
  INITIAL_CONTAINER_TYPES,
  INITIAL_INVOICE_SETTINGS,
  INITIAL_SUPPORTED_LANGUAGES,
  INITIAL_TRANSLATIONS,
  INITIAL_CUSTOMER_PAYMENTS,
  INITIAL_VENDOR_PAYMENTS
} from './data';

// Components
import OverviewDashboard from './components/OverviewDashboard';
import QuotationWizard from './components/QuotationWizard';
import JobBooker from './components/JobBooker';
import DispatchConsole from './components/DispatchConsole';
import ScheduleBuilder from './components/ScheduleBuilder';
import GanttChart from './components/GanttChart';
import LiveTrackingMap from './components/LiveTrackingMap';
import DriverMilestoneApp from './components/DriverMilestoneApp';
import CustomerMaster from './components/CustomerMaster';
import BillingInvoiceConsole from './components/BillingInvoiceConsole';
import ContainerLifecycle from './components/ContainerLifecycle';
import FleetMaster from './components/FleetMaster';
import DriverMaster from './components/DriverMaster';
import LocationZoneMaster from './components/LocationZoneMaster';
import RateCardManager from './components/RateCardManager';
import WorkflowStatusManager from './components/WorkflowStatusManager';
import PaymentsConsole from './components/PaymentsConsole';
import AdministrationConsole from './components/AdministrationConsole';

// New standalone views
import ROTMaster from './components/ROTMaster';
import ConsignmentNoteMaster from './components/ConsignmentNoteMaster';
import TripsMaster from './components/TripsMaster';
import SurchargeEngine from './components/SurchargeEngine';
import RegionMaster from './components/RegionMaster';
import SupportMasters from './components/SupportMasters';

// Auth & onboarding
import LoginPage from './components/LoginPage';
import SetPasswordPage from './components/SetPasswordPage';
import OnboardingWizard from './components/OnboardingWizard';
import SetupChecklist from './components/SetupChecklist';

// Icons
import { 
  Settings, 
  AlertTriangle,
  X,
  ShieldCheck, 
  Users, 
  Truck, 
  Navigation, 
  MapPin, 
  Layers, 
  DollarSign, 
  Globe, 
  Calendar, 
  Smartphone, 
  Award,
  BookOpen,
  Receipt,
  LogOut,
  Sliders,
  ChevronDown,
  Building,
  Flame,
  FileSpreadsheet,
  Package,
  LayoutDashboard,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function filterByRegion<T>(
  data: T[], 
  user: User,
  activeRegionFilter: string = "ALL"
): T[] {
  if (user.regionAccess?.includes("ALL")) {
    if (activeRegionFilter === "ALL") return data;
    return data.filter((item: any) => item.regionId === activeRegionFilter);
  }
  return data.filter((item: any) => item.regionId === user.regionId);
}

export default function App() {
  // SaaS Multi-tenancy Subdomain State
  const [activeTenant, setActiveTenant] = useState<Tenant>(MOCK_TENANTS[0]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previewDriverId, setPreviewDriverId] = useState<string>('');
  
  // Isolated Tenant Database States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rots, setRots] = useState<ROT[]>([]);
  const [consignmentNotes, setConsignmentNotes] = useState<ConsignmentNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings[]>(INITIAL_INVOICE_SETTINGS);
  const [drivers, setDrivers] = useState<Driver[]>(DEFAULT_DRIVERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);

  // New States for Administration, Location/Zone, Rate configs
  const [locations, setLocations] = useState<LocationGeo[]>(MOCK_LOCATIONS);
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  const [regions, setRegions] = useState<Region[]>(INITIAL_REGIONS);
  const [countries, setCountries] = useState<Country[]>(INITIAL_COUNTRIES);
  const [zoneTypes, setZoneTypes] = useState<ZoneType[]>(DEFAULT_ZONE_TYPES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // ── Auth session (per tenant, persisted in localStorage) ──
  const [session, setSession] = useState<AuthSession | null>(null);
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null);
  const [bannerTick, setBannerTick] = useState(0);

  // currentUser is DERIVED from the session — falls back only for type
  // safety in computations; render gates below prevent unauthenticated use.
  const sessionUser = users.find(u => u.id === session?.userId) ?? null;
  const currentUser: User = sessionUser ?? INITIAL_USERS[0];
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(INITIAL_SMTP_CONFIG);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(INITIAL_EMAIL_TEMPLATES);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tariffs, setTariffs] = useState<TariffRate[]>(BASE_TARIFFS);

  // Milestone scenario configs
  const [workflowConfigs, setWorkflowConfigs] = useState<WorkflowMilestoneConfig[]>([]);
  const [surcharges, setSurcharges] = useState<SurchargeRule[]>([]);
  
  // Support Masters states
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>(INITIAL_SHIPPING_LINES);
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>(INITIAL_CONTAINER_TYPES);
  
  // Translation management system states
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>(INITIAL_SUPPORTED_LANGUAGES);
  const [translations, setTranslations] = useState<TranslationEntry[]>(INITIAL_TRANSLATIONS);
  const [masterTranslations, setMasterTranslations] = useState<MasterTranslation[]>([]);
  
  // Job number sequence
  const [jobSequence, setJobSequence] = useState<number>(1004);

  // Payments state
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(INITIAL_CUSTOMER_PAYMENTS);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>(INITIAL_VENDOR_PAYMENTS);
  const [receiptSequence, setReceiptSequence] = useState<Record<string, number>>({ IN: 3, AE: 0 });
  const [adviceSequence, setAdviceSequence] = useState<Record<string, number>>({ IN: 2, AE: 0 });

  // Region filter state
  const [activeRegionFilter, setActiveRegionFilter] = useState<string | "ALL">("ALL");

  // Derived filtered variables
  const filteredCustomers = filterByRegion<Customer>(customers, currentUser, activeRegionFilter);
  const filteredVehicles = filterByRegion<Vehicle>(vehicles, currentUser, activeRegionFilter);
  const filteredDrivers = filterByRegion<Driver>(drivers, currentUser, activeRegionFilter);
  const filteredLocations = filterByRegion<LocationGeo>(locations, currentUser, activeRegionFilter);
  const filteredZones = filterByRegion<Zone>(zones, currentUser, activeRegionFilter);
  const filteredQuotations = filterByRegion<Quotation>(quotations, currentUser, activeRegionFilter);
  const filteredJobs = filterByRegion<Job>(jobs, currentUser, activeRegionFilter);
  const filteredRots = filterByRegion<ROT>(rots, currentUser, activeRegionFilter);
  const filteredConsignmentNotes = filterByRegion<ConsignmentNote>(consignmentNotes, currentUser, activeRegionFilter);
  const filteredInvoices = filterByRegion<Invoice>(invoices, currentUser, activeRegionFilter);
  const filteredTariffs = filterByRegion<TariffRate>(tariffs, currentUser, activeRegionFilter);
  const filteredSurcharges = filterByRegion<SurchargeRule>(surcharges, currentUser, activeRegionFilter);
  const filteredShippingLines = filterByRegion<ShippingLine>(shippingLines, currentUser, activeRegionFilter);
  const filteredVendors = filterByRegion<Vendor>(vendors, currentUser, activeRegionFilter);

  // Prefilled context for converting quotation directly to booking
  const [prefilledBookingContext, setPrefilledBookingContext] = useState<{
    customerId: string;
    quoteId: string;
    rateItemId?: string;
  } | null>(null);

  // Quote Sequence Tracker (per-region)
  const [quoteSequence, setQuoteSequence] = useState<Record<string, number>>({ IN: 3, AE: 0 });
  const handleIncrementQuoteSequence = (regionId: string) => {
    setQuoteSequence(prev => ({ ...prev, [regionId]: (prev[regionId] ?? 0) + 1 }));
  };

  // Expiry check logic
  const checkQuotationExpiry = (quotes: Quotation[]) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = quotes.map(q => {
      if ((q.status === 'draft' || q.status === 'pending_approval') && q.offerValidUntil && q.offerValidUntil < today) {
        return { ...q, status: 'expired' as const };
      }
      if (q.status === 'confirmed' && q.validTo < today) {
        return { ...q, status: 'expired' as const };
      }
      return q;
    });
    if (JSON.stringify(updated) !== JSON.stringify(quotes)) {
      setQuotations(updated);
      handleSaveTenantState('quotations', updated);
    }
  };

  useEffect(() => {
    checkQuotationExpiry(quotations);
  }, [quotations]);


  // Dynamic tenant loader simulating database-per-tenant isolation
  useEffect(() => {
    const keyPrefix = `hms_db_${activeTenant.subdomain}`;
    
    // Load customer data
    const localCust = localStorage.getItem(`${keyPrefix}_customers`);
    if (localCust) {
      setCustomers(JSON.parse(localCust));
    } else {
      setCustomers(INITIAL_CUSTOMERS);
    }

    // Load quotations
    const localQuote = localStorage.getItem(`${keyPrefix}_quotations`);
    if (localQuote) {
      setQuotations(JSON.parse(localQuote));
    } else {
      setQuotations(INITIAL_QUOTATIONS);
    }

    // Load jobs
    const localJobs = localStorage.getItem(`${keyPrefix}_jobs`);
    if (localJobs) {
      setJobs(JSON.parse(localJobs));
    } else {
      setJobs(INITIAL_JOBS);
    }

    // Load rots
    const localRots = localStorage.getItem(`${keyPrefix}_rots`);
    if (localRots) {
      setRots(JSON.parse(localRots));
    } else {
      setRots(INITIAL_ROTS);
    }

    // Load Consignment Notes
    const localCNs = localStorage.getItem(`${keyPrefix}_cns`);
    if (localCNs) {
      setConsignmentNotes(JSON.parse(localCNs));
    } else {
      setConsignmentNotes(INITIAL_CONS_NOTES);
    }

    // Load Invoices
    const localInv = localStorage.getItem(`${keyPrefix}_invoices`);
    if (localInv) {
      setInvoices(JSON.parse(localInv));
    } else {
      setInvoices([]);
    }

    const localInvSettings = localStorage.getItem(`${keyPrefix}_invoicesettings`);
    if (localInvSettings) {
      setInvoiceSettings(JSON.parse(localInvSettings));
    } else {
      setInvoiceSettings(INITIAL_INVOICE_SETTINGS);
    }

    // Load Drivers
    const localDrivers = localStorage.getItem(`${keyPrefix}_drivers`);
    if (localDrivers) {
      setDrivers(JSON.parse(localDrivers));
    } else {
      setDrivers(DEFAULT_DRIVERS);
    }

    // Load Vehicles
    const localVeh = localStorage.getItem(`${keyPrefix}_vehicles`);
    if (localVeh) {
      setVehicles(JSON.parse(localVeh));
    } else {
      setVehicles(DEFAULT_VEHICLES);
    }

    // Load Locations
    const localLocs = localStorage.getItem(`${keyPrefix}_locations`);
    if (localLocs) {
      setLocations(JSON.parse(localLocs));
    } else {
      setLocations(MOCK_LOCATIONS);
    }

    // Load Zones
    const localZones = localStorage.getItem(`${keyPrefix}_zones`);
    if (localZones) {
      setZones(JSON.parse(localZones));
    } else {
      setZones(DEFAULT_ZONES);
    }

    // Load Regions
    const localRegions = localStorage.getItem(`${keyPrefix}_regions`);
    if (localRegions) {
      setRegions(JSON.parse(localRegions));
    } else {
      setRegions(INITIAL_REGIONS);
    }

    // Load Countries
    const localCountries = localStorage.getItem(`${keyPrefix}_countries`);
    if (localCountries) {
      setCountries(JSON.parse(localCountries));
    } else {
      setCountries(INITIAL_COUNTRIES);
    }

    // Load Zone Types
    const localZt = localStorage.getItem(`${keyPrefix}_zonetypes`);
    if (localZt) {
      setZoneTypes(JSON.parse(localZt));
    } else {
      setZoneTypes(DEFAULT_ZONE_TYPES);
    }

    // Load Users
    const localUsrs = localStorage.getItem(`${keyPrefix}_users`);
    if (localUsrs) {
      setUsers(JSON.parse(localUsrs));
    } else {
      setUsers(INITIAL_USERS);
    }

    // Load auth session for this tenant (sessions are per-tenant)
    const rawSession = localStorage.getItem(`${keyPrefix}_session`);
    setSession(rawSession ? JSON.parse(rawSession) : null);

    // Load pending invite (simulated invite link)
    setPendingInviteToken(localStorage.getItem(`${keyPrefix}_pendingInvite`));

    // Load persisted tenant profile/onboarding overrides
    const localTenant = localStorage.getItem(`${keyPrefix}_tenant`);
    if (localTenant) {
      const parsedTenant = JSON.parse(localTenant);
      if (JSON.stringify(parsedTenant) !== JSON.stringify(activeTenant)) {
        setActiveTenant(parsedTenant);
      }
    }

    // Load SMTP
    const localSmtp = localStorage.getItem(`${keyPrefix}_smtpconfig`);
    if (localSmtp) {
      setSmtpConfig(JSON.parse(localSmtp));
    } else {
      setSmtpConfig(INITIAL_SMTP_CONFIG);
    }

    // Load Templates
    const localTpls = localStorage.getItem(`${keyPrefix}_emailtemplates`);
    if (localTpls) {
      setEmailTemplates(JSON.parse(localTpls));
    } else {
      setEmailTemplates(INITIAL_EMAIL_TEMPLATES);
    }

    // Load Payments
    const localPayments = localStorage.getItem(`${keyPrefix}_payments`);
    if (localPayments) {
      setPayments(JSON.parse(localPayments));
    } else {
      setPayments([]);
    }

    // Load CustomerPayments
    const localCp = localStorage.getItem(`${keyPrefix}_customerpayments`);
    setCustomerPayments(localCp ? JSON.parse(localCp) : INITIAL_CUSTOMER_PAYMENTS);

    // Load VendorPayments
    const localVp = localStorage.getItem(`${keyPrefix}_vendorpayments`);
    setVendorPayments(localVp ? JSON.parse(localVp) : INITIAL_VENDOR_PAYMENTS);

    // Load Tariffs
    const localTariffs = localStorage.getItem(`${keyPrefix}_tariffs`);
    if (localTariffs) {
      setTariffs(JSON.parse(localTariffs));
    } else {
      setTariffs(BASE_TARIFFS);
    }

    // Load Workflows
    const localWf = localStorage.getItem(`${keyPrefix}_workflowconfigs`);
    if (localWf) {
      setWorkflowConfigs(JSON.parse(localWf));
    } else {
      const defaults = (['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'] as ScenarioType[]).map(sc => ({
        scenario: sc,
        steps: createMilestonesForScenario(sc).map(st => ({
          id: st.id,
          label: st.label,
          description: st.description,
          requiresEvidence: st.requiresEvidence
        }))
      }));
      setWorkflowConfigs(defaults);
    }

    // Load Surcharges
    const localSurcharges = localStorage.getItem(`${keyPrefix}_surcharges`);
    if (localSurcharges) {
      setSurcharges(JSON.parse(localSurcharges));
    } else {
      setSurcharges(SURCHARGE_CATALOG);
    }

    // Load Support Masters
    const localShippingLines = localStorage.getItem(`${keyPrefix}_shippinglines`);
    if (localShippingLines) {
      setShippingLines(JSON.parse(localShippingLines));
    } else {
      setShippingLines(INITIAL_SHIPPING_LINES);
    }

    const localVessels = localStorage.getItem(`${keyPrefix}_vessels`);
    if (localVessels) {
      setVessels(JSON.parse(localVessels));
    } else {
      setVessels(INITIAL_VESSELS);
    }

    const localVendors = localStorage.getItem(`${keyPrefix}_vendors`);
    if (localVendors) {
      setVendors(JSON.parse(localVendors));
    } else {
      setVendors(INITIAL_VENDORS);
    }

    const localContainerTypes = localStorage.getItem(`${keyPrefix}_containertypes`);
    if (localContainerTypes) {
      setContainerTypes(JSON.parse(localContainerTypes));
    } else {
      setContainerTypes(INITIAL_CONTAINER_TYPES);
    }

    // Load supported languages
    const localLangs = localStorage.getItem(`${keyPrefix}_supported_languages`);
    if (localLangs) {
      setSupportedLanguages(JSON.parse(localLangs));
    } else {
      setSupportedLanguages(INITIAL_SUPPORTED_LANGUAGES);
    }

    // Load translations
    const localTranslations = localStorage.getItem(`${keyPrefix}_translations`);
    if (localTranslations) {
      setTranslations(JSON.parse(localTranslations));
    } else {
      setTranslations(INITIAL_TRANSLATIONS);
    }

    // Load master record translations
    const localMasterTranslations = localStorage.getItem(`${keyPrefix}_master_translations`);
    if (localMasterTranslations) {
      setMasterTranslations(JSON.parse(localMasterTranslations));
    } else {
      setMasterTranslations([]);
    }

  }, [activeTenant]);

  // Persistance helper
  const handleSaveTenantState = (type: string, data: any) => {
    const keyPrefix = `hms_db_${activeTenant.subdomain}`;
    localStorage.setItem(`${keyPrefix}_${type}`, JSON.stringify(data));
  };

  // ── Auth handlers (MOCK) ─────────────────────────────────────
  const tenantKey = `hms_db_${activeTenant.subdomain}`;

  const handleUpdateTenant = (updatedTenant: Tenant) => {
    setActiveTenant(updatedTenant);
    localStorage.setItem(`hms_db_${updatedTenant.subdomain}_tenant`, JSON.stringify(updatedTenant));
    const updatedTenants = MOCK_TENANTS.map(t => t.id === updatedTenant.id ? updatedTenant : t);
    MOCK_TENANTS.length = 0;
    MOCK_TENANTS.push(...updatedTenants);
  };

  const handleLogin = (user: User) => {
    const stamped = { ...user, lastLoginAt: new Date().toISOString() };
    const updatedUsers = users.map(u => u.id === user.id ? stamped : u);
    setUsers(updatedUsers);
    handleSaveTenantState('users', updatedUsers);
    const newSession: AuthSession = { userId: user.id, tenantId: activeTenant.id, loginAt: new Date().toISOString() };
    localStorage.setItem(`${tenantKey}_session`, JSON.stringify(newSession));
    setSession(newSession);
  };

  const handleLogout = () => {
    localStorage.removeItem(`${tenantKey}_session`);
    setSession(null);
  };

  // Demo convenience: logout + login-as in one click
  const handleDemoLoginAs = (user: User) => {
    handleLogin(user);
  };

  const handleCopyInviteLink = (user: User) => {
    if (!user.inviteToken) return;
    localStorage.setItem(`${tenantKey}_pendingInvite`, user.inviteToken);
    setPendingInviteToken(user.inviteToken);
    const fakeUrl = `https://${activeTenant.subdomain}.hms-saas.com/invite/${user.inviteToken}`;
    try { navigator.clipboard?.writeText(fakeUrl); } catch { /* clipboard unavailable */ }
    alert(`Invite link copied (demo):
${fakeUrl}

Log out to open the activation page in this browser.`);
  };

  const handleActivateInvite = (userId: string, password: string) => {
    const updatedUsers = users.map(u =>
      u.id === userId
        ? { ...u, passwordHash: password, status: 'active' as const, inviteToken: undefined, inviteExpiresAt: undefined, mustChangePassword: false }
        : u
    );
    setUsers(updatedUsers);
    handleSaveTenantState('users', updatedUsers);
    localStorage.removeItem(`${tenantKey}_pendingInvite`);
    setPendingInviteToken(null);
    const activated = updatedUsers.find(u => u.id === userId);
    if (activated) handleLogin(activated);
  };

  const handleResendInvite = (user: User) => {
    const updatedUsers = users.map(u =>
      u.id === user.id
        ? { ...u, inviteToken: `inv-${Math.random().toString(36).slice(2, 10)}`, inviteExpiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString() }
        : u
    );
    setUsers(updatedUsers);
    handleSaveTenantState('users', updatedUsers);
    alert('Invite resent ✓');
  };

  // State manipulation handlers
  const handleAddSurcharge = (rule: SurchargeRule) => {
    const updated = [...surcharges, rule];
    setSurcharges(updated);
    handleSaveTenantState('surcharges', updated);
  };

  const handleUpdateSurcharge = (rule: SurchargeRule) => {
    const updated = surcharges.map(s => 
      s.code === rule.code ? rule : s
    );
    setSurcharges(updated);
    handleSaveTenantState('surcharges', updated);
  };

  const handleDeleteSurcharge = (code: string) => {
    const updated = surcharges.filter(s => s.code !== code);
    setSurcharges(updated);
    handleSaveTenantState('surcharges', updated);
  };

  // Translation Management System Handlers
  const handleUpdateLanguage = (lang: SupportedLanguage) => {
    const exists = supportedLanguages.some(l => l.id === lang.id || l.code === lang.code);
    let updated;
    if (exists) {
      updated = supportedLanguages.map(l => (l.id === lang.id || l.code === lang.code) ? lang : l);
    } else {
      updated = [...supportedLanguages, lang];
    }
    setSupportedLanguages(updated);
    handleSaveTenantState('supported_languages', updated);
  };

  const handleAddTranslation = (entry: TranslationEntry) => {
    const updated = [...translations, entry];
    setTranslations(updated);
    handleSaveTenantState('translations', updated);
  };

  const handleUpdateTranslation = (entry: TranslationEntry) => {
    const updated = translations.map(t => t.id === entry.id ? entry : t);
    setTranslations(updated);
    handleSaveTenantState('translations', updated);
  };

  const handleAddMasterTranslation = (entry: MasterTranslation) => {
    const updated = [...masterTranslations, entry];
    setMasterTranslations(updated);
    handleSaveTenantState('master_translations', updated);
  };

  const handleUpdateMasterTranslation = (entry: MasterTranslation) => {
    const updated = masterTranslations.map(t => t.id === entry.id ? entry : t);
    setMasterTranslations(updated);
    handleSaveTenantState('master_translations', updated);
  };

  // Support Masters Handlers
  const handleAddShippingLine = (line: ShippingLine) => {
    const updated = [...shippingLines, line];
    setShippingLines(updated);
    handleSaveTenantState('shippinglines', updated);
  };

  const handleUpdateShippingLine = (line: ShippingLine) => {
    const updated = shippingLines.map(l => l.id === line.id ? line : l);
    setShippingLines(updated);
    handleSaveTenantState('shippinglines', updated);
  };

  const handleDeleteShippingLine = (id: string) => {
    const updated = shippingLines.filter(l => l.id !== id);
    setShippingLines(updated);
    handleSaveTenantState('shippinglines', updated);
  };

  const handleAddVessel = (vess: Vessel) => {
    const updated = [...vessels, vess];
    setVessels(updated);
    handleSaveTenantState('vessels', updated);
  };

  const handleUpdateVessel = (vess: Vessel) => {
    const updated = vessels.map(v => v.id === vess.id ? vess : v);
    setVessels(updated);
    handleSaveTenantState('vessels', updated);
  };

  const handleDeleteVessel = (id: string) => {
    const updated = vessels.filter(v => v.id !== id);
    setVessels(updated);
    handleSaveTenantState('vessels', updated);
  };

  const handleAddVendor = (vend: Vendor) => {
    const updated = [...vendors, vend];
    setVendors(updated);
    handleSaveTenantState('vendors', updated);
  };

  const handleUpdateVendor = (vend: Vendor) => {
    const updated = vendors.map(v => v.id === vend.id ? vend : v);
    setVendors(updated);
    handleSaveTenantState('vendors', updated);
  };

  const handleDeleteVendor = (id: string) => {
    const updated = vendors.filter(v => v.id !== id);
    setVendors(updated);
    handleSaveTenantState('vendors', updated);
  };

  const handleAddContainerType = (ct: ContainerType) => {
    const updated = [...containerTypes, ct];
    setContainerTypes(updated);
    handleSaveTenantState('containertypes', updated);
  };

  const handleUpdateContainerType = (ct: ContainerType) => {
    const updated = containerTypes.map(c => c.id === ct.id ? ct : c);
    setContainerTypes(updated);
    handleSaveTenantState('containertypes', updated);
  };

  const handleDeleteContainerType = (id: string) => {
    const updated = containerTypes.filter(c => c.id !== id);
    setContainerTypes(updated);
    handleSaveTenantState('containertypes', updated);
  };

  const handleAddCustomer = (c: Customer) => {
    const enriched = { ...c, regionId: currentUser.regionId || 'IN' };
    const updated = [enriched, ...customers];
    setCustomers(updated);
    handleSaveTenantState('customers', updated);
  };

  const handleUpdateCustomer = (c: Customer) => {
    const updated = customers.map(cust => cust.id === c.id ? c : cust);
    setCustomers(updated);
    handleSaveTenantState('customers', updated);
  };

  const handleAddRegion = (reg: Region) => {
    const updated = [reg, ...regions];
    setRegions(updated);
    handleSaveTenantState('regions', updated);
  };

  const handleUpdateRegion = (reg: Region) => {
    const updated = regions.map(r => r.id === reg.id ? reg : r);
    setRegions(updated);
    handleSaveTenantState('regions', updated);
  };

  const handleDeleteRegion = (id: string) => {
    const updated = regions.filter(r => r.id !== id);
    setRegions(updated);
    handleSaveTenantState('regions', updated);
  };

  const handleAddQuotation = (q: Quotation) => {
    const enriched = { ...q, regionId: currentUser.regionId || 'IN' };
    const updated = [enriched, ...quotations];
    setQuotations(updated);
    handleSaveTenantState('quotations', updated);
  };

  const handleUpdateQuotation = (q: Quotation) => {
    const updated = quotations.map(qx => qx.id === q.id ? q : qx);
    setQuotations(updated);
    handleSaveTenantState('quotations', updated);
  };

  const handleConfirmQuotation = (quoteId: string) => {
    const updated = quotations.map(q => q.id === quoteId ? { ...q, status: 'confirmed' as const } : q);
    setQuotations(updated);
    handleSaveTenantState('quotations', updated);
  };

  const handleGenerateJobNo = (): string => {
    const year = new Date().getFullYear();
    const seq = jobSequence;
    setJobSequence(prev => prev + 1);
    return `JB-${year}-${seq}`;
  };

  const handleAddJob = (job: Job, rot: ROT, cn: ConsignmentNote) => {
    const linkedQuote = quotations.find(q => q.id === job.quotationId);
    if (linkedQuote && linkedQuote.status !== 'confirmed') {
      alert(`Quotation ${linkedQuote.quoteNo} is not confirmed (status: ${linkedQuote.status}). Please confirm the quotation before creating a booking.`);
      return;
    }
    const userRegId = currentUser.regionId || 'IN';

    const detentionRule = surcharges.find(
      s => s.code === "DET" && 
      (s.applicableShippingLines.length === 0 || 
       s.applicableShippingLines.includes(job.shippingLine))
    );
    const freeTimeDays = detentionRule?.freePeriod ?? 7;

    const enrichedJob = { ...job, regionId: userRegId, freeTimeDays };
    const enrichedRot = { ...rot, regionId: userRegId };
    const enrichedCn = { ...cn, regionId: userRegId };

    const updatedJobs = [enrichedJob, ...jobs];
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);

    const updatedRots = [enrichedRot, ...rots];
    setRots(updatedRots);
    handleSaveTenantState('rots', updatedRots);

    const updatedCns = [enrichedCn, ...consignmentNotes];
    setConsignmentNotes(updatedCns);
    handleSaveTenantState('cns', updatedCns);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    const updatedJobs = jobs.map(j => (j.id === updatedJob.id ? updatedJob : j));
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);
  };

  const handleConfirmRot = (rotId: string, jobId: string) => {
    // Confirm ROT
    const updatedRots = rots.map(r => r.id === rotId ? { ...r, status: 'confirmed' as const, verifiedBy: 'Dispatch Board Coordinator' } : r);
    setRots(updatedRots);
    handleSaveTenantState('rots', updatedRots);

    // Turn Correlated Consignment note to Issued status
    const updatedCns = consignmentNotes.map(cn => cn.jobId === jobId ? { ...cn, status: 'issued' as const } : cn);
    setConsignmentNotes(updatedCns);
    handleSaveTenantState('cns', updatedCns);

    // Update job status to scheduled
    const updatedJobs = jobs.map(j => j.id === jobId ? { ...j, status: 'scheduled' as const } : j);
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);
  };

  const handleAssignJobToDriver = (jobId: string, driverId: string, vehicleId: string, scheduledTime?: string) => {
    // Allocate job details
    const finalScheduledTime = scheduledTime || '2026-05-29 10:00';
    const updatedJobs = jobs.map(j => j.id === jobId ? { 
      ...j, 
      status: 'active' as const, 
      driverId, 
      vehicleId, 
      scheduledTime: finalScheduledTime,
      regionId: currentUser.regionId || 'IN'
    } : j);
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);

    // Update driver status in drivers registry
    const updatedDrivers = drivers.map(d => d.id === driverId ? { ...d, currentStatus: 'in-transit' as const } : d);
    setDrivers(updatedDrivers);
  };

  // Live driver milestone advancement callback (advanced by Bob Johnson)
  const handleUpdateMilestone = (jobId: string, milestoneId: string, evidenceUrl?: string, signatureName?: string) => {
    const jobObj = jobs.find(j => j.id === jobId);
    if (!jobObj) return;

    const milestones = [...jobObj.milestones];
    const currentIndex = jobObj.currentMilestoneIndex;

    // Complete current milestone
    milestones[currentIndex] = {
      ...milestones[currentIndex],
      completed: true,
      timestamp: new Date().toISOString(),
      evidenceUrl,
      signatureName
    };

    // Detention update
    const currentMilestone = milestones[currentIndex];
    let gateOutTimestamp = jobObj.gateOutTimestamp;
    let gateInTimestamp = jobObj.gateInTimestamp;
    let freeTimeExpiry = jobObj.freeTimeExpiry;

    if (currentMilestone.label.includes("Loaded") || currentMilestone.label.includes("Stuffed") || currentMilestone.label.includes("Container Picked") || currentMilestone.label.includes("Gate Out")) {
       gateOutTimestamp = new Date().toISOString();
       if (jobObj.freeTimeDays) {
         const expiry = new Date();
         expiry.setDate(expiry.getDate() + jobObj.freeTimeDays);
         freeTimeExpiry = expiry.toISOString();
       }
    }
    
    if (currentMilestone.label.includes("Gate In") || currentMilestone.label.includes("Returned") || currentMilestone.label.includes("Depot")) {
       if (!jobObj.gateInTimestamp) {
         gateInTimestamp = new Date().toISOString();
       }
    }

    const nextIndex = currentIndex + 1;
    let jobStatus = jobObj.status;
    let completionTime = jobObj.completionTime;

    // Determine state progression
    if (nextIndex >= milestones.length) {
      jobStatus = 'completed';
      completionTime = new Date().toISOString().split('T')[0];
    } else {
      jobStatus = 'active';
    }

    const updatedJobs = jobs.map(j => j.id === jobId ? {
      ...j,
      milestones,
      gateOutTimestamp,
      gateInTimestamp,
      freeTimeExpiry,
      currentMilestoneIndex: nextIndex < milestones.length ? nextIndex : currentIndex,
      status: jobStatus,
      completionTime
    } : j);

    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);

    // If job complete, revert Bob's driver status to idle
    if (jobStatus === 'completed') {
      const updatedDrivers = drivers.map(d => d.id === jobObj.driverId ? { ...d, currentStatus: 'idle' as const } : d);
      setDrivers(updatedDrivers);
    }
  };

  // Direct dispatcher manual milestone updates from Movements control panel
  const handleUpdateJobMilestonesDirect = (jobId: string, updatedMilestones: MilestoneStep[], currentMilestoneIndex: number) => {
    const jobObj = jobs.find(j => j.id === jobId);
    if (!jobObj) return;

    const allCompleted = updatedMilestones.every(m => m.completed);
    let jobStatus = jobObj.status;
    let completionTime = jobObj.completionTime;

    if (allCompleted) {
      jobStatus = 'completed';
      completionTime = new Date().toISOString().split('T')[0];
    } else {
      completionTime = undefined;
      const someCompleted = updatedMilestones.some(m => m.completed);
      if (someCompleted) {
        jobStatus = 'active';
      } else {
        jobStatus = jobObj.driverId ? 'scheduled' as const : 'pending' as const;
      }
    }

    const updatedJobs = jobs.map(j => j.id === jobId ? {
      ...j,
      milestones: updatedMilestones,
      currentMilestoneIndex,
      status: jobStatus,
      completionTime
    } : j);

    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);

    // Coordinate assigned driver container states 
    if (jobObj.driverId) {
      const updatedDrivers = drivers.map(d => {
        if (d.id === jobObj.driverId) {
          return {
            ...d,
            currentStatus: jobStatus === 'completed' ? 'idle' : 'in-transit'
          } as const;
        }
        return d;
      });
      setDrivers(updatedDrivers);
    }
  };

  // Dynamic backhaul triangulation insertion
  const handleTriggerDynamicInsertion = (jobId: string, returnJobId: string) => {
    const parentJob = jobs.find(j => j.id === jobId);
    const backhaulJob = jobs.find(j => j.id === returnJobId);
    if (!parentJob || !backhaulJob) return;

    // Trigger true triangulation: attach return backhaul task directly into current active milestones
    const modifiedMilestones = [...parentJob.milestones];
    
    // Inject return tasks right before completion index!
    const backhaulMilestones = createMilestonesForScenario('RETURN');
    
    // Inject backhaul checkpoints elegantly
    const merged = [
      ...modifiedMilestones.slice(0, 6), // checkpoints prior to completion
      { id: 'm-dyn-0', label: 'Dynamic Back-haul pickup empty', description: 'Reposition empty container HDMU7721839 from customer yard', completed: false, requiresEvidence: true },
      { id: 'm-dyn-1', label: 'Deliver returning box to depot stacks', description: 'Transport empty backhaul directly to Apex container pool', completed: false, requiresEvidence: true },
      ...modifiedMilestones.slice(6) // POD closing checkpoint
    ];

    // Mark backhaul job as dispatched
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          milestones: merged,
          hasDynamicInsertion: true,
          dynamicInsertedJobId: returnJobId
        };
      }
      if (j.id === returnJobId) {
        return {
          ...j,
          status: 'active' as const,
          driverId: parentJob.driverId,
          vehicleId: parentJob.vehicleId
        };
      }
      return j;
    });

    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);
  };

  const handleLogException = (
    jobId: string,
    exceptionType: string,
    notes: string,
    evidenceFlag: boolean
  ) => {
    const updatedJobs = jobs.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        status: "exception" as const,
        exceptionLog: [
          ...(j.exceptionLog ?? []),
          {
            type: exceptionType,
            notes,
            evidenceFlag,
            reportedAt: new Date().toISOString(),
            reportedByDriverId: j.driverId ?? ""
          }
        ]
      };
    });
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);
  };

  const handleUpdateInvoiceSettings = (settings: InvoiceSettings) => {
    const updated = invoiceSettings.map(s => 
      s.regionId === settings.regionId ? settings : s
    );
    setInvoiceSettings(updated);
    handleSaveTenantState('invoicesettings', updated);
  };

  const handleAddInvoice = (inv: Invoice) => {
    const enriched = { ...inv, regionId: inv.regionId || currentUser.regionId || 'IN' };
    const updatedInvoiced = [enriched, ...invoices];
    setInvoices(updatedInvoiced);
    handleSaveTenantState('invoices', updatedInvoiced);

    // Update job billing status to invoiced
    const updatedJobs = jobs.map(j => j.id === inv.jobId ? { ...j, billingStatus: 'invoiced' as const } : j);
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);

    // Sequence incrementing logic:
    const regionSettings = invoiceSettings.find(
      s => s.regionId === enriched.regionId
    );
    if (regionSettings) {
      handleUpdateInvoiceSettings({
        ...regionSettings,
        currentSequence: regionSettings.currentSequence + 1
      });
    }
  };

  const handleUpdateInvoiceStatus = (
    invoiceId: string, 
    status: "draft" | "approved" | "sent" | "paid" | "unpaid" | "overdue" | "cancelled"
  ) => {
    const updated = invoices.map(i => i.id === invoiceId ? { ...i, status } : i);
    setInvoices(updated);
    handleSaveTenantState('invoices', updated);
  };

  const handleAddCustomerPayment = (payment: CustomerPayment) => {
    const updatedPayments = [...customerPayments, payment];
    setCustomerPayments(updatedPayments);
    handleSaveTenantState('customerpayments', updatedPayments);
    // Update linked invoices
    const updatedInvoices = invoices.map(inv => {
      const alloc = payment.allocations.find(a => a.invoiceId === inv.id);
      if (!alloc) return inv;
      const newPaid = (inv.paidAmount ?? 0) + alloc.allocatedAmount;
      const newBalance = inv.totalAmount - newPaid;
      return {
        ...inv,
        paidAmount: newPaid,
        balanceDue: newBalance,
        status: newBalance <= 0 ? 'paid' as const : 'partial' as const,
        paymentIds: [...(inv.paymentIds ?? []), payment.id],
      };
    });
    setInvoices(updatedInvoices);
    handleSaveTenantState('invoices', updatedInvoices);
  };

  const handleAddVendorPayment = (payment: VendorPayment) => {
    const updated = [...vendorPayments, payment];
    setVendorPayments(updated);
    handleSaveTenantState('vendorpayments', updated);
  };

  const handleUpdateVendorPayment = (payment: VendorPayment) => {
    const updated = vendorPayments.map(p => p.id === payment.id ? payment : p);
    setVendorPayments(updated);
    handleSaveTenantState('vendorpayments', updated);
    if (payment.status === 'paid') {
      const updatedJobs = jobs.map(j => {
        const linked = payment.tripIds.some(tid => j.id === tid || j.jobNo === tid);
        if (!linked) return j;
        return { ...j, vendorPaymentId: payment.id, billingStatus: 'paid' as const };
      });
      setJobs(updatedJobs);
      handleSaveTenantState('jobs', updatedJobs);
    }
  };

  const handleTriggerReturnJob = (jobId: string) => {
    // Generate return empty containers
    const sourceJob = jobs.find(j => j.id === jobId);
    if (!sourceJob) return;

    // Simulate empty return job instantly triggered
    const newJob: Job = {
      id: `job-${Date.now()}`,
      regionId: currentUser.regionId || 'IN',
      jobNo: `JB-2026-${Math.round(Math.random() * 9000 + 1000)}`,
      tenantId: 'tenant-1',
      customerId: sourceJob.customerId,
      quotationId: sourceJob.quotationId,
      rateItemId: sourceJob.rateItemId,
      scenario: 'RETURN',
      containerNo: sourceJob.containerNo,
      sealNo: 'RETURN-EMPTY',
      containerSize: sourceJob.containerSize,
      weightKg: 4200, // light empty weight
      shippingLine: sourceJob.shippingLine,
      vesselName: sourceJob.vesselName,
      voyageNo: sourceJob.voyageNo,
      eta: '2026-05-30',
      originLocationId: sourceJob.destinationLocationId,
      destinationLocationId: 'loc-depot-1',
      status: 'pending',
      milestones: createMilestonesForScenario('RETURN'),
      currentMilestoneIndex: 0,
      hasDynamicInsertion: false,
      extraSurchargesIncurred: [],
      createdAt: new Date().toISOString()
    };

    const updatedJobs = [newJob, ...jobs];
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);
    alert('EMPTY CONTAINER RETURN SCHEDULED! Outstanding chassis now listed on Dispatch Console.');
    setActiveTab('dispatch-console');
  };

  // ── Auth render gates ───────────────────────────────────────
  if (pendingInviteToken && !session) {
    return (
      <SetPasswordPage
        tenant={activeTenant}
        invitedUser={users.find(u => u.inviteToken === pendingInviteToken) ?? null}
        onActivate={handleActivateInvite}
        onCancel={() => {
          localStorage.removeItem(`${tenantKey}_pendingInvite`);
          setPendingInviteToken(null);
        }}
      />
    );
  }

  if (!session || !sessionUser) {
    return (
      <LoginPage
        tenant={activeTenant}
        tenants={MOCK_TENANTS}
        users={users}
        onLogin={handleLogin}
        onSwitchTenant={setActiveTenant}
      />
    );
  }

  if (sessionUser.userLevel === 'corporate_admin' && !activeTenant.onboardingComplete) {
    return (
      <OnboardingWizard
        tenant={activeTenant}
        currentUser={sessionUser}
        regions={regions}
        smtpConfig={smtpConfig}
        onUpdateTenant={handleUpdateTenant}
        onAddRegion={handleAddRegion}
        onUpdateSmtpConfig={(cfg) => {
          setSmtpConfig(cfg);
          handleSaveTenantState('smtpconfig', cfg);
        }}
        onAddUser={(usr) => {
          const updated = [...users, usr];
          setUsers(updated);
          handleSaveTenantState('users', updated);
        }}
        onCopyInviteLink={handleCopyInviteLink}
        onLogout={handleLogout}
        onFinish={() => {
          handleUpdateTenant({ ...activeTenant, onboardingComplete: true });
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row relative font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* 1. Subdomain DNS dynamic resolver simulator bar */}
      <div className="absolute top-0 right-0 left-0 bg-slate-900 text-slate-100 border-b border-slate-950 h-10 px-4 md:px-6 flex items-center justify-between text-xs font-mono z-40">
        <div className="flex items-center gap-2 text-slate-300">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline text-slate-400">DYNAMIC tenant RESOLVER:</span>
          <span className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded text-blue-400 font-bold">
            https://{activeTenant.subdomain}.hms-saas.com
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Region Context indicator/switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">REGION:</span>
            {currentUser.regionAccess?.includes("ALL") ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={activeRegionFilter}
                  onChange={(e) => setActiveRegionFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Regions</option>
                  {regions.filter(r => r.isActive).map(r => (
                    <option key={r.code} value={r.code}>{r.code} — {r.name}</option>
                  ))}
                </select>
                {activeRegionFilter === "ALL" ? (
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                    ALL REGIONS
                  </span>
                ) : (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                    {activeRegionFilter}
                  </span>
                )}
              </div>
            ) : (
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold select-none whitespace-nowrap">
                {regions.find(r => r.code === currentUser.regionId) 
                  ? `${regions.find(r => r.code === currentUser.regionId)?.code} — ${regions.find(r => r.code === currentUser.regionId)?.name}`
                  : (currentUser.regionId || "N/A")}
              </span>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden md:inline">TENANT REGION GATEWAY:</span>
            <select
              value={activeTenant.id}
              onChange={(e) => {
                const matched = MOCK_TENANTS.find(t => t.id === e.target.value);
                if (matched) setActiveTenant(matched);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-0.5 text-[11px] font-bold text-blue-400 focus:outline-none cursor-pointer"
            >
              {MOCK_TENANTS.map(t => (
                <option key={t.id} value={t.id}>{t.name} (DB Isolated)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Drawer */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-950 shrink-0 select-none pt-10 flex flex-col justify-between z-30">
        
        <div className="p-5 space-y-6">
          {/* Tenant custom branded logo block */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white font-sans tracking-tight shrink-0 transition"
              style={{ backgroundColor: activeTenant.logoColor }}
            >
              H
            </div>
            <div>
              <div className="font-bold text-white truncate text-sm max-w-[150px]">{activeTenant.name}</div>
              <div className="text-[10px] font-mono text-slate-400">Multi-Tenant SaaS • Isolated</div>
            </div>
          </div>

          {/* Navigation Links inside nested groups */}
          <nav className="space-y-3 overflow-y-auto max-h-[calc(105vh-350px)] pr-1 scrollbar-thin">
            
            {/* GROUP 1 — (no label, top level) */}
            <div className="space-y-1">
              <button
                id="menu-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold transition flex items-center justify-between ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600/25 text-blue-400 border-l-4 border-blue-500' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> Dashboard
                </span>
              </button>
            </div>

            {/* GROUP 2 — MASTERS */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                MASTERS
              </div>
              
              <div className="space-y-0.5 pl-2 text-xs">
                <button
                  id="menu-customers"
                  onClick={() => setActiveTab('customers')}
                  className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                    activeTab === 'customers' 
                      ? 'bg-blue-500/25 text-blue-400' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Customer Master
                </button>

                {currentUser.role !== 'billing' && (
                  <>
                    <button
                      id="menu-fleet-master"
                      onClick={() => setActiveTab('fleet-master')}
                      className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                        activeTab === 'fleet-master' 
                          ? 'bg-blue-500/25 text-blue-400' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-orange-400" /> Fleet Master
                    </button>

                    <button
                      id="menu-driver-master"
                      onClick={() => setActiveTab('driver-master')}
                      className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                        activeTab === 'driver-master' 
                          ? 'bg-blue-500/25 text-blue-400' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" /> Driver Master
                    </button>
                  </>
                )}

                <button
                  id="menu-support-masters"
                  onClick={() => setActiveTab('support-masters')}
                  className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                    activeTab === 'support-masters' 
                      ? 'bg-blue-500/25 text-blue-400' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-400" /> Support Masters
                </button>
              </div>
            </div>

            {/* GROUP 3 — OPERATIONS */}
            {currentUser.role !== 'billing' && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                  OPERATIONS
                </div>

                <div className="space-y-0.5 pl-2 text-xs">
                  <button
                    id="menu-quotations"
                    onClick={() => setActiveTab('pricing')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'pricing' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-yellow-500" /> Quotations
                  </button>

                  <button
                    id="menu-booking"
                    onClick={() => setActiveTab('booking')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'booking' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-green-400" /> Booking
                  </button>

                  <button
                    id="menu-rot-master"
                    onClick={() => setActiveTab('rot-list')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'rot-list' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> Release Order (ROT)
                  </button>

                  <button
                    id="menu-cn-master"
                    onClick={() => setActiveTab('consignment-note')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'consignment-note' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-pink-400" /> Consignment Notes
                  </button>

                  <button
                    id="menu-trips-master"
                    onClick={() => setActiveTab('trips')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'trips' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" /> Trips
                  </button>

                  {/* NEW NAV ITEMS */}
                  <button
                    id="menu-dispatch-console"
                    onClick={() => setActiveTab('dispatch-console')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'dispatch-console' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" /> Dispatch Console
                  </button>

                  <button
                    id="menu-schedule-builder"
                    onClick={() => setActiveTab('schedule-builder')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'schedule-builder' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400" /> Schedule Builder
                  </button>


                  <button
                    id="menu-monitor"
                    onClick={() => setActiveTab('empty-tracker')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'empty-tracker' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-green-500" /> Container Monitor
                  </button>
                </div>
              </div>
            )}

            {/* GROUP 4 — ACCOUNTING */}
            {currentUser.role !== 'dispatcher' && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                  ACCOUNTING
                </div>

                <div className="space-y-0.5 pl-2 text-xs">
                  <button
                    id="menu-rate-cards"
                    onClick={() => setActiveTab('rate-cards')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'rate-cards' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Rate Card Manager
                  </button>

                  <button
                    id="menu-surcharge-engine"
                    onClick={() => setActiveTab('surcharge')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'surcharge' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Surcharge Engine
                  </button>

                  <button
                    id="menu-billing"
                    onClick={() => setActiveTab('billing')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'billing' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-500" /> Invoicing
                  </button>

                  <button
                    id="menu-payments"
                    onClick={() => setActiveTab('payments')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'payments' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-purple-400" /> Payments
                  </button>
                </div>
              </div>
            )}

            {/* GROUP 5 — ADMINISTRATION */}
            {(currentUser.role === 'administrator' || currentUser.role === 'region_admin') && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                  ADMINISTRATION
                </div>

                <div className="space-y-0.5 pl-2 text-xs">
                  <button
                    id="menu-location-zones"
                    onClick={() => setActiveTab('locations-zones')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'locations-zones' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> Locations &amp; Zones
                  </button>

                  <button
                    id="menu-region-master"
                    onClick={() => setActiveTab('region-master')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'region-master' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" /> Region Master
                  </button>

                  <button
                    id="menu-workflows"
                    onClick={() => setActiveTab('workflows')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'workflows' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" /> Workflow Milestones
                  </button>

                  <button
                    id="menu-admin-console"
                    onClick={() => setActiveTab('admin-console')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'admin-console' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400 animate-spin-slow" /> Administration
                  </button>
                </div>
              </div>
            )}

            {/* GROUP 6 — Preview as Driver (admin only) */}
            {(currentUser.role === 'administrator' || currentUser.role === 'region_admin') && (
              <div className="space-y-1 border-t border-slate-800/50 pt-2 font-sans">
                <button
                  id="menu-emulator"
                  onClick={() => setActiveTab('emulator')}
                  className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                     activeTab === 'emulator'
                      ? 'bg-blue-500/25 text-blue-400 border-l-4 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-450 text-blue-400" /> Preview as Driver
                </button>
              </div>
            )}

          </nav>
        </div>

        {/* User session footer: logout + demo user switcher */}
        <div id="sidebar-user-footer" className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate pr-2">
            <div className="font-bold text-white truncate max-w-[140px]">{currentUser.name}</div>
            <div className="text-[10px] font-mono truncate max-w-[140px] uppercase font-bold text-blue-400">{currentUser.role}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                // DEMO convenience: instant logout + login as corporate admin
                const adm = users.find(u => u.role === 'administrator' && u.status !== 'disabled');
                if (adm) {
                  handleDemoLoginAs(adm);
                  alert(`DEMO: switched session to ${adm.name}`);
                }
              }}
              className="text-slate-400 hover:text-white transition p-1 bg-slate-800 hover:bg-slate-700 rounded"
              title="DEMO: Switch User (logout + login-as admin)"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              id="sidebar-logout-btn"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition p-1 bg-slate-800 hover:bg-slate-700 rounded"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* 3. Primary Content Canvas */}
      <main className="flex-1 bg-slate-50 p-6 md:p-8 pt-16 md:pt-16 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, cubicBezier: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'dashboard' && (
              <>
                {/* SMTP-pending banner (dismissible) */}
                {activeTenant.onboardingComplete && activeTenant.onboardingStatus && !activeTenant.onboardingStatus.smtp &&
                  localStorage.getItem(`${tenantKey}_smtp_banner_dismissed`) !== '1' && (
                  <div key={bannerTick} className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-amber-800">
                    <span className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Email setup pending — configure SMTP in
                      <button onClick={() => setActiveTab('admin-console')} className="underline font-bold hover:text-amber-900">Administration</button>
                    </span>
                    <button
                      onClick={() => { localStorage.setItem(`${tenantKey}_smtp_banner_dismissed`, '1'); setBannerTick(t => t + 1); }}
                      className="text-amber-400 hover:text-amber-700 p-0.5"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Guided region setup checklist (live-computed) */}
                <SetupChecklist
                  regions={regions}
                  locations={locations}
                  zones={zones}
                  tariffs={tariffs}
                  surcharges={surcharges}
                  vehicles={vehicles}
                  drivers={drivers}
                  users={users}
                  currentUser={currentUser}
                  tenantKey={tenantKey}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              <OverviewDashboard
                jobs={filteredJobs}
                customers={filteredCustomers}
                drivers={filteredDrivers}
                vehicles={filteredVehicles}
                quotations={filteredQuotations}
                invoices={filteredInvoices}
                surcharges={filteredSurcharges}
                regions={regions}
                activeRegionFilter={activeRegionFilter}
                isCorpAdmin={currentUser.regionAccess?.includes("ALL")}
                activeTenant={activeTenant}
                onNavigate={(tab) => setActiveTab(tab)}
              />
              </>
            )}

            {activeTab === 'rot-list' && (
              <ROTMaster
                rots={filteredRots}
                jobs={filteredJobs}
                customers={filteredCustomers}
                locations={filteredLocations}
                onConfirmRot={handleConfirmRot}
              />
            )}

            {activeTab === 'consignment-note' && (
              <ConsignmentNoteMaster
                consignmentNotes={filteredConsignmentNotes}
                jobs={filteredJobs}
                customers={filteredCustomers}
                locations={filteredLocations}
                translations={translations}
                supportedLanguages={supportedLanguages}
                regions={regions}
                drivers={drivers}
                vehicles={vehicles}
                onUpdateCns={(updated) => {
                  setConsignmentNotes(updated);
                  handleSaveTenantState('cns', updated);
                }}
              />
            )}

            {activeTab === 'trips' && (
              <TripsMaster
                jobs={filteredJobs}
                drivers={filteredDrivers}
                vehicles={filteredVehicles}
                customers={filteredCustomers}
                locations={filteredLocations}
                onAssignJob={handleAssignJobToDriver}
                onUpdateJobMilestones={handleUpdateJobMilestonesDirect}
              />
            )}

            {activeTab === 'surcharge' && (
              <SurchargeEngine
                surcharges={filteredSurcharges}
                regions={regions}
                shippingLines={shippingLines}
                onAddSurcharge={handleAddSurcharge}
                onUpdateSurcharge={handleUpdateSurcharge}
                onDeleteSurcharge={handleDeleteSurcharge}
                supportedLanguages={supportedLanguages}
                masterTranslations={masterTranslations}
                onAddMasterTranslation={handleAddMasterTranslation}
                onUpdateMasterTranslation={handleUpdateMasterTranslation}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerMaster
                customers={filteredCustomers}
                countries={countries}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
              />
            )}

            {activeTab === 'pricing' && (
              <QuotationWizard
                quotations={filteredQuotations}
                customers={filteredCustomers}
                locations={filteredLocations}
                zones={filteredZones}
                vessels={vessels}
                shippingLines={shippingLines}
                containerTypes={containerTypes}
                surcharges={filteredSurcharges}
                tariffs={filteredTariffs}
                regions={regions}
                currentUser={currentUser}
                invoiceSettings={invoiceSettings}
                onAddQuotation={handleAddQuotation}
                onUpdateQuotation={handleUpdateQuotation}
                onConfirmQuotation={handleConfirmQuotation}
                onNavigate={(tab) => setActiveTab(tab)}
                onConvertToBooking={(customerId, quoteId, rateItemId) => {
                  setPrefilledBookingContext({ customerId, quoteId, rateItemId });
                  setActiveTab('booking');
                }}
                quoteSequence={quoteSequence}
                onIncrementQuoteSequence={handleIncrementQuoteSequence}
                jobs={filteredJobs}
              />
            )}

            {activeTab === 'booking' && (
              <JobBooker
                jobs={filteredJobs}
                customers={filteredCustomers}
                quotations={filteredQuotations}
                locations={filteredLocations}
                rots={filteredRots}
                consignmentNotes={filteredConsignmentNotes}
                shippingLines={shippingLines}
                containerTypes={containerTypes}
                vessels={vessels}
                zones={filteredZones}
                surcharges={filteredSurcharges}
                regions={regions}
                currentUser={currentUser}
                jobSequence={jobSequence}
                onGenerateJobNo={handleGenerateJobNo}
                invoiceSettings={invoiceSettings}
                onAddJob={handleAddJob}
                onConfirmRot={handleConfirmRot}
                workflowConfigs={workflowConfigs}
                prefilledBookingContext={prefilledBookingContext}
                onClearPrefilledBookingContext={() => setPrefilledBookingContext(null)}
              />
            )}

            {activeTab === 'dispatch-console' && (
              <DispatchConsole
                jobs={filteredJobs}
                drivers={filteredDrivers}
                vehicles={filteredVehicles}
                customers={filteredCustomers}
                locations={filteredLocations}
                quotations={filteredQuotations}
                regions={regions}
                currentUser={currentUser}
                onAssignJob={handleAssignJobToDriver}
                onTriggerDynamicInsertion={handleTriggerDynamicInsertion}
                onLogException={handleLogException}
                onUpdateJob={(updatedJob) => {
                  const updated = jobs.map(j =>
                    j.id === updatedJob.id ? updatedJob : j
                  );
                  setJobs(updated);
                  handleSaveTenantState('jobs', updated);
                }}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'schedule-builder' && (
              <ScheduleBuilder
                jobs={filteredJobs}
                drivers={filteredDrivers}
                vehicles={filteredVehicles}
                customers={filteredCustomers}
                locations={filteredLocations}
                currentUser={currentUser}
                onAssignJob={handleAssignJobToDriver}
              />
            )}

            {activeTab === 'empty-tracker' && (
              <ContainerLifecycle
                jobs={filteredJobs}
                customers={filteredCustomers}
                surcharges={filteredSurcharges}
                shippingLines={shippingLines}
                regions={regions}
                currentUser={currentUser}
                onTriggerReturnJob={handleTriggerReturnJob}
                onUpdateJob={handleUpdateJob}
              />
            )}

            {activeTab === 'billing' && (
              <BillingInvoiceConsole
                jobs={filteredJobs}
                customers={filteredCustomers}
                quotations={filteredQuotations}
                invoices={filteredInvoices}
                activeTenant={activeTenant}
                invoiceSettings={invoiceSettings}
                surcharges={surcharges}
                regions={regions}
                currentUser={currentUser}
                onAddInvoice={handleAddInvoice}
                onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                onUpdateInvoiceSettings={handleUpdateInvoiceSettings}
              />
            )}

            {activeTab === 'emulator' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <span className="font-bold uppercase text-xs tracking-wider">Preview as Driver</span>
                  <select
                    value={previewDriverId}
                    onChange={e => setPreviewDriverId(e.target.value)}
                    className="bg-white border border-amber-300 rounded px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value="">— Select driver —</option>
                    {filteredDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-amber-600">This is a read-only preview — no role change occurs.</span>
                </div>
                <DriverMilestoneApp
                  jobs={filteredJobs}
                  drivers={filteredDrivers}
                  vehicles={filteredVehicles}
                  previewDriverId={previewDriverId || undefined}
                  onUpdateMilestone={handleUpdateMilestone}
                />
              </div>
            )}

            {/* New Systems Administrations Panels */}
            {activeTab === 'fleet-master' && (
              <FleetMaster
                vehicles={filteredVehicles}
                onAddVehicle={(v) => {
                  const enriched = { ...v, regionId: currentUser.regionId || 'IN' };
                  const updated = [enriched, ...vehicles];
                  setVehicles(updated);
                  handleSaveTenantState('vehicles', updated);
                }}
                onUpdateVehicle={(v) => {
                  const updated = vehicles.map(item => item.id === v.id ? v : item);
                  setVehicles(updated);
                  handleSaveTenantState('vehicles', updated);
                }}
                onDeleteVehicle={(id) => {
                  const updated = vehicles.filter(item => item.id !== id);
                  setVehicles(updated);
                  handleSaveTenantState('vehicles', updated);
                }}
              />
            )}

            {activeTab === 'driver-master' && (
              <DriverMaster
                drivers={filteredDrivers}
                vehicles={filteredVehicles}
                onAddDriver={(d) => {
                  const enriched = { ...d, regionId: currentUser.regionId || 'IN' };
                  const updated = [enriched, ...drivers];
                  setDrivers(updated);
                  handleSaveTenantState('drivers', updated);
                }}
                onUpdateDriver={(d) => {
                  const updated = drivers.map(item => item.id === d.id ? d : item);
                  setDrivers(updated);
                  handleSaveTenantState('drivers', updated);
                }}
                onDeleteDriver={(id) => {
                  const updated = drivers.filter(item => item.id !== id);
                  setDrivers(updated);
                  handleSaveTenantState('drivers', updated);
                }}
              />
            )}

            {activeTab === 'locations-zones' && (
              <LocationZoneMaster
                locations={filteredLocations}
                zones={filteredZones}
                zoneTypes={zoneTypes}
                regions={regions}
                countries={countries}
                onAddLocation={(loc) => {
                  const enriched = { ...loc, regionId: currentUser.regionId || 'IN' };
                  const updated = [enriched, ...locations];
                  setLocations(updated);
                  handleSaveTenantState('locations', updated);
                }}
                onUpdateLocation={(loc) => {
                  const updated = locations.map(l => l.id === loc.id ? loc : l);
                  setLocations(updated);
                  handleSaveTenantState('locations', updated);
                }}
                onDeleteLocation={(id) => {
                  const updated = locations.filter(l => l.id !== id);
                  setLocations(updated);
                  handleSaveTenantState('locations', updated);
                }}
                onAddZone={(z) => {
                  const enriched = { ...z, regionId: currentUser.regionId || 'IN' };
                  const updated = [enriched, ...zones];
                  setZones(updated);
                  handleSaveTenantState('zones', updated);
                }}
                onUpdateZone={(z) => {
                  const updated = zones.map(item => item.id === z.id ? z : item);
                  setZones(updated);
                  handleSaveTenantState('zones', updated);
                }}
                onDeleteZone={(id) => {
                  const updated = zones.filter(z => z.id !== id);
                  setZones(updated);
                  handleSaveTenantState('zones', updated);
                }}
                onAddRegion={(reg) => {
                  const updated = [reg, ...regions];
                  setRegions(updated);
                  handleSaveTenantState('regions', updated);
                }}
                onUpdateRegion={(reg) => {
                  const updated = regions.map(r => r.id === reg.id ? reg : r);
                  setRegions(updated);
                  handleSaveTenantState('regions', updated);
                }}
                onDeleteRegion={(id) => {
                  const updated = regions.filter(r => r.id !== id);
                  setRegions(updated);
                  handleSaveTenantState('regions', updated);
                }}
                onAddCountry={(cnt) => {
                  const updated = [cnt, ...countries];
                  setCountries(updated);
                  handleSaveTenantState('countries', updated);
                }}
                onUpdateCountry={(cnt) => {
                  const updated = countries.map(c => c.id === cnt.id ? cnt : c);
                  setCountries(updated);
                  handleSaveTenantState('countries', updated);
                }}
                onDeleteCountry={(id) => {
                  const updated = countries.filter(c => c.id !== id);
                  setCountries(updated);
                  handleSaveTenantState('countries', updated);
                }}
                supportedLanguages={supportedLanguages}
                masterTranslations={masterTranslations}
                onAddMasterTranslation={handleAddMasterTranslation}
                onUpdateMasterTranslation={handleUpdateMasterTranslation}
              />
            )}

            {activeTab === 'region-master' && (
              <RegionMaster
                regions={regions}
                onAddRegion={(reg) => {
                  const updated = [reg, ...regions];
                  setRegions(updated);
                  handleSaveTenantState('regions', updated);
                }}
                onUpdateRegion={(reg) => {
                  const updated = regions.map(r => r.id === reg.id ? reg : r);
                  setRegions(updated);
                  handleSaveTenantState('regions', updated);
                }}
                onDeleteRegion={(id) => {
                  const updated = regions.filter(r => r.id !== id);
                  setRegions(updated);
                  handleSaveTenantState('regions', updated);
                }}
              />
            )}

            {activeTab === 'support-masters' && (
              <SupportMasters
                shippingLines={shippingLines}
                vessels={vessels}
                vendors={vendors}
                containerTypes={containerTypes}
                regions={regions}
                onAddShippingLine={handleAddShippingLine}
                onUpdateShippingLine={handleUpdateShippingLine}
                onDeleteShippingLine={handleDeleteShippingLine}
                onAddVessel={handleAddVessel}
                onUpdateVessel={handleUpdateVessel}
                onDeleteVessel={handleDeleteVessel}
                onAddVendor={handleAddVendor}
                onUpdateVendor={handleUpdateVendor}
                onDeleteVendor={handleDeleteVendor}
                onAddContainerType={handleAddContainerType}
                onUpdateContainerType={handleUpdateContainerType}
                onDeleteContainerType={handleDeleteContainerType}
                supportedLanguages={supportedLanguages}
                masterTranslations={masterTranslations}
                onAddMasterTranslation={handleAddMasterTranslation}
                onUpdateMasterTranslation={handleUpdateMasterTranslation}
              />
            )}

            {activeTab === 'rate-cards' && (
              <RateCardManager
                tariffs={filteredTariffs}
                zones={filteredZones}
                onAddTariff={(t) => {
                  const enriched = { ...t, regionId: currentUser.regionId || 'IN' };
                  const updated = [enriched, ...tariffs];
                  setTariffs(updated);
                  handleSaveTenantState('tariffs', updated);
                }}
                onDeleteTariff={(id) => {
                  const updated = tariffs.filter(t => t.id !== id);
                  setTariffs(updated);
                  handleSaveTenantState('tariffs', updated);
                }}
              />
            )}

            {activeTab === 'workflows' && (
              <WorkflowStatusManager
                configs={workflowConfigs}
                onUpdateConfig={(cfg) => {
                  const updated = workflowConfigs.map(c => c.scenario === cfg.scenario ? cfg : c);
                  setWorkflowConfigs(updated);
                  handleSaveTenantState('workflowconfigs', updated);
                }}
                onResetToDefault={(scenario) => {
                  const defaults = createMilestonesForScenario(scenario).map(st => ({
                    id: st.id,
                    label: st.label,
                    description: st.description,
                    requiresEvidence: st.requiresEvidence
                  }));
                  const updated = workflowConfigs.map(c => c.scenario === scenario ? { ...c, steps: defaults } : c);
                  setWorkflowConfigs(updated);
                  handleSaveTenantState('workflowconfigs', updated);
                }}
                supportedLanguages={supportedLanguages}
                masterTranslations={masterTranslations}
                onAddMasterTranslation={handleAddMasterTranslation}
                onUpdateMasterTranslation={handleUpdateMasterTranslation}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsConsole
                customerPayments={filterByRegion(customerPayments, currentUser, activeRegionFilter)}
                vendorPayments={filterByRegion(vendorPayments, currentUser, activeRegionFilter)}
                invoices={filteredInvoices}
                jobs={filteredJobs}
                customers={filteredCustomers}
                vendors={filteredVendors}
                regions={regions}
                currentUser={currentUser}
                invoiceSettings={invoiceSettings}
                activeTenant={activeTenant}
                receiptSequence={receiptSequence}
                adviceSequence={adviceSequence}
                onAddCustomerPayment={handleAddCustomerPayment}
                onAddVendorPayment={handleAddVendorPayment}
                onUpdateVendorPayment={handleUpdateVendorPayment}
                onIncrementReceiptSequence={(regionId) =>
                  setReceiptSequence(prev => ({ ...prev, [regionId]: (prev[regionId] ?? 0) + 1 }))
                }
                onIncrementAdviceSequence={(regionId) =>
                  setAdviceSequence(prev => ({ ...prev, [regionId]: (prev[regionId] ?? 0) + 1 }))
                }
              />
            )}

            {activeTab === 'admin-console' && (
              <AdministrationConsole
                activeTenant={activeTenant}
                onUpdateTenant={handleUpdateTenant}
                users={users}
                currentUser={currentUser}
                regions={regions}
                onAddUser={(usr) => {
                  const updated = [...users, usr];
                  setUsers(updated);
                  handleSaveTenantState('users', updated);
                }}
                onUpdateUser={(usr) => {
                  const updated = users.map(u => u.id === usr.id ? usr : u);
                  setUsers(updated);
                  handleSaveTenantState('users', updated);
                }}
                onSwitchUser={(userId) => {
                  // DEMO: logout + login-as in one click
                  const u = users.find(item => item.id === userId);
                  if (u) {
                    if (u.status === 'invited') {
                      alert('This account is still pending invite activation.');
                      return;
                    }
                    handleDemoLoginAs(u);
                    alert(`DEMO: switched session to ${u.name} (${u.role})`);
                  }
                }}
                onCopyInviteLink={handleCopyInviteLink}
                onResendInvite={handleResendInvite}
                smtpConfig={smtpConfig}
                onUpdateSmtpConfig={(cfg) => {
                  setSmtpConfig(cfg);
                  handleSaveTenantState('smtpconfig', cfg);
                }}
                emailTemplates={emailTemplates}
                onUpdateTemplate={(tpl) => {
                  const updated = emailTemplates.map(t => t.id === tpl.id ? tpl : t);
                  setEmailTemplates(updated);
                  handleSaveTenantState('emailtemplates', updated);
                }}
                translations={translations}
                supportedLanguages={supportedLanguages}
                onUpdateLanguage={handleUpdateLanguage}
                onAddTranslation={handleAddTranslation}
                onUpdateTranslation={handleUpdateTranslation}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
