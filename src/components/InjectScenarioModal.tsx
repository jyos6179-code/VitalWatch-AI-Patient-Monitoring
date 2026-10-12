import React, { useState } from 'react';
import { Patient } from '../types/patient';
import { X, Zap, AlertTriangle, Activity, Heart, Wind, ShieldAlert, Sparkles } from 'lucide-react';

interface InjectScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onInject: (patientId: string, event: any) => void;
}

export const InjectScenarioModal: React.FC<InjectScenarioModalProps> = ({
  isOpen,
  onClose,
  patients,
  onInject,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [selectedScenario, setSelectedScenario] = useState<string>('septic_shock');

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'septic_shock',
      title: 'Septic Shock Cascade',
      category: 'Infection / Hemodynamics',
      description:
        'Induces hyperdynamic warm shock (tachycardia + high temp) transitioning to microvascular collapse with profound hypotension (SBP < 90) and high shock index (> 1.2).',
      icon: ShieldAlert,
      color: 'text-rose-400',
      badge: 'Critical Emergency',
    },
    {
      id: 'respiratory_arrest',
      title: 'Acute Respiratory Failure (ARDS / Hypoxemia)',
      category: 'Pulmonary / Ventilation',
      description:
        'Triggers steep downward desaturation slope (SpO2 dropping < 90%), severe tachypnea (RR > 30), and immediate supplemental oxygen requirement.',
      icon: Wind,
      color: 'text-indigo-400',
      badge: 'Hypoxemic Event',
    },
    {
      id: 'cardiogenic_shock',
      title: 'Acute Cardiogenic Decompensation',
      category: 'Cardiac / Ischemia',
      description:
        'Simulates sudden pump failure with collapsing mean arterial pressure, tachycardia, and altered cerebral perfusion.',
      icon: Heart,
      color: 'text-amber-400',
      badge: 'Hemodynamic Shock',
    },
    {
      id: 'administer_treatment',
      title: 'Resuscitative Treatment (Stabilisation)',
      category: 'Intervention / Recovery',
      description:
        'Simulates administration of 30 mL/kg IV crystalloids, broad-spectrum antibiotics, and titrated high-flow oxygen, observing physiological normalisation.',
      icon: Sparkles,
      color: 'text-emerald-400',
      badge: 'Clinical Therapy',
    },
  ];

  const handleExecute = () => {
    if (!selectedPatientId) return;
    onInject(selectedPatientId, selectedScenario);
    onClose();
  };

  const currentPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Simulate Acute Clinical Scenario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Patient to Target:
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-slate-600"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.bed}] {p.name} ({p.age}y·{p.sex}) - {p.ward} · Current Risk: {p.riskScore}/100
                </option>
              ))}
            </select>
            {currentPatient && (
              <p className="text-[11px] text-slate-400 mt-1">
                Current Diagnosis: {currentPatient.admissionDiagnosis} · Trajectory:{' '}
                {currentPatient.trajectory.replace('_', ' ')}
              </p>
            )}
          </div>

          {/* Scenario Cards */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Clinical Deterioration Archetype:
            </label>
            <div className="space-y-2.5">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                const Icon = sc.icon;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${sc.color}`} />
                        <span className="text-xs font-semibold text-white">{sc.title}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {sc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Inject Scenario & Watch Detection
          </button>
        </div>
      </div>
    </div>
  );
};
