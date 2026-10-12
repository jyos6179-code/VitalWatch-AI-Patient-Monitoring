# VitalWatch ML Pipeline Architecture

## 1. Objective & Formulation
Predict acute in-hospital patient deterioration (defined as emergency ICU transfer, rapid response team activation, or cardiac arrest) within a **6-hour forward-looking clinical prediction horizon**.

## 2. Feature Engineering
Physiological vital signs sampled at rolling regular intervals:
- **Heart Rate (HR)**: mean, rolling standard deviation, least-squares slope (velocity over 1h/3h).
- **Blood Pressure (SBP & DBP)**: minimum SBP, slope, Pulse Pressure ($SBP - DBP$).
- **Oxygen Saturation ($SpO_2$)**: nadir, desaturation rate of change (%/hour).
- **Respiratory Rate (RR)**: mean, maximum, tachypneic slope.
- **Temperature ($^\circ$C)**: core temperature, SIRS hyperthermia or sepsis hypothermia delta.
- **Derived Hemodynamics**:
  - Shock Index: $SI = \frac{HR}{SBP}$ (Early occult circulatory failure)
  - Mean Arterial Pressure: $MAP = \frac{2 \times DBP + SBP}{3}$
  - Neurological AVPU scale & Supplemental $FiO_2$ requirement.

## 3. Class Imbalance & Data Leakage Prevention
- **Patient-Level Group Splits**: Patient hospital stays are strictly segregated into training, validation, and testing cohorts using `GroupShuffleSplit`. Time points from the same patient are never present across train and test sets.
- **Class Imbalance**: Handled via cost-sensitive learning (`class_weight='balanced'`) and tuned decision thresholds.

## 4. Probability Calibration
Raw tree ensemble output margins are calibrated using **Isotonic Regression** on an out-of-fold validation set:
$$P(\text{Deterioration} \mid \mathbf{x}) \in [0, 1] \rightarrow \text{Scaled to Risk Score } [0, 100]$$

## 5. SHAP Interpretability (TreeSHAP)
Local Shapley values attribute prediction deviations from base ward risk ($E[f(x)] \approx 12.0\%$) to individual clinical features:
$$\text{RiskScore}(\mathbf{x}) = \phi_0 + \sum_{i=1}^{M} \phi_i(\mathbf{x})$$

## 6. Execution Instructions
```bash
# 1. Generate cohort time series dataset
python generate_dataset.py

# 2. Train calibrated Gradient Boosting & Baseline models
python train.py

# 3. Evaluate against NEWS2 clinical benchmark
python evaluate.py
```
