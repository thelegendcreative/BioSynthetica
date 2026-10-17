export interface ActiveSiteResidue {
  position: number;
  residue: string; // e.g. "Ser" or "S160"
  role: 'nucleophile' | 'general_acid_base' | 'oxyanion_hole' | 'substrate_binding' | 'metal_coordination';
  description: string;
}

export interface EnzymeKinetics {
  kcat: number; // s^-1
  km: number; // mM
  kcatKm: number; // mM^-1 s^-1
  tm: number; // °C
  optimumPh: number;
  optimumTemp: number; // °C
}

export interface SubstrateInfo {
  name: string;
  smiles: string;
  molecularWeight: number;
  cid?: string;
  description: string;
}

export interface BenchmarkEnzyme {
  id: string;
  name: string;
  commonName: string;
  organism: string;
  ecNumber: string;
  pdbId: string;
  uniprotId: string;
  engineeringGoal: string;
  challenge: string;
  activeSiteResidues: ActiveSiteResidue[];
  wildTypeKinetics: EnzymeKinetics;
  substrate: SubstrateInfo;
  reactionScheme: string;
  sequence: string;
  knownMilestoneMutations: string[];
}

export interface MutantCandidate {
  id: string;
  mutationNotation: string; // e.g. "S160A/I208F"
  mutations: string[]; // ["S160A", "I208F"]
  ddG_folding_kcal_mol: number; // negative = more stable
  delta_tm_celsius: number; // e.g. +4.2°C
  kcat_fold_change: number; // e.g. 2.1x
  km_fold_change: number; // e.g. 0.85x
  catalytic_efficiency_fold: number; // e.g. 2.47x
  pareto_fitness_score: number; // 0 - 100
  is_pareto_optimal: boolean;
  structural_rationale: string;
  liability_risk: string;
  roundNumber?: number;
}

export interface EvolutionGeneration {
  roundNumber: number;
  strategyTheme: string;
  mutants: MutantCandidate[];
}

export interface EvolutionRunResult {
  campaignSummary: string;
  bestVariantOverall: string;
  generations: EvolutionGeneration[];
  paretoFrontierNotes: string;
}

export interface EnzymeAnalysisResult {
  catalyticMechanism: string;
  catalyticResidues: {
    residue: string;
    role: string;
    spatialImportance: string;
  }[];
  cleftArchitecture: {
    volumeEstAngstrom3: number;
    electrostaticProfile: string;
    solventAccessibility: string;
    stericBottlenecks: string[];
  };
  engineeringHotspots: {
    position: number;
    nativeResidue: string;
    suggestedSubstitutions: string[];
    targetedPhenotype: string;
    rationale: string;
  }[];
  unmutableResidues: string[];
  summaryVerdict: string;
}

export interface MutantVerificationResult {
  verdict: 'VERIFIED_FEASIBLE' | 'HIGH_LIABILITY_RISK' | 'CRITICAL_DISRUPTION';
  confidenceScore: number;
  stericScore: string;
  electrostaticStatus: string;
  aggregationHotspotsFlagged: boolean;
  keyInteractionsRetained: string[];
  vulnerabilitiesDetected: string[];
  recommendations: string;
}

export interface WetLabProtocolResult {
  variantTitle: string;
  primers: {
    name: string;
    sequence5to3: string;
    length: number;
    tmCelsius: number;
    gcPercent: number;
    mutationTarget: string;
  }[];
  pcrCyclingSteps: {
    step: string;
    tempCelsius: number;
    durationSec: number;
    cycles: string;
  }[];
  expressionAndPurification: {
    hostStrain: string;
    vectorBackbone: string;
    growthMedia: string;
    inductionCondition: string;
    lysisBuffer: string;
    chromatographyMethod: string;
    elutionBuffer: string;
  };
  kineticAssaySpecification: {
    assayBuffer: string;
    detectionWavelengthNm: number;
    substrateName: string;
    concentrationRangeMm: string;
    plateFormat: string;
    standardCurveCalculation: string;
  };
  qualityControlChecklist: string[];
}
