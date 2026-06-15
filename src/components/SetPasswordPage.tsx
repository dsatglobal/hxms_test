/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Invite activation page — reached via a simulated invite link
 * (localStorage `${tenantKey}_pendingInvite`). Mock validation only.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Lock, AlertTriangle, X } from 'lucide-react';
import { Tenant, User } from '../types';

interface SetPasswordPageProps {
  tenant: Tenant;
  invitedUser: User | null;
  onActivate: (userId: string, password: string) => void;
  onCancel: () => void;
}

export default function SetPasswordPage({ tenant, invitedUser, onActivate, onCancel }: SetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const expired = !!invitedUser?.inviteExpiresAt && new Date(invitedUser.inviteExpiresAt) < new Date();
  const invalid = !invitedUser || invitedUser.status !== 'invited';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (invitedUser) onActivate(invitedUser.id, password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 font-sans antialiased px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative"
        style={{ maxWidth: 420 }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 p-1"
          title="Back to login"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black mb-3 shadow-md"
            style={{ backgroundColor: tenant.logoColor }}
          >
            {tenant.name.charAt(0)}
          </div>
          <h1 className="text-lg font-bold text-slate-900">Welcome to {tenant.name}</h1>
          {!invalid && !expired && (
            <>
              <p className="text-xs text-slate-500 mt-1">Set your password to activate your account</p>
              <p className="text-xs font-mono font-bold text-blue-600 mt-1">{invitedUser?.email}</p>
            </>
          )}
        </div>

        {invalid ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            This invite link is invalid or has already been used. Ask your administrator to resend it.
          </div>
        ) : expired ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            This invite has expired. Ask your administrator to resend it.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="setpw-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="setpw-confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Minimum 8 characters.</p>
            </div>

            <button
              id="setpw-submit"
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <KeyRound className="w-4 h-4" /> Activate Account
            </button>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold text-red-600 text-center">
                {error}
              </motion.p>
            )}
          </form>
        )}
      </motion.div>

      <p className="text-[11px] text-slate-400 mt-6">Powered by HMS — DSAT Global</p>
    </div>
  );
}
