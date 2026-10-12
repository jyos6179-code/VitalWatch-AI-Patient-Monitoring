import { Patient, VitalSignReading } from '../types/patient';

/**
 * Format patient readings into MIMIC/PhysioNet format CSV
 */
export function exportPatientsToCSV(patients: Patient[]): string {
  const headers = [
    'patient_id',
    'patient_name',
    'ward',
    'bed',
    'timestamp',
    'datetime',
    'heart_rate',
    'systolic_bp',
    'diastolic_bp',
    'spo2',
    'respiratory_rate',
    'temperature_c',
    'consciousness',
    'supplemental_o2',
    'fio2',
    'shock_index',
    'mean_arterial_pressure',
    'pulse_pressure',
    'news2_score',
    'ai_risk_score',
    'risk_level',
  ];

  const rows: string[] = [headers.join(',')];

  patients.forEach((patient) => {
    patient.vitalsHistory.forEach((v) => {
      const dt = new Date(v.timestamp * 1000).toISOString();
      rows.push(
        [
          patient.id,
          `"${patient.name}"`,
          `"${patient.ward}"`,
          patient.bed,
          v.timestamp,
          dt,
          v.heartRate,
          v.systolicBP,
          v.diastolicBP,
          v.spO2,
          v.respiratoryRate,
          v.temperature,
          v.consciousness,
          v.supplementalO2 ? 1 : 0,
          v.fiO2,
          v.shockIndex,
          v.meanArterialPressure,
          v.pulsePressure,
          patient.news2.total,
          patient.riskScore,
          patient.riskLevel,
        ].join(',')
      );
    });
  });

  return rows.join('\n');
}

/**
 * Trigger download of generated CSV
 */
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded CSV file content into vital records
 */
export function parseCSV(text: string): Partial<VitalSignReading>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const parsed: Partial<VitalSignReading>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/['"]/g, ''));
    if (cols.length < header.length) continue;

    const rowObj: Record<string, string> = {};
    header.forEach((h, idx) => {
      rowObj[h] = cols[idx];
    });

    const hr = parseFloat(rowObj['heart_rate'] || rowObj['hr'] || '75');
    const sbp = parseFloat(rowObj['systolic_bp'] || rowObj['sbp'] || '120');
    const dbp = parseFloat(rowObj['diastolic_bp'] || rowObj['dbp'] || '80');
    const spo2 = parseFloat(rowObj['spo2'] || '98');
    const rr = parseFloat(rowObj['respiratory_rate'] || rowObj['rr'] || '16');
    const temp = parseFloat(rowObj['temperature_c'] || rowObj['temp'] || '37.0');

    parsed.push({
      heartRate: isNaN(hr) ? 75 : hr,
      systolicBP: isNaN(sbp) ? 120 : sbp,
      diastolicBP: isNaN(dbp) ? 80 : dbp,
      spO2: isNaN(spo2) ? 98 : spo2,
      respiratoryRate: isNaN(rr) ? 16 : rr,
      temperature: isNaN(temp) ? 37.0 : temp,
      consciousness: (rowObj['consciousness'] as any) || 'Alert',
      supplementalO2: rowObj['supplemental_o2'] === '1' || rowObj['supplemental_o2'] === 'true',
      fiO2: parseFloat(rowObj['fio2'] || '0.21'),
      shockIndex: sbp > 0 ? hr / sbp : 0.6,
      meanArterialPressure: (2 * dbp + sbp) / 3,
      pulsePressure: sbp - dbp,
    });
  }

  return parsed;
}
