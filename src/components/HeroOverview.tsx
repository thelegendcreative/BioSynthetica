import React from 'react';
import { BenchmarkEnzyme } from '../types/enzyme';
import { ExternalLink, Flame, ShieldAlert, Target } from 'lucide-react';

interface HeroOverviewProps {
  benchmarks: BenchmarkEnzyme[];
  selectedEnzyme: BenchmarkEnzyme;
  onSelectEnzyme: (enzyme: BenchmarkEnzyme) => void;
  designGoal: string;
  setDesignGoal: (goal: string) => void;
  rounds: number;
  setRounds: (r: number) => void;
  targetPocketOnly: boolean;
  setTargetPocketOnly: (val: boolean) => void;
  onRunSimulation: () => void;
  isRunning: boolean;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  benchmarks,
  selectedEnzyme,
  onSelectEnzyme,
  designGoal,
  setDesignGoal,
  rounds,
  setRounds,
  targetPocketOnly,
  setTargetPocketOnly,
  onRunSimulation,
  isRunning,
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Benchmark Quick-Try Selector Strip */}
      <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Target Benchmarks:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {benchmarks.map((enzyme) => {
              const isSelected = enzyme.id === selectedEnzyme.id;
              return (
                <button
                  key={enzyme.id}
                  onClick={() => onSelectEnzyme(enzyme)}
                  className={`px-3 py-1 rounded-md font-medium transition-all text-xs whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {enzyme.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Database accessions & citations */}
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">PDB:</span>
            <a
              href={`https://www.rcsb.org/structure/${selectedEnzyme.pdbId}`}
              target="_blank"
              rel="noreferrer"
              className="text-teal-700 hover:underline flex items-center gap-0.5"
            >
              {selectedEnzyme.pdbId}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">UniProt:</span>
            <a
              href={`https://www.uniprot.org/uniprotkb/${selectedEnzyme.uniprotId}`}
              target="_blank"
              rel="noreferrer"
              className="text-teal-700 hover:underline flex items-center gap-0.5"
            >
              {selectedEnzyme.uniprotId}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">{selectedEnzyme.ecNumber}</span>
        </div>
      </div>

      {/* Main Hero Header & Parameters Grid */}
      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Enzyme Overview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-teal-800">{selectedEnzyme.organism}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedEnzyme.commonName}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedEnzyme.sequence.length} amino acids</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans text-balance">
            {selectedEnzyme.name} Directed Evolution
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            {selectedEnzyme.challenge}
          </p>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5">
            <Target className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Catalytic Scheme: </span>
              <span className="font-mono text-slate-800">{selectedEnzyme.reactionScheme}</span>
            </div>
          </div>
        </div>

        {/* Right Column: In-Silico Campaign Controls */}
        <div className="lg:col-span-5 bg-slate-50/90 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Evolutionary Objective & Parameters
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Pareto Multi-Objective
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Optimization Objective:
            </label>
            <input
              type="text"
              value={designGoal}
              onChange={(e) => setDesignGoal(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 focus:border-teal-600 text-slate-900"
              placeholder="e.g. Increase Tm by >15°C and catalytic efficiency on crystalline PET"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Generations ({rounds} rounds):
              </label>
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-teal-600 text-slate-800"
              >
                <option value={2}>2 Generations (Fast screening)</option>
                <option value={3}>3 Generations (Balanced Pareto)</option>
                <option value={4}>4 Generations (Deep landscape search)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={targetPocketOnly}
                  onChange={(e) => setTargetPocketOnly(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] leading-tight">Focus on active site & shell II</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
