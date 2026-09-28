'use client';

import React from 'react';
import { Shield, User, Sparkles, Database } from 'lucide-react';

interface NavbarProps {
  currentRole: 'citizen' | 'admin';
  onRoleChange: (role: 'citizen' | 'admin') => void;
  activeTab: 'report' | 'dashboard';
  onTabChange: (tab: 'report' | 'dashboard') => void;
  isBackendConnected: boolean;
  totalIssuesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  isBackendConnected,
  totalIssuesCount,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-orange-200/80 bg-white/85 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 ring-1 ring-orange-400/40">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-stone-900 via-stone-800 to-orange-600 bg-clip-text text-transparent">
                LocusTriage AI
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                v2.0
              </span>
            </div>
            <p className="text-xs text-stone-500">Intelligent Municipal Hazard Triage</p>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="hidden md:flex items-center space-x-1 bg-stone-100/90 p-1 rounded-xl border border-orange-200/60">
          <button
            onClick={() => {
              onTabChange('report');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'report'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Citizen Portal</span>
          </button>

          <button
            onClick={() => {
              onTabChange('dashboard');
              if (currentRole !== 'admin') {
                onRoleChange('admin');
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'dashboard'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>City Official Dashboard</span>
          </button>
        </nav>

        {/* Right side controls & Status */}
        <div className="flex items-center space-x-3">
          {/* Live Status indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-orange-50/90 border border-orange-200 text-xs">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-stone-700 font-medium">
              {isBackendConnected ? 'Live API Connected' : 'Connecting API...'}
            </span>
          </div>

          {/* Quick stats pill */}
          {totalIssuesCount !== undefined && totalIssuesCount > 0 && (
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-orange-50/60 border border-orange-200 text-xs text-stone-600">
              <Database className="w-3.5 h-3.5 text-orange-600" />
              <span className="font-semibold text-stone-800">{totalIssuesCount}</span>
              <span>Hazards Logged</span>
            </div>
          )}

          {/* Role selector */}
          <div className="flex items-center bg-stone-100 border border-orange-200 rounded-lg p-1">
            <button
              onClick={() => onRoleChange('citizen')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentRole === 'citizen'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Citizen
            </button>
            <button
              onClick={() => onRoleChange('admin')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentRole === 'admin'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Official
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
