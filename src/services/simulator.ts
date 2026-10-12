import { calculateNEWS2 } from './news2Engine';
import { predictDeteriorationRisk } from './mlEngine';
import {
  ClinicalAlert,
  ConsciousnessLevel,
  Patient,
  SensorStatus,
  TrajectoryArchetype,
  VitalSignReading,
  WardType,
} from '../types/patient';

const WARDS: WardType[] = ['ICU', 'Acute Medical', 'Cardiac Care', 'Step-Down', 'General Ward'];

interface PatientTemplate {
  name: string;
  age: number;
  sex: 'M' | 'F';
  bed: string;
  ward: WardType;
  diagnosis: string;
  comorbidities: string[];
  trajectory: TrajectoryArchetype;
  baseline: {
    hr: number;
    sbp: number;
    dbp: number;
    spo2: number;
    rr: number;
    temp: number;
    consciousness: ConsciousnessLevel;
    supplementalO2: boolean;
    fiO2: number;
  };
}

const INITIAL_PATIENTS: PatientTemplate[] = [
  // Acute Medical Ward (high turnaround, diverse deterioration)
  {
    name: 'Eleanor Vance',
    age: 72,
    sex: 'F',
    bed: 'AMU-01',
    ward: 'Acute Medical',
    diagnosis: 'Community-Acquired Pneumonia',
    comorbidities: ['COPD Gold II', 'Hypertension'],
    trajectory: 'slow_deterioration',
    baseline: { hr: 94, sbp: 118, dbp: 74, spo2: 93, rr: 22, temp: 38.3, consciousness: 'Alert', supplementalO2: true, fiO2: 0.28 },
  },
  {
    name: 'Marcus Chen',
    age: 58,
    sex: 'M',
    bed: 'AMU-02',
    ward: 'Acute Medical',
    diagnosis: 'Acute Pyelonephritis / Urosepsis Risk',
    comorbidities: ['Type 2 Diabetes', 'CKD Stage 3'],
    trajectory: 'sepsis_crash',
    baseline: { hr: 108, sbp: 102, dbp: 62, spo2: 95, rr: 24, temp: 39.1, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Sarah Jenkins',
    age: 44,
    sex: 'F',
    bed: 'AMU-03',
    ward: 'Acute Medical',
    diagnosis: 'Cellulitis Right Lower Extremity',
    comorbidities: ['Obesity Class II'],
    trajectory: 'stable',
    baseline: { hr: 76, sbp: 126, dbp: 82, spo2: 98, rr: 16, temp: 37.4, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'David O\'Connor',
    age: 81,
    sex: 'M',
    bed: 'AMU-04',
    ward: 'Acute Medical',
    diagnosis: 'Exacerbation of Bronchiectasis',
    comorbidities: ['Severe Emphysema', 'Atrial Fibrillation'],
    trajectory: 'respiratory_failure',
    baseline: { hr: 102, sbp: 134, dbp: 84, spo2: 91, rr: 27, temp: 37.8, consciousness: 'Alert', supplementalO2: true, fiO2: 0.35 },
  },
  {
    name: 'Amina Al-Mansoor',
    age: 63,
    sex: 'F',
    bed: 'AMU-05',
    ward: 'Acute Medical',
    diagnosis: 'Acute Diverticulitis Post-Antibiotics',
    comorbidities: ['Dyslipidemia'],
    trajectory: 'recovering',
    baseline: { hr: 78, sbp: 122, dbp: 78, spo2: 97, rr: 17, temp: 37.1, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Robert Hastings',
    age: 69,
    sex: 'M',
    bed: 'AMU-06',
    ward: 'Acute Medical',
    diagnosis: 'Acute Pancreatitis',
    comorbidities: ['Alcohol-related Liver Disease'],
    trajectory: 'slow_deterioration',
    baseline: { hr: 104, sbp: 112, dbp: 70, spo2: 94, rr: 23, temp: 38.6, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },

  // Cardiac Care Unit
  {
    name: 'James Thornton',
    age: 67,
    sex: 'M',
    bed: 'CCU-01',
    ward: 'Cardiac Care',
    diagnosis: 'NSTEMI with Impending Cardiogenic Shock',
    comorbidities: ['Triple Vessel CAD', 'Previous CABG', 'T2D'],
    trajectory: 'cardiac_event',
    baseline: { hr: 114, sbp: 96, dbp: 60, spo2: 93, rr: 24, temp: 36.8, consciousness: 'Alert', supplementalO2: true, fiO2: 0.32 },
  },
  {
    name: 'Elena Rostova',
    age: 74,
    sex: 'F',
    bed: 'CCU-02',
    ward: 'Cardiac Care',
    diagnosis: 'Decompensated Heart Failure (NYHA IV)',
    comorbidities: ['Ischemic Cardiomyopathy (EF 25%)', 'CKD'],
    trajectory: 'slow_deterioration',
    baseline: { hr: 98, sbp: 106, dbp: 68, spo2: 92, rr: 25, temp: 36.9, consciousness: 'Alert', supplementalO2: true, fiO2: 0.40 },
  },
  {
    name: 'Thomas Bradley',
    age: 55,
    sex: 'M',
    bed: 'CCU-03',
    ward: 'Cardiac Care',
    diagnosis: 'Unstable Angina - Post Percutaneous Stent',
    comorbidities: ['Hyperlipidemia', 'Smoking History'],
    trajectory: 'stable',
    baseline: { hr: 72, sbp: 128, dbp: 80, spo2: 99, rr: 15, temp: 36.7, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Margaret Wu',
    age: 83,
    sex: 'F',
    bed: 'CCU-04',
    ward: 'Cardiac Care',
    diagnosis: 'High-Grade AV Block / Syncope',
    comorbidities: ['Aortic Stenosis', 'Hypertension'],
    trajectory: 'stable',
    baseline: { hr: 52, sbp: 136, dbp: 74, spo2: 96, rr: 18, temp: 36.6, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Carlos Mendez',
    age: 61,
    sex: 'M',
    bed: 'CCU-05',
    ward: 'Cardiac Care',
    diagnosis: 'Acute Viral Myocarditis',
    comorbidities: ['None'],
    trajectory: 'cardiac_event',
    baseline: { hr: 118, sbp: 94, dbp: 58, spo2: 94, rr: 22, temp: 37.9, consciousness: 'Alert', supplementalO2: true, fiO2: 0.28 },
  },

  // Intensive Care Unit (ICU)
  {
    name: 'Arthur Pendelton',
    age: 76,
    sex: 'M',
    bed: 'ICU-01',
    ward: 'ICU',
    diagnosis: 'Severe Sepsis secondary to Bowel Perforation',
    comorbidities: ['Metastatic Colon Ca', 'Malnutrition'],
    trajectory: 'sepsis_crash',
    baseline: { hr: 126, sbp: 88, dbp: 50, spo2: 91, rr: 29, temp: 35.8, consciousness: 'Voice', supplementalO2: true, fiO2: 0.50 },
  },
  {
    name: 'Grace Hopper-Lee',
    age: 65,
    sex: 'F',
    bed: 'ICU-02',
    ward: 'ICU',
    diagnosis: 'Post Cardiac Arrest Hypoxic Encephalopathy',
    comorbidities: ['Cardiomyopathy'],
    trajectory: 'slow_deterioration',
    baseline: { hr: 96, sbp: 112, dbp: 72, spo2: 95, rr: 20, temp: 36.4, consciousness: 'Pain', supplementalO2: true, fiO2: 0.45 },
  },
  {
    name: 'Daniel Kim',
    age: 49,
    sex: 'M',
    bed: 'ICU-03',
    ward: 'ICU',
    diagnosis: 'Severe Acute Pancreatitis / ARDS Early Stage',
    comorbidities: ['Hypertriglyceridemia'],
    trajectory: 'respiratory_failure',
    baseline: { hr: 116, sbp: 104, dbp: 66, spo2: 89, rr: 31, temp: 38.8, consciousness: 'Alert', supplementalO2: true, fiO2: 0.60 },
  },
  {
    name: 'Patricia Dubois',
    age: 70,
    sex: 'F',
    bed: 'ICU-04',
    ward: 'ICU',
    diagnosis: 'Subarachnoid Hemorrhage - Day 4',
    comorbidities: ['Polycystic Kidney Disease'],
    trajectory: 'stable',
    baseline: { hr: 82, sbp: 138, dbp: 82, spo2: 98, rr: 18, temp: 37.3, consciousness: 'Voice', supplementalO2: true, fiO2: 0.30 },
  },
  {
    name: 'Lucas Bernard',
    age: 53,
    sex: 'M',
    bed: 'ICU-05',
    ward: 'ICU',
    diagnosis: 'Polytrauma - Rib Fractures & Pulmonary Contusion',
    comorbidities: ['None'],
    trajectory: 'recovering',
    baseline: { hr: 88, sbp: 120, dbp: 78, spo2: 96, rr: 19, temp: 37.2, consciousness: 'Alert', supplementalO2: true, fiO2: 0.35 },
  },

  // Step-Down / High Dependency Unit
  {
    name: 'Hannah Abbott',
    age: 62,
    sex: 'F',
    bed: 'SDU-01',
    ward: 'Step-Down',
    diagnosis: 'Post-Op Whipple Procedure Day 3',
    comorbidities: ['T2D', 'Osteoarthritis'],
    trajectory: 'sepsis_crash',
    baseline: { hr: 106, sbp: 108, dbp: 66, spo2: 94, rr: 23, temp: 38.9, consciousness: 'Alert', supplementalO2: true, fiO2: 0.28 },
  },
  {
    name: 'George Davies',
    age: 77,
    sex: 'M',
    bed: 'SDU-02',
    ward: 'Step-Down',
    diagnosis: 'Acute Kidney Injury on CKD / Fluid Overload',
    comorbidities: ['Vascular Dementia', 'Peripheral Arterial Disease'],
    trajectory: 'slow_deterioration',
    baseline: { hr: 90, sbp: 154, dbp: 92, spo2: 93, rr: 24, temp: 36.7, consciousness: 'Alert', supplementalO2: true, fiO2: 0.28 },
  },
  {
    name: 'Sylvia Plath-Jones',
    age: 68,
    sex: 'F',
    bed: 'SDU-03',
    ward: 'Step-Down',
    diagnosis: 'Post Bilateral Total Knee Arthroplasty',
    comorbidities: ['Rheumatoid Arthritis'],
    trajectory: 'stable',
    baseline: { hr: 74, sbp: 130, dbp: 78, spo2: 97, rr: 16, temp: 37.1, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Vikram Patel',
    age: 59,
    sex: 'M',
    bed: 'SDU-04',
    ward: 'Step-Down',
    diagnosis: 'Biliary Sepsis - Post ERCP Stenting',
    comorbidities: ['Gallstones'],
    trajectory: 'recovering',
    baseline: { hr: 80, sbp: 124, dbp: 76, spo2: 98, rr: 17, temp: 37.3, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Evelyn Wood',
    age: 84,
    sex: 'F',
    bed: 'SDU-05',
    ward: 'Step-Down',
    diagnosis: 'Aspiration Pneumonia',
    comorbidities: ['Parkinson Disease', 'Dysphagia'],
    trajectory: 'respiratory_failure',
    baseline: { hr: 99, sbp: 110, dbp: 68, spo2: 91, rr: 26, temp: 38.2, consciousness: 'Alert', supplementalO2: true, fiO2: 0.35 },
  },

  // General Ward (Floor beds)
  {
    name: 'Frank Miller',
    age: 66,
    sex: 'M',
    bed: 'GEN-01',
    ward: 'General Ward',
    diagnosis: 'Elective Total Hip Replacement Day 2',
    comorbidities: ['Hypertension'],
    trajectory: 'stable',
    baseline: { hr: 72, sbp: 128, dbp: 82, spo2: 98, rr: 16, temp: 36.9, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Maria Santos',
    age: 41,
    sex: 'F',
    bed: 'GEN-02',
    ward: 'General Ward',
    diagnosis: 'Uncomplicated Appendectomy Day 1',
    comorbidities: ['None'],
    trajectory: 'stable',
    baseline: { hr: 68, sbp: 118, dbp: 74, spo2: 99, rr: 14, temp: 37.0, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Kenneth Wright',
    age: 73,
    sex: 'M',
    bed: 'GEN-03',
    ward: 'General Ward',
    diagnosis: 'Deep Vein Thrombosis - Commenced Enoxaparin',
    comorbidities: ['Previous PE 2021', 'Obesity'],
    trajectory: 'stable',
    baseline: { hr: 76, sbp: 132, dbp: 84, spo2: 97, rr: 17, temp: 37.1, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Dorothy Campbell',
    age: 86,
    sex: 'F',
    bed: 'GEN-04',
    ward: 'General Ward',
    diagnosis: 'Urinary Tract Infection & Delirium',
    comorbidities: ['Moderate Dementia', 'Osteoporosis'],
    trajectory: 'slow_deterioration',
    baseline: { hr: 92, sbp: 120, dbp: 70, spo2: 94, rr: 21, temp: 38.1, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Simon Taylor',
    age: 52,
    sex: 'M',
    bed: 'GEN-05',
    ward: 'General Ward',
    diagnosis: 'Mild Ulcerative Colitis Flare',
    comorbidities: ['None'],
    trajectory: 'stable',
    baseline: { hr: 74, sbp: 122, dbp: 76, spo2: 98, rr: 15, temp: 37.2, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Rachel Green-Cross',
    age: 47,
    sex: 'F',
    bed: 'GEN-06',
    ward: 'General Ward',
    diagnosis: 'Complicated UTI / Developing Sepsis',
    comorbidities: ['Type 1 Diabetes', 'Neuropathy'],
    trajectory: 'sepsis_crash',
    baseline: { hr: 104, sbp: 108, dbp: 68, spo2: 95, rr: 22, temp: 38.7, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Peter Van Der Bilt',
    age: 79,
    sex: 'M',
    bed: 'GEN-07',
    ward: 'General Ward',
    diagnosis: 'Congestive Heart Failure Mild Exacerbation',
    comorbidities: ['Hypertension', 'COPD Gold I'],
    trajectory: 'recovering',
    baseline: { hr: 76, sbp: 126, dbp: 76, spo2: 96, rr: 18, temp: 36.8, consciousness: 'Alert', supplementalO2: true, fiO2: 0.24 },
  },
  {
    name: 'Nancy Cooper',
    age: 64,
    sex: 'F',
    bed: 'GEN-08',
    ward: 'General Ward',
    diagnosis: 'Post Laparoscopic Cholecystectomy',
    comorbidities: ['Asthma'],
    trajectory: 'stable',
    baseline: { hr: 70, sbp: 124, dbp: 78, spo2: 98, rr: 16, temp: 36.9, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
  {
    name: 'Bernard Shaw',
    age: 82,
    sex: 'M',
    bed: 'GEN-09',
    ward: 'General Ward',
    diagnosis: 'Dehydration & Orthostatic Syncope',
    comorbidities: ['Hypertension', 'BPH'],
    trajectory: 'stable',
    baseline: { hr: 75, sbp: 116, dbp: 72, spo2: 97, rr: 16, temp: 37.0, consciousness: 'Alert', supplementalO2: false, fiO2: 0.21 },
  },
];

// Helper to add Gaussian random noise
function gaussianRandom(mean = 0, stdev = 1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export class PatientSimulator {
  private patients: Patient[] = [];
  private currentTime: number; // Unix timestamp in seconds
  private speedMultiplier = 1; // 1x, 5x, 10x, 30x
  private isPaused = false;
  private sensorDropoutEnabled = true;
  private alertCooldownSeconds = 300; // 5 min cooldown

  constructor() {
    this.currentTime = Math.floor(Date.now() / 1000);
    this.initializePatients();
  }

  private initializePatients() {
    this.patients = INITIAL_PATIENTS.map((tmpl, idx) => {
      const id = `pt-${(idx + 1).toString().padStart(3, '0')}`;
      const historyPoints = 25;
      const history: VitalSignReading[] = [];
      const startTime = this.currentTime - historyPoints * 60; // 1 min steps

      // Generate initial warm-up history
      let currentPhase = Math.random() * 0.4;
      for (let i = 0; i < historyPoints; i++) {
        const ptTime = startTime + i * 60;
        const phase = currentPhase * (i / historyPoints);
        const reading = this.generateReadingForTemplate(tmpl, phase, ptTime, false);
        history.push(reading);
      }

      const latestVitals = history[history.length - 1];
      const news2 = calculateNEWS2(latestVitals);
      const prediction = predictDeteriorationRisk(latestVitals, history);

      const riskHistory = history.map((h, i) => ({
        timestamp: h.timestamp,
        score: Math.max(5, Math.min(95, prediction.riskScore + Math.round((i - historyPoints) * 0.6))),
        news2: news2.total,
      }));

      const patient: Patient = {
        id,
        name: tmpl.name,
        age: tmpl.age,
        sex: tmpl.sex,
        bed: tmpl.bed,
        ward: tmpl.ward,
        admissionDiagnosis: tmpl.diagnosis,
        comorbidities: tmpl.comorbidities,
        admissionHoursAgo: Math.round(12 + Math.random() * 60),
        trajectory: tmpl.trajectory,
        trajectoryPhase: currentPhase,
        currentVitals: latestVitals,
        vitalsHistory: history,
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        previousScore: prediction.riskScore,
        velocity30m: 0,
        riskScoreHistory: riskHistory,
        news2,
        baseRisk: prediction.baseRisk,
        shapAttributions: prediction.shapAttributions,
        clinicalSummary: prediction.clinicalSummary,
        criticalVitals: prediction.criticalVitals,
        notes: [
          {
            id: `note-${id}-01`,
            timestamp: this.currentTime - 7200,
            clinician: 'Dr. Sarah Patel, MD',
            text: `Admitted for ${tmpl.diagnosis}. Baseline vitals recorded. Monitoring active early warning trajectory.`,
            type: 'assessment',
          },
        ],
      };

      // If initial risk is high or medium, generate an initial alert if appropriate
      if (patient.riskScore >= 70 || patient.criticalVitals.length > 0) {
        patient.activeAlert = {
          id: `alt-${patient.id}-${Math.floor(this.currentTime)}`,
          patientId: patient.id,
          patientName: patient.name,
          bed: patient.bed,
          ward: patient.ward,
          timestamp: this.currentTime,
          triggerReason: patient.criticalVitals[0] || `High Deterioration Risk Score (${patient.riskScore})`,
          triggerType: patient.criticalVitals.length > 0 ? 'critical_vital' : 'threshold',
          severity: patient.riskScore >= 70 ? 'high' : 'medium',
          state: 'new',
          escalationCount: 0,
        };
        patient.lastAlertTimestamp = this.currentTime;
      }

      return patient;
    });
  }

  private generateReadingForTemplate(
    tmpl: PatientTemplate,
    phase: number,
    timestamp: number,
    allowDropout = true
  ): VitalSignReading {
    const b = tmpl.baseline;
    let hrDelta = 0;
    let sbpDelta = 0;
    let dbpDelta = 0;
    let spo2Delta = 0;
    let rrDelta = 0;
    let tempDelta = 0;
    let consciousness: ConsciousnessLevel = b.consciousness;
    let suppO2 = b.supplementalO2;
    let fiO2 = b.fiO2;

    switch (tmpl.trajectory) {
      case 'stable':
        // Mild physiological oscillations
        hrDelta = Math.sin(timestamp / 300) * 3 + gaussianRandom(0, 1.5);
        sbpDelta = Math.cos(timestamp / 400) * 4 + gaussianRandom(0, 2);
        dbpDelta = sbpDelta * 0.6;
        spo2Delta = gaussianRandom(0, 0.4);
        rrDelta = gaussianRandom(0, 0.8);
        tempDelta = gaussianRandom(0, 0.08);
        break;

      case 'slow_deterioration':
        // Progressive occult worsening
        hrDelta = phase * 28 + gaussianRandom(0, 2);
        sbpDelta = -phase * 18 + gaussianRandom(0, 3);
        dbpDelta = -phase * 12 + gaussianRandom(0, 2);
        spo2Delta = -phase * 5 + gaussianRandom(0, 0.6);
        rrDelta = phase * 9 + gaussianRandom(0, 1);
        tempDelta = phase * 1.1 + gaussianRandom(0, 0.1);
        if (phase > 0.8) consciousness = 'Voice';
        break;

      case 'sepsis_crash':
        // Hyperdynamic to hypodynamic shock
        if (phase < 0.45) {
          // Warm shock: tachycardia, high temp, wide pulse pressure
          hrDelta = phase * 40 + gaussianRandom(0, 2.5);
          sbpDelta = -phase * 12 + gaussianRandom(0, 3);
          dbpDelta = -phase * 20 + gaussianRandom(0, 3);
          tempDelta = phase * 1.8 + gaussianRandom(0, 0.15);
          rrDelta = phase * 12 + gaussianRandom(0, 1.2);
          spo2Delta = -phase * 3 + gaussianRandom(0, 0.5);
        } else {
          // Cold decompensated septic shock: severe hypotension, hypothermia or spike, hypoxia
          hrDelta = 32 + (phase - 0.45) * 25 + gaussianRandom(0, 3);
          sbpDelta = -15 - (phase - 0.45) * 38 + gaussianRandom(0, 4);
          dbpDelta = -18 - (phase - 0.45) * 24 + gaussianRandom(0, 3);
          tempDelta = phase > 0.75 ? -1.8 : 1.9; // sudden hypothermia in late sepsis
          rrDelta = 8 + (phase - 0.45) * 14 + gaussianRandom(0, 1.5);
          spo2Delta = -3 - (phase - 0.45) * 8 + gaussianRandom(0, 0.8);
          suppO2 = true;
          fiO2 = 0.5;
          consciousness = phase > 0.7 ? 'Voice' : 'Alert';
        }
        break;

      case 'respiratory_failure':
        // Acute hypoxemic failure (e.g. ARDS or severe COPD/pneumonia)
        spo2Delta = -phase * 14 + gaussianRandom(0, 0.8);
        rrDelta = phase * 16 + gaussianRandom(0, 1.4);
        hrDelta = phase * 28 + gaussianRandom(0, 2.5);
        sbpDelta = phase < 0.6 ? phase * 18 : -14; // initial sympathetic surge then exhaustion
        dbpDelta = sbpDelta * 0.5;
        tempDelta = phase * 0.7 + gaussianRandom(0, 0.1);
        suppO2 = true;
        fiO2 = Math.min(0.85, b.fiO2 + phase * 0.35);
        if (phase > 0.85) consciousness = 'Voice';
        break;

      case 'cardiac_event':
        // Cardiogenic shock / acute coronary decompensation
        hrDelta = phase * 32 + gaussianRandom(0, 3.5);
        sbpDelta = -phase * 35 + gaussianRandom(0, 3);
        dbpDelta = -phase * 18 + gaussianRandom(0, 2);
        spo2Delta = -phase * 6 + gaussianRandom(0, 0.6);
        rrDelta = phase * 10 + gaussianRandom(0, 1.2);
        tempDelta = -phase * 0.5;
        suppO2 = true;
        if (phase > 0.75) consciousness = 'Pain';
        break;

      case 'recovering':
        // Gradual normalisation
        hrDelta = (1 - phase) * 16 + gaussianRandom(0, 1.5);
        sbpDelta = -(1 - phase) * 12 + gaussianRandom(0, 2);
        dbpDelta = -(1 - phase) * 8 + gaussianRandom(0, 2);
        spo2Delta = (phase - 1) * 3 + gaussianRandom(0, 0.4);
        rrDelta = (1 - phase) * 6 + gaussianRandom(0, 0.8);
        tempDelta = (1 - phase) * 0.8;
        break;
    }

    // Occasional sensor dropout (e.g. 1 in 100 chance if enabled)
    let sensorStatus: SensorStatus = 'normal';
    if (allowDropout && this.sensorDropoutEnabled && Math.random() < 0.015) {
      sensorStatus = 'dropout';
    }

    const hr = Math.max(35, Math.min(180, Math.round(b.hr + hrDelta)));
    const sbp = Math.max(60, Math.min(230, Math.round(b.sbp + sbpDelta)));
    const dbp = Math.max(35, Math.min(130, Math.round(b.dbp + dbpDelta)));
    const spo2 = Math.max(70, Math.min(100, Math.round(b.spo2 + spo2Delta)));
    const rr = Math.max(6, Math.min(45, Math.round(b.rr + rrDelta)));
    const temp = Math.max(33.5, Math.min(41.5, Math.round((b.temp + tempDelta) * 10) / 10));

    const shockIndex = sbp > 0 ? Math.round((hr / sbp) * 100) / 100 : 1.0;
    const map = Math.round(((2 * dbp + sbp) / 3) * 10) / 10;
    const pulsePressure = sbp - dbp;

    return {
      timestamp,
      heartRate: hr,
      systolicBP: sbp,
      diastolicBP: dbp,
      spO2: spo2,
      respiratoryRate: rr,
      temperature: temp,
      consciousness,
      supplementalO2: suppO2,
      fiO2,
      shockIndex,
      meanArterialPressure: map,
      pulsePressure,
      sensorStatus,
    };
  }

  /**
   * Main simulation step (called every interval)
   */
  public tick(): { updatedPatients: Patient[]; newAlerts: ClinicalAlert[] } {
    if (this.isPaused) {
      return { updatedPatients: this.patients, newAlerts: [] };
    }

    const elapsedSeconds = 5 * this.speedMultiplier;
    this.currentTime += elapsedSeconds;
    const newAlerts: ClinicalAlert[] = [];

    this.patients = this.patients.map((patient) => {
      // Find matching template
      const tmpl = INITIAL_PATIENTS.find((t) => t.name === patient.name) || INITIAL_PATIENTS[0];

      // Progress trajectory phase
      let phaseStep = 0.002 * this.speedMultiplier;
      if (patient.trajectory === 'stable') phaseStep = 0.0005 * this.speedMultiplier;
      let newPhase = patient.trajectoryPhase + phaseStep;

      // Loop or clamp phase
      if (newPhase > 1.0) {
        if (patient.trajectory === 'stable') {
          newPhase = 0;
        } else {
          newPhase = 0.85 + Math.random() * 0.15; // stay in decompensated zone until intervention
        }
      }

      // Generate new vitals reading
      const newReading = this.generateReadingForTemplate(
        { ...tmpl, trajectory: patient.trajectory },
        newPhase,
        this.currentTime,
        true
      );

      // Rolling history maintenance (keep up to 35 latest readings)
      const newHistory = [...patient.vitalsHistory.slice(-34), newReading];

      // Calculate clinical benchmarks and ML inference
      const news2 = calculateNEWS2(newReading);
      const prediction = predictDeteriorationRisk(newReading, newHistory);

      // Compute velocity (change over rolling 30 simulated minutes)
      const halfHourAgo = this.currentTime - 1800;
      const olderEntry = patient.riskScoreHistory.find((h) => h.timestamp <= halfHourAgo) || patient.riskScoreHistory[0];
      const velocity30m = olderEntry ? prediction.riskScore - olderEntry.score : 0;

      // Update score history
      const newScoreHistory = [
        ...patient.riskScoreHistory.slice(-29),
        { timestamp: this.currentTime, score: prediction.riskScore, news2: news2.total },
      ];

      // Alert generation & debouncing logic
      let activeAlert = patient.activeAlert;
      const timeSinceLastAlert = patient.lastAlertTimestamp
        ? this.currentTime - patient.lastAlertTimestamp
        : 999999;

      // Escalation check for existing unacknowledged alert (> 10 sim minutes)
      if (activeAlert && activeAlert.state === 'new') {
        const alertAge = this.currentTime - activeAlert.timestamp;
        if (alertAge > 600 && activeAlert.escalationCount === 0) {
          activeAlert = {
            ...activeAlert,
            state: 'escalated',
            escalationCount: 1,
            triggerReason: `[ESCALATED] Unacknowledged: ${activeAlert.triggerReason}`,
          };
        }
      }

      // Check alert trigger conditions
      const isCriticalVital = prediction.criticalVitals.length > 0;
      const isHighThreshold = prediction.riskScore >= 70;
      const isMediumThreshold = prediction.riskScore >= 40 && (!activeAlert || activeAlert.state === 'resolved');
      const isRapidRise = velocity30m >= 18;

      const shouldTriggerNewAlert =
        (!activeAlert || activeAlert.state === 'resolved') &&
        timeSinceLastAlert > this.alertCooldownSeconds &&
        (isCriticalVital || isHighThreshold || isRapidRise || news2.total >= 7);

      if (shouldTriggerNewAlert) {
        let reason = '';
        let type: ClinicalAlert['triggerType'] = 'threshold';
        let severity: ClinicalAlert['severity'] = 'medium';

        if (isCriticalVital) {
          reason = `Critical single vital sign: ${prediction.criticalVitals[0]}`;
          type = 'critical_vital';
          severity = 'critical';
        } else if (isRapidRise) {
          reason = `Rapid deterioration velocity (+${Math.round(velocity30m)} pts/30min)`;
          type = 'rapid_rise';
          severity = 'high';
        } else if (isHighThreshold) {
          reason = `High deterioration risk score (${prediction.riskScore}/100)`;
          type = 'threshold';
          severity = 'high';
        } else if (news2.total >= 7) {
          reason = `NEWS2 emergency threshold (${news2.total})`;
          type = 'news2_trigger';
          severity = 'high';
        } else {
          reason = `Medium risk warning score (${prediction.riskScore}/100)`;
          type = 'threshold';
          severity = 'medium';
        }

        const generatedAlert: ClinicalAlert = {
          id: `alt-${patient.id}-${Math.floor(this.currentTime)}`,
          patientId: patient.id,
          patientName: patient.name,
          bed: patient.bed,
          ward: patient.ward,
          timestamp: this.currentTime,
          triggerReason: reason,
          triggerType: type,
          severity,
          state: 'new',
          escalationCount: 0,
        };

        activeAlert = generatedAlert;
        newAlerts.push(generatedAlert);
      }

      return {
        ...patient,
        trajectoryPhase: newPhase,
        currentVitals: newReading,
        vitalsHistory: newHistory,
        previousScore: patient.riskScore,
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        velocity30m: Math.round(velocity30m * 10) / 10,
        riskScoreHistory: newScoreHistory,
        news2,
        baseRisk: prediction.baseRisk,
        shapAttributions: prediction.shapAttributions,
        clinicalSummary: prediction.clinicalSummary,
        criticalVitals: prediction.criticalVitals,
        activeAlert,
        lastAlertTimestamp: activeAlert ? activeAlert.timestamp : patient.lastAlertTimestamp,
      };
    });

    return { updatedPatients: this.patients, newAlerts };
  }

  // Clinical interventions and interactions
  public acknowledgeAlert(alertId: string, clinicianName: string): boolean {
    let handled = false;
    this.patients = this.patients.map((p) => {
      if (p.activeAlert && p.activeAlert.id === alertId) {
        handled = true;
        const ackAlert: ClinicalAlert = {
          ...p.activeAlert,
          state: 'acknowledged',
          acknowledgedBy: clinicianName,
          acknowledgedAt: this.currentTime,
        };
        const note = {
          id: `note-${p.id}-${Math.floor(this.currentTime)}`,
          timestamp: this.currentTime,
          clinician: clinicianName,
          text: `Alert acknowledged: ${ackAlert.triggerReason}. Patient assessed bedside.`,
          type: 'assessment' as const,
        };
        return {
          ...p,
          activeAlert: ackAlert,
          notes: [note, ...p.notes],
        };
      }
      return p;
    });
    return handled;
  }

  public resolveAlert(alertId: string, clinicianName: string, notes?: string): boolean {
    let handled = false;
    this.patients = this.patients.map((p) => {
      if (p.activeAlert && p.activeAlert.id === alertId) {
        handled = true;
        const resAlert: ClinicalAlert = {
          ...p.activeAlert,
          state: 'resolved',
          resolvedBy: clinicianName,
          resolvedAt: this.currentTime,
          notes: notes || 'Clinical resolution verified',
        };
        const note = {
          id: `note-${p.id}-${Math.floor(this.currentTime)}`,
          timestamp: this.currentTime,
          clinician: clinicianName,
          text: `Alert resolved: ${resAlert.triggerReason}. ${notes || 'Patient stabilized.'}`,
          type: 'intervention' as const,
        };
        return {
          ...p,
          activeAlert: undefined,
          notes: [note, ...p.notes],
        };
      }
      return p;
    });
    return handled;
  }

  public addPatientNote(patientId: string, clinicianName: string, text: string, type: 'assessment' | 'intervention' | 'lab_order' | 'medication') {
    this.patients = this.patients.map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          notes: [
            {
              id: `note-${p.id}-${Math.floor(this.currentTime)}`,
              timestamp: this.currentTime,
              clinician: clinicianName,
              text,
              type,
            },
            ...p.notes,
          ],
        };
      }
      return p;
    });
  }

  /**
   * Inject acute clinical events into a patient
   */
  public injectClinicalEvent(
    patientId: string,
    event: 'septic_shock' | 'respiratory_arrest' | 'cardiogenic_shock' | 'administer_treatment' | 'sensor_fault'
  ) {
    this.patients = this.patients.map((p) => {
      if (p.id !== patientId) return p;

      let newTrajectory = p.trajectory;
      let newPhase = p.trajectoryPhase;
      let noteText = '';

      switch (event) {
        case 'septic_shock':
          newTrajectory = 'sepsis_crash';
          newPhase = 0.55; // Jump into acute decompensation
          noteText = 'SIMULATION EVENT INJECTED: Acute Septic Shock cascade triggered.';
          break;
        case 'respiratory_arrest':
          newTrajectory = 'respiratory_failure';
          newPhase = 0.65;
          noteText = 'SIMULATION EVENT INJECTED: Acute Hypoxemic Respiratory Crisis triggered.';
          break;
        case 'cardiogenic_shock':
          newTrajectory = 'cardiac_event';
          newPhase = 0.6;
          noteText = 'SIMULATION EVENT INJECTED: Acute Cardiogenic Decompensation triggered.';
          break;
        case 'administer_treatment':
          newTrajectory = 'recovering';
          newPhase = 0.2;
          noteText = 'INTERVENTION ADMINISTERED: Resuscitative IV fluids, broad-spectrum antibiotics, and titrating high-flow O2 initiated.';
          break;
        case 'sensor_fault':
          p.currentVitals.sensorStatus = 'dropout';
          noteText = 'HARDWARE EVENT: Pulse oximetry sensor displacement simulated.';
          break;
      }

      const note = {
        id: `event-${p.id}-${Math.floor(this.currentTime)}`,
        timestamp: this.currentTime,
        clinician: 'Medical Team Simulation Engine',
        text: noteText,
        type: 'intervention' as const,
      };

      return {
        ...p,
        trajectory: newTrajectory,
        trajectoryPhase: newPhase,
        notes: [note, ...p.notes],
      };
    });
  }

  // Getters & Control Methods
  public getPatients(): Patient[] {
    return this.patients;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.find((p) => p.id === id);
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public isSimulatorPaused(): boolean {
    return this.isPaused;
  }

  public toggleSensorDropout(enabled: boolean) {
    this.sensorDropoutEnabled = enabled;
  }

  public isSensorDropoutEnabled(): boolean {
    return this.sensorDropoutEnabled;
  }

  public resetSimulation() {
    this.currentTime = Math.floor(Date.now() / 1000);
    this.initializePatients();
  }
}
