import React, { useState } from 'react';
import { Patient } from '../types/patient';
import { exportPatientsToCSV, downloadCSV, parseCSV } from '../services/csvAdapter';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle, Database } from 'lucide-react';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
}

export const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  patients,
}) => {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number>(0);

  if (!isOpen) return null;

  const handleDownload = () => {
    const csvContent = exportPatientsToCSV(patients);
    downloadCSV(`vitalwatch_mimic_cohort_${Date.now()}.csv`, csvContent);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const records = parseCSV(text);
        if (records.length > 0) {
          setParsedCount(records.length);
          setUploadStatus(`Successfully parsed ${records.length} records. MIMIC-IV schema verified.`);
        } else {
          setUploadStatus('Could not parse vitals columns. Please ensure CSV has standard headers (hr, sbp, spo2, rr).');
        }
      } catch (err: any) {
        setUploadStatus(`Error parsing CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">MIMIC-IV Data Adapter & Export</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Export Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              Export Live Simulation Time-Series
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Download all {patients.length} patients and their rolling telemetry history as a
              standardised CSV. Includes vital signs, shock index, NEWS2 scores, AI risk scores, and deterioration labels.
            </p>
            <button
              onClick={handleDownload}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download MIMIC-IV Format CSV
            </button>
          </div>

          {/* Import / Adapter Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-cyan-400" />
              MIMIC / PhysioNet CSV Loader Adapter
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Test external patient records against VitalWatch algorithms. Supports headers:
              <code className="text-[11px] font-mono text-slate-300 block mt-1 bg-slate-900 p-1.5 rounded border border-slate-800">
                heart_rate, systolic_bp, diastolic_bp, spo2, respiratory_rate, temperature_c, consciousness
              </code>
            </p>

            <div className="mt-3">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            {uploadStatus && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  parsedCount > 0
                    ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-800/80 text-rose-300'
                }`}
              >
                {parsedCount > 0 ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
