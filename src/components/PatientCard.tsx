import React from 'react';
import { Patient } from '../types/patient';
import { Heart, Wind, Droplets, Thermometer, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, User } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onSelect: (patient: Patient) => void;
  onQuickAcknowledge: (alertId: string) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onSelect,
  onQuickAcknowledge,
}) => {
  const v = patient.currentVitals;
  const isHighRisk = patient.riskScore >= 70;
  const isMedRisk = patient.riskScore >= 40 && patient.riskScore < 70;

  // Sparkline calculation
  const historyScores = patient.riskScoreHistory.map((h) => h.score);
  const minScore = Math.min(...historyScores, 0);
  const maxScore = Math.max(...historyScores, 100);
  const range = maxScore - minScore || 1;
  const sparklinePoints = historyScores
    .map((val, idx) => {
      const x = (idx / (historyScores.length - 1 || 1)) * 100;
      const y = 30 - ((val - minScore) / range) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Risk styling
  let badgeBorder = 'border-slate-800';
  let badgeBg = 'bg-slate-900';
  let scoreColor = 'text-emerald-400';
  let ringColor = 'border-emerald-500/40';

  if (isHighRisk) {
    badgeBorder = 'border-rose-900/60 hover:border-rose-700/80';
    badgeBg = 'bg-slate-900/95';
    scoreColor = 'text-rose-400';
    ringColor = 'border-rose-500/80';
  } else if (isMedRisk) {
    badgeBorder = 'border-amber-900/60 hover:border-amber-700/80';
    badgeBg = 'bg-slate-900/95';
    scoreColor = 'text-amber-400';
    ringColor = 'border-amber-500/60';
  } else {
    badgeBorder = 'border-slate-800 hover:border-slate-700';
    scoreColor = 'text-emerald-400';
  }

  return (
    <div
      onClick={() => onSelect(patient)}
      className={`group relative rounded-xl border ${badgeBorder} ${badgeBg} p-4 transition-all duration-150 hover:shadow-lg cursor-pointer flex flex-col justify-between`}
    >
      {/* Top Row: Bed, Ward, Demographics, Risk Score */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {patient.bed}
              </span>
              <span className="text-xs text-slate-400 truncate">{patient.ward}</span>
              {v.sensorStatus === 'dropout' && (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/80 px-1.5 py-0.2 rounded">
                  SENSOR DROPOUT
                </span>
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <h3 className="text-base font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                {patient.name}
              </h3>
              <span className="text-xs text-slate-400">
                {patient.age}y·{patient.sex}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5" title={patient.admissionDiagnosis}>
              {patient.admissionDiagnosis}
            </p>
          </div>

          {/* Calibrated AI Risk Score Circle / Value */}
          <div className="flex flex-col items-end">
            <div
              className={`w-14 h-14 rounded-xl border-2 ${ringColor} bg-slate-950 flex flex-col items-center justify-center shadow-inner`}
            >
              <span className={`text-xl font-bold font-mono tracking-tight ${scoreColor}`}>
                {patient.riskScore}
              </span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Risk Score
              </span>
            </div>

            {/* Velocity badge */}
            <div className="mt-1 flex items-center gap-0.5 text-[11px] font-mono">
              {patient.velocity30m > 5 ? (
                <span className="text-rose-400 flex items-center font-medium">
                  <ArrowUpRight className="w-3 h-3" />+{patient.velocity30m}/30m
                </span>
              ) : patient.velocity30m < -5 ? (
                <span className="text-emerald-400 flex items-center font-medium">
                  <ArrowDownRight className="w-3 h-3" />
                  {patient.velocity30m}/30m
                </span>
              ) : (
                <span className="text-slate-400 flex items-center">
                  <Minus className="w-3 h-3" />
                  stable
                </span>
              )}
            </div>
          </div>
        </div>

        {/* NEWS2 and Trajectory metadata */}
        <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800/80 pt-2 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400">NEWS2:</span>
            <span
              className={`font-mono font-semibold ${
                patient.news2.total >= 7
                  ? 'text-rose-400'
                  : patient.news2.total >= 5
                  ? 'text-amber-400'
                  : 'text-slate-300'
              }`}
            >
              {patient.news2.total} ({patient.news2.riskBand})
            </span>
          </div>

          {/* Sparkline */}
          <div className="w-20 h-6 flex items-center" title="Risk Score Trend (Last 30 min)">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30">
              <polyline
                fill="none"
                stroke={isHighRisk ? '#f43f5e' : isMedRisk ? '#f59e0b' : '#10b981'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
            </svg>
          </div>
        </div>

        {/* Vital Signs Grid */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 text-center">
          {/* Heart Rate */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
              <Heart className="w-2.5 h-2.5 text-rose-400" />
              <span>HR</span>
            </div>
            <div
              className={`font-mono font-bold text-xs mt-0.5 ${
                v.heartRate > 110 || v.heartRate < 50 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {Math.round(v.heartRate)}
            </div>
            <span className="text-[9px] text-slate-400">bpm</span>
          </div>

          {/* SpO2 */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
              <Droplets className="w-2.5 h-2.5 text-cyan-400" />
              <span>SpO2</span>
            </div>
            <div
              className={`font-mono font-bold text-xs mt-0.5 ${
                v.spO2 < 92 ? 'text-rose-400' : v.spO2 < 95 ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              {Math.round(v.spO2)}%
            </div>
            <span className="text-[9px] text-slate-400">
              {v.supplementalO2 ? 'O2' : 'Air'}
            </span>
          </div>

          {/* Blood Pressure */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400">BP</div>
            <div
              className={`font-mono font-bold text-xs mt-0.5 ${
                v.systolicBP < 95 || v.systolicBP > 180 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {Math.round(v.systolicBP)}/{Math.round(v.diastolicBP)}
            </div>
            <span className="text-[9px] text-slate-400">mmHg</span>
          </div>

          {/* Respiratory Rate */}
          <div className="p-1">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
              <Wind className="w-2.5 h-2.5 text-indigo-400" />
              <span>RR</span>
            </div>
            <div
              className={`font-mono font-bold text-xs mt-0.5 ${
                v.respiratoryRate > 24 || v.respiratoryRate < 10
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {Math.round(v.respiratoryRate)}
            </div>
            <span className="text-[9px] text-slate-400">/min</span>
          </div>
        </div>

        {/* Derived Secondary Metrics: Shock Index & Temp */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div>
            <span>Shock Index: </span>
            <span
              className={`font-mono font-medium ${
                v.shockIndex > 0.9 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {v.shockIndex.toFixed(2)}
            </span>
          </div>
          <div>
            <span>Temp: </span>
            <span
              className={`font-mono font-medium ${
                v.temperature >= 38.3 || v.temperature <= 35.5 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {v.temperature.toFixed(1)}°C
            </span>
          </div>
        </div>
      </div>

      {/* Active Alert Banner or Status Footer */}
      {patient.activeAlert && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`mt-3 p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            patient.activeAlert.severity === 'critical' || patient.activeAlert.state === 'escalated'
              ? 'bg-rose-950/60 border-rose-800/80 text-rose-200 animate-pulse'
              : patient.activeAlert.severity === 'high'
              ? 'bg-rose-950/40 border-rose-900/60 text-rose-300'
              : 'bg-amber-950/40 border-amber-900/60 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate text-[11px] font-medium">
              {patient.activeAlert.triggerReason}
            </span>
          </div>

          {patient.activeAlert.state === 'new' || patient.activeAlert.state === 'escalated' ? (
            <button
              onClick={() => patient.activeAlert && onQuickAcknowledge(patient.activeAlert.id)}
              className="shrink-0 px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium transition-colors shadow-sm"
            >
              Ack
            </button>
          ) : (
            <span className="shrink-0 text-[10px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Acked
            </span>
          )}
        </div>
      )}
    </div>
  );
};
