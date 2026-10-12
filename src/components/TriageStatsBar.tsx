import React from 'react';
import { WardType } from '../types/patient';
import { ShieldAlert, ShieldCheck, AlertTriangle, Users, Search, ArrowUpDown, Filter } from 'lucide-react';

interface TriageStatsBarProps {
  selectedWard: WardType | 'All';
  setSelectedWard: (ward: WardType | 'All') => void;
  totalCount: number;
  highRiskCount: number;
  medRiskCount: number;
  lowRiskCount: number;
  activeAlertCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'risk_desc' | 'velocity_desc' | 'news2_desc' | 'bed_asc';
  setSortBy: (sort: 'risk_desc' | 'velocity_desc' | 'news2_desc' | 'bed_asc') => void;
}

const WARDS: (WardType | 'All')[] = [
  'All',
  'ICU',
  'Acute Medical',
  'Cardiac Care',
  'Step-Down',
  'General Ward',
];

export const TriageStatsBar: React.FC<TriageStatsBarProps> = ({
  selectedWard,
  setSelectedWard,
  totalCount,
  highRiskCount,
  medRiskCount,
  lowRiskCount,
  activeAlertCount,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Top Clinical Census Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Active Census</span>
            <Users className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalCount}</span>
            <span className="text-xs text-slate-400">monitored beds</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 rounded-lg p-3 bg-rose-950/10">
          <div className="text-xs text-rose-400 flex items-center justify-between">
            <span className="font-medium">High Risk (70-100)</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{highRiskCount}</span>
            <span className="text-xs text-rose-300/80">urgent triage</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 rounded-lg p-3 bg-amber-950/10">
          <div className="text-xs text-amber-400 flex items-center justify-between">
            <span className="font-medium">Medium Risk (40-69)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{medRiskCount}</span>
            <span className="text-xs text-amber-300/80">watch closely</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 rounded-lg p-3 bg-emerald-950/10">
          <div className="text-xs text-emerald-400 flex items-center justify-between">
            <span className="font-medium">Stable / Low (0-39)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{lowRiskCount}</span>
            <span className="text-xs text-emerald-300/80">routine care</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Pending Alerts</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{activeAlertCount}</span>
            <span className="text-xs text-slate-400">awaiting review</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>AI Lead Time</span>
            <span className="text-[10px] text-emerald-400 font-mono">+2.9h vs NEWS2</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">4.3h</span>
            <span className="text-xs text-slate-400">advance warning</span>
          </div>
        </div>
      </div>

      {/* Ward Filter Pills & Search / Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
        {/* Ward Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs text-slate-500 font-medium px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Ward:
          </span>
          {WARDS.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWard(w)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedWard === w
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search patient, bed, dx..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-slate-600 placeholder:text-slate-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="risk_desc" className="bg-slate-900 text-white">
                Highest Risk First
              </option>
              <option value="velocity_desc" className="bg-slate-900 text-white">
                Fastest Rising (Velocity)
              </option>
              <option value="news2_desc" className="bg-slate-900 text-white">
                Highest NEWS2 First
              </option>
              <option value="bed_asc" className="bg-slate-900 text-white">
                Bed Number (A-Z)
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
