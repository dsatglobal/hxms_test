import React, { useState } from 'react';
import { TariffRate, ScenarioType, ContainerSizeCode, Zone } from '../types';
import { Plus, DollarSign, Tag, Clipboard, ShieldAlert, Layers } from 'lucide-react';

interface RateCardManagerProps {
  tariffs: TariffRate[];
  zones: Zone[];
  onAddTariff: (t: TariffRate) => void;
  onDeleteTariff: (tId: string) => void;
}

export default function RateCardManager({
  tariffs,
  zones,
  onAddTariff,
  onDeleteTariff
}: RateCardManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [scenario, setScenario] = useState<ScenarioType>('IMP');
  const [fromZone, setFromZone] = useState('');
  const [toZone, setToZone] = useState('');
  const [size, setSize] = useState<ContainerSizeCode>('40HC');
  const [amount, setAmount] = useState(400);

  // Filters
  const [filterScenario, setFilterScenario] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromZone || !toZone || !amount) {
      alert('Source, destination zones, and decimal rate amounts are mandatory.');
      return;
    }

    onAddTariff({
      id: `tf-${Date.now()}`,
      scenario,
      fromZone,
      toZone,
      size,
      amount: Number(amount)
    });

    setFromZone('');
    setToZone('');
    setAmount(400);
    setShowAddForm(false);
  };

  const filteredTariffs = tariffs.filter(t => {
    const matchScenario = filterScenario === 'all' || t.scenario === filterScenario;
    const matchSize = filterSize === 'all' || t.size === filterSize;
    return matchScenario && matchSize;
  });

  return (
    <div id="rate-manager-container" className="space-y-6">

      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <DollarSign className="text-blue-600 w-5 h-5" /> Base Rate Card Tariff Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain zone-to-zone baseline transport tariff rate cards. Used for auto-completing contract quotes on bookings.
          </p>
        </div>

        <button
          id="btn-add-tariff"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Baseline Tariff
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">

        {/* Filters panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Filter Cards
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">SCENARIO TYPE</label>
                <select
                  value={filterScenario}
                  onChange={(e) => setFilterScenario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
                >
                  <option value="all">-- All Scenarios --</option>
                  <option value="IMP">IMP (Import Laden)</option>
                  <option value="EXP">EXP (Export stuffing)</option>
                  <option value="Inland">Inland (Transfer)</option>
                  <option value="EMTY">EMTY (Empty repos)</option>
                  <option value="RETURN">RETURN (Return empty)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">CONTAINER TYPE SIZE</label>
                <select
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
                >
                  <option value="all">-- All Sizes --</option>
                  <option value="20GP">20GP Standard</option>
                  <option value="40GP">40GP Standard</option>
                  <option value="40HC">40HC High Cube</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-500 leading-relaxed text-[11px] space-y-2">
            <div className="font-bold text-slate-700 text-xs">Contract Rate Overrides:</div>
            <p>
              Quotation Builder lets billing agents specify customer-specific contractual overrides that bypass this global baseline tariff registry.
            </p>
          </div>
        </div>

        {/* Form and rate tables list */}
        <div className="lg:col-span-3 space-y-6">

          {showAddForm && (
            <div id="tariff-form-block" className="bg-white border-2 border-blue-500 rounded-lg p-5 space-y-4 shadow-md">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-blue-600 font-mono tracking-wide uppercase">
                  Establish Global Transport Rate Clause
                </span>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 font-bold">Cancel</button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                
                <div className="space-y-1">
                  <label className="block font-bold">Operation Scenario</label>
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value as ScenarioType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800"
                  >
                    <option value="IMP">IMP (Import haulage)</option>
                    <option value="EXP">EXP (Export haulage)</option>
                    <option value="Inland">Inland (Interplant/Store)</option>
                    <option value="EMTY">EMTY (Depot transfer)</option>
                    <option value="RETURN">RETURN (Return empty)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Origin / Pickup Pricing Zone <span className="text-red-500">*</span></label>
                  <select
                    value={fromZone}
                    onChange={(e) => setFromZone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-bold"
                  >
                    <option value="">-- Choose Origin Zone --</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name} ({z.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Destination Pricing Zone <span className="text-red-500">*</span></label>
                  <select
                    value={toZone}
                    onChange={(e) => setToZone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-bold"
                  >
                    <option value="">-- Choose Target Zone --</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name} ({z.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Container Size Code Class</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as ContainerSizeCode)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800"
                  >
                    <option value="20GP">20GP Standard Container</option>
                    <option value="40GP">40GP Standard Container</option>
                    <option value="40HC">40HC High Cube Container</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold">Base Tariff Rate Cost ($) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 font-mono"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded transition shadow-xs"
                  >
                    Save Tariff Route Card
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tariffs List */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <table className="w-full border-collapse text-left text-xs bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">SCENARIO TYPE</th>
                  <th className="py-3 px-4">OUTLET PICKUP / ORIGIN ZONE</th>
                  <th className="py-3 px-4">RECEIVING / DESTINATION ZONE</th>
                  <th className="py-3 px-4">CONTAINER DIMENSION</th>
                  <th className="py-3 px-4">BASE PRICE CHARGE</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTariffs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching pricing tariffs found.
                    </td>
                  </tr>
                ) : (
                  filteredTariffs.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.scenario === 'IMP' ? 'bg-indigo-50 text-indigo-700' :
                          t.scenario === 'EXP' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {t.scenario}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">{t.fromZone}</td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">{t.toZone}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-600 uppercase text-[10px]">{t.size}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[13px]">${t.amount}.00</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`tariff-delete-btn-${t.id}`}
                          onClick={() => onDeleteTariff(t.id)}
                          className="text-red-600 hover:text-red-800 font-[700] hover:scale-[1.03] transition-transform text-xs"
                        >
                          Delete
                        </button>
                      </td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* DDL Schema Hint inside Rate Card config */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs space-y-2 border border-slate-950">
            <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">PostgreSQL Compatibility Mapping</div>
            <p className="text-slate-400">
              Contract and baseline rates map to <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">billing_tariffs</code>. Constraints ensure decimal money quantities are greater than zero: <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">CONSTRAINT chk_positive_tariffs_amount CHECK (amount &gt; 0)</code>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
