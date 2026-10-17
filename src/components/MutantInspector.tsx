import React, { useState } from 'react';
import { BenchmarkEnzyme, MutantCandidate, MutantVerificationResult } from '../types/enzyme';
import { verifyMutant } from '../services/geminiService';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Info,
} from 'lucide-react';

interface MutantInspectorProps {
  enzyme: BenchmarkEnzyme;
  selectedMutant: MutantCandidate | null;
  onOpenProtocolModal: (mutant: MutantCandidate) => void;
}

export const MutantInspector: React.FC<MutantInspectorProps> = ({
  enzyme,
  selectedMutant,
  onOpenProtocolModal,
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<MutantVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  if (!selectedMutant) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <Info className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800 font-sans">No Mutant Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Select a variant point from the Pareto frontier plot or the generational search log to inspect its structural and thermodynamic parameters.
        </p>
      </div>
    );
  }

  const handleVerifyMutant = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    try {
      const res = await verifyMutant(enzyme, selectedMutant.mutations, {
        ddG: selectedMutant.ddG_folding_kcal_mol,
        deltaTm: selectedMutant.delta_tm_celsius,
        kcatFold: selectedMutant.kcat_fold_change,
        kmFold: selectedMutant.km_fold_change,
      });
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      {/* Variant Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <span>Engineered Variant Profile</span>
            {selectedMutant.is_pareto_optimal && (
              <span className="bg-teal-700 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-xs font-bold">
                PARETO OPTIMAL
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold font-mono text-slate-900 mt-1">
            {selectedMutant.mutationNotation}
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Target Host: {enzyme.organism} · Scaffold: {enzyme.pdbId}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyMutant}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Screening...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Counter-Screen Biophysics</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenProtocolModal(selectedMutant)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Wet-Lab Protocol</span>
          </button>
        </div>
      </div>

      {/* Biophysical Delta Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Folding Stability (ΔΔG)
          </span>
          <p className="text-lg font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {selectedMutant.ddG_folding_kcal_mol.toFixed(2)}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">kcal/mol</span>
          </p>
          <span className="text-[10px] text-slate-500">
            {selectedMutant.ddG_folding_kcal_mol < 0 ? 'Favorable stabilization' : 'Destabilizing'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Melting Temp Shift (ΔTm)
          </span>
          <p className="text-lg font-bold font-mono text-teal-800 tabular-nums mt-0.5">
            +{selectedMutant.delta_tm_celsius.toFixed(1)}°C
          </p>
          <span className="text-[10px] text-slate-500">
            Est. Tm: {(enzyme.wildTypeKinetics.tm + selectedMutant.delta_tm_celsius).toFixed(1)}°C
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Catalytic Turnover (kcat)
          </span>
          <p className="text-lg font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {selectedMutant.kcat_fold_change.toFixed(2)}x
          </p>
          <span className="text-[10px] text-slate-500">
            {(enzyme.wildTypeKinetics.kcat * selectedMutant.kcat_fold_change).toFixed(2)} s⁻¹
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Substrate Affinity (Km)
          </span>
          <p className="text-lg font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {selectedMutant.km_fold_change.toFixed(2)}x
          </p>
          <span className="text-[10px] text-slate-500">
            {(enzyme.wildTypeKinetics.km * selectedMutant.km_fold_change).toFixed(3)} mM
          </span>
        </div>
      </div>

      {/* Structural Rationale & Liability Risks */}
      <div className="space-y-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
            Structural & Molecular Rationale
          </span>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            {selectedMutant.structural_rationale}
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-lg border text-xs bg-amber-50/70 border-amber-200/80 text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Molecular Liability Assessment: </span>
            <span>{selectedMutant.liability_risk}</span>
          </div>
        </div>
      </div>

      {/* Verification Counter-Screen Results Box */}
      {verificationResult && (
        <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold font-mono text-teal-950 uppercase tracking-wider">
                Counter-Screen Status: {verificationResult.verdict}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-teal-800">
              Confidence: {verificationResult.confidenceScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-teal-200/80">
              <span className="font-semibold text-slate-700 block text-[11px] mb-1">
                Steric & Cavity Check:
              </span>
              <p className="text-slate-600">{verificationResult.stericScore}</p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-teal-200/80">
              <span className="font-semibold text-slate-700 block text-[11px] mb-1">
                Electrostatic & H-Bond Retention:
              </span>
              <p className="text-slate-600">{verificationResult.electrostaticStatus}</p>
            </div>
          </div>

          <div className="text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Synthesis Recommendations: </span>
            <span>{verificationResult.recommendations}</span>
          </div>
        </div>
      )}

      {verificationError && (
        <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs border border-rose-200">
          Verification Error: {verificationError}
        </div>
      )}
    </div>
  );
};
