import React from 'react';
import { Dna, Play, Sparkles } from 'lucide-react';

interface TopBarProps {
  onRunSimulation: () => void;
  isRunning: boolean;
  activeTab: 'workspace' | 'trajectory' | 'inspector' | 'sandbox';
  setActiveTab: (tab: 'workspace' | 'trajectory' | 'inspector' | 'sandbox') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRunSimulation,
  isRunning,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark with domain icon */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
          <Dna className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-slate-900 font-sans">
          BioSynthetica
        </span>
      </div>

      {/* Zone 2: 4 concise single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'workspace' ? 'border-teal-600 text-teal-800' : 'border-transparent'
          }`}
        >
          Structure & Active Site
        </button>
        <button
          onClick={() => setActiveTab('trajectory')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'trajectory' ? 'border-teal-600 text-teal-800' : 'border-transparent'
          }`}
        >
          Evolution Trajectory
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'inspector' ? 'border-teal-600 text-teal-800' : 'border-transparent'
          }`}
        >
          Mutant Inspector
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'sandbox' ? 'border-teal-600 text-teal-800' : 'border-transparent'
          }`}
        >
          In-Silico Mutagenesis
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRunSimulation}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isRunning ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating Evolution...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Evolution</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
