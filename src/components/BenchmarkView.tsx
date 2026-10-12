import React, { useState } from 'react';
import {
  BENCHMARK_MODELS,
  ROC_CURVE_DATA,
  PR_CURVE_DATA,
  LEAD_TIME_DISTRIBUTION,
  FEATURE_IMPORTANCE_SUMMARY,
  COHORT_METADATA,
} from '../services/benchmarkData';
import { calculateNEWS2 } from '../services/news2Engine';
import { predictDeteriorationRisk } from '../services/mlEngine';
import { VitalSignReading, ConsciousnessLevel } from '../types/patient';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const BenchmarkView: React.FC = () => {
  // Interactive Risk Sandbox State
  const [simHr, setSimHr] = useState(115);
  const [simSbp, setSimSbp] = useState(98);
  const [simDbp, setSimDbp] = useState(62);
  const [simSpo2, setSimSpo2] = useState(92);
  const [simRr, setSimRr] = useState(25);
  const [simTemp, setSimTemp] = useState(38.8);
  const [simAvpu, setSimAvpu] = useState<ConsciousnessLevel>('Alert');
  const [simO2, setSimO2] = useState(true);

  // Compute live sandbox output
  const dummyReading: VitalSignReading = {
    timestamp: Math.floor(Date.now() / 1000),
    heartRate: simHr,
    systolicBP: simSbp,
    diastolicBP: simDbp,
    spO2: simSpo2,
    respiratoryRate: simRr,
    temperature: simTemp,
    consciousness: simAvpu,
    supplementalO2: simO2,
    fiO2: simO2 ? 0.35 : 0.21,
    shockIndex: simSbp > 0 ? simHr / simSbp : 1.0,
    meanArterialPressure: (2 * simDbp + simSbp) / 3,
    pulsePressure: simSbp - simDbp,
    sensorStatus: 'normal',
  };

  const sandboxNews2 = calculateNEWS2(dummyReading);
  const sandboxPrediction = predictDeteriorationRisk(dummyReading, [dummyReading]);

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">
                Clinical Validation & Benchmark vs NHS NEWS2
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Evaluated on {COHORT_METADATA.totalPatientStays} ({COHORT_METADATA.observationHours}) with a{' '}
              {COHORT_METADATA.predictionWindow}. Split: {COHORT_METADATA.evalSplit}. Probability calibrated via{' '}
              {COHORT_METADATA.calibrationMethod}.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg font-mono text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>AUROC: 0.914 (+0.132 over NEWS2)</span>
          </div>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <h3 className="text-sm font-semibold text-white">
            Performance Metrics on 6-Hour Deterioration Prediction
          </h3>
          <p className="text-xs text-slate-400">
            Comparing calibrated machine learning models directly against Royal College of Physicians NEWS2
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Model Architecture</th>
                <th className="py-3 px-3">AUROC</th>
                <th className="py-3 px-3">AUPRC</th>
                <th className="py-3 px-3">Sens @ 90% Spec</th>
                <th className="py-3 px-3">Sens @ 95% Spec</th>
                <th className="py-3 px-3">Lead Time (Mean)</th>
                <th className="py-3 px-3">False Alerts / Bed-Day</th>
                <th className="py-3 px-3">Brier Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {BENCHMARK_MODELS.map((m, idx) => (
                <tr
                  key={m.modelName}
                  className={
                    idx === 0
                      ? 'bg-emerald-950/20 text-emerald-300 font-bold'
                      : m.category === 'Clinical Benchmark'
                      ? 'bg-amber-950/10 text-amber-200'
                      : 'text-slate-300'
                  }
                >
                  <td className="py-3 px-4 font-sans flex items-center gap-1.5">
                    {idx === 0 && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    <span>{m.modelName}</span>
                  </td>
                  <td className="py-3 px-3">{m.auroc.toFixed(3)}</td>
                  <td className="py-3 px-3">{m.auprc.toFixed(3)}</td>
                  <td className="py-3 px-3">{(m.sensAt90Spec * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3">{(m.sensAt95Spec * 100).toFixed(1)}%</td>
                  <td className="py-3 px-3 text-emerald-400">{m.meanLeadTimeHours} hours</td>
                  <td className="py-3 px-3">{m.falseAlertsPerBedDay}</td>
                  <td className="py-3 px-3">{m.brierScore.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts: ROC Curve & PR Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Receiver Operating Characteristic (ROC)
              </h3>
              <p className="text-xs text-slate-400">AUROC 0.914 (VitalWatch) vs 0.782 (NEWS2)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">VitalWatch</span>
              <span className="text-amber-400">NEWS2</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ROC_CURVE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="fpr" label={{ value: '1 - Specificity (FPR)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} stroke="#64748b" fontSize={11} />
                <YAxis label={{ value: 'Sensitivity (TPR)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} stroke="#64748b" fontSize={11} domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="vitalWatchTpr" name="VitalWatch AI (0.914)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="news2Tpr" name="NEWS2 Score (0.782)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="baselineTpr" name="Chance (0.50)" stroke="#64748b" strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precision-Recall Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Precision-Recall (PR) Curve
              </h3>
              <p className="text-xs text-slate-400">Critical under class imbalance (11.9% incidence)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">VitalWatch (0.835)</span>
              <span className="text-amber-400">NEWS2 (0.615)</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PR_CURVE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="recall" label={{ value: 'Recall / Sensitivity', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} stroke="#64748b" fontSize={11} />
                <YAxis label={{ value: 'Precision / PPV', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} stroke="#64748b" fontSize={11} domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="vitalWatchPrecision" name="VitalWatch AUPRC" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="news2Precision" name="NEWS2 AUPRC" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lead Time Distribution & Alert Fatigue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              Lead Time Distribution Prior to Decompensation
            </h3>
            <p className="text-xs text-slate-400">
              64% of VitalWatch alerts fire &gt; 4 hours before acute event (mean 4.3h) vs 20% for NEWS2
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LEAD_TIME_DISTRIBUTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="vitalWatchPercent" name="VitalWatch AI (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="news2Percent" name="NEWS2 Score (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top SHAP Global Feature Importance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Global Feature Importance (Mean |SHAP Value|)
            </h3>
            <p className="text-xs text-slate-400">
              Shock Index (HR/SBP) and SpO2 slope drive greatest predictive variance
            </p>
          </div>
          <div className="space-y-2">
            {FEATURE_IMPORTANCE_SUMMARY.slice(0, 5).map((item) => (
              <div key={item.feature} className="p-2 rounded bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {item.rank}. {item.feature}
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px]">
                    {(item.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${item.importance * 350}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INTERACTIVE CLINICAL RISK SCORE SANDBOX / SIMULATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Interactive Model Simulator (What-If Sandbox)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust patient vitals to observe the real-time AI risk score calculation and SHAP attributions:
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center min-w-28">
              <div className="text-[10px] font-mono text-slate-400 uppercase">VitalWatch AI</div>
              <div
                className={`text-2xl font-bold font-mono ${
                  sandboxPrediction.riskScore >= 70
                    ? 'text-rose-400'
                    : sandboxPrediction.riskScore >= 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {sandboxPrediction.riskScore}/100
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center min-w-28">
              <div className="text-[10px] font-mono text-slate-400 uppercase">NEWS2 Score</div>
              <div
                className={`text-2xl font-bold font-mono ${
                  sandboxNews2.total >= 7
                    ? 'text-rose-400'
                    : sandboxNews2.total >= 5
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}
              >
                {sandboxNews2.total} ({sandboxNews2.riskBand})
              </div>
            </div>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* HR Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between font-mono mb-1">
              <span className="text-slate-400">Heart Rate (bpm)</span>
              <span className="text-white font-bold">{simHr}</span>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              value={simHr}
              onChange={(e) => setSimHr(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* SBP Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between font-mono mb-1">
              <span className="text-slate-400">Systolic BP (mmHg)</span>
              <span className="text-white font-bold">{simSbp}</span>
            </div>
            <input
              type="range"
              min="65"
              max="200"
              value={simSbp}
              onChange={(e) => setSimSbp(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* SpO2 Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between font-mono mb-1">
              <span className="text-slate-400">SpO2 (%)</span>
              <span className="text-white font-bold">{simSpo2}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="100"
              value={simSpo2}
              onChange={(e) => setSimSpo2(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Resp Rate Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between font-mono mb-1">
              <span className="text-slate-400">Respiratory Rate (/min)</span>
              <span className="text-white font-bold">{simRr}</span>
            </div>
            <input
              type="range"
              min="8"
              max="40"
              value={simRr}
              onChange={(e) => setSimRr(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Temperature Slider */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between font-mono mb-1">
              <span className="text-slate-400">Temperature (°C)</span>
              <span className="text-white font-bold">{simTemp.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="34.0"
              max="41.0"
              step="0.1"
              value={simTemp}
              onChange={(e) => setSimTemp(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* AVPU Consciousness */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">Consciousness (AVPU)</div>
            <select
              value={simAvpu}
              onChange={(e) => setSimAvpu(e.target.value as ConsciousnessLevel)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs"
            >
              <option value="Alert">Alert</option>
              <option value="Voice">Responds to Voice</option>
              <option value="Pain">Responds to Pain</option>
              <option value="Unresponsive">Unresponsive</option>
            </select>
          </div>

          {/* Supplemental Oxygen */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Supplemental O2:</span>
            <button
              onClick={() => setSimO2(!simO2)}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                simO2
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {simO2 ? 'Active (FiO2 35%)' : 'Room Air'}
            </button>
          </div>

          {/* Derived Shock Index */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between font-mono">
            <span className="text-slate-400 font-sans">Shock Index:</span>
            <span
              className={`font-bold ${
                dummyReading.shockIndex > 0.9 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {dummyReading.shockIndex.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Live SHAP Explanation in Sandbox */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <div className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            Live TreeSHAP Attribution Breakdown:
          </div>
          <div className="flex flex-wrap gap-2">
            {sandboxPrediction.shapAttributions.map((s) => (
              <span
                key={s.feature}
                className={`px-2 py-0.5 rounded border text-[11px] font-mono ${
                  s.contribution >= 0
                    ? 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60'
                }`}
              >
                {s.label}: {s.contribution >= 0 ? '+' : ''}
                {s.contribution.toFixed(1)} pts
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
