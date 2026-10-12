import React, { useState } from 'react';
import { Patient, ConsciousnessLevel } from '../types/patient';
import {
  X,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  Zap,
  TrendingUp,
  Brain,
  Shield,
  Clock,
  Send,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface PatientDetailModalProps {
  patient: Patient | null;
  onClose: () => void;
  onAcknowledgeAlert: (alertId: string, clinician: string) => void;
  onResolveAlert: (alertId: string, clinician: string, notes?: string) => void;
  onAddNote: (patientId: string, text: string, type: any) => void;
  onInjectEvent: (patientId: string, event: any) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  onAcknowledgeAlert,
  onResolveAlert,
  onAddNote,
  onInjectEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'shap' | 'actions' | 'notes'>('telemetry');
  const [newNoteText, setNewNoteText] = useState('');
  const [clinicianName, setClinicianName] = useState('Dr. Alex Mercer, MD');
  const [resolveText, setResolveText] = useState('Patient reviewed bedside; condition stabilized after intervention.');

  if (!patient) return null;

  const v = patient.currentVitals;
  const isHighRisk = patient.riskScore >= 70;
  const isMedRisk = patient.riskScore >= 40 && patient.riskScore < 70;

  // Telemetry chart series formatting
  const chartData = patient.vitalsHistory.map((item, idx) => {
    const timeFormatted = new Date(item.timestamp * 1000).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    });
    const riskMatch = patient.riskScoreHistory[idx] || { score: patient.riskScore, news2: patient.news2.total };
    return {
      time: timeFormatted,
      heartRate: item.heartRate,
      systolicBP: item.systolicBP,
      diastolicBP: item.diastolicBP,
      spO2: item.spO2,
      respiratoryRate: item.respiratoryRate,
      temperature: item.temperature,
      shockIndex: item.shockIndex,
      aiRiskScore: riskMatch.score,
      news2Score: riskMatch.news2 * 5, // scaled to 100 for visual overlay
      news2Raw: riskMatch.news2,
    };
  });

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(patient.id, newNoteText.trim(), 'assessment');
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-sm bg-slate-800 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700">
                {patient.bed}
              </span>
              <span className="text-xs text-slate-400">{patient.ward}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">Adm {patient.admissionHoursAgo}h ago</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                Trajectory: {patient.trajectory.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="mt-1.5 flex items-baseline gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {patient.name}
              </h2>
              <span className="text-sm text-slate-400">
                {patient.age}y / {patient.sex}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              <strong className="text-slate-400">Diagnosis:</strong> {patient.admissionDiagnosis}
              {patient.comorbidities.length > 0 && (
                <span className="text-slate-400"> ({patient.comorbidities.join(', ')})</span>
              )}
            </p>
          </div>

          {/* Quick Risk Score Header Widget */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">AI Risk Score</div>
              <div
                className={`text-2xl sm:text-3xl font-bold font-mono ${
                  isHighRisk ? 'text-rose-400' : isMedRisk ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {patient.riskScore}
                <span className="text-xs font-normal text-slate-500">/100</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                NEWS2: {patient.news2.total} ({patient.news2.riskBand})
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/80">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'telemetry'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Continuous Telemetry & Trends
          </button>

          <button
            onClick={() => setActiveTab('shap')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'shap'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            SHAP Explainability & NEWS2
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'actions'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Triage & Interventions
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'notes'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Clinical Notes ({patient.notes.length})
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CONTINUOUS TELEMETRY CHARTS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Current Vitals Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-400" /> Heart Rate
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-slate-100">
                    {Math.round(v.heartRate)}{' '}
                    <span className="text-xs font-normal text-slate-500">bpm</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Normal: 60-100</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400">Blood Pressure</div>
                  <div className="text-xl font-bold font-mono mt-1 text-slate-100">
                    {Math.round(v.systolicBP)}/{Math.round(v.diastolicBP)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    MAP: {Math.round(v.meanArterialPressure)} mmHg
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> SpO2 Sat
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-slate-100">
                    {Math.round(v.spO2)}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {v.supplementalO2 ? `Supp O2 (${(v.fiO2 * 100).toFixed(0)}%)` : 'Room Air'}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-indigo-400" /> Resp Rate
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-slate-100">
                    {Math.round(v.respiratoryRate)}{' '}
                    <span className="text-xs font-normal text-slate-500">/min</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Normal: 12-20</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temp
                  </div>
                  <div className="text-xl font-bold font-mono mt-1 text-slate-100">
                    {v.temperature.toFixed(1)} °C
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Core tympanic</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400">Shock Index</div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      v.shockIndex > 0.9 ? 'text-rose-400' : 'text-slate-100'
                    }`}
                  >
                    {v.shockIndex.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Normal: 0.5-0.7</div>
                </div>
              </div>

              {/* Chart 1: AI Risk Score vs Scaled NEWS2 Trajectory */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Risk Score Progression vs NEWS2 Benchmark
                    </h3>
                    <p className="text-xs text-slate-400">
                      AI score (0-100) incorporates physiological rate-of-change and nonlinear patterns
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> VitalWatch AI
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> NEWS2 Score (x5)
                    </div>
                  </div>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#f43f5e"
                        strokeDasharray="4 4"
                        label={{ value: 'High Risk (70)', fill: '#f43f5e', fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={40}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{ value: 'Medium Risk (40)', fill: '#f59e0b', fontSize: 10 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="aiRiskScore"
                        name="AI Risk Score"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="news2Score"
                        name="NEWS2 (Scaled)"
                        stroke="#f59e0b"
                        strokeWidth={1.8}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Hemodynamics (Heart Rate & Blood Pressure) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" />
                    Hemodynamics: Heart Rate & Systolic BP
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} domain={[40, 180]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="heartRate"
                          name="Heart Rate (bpm)"
                          stroke="#f43f5e"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="systolicBP"
                          name="Systolic BP (mmHg)"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Ventilation & Saturation (SpO2 & RR) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-indigo-400" />
                    Respiratory Profile: SpO2 & Respiratory Rate
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                        <YAxis yAxisId="spo2" stroke="#22d3ee" domain={[70, 100]} fontSize={11} />
                        <YAxis
                          yAxisId="rr"
                          orientation="right"
                          stroke="#818cf8"
                          domain={[5, 45]}
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Line
                          yAxisId="spo2"
                          type="monotone"
                          dataKey="spO2"
                          name="SpO2 (%)"
                          stroke="#22d3ee"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="rr"
                          type="monotone"
                          dataKey="respiratoryRate"
                          name="Resp Rate (/min)"
                          stroke="#818cf8"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHAP EXPLAINABILITY & NEWS2 */}
          {activeTab === 'shap' && (
            <div className="space-y-6">
              {/* Executive Clinical Summary */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  <Brain className="w-4 h-4" /> AI Decision Attribution (TreeSHAP)
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {patient.clinicalSummary}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400">
                  <div>
                    Ward Baseline Risk: <span className="text-white">{patient.baseRisk}%</span>
                  </div>
                  <div>
                    Sum of SHAP Additions:{' '}
                    <span className="text-emerald-400">
                      {(patient.riskScore - patient.baseRisk >= 0 ? '+' : '')}
                      {(patient.riskScore - patient.baseRisk).toFixed(1)} pts
                    </span>
                  </div>
                  <div>
                    Final Calibrated Score: <span className="text-white font-bold">{patient.riskScore}</span>
                  </div>
                </div>
              </div>

              {/* Waterfall / Factor Contribution Bar List */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Local Feature Attributions (SHAP Factor Decomposition)
                </h3>
                <div className="space-y-2.5">
                  {patient.shapAttributions.map((factor) => {
                    const isPositive = factor.contribution >= 0;
                    const barWidth = Math.min(100, Math.abs(factor.contribution) * 3.5);

                    return (
                      <div
                        key={factor.feature}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{factor.label}</span>
                            <span className="text-slate-400 font-mono">({factor.value})</span>
                          </div>
                          <span
                            className={`font-mono font-bold text-xs ${
                              isPositive ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {factor.contribution.toFixed(1)} pts
                          </span>
                        </div>

                        {/* Progress attribution bar */}
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full ${
                              isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <div className="text-[11px] text-slate-400">
                          {factor.clinicalSignificance}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEWS2 Clinical Benchmark Comparison Table */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-2">
                  NEWS2 Component Breakdown (Clinical Rule Benchmark)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Respiration Rate:</span>{' '}
                    <strong className="text-white">{patient.news2.respiratoryRate} pts</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">SpO2 Scale 1:</span>{' '}
                    <strong className="text-white">{patient.news2.spO2} pts</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Supplemental O2:</span>{' '}
                    <strong className="text-white">{patient.news2.supplementalO2} pts</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Systolic BP:</span>{' '}
                    <strong className="text-white">{patient.news2.systolicBP} pts</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Pulse / Heart Rate:</span>{' '}
                    <strong className="text-white">{patient.news2.heartRate} pts</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Consciousness (AVPU):</span>{' '}
                    <strong className="text-white">{patient.news2.consciousness} pts</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400">Temperature:</span>{' '}
                    <strong className="text-white">{patient.news2.temperature} pts</strong>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">NEWS2 Total:</span>{' '}
                    <strong className="text-amber-400 font-mono text-sm">
                      {patient.news2.total} ({patient.news2.riskBand})
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRIAGE & INTERVENTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-6">
              {/* Active Alert Management */}
              {patient.activeAlert ? (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <h3 className="font-semibold text-rose-200">
                        Active Alert: {patient.activeAlert.triggerReason}
                      </h3>
                    </div>
                    <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-rose-900 text-rose-200">
                      Status: {patient.activeAlert.state}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Triggered at {new Date(patient.activeAlert.timestamp * 1000).toLocaleTimeString()}
                    {patient.activeAlert.acknowledgedBy && (
                      <span> · Acknowledged by {patient.activeAlert.acknowledgedBy}</span>
                    )}
                  </p>

                  <div className="flex items-center gap-3">
                    {patient.activeAlert.state === 'new' && (
                      <button
                        onClick={() =>
                          patient.activeAlert &&
                          onAcknowledgeAlert(patient.activeAlert.id, clinicianName)
                        }
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Acknowledge Bedside Assessment
                      </button>
                    )}

                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={resolveText}
                        onChange={(e) => setResolveText(e.target.value)}
                        placeholder="Resolution summary notes..."
                        className="flex-1 bg-slate-900 border border-slate-700 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          patient.activeAlert &&
                          onResolveAlert(patient.activeAlert.id, clinicianName, resolveText)
                        }
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                      >
                        Resolve Alert
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs">No active alert triggered. Patient vitals monitored within stable thresholds.</span>
                </div>
              )}

              {/* Simulation Testing: Inject Scenarios */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Clinical Shock Simulator (Evaluate Model Reaction)
                </h3>
                <p className="text-xs text-slate-400">
                  Trigger an acute physiological deterioration to test early warning detection lead time:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => onInjectEvent(patient.id, 'septic_shock')}
                    className="p-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-left transition-colors"
                  >
                    <div className="text-xs font-semibold text-rose-300">Septic Shock</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Tachycardia, wide pulse pressure, SIRS pyrexia followed by hypotension
                    </div>
                  </button>

                  <button
                    onClick={() => onInjectEvent(patient.id, 'respiratory_arrest')}
                    className="p-3 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/80 text-left transition-colors"
                  >
                    <div className="text-xs font-semibold text-indigo-300">Respiratory Crisis</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Severe tachypnea, SpO2 desaturation trajectory & oxygen requirement
                    </div>
                  </button>

                  <button
                    onClick={() => onInjectEvent(patient.id, 'cardiogenic_shock')}
                    className="p-3 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 text-left transition-colors"
                  >
                    <div className="text-xs font-semibold text-amber-300">Cardiogenic Shock</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Myocardial ischemia, collapsing MAP, high shock index
                    </div>
                  </button>

                  <button
                    onClick={() => onInjectEvent(patient.id, 'administer_treatment')}
                    className="p-3 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/80 text-left transition-colors"
                  >
                    <div className="text-xs font-semibold text-emerald-300">Administer Treatment</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      IV fluid bolus, broad-spectrum antibiotics, titrated high-flow O2
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL NOTES & AUDIT TRAIL */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record clinician assessment or bedside orders (e.g., 'Ordered STAT arterial blood gas')..."
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-slate-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Add Note
                </button>
              </form>

              <div className="space-y-2.5">
                {patient.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400">{note.clinician}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(note.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
