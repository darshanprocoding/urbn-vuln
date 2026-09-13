import React from 'react';
import {
  Map,
  Activity,
  Layers,
  BarChart3,
  LogOut,
  MapPin,
  AlertTriangle,
  Zap,
  Truck,
  Package,
  Navigation,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout }) => {
  const { t, currentLanguageInfo } = useLanguage();

  const analytics = [
    { key: 'Vulnerability Map', name: t('nav.vulnerabilityMap', 'Vulnerability Map'), icon: Map, badge: 'Live GIS' },
    { key: 'Dispatch Map', name: t('nav.dispatchMap', 'Dispatch Map'), icon: Navigation, badge: 'Tactical' },
    { key: 'Resource Management', name: t('nav.resourceManagement', 'Resource Management'), icon: Truck, badge: 'Logistics' },
    { key: 'Prioritization Dashboard', name: t('nav.prioritizationDashboard', 'Prioritization Dashboard'), icon: BarChart3, badge: 'NDMA AI' },
    { key: 'Infrastructure Status', name: t('nav.infrastructureStatus', 'Infrastructure Status'), icon: Zap, badge: 'Telemetry' },
  ];

  const renderNavGroup = (title: string, items: { key: string; name: string; icon: any; badge?: string }[]) => (
    <div className="mb-4 px-3">
      <div className="flex items-center gap-2 px-3 mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF671F]"></span>
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
          {title}
        </p>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setCurrentView(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-[#101b35] via-[#0f2240] to-[#0c1c2e] text-white font-bold border border-[#23416f] shadow-[0_4px_16px_rgba(30,58,138,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#0c1322] border border-transparent'
              }`}
            >
              {/* Active Left Tiranga Glow Stripe */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF671F] via-white to-[#046A38] rounded-r-full shadow-[0_0_8px_#FF671F]" />
              )}

              <div className="flex items-center gap-3 pl-1">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#FF671F]/20 text-[#FF9933] border border-[#FF671F]/40'
                      : 'bg-[#101728] text-slate-400 group-hover:text-amber-400 group-hover:bg-[#16223b]'
                  }`}
                >
                  <Icon size={15} />
                </div>
                <span className="truncate">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold transition-all ${
                    isActive
                      ? 'bg-[#046A38]/30 text-emerald-300 border border-[#046A38]/50'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-64 bg-[#070b16] border-r border-[#15223c] flex flex-col shrink-0 h-screen select-none relative overflow-hidden shadow-2xl">
      {/* Top Tiranga Micro Ribbon */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38] shadow-[0_0_8px_rgba(255,103,31,0.6)]" />

      {/* Brand Header */}
      <div className="p-4 border-b border-[#15223c] bg-gradient-to-b from-[#0a1122] to-[#070b16]">
        <div className="flex items-center gap-3">
          {/* Ashoka Chakra Motif Logo */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF671F]/20 via-[#1e3a8a]/30 to-[#046A38]/20 border border-[#2b4c7e] flex items-center justify-center text-blue-400 shadow-[0_0_18px_rgba(30,58,138,0.4)] shrink-0 group">
            {/* 24-spoke Dharma Chakra SVG */}
            <svg
              className="w-6 h-6 text-blue-400 animate-[spin_24s_linear_infinite]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1" />
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="12"
                  y1="3"
                  x2="12"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  transform={`rotate(${i * 15} 12 12)`}
                />
              ))}
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF671F] border border-[#070b16] shadow-[0_0_6px_#FF671F]"></span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm text-slate-100 tracking-wide truncate">
                भारत Vuln Engine
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-gradient-to-r from-[#FF671F]/25 via-white/10 to-[#046A38]/25 text-amber-300 border border-amber-500/30 tracking-wider">
                TIRANGA 2.0
              </span>
              <span className="text-[10px] text-slate-400 font-mono">NDMA OPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-slate-800 flex flex-col justify-between">
        <div>
          {renderNavGroup(t('nav.analytics', 'COMMAND & AI INTELLIGENCE'), analytics)}
        </div>

        <div>
          {/* Language Switcher in Sidebar */}
          <div className="mb-2">
            <div className="flex items-center gap-2 px-6 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#046A38]"></span>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                {t('app.switchLanguage', 'Language')} / भाषा
              </p>
            </div>
            <LanguageSelector variant="sidebar" />
          </div>

          {/* Tactical Quick Overview Card */}
          <div className="mx-3 mb-2 p-3.5 rounded-2xl bg-gradient-to-b from-[#0a1326] to-[#070d1a] border border-[#1b2d4c] relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF671F]/10 rounded-full blur-xl pointer-events-none -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                <ShieldAlert size={12} className="text-[#FF671F]" />
                {t('nav.nationalStandby', 'NATIONAL STANDBY')}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#046A38] shadow-[0_0_8px_#10B981] animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              {t('nav.standbyDesc', '36 States & UTs synchronized with NDMA & SDMA tactical relief grids.')}
            </p>
            <div className="mt-2.5 pt-2 border-t border-[#16253f] flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{t('nav.gridActive', 'Grid: ACTIVE')}</span>
              <span>{t('nav.hubsOnline', '68 Hubs Online')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User / Operator Profile Footer */}
      <div className="p-3.5 border-t border-[#15223c] bg-[#060913] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF671F]/30 via-slate-800 to-[#046A38]/30 border border-[#2b4c7e] flex items-center justify-center shrink-0 text-[11px] font-black text-white shadow-sm">
            WD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{t('nav.teamName', 'Team Watch Dogs')}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] shadow-[0_0_6px_#10b981]"></span>
              <span className="text-[10px] text-emerald-400 font-bold">{t('nav.authorized', 'NDMA Authorized')}</span>
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30 cursor-pointer"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};
