import React, { useState } from 'react';
import { EvolutionRunResult, MutantCandidate } from '../types/enzyme';
import {
  TrendingUp,
  Award,
  ShieldCheck,
  Zap,
  Flame,
  ChevronRight,
  ExternalLink,
  Target,
} from 'lucide-react';

interface EvolutionTrajectoryProps {
  evolutionResult: EvolutionRunResult | null;
  selectedMutant: MutantCandidate | null;
  onSelectMutant: (mutant: MutantCandidate) => void;
  isRunning: boolean;
  onRunDirectedEvolution: () => void;
}

export const EvolutionTrajectory: React.FC<EvolutionTrajectoryProps> = ({
  evolutionResult,
  selectedMutant,
  onSelectMutant,
  isRunning,
  onRunDirectedEvolution,
}) => {
  const [filterParetoOnly, setFilterParetoOnly] = useState<boolean>(false);
  const [hoveredMutant, setHoveredMutant] = useState<MutantCandidate | null>(null);

  if (!evolutionResult) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-slate-900 font-sans">
            In-Silico Directed Evolution Trajectory
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Execute a multi-generational evolutionary campaign to screen single-point and combinatorial substitutions along the Pareto multi-objective frontier.
          </p>
        </div>
        <button
          onClick={onRunDirectedEvolution}
          disabled={isRunning}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          {isRunning ? 'Simulating Generations...' : 'Launch Directed Evolution Campaign'}
        </button>
      </div>
    );
  }

  // Flatten all mutants across generations
  const allMutants = evolutionResult.generations.flatMap((g) =>
    g.mutants.map((m) => ({ ...m, roundNumber: g.roundNumber }))
  );

  const displayedMutants = filterParetoOnly
    ? allMutants.filter((m) => m.is_pareto_optimal)
    : allMutants;

  // Compute best metrics
  const maxDeltaTm = Math.max(...allMutants.map((m) => m.delta_tm_celsius));
  const maxEfficiency = Math.max(...allMutants.map((m) => m.catalytic_efficiency_fold));
  const bestDdG = Math.min(...allMutants.map((m) => m.ddG_folding_kcal_mol));
  const paretoCount = allMutants.filter((m) => m.is_pareto_optimal).length;

  // SVG Scatter plot bounds
  const minX = Math.min(0, ...allMutants.map((m) => m.delta_tm_celsius)) - 1;
  const maxX = Math.max(10, ...allMutants.map((m) => m.delta_tm_celsius)) + 2;
  const minY = 0;
  const maxY = Math.max(4, ...allMutants.map((m) => m.catalytic_efficiency_fold)) + 1;

  const svgWidth = 540;
  const svgHeight = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const scaleX = (val: number) =>
    padding.left + ((val - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (val: number) =>
    padding.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;

  // Sort pareto points for line drawing
  const paretoPoints = allMutants
    .filter((m) => m.is_pareto_optimal)
    .sort((a, b) => a.delta_tm_celsius - b.delta_tm_celsius);

  return (
    <div className="space-y-6">
      {/* KPI Performance Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Max Thermostability
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
              +{maxDeltaTm.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-500">°C</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans block mt-1">
            Shift in Melting Temperature (Tm)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Peak Catalytic Turnover
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
              {maxEfficiency.toFixed(2)}x
            </span>
            <span className="text-xs font-mono text-slate-500">kcat/Km</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans block mt-1">
            Relative to Wild-Type baseline
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Top Folding Stability
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
              {bestDdG.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-500">kcal/mol</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans block mt-1">
            ΔΔG folding energy delta
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pareto Frontier
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
              {paretoCount}
            </span>
            <span className="text-xs font-mono text-slate-500">variants</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans block mt-1">
            Non-dominated trade-off solutions
          </span>
        </div>
      </div>

      {/* Main Trajectory Split: Interactive Pareto Scatter Plot + Generation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Pareto Frontier 2D Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
                <Award className="w-3.5 h-3.5" />
                <span>Pareto Multi-Objective Landscape</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5 font-sans">
                Thermostability vs. Catalytic Efficiency Trade-off
              </h3>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setFilterParetoOnly(!filterParetoOnly)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                filterParetoOnly
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {filterParetoOnly ? 'Showing Pareto Only' : 'Show All Mutants'}
            </button>
          </div>

          {/* SVG Plot */}
          <div className="relative border border-slate-100 rounded-lg p-2 bg-slate-50/50">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
              {/* Grid Lines */}
              {[1, 2, 3, 4, 5].map((yVal) => {
                const y = scaleY(yVal);
                if (y < padding.top || y > padding.top + plotHeight) return null;
                return (
                  <g key={`y-${yVal}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + plotWidth}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-slate-400"
                    >
                      {yVal}x
                    </text>
                  </g>
                );
              })}

              {[0, 5, 10, 15, 20].map((xVal) => {
                const x = scaleX(xVal);
                if (x < padding.left || x > padding.left + plotWidth) return null;
                return (
                  <g key={`x-${xVal}`}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + plotHeight}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={x}
                      y={padding.top + plotHeight + 16}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-400"
                    >
                      +{xVal}°
                    </text>
                  </g>
                );
              })}

              {/* Axes Lines */}
              <line
                x1={padding.left}
                y1={padding.top + plotHeight}
                x2={padding.left + plotWidth}
                y2={padding.top + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={padding.top + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
              />

              {/* Axis Titles */}
              <text
                x={padding.left + plotWidth / 2}
                y={svgHeight - 6}
                textAnchor="middle"
                className="text-[11px] font-sans font-medium fill-slate-600"
              >
                Thermostability Delta (ΔTm °C)
              </text>
              <text
                x={14}
                y={padding.top + plotHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90 14 ${padding.top + plotHeight / 2})`}
                className="text-[11px] font-sans font-medium fill-slate-600"
              >
                kcat/Km Fold Improvement
              </text>

              {/* Pareto Frontier Connecting Line */}
              {paretoPoints.length > 1 && (
                <path
                  d={paretoPoints
                    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.delta_tm_celsius)} ${scaleY(p.catalytic_efficiency_fold)}`)
                    .join(' ')}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {/* Scatter Points */}
              {displayedMutants.map((mutant) => {
                const cx = scaleX(mutant.delta_tm_celsius);
                const cy = scaleY(mutant.catalytic_efficiency_fold);
                const isSelected = selectedMutant?.id === mutant.id;
                const isHovered = hoveredMutant?.id === mutant.id;
                const isPareto = mutant.is_pareto_optimal;

                return (
                  <g
                    key={mutant.id}
                    className="cursor-pointer"
                    onClick={() => onSelectMutant(mutant)}
                    onMouseEnter={() => setHoveredMutant(mutant)}
                    onMouseLeave={() => setHoveredMutant(null)}
                  >
                    {/* Selection ring */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={12}
                        fill="none"
                        stroke={isPareto ? '#0d9488' : '#3b82f6'}
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isPareto ? 7 : 5}
                      fill={isPareto ? '#0f766e' : '#64748b'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {isPareto && (
                      <text
                        x={cx}
                        y={cy - 9}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-teal-900 pointer-events-none"
                      >
                        {mutant.mutationNotation}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredMutant && (
              <div className="absolute top-3 right-3 bg-slate-900/95 text-white p-3 rounded-lg text-xs font-sans shadow-lg max-w-[240px] pointer-events-none">
                <span className="font-mono font-bold text-teal-400 block">
                  {hoveredMutant.mutationNotation}
                </span>
                <div className="mt-1 space-y-0.5 text-[11px] font-mono text-slate-300">
                  <p>ΔTm: +{hoveredMutant.delta_tm_celsius.toFixed(1)}°C</p>
                  <p>kcat/Km: {hoveredMutant.catalytic_efficiency_fold.toFixed(2)}x</p>
                  <p>ΔΔG: {hoveredMutant.ddG_folding_kcal_mol.toFixed(2)} kcal/mol</p>
                </div>
                <p className="mt-1 text-[10px] text-slate-400 leading-tight">
                  {hoveredMutant.structural_rationale.slice(0, 90)}...
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block" />
              <span>Pareto-Optimal Solutions</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
              <span>Screened Mutants</span>
            </span>
          </div>
        </div>

        {/* Right Column: Generation-by-Generation Trajectory Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Generational Search Log
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {evolutionResult.generations.length} Generations
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {evolutionResult.generations.map((gen) => (
              <div
                key={gen.roundNumber}
                className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-700 text-white text-[11px] font-bold font-mono flex items-center justify-center">
                      G{gen.roundNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-sans">
                      {gen.strategyTheme}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {gen.mutants.length} variants
                  </span>
                </div>

                <div className="space-y-1.5">
                  {gen.mutants.map((mutant) => {
                    const isSelected = selectedMutant?.id === mutant.id;
                    return (
                      <div
                        key={mutant.id}
                        onClick={() => onSelectMutant(mutant)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 text-teal-950 font-medium'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold">{mutant.mutationNotation}</span>
                            {mutant.is_pareto_optimal && (
                              <span className="text-[9px] font-mono font-bold bg-teal-700 text-white px-1.5 py-0.2 rounded-xs">
                                PARETO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-sans line-clamp-1">
                            {mutant.structural_rationale}
                          </span>
                        </div>

                        <div className="text-right font-mono text-[11px] shrink-0 pl-2">
                          <span className="text-teal-800 font-bold">
                            +{mutant.delta_tm_celsius.toFixed(1)}°C
                          </span>
                          <span className="text-slate-400 block text-[10px]">
                            {mutant.catalytic_efficiency_fold.toFixed(2)}x kcat
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
