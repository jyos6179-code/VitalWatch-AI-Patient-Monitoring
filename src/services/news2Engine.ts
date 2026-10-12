import { ConsciousnessLevel, NEWS2ComponentScore, VitalSignReading } from '../types/patient';

/**
 * Royal College of Physicians National Early Warning Score 2 (NEWS2) Calculator
 */
export function calculateNEWS2(vitals: VitalSignReading): NEWS2ComponentScore {
  let rrScore = 0;
  if (vitals.respiratoryRate <= 8) rrScore = 3;
  else if (vitals.respiratoryRate >= 9 && vitals.respiratoryRate <= 11) rrScore = 1;
  else if (vitals.respiratoryRate >= 12 && vitals.respiratoryRate <= 20) rrScore = 0;
  else if (vitals.respiratoryRate >= 21 && vitals.respiratoryRate <= 24) rrScore = 2;
  else if (vitals.respiratoryRate >= 25) rrScore = 3;

  let spo2Score = 0;
  if (vitals.spO2 <= 91) spo2Score = 3;
  else if (vitals.spO2 === 92 || vitals.spO2 === 93) spo2Score = 2;
  else if (vitals.spO2 === 94 || vitals.spO2 === 95) spo2Score = 1;
  else spo2Score = 0;

  const o2Score = vitals.supplementalO2 ? 2 : 0;

  let sbpScore = 0;
  if (vitals.systolicBP <= 90) sbpScore = 3;
  else if (vitals.systolicBP >= 91 && vitals.systolicBP <= 100) sbpScore = 2;
  else if (vitals.systolicBP >= 101 && vitals.systolicBP <= 110) sbpScore = 1;
  else if (vitals.systolicBP >= 111 && vitals.systolicBP <= 219) sbpScore = 0;
  else sbpScore = 3;

  let hrScore = 0;
  if (vitals.heartRate <= 40) hrScore = 3;
  else if (vitals.heartRate >= 41 && vitals.heartRate <= 50) hrScore = 1;
  else if (vitals.heartRate >= 51 && vitals.heartRate <= 90) hrScore = 0;
  else if (vitals.heartRate >= 91 && vitals.heartRate <= 110) hrScore = 1;
  else if (vitals.heartRate >= 111 && vitals.heartRate <= 130) hrScore = 2;
  else hrScore = 3;

  const cvpuScore = vitals.consciousness === 'Alert' ? 0 : 3;

  let tempScore = 0;
  if (vitals.temperature <= 35.0) tempScore = 3;
  else if (vitals.temperature >= 35.1 && vitals.temperature <= 36.0) tempScore = 1;
  else if (vitals.temperature >= 36.1 && vitals.temperature <= 38.0) tempScore = 0;
  else if (vitals.temperature >= 38.1 && vitals.temperature <= 39.0) tempScore = 1;
  else tempScore = 2;

  const total = rrScore + spo2Score + o2Score + sbpScore + hrScore + cvpuScore + tempScore;

  let riskBand: 'Low' | 'Low-Medium' | 'Medium' | 'High' = 'Low';
  if (total >= 7) {
    riskBand = 'High';
  } else if (total >= 5 || [rrScore, spo2Score, sbpScore, hrScore, cvpuScore, tempScore].includes(3)) {
    riskBand = 'Medium';
  } else if (total >= 1) {
    riskBand = 'Low-Medium';
  }

  return {
    respiratoryRate: rrScore,
    spO2: spo2Score,
    supplementalO2: o2Score,
    systolicBP: sbpScore,
    heartRate: hrScore,
    consciousness: cvpuScore,
    temperature: tempScore,
    total,
    riskBand,
  };
}
