export interface ModelBenchmarkRow {
  modelName: string;
  category: 'ML Model' | 'Clinical Benchmark' | 'Baseline';
  auroc: number;
  auprc: number;
  sensAt90Spec: number;
  sensAt95Spec: number;
  meanLeadTimeHours: number;
  falseAlertsPerBedDay: number;
  brierScore: number;
  calibrated: boolean;
}

export const BENCHMARK_MODELS: ModelBenchmarkRow[] = [
  {
    modelName: 'VitalWatch Gradient Boosting (Ours)',
    category: 'ML Model',
    auroc: 0.914,
    auprc: 0.835,
    sensAt90Spec: 0.842,
    sensAt95Spec: 0.768,
    meanLeadTimeHours: 4.3,
    falseAlertsPerBedDay: 3.2,
    brierScore: 0.082,
    calibrated: true,
  },
  {
    modelName: 'Random Forest Ensemble',
    category: 'ML Model',
    auroc: 0.871,
    auprc: 0.772,
    sensAt90Spec: 0.781,
    sensAt95Spec: 0.694,
    meanLeadTimeHours: 3.8,
    falseAlertsPerBedDay: 4.8,
    brierScore: 0.104,
    calibrated: true,
  },
  {
    modelName: 'Logistic Regression (L2 Regularized)',
    category: 'Baseline',
    auroc: 0.812,
    auprc: 0.684,
    sensAt90Spec: 0.695,
    sensAt95Spec: 0.582,
    meanLeadTimeHours: 2.6,
    falseAlertsPerBedDay: 6.4,
    brierScore: 0.138,
    calibrated: true,
  },
  {
    modelName: 'Royal College of Physicians NEWS2',
    category: 'Clinical Benchmark',
    auroc: 0.782,
    auprc: 0.615,
    sensAt90Spec: 0.648,
    sensAt95Spec: 0.512,
    meanLeadTimeHours: 1.4,
    falseAlertsPerBedDay: 8.7,
    brierScore: 0.174,
    calibrated: false,
  },
];

export const ROC_CURVE_DATA = [
  { fpr: 0.0, vitalWatchTpr: 0.0, news2Tpr: 0.0, baselineTpr: 0.0 },
  { fpr: 0.02, vitalWatchTpr: 0.38, news2Tpr: 0.18, baselineTpr: 0.02 },
  { fpr: 0.05, vitalWatchTpr: 0.64, news2Tpr: 0.36, baselineTpr: 0.05 },
  { fpr: 0.08, vitalWatchTpr: 0.78, news2Tpr: 0.52, baselineTpr: 0.08 },
  { fpr: 0.1, vitalWatchTpr: 0.84, news2Tpr: 0.65, baselineTpr: 0.1 },
  { fpr: 0.15, vitalWatchTpr: 0.89, news2Tpr: 0.72, baselineTpr: 0.15 },
  { fpr: 0.2, vitalWatchTpr: 0.93, news2Tpr: 0.79, baselineTpr: 0.2 },
  { fpr: 0.3, vitalWatchTpr: 0.96, news2Tpr: 0.85, baselineTpr: 0.3 },
  { fpr: 0.4, vitalWatchTpr: 0.97, news2Tpr: 0.89, baselineTpr: 0.4 },
  { fpr: 0.6, vitalWatchTpr: 0.99, news2Tpr: 0.94, baselineTpr: 0.6 },
  { fpr: 0.8, vitalWatchTpr: 1.0, news2Tpr: 0.98, baselineTpr: 0.8 },
  { fpr: 1.0, vitalWatchTpr: 1.0, news2Tpr: 1.0, baselineTpr: 1.0 },
];

export const PR_CURVE_DATA = [
  { recall: 0.1, vitalWatchPrecision: 0.96, news2Precision: 0.82 },
  { recall: 0.2, vitalWatchPrecision: 0.94, news2Precision: 0.79 },
  { recall: 0.3, vitalWatchPrecision: 0.92, news2Precision: 0.74 },
  { recall: 0.4, vitalWatchPrecision: 0.89, news2Precision: 0.69 },
  { recall: 0.5, vitalWatchPrecision: 0.86, news2Precision: 0.65 },
  { recall: 0.6, vitalWatchPrecision: 0.83, news2Precision: 0.60 },
  { recall: 0.7, vitalWatchPrecision: 0.78, news2Precision: 0.55 },
  { recall: 0.8, vitalWatchPrecision: 0.71, news2Precision: 0.49 },
  { recall: 0.85, vitalWatchPrecision: 0.65, news2Precision: 0.44 },
  { recall: 0.9, vitalWatchPrecision: 0.56, news2Precision: 0.38 },
  { recall: 0.95, vitalWatchPrecision: 0.42, news2Precision: 0.28 },
  { recall: 1.0, vitalWatchPrecision: 0.25, news2Precision: 0.18 },
];

export const LEAD_TIME_DISTRIBUTION = [
  { range: '> 6 Hours', vitalWatchPercent: 28, news2Percent: 6 },
  { range: '4 - 6 Hours', vitalWatchPercent: 36, news2Percent: 14 },
  { range: '2 - 4 Hours', vitalWatchPercent: 24, news2Percent: 26 },
  { range: '1 - 2 Hours', vitalWatchPercent: 9, news2Percent: 32 },
  { range: '< 1 Hour (Late)', vitalWatchPercent: 3, news2Percent: 22 },
];

export const FEATURE_IMPORTANCE_SUMMARY = [
  { rank: 1, feature: 'Shock Index (HR / SBP)', importance: 0.245, category: 'Hemodynamic' },
  { rank: 2, feature: 'SpO2 Desaturation Velocity (Slope)', importance: 0.198, category: 'Respiratory' },
  { rank: 3, feature: 'Respiratory Rate Trend & Max', importance: 0.162, category: 'Respiratory' },
  { rank: 4, feature: 'Systolic Blood Pressure Min & Slope', importance: 0.134, category: 'Perfusion' },
  { rank: 5, feature: 'Heart Rate Variability & Delta', importance: 0.102, category: 'Cardiac' },
  { rank: 6, feature: 'Time Outside Normal Physiological Zone', importance: 0.076, category: 'Temporal' },
  { rank: 7, feature: 'Temperature Delta (SIRS/Hypothermia)', importance: 0.048, category: 'Metabolic' },
  { rank: 8, feature: 'Consciousness Score (AVPU)', importance: 0.035, category: 'Neurological' },
];

export const COHORT_METADATA = {
  totalPatientStays: '12,480 admissions',
  deteriorationEvents: '1,496 events (11.9% incidence)',
  predictionWindow: '6.0 hours prior to critical event',
  observationHours: '286,500 continuous monitoring hours',
  evalSplit: 'Patient-level stratified train / validation / test (70% / 15% / 15%)',
  calibrationMethod: 'Isotonic Regression on validation fold',
};
