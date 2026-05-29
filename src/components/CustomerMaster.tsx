/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer } from '../types';
import { Plus, User, FileText, CheckCircle2, Shield, Phone, Mail, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerMasterProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
}

export default function CustomerMaster({
  customers,
  onAddCustomer
}: CustomerMasterProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !taxId || !email) {
      alert('Please fill out Name, Tax ID, and Email contacts.');
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name,
      taxId: taxId.toUpperCase(),
      address,
      creditLimit: Number(creditLimit),
      paymentTerms,
      phone,
      email
    };

    onAddCustomer(newCust);
    setName('');
    setTaxId('');
    setAddress('');
    setPhone('');
    setEmail('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6" id="customers-master-module">
      
      {/* Tab select block */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black font-sans tracking-tight text-slate-900 flex items-center gap-2 uppercase">
            <User className="text-blue-600 w-5 h-5" /> Customer Audit Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain customer commercial credit parameters, Tax identifiers, billing addresses, and payment terms.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sans transition flex items-center gap-1.5 shadow-sm shadow-blue-100"
        >
          <Plus className="w-3.5 h-3.5" /> Register Client Account
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showCreateForm && (
          <motion.form
            key="customer-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 p-5 rounded-lg space-y-4 max-w-3xl overflow-hidden shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pacific Logistics Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Tax Identifier ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TX-440182-X"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="logistics@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Phone Contact</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500">Registered Office Address</label>
                <textarea
                  placeholder="Building No, Industrial block, City, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 h-14 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Allowed Credit Limit ($)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Standard Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="COD">Due on Delivery (COD)</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-3">
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow"
              >
                Save Customer Profile
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Registry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div 
            key={c.id} 
            className="p-5 bg-white border border-slate-200 rounded-lg space-y-4 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">{c.name}</h3>
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-mono text-[9px] text-slate-500 uppercase font-bold tracking-wider">{c.paymentTerms}</span>
              </div>

              <div className="space-y-1.5 text-xs font-sans text-slate-500">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">TAX ID:</span>
                  <span className="text-slate-800 font-mono font-bold">{c.taxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">CREDIT LIMIT:</span>
                  <span className="text-emerald-700 font-mono font-bold">${c.creditLimit.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">CONTACT EMAIL:</span>
                  <span className="text-slate-700 font-medium truncate max-w-[170px]">{c.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
              <span>{c.address ? 'Registered' : 'No Address Specified'}</span>
              <span className="text-green-700 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> APPROVED CLIENT
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
