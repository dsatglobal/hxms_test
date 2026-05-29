import React, { useState } from 'react';
import { Vehicle, VehicleType, OwnerType } from '../types';
import { Plus, Trash2, ShieldAlert, CheckCircle, Truck, FileText, Settings, Sliders } from 'lucide-react';

interface FleetMasterProps {
  vehicles: Vehicle[];
  onAddVehicle: (v: Vehicle) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (vId: string) => void;
}

export default function FleetMaster({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}: FleetMasterProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form states
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState<VehicleType>('skeletal');
  const [ownerType, setOwnerType] = useState<OwnerType>('in-house');
  const [roadTaxExpiry, setRoadTaxExpiry] = useState('');
  const [maintenanceAlert, setMaintenanceAlert] = useState(false);

  // Custom Vehicle Types Manager state
  const [customTypes, setCustomTypes] = useState<string[]>([
    'skeletal',
    'flatbed',
    'sideloader',
    'tipper'
  ]);
  const [newTypeName, setNewTypeName] = useState('');

  // Filtering
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [searchPlate, setSearchPlate] = useState('');

  const resetForm = () => {
    setPlateNumber('');
    setType('skeletal');
    setOwnerType('in-house');
    setRoadTaxExpiry('');
    setMaintenanceAlert(false);
    setEditingVehicle(null);
    setShowAddForm(false);
  };

  const handleEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setPlateNumber(v.plateNumber);
    setType(v.type);
    setOwnerType(v.ownerType);
    setRoadTaxExpiry(v.roadTaxExpiry);
    setMaintenanceAlert(v.maintenanceAlert);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !roadTaxExpiry) {
      alert('Plate number and Road Tax Expiry are strictly required.');
      return;
    }

    if (editingVehicle) {
      onUpdateVehicle({
        ...editingVehicle,
        plateNumber: plateNumber.toUpperCase(),
        type,
        ownerType,
        roadTaxExpiry,
        maintenanceAlert
      });
    } else {
      // Check for duplicate plate
      const exists = vehicles.some(v => v.plateNumber.toUpperCase() === plateNumber.toUpperCase());
      if (exists) {
        alert(`Vehicle with plate number ${plateNumber.toUpperCase()} is already registered in the database.`);
        return;
      }

      onAddVehicle({
        id: `veh-${Date.now()}`,
        plateNumber: plateNumber.toUpperCase(),
        type,
        ownerType,
        roadTaxExpiry,
        maintenanceAlert
      });
    }
    resetForm();
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

  const filteredVehicles = vehicles.filter(v => {
    const matchType = filterType === 'all' || v.type === filterType;
    const matchOwner = filterOwner === 'all' || v.ownerType === filterOwner;
    const matchPlate = v.plateNumber.toLowerCase().includes(searchPlate.toLowerCase());
    return matchType && matchOwner && matchPlate;
  });

  return (
    <div id="fleet-master-container" className="space-y-6">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <Truck className="text-blue-600 w-5 h-5 animate-pulse" /> Fleet Master Register
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain active prime movers, flatbeds, skeletal trailers, road tax inspection intervals, and chassis types.
          </p>
        </div>

        <button
          id="btn-register-vehicle"
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Register New Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Filters and Left Forms */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Filters */}
          <div id="fleet-filters-card" className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-400" /> Filter Criteria
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">PLATE SEARCH</label>
                <input
                  type="text"
                  placeholder="e.g. PM-8821"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">VEHICLE TYPE</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium"
                >
                  <option value="all">-- All Types --</option>
                  {customTypes.map(t => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">OWNER TYPE</label>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium"
                >
                  <option value="all">-- All Ownership --</option>
                  <option value="in-house">In-House Fleet</option>
                  <option value="subcontract">Subcontract / Port Haulier</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle Type configuration master list */}
          <div id="fleet-types-config-card" className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Settings className="w-3.5 h-3.5 text-slate-400" /> Define Vehicle Types
            </h3>

            <form onSubmit={handleCreateCustomType} className="flex gap-2">
              <input
                id="input-new-type"
                type="text"
                required
                placeholder="e.g. reefer"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-800 font-medium"
              />
              <button
                id="btn-add-type"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-1 px-2.5 rounded text-[11px]"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5">
              {customTypes.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2 rounded text-xs">
                  <span className="font-mono font-bold text-slate-700 uppercase">{t}</span>
                  <span className="text-[10px] text-slate-400 uppercase">System Active</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Main List and Forms Panel */}
        <div className="lg:col-span-3 space-y-6">

          {showAddForm && (
            <div id="vehicle-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase text-blue-600 font-mono tracking-wide">
                  {editingVehicle ? 'Edit Registered Asset' : 'Register New Horse/Chassis Asset'}
                </span>
                <button
                  id="btn-close-vehicle-form"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                <div className="space-y-1">
                  <label className="block font-bold">Plate / Registration Code <span className="text-red-500">*</span></label>
                  <input
                    id="vehicle-plate-input"
                    type="text"
                    required
                    placeholder="e.g. PM-9901-Z"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-800 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Vehicle Class <span className="text-red-500">*</span></label>
                  <select
                    id="vehicle-class-select"
                    value={type}
                    onChange={(e) => setType(e.target.value as VehicleType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  >
                    {customTypes.map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Ownership Status <span className="text-red-500">*</span></label>
                  <select
                    id="vehicle-owner-select"
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value as OwnerType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="in-house">In-House Atlas Pool</option>
                    <option value="subcontract">Sub-Contract Haulier</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Road Tax Expiry Date <span className="text-red-500">*</span></label>
                  <input
                    id="vehicle-expiry-input"
                    type="date"
                    required
                    value={roadTaxExpiry}
                    onChange={(e) => setRoadTaxExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-800"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input
                    id="vehicle-alert-checkbox"
                    type="checkbox"
                    checked={maintenanceAlert}
                    onChange={(e) => setMaintenanceAlert(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Raise Active Maintenance alert</span>
                    <span className="text-slate-400 text-[10px]">Blocks matching in the dispatch grid until cleared by fleet superintendent.</span>
                  </div>
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end gap-2">
                  <button
                    id="btn-save-vehicle"
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition shadow-xs"
                  >
                    Save Asset Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vehicle List */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <table className="w-full border-collapse text-left text-xs bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">VEHICLE PLATE</th>
                  <th className="py-3 px-4">TRAILER / TRACTOR CLASS</th>
                  <th className="py-3 px-4">OWNERSHIP</th>
                  <th className="py-3 px-4">TAX EXPIRY</th>
                  <th className="py-3 px-4">STATUS ALERTS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching vehicles registered in system.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(v => {
                    const isExpired = new Date(v.roadTaxExpiry) < new Date();
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 uppercase">
                            {v.plateNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 uppercase text-slate-800 font-mono font-bold">
                          {v.type}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.ownerType === 'in-house' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {v.ownerType === 'in-house' ? 'IN-HOUSE POOL' : 'SUBCONTRACTOR'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-800">
                            {v.roadTaxExpiry}
                          </div>
                          {isExpired && (
                            <span className="text-[9px] font-bold text-red-500 block">EXPIRED LICENSE</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {v.maintenanceAlert ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL REPAIR NEEDED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                              <CheckCircle className="w-3.5 h-3.5" /> DISPATCH READY
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            id={`vehicle-edit-btn-${v.id}`}
                            onClick={() => handleEdit(v)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Edit
                          </button>
                          <button
                            id={`vehicle-delete-btn-${v.id}`}
                            onClick={() => onDeleteVehicle(v.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* DDL Schema Hint inside Fleet */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs space-y-2 border border-slate-950">
            <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">PostgreSQL Compatibility Mapping</div>
            <p className="text-slate-400">
              This registry maps directly to the <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">fleet_vehicles</code> table. Schema definitions include custom constraints checking for valid plate masks and check-intervals on road tax timestamps.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
