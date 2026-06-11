import React from 'react';
import { SupportedLanguage } from '../types';

interface LanguageSwitcherProps {
  supportedLanguages: SupportedLanguage[];
  activeLanguageCode: string;
  onChange: (languageCode: string) => void;
}

export default function LanguageSwitcher({
  supportedLanguages,
  activeLanguageCode,
  onChange
}: LanguageSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 border ${
          activeLanguageCode === 'en'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
        }`}
      >
        🇬🇧 English
      </button>
      {supportedLanguages.map(lang => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 border ${
            activeLanguageCode === lang.code
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
          }`}
        >
          {lang.name}
          {lang.isRTL && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded ml-1">RTL</span>}
        </button>
      ))}
    </div>
  );
}
