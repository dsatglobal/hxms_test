import React, { useState } from 'react';
import { Driver, Vehicle } from '../types';
import { Plus, CheckCircle, ShieldAlert, Award, FileText, Sliders, Smartphone, UserCheck } from 'lucide-react';

interface DriverMasterProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onAddDriver: (d: Driver) => void;
  onUpdateDriver: (d: Driver) => void;
  onDeleteDriver: (dId: string) => void;
}

export default function DriverMaster({
  drivers,
  vehicles,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver
}: DriverMasterProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [portPassNumber, setPortPassNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'assigned' | 'in-transit' | 'at-site' | 'completed'>('idle');
  
  // Custom driver types
  const [driverType, setDriverType] = useState<'prime_mover' | 'sub_con'>('prime_mover');
  const [licenseClass, setLicenseClass] = useState('Heavy Articulated Class 5');

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const resetForm = () => {
    setName('');
    setLicenseNumber('');
    setLicenseExpiry('');
    setPortPassNumber('');
    setPhone('');
    setAssignedVehicleId('');
    setCurrentStatus('idle');
    setDriverType('prime_mover');
    setLicenseClass('Heavy Articulated Class 5');
    setEditingDriver(null);
    setShowAddForm(false);
  };

  const handleEdit = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setLicenseNumber(d.licenseNumber);
    setLicenseExpiry(d.licenseExpiry);
    setPortPassNumber(d.portPassNumber);
    setPhone(d.phone);
    setAssignedVehicleId(d.assignedVehicleId || '');
    setCurrentStatus(d.currentStatus);
    
    // Fallbacks
    setDriverType('prime_mover');
    setLicenseClass('Heavy Articulated Class 5');
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !licenseNumber.trim() || !licenseExpiry) {
      alert('Driver name, license code, and expiry calendar are strictly required.');
      return;
    }

    const payload: Driver = {
      id: editingDriver ? editingDriver.id : `drv-${Date.now()}`,
      name: name.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseExpiry,
      portPassNumber: portPassNumber.trim().toUpperCase(),
      phone: phone.trim(),
      assignedVehicleId,
      currentStatus
    };

    if (editingDriver) {
      onUpdateDriver(payload);
    } else {
      onAddDriver(payload);
    }
    resetForm();
  };

  const filteredDrivers = drivers.filter(d => {
    const matchName = d.name.toLowerCase().includes(searchName.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.currentStatus === filterStatus;
    return matchName && matchStatus;
  });

  return (
    <div id="driver-master-container" className="space-y-6">

      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <UserCheck className="text-blue-600 w-5 h-5" /> Driver Master Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain heavy-class operator records, port pass permits, licensing deadlines, and tractor assignments.
          </p>
        </div>

        <button
          id="btn-register-driver"
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Register New Driver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Filters/Forms Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Filters */}
          <div id="driver-filters-card" className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-400" /> Filter Criteria
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">SEARCH BY NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Bob Johnson"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">CURRENT STATUS</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium"
                >
                  <option value="all">-- All Status --</option>
                  <option value="idle">IDLE / STANDBY</option>
                  <option value="assigned">ASSIGNED</option>
                  <option value="in-transit">IN-TRANSIT</option>
                  <option value="at-site">AT-SITE</option>
                  <option value="completed">COMPLETED</option>
                </select>
              </div>

            </div>
          </div>

          {/* License Configuration */}
          <div id="license-helper-card" className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-xs text-xs">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5 text-xs">
              <Award className="w-3.5 h-3.5 text-blue-600" /> License Matrix Rules
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Wharf authorities strictly require class-4 or class-5 double-articulated endorsements for container terminal clearance.
            </p>
            <div className="space-y-1 text-[11px] text-slate-700 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Class 4:</span>
                <span>Rigid Box Trucks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class 5:</span>
                <span>Articulated Prime Movers</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main List and Form Canvas */}
        <div className="lg:col-span-3 space-y-6">

          {showAddForm && (
            <div id="driver-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs">
                <span className="font-bold uppercase text-blue-600 font-mono tracking-wide">
                  {editingDriver ? 'Update Crew Record' : 'Register New Professional Driver'}
                </span>
                <button
                  id="btn-close-driver-form"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                
                <div className="space-y-1">
                  <label className="block font-bold">Driver Full Name <span className="text-red-500">*</span></label>
                  <input
                    id="driver-name-input"
                    type="text"
                    required
                    placeholder="e.g. William Tan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Mobile Phone <span className="text-red-500">*</span></label>
                  <input
                    id="driver-phone-input"
                    type="text"
                    required
                    placeholder="e.g. +1 (555) 991-0021"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">License ID <span className="text-red-500">*</span></label>
                  <input
                    id="driver-license-input"
                    type="text"
                    required
                    placeholder="e.g. DL-400192A"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">License Expiry Date <span className="text-red-500">*</span></label>
                  <input
                    id="driver-licexpiry-input"
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Port Customs Pass Permit</label>
                  <input
                    id="driver-portpass-input"
                    type="text"
                    placeholder="e.g. PP-992-X"
                    value={portPassNumber}
                    onChange={(e) => setPortPassNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Allocated Prime Mover Horse</label>
                  <select
                    id="driver-vehicle-select"
                    value={assignedVehicleId}
                    onChange={(e) => setAssignedVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="">-- No Vehicle Assigned (Standby) --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plateNumber} ({v.type.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Driver Personnel Category</label>
                  <select
                    value={driverType}
                    onChange={(e) => setDriverType(e.target.value as 'prime_mover' | 'sub_con')}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="prime_mover">In-House Staff (Prime Mover Class)</option>
                    <option value="sub_con">Subcontract Haulage Crew</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Endorsed License Level Class</label>
                  <input
                    type="text"
                    required
                    value={licenseClass}
                    onChange={(e) => setLicenseClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-medium"
                  />
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    id="btn-save-driver"
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition shadow-xs"
                  >
                    Save crew Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Drivers List */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <table className="w-full border-collapse text-left text-xs bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">DRIVER NAME</th>
                  <th className="py-3 px-4">PERMIT CREDENTIALS</th>
                  <th className="py-3 px-4">ACTIVE HORSE</th>
                  <th className="py-3 px-4">CONTACT NO</th>
                  <th className="py-3 px-4">SCHEDULING STATE</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching drivers registered in system.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map(d => {
                    const isExpirySoon = new Date(d.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const isExpired = new Date(d.licenseExpiry) < new Date();
                    const vehObj = vehicles.find(v => v.id === d.assignedVehicleId);

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{d.name}</div>
                          <span className="text-[10px] text-slate-400 uppercase">Class 5 Crew</span>
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          <div className="flex gap-2">
                            <span className="text-[10px] bg-slate-100 border border-slate-200 font-mono font-bold px-1.5 rounded text-slate-700">
                              LIC: {d.licenseNumber}
                            </span>
                            {d.portPassNumber && (
                              <span className="text-[10px] bg-blue-50 border border-blue-100 font-mono font-bold px-1.5 rounded text-blue-700">
                                PORT: {d.portPassNumber}
                              </span>
                            )}
                          </div>
                          
                          {/* Expiry alerts */}
                          <div>
                            <span className="text-[10px] text-slate-400 font-mono">Renewal: {d.licenseExpiry}</span>
                            {isExpired ? (
                              <span className="text-[9px] font-bold text-red-500 block">EXPIRED LICENSE (BLOCKED)</span>
                            ) : isExpirySoon ? (
                              <span className="text-[9px] font-bold text-amber-500 block">RENEWAL REQ. SOON</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {vehObj ? (
                            <span className="font-mono bg-blue-50 text-blue-800 border border-blue-200 rounded px-2 py-0.5 font-bold uppercase">
                              {vehObj.plateNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                          {d.phone}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            d.currentStatus === 'idle' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : d.currentStatus === 'in-transit' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-250 animate-pulse' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {d.currentStatus === 'idle' ? 'STANDBY' : d.currentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            id={`driver-edit-btn-${d.id}`}
                            onClick={() => handleEdit(d)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Edit
                          </button>
                          <button
                            id={`driver-delete-btn-${d.id}`}
                            onClick={() => onDeleteDriver(d.id)}
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

          {/* DDL Schema Hint inside Driver */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs space-y-2 border border-slate-950">
            <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">PostgreSQL Compatibility Mapping</div>
            <p className="text-slate-400">
              The <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">fleet_drivers</code> table correlates drivers with active plate numbers via a <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">FOREIGN KEY (assigned_vehicle_id) REFERENCES fleet_vehicles(id) ON DELETE SET NULL</code>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
