'use client';

import React, { useState, useMemo } from 'react';
import { CivicIssue, DashboardStats } from '../types';
import { api } from '../services/api';
import { HazardMap } from './HazardMap';
import {
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Activity,
  ChevronDown,
  Building,
} from 'lucide-react';

interface OfficialDashboardProps {
  issues: CivicIssue[];
  stats: DashboardStats | null;
  onRefreshData: () => void;
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({
  issues,
  stats,
  onRefreshData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [minUrgency, setMinUrgency] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [issues]);

  // Filter issues based on criteria
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedCategory !== 'ALL' && issue.category !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && issue.status !== selectedStatus) return false;
      if (issue.urgency_score < minUrgency) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = issue.issue_id.toLowerCase().includes(query);
        const matchDesc = issue.description.toLowerCase().includes(query);
        const matchCat = issue.category.toLowerCase().includes(query);
        if (!matchId && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [issues, selectedCategory, selectedStatus, minUrgency, searchQuery]);

  // Handle status update
  const handleStatusUpdate = async (issueId: string, newStatus: string) => {
    setUpdatingIssueId(issueId);
    try {
      await api.updateIssueStatus(issueId, newStatus);
      onRefreshData();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingIssueId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Refresh / Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-white/90">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-stone-900">Municipal Dispatch Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200">
              India Region (AMC / BMC / MCD / BBMP)
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Real-time urban asset monitoring, Indian municipal ward spatial triage, and field maintenance dispatch.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefreshData}
            className="p-2.5 rounded-xl bg-white border border-orange-200 hover:bg-orange-50 text-stone-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4 text-orange-600" />
            <span>Sync</span>
          </button>

          <a
            href={api.getExportUrl()}
            download
            className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-md shadow-orange-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Database (CSV)</span>
          </a>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Total Incidents</span>
            <Activity className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {stats?.total_issues ?? issues.length}
          </div>
          <span className="text-[11px] text-stone-500">Active municipal records</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Avg Urgency</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {stats?.avg_urgency ?? 0} <span className="text-sm font-normal text-stone-500">/ 10</span>
          </div>
          <span className="text-[11px] text-stone-500">Severity index</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Pending</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            {stats?.pending_count ?? issues.filter((i) => i.status === 'Pending').length}
          </div>
          <span className="text-[11px] text-stone-500">Awaiting field crew</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">In Progress</span>
            <RefreshCw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {stats?.in_progress_count ?? issues.filter((i) => i.status === 'In Progress').length}
          </div>
          <span className="text-[11px] text-stone-500">Ward team deployed</span>
        </div>

        <div className="glass-panel p-5 rounded-xl col-span-2 lg:col-span-1 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {stats?.resolved_count ?? issues.filter((i) => i.status === 'Resolved').length}
          </div>
          <span className="text-[11px] text-stone-500">Repairs certified</span>
        </div>
      </div>

      {/* Spatial Map Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <span>India Geospatial Hazard Map</span>
          </h2>
          <span className="text-xs font-medium text-stone-500">
            Showing {filteredIssues.length} active Indian municipal incidents
          </span>
        </div>

        <HazardMap issues={filteredIssues} onStatusUpdated={onRefreshData} />
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-orange-600" />
            <span>Filter & Search Incidents</span>
          </h3>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
              setMinUrgency(1);
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-orange-700 hover:text-orange-900"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search by ID, landmark, or street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-orange-200 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Urgency Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-stone-600">
              <span>Min Urgency:</span>
              <span className="font-bold text-orange-700">{minUrgency} / 10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={minUrgency}
              onChange={(e) => setMinUrgency(Number(e.target.value))}
              className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>
        </div>
      </div>

      {/* Live Data Table Editor */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-orange-200/80 bg-orange-50/40 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">Live Indian Municipal Records</h3>
            <p className="text-xs text-stone-500">
              Update status dropdown for any incident to synchronize with municipal field dispatch.
            </p>
          </div>
          <span className="text-xs text-stone-600 font-semibold bg-white px-2.5 py-1 rounded-lg border border-orange-200">
            Showing {filteredIssues.length} of {issues.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-orange-50/80 text-[11px] uppercase tracking-wider text-stone-700 border-b border-orange-200 font-bold">
              <tr>
                <th className="px-4 py-3.5">Issue ID</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Urgency</th>
                <th className="px-4 py-3.5">Description / Landmark</th>
                <th className="px-4 py-3.5">Status (Live Edit)</th>
                <th className="px-4 py-3.5">Coordinates</th>
                <th className="px-4 py-3.5 text-right">Upvotes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 bg-white/70">
              {filteredIssues.slice(0, 100).map((issue) => (
                <tr
                  key={issue.issue_id}
                  className="hover:bg-orange-50/60 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-bold text-orange-700">
                    {issue.issue_id}
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {issue.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        issue.urgency_score >= 8
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : issue.urgency_score >= 5
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {issue.urgency_score} / 10
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-stone-600">
                    {issue.description}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block w-32">
                      <select
                        value={issue.status}
                        disabled={updatingIssueId === issue.issue_id}
                        onChange={(e) => handleStatusUpdate(issue.issue_id, e.target.value)}
                        className={`w-full py-1 px-2 rounded-lg text-xs font-bold appearance-none border transition-all cursor-pointer ${
                          issue.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : issue.status === 'In Progress'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-2.5 pointer-events-none text-stone-500" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-stone-500">
                    {issue.latitude !== null && issue.longitude !== null
                      ? `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-stone-800">
                    {issue.upvotes || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
