import React, { useState } from 'react';
import { Vehicle, VehicleType, OwnerType } from '../types';
import { Plus, ShieldAlert, CheckCircle, Truck, Trash2, Pencil, Settings } from 'lucide-react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection, DrawerField, DrawerFieldGrid } from './shared/DetailDrawer';
import { T, badgeClass } from './shared/ui';

interface FleetMasterProps {
  vehicles: Vehicle[];
  onAddVehicle: (v: Vehicle) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (vId: string) => void;
}

const daysUntil = (date: string) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

const emptyForm = {
  plateNumber: '', type: 'skeletal' as VehicleType,
  ownerType: 'in-house' as OwnerType, roadTaxExpiry: '', maintenanceAlert: false,
};

export default function FleetMaster({
  vehicles, onAddVehicle, onUpdateVehicle, onDeleteVehicle,
}: FleetMasterProps) {
  // Filters
  const [searchPlate, setSearchPlate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Drawer
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [form, setForm] = useState({ ...emptyForm });

  // Custom vehicle types registry
  const [customTypes, setCustomTypes] = useState<string[]>(['skeletal', 'flatbed', 'sideloader', 'tipper']);
  const [newTypeName, setNewTypeName] = useState('');
  const [showTypesConfig, setShowTypesConfig] = useState(false);

  const statusOf = (v: Vehicle) => (v.maintenanceAlert ? 'maintenance' : 'active');

  const filtered = vehicles.filter(v => {
    const matchPlate = v.plateNumber.toLowerCase().includes(searchPlate.toLowerCase());
    const matchType = !filterType || v.type === filterType;
    const matchOwner = !filterOwner || v.ownerType === filterOwner;
    const matchStatus = filterStatus === 'all' || statusOf(v) === filterStatus;
    return matchPlate && matchType && matchOwner && matchStatus;
  });

  const selected = vehicles.find(v => v.id === selectedId) ?? null;

  const openCreate = () => {
    setForm({ ...emptyForm });
    setSelectedId(null);
    setDrawerMode('create');
  };

  const startEdit = (v: Vehicle) => {
    setForm({
      plateNumber: v.plateNumber, type: v.type, ownerType: v.ownerType,
      roadTaxExpiry: v.roadTaxExpiry, maintenanceAlert: v.maintenanceAlert,
    });
    setSelectedId(v.id);
    setDrawerMode('edit');
  };

  const closeDrawer = () => { setSelectedId(null); setDrawerMode('view'); };

  const handleSave = () => {
    if (!form.plateNumber.trim() || !form.roadTaxExpiry) {
      alert('Plate number and Road Tax Expiry are strictly required.');
      return;
    }
    if (drawerMode === 'create') {
      const exists = vehicles.some(v => v.plateNumber.toUpperCase() === form.plateNumber.toUpperCase());
      if (exists) {
        alert(`Vehicle with plate number ${form.plateNumber.toUpperCase()} is already registered in the database.`);
        return;
      }
      onAddVehicle({
        id: `veh-${Date.now()}`,
        plateNumber: form.plateNumber.toUpperCase(),
        type: form.type,
        ownerType: form.ownerType,
        roadTaxExpiry: form.roadTaxExpiry,
        maintenanceAlert: form.maintenanceAlert,
      });
      closeDrawer();
    } else if (selected) {
      onUpdateVehicle({
        ...selected,
        plateNumber: form.plateNumber.toUpperCase(),
        type: form.type,
        ownerType: form.ownerType,
        roadTaxExpiry: form.roadTaxExpiry,
        maintenanceAlert: form.maintenanceAlert,
      });
      setDrawerMode('view');
    }
  };

  const handleCreateCustomType = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newTypeName.trim().toLowerCase();
    if (!formatted) return;
    if (customTypes.includes(formatted)) {
      alert('This vehicle type option is already defined in the master registry.');
      return;
    }
    setCustomTypes([...customTypes, formatted]);
    setNewTypeName('');
  };

  const columns: DataTableColumn<Vehicle>[] = [
    {
      key: 'plate', header: 'Plate No',
      sortValue: v => v.plateNumber,
      render: v => <span className={T.cellId}>{v.plateNumber}</span>,
    },
    {
      key: 'type', header: 'Type',
      sortValue: v => v.type,
      render: v => <span className={`${T.cellSecondary} uppercase`}>{v.type}</span>,
    },
    {
      key: 'owner', header: 'Ownership',
      sortValue: v => v.ownerType,
      render: v => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v.ownerType === 'in-house'
            ? 'bg-blue-50 text-blue-700 border border-blue-100'
            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
        }`}>
          {v.ownerType === 'in-house' ? 'IN-HOUSE' : 'SUBCONTRACT'}
        </span>
      ),
    },
    {
      key: 'tax', header: 'Road Tax Expiry',
      sortValue: v => v.roadTaxExpiry,
      render: v => {
        const days = daysUntil(v.roadTaxExpiry);
        const danger = days < 14;
        return (
          <div>
            <span className={`text-sm font-mono ${danger ? 'text-red-600 font-bold' : 'text-slate-600'}`}>{v.roadTaxExpiry}</span>
            {danger && (
              <span className="text-[10px] font-bold text-red-500 block">
                {days < 0 ? 'EXPIRED' : `Expires in ${days}d`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status', header: 'Status',
      sortValue: v => statusOf(v),
      render: v => v.maintenanceAlert
        ? <span className={badgeClass('maintenance')}><ShieldAlert className="w-3 h-3 mr-1" /> Maintenance</span>
        : <span className={badgeClass('active')}><CheckCircle className="w-3 h-3 mr-1" /> Dispatch Ready</span>,
    },
  ];

  const activeFilterCount =
    (searchPlate ? 1 : 0) + (filterType ? 1 : 0) + (filterOwner ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  return (
    <div id="fleet-master-container" className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`${T.pageTitle} flex items-center gap-2`}>
            <Truck className="text-blue-600 w-5 h-5" /> Fleet Master Register
          </h1>
          <p className={T.pageSubtitle}>Prime movers, trailers, road tax intervals, and chassis types.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTypesConfig(s => !s)}
            className="px-3 py-2 rounded-md border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" /> Vehicle Types
          </button>
          <button
            id="btn-register-vehicle"
            onClick={openCreate}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Register Vehicle
          </button>
        </div>
      </div>

      {/* Vehicle types config (collapsible) */}
      {showTypesConfig && (
        <div id="fleet-types-config-card" className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm max-w-md">
          <h3 className={`${T.sectionHeader} pb-2 border-b border-slate-100 mb-3`}>Define Vehicle Types</h3>
          <form onSubmit={handleCreateCustomType} className="flex gap-2 mb-3">
            <input
              id="input-new-type"
              required
              placeholder="e.g. reefer"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-sm"
            />
            <button id="btn-add-type" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 rounded text-sm">Add</button>
          </form>
          <div className="space-y-1.5">
            {customTypes.map(t => (
              <div key={t} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded text-xs">
                <span className="font-mono font-bold text-slate-700 uppercase">{t}</span>
                <span className="text-[10px] text-slate-400 uppercase">System Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <FilterBar
          searchPlaceholder="Search plate number…"
          searchValue={searchPlate}
          onSearchChange={setSearchPlate}
          statusOptions={[
            { value: 'all', label: 'All', count: vehicles.length },
            { value: 'active', label: 'Dispatch Ready', count: vehicles.filter(v => !v.maintenanceAlert).length },
            { value: 'maintenance', label: 'Maintenance', count: vehicles.filter(v => v.maintenanceAlert).length },
          ]}
          activeStatus={filterStatus}
          onStatusChange={setFilterStatus}
          dropdownFilters={[
            {
              key: 'type', label: 'Type',
              options: customTypes.map(t => ({ value: t, label: t.toUpperCase() })),
              value: filterType, onChange: setFilterType,
            },
            {
              key: 'owner', label: 'Ownership',
              options: [
                { value: 'in-house', label: 'In-House Fleet' },
                { value: 'subcontract', label: 'Subcontract' },
              ],
              value: filterOwner, onChange: setFilterOwner,
            },
          ]}
          onClearAll={() => { setSearchPlate(''); setFilterType(''); setFilterOwner(''); setFilterStatus('all'); }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          onRowClick={v => { setSelectedId(v.id); setDrawerMode('view'); }}
          rowActions={v => (
            <>
              <button
                id={`vehicle-edit-btn-${v.id}`}
                onClick={() => startEdit(v)}
                className="h-7 w-7 flex items-center justify-center rounded text-blue-600 hover:bg-blue-50"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                id={`vehicle-delete-btn-${v.id}`}
                onClick={() => onDeleteVehicle(v.id)}
                className="h-7 w-7 flex items-center justify-center rounded text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          emptyState={{
            icon: <Truck className="w-10 h-10" />,
            title: 'No matching vehicles',
            subtitle: 'Adjust the filters or register a new vehicle.',
          }}
        />
      </div>

      {/* Drawer */}
      <DetailDrawer
        open={drawerMode === 'create' || !!selected}
        onClose={closeDrawer}
        title={
          drawerMode === 'create'
            ? 'Register Vehicle'
            : <>
                <span className="font-mono">{selected?.plateNumber}</span>
                {selected && (selected.maintenanceAlert
                  ? <span className={badgeClass('maintenance')}>Maintenance</span>
                  : <span className={badgeClass('active')}>Dispatch Ready</span>)}
              </>
        }
        subtitle={drawerMode !== 'create' && selected ? `${selected.type.toUpperCase()} · ${selected.ownerType === 'in-house' ? 'In-House Fleet' : 'Subcontractor'}` : undefined}
        headerActions={
          drawerMode === 'view' && selected ? (
            <button onClick={() => startEdit(selected)} className="h-8 px-2.5 flex items-center gap-1 rounded-md text-sm text-slate-600 hover:bg-slate-100">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          ) : undefined
        }
        footer={
          drawerMode === 'view' && selected ? (
            <>
              <button
                onClick={() => onDeleteVehicle(selected.id)}
                className="h-9 px-4 rounded-md border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <button onClick={() => startEdit(selected)} className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Edit</button>
            </>
          ) : (
            <>
              <button
                onClick={() => drawerMode === 'create' ? closeDrawer() : setDrawerMode('view')}
                className="h-9 px-4 rounded-md text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm">
                Save Asset Record
              </button>
            </>
          )
        }
      >
        {drawerMode === 'view' && selected ? (
          <>
            <DrawerSection title="Asset">
              <DrawerFieldGrid>
                <DrawerField label="Plate No" value={<span className="font-mono text-blue-600">{selected.plateNumber}</span>} />
                <DrawerField label="Vehicle Class" value={selected.type.toUpperCase()} />
                <DrawerField label="Ownership" value={selected.ownerType === 'in-house' ? 'In-House Pool' : 'Sub-Contract Haulier'} />
                <DrawerField label="Road Tax Expiry" value={
                  <span className={daysUntil(selected.roadTaxExpiry) < 14 ? 'text-red-600 font-bold' : ''}>
                    {selected.roadTaxExpiry}
                    {daysUntil(selected.roadTaxExpiry) < 0 && ' (EXPIRED)'}
                  </span>
                } />
              </DrawerFieldGrid>
            </DrawerSection>
            <DrawerSection title="Operational Status">
              {selected.maintenanceAlert ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Maintenance alert active.</strong> Blocked from the dispatch grid until cleared by fleet superintendent.</span>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Dispatch ready — no active maintenance alerts.</span>
                </div>
              )}
            </DrawerSection>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={T.drawerLabel}>Plate / Registration Code *</label>
              <input
                id="vehicle-plate-input"
                placeholder="e.g. PM-9901-Z"
                value={form.plateNumber}
                onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.drawerLabel}>Vehicle Class *</label>
                <select
                  id="vehicle-class-select"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as VehicleType }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {customTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className={T.drawerLabel}>Ownership *</label>
                <select
                  id="vehicle-owner-select"
                  value={form.ownerType}
                  onChange={e => setForm(f => ({ ...f, ownerType: e.target.value as OwnerType }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="in-house">In-House Pool</option>
                  <option value="subcontract">Sub-Contract Haulier</option>
                </select>
              </div>
            </div>
            <div>
              <label className={T.drawerLabel}>Road Tax Expiry Date *</label>
              <input
                id="vehicle-expiry-input"
                type="date"
                value={form.roadTaxExpiry}
                onChange={e => setForm(f => ({ ...f, roadTaxExpiry: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <label className="flex items-start gap-2 pt-2 border-t border-slate-100 cursor-pointer">
              <input
                id="vehicle-alert-checkbox"
                type="checkbox"
                checked={form.maintenanceAlert}
                onChange={e => setForm(f => ({ ...f, maintenanceAlert: e.target.checked }))}
                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs">
                <span className="font-bold text-slate-800 block">Raise active maintenance alert</span>
                <span className="text-slate-400 text-[10px]">Blocks matching in the dispatch grid until cleared by fleet superintendent.</span>
              </span>
            </label>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
