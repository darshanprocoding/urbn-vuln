import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Radio,
  Server,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const LoginPage: React.FC = () => {
  const { login, quickJudgeLogin } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAutoFilling, setIsAutoFilling] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
        setIsSubmitting(false);
      }
    }, 350);
  };

  const handleQuickFill = () => {
    setErrorMessage(null);
    setIsAutoFilling(true);
    setUsername('bharat');
    setPassword('watchdogs');

    setTimeout(() => {
      setIsAutoFilling(false);
    }, 400);
  };

  const handleDirectJudgeLogin = () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    setTimeout(() => {
      quickJudgeLogin();
    }, 300);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Top Tiranga Micro Ribbon Glow */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38] shadow-[0_0_12px_rgba(255,103,31,0.6)] z-30 shrink-0" />

      {/* Atmospheric Background Lights & Grid Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#1e3a8a]/20 via-[#FF671F]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#046A38]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-[#FF671F]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between z-20 relative border-b border-[#142036]/60 backdrop-blur-md bg-[#070c18]/60">
        <div className="flex items-center gap-3">
          {/* Ashoka Chakra Logo */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF671F]/25 via-[#1e3a8a]/40 to-[#046A38]/25 border border-[#2b4c7e] flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(30,58,138,0.5)]">
            <svg
              className="w-5 h-5 text-blue-400 animate-[spin_24s_linear_infinite]"
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
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF671F] shadow-[0_0_6px_#FF671F]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base text-slate-100 tracking-wide">
                भारत VULN ENGINE
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-[#FF671F]/20 via-white/10 to-[#046A38]/20 text-amber-300 border border-amber-500/30">
                TEAM WATCH DOGS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              National Disaster Response &amp; AI Vulnerability Grid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector variant="header" />
        </div>
      </header>

      {/* Main Authentication Workspace */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-[#0b1220]/95 backdrop-blur-2xl border border-[#1e3357] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {/* Top glowing edge */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF671F] to-transparent" />

            {/* Title Section */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#101e38] border border-[#234273] text-[11px] font-bold text-blue-300 mb-3 shadow-inner">
                <Shield size={13} className="text-[#FF671F]" />
                <span>SECURE TACTICAL TERMINAL</span>
              </div>
              <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                NDMA Command Authorization
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter authorized credentials to access the 36 States &amp; UTs Tactical Vulnerability &amp; Dispatch Grid.
              </p>
            </div>

            {/* HACKATHON JUDGE VIP FAST ACCESS CARD */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-b from-[#102347] via-[#0d1a36] to-[#0a1429] border-2 border-blue-500/40 shadow-[0_4px_24px_rgba(59,130,246,0.25)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#FF671F]/15 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    Hackathon Judges &amp; Evaluators
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  FAST ACCESS
                </span>
              </div>

              {/* Displayed Required Credentials */}
              <div className="grid grid-cols-2 gap-2 mb-3 bg-[#070c18]/80 p-2.5 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">NAME / USER</span>
                    <strong className="text-slate-100 font-mono text-xs">bharat</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('bharat', 'user')}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Copy Name"
                  >
                    {copiedField === 'user' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="flex items-center justify-between border-l border-slate-700/60 pl-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">PASSWORD</span>
                    <strong className="text-slate-100 font-mono text-xs">watchdogs</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('watchdogs', 'pass')}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Copy Password"
                  >
                    {copiedField === 'pass' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDirectJudgeLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap size={14} className="text-amber-300" />
                  <span>1-Click Judge Login</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="w-full py-2.5 px-3 bg-[#13223f] hover:bg-[#1c3057] text-slate-200 border border-blue-400/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:text-white"
                >
                  <Sparkles size={13} className="text-cyan-400" />
                  <span>{isAutoFilling ? 'Filling...' : 'Auto-Fill Form'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Authorized Name / Username</span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">e.g. bharat</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter name (bharat)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#070d18] border border-[#1b2b46] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-medium text-slate-100 placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Security Password</span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">e.g. watchdogs</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password (watchdogs)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#070d18] border border-[#1b2b46] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-medium text-slate-100 placeholder-slate-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-[#FF671F] via-[#ea580c] to-[#046A38] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Grid Access...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize Access &amp; Launch Terminal</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security Notice Footer */}
            <div className="mt-6 pt-4 border-t border-[#15223c] flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>256-Bit SSL Encrypted</span>
              </span>
              <span>NDMA TACTICAL v2.4</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-3 px-6 text-center text-slate-500 text-[11px] font-mono border-t border-[#142036]/60 bg-[#070c18]/50 z-20">
        National Disaster Management Authority (NDMA) • Smart India Hackathon Evaluation Portal • Developed by Team Watch Dogs
      </footer>
    </div>
  );
};
