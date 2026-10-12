import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PatientSimulator } from './services/simulator';
import { Patient, WardType } from './types/patient';
import { soundService } from './services/soundService';
import { Header } from './components/Header';
import { TriageStatsBar } from './components/TriageStatsBar';
import { PatientCard } from './components/PatientCard';
import { PatientDetailModal } from './components/PatientDetailModal';
import { AlertCenter } from './components/AlertCenter';
import { BenchmarkView } from './components/BenchmarkView';
import { PipelineView } from './components/PipelineView';
import { InjectScenarioModal } from './components/InjectScenarioModal';
import { DataModal } from './components/DataModal';

export default function App() {
  // Simulator Singleton
  const simRef = useRef<PatientSimulator | null>(null);
  if (!simRef.current) {
    simRef.current = new PatientSimulator();
  }
  const simulator = simRef.current;

  // App States
  const [patients, setPatients] = useState<Patient[]>(simulator.getPatients());
  const [simulatedTime, setSimulatedTime] = useState<number>(simulator.getCurrentTime());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'benchmark' | 'pipeline'>('dashboard');
  const [selectedWard, setSelectedWard] = useState<WardType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'velocity_desc' | 'news2_desc' | 'bed_asc'>('risk_desc');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Simulator Controls
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Sync controls to simulator & sound service
  useEffect(() => {
    simulator.setPaused(isPaused);
  }, [isPaused, simulator]);

  useEffect(() => {
    simulator.setSpeedMultiplier(speed);
  }, [speed, simulator]);

  useEffect(() => {
    soundService.setMuted(isMuted);
  }, [isMuted]);

  // Simulation tick loop
  useEffect(() => {
    // interval ticks every 1.5s
    const interval = setInterval(() => {
      const { updatedPatients, newAlerts } = simulator.tick();
      setPatients(updatedPatients);
      setSimulatedTime(simulator.getCurrentTime());

      // If patient detail modal is currently open, keep it in sync with updated live vitals
      if (selectedPatient) {
        const fresh = updatedPatients.find((p) => p.id === selectedPatient.id);
        if (fresh) setSelectedPatient(fresh);
      }

      // Play audio notification for newly fired alerts
      if (newAlerts.length > 0 && !isMuted) {
        const hasCritical = newAlerts.some((a) => a.severity === 'critical' || a.state === 'escalated');
        if (hasCritical) {
          soundService.playCriticalAlarm();
        } else {
          soundService.playWarning();
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedPatient, isMuted, simulator]);

  // Alert Handlers
  const handleAcknowledgeAlert = (alertId: string, clinician: string) => {
    simulator.acknowledgeAlert(alertId, clinician);
    setPatients([...simulator.getPatients()]);
    soundService.playPing();
  };

  const handleResolveAlert = (alertId: string, clinician: string, notes?: string) => {
    simulator.resolveAlert(alertId, clinician, notes);
    setPatients([...simulator.getPatients()]);
    soundService.playPing();
  };

  const handleAddNote = (patientId: string, text: string, type: any) => {
    simulator.addPatientNote(patientId, 'Dr. Alex Mercer, MD', text, type);
    setPatients([...simulator.getPatients()]);
  };

  const handleInjectEvent = (patientId: string, event: any) => {
    simulator.injectClinicalEvent(patientId, event);
    setPatients([...simulator.getPatients()]);
    soundService.playWarning();
  };

  // Filtered & Sorted Patients
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        if (selectedWard !== 'All' && p.ward !== selectedWard) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBed = p.bed.toLowerCase().includes(q);
          const matchDx = p.admissionDiagnosis.toLowerCase().includes(q);
          if (!matchName && !matchBed && !matchDx) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk_desc') return b.riskScore - a.riskScore;
        if (sortBy === 'velocity_desc') return b.velocity30m - a.velocity30m;
        if (sortBy === 'news2_desc') return b.news2.total - a.news2.total;
        if (sortBy === 'bed_asc') return a.bed.localeCompare(b.bed);
        return 0;
      });
  }, [patients, selectedWard, searchQuery, sortBy]);

  // Census counts
  const highRiskCount = patients.filter((p) => p.riskScore >= 70).length;
  const medRiskCount = patients.filter((p) => p.riskScore >= 40 && p.riskScore < 70).length;
  const lowRiskCount = patients.filter((p) => p.riskScore < 40).length;
  const activeAlerts = patients.filter((p) => !!p.activeAlert);
  const criticalAlertCount = patients.filter(
    (p) => p.activeAlert && (p.activeAlert.severity === 'critical' || p.activeAlert.state === 'escalated')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        speed={speed}
        setSpeed={setSpeed}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        activeAlertCount={activeAlerts.length}
        criticalAlertCount={criticalAlertCount}
        simulatedTime={simulatedTime}
        onOpenInjectModal={() => setIsInjectModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: WARD TRIAGE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <TriageStatsBar
              selectedWard={selectedWard}
              setSelectedWard={setSelectedWard}
              totalCount={patients.length}
              highRiskCount={highRiskCount}
              medRiskCount={medRiskCount}
              lowRiskCount={lowRiskCount}
              activeAlertCount={activeAlerts.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {/* High-Density Patient Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onSelect={(p) => setSelectedPatient(p)}
                  onQuickAcknowledge={(alertId) =>
                    handleAcknowledgeAlert(alertId, 'Dr. Alex Mercer, MD')
                  }
                />
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                <p>No patients matched the current filters.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ALERT CENTER */}
        {activeTab === 'alerts' && (
          <AlertCenter
            patients={patients}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onResolveAlert={handleResolveAlert}
            onSelectPatient={(p) => setSelectedPatient(p)}
          />
        )}

        {/* VIEW 3: MODEL BENCHMARK & EVALUATION */}
        {activeTab === 'benchmark' && <BenchmarkView />}

        {/* VIEW 4: ML PIPELINE & ARCHITECTURE */}
        {activeTab === 'pipeline' && <PipelineView />}
      </main>

      {/* Deep-Dive Patient Telemetry Drawer / Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onResolveAlert={handleResolveAlert}
        onAddNote={handleAddNote}
        onInjectEvent={handleInjectEvent}
      />

      {/* Acute Event Injector Modal */}
      <InjectScenarioModal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        patients={patients}
        onInject={handleInjectEvent}
      />

      {/* MIMIC-IV Data Adapter & Export Modal */}
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        patients={patients}
      />
    </div>
  );
}
