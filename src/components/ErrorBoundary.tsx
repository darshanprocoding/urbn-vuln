import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any) {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
          {/* Top Tiranga Micro Ribbon Glow */}
          <div className="h-[3px] w-full absolute top-0 left-0 bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38] shadow-[0_0_12px_rgba(255,103,31,0.6)]" />

          {/* Background Glow */}
          <div className="absolute w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-lg w-full bg-[#0b1220] border border-[#1e3357] rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-5 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-xl font-black text-slate-100 mb-2">
              {(this.props as ErrorBoundaryProps).fallbackTitle || 'Tactical Grid Terminal Recovery'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              The application encountered an unexpected runtime state. Tactical auto-recovery protocols are available below.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3.5 rounded-xl bg-[#070c18] border border-red-500/20 text-left text-xs font-mono text-red-300/90 overflow-x-auto max-h-32 scrollbar-thin">
                <p className="font-bold text-red-400 mb-1">Diagnostic Log:</p>
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <RefreshCw size={16} />
                Reload Terminal
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch {}
                  window.location.href = '/';
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#142036] hover:bg-[#1b2d4c] border border-[#23385d] text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home size={16} />
                Reset & Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this.props as ErrorBoundaryProps).children;
  }
}
