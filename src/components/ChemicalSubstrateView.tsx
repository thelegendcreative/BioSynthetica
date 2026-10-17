import React, { useEffect, useRef } from 'react';
import { ActiveSiteResidue, SubstrateInfo } from '../types/enzyme';
import { ExternalLink, FlaskConical, Sparkles, ShieldCheck } from 'lucide-react';

interface ChemicalSubstrateViewProps {
  substrate: SubstrateInfo;
  activeSiteResidues: ActiveSiteResidue[];
  onSelectResidue: (residue: ActiveSiteResidue) => void;
  selectedResiduePosition?: number | null;
}

export const ChemicalSubstrateView: React.FC<ChemicalSubstrateViewProps> = ({
  substrate,
  activeSiteResidues,
  onSelectResidue,
  selectedResiduePosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render SMILES via smiles-drawer if available
  useEffect(() => {
    let isMounted = true;

    async function drawSmiles() {
      if (!canvasRef.current || !substrate.smiles) return;

      try {
        let SmilesDrawerModule: any = null;
        try {
          SmilesDrawerModule = await import('smiles-drawer');
        } catch (e) {
          console.warn('SmilesDrawer import error:', e);
        }

        const SmilesDrawer = SmilesDrawerModule?.default || SmilesDrawerModule || (window as any).SmilesDrawer;

        if (SmilesDrawer && typeof SmilesDrawer.Drawer === 'function') {
          const drawer = new SmilesDrawer.Drawer({
            width: 240,
            height: 160,
            bondThickness: 1.5,
            bondLength: 16,
            themes: {
              light: {
                C: '#1e293b',
                O: '#ef4444',
                N: '#2563eb',
                S: '#d97706',
                P: '#ea580c',
                Cl: '#16a34a',
                F: '#0d9488',
                Br: '#9333ea',
                BACKGROUND: 'transparent',
              },
            },
          });

          SmilesDrawer.parse(
            substrate.smiles,
            (tree: any) => {
              if (isMounted && canvasRef.current) {
                drawer.draw(tree, canvasRef.current, 'light', false);
              }
            },
            (err: any) => {
              console.warn('SMILES parse warning:', err);
            }
          );
        }
      } catch (err) {
        console.warn('SMILES draw error:', err);
      }
    }

    drawSmiles();

    return () => {
      isMounted = false;
    };
  }, [substrate.smiles]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      {/* Substrate Card Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Target Substrate & Ligand Architecture</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1 font-sans">
            {substrate.name}
          </h2>
        </div>

        {substrate.cid && (
          <a
            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${substrate.cid}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-mono text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md border border-teal-200 transition-colors"
          >
            <span>PubChem CID: {substrate.cid}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* 2D Chemical Rendering & Physicochemical Properties */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/80">
        <div className="md:col-span-5 flex flex-col items-center justify-center min-h-[140px] bg-white rounded-md border border-slate-200/60 p-2">
          <canvas ref={canvasRef} width={240} height={140} className="max-w-full" />
          <span className="text-[10px] font-mono text-slate-400 mt-1">2D Skeletal Structure</span>
        </div>

        <div className="md:col-span-7 space-y-2 text-xs">
          <p className="text-slate-600 leading-relaxed text-xs">
            {substrate.description}
          </p>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-slate-400">Molecular Mass:</span>
              <p className="font-semibold text-slate-800 tabular-nums">
                {substrate.molecularWeight.toFixed(2)} g/mol
              </p>
            </div>
            <div>
              <span className="text-slate-400">Canonical SMILES:</span>
              <p className="font-semibold text-slate-700 truncate" title={substrate.smiles}>
                {substrate.smiles}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Catalytic Active Site Residues Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Catalytic Residues & Active Cleft (Click to Spotlight in 3D)
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {activeSiteResidues.length} Key Positions
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="px-3.5 py-2">Residue</th>
                <th className="px-3.5 py-2">Position</th>
                <th className="px-3.5 py-2">Functional Role</th>
                <th className="px-3.5 py-2">Mechanistic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {activeSiteResidues.map((res) => {
                const isSelected = selectedResiduePosition === res.position;
                return (
                  <tr
                    key={res.position}
                    onClick={() => onSelectResidue(res)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal-50/90 font-medium text-teal-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="px-3.5 py-2.5 font-mono font-bold text-teal-800">
                      {res.residue}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono tabular-nums text-slate-600">
                      #{res.position}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="text-[11px] font-mono capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {res.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600">
                      {res.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
