import React, { useState } from 'react';
import { BenchmarkEnzyme, MutantCandidate } from '../types/enzyme';
import { Dna, Sparkles, Plus, Check, ArrowRight } from 'lucide-react';

interface InSilicoSandboxProps {
  enzyme: BenchmarkEnzyme;
  onAddMutantToScreen: (mutant: MutantCandidate) => void;
}

const AMINO_ACIDS = [
  { code: 'A', name: 'Ala (Alanine)', prop: 'Aliphatic, small' },
  { code: 'R', name: 'Arg (Arginine)', prop: 'Basic, +1 charge' },
  { code: 'N', name: 'Asn (Asparagine)', prop: 'Polar uncharged' },
  { code: 'D', name: 'Asp (Aspartate)', prop: 'Acidic, -1 charge' },
  { code: 'C', name: 'Cys (Cysteine)', prop: 'Disulfide potential' },
  { code: 'E', name: 'Glu (Glutamate)', prop: 'Acidic, -1 charge' },
  { code: 'Q', name: 'Gln (Glutamine)', prop: 'Polar uncharged' },
  { code: 'G', name: 'Gly (Glycine)', prop: 'Flexible, conformational' },
  { code: 'H', name: 'His (Histidine)', prop: 'Imidazole, catalytic' },
  { code: 'I', name: 'Ile (Isoleucine)', prop: 'Aliphatic, hydrophobic' },
  { code: 'L', name: 'Leu (Leucine)', prop: 'Aliphatic, hydrophobic' },
  { code: 'K', name: 'Lys (Lysine)', prop: 'Basic, +1 charge' },
  { code: 'M', name: 'Met (Methionine)', prop: 'Thioether, sulfur' },
  { code: 'F', name: 'Phe (Phenylalanine)', prop: 'Aromatic, bulky' },
  { code: 'P', name: 'Pro (Proline)', prop: 'Rigid helix-breaker' },
  { code: 'S', name: 'Ser (Serine)', prop: 'Polar, nucleophilic' },
  { code: 'T', name: 'Thr (Threonine)', prop: 'Polar, beta-branched' },
  { code: 'W', name: 'Trp (Tryptophan)', prop: 'Aromatic, pi-stacking' },
  { code: 'Y', name: 'Tyr (Tyrosine)', prop: 'Aromatic, phenolic' },
  { code: 'V', name: 'Val (Valine)', prop: 'Aliphatic, beta-branched' },
];

export const InSilicoSandbox: React.FC<InSilicoSandboxProps> = ({
  enzyme,
  onAddMutantToScreen,
}) => {
  const [targetPosition, setTargetPosition] = useState<number>(
    enzyme.activeSiteResidues[0]?.position || 160
  );
  const [targetAA, setTargetAA] = useState<string>('A');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  // Derive native residue from sequence if available
  const nativeResidue = enzyme.sequence[targetPosition - 1] || 'X';
  const mutationNotation = `${nativeResidue}${targetPosition}${targetAA}`;

  const handleTestMutation = () => {
    setIsSubmitting(true);
    // Construct predicted in-silico mutant
    const isCatalytic = enzyme.activeSiteResidues.some((r) => r.position === targetPosition);

    let ddG = -1.2;
    let deltaTm = 3.5;
    let kcatFold = 1.4;
    let kmFold = 0.9;
    let rationale = `Custom designed mutation ${mutationNotation}. In-silico packing analysis indicates enhanced second-shell stabilization.`;

    if (isCatalytic && (targetAA === 'A' || targetAA === 'G')) {
      ddG = 0.5;
      deltaTm = -1.5;
      kcatFold = 0.05; // Knockout/alanine scan
      rationale = `Alanine scan knockout on catalytic position #${targetPosition} confirms critical role in nucleophile or proton relay.`;
    } else if (targetAA === 'E' || targetAA === 'K') {
      deltaTm = 4.8;
      ddG = -2.1;
      kcatFold = 1.8;
      rationale = `Introduction of surface charge pairing / salt bridge with adjacent helix stabilizes global tertiary fold.`;
    }

    const newCandidate: MutantCandidate = {
      id: `custom_${Date.now()}`,
      mutationNotation,
      mutations: [mutationNotation],
      ddG_folding_kcal_mol: ddG,
      delta_tm_celsius: deltaTm,
      kcat_fold_change: kcatFold,
      km_fold_change: kmFold,
      catalytic_efficiency_fold: kcatFold / kmFold,
      pareto_fitness_score: Math.min(95, Math.max(30, 60 + deltaTm * 3)),
      is_pareto_optimal: deltaTm > 3.0 && kcatFold > 1.2,
      structural_rationale: rationale,
      liability_risk: isCatalytic ? 'High: Catalytic triad disruption' : 'Low to Moderate',
    };

    onAddMutantToScreen(newCandidate);
    setCreatedNotice(`Candidate ${mutationNotation} added to active evolutionary dataset!`);
    setIsSubmitting(false);
    setTimeout(() => setCreatedNotice(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
          <Dna className="w-4 h-4" />
          <span>Interactive In-Silico Mutagenesis Sandbox</span>
        </div>
        <h2 className="text-base font-bold text-slate-900 mt-1 font-sans">
          Single-Point Site Directed Engineering & Alanine Scanning
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Select target sequence coordinates and amino acid substitutions to test folding stability and catalytic perturbation.
        </p>
      </div>

      {/* Suggested Hotspots */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Key Functional & Catalytic Hotspots:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {enzyme.activeSiteResidues.map((res) => (
            <button
              key={res.position}
              onClick={() => setTargetPosition(res.position)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                targetPosition === res.position
                  ? 'bg-teal-700 text-white border-teal-700 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {res.residue} (#{res.position})
            </button>
          ))}
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Position Input */}
        <div className="md:col-span-4 space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Residue Coordinate (1 - {enzyme.sequence.length}):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={enzyme.sequence.length}
              value={targetPosition}
              onChange={(e) => setTargetPosition(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 text-slate-900"
            />
            <span className="font-mono text-xs font-bold text-teal-800 shrink-0 px-2 py-1 bg-teal-50 rounded border border-teal-200">
              WT: {nativeResidue}
            </span>
          </div>
        </div>

        {/* Amino Acid Replacement Selector */}
        <div className="md:col-span-5 space-y-1">
          <label className="block text-xs font-medium text-slate-700">
            Target Substitution:
          </label>
          <select
            value={targetAA}
            onChange={(e) => setTargetAA(e.target.value)}
            className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 text-slate-800"
          >
            {AMINO_ACIDS.map((aa) => (
              <option key={aa.code} value={aa.code}>
                {aa.name} ({aa.prop})
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-3 flex flex-col justify-end pt-5">
          <button
            onClick={handleTestMutation}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate {mutationNotation}</span>
          </button>
        </div>
      </div>

      {createdNotice && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{createdNotice}</span>
        </div>
      )}
    </div>
  );
};
