import type { CalcTemplate } from '@/engine/template';

/**
 * UKChO Round 2, first batch: unit cells, magnetic moments and crystal field energies,
 * Latimer diagrams, complexometric (EDTA) titrations and pre-equilibrium kinetics.
 */
export const ukcho2Batch1Templates: CalcTemplate[] = [
  {
    id: 'calc-r2-rock-salt-density',
    topic: 'other',
    title: 'Density of a rock-salt crystal',
    difficulty: 1,
    params: {
      a: { unit: 'pm', min: 540, max: 570, decimals: 1 },
      M: { unit: 'g/mol', choices: [58.44], decimals: 2 },
      Z: { unit: '1', choices: [4], decimals: 0 },
    },
    given: [
      { key: 'a', label: 'a', from: 'p.a' },
      { key: 'M', label: 'M(NaCl)', from: 'p.M' },
      { key: 'Z', label: 'Z', from: 'p.Z' },
    ],
    reference: [{ id: 'rho', label: 'ρ', formula: 'unit-cell-density', solveFor: 'rho', inputs: { Z: 'g.Z', M: 'g.M', a: 'g.a' } }],
    answer: { node: 'rho', label: 'ρ', unit: 'g/cm3' },
    misconceptions: [
      {
        reference: [{ id: 'rho', formula: 'unit-cell-density', solveFor: 'rho', inputs: { Z: '#1', M: 'g.M', a: 'g.a' } }],
        answer: 'rho',
        message: 'The rock-salt unit cell holds four NaCl units: 8 corners × ⅛ + 6 faces × ½ = 4 of each ion.',
      },
    ],
    wordings: [
      'Sodium chloride has the rock-salt structure with a cubic unit cell of edge {a}; each cell contains {Z} formula units. Calculate the density of NaCl (M = {M}).',
      'The cubic unit cell of NaCl has a = {a} and contains Z = {Z} formula units. Find the density in g cm⁻³ (M = {M}).',
    ],
    approachText: 'Cubic cell edge, formula units per cell and molar mass known; find the density.',
    explanation:
      'Mass of one cell = ZM/N_A; its volume is a³. Convert a to cm (1 pm = 10⁻¹⁰ cm) before cubing. ρ = ZM/(N_A a³).',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-fcc-radius',
    topic: 'other',
    title: 'Atomic radius of a face-centred cubic metal',
    difficulty: 2,
    params: {
      rho: { unit: 'g/cm3', min: 8.85, max: 9.0, decimals: 3 },
      M: { unit: 'g/mol', choices: [63.55], decimals: 2 },
      Z: { unit: '1', choices: [4], decimals: 0 },
    },
    given: [
      { key: 'rho', label: 'ρ(Cu)', from: 'p.rho' },
      { key: 'M', label: 'M(Cu)', from: 'p.M' },
      { key: 'Z', label: 'Z (fcc)', from: 'p.Z' },
    ],
    reference: [
      { id: 'a', label: 'Cell edge a', formula: 'unit-cell-density', solveFor: 'a', inputs: { rho: 'g.rho', Z: 'g.Z', M: 'g.M' } },
      { id: 'r', label: 'r = a√2 / 4 (atoms touch along a face diagonal)', op: 'scale', inputs: ['n.a'], coef: Math.SQRT2 / 4 },
    ],
    answer: { node: 'r', label: 'r(Cu)', unit: 'pm' },
    misconceptions: [
      {
        reference: [
          { id: 'a', formula: 'unit-cell-density', solveFor: 'a', inputs: { rho: 'g.rho', Z: 'g.Z', M: 'g.M' } },
          { id: 'r', op: 'scale', inputs: ['n.a'], coef: Math.sqrt(3) / 4 },
        ],
        answer: 'r',
        message: 'That uses the body diagonal (body-centred cubic). In face-centred cubic the atoms touch along a face diagonal: 4r = a√2.',
      },
      {
        reference: [
          { id: 'a', formula: 'unit-cell-density', solveFor: 'a', inputs: { rho: 'g.rho', Z: 'g.Z', M: 'g.M' } },
          { id: 'r', op: 'scale', inputs: ['n.a'], coef: 0.5 },
        ],
        answer: 'r',
        message: 'Atoms only touch along the edge in simple cubic packing. In fcc they touch along the face diagonal.',
      },
    ],
    wordings: [
      'Copper crystallises in a face-centred cubic lattice ({Z} atoms per cell) and has density {rho}. Calculate the atomic radius of copper (M = {M}).',
      'Find the metallic radius of Cu from its density, {rho}, given that it is face-centred cubic (Z = {Z}) with M = {M}.',
    ],
    approachText: 'Density of an fcc metal known; find the cell edge, then the atomic radius.',
    explanation:
      'Rearrange ρ = ZM/(N_A a³) for a. In fcc, atoms touch along the face diagonal, which is four radii long: 4r = a√2, so r = a√2/4.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-bcc-radius',
    topic: 'other',
    title: 'Atomic radius of a body-centred cubic metal',
    difficulty: 2,
    params: {
      rho: { unit: 'g/cm3', min: 7.8, max: 7.95, decimals: 3 },
      M: { unit: 'g/mol', choices: [55.85], decimals: 2 },
      Z: { unit: '1', choices: [2], decimals: 0 },
    },
    given: [
      { key: 'rho', label: 'ρ(Fe)', from: 'p.rho' },
      { key: 'M', label: 'M(Fe)', from: 'p.M' },
      { key: 'Z', label: 'Z (bcc)', from: 'p.Z' },
    ],
    reference: [
      { id: 'a', label: 'Cell edge a', formula: 'unit-cell-density', solveFor: 'a', inputs: { rho: 'g.rho', Z: 'g.Z', M: 'g.M' } },
      { id: 'r', label: 'r = a√3 / 4 (atoms touch along the body diagonal)', op: 'scale', inputs: ['n.a'], coef: Math.sqrt(3) / 4 },
    ],
    answer: { node: 'r', label: 'r(Fe)', unit: 'pm' },
    misconceptions: [
      {
        reference: [
          { id: 'a', formula: 'unit-cell-density', solveFor: 'a', inputs: { rho: 'g.rho', Z: 'g.Z', M: 'g.M' } },
          { id: 'r', op: 'scale', inputs: ['n.a'], coef: Math.SQRT2 / 4 },
        ],
        answer: 'r',
        message: 'That uses the face diagonal (fcc). In body-centred cubic the atoms touch along the body diagonal: 4r = a√3.',
      },
      {
        reference: [
          { id: 'a', formula: 'unit-cell-density', solveFor: 'a', inputs: { rho: 'g.rho', Z: '#1', M: 'g.M' } },
          { id: 'r', op: 'scale', inputs: ['n.a'], coef: Math.sqrt(3) / 4 },
        ],
        answer: 'r',
        message: 'A body-centred cubic cell contains two atoms: 8 corners × ⅛ + 1 in the centre.',
      },
    ],
    wordings: [
      'α-Iron is body-centred cubic ({Z} atoms per cell) with density {rho}. Calculate the atomic radius of iron (M = {M}).',
      'Given that iron is bcc (Z = {Z}) with ρ = {rho} and M = {M}, find its metallic radius.',
    ],
    approachText: 'Density of a bcc metal known; find the cell edge, then the atomic radius.',
    explanation: 'Rearrange ρ = ZM/(N_A a³) for a, with Z = 2. In bcc the atoms touch along the body diagonal: 4r = a√3.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-unpaired-electrons',
    topic: 'other',
    title: 'Unpaired electrons from a magnetic moment',
    difficulty: 1,
    params: {
      n: { unit: '1', choices: [1, 2, 3, 4, 5] },
      dev: { unit: '1', min: -0.08, max: 0.12 },
    },
    setup: [
      { id: 'mu0', formula: 'spin-only', solveFor: 'mu', inputs: { n: 'p.n' } },
      { id: 'mu', op: 'sum', inputs: ['n.mu0', 'p.dev'], coefs: [1, 1] },
    ],
    given: [{ key: 'mu', label: 'μ_eff', from: 'n.mu', unit: '1', decimals: 2 }],
    reference: [{ id: 'n', label: 'Unpaired electrons', formula: 'spin-only', solveFor: 'n', inputs: { mu: 'g.mu' } }],
    answer: { node: 'n', label: 'n (unpaired)', unit: '1' },
    // Measured moments only approximate the spin-only value; the whole number nearest the result counts.
    tolerance: { abs: 0.3 },
    wordings: [
      'A transition-metal complex has an effective magnetic moment of {mu} Bohr magnetons. Assuming a spin-only moment, how many unpaired electrons does it have?',
      'The measured magnetic moment of a complex is {mu} μB. Estimate its number of unpaired electrons using the spin-only formula.',
    ],
    approachText: 'Measured magnetic moment; find the number of unpaired electrons.',
    explanation:
      'μ = √(n(n+2)) gives n = √(1 + μ²) − 1; round to the nearest whole number. Spin-only values are 1.73, 2.83, 3.87, 4.90 and 5.92 μB for 1–5 unpaired electrons; real complexes differ slightly because of orbital contributions.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-cfse-titanium',
    topic: 'other',
    title: 'Crystal field splitting from a d–d absorption',
    difficulty: 2,
    params: {
      lambda: { unit: 'nm', min: 480, max: 520, decimals: 1 },
    },
    given: [{ key: 'lambda', label: 'λmax', from: 'p.lambda' }],
    reference: [
      { id: 'D', label: 'Δo per mole', formula: 'photon-molar', solveFor: 'Em', inputs: { lambda: 'g.lambda' } },
      { id: 'cfse', label: 'CFSE = −0.4 Δo (one t₂g electron)', op: 'scale', inputs: ['n.D'], coef: -0.4 },
    ],
    answer: { node: 'cfse', label: 'CFSE', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [{ id: 'D', formula: 'photon-molar', solveFor: 'Em', inputs: { lambda: 'g.lambda' } }],
        answer: 'D',
        message: 'That is Δo itself. One electron in a t₂g orbital is 0.4Δo below the barycentre: CFSE = −0.4Δo.',
      },
      {
        reference: [
          { id: 'D', formula: 'photon-molar', solveFor: 'Em', inputs: { lambda: 'g.lambda' } },
          { id: 'cfse', op: 'scale', inputs: ['n.D'], coef: -0.6 },
        ],
        answer: 'cfse',
        message: 'In an octahedral field the t₂g set is lowered by 0.4Δo and the e_g set raised by 0.6Δo. The single electron is in t₂g.',
      },
    ],
    wordings: [
      '[Ti(H₂O)₆]³⁺ (a d¹ ion) absorbs most strongly at {lambda}, due to its single d–d transition. Calculate the crystal field stabilisation energy in kJ mol⁻¹.',
      'The violet colour of [Ti(H₂O)₆]³⁺ comes from one absorption band with λmax = {lambda}. Find Δo in kJ mol⁻¹ and hence the CFSE of this d¹ complex.',
    ],
    approachText: 'd¹ octahedral complex with one absorption band; find Δo, then the CFSE.',
    explanation:
      'For d¹ the absorption is the t₂g → e_g transition, so Δo = N_A hc/λ. The electron sits in t₂g, 0.4Δo below the average d-orbital energy: CFSE = −0.4Δo.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-latimer-combine',
    topic: 'electro',
    title: 'Latimer diagram: skipping an oxidation state',
    difficulty: 2,
    params: {
      E1: { unit: 'V', min: 0.54, max: 0.58, decimals: 3 },
      E2: { unit: 'V', min: 2.24, max: 2.3, decimals: 3 },
    },
    given: [
      { key: 'E1', label: 'E°(MnO₄⁻/MnO₄²⁻), 1e⁻', from: 'p.E1' },
      { key: 'E2', label: 'E°(MnO₄²⁻/MnO₂), 2e⁻', from: 'p.E2' },
    ],
    reference: [
      { id: 'g1', label: 'ΔG°₁ = −1·F·E°₁', formula: 'gibbs-emf', solveFor: 'dG0', inputs: { n: '#1', E0: 'g.E1' } },
      { id: 'g2', label: 'ΔG°₂ = −2·F·E°₂', formula: 'gibbs-emf', solveFor: 'dG0', inputs: { n: '#2', E0: 'g.E2' } },
      { id: 'g', label: 'ΔG° overall', op: 'add', inputs: ['n.g1', 'n.g2'] },
      { id: 'E', label: 'E° overall (3e⁻)', formula: 'gibbs-emf', solveFor: 'E0', inputs: { dG0: 'n.g', n: '#3' } },
    ],
    answer: { node: 'E', label: 'E°(MnO₄⁻/MnO₂)', unit: 'V' },
    tolerance: { abs: 0.005 },
    misconceptions: [
      {
        reference: [
          { id: 's', op: 'add', inputs: ['g.E1', 'g.E2'] },
          { id: 'E', op: 'scale', inputs: ['n.s'], coef: 0.5 },
        ],
        answer: 'E',
        message: 'Potentials are not averaged equally: weight each by its electrons, E = (1·E°₁ + 2·E°₂)/3.',
      },
      {
        reference: [{ id: 'E', op: 'add', inputs: ['g.E1', 'g.E2'] }],
        answer: 'E',
        message: 'Potentials do not add; Gibbs energies do. Convert with ΔG° = −nFE°, add, then convert back with n = 3.',
      },
    ],
    wordings: [
      'Part of the Latimer diagram for manganese in basic solution reads MnO₄⁻ —({E1})→ MnO₄²⁻ —({E2})→ MnO₂, with one and two electrons transferred in the two steps. Calculate E° for MnO₄⁻ → MnO₂.',
      'Given E°(MnO₄⁻/MnO₄²⁻) = {E1} (1e⁻) and E°(MnO₄²⁻/MnO₂) = {E2} (2e⁻), find the standard potential of the three-electron couple MnO₄⁻/MnO₂.',
    ],
    approachText: 'Two consecutive steps of a Latimer diagram with their electron counts; find the potential that skips the middle state.',
    explanation:
      'Convert each step to ΔG° = −nFE°, add the Gibbs energies, and convert back using the total number of electrons: E° = (n₁E°₁ + n₂E°₂)/(n₁ + n₂). Because the right-hand potential is higher, MnO₄²⁻ is unstable to disproportionation here.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-copper-disproportionation',
    topic: 'electro',
    title: 'Disproportionation constant from a Latimer diagram',
    difficulty: 2,
    params: {
      E21: { unit: 'V', min: 0.15, max: 0.16, decimals: 3 },
      E10: { unit: 'V', min: 0.51, max: 0.53, decimals: 3 },
      T: { unit: 'K', choices: [298], decimals: 0 },
    },
    given: [
      { key: 'E21', label: 'E°(Cu²⁺/Cu⁺)', from: 'p.E21' },
      { key: 'E10', label: 'E°(Cu⁺/Cu)', from: 'p.E10' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    reference: [
      { id: 'E', label: 'E°cell = E°(Cu⁺/Cu) − E°(Cu²⁺/Cu⁺)', formula: 'ecell', solveFor: 'Ecell', inputs: { Ecat: 'g.E10', Ean: 'g.E21' } },
      { id: 'g', label: 'ΔG°', formula: 'gibbs-emf', solveFor: 'dG0', inputs: { n: '#1', E0: 'n.E' } },
      { id: 'K', label: 'K', formula: 'gibbs-k', solveFor: 'K', inputs: { dG0: 'n.g', T: 'g.T' } },
    ],
    answer: { node: 'K', label: 'K', unit: '1' },
    misconceptions: [
      {
        reference: [
          { id: 'E', formula: 'ecell', solveFor: 'Ecell', inputs: { Ecat: 'g.E21', Ean: 'g.E10' } },
          { id: 'g', formula: 'gibbs-emf', solveFor: 'dG0', inputs: { n: '#1', E0: 'n.E' } },
          { id: 'K', formula: 'gibbs-k', solveFor: 'K', inputs: { dG0: 'n.g', T: 'g.T' } },
        ],
        answer: 'K',
        message: 'In 2Cu⁺ → Cu²⁺ + Cu, Cu⁺ is reduced to Cu (cathode) and oxidised to Cu²⁺ (anode): E°cell = E°(Cu⁺/Cu) − E°(Cu²⁺/Cu⁺).',
      },
    ],
    wordings: [
      'The Latimer diagram for copper in acid is Cu²⁺ —({E21})→ Cu⁺ —({E10})→ Cu. Calculate the equilibrium constant at {T} for 2Cu⁺(aq) ⇌ Cu²⁺(aq) + Cu(s).',
      'Using E°(Cu²⁺/Cu⁺) = {E21} and E°(Cu⁺/Cu) = {E10}, find K at {T} for the disproportionation of aqueous copper(I).',
    ],
    approachText: 'Two potentials either side of a middle oxidation state; find K for its disproportionation.',
    explanation:
      'Cu⁺ is both reduced (to Cu) and oxidised (to Cu²⁺). E°cell = E°(Cu⁺/Cu) − E°(Cu²⁺/Cu⁺); one electron is transferred. K = exp(nFE°/RT) is about 10⁶, which is why Cu⁺ does not survive in water unless stabilised by complexation or precipitation.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-edta-hardness',
    topic: 'stoich',
    title: 'Water hardness by EDTA titration',
    difficulty: 2,
    params: {
      Vw: { unit: 'cm3', choices: [50, 100], decimals: 1 },
      hard: { unit: 'g/dm3', min: 0.05, max: 0.35 },
      c: { unit: 'mol/dm3', choices: [0.01], decimals: 4 },
      M: { unit: 'g/mol', choices: [100.09], decimals: 2 },
    },
    setup: [
      { id: 'cCa', formula: 'mass-concentration', solveFor: 'c', inputs: { rho: 'p.hard', M: 'p.M' } },
      { id: 'n', formula: 'concentration', solveFor: 'n', inputs: { c: 'n.cCa', V: 'p.Vw' } },
      { id: 'V', formula: 'concentration', solveFor: 'V', inputs: { n: 'n.n', c: 'p.c' } },
    ],
    given: [
      { key: 'Vw', label: 'V(water)', from: 'p.Vw' },
      { key: 'c', label: 'c(EDTA)', from: 'p.c' },
      { key: 'V', label: 'titre', from: 'n.V', unit: 'cm3', decimals: 2 },
      { key: 'M', label: 'M(CaCO₃)', from: 'p.M' },
    ],
    constraint: (v) => v.V! > 5e-6 && v.V! < 45e-6,
    reference: [
      { id: 'n', label: 'n(EDTA) = n(Ca²⁺ + Mg²⁺)', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.c', V: 'g.V' } },
      { id: 'cM', label: 'c(M²⁺)', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.n', V: 'g.Vw' } },
      { id: 'rho', label: 'Hardness as CaCO₃', formula: 'mass-concentration', solveFor: 'rho', inputs: { c: 'n.cM', M: 'g.M' } },
    ],
    answer: { node: 'rho', label: 'Hardness (as CaCO₃)', unit: 'g/dm3' },
    wordings: [
      'A {Vw} sample of tap water, buffered at pH 10 with Eriochrome Black T indicator, needed {V} of {c} EDTA to titrate its Ca²⁺ and Mg²⁺. Express the total hardness as grams of CaCO₃ per dm³ (M = {M}).',
      'Titrating {Vw} of hard water with {c} Na₂H₂EDTA took {V}. EDTA binds each M²⁺ ion 1 : 1. What is the hardness in g dm⁻³ expressed as CaCO₃ (M = {M})?',
    ],
    approachText: 'Direct EDTA titration of the Ca²⁺ and Mg²⁺ in a water sample; express as CaCO₃.',
    explanation:
      'EDTA forms 1 : 1 complexes with every M²⁺, whatever its charge-balancing ions. n(M²⁺) = n(EDTA) = cV; divide by the sample volume, then express the concentration as if it were all CaCO₃ by multiplying by 100.09 g mol⁻¹. (×1000 gives mg dm⁻³, often quoted as ppm.)',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-edta-back-titration',
    topic: 'stoich',
    title: 'Nickel by EDTA back titration',
    difficulty: 3,
    params: {
      VNi: { unit: 'cm3', choices: [25], decimals: 2 },
      cNi: { unit: 'mol/dm3', min: 0.01, max: 0.03 },
      VE: { unit: 'cm3', choices: [50], decimals: 2 },
      cE: { unit: 'mol/dm3', choices: [0.02], decimals: 4 },
      cZn: { unit: 'mol/dm3', choices: [0.02], decimals: 4 },
    },
    setup: [
      { id: 'nNi', formula: 'concentration', solveFor: 'n', inputs: { c: 'p.cNi', V: 'p.VNi' } },
      { id: 'nE', formula: 'concentration', solveFor: 'n', inputs: { c: 'p.cE', V: 'p.VE' } },
      { id: 'nX', op: 'sub', inputs: ['n.nE', 'n.nNi'] },
      { id: 'VZn', formula: 'concentration', solveFor: 'V', inputs: { n: 'n.nX', c: 'p.cZn' } },
    ],
    given: [
      { key: 'VNi', label: 'V(Ni²⁺ solution)', from: 'p.VNi' },
      { key: 'VE', label: 'V(EDTA added)', from: 'p.VE' },
      { key: 'cE', label: 'c(EDTA)', from: 'p.cE' },
      { key: 'cZn', label: 'c(Zn²⁺)', from: 'p.cZn' },
      { key: 'VZn', label: 'titre of Zn²⁺', from: 'n.VZn', unit: 'cm3', decimals: 2 },
    ],
    constraint: (v) => v.VZn! > 5e-6 && v.VZn! < 45e-6,
    reference: [
      { id: 'nE', label: 'n(EDTA) added', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cE', V: 'g.VE' } },
      { id: 'nX', label: 'n(EDTA) left = n(Zn²⁺)', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cZn', V: 'g.VZn' } },
      { id: 'nNi', label: 'n(Ni²⁺) = n(EDTA) bound', op: 'sub', inputs: ['n.nE', 'n.nX'] },
      { id: 'c', label: 'c(Ni²⁺)', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nNi', V: 'g.VNi' } },
    ],
    answer: { node: 'c', label: 'c(Ni²⁺)', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [
          { id: 'nX', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cZn', V: 'g.VZn' } },
          { id: 'c', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nX', V: 'g.VNi' } },
        ],
        answer: 'c',
        message: 'The zinc titre measures the EDTA left over, not the nickel. Ni²⁺ = EDTA added − EDTA left over.',
      },
    ],
    wordings: [
      '{VE} of {cE} EDTA (an excess) was added to {VNi} of a nickel(II) solution. The unreacted EDTA was then titrated with {cZn} Zn²⁺ solution, needing {VZn}. Calculate the concentration of Ni²⁺.',
      'Ni²⁺ reacts too slowly with EDTA for a direct titration, so {VNi} of the nickel solution was treated with {VE} of {cE} EDTA, and the excess was back-titrated with {cZn} zinc sulfate ({VZn} needed). Find [Ni²⁺].',
    ],
    approachText: 'Excess EDTA added to a metal ion, the leftover EDTA titrated with a second metal ion.',
    explanation:
      'All complexes are 1 : 1. n(EDTA) added = cV; the Zn²⁺ titre gives the EDTA left over; the difference was bound by Ni²⁺. A back titration is used because [Ni(EDTA)]²⁻ forms slowly, so the end point of a direct titration would drift.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-r2-apparent-activation-energy',
    topic: 'kinetics',
    title: 'Apparent activation energy of a pre-equilibrium mechanism',
    difficulty: 3,
    params: {
      dH1: { unit: 'kJ/mol', min: -30, max: -10, decimals: 0 },
      Ea2: { unit: 'kJ/mol', min: 40, max: 80, decimals: 0 },
      k1: { unit: 'dm3/(mol s)', min: 0.01, max: 10, log: true, sig: 2 },
      T1: { unit: 'K', choices: [298], decimals: 0 },
      T2: { unit: 'K', min: 310, max: 350, decimals: 0 },
    },
    given: [
      { key: 'dH1', label: 'ΔH°(step 1)', from: 'p.dH1' },
      { key: 'Ea2', label: 'Eₐ(step 2)', from: 'p.Ea2' },
      { key: 'k1', label: 'k_obs at T₁', from: 'p.k1' },
      { key: 'T1', label: 'T₁', from: 'p.T1' },
      { key: 'T2', label: 'T₂', from: 'p.T2' },
    ],
    reference: [
      { id: 'Ea', label: 'Eₐ(apparent) = ΔH°₁ + Eₐ₂', op: 'add', inputs: ['g.dH1', 'g.Ea2'] },
      { id: 'k2', label: 'k_obs at T₂', formula: 'arrhenius-two-point', solveFor: 'k2', inputs: { k1: 'g.k1', T1: 'g.T1', T2: 'g.T2', Ea: 'n.Ea' } },
    ],
    answer: { node: 'k2', label: 'k_obs at T₂', unit: 'dm3/(mol s)' },
    misconceptions: [
      {
        reference: [{ id: 'k2', formula: 'arrhenius-two-point', solveFor: 'k2', inputs: { k1: 'g.k1', T1: 'g.T1', T2: 'g.T2', Ea: 'g.Ea2' } }],
        answer: 'k2',
        message: 'k_obs = K₁k₂, so its temperature dependence includes the pre-equilibrium: Eₐ(apparent) = ΔH°₁ + Eₐ₂.',
      },
    ],
    wordings: [
      'A reaction A + B → P goes by a fast pre-equilibrium A + B ⇌ I (ΔH° = {dH1}) followed by a slow step I → P (Eₐ = {Ea2}), so rate = K₁k₂[A][B]. The observed rate constant is {k1} at {T1}. Estimate it at {T2}.',
      'For the mechanism A + B ⇌ I (fast, ΔH° = {dH1}), I → P (slow, Eₐ = {Ea2}), k_obs = K₁k₂ = {k1} at {T1}. Find k_obs at {T2}, assuming ΔH° and Eₐ do not vary with temperature.',
    ],
    approachText: 'Pre-equilibrium followed by a slow step; combine the enthalpy and activation energy, then use the two-point Arrhenius equation.',
    explanation:
      'k_obs = K₁k₂. Using van ’t Hoff for K₁ and Arrhenius for k₂, ln k_obs falls with 1/T with slope −(ΔH°₁ + Eₐ₂)/R, so the apparent activation energy is ΔH°₁ + Eₐ₂. If the pre-equilibrium is exothermic enough, this is negative and the reaction slows on heating, as for 2NO + O₂.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
];
