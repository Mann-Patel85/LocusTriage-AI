'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { CitizenPortal } from '../components/CitizenPortal';
import { OfficialDashboard } from '../components/OfficialDashboard';
import { CivicIssue, DashboardStats } from '../types';
import { api } from '../services/api';
import { AlertCircle, Building2 } from 'lucide-react';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<'citizen' | 'admin'>('citizen');
  const [activeTab, setActiveTab] = useState<'report' | 'dashboard'>('report');
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Fetch issues and stats
  const fetchData = useCallback(async () => {
    try {
      const isHealthy = await api.healthCheck();
      setIsBackendConnected(isHealthy);

      const [issuesData, statsData] = await Promise.all([
        api.getIssues({ limit: 300 }),
        api.getStats().catch(() => null),
      ]);

      setIssues(issuesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data from API:', err);
      setIsBackendConnected(false);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRoleChange = (role: 'citizen' | 'admin') => {
    setCurrentRole(role);
    if (role === 'admin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('report');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fffaf5]">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isBackendConnected={isBackendConnected}
        totalIssuesCount={stats?.total_issues ?? issues.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Backend offline warning banner */}
        {!isBackendConnected && !isLoadingData && (
          <div className="mb-6 p-4 rounded-xl bg-orange-100 border border-orange-300 text-orange-950 text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                Backend API server is connecting on <code>http://localhost:8000</code>. Ensure FastAPI backend is running.
              </span>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'report' ? (
          <CitizenPortal
            onIssueCreated={fetchData}
            recentIssues={issues}
          />
        ) : (
          <OfficialDashboard
            issues={issues}
            stats={stats}
            onRefreshData={fetchData}
          />
        )}
      </main>

      {/* Modern Warm Footer */}
      <footer className="border-t border-orange-200/80 bg-white/70 backdrop-blur-md py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-stone-800">LocusTriage AI</span>
            <span>— Smart Municipal Hazard Triage Engine</span>
          </div>

          <div className="flex items-center space-x-4 text-stone-500 text-[11px] font-medium">
            <span>FastAPI + SQLite Persistence</span>
            <span>•</span>
            <span>Gemini 2.5 Flash Vision</span>
            <span>•</span>
            <span>Next.js Dashboard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
