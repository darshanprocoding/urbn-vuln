import React, { useState, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { DisasterSimulationProvider, useDisasterSimulation } from './context/DisasterSimulationContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { LanguageSelector } from './components/LanguageSelector';
import { Shield, Radio, Activity, LogOut, UserCheck } from 'lucide-react';

// Lazy load heavy components and modals to reduce initial chunk size
const VulnerabilityMap = React.lazy(() => import('./components/VulnerabilityMap').then(m => ({ default: m.VulnerabilityMap })));
const DispatchMap = React.lazy(() => import('./components/DispatchMap').then(m => ({ default: m.DispatchMap })));
const PrioritizationDashboard = React.lazy(() => import('./components/PrioritizationDashboard').then(m => ({ default: m.PrioritizationDashboard })));
const InfrastructureStatus = React.lazy(() => import('./components/InfrastructureStatus').then(m => ({ default: m.InfrastructureStatus })));
const ResourceManagement = React.lazy(() => import('./components/ResourceManagement').then(m => ({ default: m.ResourceManagement })));
const ExportReportModal = React.lazy(() => import('./components/ExportReportModal').then(m => ({ default: m.ExportReportModal })));

function AppContent() {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [currentView, setCurrentView] = useState('Vulnerability Map');
  const { t } = useLanguage();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'Vulnerability Map':
        return t('nav.vulnerabilityMap', 'Vulnerability Map');
      case 'Dispatch Map':
        return t('nav.dispatchMap', 'Dispatch Map');
      case 'Resource Management':
        return t('nav.resourceManagement', 'Resource Management');
      case 'Prioritization Dashboard':
        return t('nav.prioritizationDashboard', 'Prioritization Dashboard');
      case 'Infrastructure Status':
        return t('nav.infrastructureStatus', 'Infrastructure Status');
      default:
        return currentView;
    }
  };

  return (
    <div className="flex h-screen bg-[#050811] text-slate-100 font-sans overflow-hidden">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} onLogout={logout} />

      <div className="flex-1 flex flex-col min-w-0 bg-[#050811] relative">
        {/* Top Tiranga Micro Ribbon Glow */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38] shadow-[0_0_10px_rgba(255,103,31,0.5)] z-20 shrink-0" />

        <header className="h-16 border-b border-[#142036] bg-[#070c18]/90 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF671F] shadow-[0_0_8px_#FF671F] shrink-0"></span>
              <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-wide truncate">
                {getViewTitle()}
              </h2>
            </div>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF671F]/15 via-white/10 to-[#046A38]/15 border border-white/15 text-[10px] font-bold text-slate-200 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] shrink-0"></span>
              {t('app.nationalGrid', 'National Disaster Response System • NDMA Tactical Grid')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Multilingual Top Selector */}
            <LanguageSelector variant="header" />

            {/* Authenticated Judge Profile Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#11203a] to-[#0d1729] border border-blue-500/30 text-xs shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-[#FF671F]/20 border border-[#FF671F]/40 flex items-center justify-center text-[10px] font-black text-amber-300">
                🇮🇳
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-bold text-slate-200 leading-tight">
                  {currentUser?.name || 'Bharat'}
                </p>
                <p className="text-[9px] text-blue-400 font-mono leading-none">
                  {currentUser?.badge || 'JUDGE ACCESS'}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all ml-1 cursor-pointer"
                title="Log Out Terminal"
              >
                <LogOut size={13} />
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#101c33] to-[#0d1627] border border-[#1e3357] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 font-mono tracking-wider">
                {t('app.allSystemsSecure', 'ALL SYSTEMS SECURE')}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="max-w-[1700px] mx-auto">
            <Suspense fallback={<div className="p-8 text-center bg-[#0b101d] border border-[#172338] rounded-2xl flex items-center justify-center text-slate-400 text-sm">Loading module...</div>}>
              <div className={currentView === 'Vulnerability Map' ? 'h-[calc(100vh-6rem)] relative' : 'hidden'}>
                <VulnerabilityMap />
              </div>
              <div className={currentView === 'Dispatch Map' ? 'h-[calc(100vh-6rem)] relative' : 'hidden'}>
                <DispatchMap />
              </div>
              {currentView === 'Resource Management' && <ResourceManagement />}
              {currentView === 'Prioritization Dashboard' && <PrioritizationDashboard />}
              {currentView === 'Infrastructure Status' && <InfrastructureStatus />}
              {currentView === 'Incident Dispatch' && <ResourceManagement />}
            </Suspense>
            {!['Vulnerability Map', 'Dispatch Map', 'Resource Management', 'Prioritization Dashboard', 'Infrastructure Status', 'Incident Dispatch'].includes(currentView) && (
              <div className="p-8 text-center bg-[#0b101d] border border-[#172338] rounded-2xl">
                <h3 className="text-base font-bold text-slate-200">{currentView}</h3>
                <p className="text-xs text-slate-400 mt-1">Module view is under development.</p>
              </div>
            )}
          </div>
        </main>

        {/* Disaster Vulnerability & Resource Dispatch Report Preview & PDF Modal (Loaded on Demand) */}
        <Suspense fallback={null}>
          <ExportReportModal />
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <DisasterSimulationProvider>
          <AppContent />
        </DisasterSimulationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
