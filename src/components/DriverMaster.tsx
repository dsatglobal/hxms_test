import React, { useState } from 'react';
import { Driver, Vehicle } from '../types';
import { Plus, UserCheck, Pencil, Trash2 } from 'lucide-react';
import DataTable, { DataTableColumn } from './shared/DataTable';
import FilterBar from './shared/FilterBar';
import DetailDrawer, { DrawerSection, DrawerField, DrawerFieldGrid } from './shared/DetailDrawer';
import { T, badgeClass, statusLabel } from './shared/ui';

interface DriverMasterProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onAddDriver: (d: Driver) => void;
  onUpdateDriver: (d: Driver) => void;
  onDeleteDriver: (dId: string) => void;
}

type DriverStatus = Driver['currentStatus'];

const daysUntil = (date: string) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

const emptyForm = {
  name: '', licenseNumber: '', licenseExpiry: '', portPassNumber: '',
  phone: '', assignedVehicleId: '', currentStatus: 'idle' as DriverStatus,
};

const STATUS_OPTIONS: { value: DriverStatus; label: string }[] = [
  { value: 'idle', label: 'Idle / Standby' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-transit', label: 'In-Transit' },
  { value: 'at-site', label: 'At-Site' },
  { value: 'completed', label: 'Completed' },
];

export default function DriverMaster({
  drivers, vehicles, onAddDriver, onUpdateDriver, onDeleteDriver,
}: DriverMasterProps) {
  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('');

  // Drawer
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create'>('view');
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = drivers.filter(d => {
    const matchName =
      d.name.toLowerCase().includes(searchName.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchName.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.currentStatus === filterStatus;
    const matchVehicle = !filterVehicle || d.assignedVehicleId === filterVehicle;
    return matchName && matchStatus && matchVehicle;
  });

  const selected = drivers.find(d => d.id === selectedId) ?? null;

  const openCreate = () => {
    setForm({ ...emptyForm });
    setSelectedId(null);
    setDrawerMode('create');
  };

  const startEdit = (d: Driver) => {
    setForm({
      name: d.name, licenseNumber: d.licenseNumber, licenseExpiry: d.licenseExpiry,
      portPassNumber: d.portPassNumber, phone: d.phone,
      assignedVehicleId: d.assignedVehicleId || '', currentStatus: d.currentStatus,
    });
    setSelectedId(d.id);
    setDrawerMode('edit');
  };

  const closeDrawer = () => { setSelectedId(null); setDrawerMode('view'); };

  const handleSave = () => {
    if (!form.name.trim() || !form.licenseNumber.trim() || !form.licenseExpiry) {
      alert('Driver name, license code, and expiry calendar are strictly required.');
      return;
    }
    const payload: Driver = {
      id: drawerMode === 'edit' && selected ? selected.id : `drv-${Date.now()}`,
      name: form.name.trim(),
      licenseNumber: form.licenseNumber.trim().toUpperCase(),
      licenseExpiry: form.licenseExpiry,
      portPassNumber: form.portPassNumber.trim().toUpperCase(),
      phone: form.phone.trim(),
      assignedVehicleId: form.assignedVehicleId,
      currentStatus: form.currentStatus,
    };
    if (drawerMode === 'edit' && selected) {
      onUpdateDriver(payload);
      setDrawerMode('view');
    } else {
      onAddDriver(payload);
      closeDrawer();
    }
  };

  const licenseCell = (d: Driver) => {
    const days = daysUntil(d.licenseExpiry);
    const expired = days < 0;
    const soon = days >= 0 && days <= 30;
    return (
      <div>
        <span className={`text-sm font-mono ${expired ? 'text-red-600 font-bold' : soon ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
          {d.licenseExpiry}
        </span>
        {expired && <span className="text-[10px] font-bold text-red-500 block">EXPIRED (BLOCKED)</span>}
        {soon && <span className="text-[10px] font-bold text-amber-500 block">Renewal in {days}d</span>}
      </div>
    );
  };

  const columns: DataTableColumn<Driver>[] = [
    {
      key: 'name', header: 'Driver Name',
      sortValue: d => d.name,
      render: d => (
        <div>
          <div className={T.cellPrimary}>{d.name}</div>
          <div className={T.cellMuted}>{d.phone}</div>
        </div>
      ),
    },
    {
      key: 'license', header: 'License No',
      sortValue: d => d.licenseNumber,
      render: d => <span className={T.cellId}>{d.licenseNumber}</span>,
    },
    {
      key: 'expiry', header: 'License Expiry',
      sortValue: d => d.licenseExpiry,
      render: licenseCell,
    },
    {
      key: 'portPass', header: 'Port Pass',
      sortValue: d => d.portPassNumber,
      render: d => d.portPassNumber
        ? <span className={T.cellId}>{d.portPassNumber}</span>
        : <span className={T.cellMuted}>—</span>,
    },
    {
      key: 'vehicle', header: 'Vehicle',
      sortValue: d => vehicles.find(v => v.id === d.assignedVehicleId)?.plateNumber ?? '',
      render: d => {
        const veh = vehicles.find(v => v.id === d.assignedVehicleId);
        return veh
          ? <span className={T.cellId}>{veh.plateNumber}</span>
          : <span className={badgeClass('unassigned')}>Unassigned</span>;
      },
    },
    {
      key: 'status', header: 'Status',
      sortValue: d => d.currentStatus,
      render: d => <span className={badgeClass(d.currentStatus)}>{d.currentStatus === 'idle' ? 'Standby' : statusLabel(d.currentStatus)}</span>,
    },
  ];

  const activeFilterCount =
    (searchName ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0) + (filterVehicle ? 1 : 0);

  const selectedVehicle = selected ? vehicles.find(v => v.id === selected.assignedVehicleId) : null;

  return (
    <div id="driver-master-container" className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`${T.pageTitle} flex items-center gap-2`}>
            <UserCheck className="text-blue-600 w-5 h-5" /> Driver Master Directory
          </h1>
          <p className={T.pageSubtitle}>Operator records, port pass permits, licensing deadlines, and tractor assignments.</p>
        </div>
        <button
          id="btn-register-driver"
          onClick={openCreate}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Register Driver
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <FilterBar
          searchPlaceholder="Search name or license…"
          searchValue={searchName}
          onSearchChange={setSearchName}
          statusOptions={[
            { value: 'all', label: 'All', count: drivers.length },
            ...STATUS_OPTIONS.map(s => ({
              value: s.value, label: s.label,
              count: drivers.filter(d => d.currentStatus === s.value).length,
            })),
          ]}
          activeStatus={filterStatus}
          onStatusChange={setFilterStatus}
          dropdownFilters={[{
            key: 'vehicle', label: 'Vehicle',
            options: vehicles.map(v => ({ value: v.id, label: v.plateNumber })),
            value: filterVehicle, onChange: setFilterVehicle,
          }]}
          onClearAll={() => { setSearchName(''); setFilterStatus('all'); setFilterVehicle(''); }}
          activeFilterCount={activeFilterCount}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          onRowClick={d => { setSelectedId(d.id); setDrawerMode('view'); }}
          rowActions={d => (
            <>
              <button
                id={`driver-edit-btn-${d.id}`}
                onClick={() => startEdit(d)}
                className="h-7 w-7 flex items-center justify-center rounded text-blue-600 hover:bg-blue-50"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                id={`driver-delete-btn-${d.id}`}
                onClick={() => onDeleteDriver(d.id)}
                className="h-7 w-7 flex items-center justify-center rounded text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          emptyState={{
            icon: <UserCheck className="w-10 h-10" />,
            title: 'No matching drivers',
            subtitle: 'Adjust the filters or register a new driver.',
          }}
        />
      </div>

      {/* Drawer */}
      <DetailDrawer
        open={drawerMode === 'create' || !!selected}
        onClose={closeDrawer}
        title={
          drawerMode === 'create'
            ? 'Register Driver'
            : <>
                <span>{selected?.name}</span>
                {selected && <span className={badgeClass(selected.currentStatus)}>{selected.currentStatus === 'idle' ? 'Standby' : statusLabel(selected.currentStatus)}</span>}
              </>
        }
        subtitle={drawerMode !== 'create' && selected ? `License ${selected.licenseNumber}` : undefined}
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
                onClick={() => onDeleteDriver(selected.id)}
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
                Save Crew Record
              </button>
            </>
          )
        }
      >
        {drawerMode === 'view' && selected ? (
          <>
            <DrawerSection title="Identity">
              <DrawerFieldGrid>
                <DrawerField label="Full Name" value={selected.name} bold full />
                <DrawerField label="Mobile Phone" value={<span className="font-mono">{selected.phone}</span>} />
                <DrawerField label="Status" value={statusLabel(selected.currentStatus)} />
              </DrawerFieldGrid>
            </DrawerSection>
            <DrawerSection title="Credentials">
              <DrawerFieldGrid>
                <DrawerField label="License No" value={<span className="font-mono text-blue-600">{selected.licenseNumber}</span>} />
                <DrawerField label="License Expiry" value={
                  <span className={daysUntil(selected.licenseExpiry) < 30 ? (daysUntil(selected.licenseExpiry) < 0 ? 'text-red-600 font-bold' : 'text-amber-600 font-bold') : ''}>
                    {selected.licenseExpiry}
                    {daysUntil(selected.licenseExpiry) < 0 && ' (EXPIRED)'}
                  </span>
                } />
                <DrawerField label="Port Pass" value={selected.portPassNumber ? <span className="font-mono text-blue-600">{selected.portPassNumber}</span> : undefined} />
              </DrawerFieldGrid>
            </DrawerSection>
            <DrawerSection title="Assignment">
              <DrawerFieldGrid>
                <DrawerField label="Assigned Vehicle" value={selectedVehicle ? <span className="font-mono text-blue-600">{selectedVehicle.plateNumber}</span> : 'Unassigned'} />
                <DrawerField label="Vehicle Class" value={selectedVehicle?.type.toUpperCase()} />
              </DrawerFieldGrid>
            </DrawerSection>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={T.drawerLabel}>Driver Full Name *</label>
              <input
                id="driver-name-input"
                placeholder="e.g. William Tan"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.drawerLabel}>Mobile Phone *</label>
                <input
                  id="driver-phone-input"
                  placeholder="+1 (555) 991-0021"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className={T.drawerLabel}>License ID *</label>
                <input
                  id="driver-license-input"
                  placeholder="e.g. DL-400192A"
                  value={form.licenseNumber}
                  onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.drawerLabel}>License Expiry *</label>
                <input
                  id="driver-licexpiry-input"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={e => setForm(f => ({ ...f, licenseExpiry: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className={T.drawerLabel}>Port Pass Permit</label>
                <input
                  id="driver-portpass-input"
                  placeholder="e.g. PP-992-X"
                  value={form.portPassNumber}
                  onChange={e => setForm(f => ({ ...f, portPassNumber: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className={T.drawerLabel}>Allocated Prime Mover</label>
              <select
                id="driver-vehicle-select"
                value={form.assignedVehicleId}
                onChange={e => setForm(f => ({ ...f, assignedVehicleId: e.target.value }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- No Vehicle Assigned (Standby) --</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} ({v.type.toUpperCase()})</option>)}
              </select>
            </div>
            <div>
              <label className={T.drawerLabel}>Scheduling Status</label>
              <select
                value={form.currentStatus}
                onChange={e => setForm(f => ({ ...f, currentStatus: e.target.value as DriverStatus }))}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
