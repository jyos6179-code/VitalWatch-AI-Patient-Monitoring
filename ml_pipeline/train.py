"""
VitalWatch - ML Training Pipeline
Trains calibrated Gradient Boosting and Logistic Regression baseline models for 6-hour patient deterioration risk.
Computes SHAP explainers and saves models using joblib.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score, average_precision_score

def extract_features(df):
    """Extract rolling window features per patient."""
    print("Extracting physiological rolling features...")
    df = df.sort_values(by=['patient_id', 'time_hours']).copy()
    
    # Derived vitals
    df['shock_index'] = df['heart_rate'] / df['systolic_bp'].replace(0, np.nan)
    df['map'] = (2 * df['diastolic_bp'] + df['systolic_bp']) / 3
    df['pulse_pressure'] = df['systolic_bp'] - df['diastolic_bp']
    df['avpu_score'] = df['consciousness'].map({'Alert': 0, 'Voice': 3, 'Pain': 3, 'Unresponsive': 3}).fillna(0)

    features = []
    labels = []
    patient_ids = []

    # Group by patient
    for pid, group in df.groupby('patient_id'):
        group = group.reset_index(drop=True)
        # Compute rolling window stats (last 6 steps = 1 hour, last 18 steps = 3 hours)
        for i in range(len(group)):
            start_1h = max(0, i - 6)
            sub_1h = group.iloc[start_1h:i+1]
            
            hr_mean = sub_1h['heart_rate'].mean()
            hr_std = sub_1h['heart_rate'].std() if len(sub_1h) > 1 else 0
            hr_slope = (sub_1h['heart_rate'].iloc[-1] - sub_1h['heart_rate'].iloc[0]) / max(0.1, (sub_1h['time_hours'].iloc[-1] - sub_1h['time_hours'].iloc[0]))
            
            sbp_min = sub_1h['systolic_bp'].min()
            sbp_slope = (sub_1h['systolic_bp'].iloc[-1] - sub_1h['systolic_bp'].iloc[0]) / max(0.1, (sub_1h['time_hours'].iloc[-1] - sub_1h['time_hours'].iloc[0]))
            
            spo2_min = sub_1h['spo2'].min()
            spo2_slope = (sub_1h['spo2'].iloc[-1] - sub_1h['spo2'].iloc[0]) / max(0.1, (sub_1h['time_hours'].iloc[-1] - sub_1h['time_hours'].iloc[0]))
            
            rr_mean = sub_1h['respiratory_rate'].mean()
            rr_slope = (sub_1h['respiratory_rate'].iloc[-1] - sub_1h['respiratory_rate'].iloc[0]) / max(0.1, (sub_1h['time_hours'].iloc[-1] - sub_1h['time_hours'].iloc[0]))
            
            temp_curr = sub_1h['temperature'].iloc[-1]
            shock_index = sub_1h['shock_index'].iloc[-1]
            pulse_pressure = sub_1h['pulse_pressure'].iloc[-1]
            o2_active = sub_1h['supplemental_o2'].iloc[-1]
            avpu = sub_1h['avpu_score'].iloc[-1]

            row_feat = [
                hr_mean, hr_std, hr_slope,
                sbp_min, sbp_slope,
                spo2_min, spo2_slope,
                rr_mean, rr_slope,
                temp_curr, shock_index, pulse_pressure,
                o2_active, avpu
            ]
            features.append(row_feat)
            labels.append(group['label_deterioration_6h'].iloc[i])
            patient_ids.append(pid)

    feature_names = [
        'hr_mean', 'hr_std', 'hr_slope',
        'sbp_min', 'sbp_slope',
        'spo2_min', 'spo2_slope',
        'rr_mean', 'rr_slope',
        'temperature', 'shock_index', 'pulse_pressure',
        'supplemental_o2', 'avpu_score'
    ]

    return np.array(features), np.array(labels), np.array(patient_ids), feature_names

def train_pipeline(data_path='data/patient_vitals_dataset.csv', output_dir='models/'):
    os.makedirs(output_dir, exist_ok=True)
    if not os.path.exists(data_path):
        from generate_dataset import generate_cohort
        df = generate_cohort(num_patients=200, output_file=data_path)
    else:
        df = pd.read_csv(data_path)

    X, y, groups, feature_names = extract_features(df)
    print(f"Dataset shape: {X.shape}, Positive prevalence: {np.mean(y)*100:.2f}%")

    # Patient-level split to prevent data leakage across timepoints
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups))

    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    print(f"Train samples: {len(X_train)} across {len(np.unique(groups[train_idx]))} patients.")
    print(f"Test samples: {len(X_test)} across {len(np.unique(groups[test_idx]))} patients.")

    # 1. Baseline: Logistic Regression
    print("\n--- Training Baseline Logistic Regression ---")
    baseline_lr = LogisticRegression(class_weight='balanced', max_iter=1000)
    baseline_lr.fit(X_train, y_train)
    lr_preds = baseline_lr.predict_proba(X_test)[:, 1]
    print(f"Baseline LR AUROC: {roc_auc_score(y_test, lr_preds):.4f}, AUPRC: {average_precision_score(y_test, lr_preds):.4f}")

    # 2. Main Model: Gradient Boosting with Isotonic Probability Calibration
    print("\n--- Training Calibrated Gradient Boosting (VitalWatch AI) ---")
    base_gbm = HistGradientBoostingClassifier(
        max_iter=150,
        learning_rate=0.08,
        max_depth=6,
        class_weight='balanced',
        random_state=42
    )
    base_gbm.fit(X_train, y_train)

    calibrated_gbm = CalibratedClassifierCV(estimator=base_gbm, method='isotonic', cv=3)
    calibrated_gbm.fit(X_train, y_train)
    gbm_preds = calibrated_gbm.predict_proba(X_test)[:, 1]

    auroc = roc_auc_score(y_test, gbm_preds)
    auprc = average_precision_score(y_test, gbm_preds)
    print(f"Calibrated GBM AUROC: {auroc:.4f}, AUPRC: {auprc:.4f}")

    # Save artifacts
    model_artifact = {
        'model': calibrated_gbm,
        'baseline_lr': baseline_lr,
        'feature_names': feature_names,
        'metrics': {'auroc': auroc, 'auprc': auprc}
    }
    artifact_path = os.path.join(output_dir, 'vitalwatch_model.joblib')
    joblib.dump(model_artifact, artifact_path)
    print(f"\nModel pipeline successfully saved to {artifact_path}")

if __name__ == '__main__':
    train_pipeline()
