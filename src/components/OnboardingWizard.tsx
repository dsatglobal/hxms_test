/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Forced Corporate Admin onboarding wizard — full-screen takeover.
 * Mandatory: Company Profile, First Region, Invite Region Admin.
 * Skippable: SMTP setup.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Globe, Mail, Send, Copy, CheckCircle2, Circle,
  ChevronRight, LogOut, UserPlus, Loader2,
} from 'lucide-react';
import { Tenant, Region, User, SmtpConfig } from '../types';

interface OnboardingWizardProps {
  tenant: Tenant;
  currentUser: User;
  regions: Region[];
  smtpConfig: SmtpConfig;
  onUpdateTenant: (tenant: Tenant) => void;
  onAddRegion: (region: Region) => void;
  onUpdateSmtpConfig: (cfg: SmtpConfig) => void;
  onAddUser: (user: User) => void;
  onCopyInviteLink: (user: User) => void;
  onLogout: () => void;
  onFinish: () => void;
}

type StepId = 1 | 2 | 3 | 4;

const REPORTING_CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AED', 'INR'];

const emptyRegionForm = {
  name: '', code: '', country: '', currency: '', currencySymbol: '',
  timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY', taxLabel: 'GST',
  taxRate: 18, primaryLanguage: 'en', secondaryLanguage: '', freeTimeDays: 3,
};

export default function OnboardingWizard({
  tenant, currentUser, regions, smtpConfig,
  onUpdateTenant, onAddRegion, onUpdateSmtpConfig, onAddUser,
  onCopyInviteLink, onLogout, onFinish,
}: OnboardingWizardProps) {
  const ob = tenant.onboardingStatus ?? { companyProfile: false, firstRegion: false, smtp: false, firstRegionAdmin: false };

  const firstIncomplete: StepId = !ob.companyProfile ? 1 : !ob.firstRegion ? 2 : !ob.firstRegionAdmin ? 4 : 4;
  const [step, setStep] = useState<StepId>(firstIncomplete);
  const [stepDir, setStepDir] = useState(1);

  // Step 1
  const [companyName, setCompanyName] = useState(tenant.name);
  const [reportingCurrency, setReportingCurrency] = useState(tenant.reportingCurrency ?? 'USD');

  // Step 2
  const [regionForm, setRegionForm] = useState({ ...emptyRegionForm });
  const [createdRegionIds, setCreatedRegionIds] = useState<string[]>([]);

  // Step 3
  const [smtpForm, setSmtpForm] = useState({
    host: '', port: 587, encryption: 'tls' as SmtpConfig['encryption'],
    username: '', password: '', senderName: '', senderEmail: '',
  });
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success'>('idle');

  // Step 4
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRegions, setInviteRegions] = useState<string[]>([]);
  const [invitedUser, setInvitedUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  const goTo = (s: StepId) => { setStepDir(s > step ? 1 : -1); setStep(s); };

  const setObFlag = (flag: keyof NonNullable<Tenant['onboardingStatus']>, extra?: Partial<Tenant>) => {
    onUpdateTenant({
      ...tenant,
      ...extra,
      onboardingStatus: { ...ob, [flag]: true },
    });
  };

  // ── Step handlers ──
  const saveCompanyProfile = () => {
    if (!companyName.trim()) { alert('Company display name is required.'); return; }
    setObFlag('companyProfile', { name: companyName.trim(), reportingCurrency });
    goTo(2);
  };

  const createRegion = (continueAfter: boolean) => {
    if (!regionForm.name.trim() || !regionForm.code.trim()) {
      alert('Region name and code are required.');
      return;
    }
    const reg: Region = {
      id: `reg-${regionForm.code.toLowerCase()}-${Date.now()}`,
      name: regionForm.name.trim(),
      code: regionForm.code.toUpperCase().trim(),
      country: regionForm.country,
      currency: regionForm.currency,
      currencySymbol: regionForm.currencySymbol,
      timezone: regionForm.timezone,
      dateFormat: regionForm.dateFormat,
      taxLabel: regionForm.taxLabel,
      taxRate: Number(regionForm.taxRate),
      primaryLanguage: regionForm.primaryLanguage,
      secondaryLanguage: regionForm.secondaryLanguage || undefined,
      govtRefFields: [],
      freeTimeDays: Number(regionForm.freeTimeDays),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    onAddRegion(reg);
    setCreatedRegionIds(ids => [...ids, reg.code]);
    setObFlag('firstRegion');
    if (continueAfter) goTo(3);
    else setRegionForm({ ...emptyRegionForm });
  };

  const testSmtp = () => {
    setTestState('testing');
    setTimeout(() => setTestState('success'), 1500);
  };

  const saveSmtp = () => {
    onUpdateSmtpConfig({
      host: smtpForm.host,
      port: Number(smtpForm.port),
      username: smtpForm.username,
      senderEmail: smtpForm.senderEmail,
      encryption: smtpForm.encryption,
      active: true,
    });
    setObFlag('smtp');
    goTo(4);
  };

  const wizardRegions = regions.filter(r => r.isActive);

  const sendInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) { alert('Name and email are required.'); return; }
    if (inviteRegions.length === 0) { alert('Select at least one region for this admin.'); return; }
    const user: User = {
      id: `user-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: 'region_admin',
      isActive: true,
      regionId: inviteRegions[0],
      regionAccess: inviteRegions,
      userLevel: 'region_admin',
      status: 'invited',
      inviteToken: `inv-${Math.random().toString(36).slice(2, 10)}`,
      inviteExpiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    };
    onAddUser(user);
    setInvitedUser(user);
    setObFlag('firstRegionAdmin');
  };

  const canFinish = ob.companyProfile && ob.firstRegion && (ob.firstRegionAdmin || !!invitedUser);

  const steps: { id: StepId; label: string; mandatory: boolean; done: boolean }[] = [
    { id: 1, label: 'Company Profile', mandatory: true, done: ob.companyProfile },
    { id: 2, label: 'Create First Region', mandatory: true, done: ob.firstRegion },
    { id: 3, label: 'Email (SMTP) Setup', mandatory: false, done: ob.smtp },
    { id: 4, label: 'Invite Region Admin', mandatory: true, done: ob.firstRegionAdmin || !!invitedUser },
  ];

  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 240 : -240, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -240 : 240, opacity: 0 }),
  };

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelCls = "text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1";

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black"
            style={{ backgroundColor: tenant.logoColor }}
          >
            {companyName.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">{companyName}</div>
            <div className="text-[10px] text-slate-400 font-mono">Initial workspace setup</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            Signed in as <strong className="text-slate-800">{currentUser.name}</strong>
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Progress rail */}
        <div className="w-72 shrink-0 bg-white border-r border-slate-200 p-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Setup Progress</h2>
          <div className="space-y-1">
            {steps.map((s, i) => {
              const isCurrent = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => s.done || isCurrent ? goTo(s.id) : undefined}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition ${isCurrent ? 'bg-blue-50' : s.done ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-70 cursor-default'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      s.done ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {s.done ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isCurrent ? 'text-blue-700' : s.done ? 'text-green-700' : 'text-slate-500'}`}>{s.label}</div>
                      <div className="text-[10px] text-slate-400">{s.mandatory ? 'Required' : 'Optional — can skip'}</div>
                    </div>
                  </button>
                  {i < steps.length - 1 && <div className="ml-[22px] h-4 w-px bg-slate-200" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait" custom={stepDir}>
            {/* ── STEP 1: Company Profile ── */}
            {step === 1 && (
              <motion.div key="ob1" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }} className="max-w-xl mx-auto p-10 space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" /> Company Profile
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">Confirm how your company appears across the workspace.</p>
                </div>
                <div>
                  <label className={labelCls}>Company Display Name *</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow"
                      style={{ backgroundColor: tenant.logoColor }}>
                      {companyName.charAt(0) || '?'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Logo upload coming soon — your initial letter is used as a placeholder.
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Consolidated Reporting Currency</label>
                  <select value={reportingCurrency} onChange={e => setReportingCurrency(e.target.value)} className={inputCls}>
                    {REPORTING_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Cross-region dashboards consolidate into this currency.</p>
                </div>
                <div className="pt-2">
                  <button onClick={saveCompanyProfile}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 shadow-sm">
                    Save &amp; Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: First Region ── */}
            {step === 2 && (
              <motion.div key="ob2" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }} className="max-w-2xl mx-auto p-10 space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" /> Create First Region
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    A region is an operating territory with its own tax, currency, and language settings.
                    Government reference fields can be added later in Region Master.
                  </p>
                </div>

                {createdRegionIds.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Created: {createdRegionIds.join(', ')}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Region Name *</label>
                    <input value={regionForm.name} onChange={e => setRegionForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. India Operations" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Region Code *</label>
                    <input value={regionForm.code} onChange={e => setRegionForm(f => ({ ...f, code: e.target.value }))}
                      placeholder="e.g. IN" maxLength={5} className={`${inputCls} uppercase font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input value={regionForm.country} onChange={e => setRegionForm(f => ({ ...f, country: e.target.value }))}
                      placeholder="e.g. India" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Currency</label>
                      <input value={regionForm.currency} onChange={e => setRegionForm(f => ({ ...f, currency: e.target.value }))}
                        placeholder="INR" className={`${inputCls} font-mono uppercase`} />
                    </div>
                    <div>
                      <label className={labelCls}>Symbol</label>
                      <input value={regionForm.currencySymbol} onChange={e => setRegionForm(f => ({ ...f, currencySymbol: e.target.value }))}
                        placeholder="₹" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Timezone</label>
                    <input value={regionForm.timezone} onChange={e => setRegionForm(f => ({ ...f, timezone: e.target.value }))}
                      placeholder="Asia/Kolkata" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Date Format</label>
                    <select value={regionForm.dateFormat} onChange={e => setRegionForm(f => ({ ...f, dateFormat: e.target.value }))} className={inputCls}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Tax Label</label>
                      <input value={regionForm.taxLabel} onChange={e => setRegionForm(f => ({ ...f, taxLabel: e.target.value }))}
                        placeholder="GST" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Tax Rate %</label>
                      <input type="number" value={regionForm.taxRate} onChange={e => setRegionForm(f => ({ ...f, taxRate: Number(e.target.value) }))}
                        className={`${inputCls} font-mono`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Free Time Days</label>
                    <input type="number" value={regionForm.freeTimeDays} onChange={e => setRegionForm(f => ({ ...f, freeTimeDays: Number(e.target.value) }))}
                      className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Primary Language</label>
                    <input value={regionForm.primaryLanguage} onChange={e => setRegionForm(f => ({ ...f, primaryLanguage: e.target.value }))}
                      placeholder="en" className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Secondary Language</label>
                    <input value={regionForm.secondaryLanguage} onChange={e => setRegionForm(f => ({ ...f, secondaryLanguage: e.target.value }))}
                      placeholder="e.g. ta (optional)" className={`${inputCls} font-mono`} />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button onClick={() => createRegion(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 shadow-sm">
                    Create Region &amp; Continue <ChevronRight className="w-4 h-4" />
                  </button>
                  {createdRegionIds.length > 0 && (
                    <>
                      <button onClick={() => createRegion(false)}
                        className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold rounded-lg">
                        + Add Another Region
                      </button>
                      <button onClick={() => goTo(3)} className="text-sm text-slate-400 hover:text-slate-600 font-semibold">
                        Continue →
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: SMTP (skippable) ── */}
            {step === 3 && (
              <motion.div key="ob3" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }} className="max-w-xl mx-auto p-10 space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" /> Email (SMTP) Setup
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">Optional — invite emails will be simulated until SMTP is configured.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>SMTP Host</label>
                    <input value={smtpForm.host} onChange={e => setSmtpForm(f => ({ ...f, host: e.target.value }))}
                      placeholder="smtp.yourcompany.com" className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Port</label>
                    <input type="number" value={smtpForm.port} onChange={e => setSmtpForm(f => ({ ...f, port: Number(e.target.value) }))}
                      className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Encryption</label>
                    <select value={smtpForm.encryption} onChange={e => setSmtpForm(f => ({ ...f, encryption: e.target.value as SmtpConfig['encryption'] }))} className={inputCls}>
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Username</label>
                    <input value={smtpForm.username} onChange={e => setSmtpForm(f => ({ ...f, username: e.target.value }))} className={`${inputCls} font-mono`} />
                  </div>
                  <div>
                    <label className={labelCls}>Password</label>
                    <input type="password" value={smtpForm.password} onChange={e => setSmtpForm(f => ({ ...f, password: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Sender Name</label>
                    <input value={smtpForm.senderName} onChange={e => setSmtpForm(f => ({ ...f, senderName: e.target.value }))}
                      placeholder="Atlas Notifications" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Sender Email</label>
                    <input type="email" value={smtpForm.senderEmail} onChange={e => setSmtpForm(f => ({ ...f, senderEmail: e.target.value }))}
                      placeholder="noreply@atlas.com" className={`${inputCls} font-mono`} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={testSmtp}
                    disabled={testState === 'testing'}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60"
                  >
                    {testState === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Test Connection
                  </button>
                  {testState === 'success' && (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-sm font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Connection successful ✓
                    </motion.span>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button onClick={saveSmtp}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 shadow-sm">
                    Save &amp; Continue <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => goTo(4)} className="text-sm text-slate-400 hover:text-slate-600 font-semibold">
                    Skip for now
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Invite Region Admin ── */}
            {step === 4 && (
              <motion.div key="ob4" custom={stepDir} variants={stepVariants} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: 'easeInOut' }} className="max-w-xl mx-auto p-10 space-y-5">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" /> Invite Region Admin
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">Region Admins manage day-to-day setup and operations for their territories.</p>
                </div>

                {invitedUser ? (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-green-800">Invite sent to {invitedUser.email} ✓</p>
                      <p className="text-xs text-green-600 mt-1">Regions: {invitedUser.regionAccess.join(', ')} · Expires in 72h</p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => { onCopyInviteLink(invitedUser); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="px-4 py-2 bg-white border border-green-300 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-green-100"
                      >
                        <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied ✓' : 'Copy Invite Link'}
                      </button>
                      <button
                        onClick={() => { setInvitedUser(null); setInviteName(''); setInviteEmail(''); setInviteRegions([]); }}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                      >
                        + Invite Another
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Full Name *</label>
                        <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="e.g. Priya Sharma" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Email *</label>
                        <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="priya@atlas.com" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Region Access * (multi-select)</label>
                      <div className="space-y-1.5 border border-slate-200 rounded-lg p-3 bg-slate-50">
                        {wizardRegions.length === 0 && (
                          <p className="text-xs text-amber-600">No regions yet — go back to Step 2 and create one first.</p>
                        )}
                        {wizardRegions.map(r => (
                          <label key={r.code} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inviteRegions.includes(r.code)}
                              onChange={e => setInviteRegions(prev =>
                                e.target.checked ? [...prev, r.code] : prev.filter(c => c !== r.code))}
                              className="rounded border-slate-300 text-blue-600"
                            />
                            <span className="font-mono font-bold">{r.code}</span> — {r.name}
                          </label>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">One Region Admin can manage multiple regions.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500">
                      Role: <strong className="text-slate-800">Region Administrator</strong>
                    </div>
                    <button onClick={sendInvite}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 shadow-sm">
                      <Send className="w-4 h-4" /> Send Invite
                    </button>
                  </div>
                )}

                {/* Finish */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={onFinish}
                    disabled={!canFinish}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    Finish Setup <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
