import React, { useState } from 'react';
import { Languages, Search } from 'lucide-react';
import { SupportedLanguage, TranslationEntry } from '../types';
import LanguageSwitcher from './LanguageSwitcher';

interface TranslationManagerProps {
  languages: SupportedLanguage[];
  translations: TranslationEntry[];
  onUpdateTranslation: (entry: TranslationEntry) => void;
}

export default function TranslationManager({
  languages,
  translations,
  onUpdateTranslation
}: TranslationManagerProps) {
  const [activeLangCode, setActiveLangCode] = useState<string>('ta');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTranslations = translations.filter(t => t.languageCode === activeLangCode);

  const filteredTranslations = activeTranslations.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.key.toLowerCase().includes(q) ||
      t.englishValue.toLowerCase().includes(q) ||
      t.translatedValue.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-lg p-6 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-600 text-white p-2 rounded">
          <Languages className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-black text-slate-800">Document Label Translations</h1>
      </div>

      <LanguageSwitcher
        supportedLanguages={languages}
        activeLanguageCode={activeLangCode}
        onChange={setActiveLanguageCode}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search keys or values..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
          <tr>
            <th className="px-4 py-2 text-left">Key</th>
            <th className="px-4 py-2 text-left">Base (English)</th>
            <th className="px-4 py-2 text-left">Translation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredTranslations.map(entry => (
            <tr key={entry.id}>
              <td className="px-4 py-2 font-mono text-slate-500">{entry.key}</td>
              <td className="px-4 py-2 text-slate-600">{entry.englishValue}</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={entry.translatedValue}
                  onChange={(e) => onUpdateTranslation({ ...entry, translatedValue: e.target.value })}
                  className="w-full border border-slate-200 rounded px-2 py-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
