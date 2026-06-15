/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Region setup checklist — guided (not forced) dashboard widget.
 * Every item is computed LIVE from data, never stored as a flag.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, X, ClipboardList } from 'lucide-react';
import {
  Region, LocationGeo, Zone, TariffRate, SurchargeRule,
  Vehicle, Driver, User,
} from '../types';

interface SetupChecklistProps {
  regions: Region[];
  locations: LocationGeo[];
  zones: Zone[];
  tariffs: TariffRate[];
  surcharges: SurchargeRule[];
  vehicles: Vehicle[];
  drivers: Driver[];
  users: User[];
  currentUser: User;
  tenantKey: string;
  onNavigate: (tab: string) => void;
}

interface ChecklistItem {
  label: string;
  done: boolean;
  tab: string;
}

const buildItems = (
  regionCode: string,
  p: Pick<SetupChecklistProps, 'locations' | 'zones' | 'tariffs' | 'surcharges' | 'vehicles' | 'drivers' | 'users'>,
): ChecklistItem[] => [
  { label: 'Region configured', done: true, tab: 'region-master' },
  { label: 'Locations added', done: p.locations.some(l => l.regionId === regionCode), tab: 'locations-zones' },
  { label: 'Zones defined', done: p.zones.some(z => z.regionId === regionCode), tab: 'locations-zones' },
  { label: 'Rate card created', done: p.tariffs.some(t => t.regionId === regionCode), tab: 'rate-cards' },
  { label: 'Surcharges configured', done: p.surcharges.some(s => s.regionId === regionCode), tab: 'surcharge' },
  { label: 'Fleet added', done: p.vehicles.some(v => v.regionId === regionCode), tab: 'fleet-master' },
  { label: 'Drivers added', done: p.drivers.some(d => d.regionId === regionCode), tab: 'driver-master' },
  { label: 'Team invited', done: p.users.some(u => u.userLevel === 'region_user' && u.regionId === regionCode), tab: 'admin-console' },
];

export default function SetupChecklist({
  regions, locations, zones, tariffs, surcharges, vehicles, drivers, users,
  currentUser, tenantKey, onNavigate,
}: SetupChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissedTick, setDismissedTick] = useState(0); // re-render trigger after dismiss

  const isCorp = currentUser.regionAccess?.includes('ALL');
  const dataSlice = { locations, zones, tariffs, surcharges, vehicles, drivers, users };

  const dismissKey = (code: string) => `${tenantKey}_setup_dismissed_${code}`;
  const isDismissed = (code: string) => localStorage.getItem(dismissKey(code)) === '1';
  const dismiss = (code: string) => { localStorage.setItem(dismissKey(code), '1'); setDismissedTick(t => t + 1); };

  const myRegions = (isCorp
    ? regions.filter(r => r.isActive)
    : regions.filter(r => r.isActive && (currentUser.regionAccess?.includes(r.code) || r.code === currentUser.regionId))
  ).filter(r => !isDismissed(r.code));

  if (myRegions.length === 0) return null;

  // Region admins should only see this while their setup is relevant —
  // corp admin gets the compact multi-region view.
  if (isCorp) {
    const rows = myRegions.map(r => {
      const items = buildItems(r.code, dataSlice);
      return { region: r, done: items.filter(i => i.done).length, total: items.length };
    });
    if (rows.every(r => r.done === r.total)) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-5 overflow-hidden" key={dismissedTick}>
        <button onClick={() => setCollapsed(c => !c)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" /> Region Setup Overview
          </span>
          {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="px-4 pb-3 divide-y divide-slate-100">
                {rows.map(({ region, done, total }) => (
                  <div key={region.code} className="py-2 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-700">
                      <span className="font-mono font-bold">{region.code}</span> — {region.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${done === total ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${done === total ? 'text-green-600' : 'text-slate-500'}`}>{done}/{total}</span>
                      {done === total && (
                        <button onClick={() => dismiss(region.code)} className="text-slate-300 hover:text-slate-500" title="Dismiss">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Region admin: detailed checklist per accessible region (usually one)
  return (
    <div className="space-y-3 mb-5" key={dismissedTick}>
      {myRegions.map(region => {
        const items = buildItems(region.code, dataSlice);
        const done = items.filter(i => i.done).length;
        const allDone = done === items.length;
        return (
          <div key={region.code} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <button onClick={() => setCollapsed(c => !c)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                Region Setup — {region.name}
                <span className="text-xs font-medium text-slate-400">· {done} of {items.length} complete</span>
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                  <div className={`h-full rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${(done / items.length) * 100}%` }} />
                </div>
                {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  {allDone ? (
                    <div className="px-4 pb-4 pt-1 flex items-center justify-between">
                      <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="text-sm font-bold text-green-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5" /> Region ready ✓
                      </motion.span>
                      <button onClick={() => dismiss(region.code)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-md hover:bg-slate-50">
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                      {items.map(item => (
                        <div key={item.label} className="py-1.5 flex items-center justify-between border-b border-slate-50 last:border-0">
                          <span className={`text-xs flex items-center gap-2 ${item.done ? 'text-slate-400 line-through' : 'text-slate-700 font-semibold'}`}>
                            {item.done
                              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                              : <Circle className="w-4 h-4 text-slate-300" />}
                            {item.label}
                          </span>
                          {!item.done && (
                            <button onClick={() => onNavigate(item.tab)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                              Set up <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
