import React from 'react';
import {
  Activity,
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Zap,
  Download,
  BarChart3,
  Sliders,
  Bell,
  Code2,
  Clock,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'alerts' | 'benchmark' | 'pipeline';
  setActiveTab: (tab: 'dashboard' | 'alerts' | 'benchmark' | 'pipeline') => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  activeAlertCount: number;
  criticalAlertCount: number;
  simulatedTime: number;
  onOpenInjectModal: () => void;
  onOpenDataModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPaused,
  setIsPaused,
  speed,
  setSpeed,
  isMuted,
  setIsMuted,
  activeAlertCount,
  criticalAlertCount,
  simulatedTime,
  onOpenInjectModal,
  onOpenDataModal,
}) => {
  const formattedSimTime = new Date(simulatedTime * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinical Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">VitalWatch</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                  AI Early Warning
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Predictive In-Hospital Deterioration Surveillance · Calibrated SHAP Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Ward Triage</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all relative ${
                activeTab === 'alerts'
                  ? 'bg-slate-900 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alert Queue</span>
              {activeAlertCount > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    criticalAlertCount > 0
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {activeAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-slate-900 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>AI vs NEWS2</span>
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-slate-900 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>ML Architecture</span>
            </button>
          </nav>

          {/* Simulation Controls & Tools */}
          <div className="flex items-center gap-2">
            {/* Simulated Time */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-300 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedSimTime}</span>
            </div>

            {/* Play/Pause & Speed Multiplier */}
            <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5">
              <button
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center border-l border-slate-700 ml-1 pl-1">
                {[1, 5, 10, 30].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-1.5 py-0.5 text-[11px] font-mono rounded ${
                      speed === s ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Telemetry Chimes Muted' : 'Telemetry Chimes Active'}
              className={`p-2 rounded-md border transition-colors ${
                isMuted
                  ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Inject Scenario Event */}
            <button
              onClick={onOpenInjectModal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 rounded-md text-xs font-medium transition-colors"
              title="Inject acute clinical emergency"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Simulate Event</span>
            </button>

            {/* Export/Import Data */}
            <button
              onClick={onOpenDataModal}
              className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
              title="Export or Import Patient Vitals Data (MIMIC-IV format)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
