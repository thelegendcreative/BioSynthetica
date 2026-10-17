import React, { useEffect, useState } from 'react';
import { BenchmarkEnzyme, MutantCandidate, WetLabProtocolResult } from '../types/enzyme';
import { generateWetLabProtocol } from '../services/geminiService';
import {
  X,
  Copy,
  Check,
  Download,
  Dna,
  TestTube2,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface WetLabProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  enzyme: BenchmarkEnzyme;
  mutant: MutantCandidate | null;
}

export const WetLabProtocolModal: React.FC<WetLabProtocolModalProps> = ({
  isOpen,
  onClose,
  enzyme,
  mutant,
}) => {
  const [protocol, setProtocol] = useState<WetLabProtocolResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && mutant) {
      setIsLoading(true);
      setError(null);
      generateWetLabProtocol(enzyme, mutant.mutationNotation, mutant.mutations)
        .then((data) => {
          setProtocol(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to generate protocol');
          setIsLoading(false);
        });
    }
  }, [isOpen, mutant, enzyme]);

  if (!isOpen || !mutant) return null;

  const copyToClipboard = () => {
    if (!protocol) return;
    const text = `# Wet-Lab Experimental Protocol: ${protocol.variantTitle}
Target Enzyme: ${enzyme.name} (${enzyme.pdbId})
Host: ${protocol.expressionAndPurification.hostStrain}

## 1. Mutagenic Primers
${protocol.primers
  .map(
    (p) =>
      `- ${p.name} (${p.mutationTarget}): 5'-${p.sequence5to3}-3' (Length: ${p.length}nt, Tm: ${p.tmCelsius}°C, GC: ${p.gcPercent}%)`
  )
  .join('\n')}

## 2. PCR Cycling Conditions
${protocol.pcrCyclingSteps
  .map((s) => `- ${s.step}: ${s.tempCelsius}°C for ${s.durationSec}s (${s.cycles})`)
  .join('\n')}

## 3. Expression & IMAC Purification
- Vector Backbone: ${protocol.expressionAndPurification.vectorBackbone}
- Host Strain: ${protocol.expressionAndPurification.hostStrain}
- Growth Media: ${protocol.expressionAndPurification.growthMedia}
- Induction: ${protocol.expressionAndPurification.inductionCondition}
- Lysis Buffer: ${protocol.expressionAndPurification.lysisBuffer}
- Chromatography: ${protocol.expressionAndPurification.chromatographyMethod}
- Elution Buffer: ${protocol.expressionAndPurification.elutionBuffer}

## 4. Spectrophotometric Kinetic Assay
- Substrate: ${protocol.kineticAssaySpecification.substrateName}
- Concentration Series: ${protocol.kineticAssaySpecification.concentrationRangeMm}
- Assay Buffer: ${protocol.kineticAssaySpecification.assayBuffer}
- Detection Wavelength: ${protocol.kineticAssaySpecification.detectionWavelengthNm} nm
- Plate Format: ${protocol.kineticAssaySpecification.plateFormat}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
              <TestTube2 className="w-4 h-4" />
              <span>Bench-Ready Wet-Lab Synthesis & Assay Protocol</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5 font-sans">
              Variant: {mutant.mutationNotation} ({enzyme.name})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {protocol && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Sparkles className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="font-mono text-xs">Synthesizing PCR Primer & Assay Conditions...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs">
              Error generating protocol: {error}
            </div>
          )}

          {protocol && !isLoading && (
            <>
              {/* Section 1: Mutagenic PCR Primers */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Dna className="w-4 h-4 text-teal-700" />
                  <span>1. Mutagenic Oligonucleotide Primers (Site-Directed Mutagenesis)</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/80 border-b border-slate-200 font-semibold text-slate-700">
                      <tr>
                        <th className="px-3 py-2">Primer</th>
                        <th className="px-3 py-2">Sequence (5' → 3')</th>
                        <th className="px-3 py-2">Length</th>
                        <th className="px-3 py-2">Tm</th>
                        <th className="px-3 py-2">GC%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {protocol.primers.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-bold text-teal-800">{p.name}</td>
                          <td className="px-3 py-2 text-slate-800 tracking-wider break-all select-all">
                            {p.sequence5to3}
                          </td>
                          <td className="px-3 py-2 text-slate-600 tabular-nums">{p.length} nt</td>
                          <td className="px-3 py-2 text-slate-600 tabular-nums">{p.tmCelsius}°C</td>
                          <td className="px-3 py-2 text-slate-600 tabular-nums">{p.gcPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: PCR Thermocycling */}
              <div className="space-y-2.5">
                <span className="text-slate-900 font-bold text-xs uppercase tracking-wider block">
                  2. PCR Thermocycler Profile & DpnI Digestion
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center font-mono">
                  {protocol.pcrCyclingSteps.map((step, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-sans text-slate-500 block">
                        {step.step}
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {step.tempCelsius}°C
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {step.durationSec}s · {step.cycles}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Expression & Purification */}
              <div className="space-y-2.5">
                <span className="text-slate-900 font-bold text-xs uppercase tracking-wider block">
                  3. Recombinant Expression & IMAC Purification
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Expression Host & Vector:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {protocol.expressionAndPurification.hostStrain} ·{' '}
                      {protocol.expressionAndPurification.vectorBackbone}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Induction Conditions:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {protocol.expressionAndPurification.inductionCondition}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Lysis Buffer:</span>
                    <p className="font-mono text-[11px] text-slate-700 mt-0.5">
                      {protocol.expressionAndPurification.lysisBuffer}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Elution Method:</span>
                    <p className="font-mono text-[11px] text-slate-700 mt-0.5">
                      {protocol.expressionAndPurification.elutionBuffer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Spectrophotometric Kinetic Assay */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-teal-700" />
                  <span>4. Michaelis-Menten Kinetic Assay Protocol</span>
                </div>
                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200/80 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Assay Buffer:</span>
                      <p className="font-mono text-slate-800">
                        {protocol.kineticAssaySpecification.assayBuffer}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Detection Wavelength:</span>
                      <p className="font-mono text-teal-800 font-bold">
                        {protocol.kineticAssaySpecification.detectionWavelengthNm} nm
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-teal-100 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Substrate & Titration Range:</span>
                      <p className="font-semibold text-slate-800">
                        {protocol.kineticAssaySpecification.substrateName} (
                        {protocol.kineticAssaySpecification.concentrationRangeMm})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Plate Format:</span>
                      <p className="font-semibold text-slate-800">
                        {protocol.kineticAssaySpecification.plateFormat}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Control Checklist */}
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Quality Control Verification Checklist:
                </span>
                <ul className="space-y-1 text-slate-600">
                  {protocol.qualityControlChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
