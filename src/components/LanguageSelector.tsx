import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, TOP_10_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'header' | 'sidebar' | 'compact';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'header' }) => {
  const { language, setLanguage, currentLanguageInfo, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'sidebar') {
    return (
      <div className="relative px-3 mb-4" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#0d172a] to-[#0a1220] border border-[#1e2f4d] hover:border-[#2e4c7a] text-slate-200 transition-all text-xs font-semibold cursor-pointer shadow-md group"
          title="Switch Language / भाषा बदलें"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-[#FF671F]/20 text-[#FF9933] border border-[#FF671F]/40 flex items-center justify-center shrink-0">
              <Globe size={13} className="animate-[spin_12s_linear_infinite]" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-[11px] font-bold text-white truncate flex items-center gap-1.5">
                <span>{currentLanguageInfo.nativeName}</span>
                <span className="text-[10px] text-slate-400 font-normal">({currentLanguageInfo.name})</span>
              </div>
            </div>
          </div>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-3 right-3 bottom-full mb-2 bg-[#080d1a]/98 border border-[#1e3458] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-2 z-50 overflow-hidden max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            <div className="px-2.5 py-1.5 border-b border-[#14233c] mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-400 font-mono tracking-wider">
                10 OFFICIAL INDIAN LANGUAGES
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                LIVE i18n
              </span>
            </div>
            <div className="space-y-1">
              {TOP_10_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FF671F]/25 via-blue-900/30 to-[#046A38]/25 border border-amber-500/40 text-white font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-[#101b30] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-[#131f37] border border-[#213458] text-[9px] font-mono font-bold text-amber-300 flex items-center justify-center">
                        {lang.badge}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{lang.nativeName}</div>
                        <div className="text-[10px] text-slate-400">{lang.name} • {lang.speakerCount}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0c1628] via-[#091222] to-[#070e1c] border border-[#1b2f4f] hover:border-amber-500/50 text-slate-200 transition-all text-xs font-bold cursor-pointer shadow-sm group hover:shadow-[0_0_15px_rgba(255,103,31,0.2)]"
        title="Switch Language / भाषा बदलें"
      >
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#FF671F]/30 to-[#046A38]/30 border border-[#2c4a77] flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
          <Globe size={12} className="animate-[spin_20s_linear_infinite]" />
        </div>

        <div className="flex items-center gap-1.5 text-left">
          <span className="text-white text-xs font-bold">{currentLanguageInfo.nativeName}</span>
          <span className="hidden md:inline text-[10px] text-slate-400">({currentLanguageInfo.name})</span>
        </div>

        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#13223d] text-amber-300 border border-[#21385f]">
          {currentLanguageInfo.badge}
        </span>

        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#070d1a]/98 border border-[#1e355c] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-2.5 z-50 overflow-hidden">
          {/* Top Tiranga Micro Glow */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38]" />

          <div className="px-2 py-2 border-b border-[#14233c] mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-[11px] font-extrabold text-slate-200 tracking-wider">
                {t('app.selectLanguage', 'Select Language')}
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF671F]/20 via-white/10 to-[#046A38]/20 text-amber-300 border border-amber-500/30 font-bold">
              10 Regional Languages
            </span>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {TOP_10_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF671F]/25 via-[#102347] to-[#046A38]/25 border border-amber-500/50 text-white font-bold shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-[#0e192f] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-[10px] font-mono font-black flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#FF671F] text-white shadow-[0_0_8px_#FF671F]'
                          : 'bg-[#101b33] border border-[#1e3458] text-amber-300 group-hover:border-amber-400/50'
                      }`}
                    >
                      {lang.badge}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{lang.nativeName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">({lang.name})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {lang.script} Script • <span className="text-emerald-400">{lang.speakerCount}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
