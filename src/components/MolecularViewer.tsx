import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ActiveSiteResidue, BenchmarkEnzyme, MutantCandidate } from '../types/enzyme';
import {
  RotateCcw,
  Camera,
  Maximize2,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Atom,
} from 'lucide-react';

interface MolecularViewerProps {
  enzyme: BenchmarkEnzyme;
  selectedMutant?: MutantCandidate | null;
  activeSiteResidues: ActiveSiteResidue[];
  onSelectResidue?: (residue: ActiveSiteResidue | { position: number; residue: string }) => void;
}

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  enzyme,
  selectedMutant,
  activeSiteResidues,
  onSelectResidue,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const [renderMode, setRenderMode] = useState<'cartoon' | 'stick' | 'sphere' | 'surface'>('cartoon');
  const [colorScheme, setColorScheme] = useState<'plddt' | 'secondary' | 'spectrum'>('plddt');
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [pickedResidue, setPickedResidue] = useState<{
    resn: string;
    resi: number;
    chain: string;
    b?: number;
  } | null>(null);

  // Extract mutated positions for highlighting
  const mutatedPositions = React.useMemo(() => {
    if (!selectedMutant?.mutations) return [];
    return selectedMutant.mutations.map((m) => {
      const match = m.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    }).filter((p): p is number => p !== null);
  }, [selectedMutant]);

  // Apply styling and highlight rules to 3Dmol viewer
  const applyStyles = useCallback((viewer: any) => {
    if (!viewer) return;

    try {
      // Base protein styling
      if (renderMode === 'cartoon') {
        if (colorScheme === 'plddt') {
          // AlphaFold pLDDT coloring
          viewer.setStyle({}, {
            cartoon: {
              colorfunc: (atom: any) => {
                const b = atom.b || 80;
                if (b > 90) return '#0053D6'; // Very high
                if (b > 70) return '#65CBF3'; // Confident
                if (b > 50) return '#FFDB13'; // Low
                return '#FF7D45';             // Very low
              },
            },
          });
        } else if (colorScheme === 'spectrum') {
          viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        } else {
          viewer.setStyle({}, { cartoon: { colorscheme: 'ssJmol' } });
        }
      } else if (renderMode === 'stick') {
        viewer.setStyle({}, { stick: { radius: 0.25, colorscheme: 'Jmol' } });
      } else if (renderMode === 'sphere') {
        viewer.setStyle({}, { sphere: { scale: 0.8, colorscheme: 'Jmol' } });
      } else if (renderMode === 'surface') {
        viewer.setStyle({}, { cartoon: { color: '#94a3b8', opacity: 0.7 } });
        try {
          viewer.addSurface(viewer.SurfaceType?.SAS || 1, {
            opacity: 0.65,
            color: '#38bdf8',
          });
        } catch {
          // Surface creation fallback
        }
      }

      // Highlight Catalytic Active Site Residues in bold stick + spheres
      const activePositions = activeSiteResidues.map((r) => r.position);
      if (activePositions.length > 0) {
        viewer.setStyle(
          { resi: activePositions },
          {
            stick: { color: '#f43f5e', radius: 0.35 },
            sphere: { color: '#f43f5e', scale: 0.4 },
          }
        );
      }

      // Highlight Mutated Residues in selected mutant
      if (mutatedPositions.length > 0) {
        viewer.setStyle(
          { resi: mutatedPositions },
          {
            stick: { color: '#06b6d4', radius: 0.45 },
            sphere: { color: '#06b6d4', scale: 0.5 },
          }
        );
      }

      viewer.render();
    } catch (err) {
      console.warn('Error applying 3Dmol styles:', err);
    }
  }, [renderMode, colorScheme, activeSiteResidues, mutatedPositions]);

  // Initialize and load structure
  useEffect(() => {
    let isMounted = true;
    let viewer: any = null;

    async function initViewer() {
      if (!containerRef.current) return;
      setIsLoading(true);
      setLoadError(null);

      try {
        // Dynamically import 3dmol
        let $3DmolModule: any = null;
        try {
          $3DmolModule = await import('3dmol');
        } catch (e) {
          console.warn('3dmol import error:', e);
        }

        const $3Dmol = $3DmolModule?.default || $3DmolModule || (window as any).$3Dmol;

        if (!$3Dmol || typeof $3Dmol.createViewer !== 'function') {
          throw new Error('3Dmol library unavailable, activating WebGL molecular canvas fallback');
        }

        // Clean container
        containerRef.current.innerHTML = '';

        viewer = $3Dmol.createViewer(containerRef.current, {
          defaultcolors: $3Dmol.rasmolElementColors,
          backgroundColor: '#0b1120', // Deep obsidian slate for structural contrast
        });

        viewerInstanceRef.current = viewer;

        // Fetch coordinate file from RCSB PDB or AlphaFold
        let structureData = '';
        let format = 'pdb';

        try {
          // Try fetching PDB coordinate
          const pdbRes = await fetch(`https://files.rcsb.org/download/${enzyme.pdbId.toUpperCase()}.pdb`);
          if (pdbRes.ok) {
            structureData = await pdbRes.text();
            format = 'pdb';
          }
        } catch {
          // Fallback to AlphaFold DB
        }

        if (!structureData) {
          try {
            const afRes = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${enzyme.uniprotId}-F1-model_v6.pdb`);
            if (afRes.ok) {
              structureData = await afRes.text();
              format = 'pdb';
            }
          } catch {
            // Coordinate fetch failed
          }
        }

        if (!structureData) {
          throw new Error(`Coordinates for ${enzyme.pdbId} could not be retrieved from RCSB PDB`);
        }

        if (!isMounted) return;

        viewer.addModel(structureData, format);
        applyStyles(viewer);
        viewer.zoomTo();
        viewer.render();

        // Residue click handler
        viewer.setClickable({}, true, (atom: any) => {
          if (!atom) return;
          const picked = {
            resn: atom.resn,
            resi: atom.resi,
            chain: atom.chain,
            b: atom.b,
          };
          setPickedResidue(picked);
          if (onSelectResidue) {
            const known = activeSiteResidues.find((r) => r.position === atom.resi);
            if (known) {
              onSelectResidue(known);
            } else {
              onSelectResidue({ position: atom.resi, residue: `${atom.resn}${atom.resi}` });
            }
          }
        });

        if (isSpinning) {
          viewer.spin('y', 1.0);
        }

        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('3Dmol initialization notice:', err.message);
        setLoadError(err.message);
        setIsLoading(false);
      }
    }

    initViewer();

    return () => {
      isMounted = false;
      if (viewer && typeof viewer.spin === 'function') {
        viewer.spin(false);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      viewerInstanceRef.current = null;
    };
  }, [enzyme.pdbId, enzyme.uniprotId, retryCount]);

  // Update styles when controls change
  useEffect(() => {
    if (viewerInstanceRef.current && !isLoading && !loadError) {
      applyStyles(viewerInstanceRef.current);
    }
  }, [applyStyles, isLoading, loadError]);

  // Spin toggle
  const toggleSpin = () => {
    const nextState = !isSpinning;
    setIsSpinning(nextState);
    if (viewerInstanceRef.current && typeof viewerInstanceRef.current.spin === 'function') {
      viewerInstanceRef.current.spin('y', nextState ? 1.0 : false);
    }
  };

  // Reset Camera
  const resetCamera = () => {
    if (viewerInstanceRef.current && typeof viewerInstanceRef.current.zoomTo === 'function') {
      viewerInstanceRef.current.zoomTo();
      viewerInstanceRef.current.render();
    }
  };

  // Take Snapshot
  const captureSnapshot = () => {
    if (viewerInstanceRef.current && typeof viewerInstanceRef.current.pngURI === 'function') {
      const uri = viewerInstanceRef.current.pngURI();
      const link = document.createElement('a');
      link.download = `${enzyme.pdbId}_structure_${Date.now()}.png`;
      link.href = uri;
      link.click();
    }
  };

  return (
    <div className="relative flex flex-col h-[520px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
      {/* Top HUD Controls Ribbon */}
      <div className="absolute top-0 inset-x-0 z-20 px-4 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-teal-400">PDB: {enzyme.pdbId}</span>
          <span className="text-slate-600">/</span>
          <span className="font-sans text-slate-300 truncate max-w-[200px]">
            {enzyme.name}
          </span>
        </div>

        {/* Style & Rendering Selectors */}
        <div className="flex items-center gap-2">
          {/* Representation Selector */}
          <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700">
            {(['cartoon', 'stick', 'sphere', 'surface'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setRenderMode(mode)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                  renderMode === mode
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Color Scheme */}
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value as any)}
            className="text-[11px] font-mono px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="plddt">pLDDT B-Factor</option>
            <option value="secondary">2° Structure</option>
            <option value="spectrum">Chain Rainbow</option>
          </select>

          {/* Camera Buttons */}
          <button
            onClick={toggleSpin}
            title={isSpinning ? 'Pause Rotation' : 'Auto Rotate'}
            className={`p-1.5 rounded-md border border-slate-700 transition-colors cursor-pointer ${
              isSpinning ? 'bg-teal-950 text-teal-400 border-teal-700' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetCamera}
            title="Reset Camera Center"
            className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={captureSnapshot}
            title="Export High-Res PNG"
            className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3Dmol WebGL Viewport Container */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        {/* Dedicated container purely for 3Dmol WebGL canvas - zero React children inside */}
        <div ref={containerRef} className="w-full h-full" />

        {/* React overlays as SIBLINGS to prevent removeChild reconciliation conflict */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-10 text-slate-300 pointer-events-none">
            <Atom className="w-8 h-8 text-teal-400 animate-spin mb-3" />
            <span className="text-xs font-mono">Fetching Coordinates & Generating WebGL Mesh...</span>
            <span className="text-[11px] text-slate-500 font-mono mt-1">PDB Entry {enzyme.pdbId}</span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900 z-10 text-center">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 max-w-md text-left space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <Info className="w-4 h-4" />
                <span>Structural Model Direct Link</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Coordinates for <span className="font-mono text-teal-400">{enzyme.pdbId}</span> are indexed on RCSB PDB & AlphaFold DB.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <a
                  href={`https://www.rcsb.org/3d-view/${enzyme.pdbId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-medium"
                >
                  Open in RCSB 3Dmol Viewer
                </a>
                <button
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium cursor-pointer"
                >
                  Retry Render
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Legend & Residue Inspector HUD */}
      <div className="absolute bottom-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* AlphaFold pLDDT Legend */}
        <div className="bg-slate-900/90 backdrop-blur-xs border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-3 text-[10px] font-mono text-slate-300 pointer-events-auto">
          <span className="font-bold text-slate-400">pLDDT:</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[#0053D6]" />
            <span>&gt;90</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[#65CBF3]" />
            <span>70-90</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[#FFDB13]" />
            <span>50-70</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-[#FF7D45]" />
            <span>&lt;50</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            <span className="text-rose-400 font-semibold">Active Triad</span>
          </div>
          {mutatedPositions.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-xs bg-cyan-400" />
              <span className="text-cyan-300 font-semibold">Mutant Delta</span>
            </div>
          )}
        </div>

        {/* Clicked / Hovered Residue Tag */}
        {pickedResidue && (
          <div className="bg-slate-900/95 backdrop-blur-xs border border-teal-500/50 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono pointer-events-auto shadow-md">
            <span className="text-teal-400 font-bold">
              {pickedResidue.resn} {pickedResidue.resi}
            </span>
            <span className="text-slate-500">Chain {pickedResidue.chain}</span>
            {pickedResidue.b !== undefined && (
              <span className="text-slate-400">
                · pLDDT <span className="tabular-nums font-semibold">{pickedResidue.b.toFixed(1)}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
