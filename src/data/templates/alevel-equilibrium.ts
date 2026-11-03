import type { CalcTemplate } from '@/engine/template';

/**
 * A-Level (AQA) Kc and Kp, with units, as the specification uses them: Kc from equilibrium
 * concentrations, Kp from partial pressures (via mole fractions).
 */
export const alevelEquilibriumTemplates: CalcTemplate[] = [
  {
    id: 'calc-al-kc-units',
    topic: 'equilibrium',
    title: 'Kc and its units for the Haber process',
    difficulty: 1,
    params: {
      cN: { unit: 'mol/dm3', min: 0.2, max: 1.5, sig: 3 },
      cH: { unit: 'mol/dm3', min: 0.5, max: 2.5, sig: 3 },
      cA: { unit: 'mol/dm3', min: 0.05, max: 0.8, sig: 3 },
    },
    given: [
      { key: 'cN', label: '[N₂]', from: 'p.cN' },
      { key: 'cH', label: '[H₂]', from: 'p.cH' },
      { key: 'cA', label: '[NH₃]', from: 'p.cA' },
    ],
    reference: [
      {
        id: 'K',
        label: 'Kc = [NH₃]² / ([N₂][H₂]³)',
        formula: 'kc',
        solveFor: 'K',
        inputs: { nu1: '#-1', X1: 'g.cN', nu2: '#-3', X2: 'g.cH', nu3: '#2', X3: 'g.cA' },
      },
    ],
    answer: { node: 'K', label: 'Kc', unit: 'dm6/mol2' },
    misconceptions: [
      {
        reference: [{ id: 'K', formula: 'kc', solveFor: 'K', inputs: { nu1: '#1', X1: 'g.cN', nu2: '#3', X2: 'g.cH', nu3: '#-2', X3: 'g.cA' } }],
        answer: 'K',
        message: 'Products go on top: Kc = [NH₃]² ÷ ([N₂][H₂]³).',
      },
      {
        reference: [{ id: 'K', formula: 'kc', solveFor: 'K', inputs: { nu1: '#-1', X1: 'g.cN', nu2: '#-1', X2: 'g.cH', nu3: '#1', X3: 'g.cA' } }],
        answer: 'K',
        message: 'Each concentration is raised to the power of its coefficient: [H₂]³ and [NH₃]².',
      },
    ],
    wordings: [
      'For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), an equilibrium mixture contains [N₂] = {cN}, [H₂] = {cH} and [NH₃] = {cA}. Calculate Kc and give its units.',
      'Find the value and units of Kc for the Haber process, N₂ + 3H₂ ⇌ 2NH₃, given equilibrium concentrations [N₂] {cN}, [H₂] {cH}, [NH₃] {cA}.',
    ],
    approachText: 'Equilibrium concentrations of every species known; write Kc and work out its units.',
    explanation:
      'Kc = [NH₃]² ÷ ([N₂][H₂]³). Units: (mol dm⁻³)² ÷ (mol dm⁻³)⁴ = (mol dm⁻³)⁻² = mol⁻² dm⁶. In general the units are (mol dm⁻³)^Δn, with Δn = moles of gas on the right − on the left.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-kc-from-moles',
    topic: 'equilibrium',
    title: 'Kc from equilibrium amounts and volume',
    difficulty: 2,
    params: {
      n5: { unit: 'mol', min: 0.05, max: 0.5, sig: 3 },
      n3: { unit: 'mol', min: 0.05, max: 0.5, sig: 3 },
      nC: { unit: 'mol', min: 0.05, max: 0.5, sig: 3 },
      V: { unit: 'dm3', choices: [2, 2.5, 5, 10], decimals: 2 },
    },
    given: [
      { key: 'n5', label: 'n(PCl₅)', from: 'p.n5' },
      { key: 'n3', label: 'n(PCl₃)', from: 'p.n3' },
      { key: 'nC', label: 'n(Cl₂)', from: 'p.nC' },
      { key: 'V', label: 'V', from: 'p.V' },
    ],
    reference: [
      { id: 'c5', label: '[PCl₅]', formula: 'concentration', solveFor: 'c', inputs: { n: 'g.n5', V: 'g.V' } },
      { id: 'c3', label: '[PCl₃]', formula: 'concentration', solveFor: 'c', inputs: { n: 'g.n3', V: 'g.V' } },
      { id: 'cC', label: '[Cl₂]', formula: 'concentration', solveFor: 'c', inputs: { n: 'g.nC', V: 'g.V' } },
      { id: 'K', label: 'Kc', formula: 'kc', solveFor: 'K', inputs: { nu1: '#-1', X1: 'n.c5', nu2: '#1', X2: 'n.c3', nu3: '#1', X3: 'n.cC' } },
    ],
    answer: { node: 'K', label: 'Kc', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [
          { id: 'top', op: 'mul', inputs: ['g.n3', 'g.nC'] },
          { id: 'K', op: 'div', inputs: ['n.top', 'g.n5'] },
        ],
        answer: 'K',
        message: 'Kc uses concentrations. With one mole on the left and two on the right, the volume does not cancel: divide each amount by V first.',
      },
    ],
    wordings: [
      'Phosphorus(V) chloride dissociates: PCl₅(g) ⇌ PCl₃(g) + Cl₂(g). At equilibrium a {V} vessel contains {n5} of PCl₅, {n3} of PCl₃ and {nC} of Cl₂. Calculate Kc and give its units.',
      'A {V} flask holds an equilibrium mixture of {n5} PCl₅, {n3} PCl₃ and {nC} Cl₂ (PCl₅ ⇌ PCl₃ + Cl₂). Find Kc, with units.',
    ],
    approachText: 'Equilibrium amounts in moles and the vessel volume; Δn is not zero.',
    explanation:
      'Convert each amount to a concentration with c = n/V, then Kc = [PCl₃][Cl₂] ÷ [PCl₅]. Units: (mol dm⁻³)²/(mol dm⁻³) = mol dm⁻³. The volume only cancels when the moles of gas are the same on both sides.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-kc-from-initial',
    topic: 'equilibrium',
    title: 'Kc from initial amounts and one equilibrium amount',
    difficulty: 3,
    params: {
      a: { unit: 'mol', min: 0.2, max: 1, sig: 3 },
      b: { unit: 'mol', min: 0.2, max: 1, sig: 3 },
      f: { unit: '1', min: 0.5, max: 0.85 },
      V: { unit: 'dm3', choices: [1, 2, 5], decimals: 2 },
    },
    setup: [
      { id: 'lim', op: 'sum', inputs: ['p.a', 'p.b'], coefs: [0.5, 0.5] },
      // HI formed: twice the H₂ used, at most twice the smaller reactant.
      { id: 'x', op: 'mul', inputs: ['p.f', 'n.lim'] },
    ],
    given: [
      { key: 'a', label: 'n(H₂) at start', from: 'p.a' },
      { key: 'b', label: 'n(I₂) at start', from: 'p.b' },
      { key: 'x', label: 'n(HI) at equilibrium', from: 'n.x', unit: 'mol', sig: 3 },
      { key: 'V', label: 'V', from: 'p.V' },
    ],
    constraint: (v) => v.x! / 2 < 0.95 * Math.min(v.a!, v.b!),
    reference: [
      { id: 'used', label: 'H₂ (and I₂) used = ½ n(HI)', op: 'scale', inputs: ['g.x'], coef: 0.5 },
      { id: 'nH', label: 'n(H₂) at equilibrium', op: 'sub', inputs: ['g.a', 'n.used'] },
      { id: 'nI', label: 'n(I₂) at equilibrium', op: 'sub', inputs: ['g.b', 'n.used'] },
      { id: 'cH', label: '[H₂]', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nH', V: 'g.V' } },
      { id: 'cI', label: '[I₂]', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nI', V: 'g.V' } },
      { id: 'cHI', label: '[HI]', formula: 'concentration', solveFor: 'c', inputs: { n: 'g.x', V: 'g.V' } },
      { id: 'K', label: 'Kc', formula: 'kc', solveFor: 'K', inputs: { nu1: '#-1', X1: 'n.cH', nu2: '#-1', X2: 'n.cI', nu3: '#2', X3: 'n.cHI' } },
    ],
    answer: { node: 'K', label: 'Kc', unit: '1' },
    misconceptions: [
      {
        reference: [
          { id: 'nH', op: 'sub', inputs: ['g.a', 'g.x'] },
          { id: 'nI', op: 'sub', inputs: ['g.b', 'g.x'] },
          { id: 'cH', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nH', V: 'g.V' } },
          { id: 'cI', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nI', V: 'g.V' } },
          { id: 'cHI', formula: 'concentration', solveFor: 'c', inputs: { n: 'g.x', V: 'g.V' } },
          { id: 'K', formula: 'kc', solveFor: 'K', inputs: { nu1: '#-1', X1: 'n.cH', nu2: '#-1', X2: 'n.cI', nu3: '#2', X3: 'n.cHI' } },
        ],
        answer: 'K',
        message: 'Forming 2 mol of HI uses only 1 mol each of H₂ and I₂: subtract half the HI formed.',
      },
    ],
    wordings: [
      '{a} of hydrogen and {b} of iodine were sealed in a {V} vessel and heated: H₂(g) + I₂(g) ⇌ 2HI(g). At equilibrium the mixture contained {x} of HI. Calculate Kc.',
      'A mixture of {a} H₂ and {b} I₂ in {V} reaches equilibrium, H₂ + I₂ ⇌ 2HI, with {x} of HI present. Find Kc and explain why it has no units.',
    ],
    approachText: 'Initial amounts of reactants and the equilibrium amount of the product; build the equilibrium amounts first.',
    explanation:
      'Making x mol HI uses x/2 mol each of H₂ and I₂. Equilibrium amounts: H₂ = a − x/2, I₂ = b − x/2, HI = x. Kc = [HI]² ÷ ([H₂][I₂]); with two moles of gas on each side the units (and the volume) cancel.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-kc-find-concentration',
    topic: 'equilibrium',
    title: 'An equilibrium concentration from Kc',
    difficulty: 2,
    params: {
      K: { unit: 'dm3/mol', min: 50, max: 500, sig: 3 },
      cS: { unit: 'mol/dm3', min: 0.02, max: 0.3, sig: 3 },
      cO: { unit: 'mol/dm3', min: 0.02, max: 0.3, sig: 3 },
    },
    given: [
      { key: 'K', label: 'Kc', from: 'p.K' },
      { key: 'cS', label: '[SO₂]', from: 'p.cS' },
      { key: 'cO', label: '[O₂]', from: 'p.cO' },
    ],
    reference: [
      {
        id: 'c',
        label: '[SO₃] = √(Kc[SO₂]²[O₂])',
        formula: 'kc',
        solveFor: 'X3',
        inputs: { K: 'g.K', nu1: '#-2', X1: 'g.cS', nu2: '#-1', X2: 'g.cO', nu3: '#2' },
      },
    ],
    answer: { node: 'c', label: '[SO₃]', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [{ id: 'c', formula: 'kc', solveFor: 'X3', inputs: { K: 'g.K', nu1: '#-1', X1: 'g.cS', nu2: '#-1', X2: 'g.cO', nu3: '#1' } }],
        answer: 'c',
        message: 'Kc = [SO₃]² ÷ ([SO₂]²[O₂]): square [SO₂], and take the square root at the end.',
      },
    ],
    wordings: [
      'For 2SO₂(g) + O₂(g) ⇌ 2SO₃(g), Kc = {K} at a certain temperature. An equilibrium mixture contains [SO₂] = {cS} and [O₂] = {cO}. Calculate [SO₃].',
      'In the Contact process, 2SO₂ + O₂ ⇌ 2SO₃ with Kc = {K}. If [SO₂] = {cS} and [O₂] = {cO} at equilibrium, what is the concentration of SO₃?',
    ],
    approachText: 'Kc and all but one equilibrium concentration known; find the missing one.',
    explanation: 'Rearrange Kc = [SO₃]² ÷ ([SO₂]²[O₂]) to [SO₃] = √(Kc × [SO₂]² × [O₂]). Check: Kc here has units of dm³ mol⁻¹.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-kp-mole-fractions',
    topic: 'equilibrium',
    title: 'Kp from equilibrium amounts and total pressure',
    difficulty: 3,
    params: {
      n1: { unit: 'mol', min: 0.2, max: 1.5, sig: 3 },
      n2: { unit: 'mol', min: 0.2, max: 1.5, sig: 3 },
      p: { unit: 'kPa', min: 100, max: 400, sig: 3 },
    },
    given: [
      { key: 'n1', label: 'n(N₂O₄)', from: 'p.n1' },
      { key: 'n2', label: 'n(NO₂)', from: 'p.n2' },
      { key: 'p', label: 'p(total)', from: 'p.p' },
    ],
    reference: [
      { id: 'nt', label: 'Total moles', op: 'add', inputs: ['g.n1', 'g.n2'] },
      { id: 'x1', label: 'x(N₂O₄)', op: 'div', inputs: ['g.n1', 'n.nt'] },
      { id: 'x2', label: 'x(NO₂)', op: 'div', inputs: ['g.n2', 'n.nt'] },
      { id: 'p1', label: 'p(N₂O₄)', formula: 'partial-pressure', solveFor: 'p', inputs: { x: 'n.x1', ptot: 'g.p' } },
      { id: 'p2', label: 'p(NO₂)', formula: 'partial-pressure', solveFor: 'p', inputs: { x: 'n.x2', ptot: 'g.p' } },
      { id: 'K', label: 'Kp = p(NO₂)² / p(N₂O₄)', formula: 'kp', solveFor: 'K', inputs: { nu1: '#-1', X1: 'n.p1', nu2: '#2', X2: 'n.p2' } },
    ],
    answer: { node: 'K', label: 'Kp', unit: 'kPa' },
    misconceptions: [
      {
        reference: [
          { id: 'nt', op: 'add', inputs: ['g.n1', 'g.n2'] },
          { id: 'x1', op: 'div', inputs: ['g.n1', 'n.nt'] },
          { id: 'x2', op: 'div', inputs: ['g.n2', 'n.nt'] },
          { id: 'p1', formula: 'partial-pressure', solveFor: 'p', inputs: { x: 'n.x1', ptot: 'g.p' } },
          { id: 'p2', formula: 'partial-pressure', solveFor: 'p', inputs: { x: 'n.x2', ptot: 'g.p' } },
          { id: 'K', formula: 'kp', solveFor: 'K', inputs: { nu1: '#-1', X1: 'n.p1', nu2: '#1', X2: 'n.p2' } },
        ],
        answer: 'K',
        message: 'N₂O₄ ⇌ 2NO₂: square the partial pressure of NO₂.',
      },
    ],
    wordings: [
      'Dinitrogen tetroxide dissociates: N₂O₄(g) ⇌ 2NO₂(g). An equilibrium mixture contains {n1} of N₂O₄ and {n2} of NO₂ at a total pressure of {p}. Calculate Kp and give its units.',
      'At equilibrium, N₂O₄ ⇌ 2NO₂ has {n1} N₂O₄ and {n2} NO₂, with total pressure {p}. Find the mole fractions, the partial pressures and hence Kp (with units).',
    ],
    approachText: 'Equilibrium amounts and total pressure; mole fractions, then partial pressures, then Kp.',
    explanation:
      'Mole fraction x = n ÷ n(total); partial pressure p = x × p(total). Then Kp = p(NO₂)² ÷ p(N₂O₄), with units kPa²/kPa = kPa.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-kp-haber',
    topic: 'equilibrium',
    title: 'Kp and its units for the Haber process',
    difficulty: 1,
    params: {
      pN: { unit: 'kPa', min: 2000, max: 6000, sig: 3 },
      pH: { unit: 'kPa', min: 6000, max: 15000, sig: 3 },
      pA: { unit: 'kPa', min: 500, max: 4000, sig: 3 },
    },
    given: [
      { key: 'pN', label: 'p(N₂)', from: 'p.pN' },
      { key: 'pH', label: 'p(H₂)', from: 'p.pH' },
      { key: 'pA', label: 'p(NH₃)', from: 'p.pA' },
    ],
    reference: [
      {
        id: 'K',
        label: 'Kp = p(NH₃)² / (p(N₂) p(H₂)³)',
        formula: 'kp',
        solveFor: 'K',
        inputs: { nu1: '#-1', X1: 'g.pN', nu2: '#-3', X2: 'g.pH', nu3: '#2', X3: 'g.pA' },
      },
    ],
    answer: { node: 'K', label: 'Kp', unit: '1/kPa2' },
    misconceptions: [
      {
        reference: [{ id: 'K', formula: 'kp', solveFor: 'K', inputs: { nu1: '#1', X1: 'g.pN', nu2: '#3', X2: 'g.pH', nu3: '#-2', X3: 'g.pA' } }],
        answer: 'K',
        message: 'Products go on top: Kp = p(NH₃)² ÷ (p(N₂) × p(H₂)³).',
      },
    ],
    wordings: [
      'In an ammonia plant, the equilibrium partial pressures are p(N₂) = {pN}, p(H₂) = {pH} and p(NH₃) = {pA}. Calculate Kp for N₂(g) + 3H₂(g) ⇌ 2NH₃(g), with units.',
      'Find Kp, including units, for N₂ + 3H₂ ⇌ 2NH₃ when the equilibrium partial pressures are N₂ {pN}, H₂ {pH} and NH₃ {pA}.',
    ],
    approachText: 'Equilibrium partial pressures of every gas known; write Kp and work out its units.',
    explanation:
      'Kp = p(NH₃)² ÷ (p(N₂) p(H₂)³). Units: kPa² ÷ kPa⁴ = kPa⁻². The number depends on the pressure unit: in Pa it would be 10⁶ times smaller.',
    levels: ['alevel'],
    reviewed: false,
  },
];
