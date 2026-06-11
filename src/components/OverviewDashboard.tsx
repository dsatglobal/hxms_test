/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Job, Customer, Driver, Vehicle, SurchargeRule, Quotation, Region, Invoice, Tenant } from '../types';
import { 
  DollarSign, 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  Layers, 
  CheckCircle2, 
  Ship, 
  Calendar,
  Layers2,
  Users,
  Building,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface OverviewDashboardProps {
  jobs: Job[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  quotations: Quotation[];
  invoices: Invoice[];
  surcharges: SurchargeRule[];
  regions: Region[];
  activeRegionFilter: string | "ALL";
  isCorpAdmin: boolean;
  activeTenant?: Tenant;
  onNavigate: (tab: string) => void;
}

export default function OverviewDashboard({
  jobs = [],
  customers = [],
  drivers = [],
  vehicles = [],
  quotations = [],
  invoices = [],
  surcharges = [],
  regions = [],
  activeRegionFilter = 'ALL',
  isCorpAdmin = false,
  activeTenant,
  onNavigate
}: OverviewDashboardProps) {

  // Step 1: Dynamic display currency and formatCurrency
  const displayCurrency = activeRegionFilter === "ALL"
    ? (activeTenant?.reportingCurrency ?? "USD")
    : regions.find(r => r.code === activeRegionFilter)?.currency 
      ?? "USD";

  const formatCurrency = (amount: number, customCurrency?: string) => {
    const currencyToUse = customCurrency ?? displayCurrency;
    const symbol = regions.find(
      r => r.currency === currencyToUse
    )?.currencySymbol ?? currencyToUse;
    
    if (amount >= 10000000) 
      return `${symbol} ${(amount/10000000).toFixed(1)}Cr`;
    if (amount >= 100000) 
      return `${symbol} ${(amount/100000).toFixed(1)}L`;
    if (amount >= 1000) 
      return `${symbol} ${(amount/1000).toFixed(1)}K`;
    return `${symbol} ${amount.toFixed(0)}`;
  };

  // 1. Core Regional Filtering of active data context
  const filteredJobs = useMemo(() => {
    if (activeRegionFilter === 'ALL') return jobs;
    return jobs.filter(j => j.regionId === activeRegionFilter);
  }, [jobs, activeRegionFilter]);

  const filteredInvoices = useMemo(() => {
    if (activeRegionFilter === 'ALL') return invoices;
    return invoices.filter(i => i.regionId === activeRegionFilter);
  }, [invoices, activeRegionFilter]);

  const filteredDrivers = useMemo(() => {
    if (activeRegionFilter === 'ALL') return drivers;
    return drivers.filter(d => d.regionId === activeRegionFilter);
  }, [drivers, activeRegionFilter]);

  const filteredVehicles = useMemo(() => {
    if (activeRegionFilter === 'ALL') return vehicles;
    return vehicles.filter(v => v.regionId === activeRegionFilter);
  }, [vehicles, activeRegionFilter]);

  const filteredQuotations = useMemo(() => {
    if (activeRegionFilter === 'ALL') return quotations;
    return quotations.filter(q => q.regionId === activeRegionFilter);
  }, [quotations, activeRegionFilter]);

  const filteredCustomers = useMemo(() => {
    if (activeRegionFilter === 'ALL') return customers;
    return customers.filter(c => c.regionId === activeRegionFilter);
  }, [customers, activeRegionFilter]);

  // Selected region details for banner display
  const selectedRegion = useMemo(() => {
    if (activeRegionFilter === "ALL") return null;
    return regions?.find(r => r.code === activeRegionFilter);
  }, [regions, activeRegionFilter]);

  // STEP 6: Corporate view region stats (only active regions when filter is ALL)
  const regionStats = useMemo(() => {
    if (!isCorpAdmin || activeRegionFilter !== "ALL") return [];
    
    // Always list active regions
    const activeRegions = regions.filter(r => r.isActive);
    return activeRegions.map((r, index) => {
      const regionJobs = jobs.filter(j => j.regionId === r.code);
      const regionDrivers = drivers.filter(d => d.regionId === r.code);
      const regionActiveDrivers = regionDrivers.filter(
        d => d.currentStatus === 'in-transit' || (d as any).status === 'in-transit'
      ).length;
      
      // Summed region specific revenue
      const regionRevenue = invoices
        .filter(inv => inv.regionId === r.code)
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const borderColors = [
        'border-l-blue-500',
        'border-l-emerald-500',
        'border-l-amber-500',
        'border-l-purple-500',
        'border-l-rose-500'
      ];
      const borderClass = borderColors[index % borderColors.length];
      
      const textColors = [
        'text-blue-600 bg-blue-50/70 border-blue-200/50',
        'text-emerald-600 bg-emerald-50/70 border-emerald-200/50',
        'text-amber-600 bg-amber-50/70 border-amber-200/50',
        'text-purple-600 bg-purple-50/70 border-purple-200/50',
        'text-rose-600 bg-rose-50/70 border-rose-200/50'
      ];
      const badgeClass = textColors[index % textColors.length];
      
      return {
        ...r,
        jobCount: regionJobs.length,
        revenue: regionRevenue,
        activeDriverCount: regionActiveDrivers,
        totalDriverCount: regionDrivers.length,
        borderClass,
        badgeClass
      };
    });
  }, [regions, jobs, drivers, invoices, isCorpAdmin, activeRegionFilter]);

  // STEP 2: FIX Revenue KPI calculations
  const revenueStats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-06"
    
    // Total Invoiced (this month)
    const monthInvoices = filteredInvoices.filter(inv => {
      const dateStr = inv.issueDate || (inv as any).createdAt || "";
      return dateStr.startsWith(thisMonth);
    });
    const totalInvoiced = monthInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount, 0
    );

    // Total Paid (this month)
    const totalPaid = monthInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Total Outstanding (this month)
    const totalOutstanding = monthInvoices
      .filter(inv => inv.status === "unpaid")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Pipeline Value (confirmed quotes not yet invoiced)
    const confirmedQuoteIds = new Set(
      filteredInvoices.map(inv => inv.quotationId).filter(Boolean)
    );
    const pipelineValue = filteredQuotations
      .filter(q => q.status === "confirmed" && !confirmedQuoteIds.has(q.id))
      .reduce((sum, q) => sum + (q.totalValue || 0), 0);

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      pipelineValue
    };
  }, [filteredInvoices, filteredQuotations]);

  // STEP 3: FIX Operational KPI calculations
  const operationalStats = useMemo(() => {
    // Active Jobs (in progress)
    const activeJobs = filteredJobs.filter(j => j.status === "active").length;

    // Pending Dispatch (scheduled but no driver)
    const pendingDispatch = filteredJobs.filter(j => j.status === "pending").length;

    // Completed Today
    const today = new Date().toISOString().slice(0, 10);
    const completedToday = filteredJobs.filter(j => 
      j.status === "completed" && j.completionTime === today
    ).length;

    // Drivers On Road
    const driversOnRoad = filteredDrivers.filter(
      d => d.currentStatus === "in-transit" || (d as any).status === "in-transit"
    ).length;

    // Idle Trucks
    const idleTrucks = filteredVehicles.filter(
      v => v.status === "idle" || !v.status
    ).length;

    // Detention Risk (containers near free time expiry <= 3 days)
    const detentionRisk = filteredJobs.filter(j => {
      if (!j.freeTimeExpiry || j.status === 'completed') return false;
      const expiry = new Date(j.freeTimeExpiry);
      return expiry <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }).length;

    const totalDetentionExposure = filteredJobs
      .filter(j => j.detentionChargeAmount && j.detentionChargeAmount > 0)
      .reduce((sum, j) => sum + (j.detentionChargeAmount ?? 0), 0);

    return {
      activeJobs,
      pendingDispatch,
      completedToday,
      driversOnRoad,
      idleTrucks,
      detentionRisk,
      totalDetentionExposure
    };
  }, [filteredJobs, filteredDrivers, filteredVehicles]);

  // STEP 4: Double Bar Scenario Breakdown calculations
  const scenarioCounts = useMemo(() => {
    return ["IMP", "EXP", "Inland", "EMTY", "RETURN"].map(scenario => {
      const count = filteredJobs.filter(j => j.scenario === scenario).length;
      const value = filteredInvoices
        .filter(inv => {
          const job = filteredJobs.find(j => j.id === inv.jobId);
          return job?.scenario === scenario;
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      return {
        scenario,
        count,
        value
      };
    });
  }, [filteredJobs, filteredInvoices]);

  const maxJobCount = useMemo(() => Math.max(...scenarioCounts.map(s => s.count), 1), [scenarioCounts]);
  const maxValue = useMemo(() => Math.max(...scenarioCounts.map(s => s.value), 1), [scenarioCounts]);

  // STEP 5: Recent Activity Feed Generator (last 8 completed milestones sorted by timestamp)
  const recentJobEvents = useMemo(() => {
    const events: Array<{
      id: string;
      jobNo: string;
      customerName: string;
      scenario: string;
      milestoneLabel: string;
      timestamp: string;
      status: string;
    }> = [];

    filteredJobs.forEach(job => {
      const custObj = filteredCustomers.find(c => c.id === job.customerId);
      const customerName = custObj ? custObj.name : 'Unknown Client';

      job.milestones.forEach(m => {
        if (m.completed && m.timestamp) {
          events.push({
            id: `${job.id}-ms-${m.id}`,
            jobNo: job.jobNo,
            customerName,
            scenario: job.scenario,
            milestoneLabel: m.label,
            timestamp: m.timestamp,
            status: job.status
          });
        }
      });

      // Scheduled time fallback
      if (job.status !== 'completed' && job.scheduledTime) {
        events.push({
          id: `${job.id}-sched`,
          jobNo: job.jobNo,
          customerName,
          scenario: job.scenario,
          milestoneLabel: 'Job Created & Scheduled',
          timestamp: job.scheduledTime,
          status: job.status
        });
      }
    });

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [filteredJobs, filteredCustomers]);

  // Simple human-readable elapsed time ago formatter
  const formatTimeAgo = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Just now";
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  // Demurrage warning computed array
  const demurrageWarnings = useMemo(() => {
    return filteredJobs
      .filter(j => j.scenario === 'IMP' && j.status === 'active' && j.freeTimeExpiry)
      .map(j => {
        const diffMs = new Date(j.freeTimeExpiry!).getTime() - Date.now();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        return {
          id: j.id,
          containerNo: j.containerNo,
          daysLeft,
          customerName: filteredCustomers.find(c => c.id === j.customerId)?.name || 'Unknown Client',
          shippingLine: j.shippingLine
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [filteredJobs, filteredCustomers]);

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-container">
      {/* Control Tower Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight uppercase flex items-center gap-2">
            Operations Control Tower
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time fleet operations, container flow status, and commercial revenue logs.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-white border border-slate-200 px-3 py-1.5 rounded text-blue-600 shadow-sm font-semibold">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>UTC SERVER LIVE: 2026-06-10 07:05</span>
        </div>
      </div>

      {/* STEP 6: Corporate view regional cards list (when "ALL" regions is selected) */}
      {isCorpAdmin && activeRegionFilter === 'ALL' && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-950 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-400" />
              Consolidated Global Regions Overview
            </h3>
            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] px-2.5 py-0.5 rounded font-black tracking-widest uppercase shrink-0">
              Cross-Region Consolidated
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regionStats.map((rStat) => (
              <div 
                key={rStat.id} 
                className={`bg-slate-950 border border-slate-800 border-l-4 ${rStat.borderClass} p-4 rounded-lg flex flex-col justify-between space-y-3 shadow-inner`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-white leading-tight truncate">
                      {rStat.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Gate ID: {rStat.code}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${rStat.badgeClass}`}>
                    {rStat.code}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-1 border-t border-slate-800/80 pt-2.5 text-xs font-medium">
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Jobs</div>
                    <div className="text-sm font-black text-white">{rStat.jobCount}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Revenue</div>
                    <div className="text-sm font-black text-emerald-400 truncate" title={`${rStat.revenue}`}>
                      {formatCurrency(rStat.revenue, rStat.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Drivers</div>
                    <div className="text-sm font-black text-white">
                      {rStat.activeDriverCount}
                      <span className="text-[9px] text-slate-600 font-normal">/{rStat.totalDriverCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: Selected Region banner (when specific region filter is active) */}
      {selectedRegion && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div>
              <span className="font-extrabold text-sm uppercase tracking-wide block">
                Viewing: {selectedRegion.name} Operations ({selectedRegion.code})
              </span>
              <span className="text-xs text-amber-700 font-medium">
                All KPIs, scenario counts, recent activities, and freight metrics are filtered to this gateway.
              </span>
            </div>
          </div>
          <span className="text-xs bg-amber-100 border border-amber-250 px-3 py-1 rounded-full font-mono font-bold text-amber-850 self-start sm:self-auto uppercase tracking-wider">
            {selectedRegion.currency} ({selectedRegion.currencySymbol}) Standard
          </span>
        </div>
      )}

      {/* STEP 2: Revenue Statistics Cards - First Row */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
          Commercial Revenue Ledger (This Month)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Monthly Invoiced */}
          <motion.div 
            className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
            whileHover={{ y: -2 }}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Monthly Invoiced
              </span>
              <div className="text-2xl font-black text-slate-800 font-sans">
                {formatCurrency(revenueStats.totalInvoiced)}
              </div>
              <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" /> Active billed book
              </span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 2: Collected */}
          <motion.div 
            className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
            whileHover={{ y: -2 }}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Collected
              </span>
              <div className="text-2xl font-black text-slate-800 font-sans">
                {formatCurrency(revenueStats.totalPaid)}
              </div>
              <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 animate-pulse" /> Settle bank deposit
              </span>
            </div>
            <div className="p-3 bg-green-50 border border-green-150 rounded text-green-650">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 3: Outstanding */}
          <motion.div 
            className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
            whileHover={{ y: -2 }}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Outstanding
              </span>
              <div className="text-2xl font-black text-slate-850 font-sans">
                {formatCurrency(revenueStats.totalOutstanding)}
              </div>
              <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" /> Remittance due terms
              </span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 4: Quote Pipeline */}
          <motion.div 
            className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-sm relative overflow-hidden"
            whileHover={{ y: -2 }}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Quote Pipeline
              </span>
              <div className="text-2xl font-black text-slate-800 font-sans">
                {formatCurrency(revenueStats.pipelineValue)}
              </div>
              <span className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-500" /> Pending booking pull
              </span>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-100 rounded text-purple-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </motion.div>

        </div>
      </div>

      {/* STEP 3: Operational KPI Cards - Second Row */}
      <div className="space-y-2 pt-1">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
          Operational Live Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Active Jobs */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm space-y-2">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-normal">Active Jobs</div>
            <div className="text-xl font-black text-green-700">{operationalStats.activeJobs}</div>
            <div className="text-[10px] text-green-600 font-semibold bg-green-50 border border-green-105 rounded px-2 py-0.5 text-center truncate">
              In Transit
            </div>
          </div>

          {/* Pending Dispatch */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm space-y-2">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-normal">Pending Dispatch</div>
            <div className="text-xl font-black text-amber-700">{operationalStats.pendingDispatch}</div>
            <div className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-105 rounded px-2 py-0.5 text-center truncate">
              Needs Driver
            </div>
          </div>

          {/* Completed Today */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm space-y-2">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-normal">Completed Today</div>
            <div className="text-xl font-black text-blue-700">{operationalStats.completedToday}</div>
            <div className="text-[10px] text-blue-600 font-semibold bg-blue-50 border border-blue-105 rounded px-2 py-0.5 text-center truncate">
              Milestones Closed
            </div>
          </div>

          {/* Drivers On Road */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm space-y-2">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-normal">Drivers On Road</div>
            <div className="text-xl font-black text-indigo-700">{operationalStats.driversOnRoad}</div>
            <div className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-105 rounded px-2 py-0.5 text-center truncate">
              En-route GPS
            </div>
          </div>

          {/* Idle Trucks */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm space-y-2">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-normal">Idle Trucks</div>
            <div className="text-xl font-black text-slate-700">{operationalStats.idleTrucks}</div>
            <div className="text-[10px] text-slate-600 font-semibold bg-slate-50 border border-slate-105 rounded px-2 py-0.5 text-center truncate">
              Prime Movers
            </div>
          </div>

          {/* Detention Risk */}
          <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm space-y-2">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-normal">Detention Risk</div>
            <div className={`text-xl font-black ${operationalStats.detentionRisk > 0 ? 'text-red-600 ' : 'text-slate-700'}`}>
              {operationalStats.detentionRisk}
            </div>
            <div className="text-[10px] font-bold text-slate-500">
               ₹{operationalStats.totalDetentionExposure.toLocaleString()} exposure
            </div>
            <div className={`text-[10px] font-bold border rounded px-2 py-0.5 text-center truncate ${
              operationalStats.detentionRisk > 0 
                ? 'bg-red-50 text-red-655 border-red-150 animate-pulse font-extrabold' 
                : 'bg-slate-50 text-slate-400 border-slate-105'
            }`}>
              Near Expiry
            </div>
          </div>

        </div>
      </div>

      {/* STEP 5 — Recent Activity feed */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
          <div>
            <h2 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider">Haulier Live Logs & Recent Activities</h2>
            <p className="text-[10.5px] text-slate-400">Chronological telemetry audit of the last 8 completed milestones.</p>
          </div>
        </div>

        {recentJobEvents.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-mono italic">
            No telemetry logs or activity recordings available for this view.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentJobEvents.map((evt) => (
              <div key={evt.id} className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg flex flex-col justify-between space-y-2 text-xs">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="font-extrabold text-blue-600">{evt.jobNo}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[150px]" title={evt.customerName}>
                      {evt.customerName}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                    evt.scenario === 'IMP' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    evt.scenario === 'EXP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    evt.scenario === 'Inland' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {evt.scenario}
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-2">
                  <span className="text-[10.5px] font-bold text-slate-700 line-clamp-1">{evt.milestoneLabel}</span>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                    <span>{formatTimeAgo(evt.timestamp)}</span>
                    <span className={`inline-block px-1 rounded font-bold uppercase ${
                      evt.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'
                    }`}>{evt.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Middle Content Area: Live Ops Monitor */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Job Feed */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Active Freight Movements</h2>
              </div>
              <button 
                onClick={() => onNavigate('booking')}
                className="text-xs text-blue-600 hover:text-blue-700 transition font-bold flex items-center gap-1"
              >
                Go to Job Center <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Job Ref</th>
                    <th className="px-2">Customer</th>
                    <th className="px-2">Scenario</th>
                    <th className="px-2">Container & Size</th>
                    <th className="px-2">Driver</th>
                    <th className="px-2">Milestone Progress</th>
                    <th className="px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredJobs.map((job) => {
                    const custName = filteredCustomers.find(c => c.id === job.customerId)?.name || 'Loading...';
                    const driverObj = filteredDrivers.find(d => d.id === job.driverId);
                    const vehicleObj = filteredVehicles.find(v => v.id === job.vehicleId);
                    
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-3 font-bold text-blue-600">{job.jobNo}</td>
                        <td className="font-semibold max-w-[140px] truncate text-slate-800 px-2">{custName}</td>
                        <td className="px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold tracking-tight ${
                            job.scenario === 'IMP' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            job.scenario === 'EXP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            job.scenario === 'Inland' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {job.scenario}
                          </span>
                        </td>
                        <td className="font-sans px-2">
                          <div className="font-bold text-slate-800">{job.containerNo || 'UNASSIGNED'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{job.containerSize} • {job.weightKg} KG</div>
                        </td>
                        <td className="px-2">
                          {driverObj ? (
                            <div>
                              <div className="font-sans font-semibold text-slate-800">{driverObj.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">{vehicleObj?.plateNumber}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono italic">Needs Assignment</span>
                          )}
                        </td>
                        <td className="px-2">
                          <div className="space-y-1 pr-4">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Step {job.currentMilestoneIndex + 1}/{job.milestones.length}</span>
                              <span className="font-bold">
                                {job.milestones.length > 1 
                                  ? Math.round(((job.currentMilestoneIndex) / (job.milestones.length - 1)) * 100) 
                                  : 100}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${job.milestones.length > 1 
                                    ? ((job.currentMilestoneIndex) / (job.milestones.length - 1)) * 100 
                                    : 100}%` 
                                }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
                              {job.milestones[job.currentMilestoneIndex]?.label}
                            </div>
                          </div>
                        </td>
                        <td className="px-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'active' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                            job.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                            job.status === 'scheduled' ? 'bg-indigo-500 border border-indigo-150' :
                            'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              job.status === 'active' ? 'bg-teal-500 animate-pulse' :
                              job.status === 'completed' ? 'bg-green-500' :
                              job.status === 'scheduled' ? 'bg-indigo-550' :
                              'bg-slate-400'
                            }`} />
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* STEP 4 — Graphical Split of Scenarios (Custom Double Bar Chart showing count and revenue values) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-650" />
                <h2 className="font-extrabold text-slate-800 uppercase text-xs tracking-wider">Scenario Volume &amp; Revenue Distribution</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Financial Aggregate Split</span>
            </div>

            <div className="space-y-4">
              {scenarioCounts.map((item) => {
                let desc = '';
                if (item.scenario === 'IMP') {
                  desc = 'Import Gateway (Port ➔ Customer ➔ Empty Return)';
                } else if (item.scenario === 'EXP') {
                  desc = 'Export Gateway (Depot Empty ➔ Customer ➔ Export Port)';
                } else if (item.scenario === 'Inland') {
                  desc = 'Inland Cargo (Bilateral Point-to-Point Haulage)';
                } else if (item.scenario === 'EMTY') {
                  desc = 'Empty Repositioning (Inter-depot balanced transfers)';
                } else if (item.scenario === 'RETURN') {
                  desc = 'Empty Return (Post-stripping custody return)';
                }

                return (
                  <div key={item.scenario} className="bg-slate-50 border border-slate-100 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 uppercase text-sm tracking-wide bg-white px-2 py-0.5 border border-slate-200 rounded">{item.scenario}</span>
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">{desc}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-black">
                        <span className="text-blue-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          {item.count} {item.count === 1 ? 'Job' : 'Jobs'}
                        </span>
                        <span className="text-emerald-600 flex items-center gap-1.5 font-sans">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 border-t border-slate-200/50 pt-2.5">
                      {/* Job Count Bar (Blue) */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-14 text-[9px] text-slate-400 font-mono tracking-wider font-bold">VOLUME</span>
                        <div className="flex-1 bg-slate-205/65 h-2.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-blue-500 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${maxJobCount > 0 ? (item.count / maxJobCount) * 100 : 0}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Revenue Bar (Green) */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-14 text-[9px] text-slate-400 font-mono tracking-wider font-bold">REVENUE</span>
                        <div className="flex-1 bg-slate-205/65 h-2.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-emerald-500 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Alerts & Shift Information */}
        <div className="lg:col-span-4 space-y-6">

          {/* Detention Risks alert list */}
          <div className="bg-white border border-rose-100 shadow-sm rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
              <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Fine-Risk Container Alerts</h2>
            </div>

            {demurrageWarnings.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-450 font-mono bg-slate-50 rounded-lg p-4">
                No active containers at risk of detention.
              </div>
            ) : (
              <div className="space-y-3">
                {demurrageWarnings.map((w) => (
                  <div 
                    key={w.id} 
                    className={`p-3 rounded-lg border text-xs flex flex-col justify-between gap-1.5 ${
                      w.daysLeft <= 1 
                        ? 'bg-rose-50/50 border-rose-150 text-slate-800' 
                        : 'bg-amber-50/50 border-amber-150 text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-sans font-bold tracking-wider text-slate-800">{w.containerNo}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] ${
                        w.daysLeft <= 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {w.daysLeft} {w.daysLeft === 1 ? 'DAY LEFT' : 'DAYS LEFT'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans truncate">
                      {w.customerName}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-1.5 mt-0.5">
                      <span>CUSTODIAN:</span>
                      <span className="text-slate-600 font-bold">{w.shippingLine}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terminal Connections Monitoring Grid */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Terminal Port Connections</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-705 font-sans">HZP-T1 (Port Center)</div>
                  <div className="text-slate-450 text-[10px]">Gate Operations: Active</div>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-55 text-green-700 border border-green-150">
                  ONLINE
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-705 font-sans">HZP-T2 (South Gate)</div>
                  <div className="text-slate-455 text-[10px]">Gate Congestion: High</div>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-55 text-amber-700 border border-amber-150">
                  35M WAIT
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-705 font-sans">Apex Central (APX-DEP)</div>
                  <div className="text-slate-455 text-[10px]">Skeletal Chassis: 12 Available</div>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-55 text-green-700 border border-green-150">
                  BALANCED
                </span>
              </div>
            </div>
          </div>

          {/* Dispatch Notice Board directives */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Shift Directives</h2>
            </div>
            <div className="text-xs text-slate-600 space-y-3 font-sans">
              <p className="border-l-2 border-blue-600 pl-2.5 leading-relaxed">
                <strong>Triangulation Optimization:</strong> Always check Live Tracking Map when drivers return empty. Click "Insert Return task" to utilize empty chassis back-hauls.
              </p>
              <p className="border-l-2 border-slate-400 pl-2.5 leading-relaxed">
                <strong>Vessel Aligned Release Codes:</strong> Confirm ROT release codes prior to driver gate arrival at Terminal 1.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
