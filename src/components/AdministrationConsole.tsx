import React, { useState } from 'react';
import { Tenant, User, UserRole, SmtpConfig, EmailTemplate, Region, SupportedLanguage, TranslationEntry } from '../types';
import {
  Building,
  Users,
  Mail,

  Save,
  Plus,
  UserPlus,
  Lock,
  Eye,

  Edit,
  Check,
  ArrowRight,
  Server,
  Globe2,
  ClipboardCopy,
  RefreshCw
} from 'lucide-react';
import TranslationManager from './TranslationManager';

interface AdministrationConsoleProps {
  activeTenant: Tenant;
  onUpdateTenant: (t: Tenant) => void;
  // RBAC
  users: User[];
  currentUser: User;
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  onSwitchUser: (userId: string) => void;
  // SMTP & Mail Templates
  smtpConfig: SmtpConfig;
  onUpdateSmtpConfig: (cfg: SmtpConfig) => void;
  emailTemplates: EmailTemplate[];
  onUpdateTemplate: (tpl: EmailTemplate) => void;
  regions: Region[];
  onCopyInviteLink: (user: User) => void;
  onResendInvite: (user: User) => void;
  // Translation support
  translations: TranslationEntry[];
  supportedLanguages: SupportedLanguage[];
  onUpdateLanguage: (lang: SupportedLanguage) => void;
  onAddTranslation: (entry: TranslationEntry) => void;
  onUpdateTranslation: (entry: TranslationEntry) => void;
}

export default function AdministrationConsole({
  activeTenant,
  onUpdateTenant,
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onSwitchUser,
  smtpConfig,
  onUpdateSmtpConfig,
  emailTemplates,
  onUpdateTemplate,
  regions,
  onCopyInviteLink,
  onResendInvite,
  translations,
  supportedLanguages,
  onUpdateLanguage,
  onAddTranslation,
  onUpdateTranslation
}: AdministrationConsoleProps) {

  const [activeAdminTab, setActiveAdminTab] = useState<'profile' | 'users' | 'smtp' | 'translation'>('profile');

  // Company Profile states
  const [tenantName, setTenantName] = useState(activeTenant.name);
  const [tenantSubdomain, setTenantSubdomain] = useState(activeTenant.subdomain);
  const [tenantCurrency, setTenantCurrency] = useState(activeTenant.currency);
  const [tenantWeightUnit, setTenantWeightUnit] = useState(activeTenant.weightUnit);
  const [tenantLogoColor, setTenantLogoColor] = useState(activeTenant.logoColor);
  const [tenantReportingCurrency, setTenantReportingCurrency] = useState(activeTenant.reportingCurrency ?? "USD");

  // SMTP state
  const [smtpHost, setSmtpHost] = useState(smtpConfig.host);
  const [smtpPort, setSmtpPort] = useState(smtpConfig.port);
  const [smtpUser, setSmtpUser] = useState(smtpConfig.username);
  const [smtpSender, setSmtpSender] = useState(smtpConfig.senderEmail);
  const [smtpEncryption, setSmtpEncryption] = useState<'none' | 'ssl' | 'tls'>(smtpConfig.encryption);
  const [smtpActive, setSmtpActive] = useState(smtpConfig.active);

  // RBAC states
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('dispatcher');
  const [newUserRegionId, setNewUserRegionId] = useState<string>('');

  // Mail Templates Builder State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(emailTemplates[0]?.id || '');
  const activeTemplate = emailTemplates.find(t => t.id === selectedTemplateId) || emailTemplates[0];
  const [tplSubject, setTplSubject] = useState(activeTemplate?.subject || '');
  const [tplBody, setTplBody] = useState(activeTemplate?.body || '');

  // Keep template forms synced when template ID changes
  React.useEffect(() => {
    if (activeTemplate) {
      setTplSubject(activeTemplate.subject);
      setTplBody(activeTemplate.body);
    }
  }, [selectedTemplateId, activeTemplate]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      ...activeTenant,
      name: tenantName,
      subdomain: tenantSubdomain,
      currency: tenantCurrency,
      weightUnit: tenantWeightUnit,
      logoColor: tenantLogoColor,
      reportingCurrency: tenantReportingCurrency
    });
    alert('Tenant Settings and parameters synchronized successfully.');
  };

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSmtpConfig({
      host: smtpHost,
      port: Number(smtpPort),
      username: smtpUser,
      senderEmail: smtpSender,
      encryption: smtpEncryption,
      active: smtpActive
    });
    alert('SMTP Mail Dispatcher properties saved. Transport alerts active.');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    if (newUserRole !== 'administrator' && !newUserRegionId) {
      alert('Sovereign region assignment is required for regional operators.');
      return;
    }

    let userLevel: "corporate_admin" | "region_admin" | "region_user" | "driver" = "region_user";
    let regionId: string | null = null;
    let regionAccess: string[] = [];

    if (newUserRole === 'administrator') {
      userLevel = "corporate_admin";
      regionId = null;
      regionAccess = ["ALL"];
    } else if (newUserRole === 'region_admin') {
      userLevel = "region_admin";
      regionId = newUserRegionId;
      regionAccess = [newUserRegionId];
    } else if (newUserRole === 'driver') {
      userLevel = "driver";
      regionId = newUserRegionId;
      regionAccess = [newUserRegionId];
    } else {
      userLevel = "region_user";
      regionId = newUserRegionId;
      regionAccess = [newUserRegionId];
    }

    const inviteToken = `inv-${Math.random().toString(36).slice(2, 10)}`;
    const inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    onAddUser({
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      isActive: true,
      regionId,
      regionAccess,
      userLevel,
      status: 'invited',
      inviteToken,
      inviteExpiresAt,
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRegionId('');
    setShowAddUserForm(false);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) return;
    onUpdateTemplate({
      ...activeTemplate,
      subject: tplSubject,
      body: tplBody
    });
    alert(`Alerting parameters for template [${activeTemplate.name}] updated.`);
  };

  const handleToggleUserActive = (usr: User) => {
    onUpdateUser({
      ...usr,
      isActive: !usr.isActive
    });
  };


  return (
    <div id="admin-console-container" className="space-y-6">

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <Building className="text-blue-600 w-5 h-5" /> Enterprise Control Center &amp; Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global system overrides, credentials masking, Multi-tenant parameters orchestration, SMTP mail engine, and database schema compiler.
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold uppercase tracking-wider pb-0.5">
        <button
          onClick={() => setActiveAdminTab('profile')}
          className={`pb-3 border-b-2 transition ${
            activeAdminTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Company Profile
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`pb-3 border-b-2 transition ${
            activeAdminTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          User Permissions &amp; RBAC
        </button>

        <button
          onClick={() => setActiveAdminTab('smtp')}
          className={`pb-3 border-b-2 transition ${
            activeAdminTab === 'smtp' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          SMTP Alerts Config
        </button>

        <button
          id="admin-translation-tab"
          onClick={() => setActiveAdminTab('translation')}
          className={`pb-3 border-b-2 transition ${
            activeAdminTab === 'translation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-blue-600" /> Dual-Language Translations
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Tab 1: Tenant profile overrides */}
        {activeAdminTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building className="text-slate-400 w-4 h-4" /> SaaS Parameters Settings
              </h3>

              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <div className="space-y-1">
                  <label className="block">Tenant Organisation Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">Domain Mapping <span className="text-red-500">*</span></label>
                  <div className="flex">
                    <input
                      type="text"
                      required
                      value={tenantSubdomain}
                      onChange={(e) => setTenantSubdomain(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-l p-2 font-mono text-slate-800"
                    />
                    <span className="bg-slate-100 border border-l-0 border-slate-200 rounded-r px-3 py-2 text-[10px] font-mono text-slate-400">
                      .hms-saas.com
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block">Base Operational Currency</label>
                  <input
                    type="text"
                    required
                    value={tenantCurrency}
                    onChange={(e) => setTenantCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">Consolidated Reporting Currency</label>
                  <select
                    value={tenantReportingCurrency}
                    onChange={(e) => setTenantReportingCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SGD">SGD</option>
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Used when viewing all regions combined in the corporate dashboard
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block">Custom Weight Unit Tag</label>
                  <select
                    value={tenantWeightUnit}
                    onChange={(e) => setTenantWeightUnit(e.target.value as 'KG' | 'LBS')}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800"
                  >
                    <option value="KG">Kilograms (Metric KG-TEU)</option>
                    <option value="LBS">Pounds (US LBS-Yard)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block">Logo Color Palette Indicator</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={tenantLogoColor}
                      onChange={(e) => setTenantLogoColor(e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-200 bg-white"
                    />
                    <span className="font-mono text-slate-500 uppercase">{tenantLogoColor}</span>
                  </div>
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition flex items-center gap-1.5 shadow-sm text-xs"
                  >
                    <Save className="w-4 h-4" /> Save Profiles Override
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-950 p-6 rounded-lg text-slate-300 space-y-3">
              <h4 className="font-mono text-[9px] text-blue-400 uppercase tracking-widest font-bold">Multitenant Isolation Protocol</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applying updates alters global schemas inside local storage for dry-runs. Production queries split tenant database clusters natively or partition via <code className="text-slate-200 font-mono">tenant_id</code> keys inside PostgreSQL index trees automatically.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: User Switcher / RBAC manager */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6">

            {/* Quick Simulation Bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs">
                <span className="font-bold text-blue-800 block flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" /> Active Role-Based Security Emulator Mode
                </span>
                <span className="text-blue-600 text-[11px]">
                  Simulate different operator terminals. Changing the user switches limits in the sidebar screens automatically!
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px]">CURRENT LOGIN:</span>
                <select
                  value={currentUser.id}
                  onChange={(e) => onSwitchUser(e.target.value)}
                  className="bg-white border border-blue-300 rounded px-3 py-1.5 text-blue-800 font-bold focus:ring-2 focus:ring-blue-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-850 flex items-center gap-1.5 text-sm">
                    <Users className="text-slate-400 w-4 h-4" /> System Users Registry ({users.length})
                  </h3>

                  <button
                    onClick={() => setShowAddUserForm(!showAddUserForm)}
                    className="px-2.5 py-1 text-slate-500 border border-slate-200 rounded hover:bg-slate-50 font-bold text-[11px] flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" /> Add Operator
                  </button>
                </div>

                {showAddUserForm && (
                  <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200 p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold">User Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded p-1.5 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="john@atlas.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded p-1.5 text-slate-800 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold">Security Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => {
                          const val = e.target.value as UserRole;
                          setNewUserRole(val);
                          if (val === 'administrator') {
                            setNewUserRegionId('');
                          }
                        }}
                        className="w-full bg-white border border-slate-250 p-1.5 rounded text-slate-800"
                      >
                        <option value="administrator">administrator (Corporate Admin)</option>
                        <option value="region_admin">region_admin (Region Admin)</option>
                        <option value="dispatcher">dispatcher</option>
                        <option value="billing">billing</option>
                        <option value="operations">operations</option>
                        <option value="driver">driver</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold">Assign Region</label>
                      <select
                        disabled={newUserRole === 'administrator'}
                        value={newUserRole === 'administrator' ? 'all' : newUserRegionId}
                        onChange={(e) => setNewUserRegionId(e.target.value)}
                        required={newUserRole !== 'administrator'}
                        className="w-full bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-250 p-1.5 rounded text-slate-800"
                      >
                        {newUserRole === 'administrator' ? (
                          <option value="all">All Regions (Corporate Admin)</option>
                        ) : (
                          <>
                            <option value="">-- Select Active Region --</option>
                            {regions.filter(r => r.isActive !== false).map(r => (
                              <option key={r.id} value={r.code}>
                                {r.name} ({r.code})
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-4 pt-1 flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded"
                      >
                        Save User
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-medium text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50 p-2">
                        <th className="p-3">FULL NAME</th>
                        <th className="p-3">EMAIL ADDRESS</th>
                        <th className="p-3">LOGGED ROLE</th>
                        <th className="p-3">REGION</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{u.name}</td>
                          <td className="p-3 font-mono">{u.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.role === 'administrator' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'region_admin' ? 'bg-indigo-100 text-indigo-700' :
                              u.role === 'dispatcher' ? 'bg-blue-100 text-blue-700' :
                              u.role === 'billing' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            {!u.regionId ? (
                              <span className="inline-block px-2 py-0.5 font-mono text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded uppercase tracking-wider">
                                ALL
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 font-mono text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded uppercase tracking-wider">
                                {u.regionId}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {u.status === 'invited' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                INVITED
                              </span>
                            ) : u.status === 'disabled' || !u.isActive ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                                DISABLED
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleUserActive(u)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-200"
                              >
                                ACTIVE
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {u.status === 'invited' ? (
                                <>
                                  <button
                                    onClick={() => onCopyInviteLink(u)}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                                    title="Copy invite link"
                                  >
                                    <ClipboardCopy className="w-3 h-3" /> Copy Link
                                  </button>
                                  <button
                                    onClick={() => onResendInvite(u)}
                                    className="text-[10px] text-slate-500 hover:text-slate-700 font-bold flex items-center gap-0.5"
                                    title="Resend invite"
                                  >
                                    <RefreshCw className="w-3 h-3" /> Resend
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => onSwitchUser(u.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                                >
                                  Login <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Security permissions grid overview */}
              <div id="rbac-rights-grid" className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100 text-sm">
                  <Lock className="text-slate-400 w-4 h-4" /> Role Permission Scope
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-150">
                    <span className="font-bold text-slate-900 block uppercase font-mono tracking-wide text-[10px]">Administrator</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Unlimited scope. Includes editing company configs, modifying billing card rates, issuing invoices, editing dispatch rosters.
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-150 font-medium">
                    <span className="font-bold text-slate-900 block uppercase font-mono tracking-wide text-[10px]">dispatcher</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Read-only financial records. Allowed to create bookings, assign drivers, schedule chassis trips on the Trip Planner grid, and route trailers.
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-150">
                    <span className="font-bold text-slate-900 block uppercase font-mono tracking-wide text-[10px]">billing Agent</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Lacks planning access. Allowed to create contractual quotations, manage rate cards, issue invoices, and settle balances.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: SMTP settings and alerting template builder */}
        {activeAdminTab === 'smtp' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold">
            
            {/* SMTP Core Parameter */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-850 flex items-center gap-1.5 pb-2 border-b border-slate-100 text-sm">
                <Server className="text-slate-400 w-4 h-4" /> SMTP Relay Agent
              </h3>

              <form onSubmit={handleSaveSmtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-slate-540 text-[11px]">RELAY MAIL HOST SERVER</label>
                  <input
                    type="text"
                    required
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-slate-540 text-[11px]">PORT NO</label>
                    <input
                      type="number"
                      required
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-540 text-[11px]">ENCRYPTION</label>
                    <select
                      value={smtpEncryption}
                      onChange={(e) => setSmtpEncryption(e.target.value as 'none' | 'ssl' | 'tls')}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-850 text-[11px] font-bold"
                    >
                      <option value="none">PLAIN PLAINTEXT (587)</option>
                      <option value="ssl">SSL SECURED (465)</option>
                      <option value="tls">STARTTLS OVERLAP (25)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-540 text-[11px]">SMTP AUTHORIZED USERNAME</label>
                  <input
                    type="text"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-540 text-[11px]">MASK SENDER ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={smtpSender}
                    onChange={(e) => setSmtpSender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    checked={smtpActive}
                    onChange={(e) => setSmtpActive(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded cursor-pointer border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Deploy active mail dispatcher gateway</span>
                    <span className="text-[10px] text-slate-400">Forces notifications to queue instantly upon dispatch action.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded transition shadow-xs flex justify-center items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Relay Settings
                  </button>
                </div>
              </form>
            </div>

            {/* Template engine */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-850 flex items-center gap-1.5 text-sm">
                  <Mail className="text-slate-400 w-4 h-4" /> Mail Template Layout Builder
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">EVENT TRIGGER:</span>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-bold text-blue-600 focus:outline-none"
                  >
                    {emailTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.triggerEvent})</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeTemplate ? (
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px] font-bold">EMAIL SUBJECT CLAUSE</label>
                    <input
                      type="text"
                      required
                      value={tplSubject}
                      onChange={(e) => setTplSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 font-sans font-bold text-slate-800 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px] font-bold">BODY EMAIL MARKUP (STATION CODE PLUGINS AUTHORIZED)</label>
                    <textarea
                      rows={6}
                      required
                      value={tplBody}
                      onChange={(e) => setTplBody(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">Authorized Dynamic Placeholder tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTemplate.variables.map(v => (
                        <span key={v} className="bg-blue-50 border border-blue-150 px-2 py-0.5 rounded text-[10px] font-mono text-blue-600 font-semibold">
                          {"{{"}{v}{"}}"}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded text-xs"
                    >
                      Commit Template Override
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-8 text-slate-400 text-center">No alert templates initialized in system context.</div>
              )}

            </div>

          </div>
        )}


        {/* Tab 5: Dynamic Translation Management Console */}
        {activeAdminTab === 'translation' && (
          <div className="bg-white rounded-lg border border-slate-205 shadow-xs overflow-hidden">
            <TranslationManager
              translations={translations}
              languages={supportedLanguages}
              onUpdateTranslation={onUpdateTranslation}
            />
          </div>
        )}

      </div>

    </div>
  );
}
