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
  TariffRate,
  ScenarioType
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
  BASE_TARIFFS
} from './data';

// Components
import OverviewDashboard from './components/OverviewDashboard';
import QuotationWizard from './components/QuotationWizard';
import JobBooker from './components/JobBooker';
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

// Icons
import { 
  Settings, 
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
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // SaaS Multi-tenancy Subdomain State
  const [activeTenant, setActiveTenant] = useState<Tenant>(MOCK_TENANTS[0]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Isolated Tenant Database States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rots, setRots] = useState<ROT[]>([]);
  const [consignmentNotes, setConsignmentNotes] = useState<ConsignmentNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>(DEFAULT_DRIVERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);

  // New States for Administration, Location/Zone, Rate configs
  const [locations, setLocations] = useState<LocationGeo[]>(MOCK_LOCATIONS);
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  const [zoneTypes, setZoneTypes] = useState<ZoneType[]>(DEFAULT_ZONE_TYPES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(INITIAL_SMTP_CONFIG);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(INITIAL_EMAIL_TEMPLATES);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tariffs, setTariffs] = useState<TariffRate[]>(BASE_TARIFFS);

  // Milestone scenario configs
  const [workflowConfigs, setWorkflowConfigs] = useState<WorkflowMilestoneConfig[]>([]);

  // Group sidebar navigation indices
  const [masterMenuOpen, setMasterMenuOpen] = useState(true);
  const [opsMenuOpen, setOpsMenuOpen] = useState(true);

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
      const uParsed = JSON.parse(localUsrs);
      setUsers(uParsed);
      
      const localCurUser = localStorage.getItem(`${keyPrefix}_currentuser`);
      if (localCurUser) {
        setCurrentUser(JSON.parse(localCurUser));
      } else {
        setCurrentUser(uParsed[0] || INITIAL_USERS[0]);
      }
    } else {
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
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

  }, [activeTenant]);

  // Persistance helper
  const handleSaveTenantState = (type: string, data: any) => {
    const keyPrefix = `hms_db_${activeTenant.subdomain}`;
    localStorage.setItem(`${keyPrefix}_${type}`, JSON.stringify(data));
  };

  // State manipulation handlers
  const handleAddCustomer = (c: Customer) => {
    const updated = [c, ...customers];
    setCustomers(updated);
    handleSaveTenantState('customers', updated);
  };

  const handleAddQuotation = (q: Quotation) => {
    const updated = [q, ...quotations];
    setQuotations(updated);
    handleSaveTenantState('quotations', updated);
  };

  const handleConfirmQuotation = (quoteId: string) => {
    const updated = quotations.map(q => q.id === quoteId ? { ...q, status: 'confirmed' as const } : q);
    setQuotations(updated);
    handleSaveTenantState('quotations', updated);
  };

  const handleAddJob = (job: Job, rot: ROT, cn: ConsignmentNote) => {
    const updatedJobs = [job, ...jobs];
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);

    const updatedRots = [rot, ...rots];
    setRots(updatedRots);
    handleSaveTenantState('rots', updatedRots);

    const updatedCns = [cn, ...consignmentNotes];
    setConsignmentNotes(updatedCns);
    handleSaveTenantState('cns', updatedCns);
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

  const handleAssignJobToDriver = (jobId: string, driverId: string, vehicleId: string, scheduledTime: string) => {
    // Allocate job details
    const updatedJobs = jobs.map(j => j.id === jobId ? { 
      ...j, 
      status: 'active' as const, 
      driverId, 
      vehicleId, 
      scheduledTime 
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

  const handleAddInvoice = (inv: Invoice) => {
    const updatedInvoiced = [inv, ...invoices];
    setInvoices(updatedInvoiced);
    handleSaveTenantState('invoices', updatedInvoiced);

    // Update job billing status to invoiced
    const updatedJobs = jobs.map(j => j.id === inv.jobId ? { ...j, billingStatus: 'invoiced' as const } : j);
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: 'paid' | 'unpaid') => {
    const updated = invoices.map(i => i.id === invoiceId ? { ...i, status } : i);
    setInvoices(updated);
    handleSaveTenantState('invoices', updated);
  };

  const handleTriggerReturnJob = (jobId: string) => {
    // Generate return empty containers
    const sourceJob = jobs.find(j => j.id === jobId);
    if (!sourceJob) return;

    // Simulate empty return job instantly triggered
    const newJob: Job = {
      id: `job-${Date.now()}`,
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
      extraSurchargesIncurred: []
    };

    const updatedJobs = [newJob, ...jobs];
    setJobs(updatedJobs);
    handleSaveTenantState('jobs', updatedJobs);
    alert('EMPTY CONTAINER RETURN SCHEDULED! Outstanding chassis now listed on Gantt scheduler.');
    setActiveTab('planning');
  };

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
            
            {/* Core Overview */}
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
                  <Sliders className="w-3.5 h-3.5" /> Dashboard Tower
                </span>
              </button>
            </div>

            {/* Masters Menu group */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                SYSTEM MASTERS
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
              </div>
            </div>

            {/* Operations Menu Group */}
            {currentUser.role !== 'billing' && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                  OPERATIONS &amp; RUN
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
                    <BookOpen className="w-3.5 h-3.5 text-green-400" /> Container Bookings
                  </button>

                  <button
                    id="menu-planning"
                    onClick={() => setActiveTab('planning')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'planning' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Gantt Scheduler
                  </button>

                  <button
                    id="menu-tracking"
                    onClick={() => setActiveTab('tracking')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'tracking' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-indigo-400" /> Live Maps Tracker
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

            {/* Accounting Group */}
            {currentUser.role !== 'dispatcher' && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                  FINANCE LEDGER
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
                    id="menu-billing"
                    onClick={() => setActiveTab('billing')}
                    className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                      activeTab === 'billing' 
                        ? 'bg-blue-500/25 text-blue-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-500" /> Invoices Issuer
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
                    <Receipt className="w-3.5 h-3.5 text-purple-400" /> Payments Settle
                  </button>
                </div>
              </div>
            )}

            {/* Administration & Configuration Group */}
            {currentUser.role === 'administrator' && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-1">
                  SYSTEM OVERRIDES
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
                    <Settings className="w-3.5 h-3.5 text-slate-400 animate-spin-slow" /> Global Settings Admin
                  </button>
                </div>
              </div>
            )}

            {/* Mobile App Terminal Block */}
            {currentUser.role === 'driver_emulator' && (
              <div className="space-y-1 border-t border-slate-800/50 pt-2">
                <button
                  id="menu-emulator"
                  onClick={() => setActiveTab('emulator')}
                  className={`w-full text-left px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 transition ${
                     activeTab === 'emulator' 
                      ? 'bg-blue-500/25 text-blue-400 border-l-4 border-blue-500' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Driver Emulator App
                </button>
              </div>
            )}

          </nav>
        </div>

        {/* Dynamic User switcher footer */}
        <div id="sidebar-user-footer" className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate pr-2">
            <div className="font-bold text-white truncate max-w-[150px]">{currentUser.name}</div>
            <div className="text-[10px] font-mono text-slate-400 truncate max-w-[150px] uppercase font-bold text-blue-400">{currentUser.role}</div>
          </div>
          <button 
            onClick={() => {
              // Log cycle switch back to admin or default user
              const adm = users.find(u => u.role === 'administrator');
              if (adm) {
                setCurrentUser(adm);
                handleSaveTenantState('currentuser', adm);
                alert(`Security Terminal switched to: ${adm.name}`);
              }
            }}
            className="text-slate-400 hover:text-white transition shrink-0 p-1 bg-slate-800 hover:bg-slate-700 rounded"
            title="Reset to Master Administrator Terminal"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
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
              <OverviewDashboard
                jobs={jobs}
                customers={customers}
                drivers={drivers}
                vehicles={vehicles}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerMaster
                customers={customers}
                onAddCustomer={handleAddCustomer}
              />
            )}

            {activeTab === 'pricing' && (
              <QuotationWizard
                quotations={quotations}
                customers={customers}
                locations={locations}
                onAddQuotation={handleAddQuotation}
                onConfirmQuotation={handleConfirmQuotation}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'booking' && (
              <JobBooker
                jobs={jobs}
                customers={customers}
                quotations={quotations}
                locations={locations}
                rots={rots}
                consignmentNotes={consignmentNotes}
                onAddJob={handleAddJob}
                onConfirmRot={handleConfirmRot}
                workflowConfigs={workflowConfigs}
              />
            )}

            {activeTab === 'planning' && (
              <GanttChart
                jobs={jobs}
                drivers={drivers}
                vehicles={vehicles}
                customers={customers}
                onAssignJob={handleAssignJobToDriver}
              />
            )}

            {activeTab === 'tracking' && (
              <LiveTrackingMap
                jobs={jobs}
                drivers={drivers}
                vehicles={vehicles}
                locations={locations}
                onTriggerDynamicInsertion={handleTriggerDynamicInsertion}
              />
            )}

            {activeTab === 'empty-tracker' && (
              <ContainerLifecycle
                jobs={jobs}
                customers={customers}
                onTriggerReturnJob={handleTriggerReturnJob}
              />
            )}

            {activeTab === 'billing' && (
              <BillingInvoiceConsole
                jobs={jobs}
                customers={customers}
                quotations={quotations}
                invoices={invoices}
                activeTenant={activeTenant}
                onAddInvoice={handleAddInvoice}
                onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              />
            )}

            {activeTab === 'emulator' && (
              <DriverMilestoneApp
                jobs={jobs}
                drivers={drivers}
                vehicles={vehicles}
                onUpdateMilestone={handleUpdateMilestone}
              />
            )}

            {/* New Systems Administrations Panels */}
            {activeTab === 'fleet-master' && (
              <FleetMaster
                vehicles={vehicles}
                onAddVehicle={(v) => {
                  const updated = [v, ...vehicles];
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
                drivers={drivers}
                vehicles={vehicles}
                onAddDriver={(d) => {
                  const updated = [d, ...drivers];
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
                locations={locations}
                zones={zones}
                zoneTypes={zoneTypes}
                onAddLocation={(loc) => {
                  const updated = [loc, ...locations];
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
                  const updated = [z, ...zones];
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
              />
            )}

            {activeTab === 'rate-cards' && (
              <RateCardManager
                tariffs={tariffs}
                zones={zones}
                onAddTariff={(t) => {
                  const updated = [t, ...tariffs];
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
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsConsole
                invoices={invoices}
                payments={payments}
                onAddPayment={(p) => {
                  const updated = [p, ...payments];
                  setPayments(updated);
                  handleSaveTenantState('payments', updated);
                }}
                onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              />
            )}

            {activeTab === 'admin-console' && (
              <AdministrationConsole
                activeTenant={activeTenant}
                onUpdateTenant={(updatedTenant) => {
                  setActiveTenant(updatedTenant);
                  // Persist in memory mock tenants array
                  const updatedTenants = MOCK_TENANTS.map(t => t.id === updatedTenant.id ? updatedTenant : t);
                  MOCK_TENANTS.length = 0;
                  MOCK_TENANTS.push(...updatedTenants);
                }}
                users={users}
                currentUser={currentUser}
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
                  const u = users.find(item => item.id === userId);
                  if (u) {
                    setCurrentUser(u);
                    handleSaveTenantState('currentuser', u);
                    alert(`Switched active profile session to: ${u.name} (${u.role})`);
                  }
                }}
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
              />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
