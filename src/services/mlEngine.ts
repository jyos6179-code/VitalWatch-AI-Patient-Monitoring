import { ShapFactor, VitalSignReading } from '../types/patient';

export interface ExtractedFeatures {
  hrMean: number;
  hrStd: number;
  hrSlope: number; // bpm per hour
  hrMax: number;
  
  sbpMean: number;
  sbpSlope: number; // mmHg per hour
  sbpMin: number;
  
  spo2Mean: number;
  spo2Slope: number; // % per hour
  spo2Min: number;
  
  rrMean: number;
  rrSlope: number; // breaths/min per hour
  rrMax: number;
  
  tempMean: number;
  shockIndex: number;
  pulsePressure: number;
  mapMean: number;
  
  supplementalO2Active: boolean;
  alteredConsciousness: boolean;
  timeOutsideNormalRangeFraction: number;
}

// Compute linear regression slope (least squares)
function calculateSlope(values: number[], timeIntervalsHours: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    const x = timeIntervalsHours[i];
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  
  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-6) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

export function extractRollingFeatures(history: VitalSignReading[]): ExtractedFeatures {
  if (history.length === 0) {
    return {
      hrMean: 75,
      hrStd: 2,
      hrSlope: 0,
      hrMax: 75,
      sbpMean: 120,
      sbpSlope: 0,
      sbpMin: 120,
      spo2Mean: 98,
      spo2Slope: 0,
      spo2Min: 98,
      rrMean: 16,
      rrSlope: 0,
      rrMax: 16,
      tempMean: 37.0,
      shockIndex: 0.62,
      pulsePressure: 40,
      mapMean: 93,
      supplementalO2Active: false,
      alteredConsciousness: false,
      timeOutsideNormalRangeFraction: 0,
    };
  }

  // Use up to the last 20 readings for rolling features
  const window = history.slice(-20);
  const n = window.length;
  const latestTime = window[window.length - 1].timestamp;

  // relative hours from start of window
  const timesInHours = window.map((r) => (r.timestamp - latestTime) / 3600);

  const hrs = window.map((r) => r.heartRate);
  const sbps = window.map((r) => r.systolicBP);
  const spo2s = window.map((r) => r.spO2);
  const rrs = window.map((r) => r.respiratoryRate);
  const temps = window.map((r) => r.temperature);

  const hrMean = hrs.reduce((a, b) => a + b, 0) / n;
  const sbpMean = sbps.reduce((a, b) => a + b, 0) / n;
  const spo2Mean = spo2s.reduce((a, b) => a + b, 0) / n;
  const rrMean = rrs.reduce((a, b) => a + b, 0) / n;
  const tempMean = temps.reduce((a, b) => a + b, 0) / n;

  const hrVariance = hrs.reduce((a, b) => a + Math.pow(b - hrMean, 2), 0) / n;
  const hrStd = Math.sqrt(hrVariance);

  const hrSlope = calculateSlope(hrs, timesInHours);
  const sbpSlope = calculateSlope(sbps, timesInHours);
  const spo2Slope = calculateSlope(spo2s, timesInHours);
  const rrSlope = calculateSlope(rrs, timesInHours);

  const hrMax = Math.max(...hrs);
  const sbpMin = Math.min(...sbps);
  const spo2Min = Math.min(...spo2s);
  const rrMax = Math.max(...rrs);

  const latest = window[window.length - 1];
  const shockIndex = latest.systolicBP > 0 ? latest.heartRate / latest.systolicBP : 0.8;
  const pulsePressure = latest.systolicBP - latest.diastolicBP;
  const mapMean = (2 * latest.diastolicBP + latest.systolicBP) / 3;

  // Abnormal count
  let abnormalCount = 0;
  window.forEach((w) => {
    if (w.heartRate > 100 || w.heartRate < 50 || w.spO2 < 93 || w.systolicBP < 95 || w.respiratoryRate > 22 || w.respiratoryRate < 10) {
      abnormalCount++;
    }
  });

  return {
    hrMean,
    hrStd,
    hrSlope,
    hrMax,
    sbpMean,
    sbpSlope,
    sbpMin,
    spo2Mean,
    spo2Slope,
    spo2Min,
    rrMean,
    rrSlope,
    rrMax,
    tempMean,
    shockIndex,
    pulsePressure,
    mapMean,
    supplementalO2Active: latest.supplementalO2,
    alteredConsciousness: latest.consciousness !== 'Alert',
    timeOutsideNormalRangeFraction: abnormalCount / n,
  };
}

export interface ModelInferenceResult {
  riskScore: number; // 0 - 100
  riskLevel: 'low' | 'medium' | 'high';
  baseRisk: number;
  shapAttributions: ShapFactor[];
  criticalVitals: string[];
  clinicalSummary: string;
}

/**
 * Gradient Boosting + SHAP explainability simulation
 * Calibrated against 6-hour critical deterioration outcome
 */
export function predictDeteriorationRisk(
  currentVitals: VitalSignReading,
  history: VitalSignReading[]
): ModelInferenceResult {
  const feat = extractRollingFeatures(history);
  const criticalVitals: string[] = [];

  // Check critical thresholds
  if (currentVitals.spO2 < 90) criticalVitals.push(`SpO2 critical (${Math.round(currentVitals.spO2)}%)`);
  if (currentVitals.systolicBP < 90) criticalVitals.push(`Hypotension SBP < 90 (${Math.round(currentVitals.systolicBP)} mmHg)`);
  if (currentVitals.heartRate > 130) criticalVitals.push(`Severe Tachycardia (${Math.round(currentVitals.heartRate)} bpm)`);
  if (currentVitals.heartRate < 45) criticalVitals.push(`Severe Bradycardia (${Math.round(currentVitals.heartRate)} bpm)`);
  if (currentVitals.respiratoryRate > 28) criticalVitals.push(`Severe Tachypnea (${Math.round(currentVitals.respiratoryRate)} /min)`);
  if (currentVitals.respiratoryRate < 8) criticalVitals.push(`Bradypnea (${Math.round(currentVitals.respiratoryRate)} /min)`);
  if (currentVitals.consciousness !== 'Alert') criticalVitals.push(`Depressed sensorium (${currentVitals.consciousness})`);
  if (currentVitals.temperature > 39.3) criticalVitals.push(`High pyrexia (${currentVitals.temperature.toFixed(1)}°C)`);
  if (currentVitals.temperature < 35.2) criticalVitals.push(`Hypothermia (${currentVitals.temperature.toFixed(1)}°C)`);
  if (feat.shockIndex > 1.0) criticalVitals.push(`Shock Index > 1.0 (${feat.shockIndex.toFixed(2)})`);

  // Baseline population hospital ward deterioration rate ~ 12.0%
  const baseRisk = 12.0;
  const rawShap: { [key: string]: { label: string; value: number | string; contribution: number; sig: string } } = {};

  // 1. Shock Index (Normal: 0.5 - 0.7)
  let siContrib = 0;
  if (feat.shockIndex > 1.1) {
    siContrib = 18.5 * Math.min(2.0, (feat.shockIndex - 0.7) / 0.5);
  } else if (feat.shockIndex > 0.85) {
    siContrib = 10.2 * ((feat.shockIndex - 0.7) / 0.3);
  } else if (feat.shockIndex < 0.5) {
    siContrib = -2.5;
  } else {
    siContrib = -4.0;
  }
  rawShap['shock_index'] = {
    label: 'Shock Index (HR/SBP)',
    value: feat.shockIndex.toFixed(2),
    contribution: siContrib,
    sig: feat.shockIndex > 0.9 ? 'Elevated shock index indicates early occult circulatory failure' : 'Normal hemodynamics',
  };

  // 2. Respiratory Rate & Trend (Normal: 12 - 18)
  let rrContrib = 0;
  if (currentVitals.respiratoryRate >= 26) {
    rrContrib = 16.0 + (currentVitals.respiratoryRate - 26) * 1.5;
  } else if (currentVitals.respiratoryRate >= 21) {
    rrContrib = 8.5;
  } else if (currentVitals.respiratoryRate <= 9) {
    rrContrib = 14.0;
  } else {
    rrContrib = -3.5;
  }
  if (feat.rrSlope > 0.8) {
    rrContrib += 4.5; // Tachypnea worsening trend
  }
  rawShap['respiratory_rate'] = {
    label: 'Respiratory Rate & Trend',
    value: `${Math.round(currentVitals.respiratoryRate)}/min (slope: ${feat.rrSlope >= 0 ? '+' : ''}${feat.rrSlope.toFixed(1)}/h)`,
    contribution: rrContrib,
    sig: currentVitals.respiratoryRate >= 22 ? 'Tachypnea is the earliest physiological marker of metabolic/septic crisis' : 'Stable ventilatory pattern',
  };

  // 3. SpO2 & Desaturation Trajectory
  let spo2Contrib = 0;
  if (currentVitals.spO2 < 90) {
    spo2Contrib = 22.0 + (90 - currentVitals.spO2) * 2.2;
  } else if (currentVitals.spO2 < 93) {
    spo2Contrib = 12.0;
  } else if (currentVitals.spO2 < 95) {
    spo2Contrib = 5.0;
  } else {
    spo2Contrib = -5.0;
  }
  if (feat.spo2Slope < -0.5) {
    spo2Contrib += 5.5; // Progressive desaturation
  }
  rawShap['spo2_desaturation'] = {
    label: 'SpO2 & Desaturation Trend',
    value: `${Math.round(currentVitals.spO2)}% (trend: ${feat.spo2Slope.toFixed(1)}%/h)`,
    contribution: spo2Contrib,
    sig: currentVitals.spO2 < 93 ? 'Active hypoxemia with progressive downward slope' : 'Adequate tissue oxygenation',
  };

  // 4. Heart Rate & Variability
  let hrContrib = 0;
  if (currentVitals.heartRate > 125) {
    hrContrib = 14.0 + (currentVitals.heartRate - 125) * 0.8;
  } else if (currentVitals.heartRate > 105) {
    hrContrib = 8.0;
  } else if (currentVitals.heartRate < 48) {
    hrContrib = 12.0;
  } else {
    hrContrib = -4.0;
  }
  if (feat.hrSlope > 1.2) {
    hrContrib += 4.0;
  }
  rawShap['heart_rate'] = {
    label: 'Heart Rate & Tachycardia Velocity',
    value: `${Math.round(currentVitals.heartRate)} bpm (slope: ${feat.hrSlope >= 0 ? '+' : ''}${feat.hrSlope.toFixed(1)}/h)`,
    contribution: hrContrib,
    sig: currentVitals.heartRate > 100 ? 'Sustained tachycardia reflecting adrenergic compensatory stress' : 'Normal resting rhythm',
  };

  // 5. Systolic BP & Perfusion Pressure
  let sbpContrib = 0;
  if (currentVitals.systolicBP < 90) {
    sbpContrib = 19.0 + (90 - currentVitals.systolicBP) * 1.0;
  } else if (currentVitals.systolicBP < 100) {
    sbpContrib = 9.5;
  } else if (currentVitals.systolicBP > 185) {
    sbpContrib = 8.0;
  } else {
    sbpContrib = -3.5;
  }
  rawShap['systolic_bp'] = {
    label: 'Blood Pressure & Perfusion',
    value: `${Math.round(currentVitals.systolicBP)}/${Math.round(currentVitals.diastolicBP)} mmHg`,
    contribution: sbpContrib,
    sig: currentVitals.systolicBP < 100 ? 'Marginal mean arterial pressure compromising end-organ perfusion' : 'Normotensive perfusion',
  };

  // 6. Temperature / Sepsis SIRS Criteria
  let tempContrib = 0;
  if (currentVitals.temperature >= 38.8) {
    tempContrib = 7.5;
  } else if (currentVitals.temperature <= 35.5) {
    tempContrib = 11.0; // Hypothermia in sepsis is high mortality risk
  } else if (currentVitals.temperature >= 38.1) {
    tempContrib = 3.5;
  } else {
    tempContrib = -2.0;
  }
  rawShap['temperature'] = {
    label: 'Core Temperature (SIRS/Hypothermia)',
    value: `${currentVitals.temperature.toFixed(1)} °C`,
    contribution: tempContrib,
    sig: currentVitals.temperature <= 35.5 ? 'Hypothermia represents severe dysregulated systemic response' : (currentVitals.temperature >= 38.5 ? 'Significant pyrexia reflecting active inflammatory storm' : 'Afebrile core temp'),
  };

  // 7. Neurological / AVPU Status
  let avpuContrib = 0;
  if (currentVitals.consciousness === 'Unresponsive') {
    avpuContrib = 24.0;
  } else if (currentVitals.consciousness === 'Pain') {
    avpuContrib = 18.0;
  } else if (currentVitals.consciousness === 'Voice') {
    avpuContrib = 11.0;
  } else {
    avpuContrib = -3.0;
  }
  rawShap['sensorium'] = {
    label: 'Level of Consciousness (AVPU)',
    value: currentVitals.consciousness,
    contribution: avpuContrib,
    sig: currentVitals.consciousness !== 'Alert' ? 'Altered cerebral perfusion or acute encephalopathy' : 'Alert, oriented, intact airway reflexes',
  };

  // 8. Oxygen Therapy Requirement
  let o2Contrib = currentVitals.supplementalO2 ? 6.5 : -2.5;
  rawShap['supplemental_o2'] = {
    label: 'Supplemental Oxygen Therapy',
    value: currentVitals.supplementalO2 ? `Active (FiO2: ${(currentVitals.fiO2 * 100).toFixed(0)}%)` : 'Room Air',
    contribution: o2Contrib,
    sig: currentVitals.supplementalO2 ? 'Patient requires active supplemental FiO2 support' : 'Maintains saturation on room air',
  };

  // Sum raw SHAP contributions to form calibrated score
  let totalScore = baseRisk;
  const shapAttributions: ShapFactor[] = [];

  for (const [key, item] of Object.entries(rawShap)) {
    totalScore += item.contribution;
    shapAttributions.push({
      feature: key,
      label: item.label,
      value: item.value,
      baseline: baseRisk,
      contribution: Math.round(item.contribution * 10) / 10,
      direction: item.contribution >= 0 ? 'risk_increasing' : 'risk_decreasing',
      clinicalSignificance: item.sig,
    });
  }

  // Bound to 0 - 100
  let boundedScore = Math.max(1, Math.min(99, Math.round(totalScore)));

  // If critical vital triggers present, model applies safety floor
  if (criticalVitals.length >= 2 && boundedScore < 75) {
    boundedScore = Math.max(75, boundedScore);
  } else if (criticalVitals.length === 1 && boundedScore < 60) {
    boundedScore = Math.max(60, boundedScore);
  }

  // Determine risk band
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (boundedScore >= 70) {
    riskLevel = 'high';
  } else if (boundedScore >= 40) {
    riskLevel = 'medium';
  }

  // Sort SHAP factors by absolute contribution magnitude
  shapAttributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  // Synthesize clinical summary
  let clinicalSummary = '';
  if (riskLevel === 'high') {
    clinicalSummary = `Critical 6-hour decompensation probability (${boundedScore}%). Driven primarily by ${shapAttributions[0]?.label.toLowerCase()} and ${shapAttributions[1]?.label.toLowerCase()}. Immediate MET/ICU outreach review recommended.`;
  } else if (riskLevel === 'medium') {
    clinicalSummary = `Moderate deterioration risk (${boundedScore}%). Compensatory vital changes detected. Increase monitoring frequency to q1h and notify ward registrar.`;
  } else {
    clinicalSummary = `Hemodynamically stable ward profile (${boundedScore}% risk). Normal physiological margins maintained. Continue standard ward protocol.`;
  }

  return {
    riskScore: boundedScore,
    riskLevel,
    baseRisk,
    shapAttributions,
    criticalVitals,
    clinicalSummary,
  };
}
