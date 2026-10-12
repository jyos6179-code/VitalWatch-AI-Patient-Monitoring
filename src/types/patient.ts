export type WardType = 'ICU' | 'Acute Medical' | 'Cardiac Care' | 'Step-Down' | 'General Ward';

export type RiskLevel = 'low' | 'medium' | 'high';

export type AlertSeverity = 'medium' | 'high' | 'critical';

export type AlertState = 'new' | 'acknowledged' | 'resolved' | 'escalated';

export type SensorStatus = 'normal' | 'noisy' | 'dropout';

export type ConsciousnessLevel = 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';

export type TrajectoryArchetype =
  | 'stable'
  | 'slow_deterioration'
  | 'sepsis_crash'
  | 'respiratory_failure'
  | 'cardiac_event'
  | 'recovering';

export interface VitalSignReading {
  timestamp: number; // Unix timestamp in seconds
  heartRate: number; // bpm
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  spO2: number; // %
  respiratoryRate: number; // breaths/min
  temperature: number; // °C
  consciousness: ConsciousnessLevel;
  supplementalO2: boolean;
  fiO2: number; // fraction 0.21 - 1.0
  // Derived vitals
  shockIndex: number; // HR / SBP
  meanArterialPressure: number; // (2*DBP + SBP)/3
  pulsePressure: number; // SBP - DBP
  sensorStatus: SensorStatus;
}

export interface ShapFactor {
  feature: string;
  label: string;
  value: number | string;
  baseline: number;
  contribution: number; // positive increases risk, negative decreases
  direction: 'risk_increasing' | 'risk_decreasing';
  clinicalSignificance: string;
}

export interface NEWS2ComponentScore {
  respiratoryRate: number;
  spO2: number;
  supplementalO2: number;
  systolicBP: number;
  heartRate: number;
  consciousness: number;
  temperature: number;
  total: number;
  riskBand: 'Low' | 'Low-Medium' | 'Medium' | 'High';
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  bed: string;
  ward: WardType;
  timestamp: number;
  triggerReason: string;
  triggerType: 'threshold' | 'rapid_rise' | 'critical_vital' | 'news2_trigger';
  severity: AlertSeverity;
  state: AlertState;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedBy?: string;
  resolvedAt?: number;
  escalationCount: number;
  notes?: string;
}

export interface ClinicalNote {
  id: string;
  timestamp: number;
  clinician: string;
  text: string;
  type: 'assessment' | 'intervention' | 'lab_order' | 'medication';
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  bed: string;
  ward: WardType;
  admissionDiagnosis: string;
  comorbidities: string[];
  admissionHoursAgo: number;
  trajectory: TrajectoryArchetype;
  trajectoryPhase: number; // 0.0 - 1.0 progress through trajectory
  
  // Current vitals
  currentVitals: VitalSignReading;
  vitalsHistory: VitalSignReading[]; // rolling buffer (e.g. 50 recent points)
  
  // Model inference
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  previousScore: number;
  velocity30m: number; // rate of score change
  riskScoreHistory: { timestamp: number; score: number; news2: number }[];
  
  // NEWS2 clinical score
  news2: NEWS2ComponentScore;
  
  // Explainability
  baseRisk: number; // Model base probability
  shapAttributions: ShapFactor[];
  clinicalSummary: string;
  criticalVitals: string[];
  
  // Alert management
  activeAlert?: ClinicalAlert;
  lastAlertTimestamp?: number;
  notes: ClinicalNote[];
}
