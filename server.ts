import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI client initialized with mandatory telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for polite fetching with backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
      continue;
    }
    const errText = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} from ${url}: ${errText.slice(0, 150)}`);
  }
  throw new Error(`Failed to fetch ${url}`);
}

// ==========================================
// Scientific Database Proxy Endpoints
// ==========================================

// UniProt API proxy
app.get('/api/bio/uniprot/:accession', async (req, res) => {
  try {
    const { accession } = req.params;
    const cleanId = accession.trim().toUpperCase();
    const response = await fetchWithRetry(`https://rest.uniprot.org/uniprotkb/${cleanId}.json`, {
      headers: { Accept: 'application/json' },
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('UniProt proxy error:', error);
    res.status(502).json({ error: error.message || 'Failed to fetch UniProt record' });
  }
});

// AlphaFold DB metadata proxy
app.get('/api/bio/alphafold/:accession', async (req, res) => {
  try {
    const { accession } = req.params;
    const cleanId = accession.trim().toUpperCase();
    const response = await fetchWithRetry(`https://alphafold.ebi.ac.uk/api/prediction/${cleanId}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('AlphaFold proxy error:', error);
    res.status(502).json({ error: error.message || 'Failed to fetch AlphaFold metadata' });
  }
});

// RCSB PDB structure proxy
app.get('/api/bio/pdb/:pdbId', async (req, res) => {
  try {
    const { pdbId } = req.params;
    const cleanId = pdbId.trim().toUpperCase();
    const response = await fetchWithRetry(`https://data.rcsb.org/rest/v1/core/entry/${cleanId}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('RCSB PDB proxy error:', error);
    res.status(502).json({ error: error.message || 'Failed to fetch PDB metadata' });
  }
});

// PubChem compound proxy
app.get('/api/bio/pubchem/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const response = await fetchWithRetry(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularWeight,MolecularFormula,CanonicalSMILES,IUPACName/JSON`
    );
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('PubChem proxy error:', error);
    res.status(502).json({ error: error.message || 'Failed to fetch PubChem data' });
  }
});

// ==========================================
// Gemini AI Bioengineering Endpoints
// ==========================================

// 1. Analyze Enzyme Catalytic Mechanism & Active Site
app.post('/api/gemini/analyze-enzyme', async (req, res) => {
  try {
    const { enzymeName, sequence, pdbId, uniprotId, knownActiveSite, substrate } = req.body;

    const prompt = `You are a world-class computational structural biologist and enzymologist specializing in enzyme mechanisms and directed evolution.
Analyze the following target enzyme:
- Name: ${enzymeName}
- Sequence (length ${sequence?.length || 'N/A'}): ${sequence ? sequence.slice(0, 500) : 'Not provided'}
- PDB ID: ${pdbId || 'N/A'}
- UniProt ID: ${uniprotId || 'N/A'}
- Known Active Site Residues: ${JSON.stringify(knownActiveSite || [])}
- Primary Substrate: ${substrate || 'Standard natural substrate'}

Provide a rigorous mechanistic analysis and active site architectural breakdown in the specified JSON schema.
Explain:
1. Catalytic machinery (catalytic triad, oxyanion hole, general acid/base, cofactor binding).
2. Substrate binding pocket geometry (hydrophobic vs electrostatic clefts, volume, steric bottlenecks).
3. Primary engineering opportunities (thermostability, catalytic turnover kcat, Km affinity, solvent resistance).
4. Critical conservation constraints (residues that MUST NOT be mutated to preserve activity).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert computational enzymologist. Always return strictly valid JSON matching the requested schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            catalyticMechanism: { type: Type.STRING, description: 'Step-by-step chemical reaction mechanism' },
            catalyticResidues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  residue: { type: Type.STRING, description: 'Single letter + position e.g. S160' },
                  role: { type: Type.STRING, description: 'e.g. Nucleophile, General base, Oxyanion hole' },
                  spatialImportance: { type: Type.STRING },
                },
                required: ['residue', 'role', 'spatialImportance'],
              },
            },
            cleftArchitecture: {
              type: Type.OBJECT,
              properties: {
                volumeEstAngstrom3: { type: Type.NUMBER },
                electrostaticProfile: { type: Type.STRING },
                solventAccessibility: { type: Type.STRING },
                stericBottlenecks: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['volumeEstAngstrom3', 'electrostaticProfile', 'solventAccessibility', 'stericBottlenecks'],
            },
            engineeringHotspots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  position: { type: Type.INTEGER },
                  nativeResidue: { type: Type.STRING },
                  suggestedSubstitutions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  targetedPhenotype: { type: Type.STRING, description: 'e.g. Thermostability, Substrate broadening' },
                  rationale: { type: Type.STRING },
                },
                required: ['position', 'nativeResidue', 'suggestedSubstitutions', 'targetedPhenotype', 'rationale'],
              },
            },
            unmutableResidues: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: 'Residues that will destroy activity if mutated' },
            },
            summaryVerdict: { type: Type.STRING },
          },
          required: [
            'catalyticMechanism',
            'catalyticResidues',
            'cleftArchitecture',
            'engineeringHotspots',
            'unmutableResidues',
            'summaryVerdict',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in analyze-enzyme:', error);
    res.status(500).json({ error: error.message || 'Enzyme analysis failed' });
  }
});

// 2. Multi-Round In-Silico Directed Evolution Simulation
app.post('/api/gemini/directed-evolution', async (req, res) => {
  try {
    const { enzymeName, sequence, wildTypeKinetics, designGoal, rounds, targetPocketOnly } = req.body;

    const prompt = `You are an autonomous AI protein engineer executing an in-silico directed evolution campaign for ${enzymeName}.
Target Goal: "${designGoal || 'Improve catalytic efficiency (kcat/Km) and increase thermostability (Tm) while avoiding aggregation'}".
Wild-Type Baseline:
- Tm: ${wildTypeKinetics?.tm || 48}°C
- kcat/Km: ${wildTypeKinetics?.kcatKm || 1.2} mM^-1 s^-1
- kcat: ${wildTypeKinetics?.kcat || 0.4} s^-1
- Km: ${wildTypeKinetics?.km || 0.33} mM
- Target Pocket Restriction: ${targetPocketOnly ? 'Active site and second-shell residues only' : 'Global structure allowing surface stabilizing mutations'}
- Campaign Rounds: ${rounds || 3}

Simulate ${rounds || 3} successive generations of directed evolution.
For each generation:
- Provide 3-4 diverse mutation candidates (single or combinatorial mutants e.g. "S160A", "I208F/N246D", "W159H/S238F").
- Compute realistic biophysical metrics:
  - ddG_folding (kcal/mol, negative = stabilized, positive = destabilized, typical range -4.5 to +3.0)
  - delta_tm (in °C, e.g. +3.5°C, +8.2°C)
  - kcat_fold_change (multiplier relative to WT, e.g. 1.8x, 5.4x, 0.4x)
  - km_fold_change (multiplier relative to WT, e.g. 0.8x for tighter binding, 1.5x)
  - pareto_fitness_score (0.0 to 100.0)
  - is_pareto_optimal (boolean)
  - structural_rationale (clear atomic explanation: new salt bridge, hydrophobic packing, rigidifying flexible loop, easing steric hindrance for transition state)
  - liability_risk (e.g. "Low", "Moderate: potential steric clash with Tyr87", "High: disrupts catalytic hydrogen bond network")`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an advanced computational protein design simulator modeled on Rosetta, FoldX, and evolutionary language models. Return accurate, thermodynamically plausible numbers.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            campaignSummary: { type: Type.STRING },
            bestVariantOverall: { type: Type.STRING },
            generations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  roundNumber: { type: Type.INTEGER },
                  strategyTheme: { type: Type.STRING, description: 'e.g. Cavity filling, Salt bridge introduction, Substrate cleft expansion' },
                  mutants: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        mutations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'e.g. ["S160A", "I208F"]' },
                        mutationNotation: { type: Type.STRING, description: 'e.g. S160A/I208F' },
                        ddG_folding_kcal_mol: { type: Type.NUMBER },
                        delta_tm_celsius: { type: Type.NUMBER },
                        kcat_fold_change: { type: Type.NUMBER },
                        km_fold_change: { type: Type.NUMBER },
                        catalytic_efficiency_fold: { type: Type.NUMBER },
                        pareto_fitness_score: { type: Type.NUMBER },
                        is_pareto_optimal: { type: Type.BOOLEAN },
                        structural_rationale: { type: Type.STRING },
                        liability_risk: { type: Type.STRING },
                        secondary_structure_context: { type: Type.STRING },
                      },
                      required: [
                        'id',
                        'mutations',
                        'mutationNotation',
                        'ddG_folding_kcal_mol',
                        'delta_tm_celsius',
                        'kcat_fold_change',
                        'km_fold_change',
                        'catalytic_efficiency_fold',
                        'pareto_fitness_score',
                        'is_pareto_optimal',
                        'structural_rationale',
                        'liability_risk',
                      ],
                    },
                  },
                },
                required: ['roundNumber', 'strategyTheme', 'mutants'],
              },
            },
            paretoFrontierNotes: { type: Type.STRING },
          },
          required: ['campaignSummary', 'bestVariantOverall', 'generations', 'paretoFrontierNotes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in directed-evolution:', error);
    res.status(500).json({ error: error.message || 'Directed evolution simulation failed' });
  }
});

// 3. Counter-Screen & Biophysical Verification of a Specific Mutant
app.post('/api/gemini/verify-mutant', async (req, res) => {
  try {
    const { enzymeName, wildTypeSequence, mutations, candidateMetrics } = req.body;

    const prompt = `Conduct a rigorous biophysical counter-screen and structural validation for:
Enzyme: ${enzymeName}
Proposed Mutations: ${JSON.stringify(mutations)}
Predicted Candidate Metrics: ${JSON.stringify(candidateMetrics || {})}

Evaluate:
1. Steric clash analysis (Van der Waals overlaps with neighboring residues).
2. Electrostatic and H-bond disruption (especially around the catalytic triad or oxyanion hole).
3. Hydrophobic core packing and cavity formation.
4. Aggregation propensity (exposure of hydrophobic patches on protein surface).
5. Pass/Fail verdict with recommended experimental safeguards.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a senior molecular modeling reviewer conducting rigorous biophysical validation.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING, description: 'VERIFIED_FEASIBLE, HIGH_LIABILITY_RISK, or CRITICAL_DISRUPTION' },
            confidenceScore: { type: Type.NUMBER, description: '0 to 100 confidence' },
            stericScore: { type: Type.STRING },
            electrostaticStatus: { type: Type.STRING },
            aggregationHotspotsFlagged: { type: Type.BOOLEAN },
            keyInteractionsRetained: { type: Type.ARRAY, items: { type: Type.STRING } },
            vulnerabilitiesDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.STRING },
          },
          required: [
            'verdict',
            'confidenceScore',
            'stericScore',
            'electrostaticStatus',
            'aggregationHotspotsFlagged',
            'keyInteractionsRetained',
            'vulnerabilitiesDetected',
            'recommendations',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in verify-mutant:', error);
    res.status(500).json({ error: error.message || 'Mutant verification failed' });
  }
});

// 4. Generate Wet-Lab Experimental Validation Protocol
app.post('/api/gemini/generate-wetlab-protocol', async (req, res) => {
  try {
    const { enzymeName, wildTypeSequence, mutantId, mutations } = req.body;

    const prompt = `Generate a comprehensive, publication-grade wet-lab experimental validation protocol to synthesize, express, purify, and assay the engineered variant "${mutantId}" (${Array.isArray(mutations) ? mutations.join(', ') : mutations}) of ${enzymeName}.
Include:
1. PCR mutagenic primer designs (Forward and Reverse primers with exact 5'->3' sequences, length, calculated Tm in °C, and GC%).
2. Site-Directed Mutagenesis PCR thermocycling conditions and DpnI digestion.
3. Expression vector, host strain (e.g. E. coli BL21(DE3)), induction temperature and IPTG concentration.
4. Cell lysis & His-tag IMAC nickel affinity chromatography purification protocol.
5. In vitro spectrophotometric enzyme kinetic assay buffer (pH, ionic strength, cofactor if any), substrate titration concentration series, detection wavelength (e.g. 405nm), and Michaelis-Menten nonlinear regression fitting steps.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert synthetic biologist and wet-lab biochemist. Return a realistic, step-by-step experimental protocol.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variantTitle: { type: Type.STRING },
            primers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  sequence5to3: { type: Type.STRING },
                  length: { type: Type.INTEGER },
                  tmCelsius: { type: Type.NUMBER },
                  gcPercent: { type: Type.NUMBER },
                  mutationTarget: { type: Type.STRING },
                },
                required: ['name', 'sequence5to3', 'length', 'tmCelsius', 'gcPercent', 'mutationTarget'],
              },
            },
            pcrCyclingSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  tempCelsius: { type: Type.NUMBER },
                  durationSec: { type: Type.INTEGER },
                  cycles: { type: Type.STRING },
                },
                required: ['step', 'tempCelsius', 'durationSec', 'cycles'],
              },
            },
            expressionAndPurification: {
              type: Type.OBJECT,
              properties: {
                hostStrain: { type: Type.STRING },
                vectorBackbone: { type: Type.STRING },
                growthMedia: { type: Type.STRING },
                inductionCondition: { type: Type.STRING },
                lysisBuffer: { type: Type.STRING },
                chromatographyMethod: { type: Type.STRING },
                elutionBuffer: { type: Type.STRING },
              },
              required: [
                'hostStrain',
                'vectorBackbone',
                'growthMedia',
                'inductionCondition',
                'lysisBuffer',
                'chromatographyMethod',
                'elutionBuffer',
              ],
            },
            kineticAssaySpecification: {
              type: Type.OBJECT,
              properties: {
                assayBuffer: { type: Type.STRING },
                detectionWavelengthNm: { type: Type.INTEGER },
                substrateName: { type: Type.STRING },
                concentrationRangeMm: { type: Type.STRING },
                plateFormat: { type: Type.STRING },
                standardCurveCalculation: { type: Type.STRING },
              },
              required: [
                'assayBuffer',
                'detectionWavelengthNm',
                'substrateName',
                'concentrationRangeMm',
                'plateFormat',
                'standardCurveCalculation',
              ],
            },
            qualityControlChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'variantTitle',
            'primers',
            'pcrCyclingSteps',
            'expressionAndPurification',
            'kineticAssaySpecification',
            'qualityControlChecklist',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in generate-wetlab-protocol:', error);
    res.status(500).json({ error: error.message || 'Wet-lab protocol generation failed' });
  }
});

// ==========================================
// Vite Middleware / Static Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BioSynthetica server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
