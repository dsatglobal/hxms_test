import React, { useState } from 'react';
import { LocationGeo, LocationType, Zone, ZoneType, Region, Country, SupportedLanguage, MasterTranslation } from '../types';
import { Plus, MapPin, Compass, Shield, Settings, Sliders, List, Trash2, Link, Globe, Flag } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface LocationZoneMasterProps {
  locations: LocationGeo[];
  zones: Zone[];
  zoneTypes: ZoneType[];
  regions: Region[];
  countries: Country[];
  onAddLocation: (loc: LocationGeo) => void;
  onUpdateLocation: (loc: LocationGeo) => void;
  onDeleteLocation: (locId: string) => void;
  onAddZone: (z: Zone) => void;
  onUpdateZone: (z: Zone) => void;
  onDeleteZone: (zId: string) => void;
  onAddRegion: (r: Region) => void;
  onUpdateRegion: (r: Region) => void;
  onDeleteRegion: (rId: string) => void;
  onAddCountry: (c: Country) => void;
  onUpdateCountry: (c: Country) => void;
  onDeleteCountry: (cId: string) => void;
  supportedLanguages: SupportedLanguage[];
  masterTranslations: MasterTranslation[];
  onAddMasterTranslation: (trans: MasterTranslation) => void;
  onUpdateMasterTranslation: (trans: MasterTranslation) => void;
}

export default function LocationZoneMaster({
  locations,
  zones,
  zoneTypes,
  regions,
  countries,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
  onAddRegion,
  onUpdateRegion,
  onDeleteRegion,
  onAddCountry,
  onUpdateCountry,
  onDeleteCountry,
  supportedLanguages,
  masterTranslations,
  onAddMasterTranslation,
  onUpdateMasterTranslation
}: LocationZoneMasterProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<'locations' | 'zones' | 'regions' | 'countries'>('locations');

  // Location Form States
  const [showLocForm, setShowLocForm] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationGeo | null>(null);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locUnLocode, setLocUnLocode] = useState('');
  const [locCountryId, setLocCountryId] = useState('');
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

  // Region Form States
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [regionName, setRegionName] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [regionDesc, setRegionDesc] = useState('');

  // Country Form States
  const [showCountryForm, setShowCountryForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countryName, setCountryName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryRegionId, setCountryRegionId] = useState('');
  const [countryCurrency, setCountryCurrency] = useState('');
  const [countryTaxRate, setCountryTaxRate] = useState<number>(0);

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Location Translation States
  const [locActiveLanguageCode, setLocActiveLanguageCode] = useState<string>('en');
  const [locTranslatedName, setLocTranslatedName] = useState('');
  const [locSaveMessage, setLocSaveMessage] = useState('');

  React.useEffect(() => {
    if (editingLoc && locActiveLanguageCode !== 'en') {
      const match = masterTranslations.find(
        t => t.masterRecordId === editingLoc.id && 
             t.languageCode === locActiveLanguageCode && 
             t.masterType === 'location_type'
      );
      setLocTranslatedName(match?.translatedName || '');
    } else {
      setLocTranslatedName('');
    }
    setLocSaveMessage('');
  }, [editingLoc, locActiveLanguageCode, masterTranslations]);

  // Zone Translation States
  const [zoneActiveLanguageCode, setZoneActiveLanguageCode] = useState<string>('en');
  const [zoneTranslatedName, setZoneTranslatedName] = useState('');
  const [zoneSaveMessage, setZoneSaveMessage] = useState('');

  React.useEffect(() => {
    if (editingZone && zoneActiveLanguageCode !== 'en') {
      const match = masterTranslations.find(
        t => t.masterRecordId === editingZone.id && 
             t.languageCode === zoneActiveLanguageCode && 
             t.masterType === 'zone_type'
      );
      setZoneTranslatedName(match?.translatedName || '');
    } else {
      setZoneTranslatedName('');
    }
    setZoneSaveMessage('');
  }, [editingZone, zoneActiveLanguageCode, masterTranslations]);

  const resetLocForm = () => {
    setEditingLoc(null);
    setLocName('');
    setLocCode('');
    setLocUnLocode('');
    setLocCountryId('');
    setLocType('customer');
    setLocLat(250);
    setLocLng(250);
    setLocZone('');
    setLocGeofence(300);
    setLocActiveLanguageCode('en');
    setLocTranslatedName('');
    setLocSaveMessage('');
    setShowLocForm(false);
  };

  const resetZoneForm = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneCode('');
    setZoneType('');
    setZoneDesc('');
    setZoneActiveLanguageCode('en');
    setZoneTranslatedName('');
    setZoneSaveMessage('');
    setShowZoneForm(false);
  };

  const resetRegionForm = () => {
    setEditingRegion(null);
    setRegionName('');
    setRegionCode('');
    setRegionDesc('');
    setShowRegionForm(false);
  };

  const resetCountryForm = () => {
    setEditingCountry(null);
    setCountryName('');
    setCountryCode('');
    setCountryRegionId('');
    setCountryCurrency('');
    setCountryTaxRate(0);
    setShowCountryForm(false);
  };

  const handleEditLoc = (loc: LocationGeo) => {
    setEditingLoc(loc);
    setLocName(loc.name);
    setLocCode(loc.code);
    setLocUnLocode(loc.unLocode || '');
    setLocCountryId(loc.countryId || '');
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

  const handleEditRegion = (reg: Region) => {
    setEditingRegion(reg);
    setRegionName(reg.name);
    setRegionCode(reg.code);
    setRegionDesc(reg.description || '');
    setShowRegionForm(true);
  };

  const handleEditCountry = (cnt: Country) => {
    setEditingCountry(cnt);
    setCountryName(cnt.name);
    setCountryCode(cnt.code);
    setCountryRegionId(cnt.regionId);
    setCountryCurrency(cnt.currency);
    setCountryTaxRate(cnt.taxRate);
    setShowCountryForm(true);
  };

  const handleLocSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLoc && locActiveLanguageCode !== 'en') {
      const existingTranslation = masterTranslations.find(
        t => t.masterRecordId === editingLoc.id && 
             t.languageCode === locActiveLanguageCode && 
             t.masterType === 'location_type'
      );

      if (existingTranslation) {
        onUpdateMasterTranslation({
          ...existingTranslation,
          translatedName: locTranslatedName.trim(),
          isVerified: true,
          updatedAt: new Date().toISOString()
        });
      } else {
        onAddMasterTranslation({
          id: `mt-loc-${editingLoc.id}-${locActiveLanguageCode}-${Date.now()}`,
          languageCode: locActiveLanguageCode,
          masterType: 'location_type',
          masterRecordId: editingLoc.id,
          translatedName: locTranslatedName.trim(),
          isVerified: true,
          updatedAt: new Date().toISOString()
        });
      }

      setLocSaveMessage(`Translation for ${supportedLanguages.find(l => l.code === locActiveLanguageCode)?.name || locActiveLanguageCode} saved successfully.`);
      setTimeout(() => setLocSaveMessage(''), 3000);
      return;
    }

    if (!locName.trim() || !locCode.trim() || !locZone || !locUnLocode.trim() || !locCountryId) {
      alert('Location Name, Internal Code, UN/LOCODE, Country and Zone mapping are all required.');
      return;
    }

    const cleanUnLocode = locUnLocode.toUpperCase().trim();
    if (cleanUnLocode.length !== 5) {
      alert('UN/LOCODE must be a standard 5-character international code (e.g., USLAX, SGPIN).');
      return;
    }

    const payload: LocationGeo = {
      id: editingLoc ? editingLoc.id : `loc-${Date.now()}`,
      name: locName.trim(),
      code: locCode.toUpperCase().trim(),
      unLocode: cleanUnLocode,
      countryId: locCountryId,
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

    if (editingZone && zoneActiveLanguageCode !== 'en') {
      const existingTranslation = masterTranslations.find(
        t => t.masterRecordId === editingZone.id && 
             t.languageCode === zoneActiveLanguageCode && 
             t.masterType === 'zone_type'
      );

      if (existingTranslation) {
        onUpdateMasterTranslation({
          ...existingTranslation,
          translatedName: zoneTranslatedName.trim(),
          isVerified: true,
          updatedAt: new Date().toISOString()
        });
      } else {
        onAddMasterTranslation({
          id: `mt-zone-${editingZone.id}-${zoneActiveLanguageCode}-${Date.now()}`,
          languageCode: zoneActiveLanguageCode,
          masterType: 'zone_type',
          masterRecordId: editingZone.id,
          translatedName: zoneTranslatedName.trim(),
          isVerified: true,
          updatedAt: new Date().toISOString()
        });
      }

      setZoneSaveMessage(`Translation for ${supportedLanguages.find(l => l.code === zoneActiveLanguageCode)?.name || zoneActiveLanguageCode} saved successfully.`);
      setTimeout(() => setZoneSaveMessage(''), 3000);
      return;
    }

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

  const handleRegionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionName.trim() || !regionCode.trim()) {
      alert('Region Name and Code are required.');
      return;
    }

    const payload: Region = {
      id: editingRegion ? editingRegion.id : `reg-${Date.now()}`,
      name: regionName.trim(),
      code: regionCode.toUpperCase().trim(),
      description: regionDesc.trim()
    };

    if (editingRegion) {
      onUpdateRegion(payload);
    } else {
      onAddRegion(payload);
    }
    resetRegionForm();
  };

  const handleCountrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName.trim() || !countryCode.trim() || !countryRegionId) {
      alert('Country Name, ISO Code, and Region mapping are mandatory.');
      return;
    }

    const payload: Country = {
      id: editingCountry ? editingCountry.id : `cnt-${Date.now()}`,
      name: countryName.trim(),
      code: countryCode.toUpperCase().trim().slice(0, 2),
      regionId: countryRegionId,
      currency: countryCurrency.toUpperCase().trim() || 'USD',
      taxRate: Number(countryTaxRate) || 0
    };

    if (editingCountry) {
      onUpdateCountry(payload);
    } else {
      onAddCountry(payload);
    }
    resetCountryForm();
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
          {activeSubTab === 'locations' && (
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
          )}
          {activeSubTab === 'zones' && (
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
          {activeSubTab === 'regions' && (
            <button
              id="btn-add-region"
              onClick={() => {
                resetRegionForm();
                setShowRegionForm(true);
              }}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Global Region
            </button>
          )}
          {activeSubTab === 'countries' && (
            <button
              id="btn-add-country"
              onClick={() => {
                resetCountryForm();
                setShowCountryForm(true);
              }}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Register Country Code
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

        <button
          id="tab-regions-mode"
          onClick={() => setActiveSubTab('regions')}
          className={`pb-3 border-b-2 transition ${
            activeSubTab === 'regions' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-4 h-4" /> Global Regions ({regions.length})
          </span>
        </button>

        <button
          id="tab-countries-mode"
          onClick={() => setActiveSubTab('countries')}
          className={`pb-3 border-b-2 transition ${
            activeSubTab === 'countries' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Flag className="w-4 h-4" /> Countries ISO ({countries.length})
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

              {editingLoc && (
                <div className="bg-slate-50 border border-slate-200/60 rounded p-3 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Magento-Style Store view Translation</span>
                    <LanguageSwitcher
                      supportedLanguages={supportedLanguages}
                      activeLanguageCode={locActiveLanguageCode}
                      onChange={setLocActiveLanguageCode}
                    />
                  </div>
                  {locSaveMessage && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded border border-emerald-200/60 shrink-0">
                      {locSaveMessage}
                    </span>
                  )}
                </div>
              )}

              <form onSubmit={handleLocSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
                {locActiveLanguageCode === 'en' ? (
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
                ) : (
                  <div className="space-y-1 bg-blue-50/20 border border-blue-200/50 p-2.5 rounded">
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Base English reference Name</label>
                    <div className="font-sans text-slate-800 font-black text-xs mb-2 bg-slate-100/60 px-2 py-1 rounded">{locName || "N/A"}</div>
                    <label className="block font-bold">Translated Name ({supportedLanguages.find(l => l.code === locActiveLanguageCode)?.name}) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder={`Enter translation in ${supportedLanguages.find(l => l.code === locActiveLanguageCode)?.name || locActiveLanguageCode}...`}
                      value={locTranslatedName}
                      onChange={(e) => setLocTranslatedName(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded px-2.5 py-1.5 text-slate-800 font-extrabold"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block font-bold">Internal System Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={locActiveLanguageCode !== 'en'}
                    placeholder="e.g. PORT-SEC-B"
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">UN/LOCODE Standard <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={locActiveLanguageCode !== 'en'}
                    maxLength={5}
                    placeholder="e.g. SGPIN"
                    value={locUnLocode}
                    onChange={(e) => setLocUnLocode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Sovereign Country Mapping <span className="text-red-500">*</span></label>
                  <select
                    required
                    disabled={locActiveLanguageCode !== 'en'}
                    value={locCountryId}
                    onChange={(e) => setLocCountryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-bold disabled:opacity-60"
                  >
                    <option value="">-- Mapped Country --</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Logistics Type <span className="text-red-500">*</span></label>
                  <select
                    value={locType}
                    disabled={locActiveLanguageCode !== 'en'}
                    onChange={(e) => setLocType(e.target.value as LocationType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-bold disabled:opacity-60"
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
                    disabled={locActiveLanguageCode !== 'en'}
                    value={locLat}
                    onChange={(e) => setLocLat(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Map Position Y (Longitude)</label>
                  <input
                    type="number"
                    disabled={locActiveLanguageCode !== 'en'}
                    value={locLng}
                    onChange={(e) => setLocLng(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Assigned Pricing Zone <span className="text-red-500">*</span></label>
                  <select
                    value={locZone}
                    disabled={locActiveLanguageCode !== 'en'}
                    onChange={(e) => setLocZone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-bold disabled:opacity-60"
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
                    disabled={locActiveLanguageCode !== 'en'}
                    value={locGeofence}
                    onChange={(e) => setLocGeofence(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="md:col-span-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition"
                  >
                    {locActiveLanguageCode === 'en' 
                      ? (editingLoc ? 'Update Registered Node' : 'Create Registered Node') 
                      : `Save ${supportedLanguages.find(l => l.code === locActiveLanguageCode)?.name || locActiveLanguageCode} Translation`}
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

              {editingZone && (
                <div className="bg-slate-50 border border-slate-200/60 rounded p-3 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Magento-Style Store view Translation</span>
                    <LanguageSwitcher
                      supportedLanguages={supportedLanguages}
                      activeLanguageCode={zoneActiveLanguageCode}
                      onChange={setZoneActiveLanguageCode}
                    />
                  </div>
                  {zoneSaveMessage && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded border border-emerald-200/60 shrink-0">
                      {zoneSaveMessage}
                    </span>
                  )}
                </div>
              )}

              <form onSubmit={handleZoneSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                {zoneActiveLanguageCode === 'en' ? (
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
                ) : (
                  <div className="space-y-1 bg-blue-50/20 border border-blue-200/50 p-2.5 rounded">
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Base English reference Name</label>
                    <div className="font-sans text-slate-800 font-black text-xs mb-2 bg-slate-100/60 px-2 py-1 rounded">{zoneName || "N/A"}</div>
                    <label className="block font-bold">Translated Name ({supportedLanguages.find(l => l.code === zoneActiveLanguageCode)?.name}) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder={`Enter translation in ${supportedLanguages.find(l => l.code === zoneActiveLanguageCode)?.name || zoneActiveLanguageCode}...`}
                      value={zoneTranslatedName}
                      onChange={(e) => setZoneTranslatedName(e.target.value)}
                      className="w-full bg-white border border-blue-300 rounded px-2.5 py-1.5 text-slate-800 font-extrabold"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block font-bold">Zone ISO Code Descriptor <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={zoneActiveLanguageCode !== 'en'}
                    placeholder="e.g. ZN-WST-CORR"
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Cluster Functional Classification Type</label>
                  <select
                    value={zoneType}
                    disabled={zoneActiveLanguageCode !== 'en'}
                    onChange={(e) => setZoneType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 disabled:opacity-60"
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
                    disabled={zoneActiveLanguageCode !== 'en'}
                    placeholder="Limits bounded by heavy prime-mover transit bypass highways..."
                    value={zoneDesc}
                    onChange={(e) => setZoneDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition"
                  >
                    {zoneActiveLanguageCode === 'en' 
                      ? 'Save Pricing Zone' 
                      : `Save ${supportedLanguages.find(l => l.code === zoneActiveLanguageCode)?.name || zoneActiveLanguageCode} Translation`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Region form */}
          {activeSubTab === 'regions' && showRegionForm && (
            <div id="region-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-blue-600 font-mono text-xs uppercase tracking-wide">
                  {editingRegion ? 'Modify Global Region Registry' : 'Define New Operational Global Region'}
                </span>
                <button onClick={resetRegionForm} className="text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
              </div>

              <form onSubmit={handleRegionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                <div className="space-y-1">
                  <label className="block font-bold">Region Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asia-Pacific"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Region Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APAC"
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block font-bold">Description / Operational Coverage</label>
                  <input
                    type="text"
                    placeholder="Coverage guidelines, regional hubs, default detention limits..."
                    value={regionDesc}
                    onChange={(e) => setRegionDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition"
                  >
                    Save Global Region
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Country form */}
          {activeSubTab === 'countries' && showCountryForm && (
            <div id="country-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-blue-600 font-mono text-xs uppercase tracking-wide">
                  {editingCountry ? 'Modify Country Parameter Overrides' : 'Register New Country System ISO Profile'}
                </span>
                <button onClick={resetCountryForm} className="text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
              </div>

              <form onSubmit={handleCountrySubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
                <div className="space-y-1">
                  <label className="block font-bold">Country Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Singapore"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">ISO 2-Letter Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="e.g. SG"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Parent Region Assignment <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={countryRegionId}
                    onChange={(e) => setCountryRegionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-bold"
                  >
                    <option value="">-- Mapped Global Region --</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Default Currency ISO</label>
                  <input
                    type="text"
                    placeholder="e.g. SGD"
                    value={countryCurrency}
                    onChange={(e) => setCountryCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Sovereign Tax Rate Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 9.00"
                    value={countryTaxRate}
                    onChange={(e) => setCountryTaxRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800"
                  />
                </div>

                <div className="lg:col-span-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition"
                  >
                    Save Country Profile
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
                    <th className="py-3 px-4">UN/LOCODE</th>
                    <th className="py-3 px-4">SOVEREIGN COUNTRY</th>
                    <th className="py-3 px-4">SYSTEM TYPE</th>
                    <th className="py-3 px-4">GEOLOCATION METERS (X, Y)</th>
                    <th className="py-3 px-4">BOUND TARIFF ZONE</th>
                    <th className="py-3 px-4">GEOFENCE BUFFER</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {locations
                    .filter(loc => {
                      const matchedCountry = countries.find(c => c.id === loc.countryId);
                      const q = searchQuery.toLowerCase();
                      return (
                        loc.name.toLowerCase().includes(q) || 
                        loc.code.toLowerCase().includes(q) ||
                        (loc.unLocode && loc.unLocode.toLowerCase().includes(q)) ||
                        (matchedCountry && matchedCountry.name.toLowerCase().includes(q))
                      );
                    })
                    .map(loc => {
                      const matchedCountry = countries.find(c => c.id === loc.countryId);
                      return (
                        <tr key={loc.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{loc.name}</div>
                            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase bg-slate-100 border border-slate-200 rounded px-1.5 py-0.2 tracking-wide font-sans">{loc.code}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className="bg-teal-50 border border-teal-200 rounded px-2 py-0.5 text-[10px] uppercase text-teal-750 font-bold tracking-wide">
                              {loc.unLocode || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-bold">
                            {matchedCountry ? `${matchedCountry.name} (${matchedCountry.code})` : 'N/A'}
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
                            {loc.geofenceRadius}m
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
                      );
                    })}
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

          {/* Regions content display */}
          {activeSubTab === 'regions' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">GLOBAL REGION NAME</th>
                    <th className="py-3 px-4">REGIONAL SYSTEM CODE</th>
                    <th className="py-3 px-4">OPERATIONAL HUB &amp; COVERAGE DESCRIPTOR</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {regions
                    .filter(reg => reg.name.toLowerCase().includes(searchQuery.toLowerCase()) || reg.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(reg => {
                      const correlatedCountries = countries.filter(c => c.regionId === reg.id);
                      return (
                        <tr key={reg.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {reg.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-mono font-bold">
                            <span className="bg-blue-50 border border-blue-150 rounded px-1.5 py-0.2 text-[10px] text-blue-600 font-extrabold">{reg.code}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-500 max-w-sm truncate">{reg.description || 'No operational coverage notes'}</div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block">
                              Affiliated registered countries: {correlatedCountries.map(c => c.name).join(', ') || 'None'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              id={`reg-edit-btn-${reg.id}`}
                              onClick={() => handleEditRegion(reg)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              id={`reg-delete-btn-${reg.id}`}
                              onClick={() => onDeleteRegion(reg.id)}
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

          {/* Countries content display */}
          {activeSubTab === 'countries' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left text-xs bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">COUNTRY NAME</th>
                    <th className="py-3 px-4">ISO 2-LETTER CODE</th>
                    <th className="py-3 px-4">PARENT REGION</th>
                    <th className="py-3 px-4">DEFAULT CURRENCY</th>
                    <th className="py-3 px-4">SOVEREIGN TAX RATE %</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {countries
                    .filter(cnt => cnt.name.toLowerCase().includes(searchQuery.toLowerCase()) || cnt.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(cnt => {
                      const matchedRegion = regions.find(r => r.id === cnt.regionId);
                      return (
                        <tr key={cnt.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {cnt.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-mono font-bold">
                            <span className="bg-slate-100 border border-slate-250 rounded px-2 py-0.5 text-[10px] font-mono uppercase text-slate-700">{cnt.code}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-650 font-bold">
                            {matchedRegion ? `${matchedRegion.name} (${matchedRegion.code})` : 'Unassigned'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold col-span-1">
                            {cnt.currency}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                            {cnt.taxRate.toFixed(2)}%
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              id={`cnt-edit-btn-${cnt.id}`}
                              onClick={() => handleEditCountry(cnt)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              id={`cnt-delete-btn-${cnt.id}`}
                              onClick={() => onDeleteCountry(cnt.id)}
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
              The locations are stored matching the <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">logistics_locations</code> and <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">logistics_zones</code> tables. With our new dynamic structure, we introduce relational integrity mappings for <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">logistics_regions</code> and <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">logistics_countries</code>, automatically propagating tax properties, region divisions, and sovereign currencies during global haulage billing queries.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
