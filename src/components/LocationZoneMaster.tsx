import React, { useState } from 'react';
import { LocationGeo, LocationType, Zone, ZoneType } from '../types';
import { Plus, MapPin, Compass, Shield, Settings, Sliders, List, Trash2, Link } from 'lucide-react';

interface LocationZoneMasterProps {
  locations: LocationGeo[];
  zones: Zone[];
  zoneTypes: ZoneType[];
  onAddLocation: (loc: LocationGeo) => void;
  onUpdateLocation: (loc: LocationGeo) => void;
  onDeleteLocation: (locId: string) => void;
  onAddZone: (z: Zone) => void;
  onUpdateZone: (z: Zone) => void;
  onDeleteZone: (zId: string) => void;
}

export default function LocationZoneMaster({
  locations,
  zones,
  zoneTypes,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onAddZone,
  onUpdateZone,
  onDeleteZone
}: LocationZoneMasterProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'locations' | 'zones'>('locations');

  // Location Form States
  const [showLocForm, setShowLocForm] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationGeo | null>(null);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState<LocationType>('customer');
  const [locLat, setLocLat] = useState(250);
  const [locLng, setLocLng] = useState(250);
  const [locZone, setLocZone] = useState('');
  const [locGeofence, setLocGeofence] = useState(300);

  // Zone Form States
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneType, setZoneType] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');

  const resetLocForm = () => {
    setEditingLoc(null);
    setLocName('');
    setLocCode('');
    setLocType('customer');
    setLocLat(250);
    setLocLng(250);
    setLocZone('');
    setLocGeofence(300);
    setShowLocForm(false);
  };

  const resetZoneForm = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneCode('');
    setZoneType('');
    setZoneDesc('');
    setShowZoneForm(false);
  };

  const handleEditLoc = (loc: LocationGeo) => {
    setEditingLoc(loc);
    setLocName(loc.name);
    setLocCode(loc.code);
    setLocType(loc.type);
    setLocLat(loc.lat);
    setLocLng(loc.lng);
    setLocZone(loc.zone);
    setLocGeofence(loc.geofenceRadius);
    setShowLocForm(true);
  };

  const handleEditZone = (z: Zone) => {
    setEditingZone(z);
    setZoneName(z.name);
    setZoneCode(z.code);
    setZoneType(z.type);
    setZoneDesc(z.description);
    setShowZoneForm(true);
  };

  const handleLocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locCode.trim() || !locZone) {
      alert('Location Name, System Code, and Zone mapping are required.');
      return;
    }

    const payload: LocationGeo = {
      id: editingLoc ? editingLoc.id : `loc-${Date.now()}`,
      name: locName.trim(),
      code: locCode.toUpperCase().trim(),
      type: locType,
      lat: Number(locLat),
      lng: Number(locLng),
      zone: locZone,
      geofenceRadius: Number(locGeofence)
    };

    if (editingLoc) {
      onUpdateLocation(payload);
    } else {
      onAddLocation(payload);
    }
    resetLocForm();
  };

  const handleZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim() || !zoneCode.trim()) {
      alert('Zone Name and Code are mandatory.');
      return;
    }

    const payload: Zone = {
      id: editingZone ? editingZone.id : `zone-${Date.now()}`,
      name: zoneName.trim(),
      code: zoneCode.toUpperCase().trim(),
      type: zoneType || 'Industrial Corridor',
      description: zoneDesc.trim()
    };

    if (editingZone) {
      onUpdateZone(payload);
    } else {
      onAddZone(payload);
    }
    resetZoneForm();
  };

  return (
    <div id="location-zone-container" className="space-y-6">

      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <MapPin className="text-blue-600 w-5 h-5" /> Location &amp; Zone Logistics Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain dry-depots, port gates, customer unloading doors, and pricing zone clusters mapped with geofences automatically.
          </p>
        </div>

        {/* Dynamic button switcher based on sub-tab */}
        <div>
          {activeSubTab === 'locations' ? (
            <button
              id="btn-add-location"
              onClick={() => {
                resetLocForm();
                setShowLocForm(true);
              }}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Logistics Node
            </button>
          ) : (
            <button
              id="btn-add-zone"
              onClick={() => {
                resetZoneForm();
                setShowZoneForm(true);
              }}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Define Cluster Zone
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold uppercase tracking-wider">
        <button
          id="tab-locations-mode"
          onClick={() => setActiveSubTab('locations')}
          className={`pb-3 border-b-2 transition ${
            activeSubTab === 'locations' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Compass className="w-4 h-4" /> Geospatial Nodes ({locations.length})
          </span>
        </button>

        <button
          id="tab-zones-mode"
          onClick={() => setActiveSubTab('zones')}
          className={`pb-3 border-b-2 transition ${
            activeSubTab === 'zones' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Pricing Tariff Zones ({zones.length})
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-slate-100">
              <Sliders className="w-3.5 h-3.5 text-slate-400" /> Search Directory
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">KEYWORD</label>
                <input
                  type="text"
                  placeholder="e.g. Horizon Port..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] leading-relaxed text-slate-500">
                <strong>Tariff Geolocation:</strong> Locations mapped inside a particular Zone inherit baseline contractual rates configured in our Tariff matrix automatically.
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* Location form */}
          {activeSubTab === 'locations' && showLocForm && (
            <div id="location-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-blue-600 font-mono text-xs uppercase tracking-wide">
                  {editingLoc ? 'Modify Geospatial Node Data' : 'Add New Point Of Interest Geospatial Node'}
                </span>
                <button onClick={resetLocForm} className="text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
              </div>

              <form onSubmit={handleLocSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
                <div className="space-y-1">
                  <label className="block font-bold">Node Name / Station <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Container Depot Terminal"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Internal System Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PORT-SEC-B"
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Logistics Type <span className="text-red-500">*</span></label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value as LocationType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-bold"
                  >
                    <option value="port">PORT TERMINAL GATE</option>
                    <option value="depot">CONTAINER DRY STACK DEPOT</option>
                    <option value="customer">CUSTOMER STUFFING PLANT</option>
                    <option value="warehouse">DISTRIBUTION WAREHOUSE HUB</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Map Position X (Latitude)</label>
                  <input
                    type="number"
                    value={locLat}
                    onChange={(e) => setLocLat(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Map Position Y (Longitude)</label>
                  <input
                    type="number"
                    value={locLng}
                    onChange={(e) => setLocLng(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Assigned Pricing Zone <span className="text-red-500">*</span></label>
                  <select
                    value={locZone}
                    onChange={(e) => setLocZone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-bold"
                  >
                    <option value="">-- Mapped Zone Cluster --</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name} ({z.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Geofence Radius (meters)</label>
                  <input
                    type="number"
                    value={locGeofence}
                    onChange={(e) => setLocGeofence(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>

                <div className="md:col-span-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition"
                  >
                    Create Registered Node
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Zone form */}
          {activeSubTab === 'zones' && showZoneForm && (
            <div id="zone-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-blue-600 font-mono text-xs uppercase tracking-wide">
                  {editingZone ? 'Modify Tariff Zone Class Structure' : 'Establish New Geographic Cluster Tariff Region'}
                </span>
                <button onClick={resetZoneForm} className="text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
              </div>

              <form onSubmit={handleZoneSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                <div className="space-y-1">
                  <label className="block font-bold">Zone Sector Label Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zone D (West Corridor)"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Zone ISO Code Descriptor <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZN-WST-CORR"
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Cluster Functional Classification Type</label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  >
                    {zoneTypes.map(zt => (
                      <option key={zt.id} value={zt.name}>{zt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Detailed Operational Bounds Boundary</label>
                  <input
                    type="text"
                    placeholder="Limits bounded by heavy prime-mover transit bypass highways..."
                    value={zoneDesc}
                    onChange={(e) => setZoneDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition"
                  >
                    Save Pricing Zone
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Locations content display */}
          {activeSubTab === 'locations' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">NODE / STATION</th>
                    <th className="py-3 px-4">SYSTEM TYPE</th>
                    <th className="py-3 px-4">GEOLOCATION METERS (X, Y)</th>
                    <th className="py-3 px-4">BOUND TARIFF ZONE</th>
                    <th className="py-3 px-4">GEOFENCE BUFFER</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {locations
                    .filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || loc.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(loc => (
                      <tr key={loc.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{loc.name}</div>
                          <span className="font-mono text-[9px] font-bold text-slate-400 uppercase bg-slate-100 border border-slate-200 rounded px-1.5 py-0.2 tracking-wide font-sans">{loc.code}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200 text-slate-600 bg-slate-50">
                            {loc.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 font-bold text-[10px]">
                          LAT: {loc.lat} • LNG: {loc.lng}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {loc.zone}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-slate-600">
                          {loc.geofenceRadius}m Geofence
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            id={`loc-edit-btn-${loc.id}`}
                            onClick={() => handleEditLoc(loc)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            id={`loc-delete-btn-${loc.id}`}
                            onClick={() => onDeleteLocation(loc.id)}
                            className="text-red-600 hover:text-red-800 font-bold text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Zones content display */}
          {activeSubTab === 'zones' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">TARIFF CLUSTER NAME</th>
                    <th className="py-3 px-4">ZONE REGISTRY CODE</th>
                    <th className="py-3 px-4">SYSTEM CLASSIFICATION TYPE</th>
                    <th className="py-3 px-4 font-normal">OPERATIONAL GEOGRAPHY DESCRIPTOR BOUNDS</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {zones
                    .filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()) || z.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(z => {
                      const correlatedNodes = locations.filter(loc => loc.zone === z.name);
                      return (
                        <tr key={z.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {z.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-mono font-bold">
                            <span className="bg-blue-50 border border-blue-150 rounded px-1.5 py-0.2 text-[10px] text-blue-600 font-extrabold">{z.code}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-650 font-bold">
                            {z.type}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-500 max-w-xs truncate">{z.description || 'No boundary description entered'}</div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block">
                              Associated mapped stations: {correlatedNodes.length} nodes list
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              id={`zone-edit-btn-${z.id}`}
                              onClick={() => handleEditZone(z)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              id={`zone-delete-btn-${z.id}`}
                              onClick={() => onDeleteZone(z.id)}
                              className="text-red-600 hover:text-red-800 font-bold text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* DDL Schema Hint inside Geospatial Location config */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs space-y-2 border border-slate-950">
            <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">PostgreSQL Compatibility Mapping</div>
            <p className="text-slate-400">
              The locations are stored matching the <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">logistics_locations</code> table, utilizing <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">POINT</code> geospatial types or simple decimal numeric records with GIS indexes for near-instant geospatial triangulation during haulage.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
