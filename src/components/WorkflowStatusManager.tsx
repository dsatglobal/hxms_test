import React, { useState } from 'react';
import { WorkflowMilestoneConfig, ScenarioType, WorkflowMilestoneStepConfig } from '../types';
import { Plus, Trash2, Camera, HelpCircle, Sliders, Save, RefreshCw, Layers } from 'lucide-react';

interface WorkflowStatusManagerProps {
  configs: WorkflowMilestoneConfig[];
  onUpdateConfig: (cfg: WorkflowMilestoneConfig) => void;
  onResetToDefault: (scenario: ScenarioType) => void;
}

export default function WorkflowStatusManager({
  configs,
  onUpdateConfig,
  onResetToDefault
}: WorkflowStatusManagerProps) {
  
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('IMP');
  
  // Find matching config or create a fallback
  const activeConfig = configs.find(c => c.scenario === selectedScenario) || {
    scenario: selectedScenario,
    steps: []
  };

  // Form states matching new step
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEvidence, setNewEvidence] = useState(false);

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newStep: WorkflowMilestoneStepConfig = {
      id: `step-${Date.now()}`,
      label: newLabel.trim(),
      description: newDesc.trim() || 'Custom validation checkpoint',
      requiresEvidence: newEvidence
    };

    const updatedSteps = [...activeConfig.steps, newStep];
    onUpdateConfig({
      scenario: selectedScenario,
      steps: updatedSteps
    });

    setNewLabel('');
    setNewDesc('');
    setNewEvidence(false);
  };

  const handleDeleteStep = (stepId: string) => {
    const updatedSteps = activeConfig.steps.filter(s => s.id !== stepId);
    onUpdateConfig({
      scenario: selectedScenario,
      steps: updatedSteps
    });
  };

  const handleToggleEvidence = (stepId: string) => {
    const updatedSteps = activeConfig.steps.map(s => 
      s.id === stepId ? { ...s, requiresEvidence: !s.requiresEvidence } : s
    );
    onUpdateConfig({
      scenario: selectedScenario,
      steps: updatedSteps
    });
  };

  const handleReorderUp = (index: number) => {
    if (index === 0) return;
    const steps = [...activeConfig.steps];
    const prev = steps[index - 1];
    steps[index - 1] = steps[index];
    steps[index] = prev;
    onUpdateConfig({
      scenario: selectedScenario,
      steps
    });
  };

  const handleReorderDown = (index: number) => {
    if (index === activeConfig.steps.length - 1) return;
    const steps = [...activeConfig.steps];
    const next = steps[index + 1];
    steps[index + 1] = steps[index];
    steps[index] = next;
    onUpdateConfig({
      scenario: selectedScenario,
      steps
    });
  };

  return (
    <div id="workflow-manager-container" className="space-y-6">

      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 text-xs">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <Layers className="text-blue-600 w-5 h-5 animate-spin-slow" /> Workflow &amp; Milestone Status Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Configure dynamic driver check-sheets and execution milestone stages in sequence per operation flow.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Verify: Reset this flow steps to native system factory presets?')) {
              onResetToDefault(selectedScenario);
            }
          }}
          className="px-3.5 py-1.5 rounded text-[11px] font-bold text-slate-600 border border-slate-250 hover:bg-slate-50 transition flex items-center gap-1 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Restore Standard Preset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs">

        {/* Selection sidebar menu */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-xs">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5 text-xs">
              <Sliders className="w-3.5 h-3.5 text-blue-600" /> Choose Transit Flow
            </h3>

            <div className="flex flex-col gap-1.5 text-xs">
              {(['IMP', 'EXP', 'Inland', 'EMTY', 'RETURN'] as ScenarioType[]).map((sc) => (
                <button
                  key={sc}
                  onClick={() => setSelectedScenario(sc)}
                  className={`w-full text-left p-2.5 rounded font-bold transition flex items-center justify-between ${
                    selectedScenario === sc 
                      ? 'bg-blue-600/10 text-blue-700 border-l-4 border-blue-600' 
                      : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>
                    {sc === 'IMP' ? 'Import (Laden)' :
                     sc === 'EXP' ? 'Export (Stuffing)' :
                     sc === 'Inland' ? 'Inland Transfer' :
                     sc === 'EMTY' ? 'Empty Repo' : 'Return (De-hire)'}
                  </span>
                  <span className="bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded text-[9px] uppercase font-mono">
                    {sc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 leading-normal text-slate-500 font-medium space-y-2">
            <div className="text-slate-800 font-bold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Operational Impact
            </div>
            <p>
              Workflow Status Manager lets your operation managers configure how checkpoints load on the <strong>Driver Milestone App</strong>. Toggling <em>"Require Evidence"</em> prompts the operator to click a photgraphic check before booking completion.
            </p>
          </div>
        </div>

        {/* Main interactive stage sequencing builder */}
        <div className="lg:col-span-3 space-y-4">

          {/* New checkpoint form */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-800 text-xs uppercase font-mono tracking-wide">
              Append Milestone Stage for {selectedScenario === 'IMP' ? 'Import (Laden)' : selectedScenario}
            </h3>

            <form onSubmit={handleAddStep} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">Stage Title / Action</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weighbridge Customs Clearance"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">Driver Instructions Text</label>
                <input
                  type="text"
                  placeholder="e.g. Slide containers, lock and snap seals..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center gap-4 py-2 text-slate-650 font-bold self-center">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={newEvidence}
                    onChange={(e) => setNewEvidence(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Require POD Evidence Photo</span>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 px-4 rounded font-sans uppercase text-[10px]"
                >
                  Append Step
                </button>
              </div>
            </form>
          </div>

          {/* List of current milestones in sequence */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex justify-between items-center">
              <span className="font-bold text-slate-700 uppercase font-mono tracking-wide text-[10px]">Active Steps Execution Sequence</span>
              <span className="text-[10px] text-slate-400 font-bold font-sans">
                Total Steps: {activeConfig.steps.length} Sequence Phases
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activeConfig.steps.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic font-medium">Currently no checkpoint procedures configured. Appending steps recommended.</div>
              ) : (
                activeConfig.steps.map((st, idx) => (
                  <div key={st.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition">
                    
                    <div className="flex items-center gap-3">
                      {/* Interactive re-order dots */}
                      <div className="flex flex-col gap-0.5">
                        <button 
                          onClick={() => handleReorderUp(idx)}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-20 text-[10px] px-1 font-bold"
                          title="Move step up"
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => handleReorderDown(idx)}
                          disabled={idx === activeConfig.steps.length - 1}
                          className="text-slate-400 hover:text-slate-700 disabled:opacity-20 text-[10px] px-1 font-bold"
                          title="Move step down"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="h-6 w-6 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 flex items-center justify-center font-mono border border-slate-200">
                        0{idx + 1}
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {st.label}
                          {st.requiresEvidence && (
                            <span className="inline-flex items-center gap-1 text-[8px] tracking-wider uppercase font-bold bg-purple-50 text-purple-700 border border-purple-150 rounded px-1.5 py-0.2">
                              <Camera className="w-2.5 h-2.5" /> Requires Photo Verification
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[10px] uppercase font-sans font-medium mt-0.5">{st.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEvidence(st.id)}
                        className="text-[10.5px] font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 rounded p-1 px-2"
                      >
                        Evidence Toggle
                      </button>
                      <button
                        onClick={() => handleDeleteStep(st.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold p-1 hover:bg-red-50 rounded"
                        title="Delete Milestone Stage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* DDL Schema Hint inside Milestone Config */}
          <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs space-y-2 border border-slate-950">
            <div className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">PostgreSQL Compatibility Mapping</div>
            <p className="text-slate-400">
              The configurations are persistent in <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">workflow_schemas</code>. Sequence indices are protected by transaction logs checking <code className="text-slate-100 bg-slate-950 px-1 py-0.5 rounded font-mono">ON UPDATE CASCADE</code> to prevent routing voids during driver emulator sessions.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
