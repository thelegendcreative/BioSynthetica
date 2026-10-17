import {
  BenchmarkEnzyme,
  EnzymeAnalysisResult,
  EvolutionRunResult,
  MutantVerificationResult,
  WetLabProtocolResult,
} from '../types/enzyme';

export async function analyzeEnzyme(enzyme: BenchmarkEnzyme): Promise<EnzymeAnalysisResult> {
  const response = await fetch('/api/gemini/analyze-enzyme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enzymeName: enzyme.name,
      sequence: enzyme.sequence,
      pdbId: enzyme.pdbId,
      uniprotId: enzyme.uniprotId,
      knownActiveSite: enzyme.activeSiteResidues,
      substrate: enzyme.substrate.name,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analysis failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.data;
}

export async function runDirectedEvolution(
  enzyme: BenchmarkEnzyme,
  designGoal: string,
  rounds: number = 3,
  targetPocketOnly: boolean = false
): Promise<EvolutionRunResult> {
  const response = await fetch('/api/gemini/directed-evolution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enzymeName: enzyme.name,
      sequence: enzyme.sequence,
      wildTypeKinetics: enzyme.wildTypeKinetics,
      designGoal,
      rounds,
      targetPocketOnly,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Simulation failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.data;
}

export async function verifyMutant(
  enzyme: BenchmarkEnzyme,
  mutations: string[],
  candidateMetrics: any
): Promise<MutantVerificationResult> {
  const response = await fetch('/api/gemini/verify-mutant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enzymeName: enzyme.name,
      wildTypeSequence: enzyme.sequence,
      mutations,
      candidateMetrics,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Verification failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.data;
}

export async function generateWetLabProtocol(
  enzyme: BenchmarkEnzyme,
  mutantId: string,
  mutations: string[]
): Promise<WetLabProtocolResult> {
  const response = await fetch('/api/gemini/generate-wetlab-protocol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enzymeName: enzyme.name,
      wildTypeSequence: enzyme.sequence,
      mutantId,
      mutations,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Protocol generation failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.data;
}
