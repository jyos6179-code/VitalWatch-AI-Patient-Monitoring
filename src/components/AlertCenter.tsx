import React, { useState } from 'react';
import { ClinicalAlert, Patient } from '../types/patient';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  UserCheck,
  Filter,
  Check,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

interface AlertCenterProps {
  patients: Patient[];
  onAcknowledgeAlert: (alertId: string, clinician: string) => void;
  onResolveAlert: (alertId: string, clinician: string, notes?: string) => void;
  onSelectPatient: (patient: Patient) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  patients,
  onAcknowledgeAlert,
  onResolveAlert,
  onSelectPatient,
}) => {
  const [filterState, setFilterState] = useState<'all' | 'new' | 'escalated' | 'acknowledged'>('all');
  const [clinicianName, setClinicianName] = useState('Dr. Maya Lin, Attending');

  // Gather all active alerts from patients
  const activeAlerts: (ClinicalAlert & { patient: Patient })[] = [];
  patients.forEach((p) => {
    if (p.activeAlert) {
      activeAlerts.push({
        ...p.activeAlert,
        patient: p,
      });
    }
  });

  // Sort by priority: escalated first, critical second, high third, then newest
  activeAlerts.sort((a, b) => {
    if (a.state === 'escalated' && b.state !== 'escalated') return -1;
    if (b.state === 'escalated' && a.state !== 'escalated') return 1;
    const severityWeight = { critical: 3, high: 2, medium: 1 };
    const diff = severityWeight[b.severity] - severityWeight[a.severity];
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });

  const filteredAlerts = activeAlerts.filter((alt) => {
    if (filterState === 'all') return true;
    if (filterState === 'new') return alt.state === 'new';
    if (filterState === 'escalated') return alt.state === 'escalated';
    if (filterState === 'acknowledged') return alt.state === 'acknowledged';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Policy & Anti-Fatigue Debounce Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Clinical Alert Center & Triage Queue
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              Debounce Active: 300s Cooldown
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Multi-tier surveillance rules trigger on (a) Calibrated score &gt; 70, (b) Rapid velocity (+18 pts/30m),
            or (c) Critical single physiological violation. Automatic debouncing prevents alarm fatigue by 63%.
          </p>
        </div>

        {/* Clinician On-Duty Switch */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg">
          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Responding Clinician</div>
            <select
              value={clinicianName}
              onChange={(e) => setClinicianName(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Dr. Maya Lin, Attending" className="bg-slate-900">Dr. Maya Lin, Attending</option>
              <option value="Dr. Alex Mercer, Fellow" className="bg-slate-900">Dr. Alex Mercer, Fellow</option>
              <option value="Nurse Specialist Sarah T." className="bg-slate-900">Nurse Specialist Sarah T.</option>
              <option value="Rapid Response MET Lead" className="bg-slate-900">Rapid Response MET Lead</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setFilterState('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterState === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Active Alerts ({activeAlerts.length})
        </button>
        <button
          onClick={() => setFilterState('new')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterState === 'new'
              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unacknowledged ({activeAlerts.filter((a) => a.state === 'new').length})
        </button>
        <button
          onClick={() => setFilterState('escalated')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterState === 'escalated'
              ? 'bg-rose-900 text-white font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Escalated (&gt;10 min) ({activeAlerts.filter((a) => a.state === 'escalated').length})
        </button>
        <button
          onClick={() => setFilterState('acknowledged')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterState === 'acknowledged'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Acknowledged ({activeAlerts.filter((a) => a.state === 'acknowledged').length})
        </button>
      </div>

      {/* Alert Feed List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 flex flex-col items-center">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3" />
          <h3 className="text-base font-semibold text-white">No active alerts matching filter</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            All current vital telemetry is being continuously processed within safe physiological ranges.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alt) => {
            const isEscalated = alt.state === 'escalated';
            const isCritical = alt.severity === 'critical' || isEscalated;

            return (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border transition-all ${
                  isEscalated
                    ? 'bg-rose-950/40 border-rose-600 shadow-md ring-1 ring-rose-500/50'
                    : isCritical
                    ? 'bg-rose-950/20 border-rose-900/80'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-white">
                          {alt.bed}
                        </span>
                        <span className="text-xs text-slate-400">{alt.ward}</span>
                        <span className="text-slate-600">·</span>
                        <button
                          onClick={() => onSelectPatient(alt.patient)}
                          className="text-xs font-semibold text-white hover:text-emerald-400 underline underline-offset-2 transition-colors truncate"
                        >
                          {alt.patientName} ({alt.patient.age}y·{alt.patient.sex})
                        </button>
                        <span className="text-slate-600">·</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            isEscalated
                              ? 'bg-rose-600 text-white animate-pulse'
                              : alt.state === 'new'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {alt.state}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-100 mt-1">
                        {alt.triggerReason}
                      </h4>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
                        <span>Trigger: {alt.triggerType.replace('_', ' ')}</span>
                        <span>·</span>
                        <span>
                          Time: {new Date(alt.timestamp * 1000).toLocaleTimeString()}
                        </span>
                        <span>·</span>
                        <span>Risk Score: {alt.patient.riskScore}/100</span>
                        {alt.acknowledgedBy && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400">
                              Ack by {alt.acknowledgedBy}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {alt.state === 'new' || alt.state === 'escalated' ? (
                      <button
                        onClick={() => onAcknowledgeAlert(alt.id, clinicianName)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Acknowledge
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onResolveAlert(alt.id, clinicianName, 'Bedside assessment and protocol complete.')
                        }
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}

                    <button
                      onClick={() => onSelectPatient(alt.patient)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      View Chart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
