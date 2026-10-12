import React, { useState } from 'react';
import { Code2, GitFork, CheckCircle, Database, Layers, Cpu, ShieldAlert, FileText, Terminal } from 'lucide-react';

export const PipelineView: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<'train' | 'eval' | 'generate'>('train');

  const scripts = {
    train: `# ml_pipeline/train.py
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, average_precision_score

def train_vitalwatch_model(df):
    # 1. Feature Engineering: Rolling 1h, 3h, 6h stats, slopes, shock index
    X, y, groups, feature_names = extract_rolling_features(df)
    
    # 2. Patient-level split to prevent data leakage across ICU stays
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    
    # 3. Base Gradient Boosting Ensemble with class weighting
    base_gbm = HistGradientBoostingClassifier(
        max_iter=150,
        learning_rate=0.08,
        max_depth=6,
        class_weight='balanced'
    )
    
    # 4. Probability Calibration (Isotonic Regression)
    calibrated_model = CalibratedClassifierCV(
        estimator=base_gbm,
        method='isotonic',
        cv=3
    )
    calibrated_model.fit(X[train_idx], y[train_idx])
    
    # 5. Persist production artifact
    joblib.dump({
        'model': calibrated_model,
        'feature_names': feature_names
    }, 'models/vitalwatch_model.joblib')`,

    eval: `# ml_pipeline/evaluate.py
import numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score, roc_curve

def evaluate_models(y_true, y_pred_ai, y_pred_news2):
    # AUROC & AUPRC calculation
    auroc_ai = roc_auc_score(y_true, y_pred_ai)
    auprc_ai = average_precision_score(y_true, y_pred_ai)
    
    auroc_news2 = roc_auc_score(y_true, y_pred_news2)
    auprc_news2 = average_precision_score(y_true, y_pred_news2)
    
    # Sensitivity at 90% Specificity
    fpr, tpr, _ = roc_curve(y_true, y_pred_ai)
    sens_at_90 = tpr[np.argmin(np.abs((1 - fpr) - 0.90))]
    
    print(f"VitalWatch AUROC: {auroc_ai:.3f} (+{auroc_ai - auroc_news2:.3f} over NEWS2)")
    print(f"VitalWatch AUPRC: {auprc_ai:.3f} (+{auprc_ai - auprc_news2:.3f} over NEWS2)")
    print(f"Sensitivity @ 90% Spec: {sens_at_90*100:.1f}%")`,

    generate: `# ml_pipeline/generate_dataset.py
import numpy as np
import pandas as pd

def generate_cohort(num_patients=250, hours=48):
    # Generates physiological trajectories (stable, sepsis crash, respiratory failure)
    # Sampling: every 10 min, noise injection, and 6-hour pre-deterioration window labels
    ...
    return df.to_csv('data/patient_vitals_dataset.csv', index=False)`,
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Machine Learning Pipeline & Artifacts</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          End-to-end clinical machine learning pipeline: from continuous EHR vitals ingestion,
          windowed feature derivation, class-weighted Gradient Boosting, Isotonic probability calibration,
          to TreeSHAP local explanations and debounced alerting.
        </p>
      </div>

      {/* Visual Architecture Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Pipeline Architecture Flow</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> Step 1: Ingestion
              </div>
              <h4 className="font-semibold text-white mt-1">Continuous Vitals</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                HR, SBP, DBP, SpO2, RR, Temp, AVPU & FiO2 sampled with noise & dropouts.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-cyan-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Step 2: Features
              </div>
              <h4 className="font-semibold text-white mt-1">Rolling Windows</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Mean, std, slopes (least squares), Shock Index, MAP, time outside normal ranges.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-indigo-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> Step 3: Ensemble
              </div>
              <h4 className="font-semibold text-white mt-1">Gradient Boosting</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Patient-stratified GroupKFold split, balanced class weights, non-linear interactions.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-amber-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Step 4: Calibration
              </div>
              <h4 className="font-semibold text-white mt-1">Isotonic Scaling</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Calibrated probability output 0-100 reflecting true empirical ICU risk.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-rose-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Step 5: Triage
              </div>
              <h4 className="font-semibold text-white mt-1">SHAP & Debounce</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                TreeSHAP factor explanations + 300s debouncing cooldown to prevent fatigue.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              Python ML Pipeline Scripts
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedScript('train')}
              className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                selectedScript === 'train'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              train.py
            </button>
            <button
              onClick={() => setSelectedScript('eval')}
              className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                selectedScript === 'eval'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              evaluate.py
            </button>
            <button
              onClick={() => setSelectedScript('generate')}
              className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                selectedScript === 'generate'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              generate_dataset.py
            </button>
          </div>
        </div>

        <pre className="p-4 text-xs font-mono text-emerald-300 bg-slate-950/90 overflow-x-auto leading-relaxed">
          <code>{scripts[selectedScript]}</code>
        </pre>
      </div>
    </div>
  );
};
