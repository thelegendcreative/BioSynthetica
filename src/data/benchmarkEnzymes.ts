import { BenchmarkEnzyme } from '../types/enzyme';

export const BENCHMARK_ENZYMES: BenchmarkEnzyme[] = [
  {
    id: 'ispetase',
    name: 'IsPETase (PET Hydrolase)',
    commonName: 'Plastic-Degrading Polyesterase',
    organism: 'Ideonella sakaiensis',
    ecNumber: 'EC 3.1.1.101',
    pdbId: '5XG0',
    uniprotId: 'A0A0K8P6T7',
    engineeringGoal: 'Increase thermostability (Tm > 65°C) and catalytic efficiency on high-crystallinity plastic polymers',
    challenge: 'Wild-type enzyme denatures at 48°C, while industrial PET bottle recycling requires processing near or above the glass transition temperature (Tg ~65-70°C).',
    reactionScheme: 'PET polymer + H2O → MHET + BHET + Terephthalic acid + Ethylene glycol',
    sequence:
      'MNFPRASRLMQAAVLGGLMAVSAAATAQTNPYARGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALRQVASLNGTSSSPIYGKVDTARMGVMGWSMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCS',
    activeSiteResidues: [
      { position: 160, residue: 'Ser160', role: 'nucleophile', description: 'Catalytic nucleophile attacking ester carbonyl carbon' },
      { position: 237, residue: 'His237', role: 'general_acid_base', description: 'Catalytic base abstracting proton from Ser160, then general acid' },
      { position: 206, residue: 'Asp206', role: 'general_acid_base', description: 'Electrostatic orientation and stabilization of His237 imidazolium' },
      { position: 87, residue: 'Tyr87', role: 'oxyanion_hole', description: 'Forms oxyanion hole stabilizing tetrahedral intermediate' },
      { position: 161, residue: 'Met161', role: 'oxyanion_hole', description: 'Backbone amide provides second oxyanion hole H-bond' },
      { position: 185, residue: 'Trp185', role: 'substrate_binding', description: 'Hydrophobic aromatic stacking with PET terephthalate benzene ring' },
      { position: 238, residue: 'Ser238', role: 'substrate_binding', description: 'Flexible wobble loop residue lining subsite II' },
    ],
    wildTypeKinetics: {
      kcat: 0.42, // s^-1 on BHET
      km: 0.38, // mM
      kcatKm: 1.11, // mM^-1 s^-1
      tm: 48.2, // °C
      optimumPh: 7.0,
      optimumTemp: 40.0,
    },
    substrate: {
      name: 'BHET (Bis(2-hydroxyethyl) terephthalate)',
      smiles: 'C1=CC(=CC=C1C(=O)OCCO)C(=O)OCCO',
      molecularWeight: 254.24,
      cid: '13556',
      description: 'Intermediate ester substrate produced during hydrolytic depolymerization of post-consumer PET bottles.',
    },
    knownMilestoneMutations: ['S121E', 'D186H', 'R224Q', 'N233K', 'S242T'],
  },
  {
    id: 'tem1_betalactamase',
    name: 'TEM-1 Beta-Lactamase',
    commonName: 'Class A Penicillinase',
    organism: 'Escherichia coli',
    ecNumber: 'EC 3.5.2.6',
    pdbId: '1BTL',
    uniprotId: 'P62593',
    engineeringGoal: 'Engineer active site to overcome steric bulk of third-generation cephalosporins & carbapenem resistance traps',
    challenge: 'Narrow spectrum acyl-enzyme intermediate formation is sterically blocked by bulky aminothiazolyl-oxime side-chains of modern antibiotics.',
    reactionScheme: 'Beta-lactam ring + H2O → Penicilloic acid (inactive hydrolyzed core)',
    sequence:
      'MSIQHFRVALIPFFAAFCLPVFAHPETLVKVKDAEDQLGARVGYIELDLNSGKILESFRPEERFPMMSTFKVLLCGAVLSRVDAGQEQLGRRIHYSQNDLVEYSPVTEKHLTDGMTVRELCSAAITMSDNTAANLLLTTIGGPKELTAFLHNMGDHVTRLDRWEPELNEAIPNDERDTTMPAAMATTLRKLLTGELLTLASRQQLIDWMEADKVAGPLLRSALPAGWFIADKSGAGERGSRGIIAALGPDGKPSRIVVIYTTGSQATMDERNRQIAEIGASLIKHW',
    activeSiteResidues: [
      { position: 70, residue: 'Ser70', role: 'nucleophile', description: 'Covalent nucleophile generating acyl-enzyme intermediate' },
      { position: 73, residue: 'Lys73', role: 'general_acid_base', description: 'Proton transfer relay facilitating Ser70 deprotonation' },
      { position: 130, residue: 'Ser130', role: 'substrate_binding', description: 'Conserved SDN loop residue coordinating carboxylate moiety' },
      { position: 166, residue: 'Glu166', role: 'general_acid_base', description: 'General base activating deacylating hydrolytic water molecule' },
      { position: 234, residue: 'Lys234', role: 'substrate_binding', description: 'Electrostatic anchoring of beta-lactam C3/C4 carboxylate group' },
      { position: 237, residue: 'Ala237', role: 'oxyanion_hole', description: 'Backbone NH stabilizes tetrahedral carbonyl transition state' },
    ],
    wildTypeKinetics: {
      kcat: 2050.0, // s^-1 on Benzylpenicillin
      km: 0.02, // mM
      kcatKm: 102500.0, // mM^-1 s^-1
      tm: 52.8,
      optimumPh: 7.2,
      optimumTemp: 37.0,
    },
    substrate: {
      name: 'Benzylpenicillin (Penicillin G)',
      smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)CC3=CC=CC=C3)C(=O)O)C',
      molecularWeight: 334.39,
      cid: '5904',
      description: 'Prototypical natural beta-lactam antibiotic featuring high tension bicyclic beta-lactam-thiazolidine core.',
    },
    knownMilestoneMutations: ['M182T', 'G238S', 'E104K', 'R164S'],
  },
  {
    id: 'calb_lipase',
    name: 'Candida antarctica Lipase B (CalB)',
    commonName: 'Industrial Transesterification Biocatalyst',
    organism: 'Pseudozyma antarctica',
    ecNumber: 'EC 3.1.1.3',
    pdbId: '1TCA',
    uniprotId: 'P41365',
    engineeringGoal: 'Expand acyl-donor tunnel volume and improve tolerance to high methanol/ethanol concentrations for continuous biodiesel synthesis',
    challenge: 'Hydrophobic active-site vestibule suffers irreversible active-site deactivation in dry short-chain alcohols.',
    reactionScheme: 'Triglyceride + 3 Methanol → Glycerol + 3 Fatty Acid Methyl Esters (FAME / Biodiesel)',
    sequence:
      'LPSGSDPAFSQPKSVLDAGLTCQGASPSSVSKPILLVPGTGTTGPQSFDSNWIPLSTQLGYTPCWISPPPFMLNDTQVNTEYMVNAITALYAGSGNNKLPVLTWSQGGLVAQWGLTFFPSIRSKVDRLMAFAPDYKGTVLAGPLDALAVSAPSVWQQTTGSALTTALRNAGGLTQIVPTTNLYSATDEIVQPQVSNSPLDSSYLFNGKNVQAQAVCGPLFVIDHAGSLTSQFSYVVGRSALRSTTGQARSADYGITDCNPLPANDLTPEQKVAAAALLAPAAAAIVAGPKQNCEPDLMPYARPFAVGKRTCSGIVTP',
    activeSiteResidues: [
      { position: 105, residue: 'Ser105', role: 'nucleophile', description: 'Catalytic triad serine located in sharp nucleophile elbow motif' },
      { position: 224, residue: 'His224', role: 'general_acid_base', description: 'Catalytic base activating Ser105' },
      { position: 187, residue: 'Asp187', role: 'general_acid_base', description: 'Catalytic acid orienting His224' },
      { position: 106, residue: 'Thr106', role: 'oxyanion_hole', description: 'Backbone NH stabilizes tetrahedral acyl-enzyme intermediate' },
      { position: 40, residue: 'Gln40', role: 'oxyanion_hole', description: 'Side chain amine completes the electrophilic oxyanion pocket' },
    ],
    wildTypeKinetics: {
      kcat: 34.0, // s^-1
      km: 1.45, // mM
      kcatKm: 23.45,
      tm: 56.5,
      optimumPh: 7.5,
      optimumTemp: 45.0,
    },
    substrate: {
      name: 'Ethyl Butyrate',
      smiles: 'CCCC(=O)OCC',
      molecularWeight: 116.16,
      cid: '7762',
      description: 'Model short-chain ester substrate for esterase and transesterification kinetic profiling.',
    },
    knownMilestoneMutations: ['W104A', 'A281Y', 'V139E', 'T42A'],
  },
  {
    id: 'rubisco_activase',
    name: 'Rubisco Activase (Rca)',
    commonName: 'Photosynthetic Carbon Fixation Enhancer',
    organism: 'Arabidopsis thaliana',
    ecNumber: 'EC 5.99.1.3',
    pdbId: '3T15',
    uniprotId: 'Q9SJR8',
    engineeringGoal: 'Improve thermal stability (maintain activation at >42°C) to prevent crop photosynthetic shutdown under climate heatwaves',
    challenge: 'Rca is exceptionally heat-labile; mild heat stress triggers subunit dissociation and cooperative aggregation, halting photosynthetic CO2 assimilation.',
    reactionScheme: 'Rubisco·inhibitor complex + ATP + H2O → Active Rubisco + Inhibitor + ADP + Pi',
    sequence:
      'MAAAAAAVSVVGGSGGKRLASSSRLRSVSAATKVQEVVKKTAETSVEEAKKKPEKKEAVETEPVVKETAVPKVVPVPKKETVVAPEPAPAPAPAPAKPKVVEEKKEEEEKKEEEEKKEVEKKEEKKEEDKKEEKKEEKKEEEEKKEEKKEEKKEEEKKEEKKEEEKKEEEKKEEKKEEEKKEEKKEEEKKEEKKEEEKKEEKKEEEKKEEKKEEKKEEEKKEEKK',
    activeSiteResidues: [
      { position: 175, residue: 'Lys175', role: 'nucleophile', description: 'Walker A motif P-loop coordinating ATP beta/gamma phosphates' },
      { position: 220, residue: 'Asp220', role: 'general_acid_base', description: 'Walker B motif coordinating catalytic Mg2+ ion' },
      { position: 295, residue: 'Arg295', role: 'substrate_binding', description: 'Sensor-1 residue triggering mechanochemical conformational remodeling' },
    ],
    wildTypeKinetics: {
      kcat: 0.85,
      km: 0.12,
      kcatKm: 7.08,
      tm: 38.0,
      optimumPh: 8.0,
      optimumTemp: 28.0,
    },
    substrate: {
      name: 'ATP (Adenosine 5\'-triphosphate)',
      smiles: 'C1=NC2=C(C(=N1)N)N=CN2C3C(C(C(O3)COP(=O)(O)OP(=O)(O)OP(=O)(O)O)O)O',
      molecularWeight: 507.18,
      cid: '5957',
      description: 'Biological energy currency driving AAA+ chaperone power strokes to remodel Rubisco active site.',
    },
    knownMilestoneMutations: ['M259I', 'I291V', 'T318S'],
  },
];
