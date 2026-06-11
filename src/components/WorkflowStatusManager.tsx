import React, { useState } from 'react';
import { WorkflowMilestoneConfig, ScenarioType, WorkflowMilestoneStepConfig, SupportedLanguage, MasterTranslation } from '../types';
import { Plus, Trash2, Camera, HelpCircle, Sliders, Save, RefreshCw, Layers, Edit, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface WorkflowStatusManagerProps {
  configs: WorkflowMilestoneConfig[];
  onUpdateConfig: (cfg: WorkflowMilestoneConfig) => void;
  onResetToDefault: (scenario: ScenarioType) => void;
  supportedLanguages: SupportedLanguage[];
  masterTranslations: MasterTranslation[];
  onAddMasterTranslation: (mt: MasterTranslation) => void;
  onUpdateMasterTranslation: (mt: MasterTranslation) => void;
}

export default function WorkflowStatusManager({
  configs,
  onUpdateConfig,
  onResetToDefault,
  supportedLanguages = [],
  masterTranslations = [],
  onAddMasterTranslation,
  onUpdateMasterTranslation
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

  // Edit & Translate Step States
  const [editingStep, setEditingStep] = useState<WorkflowMilestoneStepConfig | null>(null);
  const [activeLanguageCode, setActiveLanguageCode] = useState('en');
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [translatedLabel, setTranslatedLabel] = useState('');
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  React.useEffect(() => {
    if (editingStep) {
      if (activeLanguageCode === 'en') {
        setEditLabel(editingStep.label);
        setEditDesc(editingStep.description || '');
      } else {
        const existing = masterTranslations.find(
          t => t.masterRecordId === editingStep.id && 
               t.languageCode === activeLanguageCode && 
               t.masterType === 'workflow_step'
        );
        setTranslatedLabel(existing?.translatedName || '');
        setTranslatedDesc(existing?.translatedDescription || '');
      }
    } else {
      setEditLabel('');
      setEditDesc('');
      setTranslatedLabel('');
      setTranslatedDesc('');
      setSaveMessage('');
    }
  }, [editingStep, activeLanguageCode, masterTranslations]);

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

  const handleSaveEditStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStep) return;

    if (activeLanguageCode === 'en') {
      const updatedSteps = activeConfig.steps.map(s => 
        s.id === editingStep.id 
          ? { ...s, label: editLabel.trim(), description: editDesc.trim() }
          : s
      );
      onUpdateConfig({
        scenario: selectedScenario,
        steps: updatedSteps
      });
      setEditingStep(null);
    } else {
      const existing = masterTranslations.find(
        t => t.masterRecordId === editingStep.id && 
             t.languageCode === activeLanguageCode && 
             t.masterType === 'workflow_step'
      );
      const updatedTrans: MasterTranslation = {
        id: existing?.id || `mt-${Date.now()}`,
        languageCode: activeLanguageCode,
        masterType: 'workflow_step',
        masterRecordId: editingStep.id,
        translatedName: translatedLabel.trim(),
        translatedDescription: translatedDesc.trim(),
        isVerified: existing?.isVerified || false,
        updatedAt: new Date().toISOString()
      };

      if (existing) {
        onUpdateMasterTranslation(updatedTrans);
      } else {
        onAddMasterTranslation(updatedTrans);
      }

      const langName = supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode;
      setSaveMessage(`${langName} saved ✓`);
      setTimeout(() => setSaveMessage(''), 2000);
    }
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
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <p className="text-slate-400 text-[10px] uppercase font-sans font-medium">{st.description}</p>
                          {supportedLanguages.length > 0 && (
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                              <span className="text-[8px] bg-slate-100 px-1 rounded text-slate-500 font-bold">EN</span>
                              {supportedLanguages.map(lang => {
                                const hasTrans = masterTranslations.some(
                                  t => t.masterRecordId === st.id && 
                                       t.languageCode === lang.code && 
                                       t.masterType === 'workflow_step'
                                );
                                return (
                                  <span
                                    key={lang.code}
                                    className={`text-[8px] px-1 rounded font-bold ${
                                      hasTrans 
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                        : 'bg-slate-50 text-slate-300 border border-slate-100 border-dashed'
                                    }`}
                                    title={hasTrans ? `${lang.name} Translation Present` : `${lang.name} Translation Missing`}
                                  >
                                    {lang.code.toUpperCase()}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
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
                        onClick={() => {
                          setEditingStep(st);
                          setActiveLanguageCode('en');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold p-1 hover:bg-indigo-50 rounded flex items-center gap-1 border border-indigo-100 px-2"
                        title="Edit Details / Translation"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Translate</span>
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

      {/* Edit / Translate Step Modal */}
      {editingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                Translate Milestone Stage
              </h3>
              <button
                onClick={() => setEditingStep(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStep} className="p-5 space-y-4">
              <LanguageSwitcher
                supportedLanguages={supportedLanguages}
                activeLanguageCode={activeLanguageCode}
                onChange={setActiveLanguageCode}
              />

              <div className="space-y-4 pt-2">
                {activeLanguageCode === 'en' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Milestone Stage Title*</label>
                      <input
                        type="text"
                        required
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Driver Instructions*</label>
                      <textarea
                        required
                        rows={3}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Milestone Stage Title Translation*</label>
                        <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2.5 rounded-lg mb-1 leading-snug">
                          <strong>English Reference:</strong> {editingStep.label}
                        </div>
                        <input
                          type="text"
                          required
                          dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                          value={translatedLabel}
                          onChange={(e) => setTranslatedLabel(e.target.value)}
                          placeholder="Type stage title translation here..."
                          className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 font-mono">Driver Instructions Translation*</label>
                        <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 p-2.5 rounded-lg mb-1 leading-snug">
                          <strong>English Reference:</strong> {editingStep.description}
                        </div>
                        <textarea
                          required
                          rows={3}
                          dir={supportedLanguages.find(l => l.code === activeLanguageCode)?.isRTL ? 'rtl' : 'ltr'}
                          value={translatedDesc}
                          onChange={(e) => setTranslatedDesc(e.target.value)}
                          placeholder="Type instructions translation here..."
                          className="w-full text-xs px-3 py-2 rounded-lg border-2 border-indigo-500 focus:outline-none font-bold bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100 font-sans">
                {saveMessage && (
                  <span className="text-xs text-green-600 font-bold animate-pulse mr-2">
                    {saveMessage}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingStep(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  {activeLanguageCode === 'en' ? 'Cancel' : 'Done / Exit'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-lg transition shadow-sm"
                >
                  {activeLanguageCode === 'en' 
                    ? 'Commit Milestone changes' 
                    : `Save ${supportedLanguages.find(l => l.code === activeLanguageCode)?.name || activeLanguageCode} Translation`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
