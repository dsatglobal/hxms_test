/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mock tenant login page — auth is simulated, passwords stored in plain
 * text on the User record for demo purposes only.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Tenant, User } from '../types';

interface LoginPageProps {
  tenant: Tenant;
  tenants: Tenant[];
  users: User[];
  onLogin: (user: User) => void;
  onSwitchTenant: (tenant: Tenant) => void;
}

export default function LoginPage({ tenant, tenants, users, onLogin, onSwitchTenant }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.passwordHash !== password) {
      // Special-case: invited account trying to log in with no password yet
      if (user && user.status === 'invited') {
        setError('Account pending — check your invite email');
        return;
      }
      setError('Invalid email or password');
      return;
    }
    if (user.status === 'disabled') {
      setError('This account has been disabled');
      return;
    }
    if (user.status === 'invited') {
      setError('Account pending — check your invite email');
      return;
    }
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 font-sans antialiased px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8"
        style={{ maxWidth: 420 }}
      >
        {/* Tenant identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black mb-3 shadow-md"
            style={{ backgroundColor: tenant.logoColor }}
          >
            {tenant.name.charAt(0)}
          </div>
          <h1 className="text-lg font-bold text-slate-900">Sign in to {tenant.name}</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">{tenant.subdomain}.hms-saas.com</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-semibold text-red-600 text-center"
            >
              {error}
            </motion.p>
          )}
        </form>

        {/* Demo helper */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-[10px] text-slate-400 font-mono">
            DEMO — Corporate Admin: admin@atlas.com / admin123
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
            <span className="font-mono uppercase">Tenant:</span>
            <select
              value={tenant.id}
              onChange={e => {
                const matched = tenants.find(t => t.id === e.target.value);
                if (matched) onSwitchTenant(matched);
              }}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[10px] font-bold text-slate-600 focus:outline-none cursor-pointer"
            >
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      <p className="text-[11px] text-slate-400 mt-6">Powered by HMS — DSAT Global</p>
    </div>
  );
}
