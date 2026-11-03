import type { CalcTemplate } from '@/engine/template';

/**
 * A-Level (AQA) energetics: calorimetry, Hess cycles, mean bond enthalpies, Born–Haber cycles,
 * entropy and ΔG. Written in the style of A-level exam questions, within the specification.
 * Data values are typical data-book values; small ranges keep the numbers fresh.
 */
export const alevelEnergeticsTemplates: CalcTemplate[] = [
  {
    id: 'calc-al-calorimetry-combustion',
    topic: 'thermo',
    title: 'Enthalpy of combustion from a calorimetry experiment',
    difficulty: 2,
    params: {
      mw: { unit: 'g', min: 100, max: 250, decimals: 0 },
      c: { unit: 'J/(g K)', choices: [4.18], decimals: 2 },
      dT: { unit: 'K', kind: 'delta-temp', min: 12, max: 35, decimals: 1 },
      M: { unit: 'g/mol', choices: [46.0], decimals: 1 },
      // The experimental value, well short of the data-book −1367 kJ/mol because of heat loss.
      dHexp: { unit: 'kJ/mol', min: -1100, max: -650 },
    },
    setup: [
      { id: 'q', formula: 'heat-mass', solveFor: 'q', inputs: { m: 'p.mw', c: 'p.c', dT: 'p.dT' } },
      { id: 'per', op: 'scale', inputs: ['p.dHexp'], coef: -1 },
      { id: 'n', op: 'div', inputs: ['n.q', 'n.per'] },
      { id: 'mf', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.n', M: 'p.M' } },
    ],
    given: [
      { key: 'mw', label: 'm(water)', from: 'p.mw' },
      { key: 'c', label: 'c', from: 'p.c' },
      { key: 'dT', label: 'ΔT', from: 'p.dT' },
      { key: 'mf', label: 'm(ethanol)', from: 'n.mf', unit: 'g', decimals: 2 },
      { key: 'M', label: 'M(ethanol)', from: 'p.M' },
    ],
    reference: [
      { id: 'q', label: 'Heat absorbed by the water', formula: 'heat-mass', solveFor: 'q', inputs: { m: 'g.mw', c: 'g.c', dT: 'g.dT' } },
      { id: 'n', label: 'Moles of ethanol burned', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mf', M: 'g.M' } },
      { id: 'qn', label: 'Heat released per mole', op: 'div', inputs: ['n.q', 'n.n'] },
      { id: 'dH', label: 'ΔcH (negative: exothermic)', op: 'scale', inputs: ['n.qn'], coef: -1 },
    ],
    answer: { node: 'dH', label: 'ΔcH', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [
          { id: 'q', formula: 'heat-mass', solveFor: 'q', inputs: { m: 'g.mw', c: 'g.c', dT: 'g.dT' } },
          { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mf', M: 'g.M' } },
          { id: 'qn', op: 'div', inputs: ['n.q', 'n.n'] },
        ],
        answer: 'qn',
        message: 'Combustion is exothermic, so ΔcH is negative.',
      },
      {
        reference: [
          { id: 'q', formula: 'heat-mass', solveFor: 'q', inputs: { m: 'g.mf', c: 'g.c', dT: 'g.dT' } },
          { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mf', M: 'g.M' } },
          { id: 'qn', op: 'div', inputs: ['n.q', 'n.n'] },
          { id: 'dH', op: 'scale', inputs: ['n.qn'], coef: -1 },
        ],
        answer: 'dH',
        message: 'In q = mcΔT, m is the mass of the water being heated, not the mass of fuel burned.',
      },
    ],
    wordings: [
      'A spirit burner containing ethanol (M = {M}) heated {mw} of water (c = {c}). The temperature of the water rose by {dT} and the mass of the burner fell by {mf}. Calculate the enthalpy of combustion of ethanol from these results.',
      'Burning {mf} of ethanol raised the temperature of {mw} of water by {dT}. Using c = {c} and M(ethanol) = {M}, calculate an experimental value for ΔcH of ethanol.',
    ],
    approachText: 'Fuel burned under a beaker of water; temperature rise and mass of fuel used are known.',
    explanation:
      'q = mcΔT uses the mass of water. Divide by the moles of ethanol burned (n = m/M) to get the heat released per mole, then give it a negative sign because combustion is exothermic. The value is much less negative than the data-book −1367 kJ mol⁻¹, mainly because of heat lost to the surroundings and incomplete combustion.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-neutralisation',
    topic: 'thermo',
    title: 'Enthalpy of neutralisation',
    difficulty: 2,
    params: {
      V: { unit: 'cm3', choices: [20, 25, 30, 40, 50], decimals: 1 },
      conc: { unit: 'mol/dm3', min: 0.5, max: 2, decimals: 2 },
      rho: { unit: 'g/cm3', choices: [1.0], decimals: 2 },
      c: { unit: 'J/(g K)', choices: [4.18], decimals: 2 },
      dHtrue: { unit: 'kJ/mol', min: -59, max: -53 },
    },
    setup: [
      { id: 'n', formula: 'concentration', solveFor: 'n', inputs: { c: 'p.conc', V: 'p.V' } },
      { id: 'qneg', op: 'mul', inputs: ['n.n', 'p.dHtrue'] },
      { id: 'q', op: 'scale', inputs: ['n.qneg'], coef: -1 },
      { id: 'Vt', op: 'scale', inputs: ['p.V'], coef: 2 },
      { id: 'm', op: 'mul', inputs: ['n.Vt', 'p.rho'] },
      { id: 'dT', formula: 'heat-mass', solveFor: 'dT', inputs: { q: 'n.q', m: 'n.m', c: 'p.c' } },
    ],
    given: [
      { key: 'V', label: 'V(each solution)', from: 'p.V' },
      { key: 'conc', label: 'c(HCl) = c(NaOH)', from: 'p.conc' },
      { key: 'dT', label: 'ΔT', from: 'n.dT', unit: 'K', decimals: 1 },
      { key: 'rho', label: 'density', from: 'p.rho' },
      { key: 'c', label: 'c', from: 'p.c' },
    ],
    reference: [
      { id: 'Vt', label: 'Total volume of the mixture', op: 'scale', inputs: ['g.V'], coef: 2 },
      { id: 'm', label: 'Mass of the mixture', op: 'mul', inputs: ['n.Vt', 'g.rho'] },
      { id: 'q', label: 'Heat released', formula: 'heat-mass', solveFor: 'q', inputs: { m: 'n.m', c: 'g.c', dT: 'g.dT' } },
      { id: 'n', label: 'Moles of water formed', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.conc', V: 'g.V' } },
      { id: 'qn', op: 'div', inputs: ['n.q', 'n.n'] },
      { id: 'dH', label: 'ΔneutH', op: 'scale', inputs: ['n.qn'], coef: -1 },
    ],
    answer: { node: 'dH', label: 'ΔneutH', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [
          { id: 'm', op: 'mul', inputs: ['g.V', 'g.rho'] },
          { id: 'q', formula: 'heat-mass', solveFor: 'q', inputs: { m: 'n.m', c: 'g.c', dT: 'g.dT' } },
          { id: 'n', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.conc', V: 'g.V' } },
          { id: 'qn', op: 'div', inputs: ['n.q', 'n.n'] },
          { id: 'dH', op: 'scale', inputs: ['n.qn'], coef: -1 },
        ],
        answer: 'dH',
        message: 'Both solutions are heated: the mass in q = mcΔT is that of the whole mixture (both volumes).',
      },
      {
        reference: [
          { id: 'Vt', op: 'scale', inputs: ['g.V'], coef: 2 },
          { id: 'm', op: 'mul', inputs: ['n.Vt', 'g.rho'] },
          { id: 'q', formula: 'heat-mass', solveFor: 'q', inputs: { m: 'n.m', c: 'g.c', dT: 'g.dT' } },
          { id: 'n', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.conc', V: 'g.V' } },
          { id: 'qn', op: 'div', inputs: ['n.q', 'n.n'] },
        ],
        answer: 'qn',
        message: 'The temperature rose, so the reaction released heat: ΔH is negative.',
      },
    ],
    wordings: [
      '{V} of hydrochloric acid was mixed with {V} of sodium hydroxide solution; both had concentration {conc}. The temperature rose by {dT}. Assume the mixture has density {rho} and specific heat capacity {c}. Calculate the enthalpy change of neutralisation.',
      'Equal volumes ({V} each) of HCl and NaOH, both {conc}, were mixed in a polystyrene cup and the temperature increased by {dT}. Taking the density of the mixture as {rho} and c = {c}, find ΔneutH.',
    ],
    approachText: 'Equal volumes of acid and alkali of the same concentration mixed; temperature rise measured.',
    explanation:
      'The mass heated is the whole mixture: 2V × density. q = mcΔT. The moles of water formed equal the moles of HCl (= moles of NaOH), n = cV. ΔneutH = −q/n, negative because heat is released.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-hess-combustion',
    topic: 'thermo',
    title: 'ΔfH from enthalpies of combustion',
    difficulty: 2,
    params: {
      cC: { unit: 'kJ/mol', choices: [-393.5], decimals: 1 },
      cH: { unit: 'kJ/mol', choices: [-285.8], decimals: 1 },
      cP: { unit: 'kJ/mol', min: -2230, max: -2200, decimals: 1 },
    },
    given: [
      { key: 'cC', label: 'ΔcH(C)', from: 'p.cC' },
      { key: 'cH', label: 'ΔcH(H₂)', from: 'p.cH' },
      { key: 'cP', label: 'ΔcH(C₃H₈)', from: 'p.cP' },
    ],
    reference: [{ id: 'dH', label: 'ΔfH(C₃H₈)', op: 'sum', inputs: ['g.cC', 'g.cH', 'g.cP'], coefs: [3, 4, -1] }],
    answer: { node: 'dH', label: 'ΔfH(C₃H₈)', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [{ id: 'dH', op: 'sum', inputs: ['g.cC', 'g.cH', 'g.cP'], coefs: [-3, -4, 1] }],
        answer: 'dH',
        message: 'From combustion data, ΔfH = Σ ΔcH(reactants) − Σ ΔcH(products): the elements minus the compound, not the other way round.',
      },
      {
        reference: [{ id: 'dH', op: 'sum', inputs: ['g.cC', 'g.cH', 'g.cP'], coefs: [1, 1, -1] }],
        answer: 'dH',
        message: 'Forming one C₃H₈ needs 3 C and 4 H₂, so multiply their combustion enthalpies by 3 and 4.',
      },
    ],
    wordings: [
      'Use the enthalpies of combustion ΔcH(C, graphite) = {cC}, ΔcH(H₂) = {cH} and ΔcH(C₃H₈) = {cP} to calculate the enthalpy of formation of propane, 3C(s) + 4H₂(g) → C₃H₈(g).',
      'Calculate ΔfH for propane from these enthalpies of combustion: carbon {cC}, hydrogen {cH}, propane {cP}.',
    ],
    approachText: 'Enthalpy of formation of a hydrocarbon from the combustion enthalpies of it and its elements.',
    explanation:
      'Both the elements and propane burn to the same products (CO₂ and H₂O), so ΔfH = 3ΔcH(C) + 4ΔcH(H₂) − ΔcH(C₃H₈). Draw the cycle with the combustion products at the bottom if in doubt.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-bond-enthalpy',
    topic: 'thermo',
    title: 'ΔH from mean bond enthalpies',
    difficulty: 1,
    params: {
      CH: { unit: 'kJ/mol', min: 410, max: 415, decimals: 0 },
      OO: { unit: 'kJ/mol', min: 495, max: 498, decimals: 0 },
      CO: { unit: 'kJ/mol', min: 799, max: 805, decimals: 0 },
      OH: { unit: 'kJ/mol', min: 459, max: 464, decimals: 0 },
    },
    given: [
      { key: 'CH', label: 'C–H', from: 'p.CH' },
      { key: 'OO', label: 'O=O', from: 'p.OO' },
      { key: 'CO', label: 'C=O', from: 'p.CO' },
      { key: 'OH', label: 'O–H', from: 'p.OH' },
    ],
    reference: [
      { id: 'broken', label: 'Bonds broken', op: 'sum', inputs: ['g.CH', 'g.OO'], coefs: [4, 2] },
      { id: 'made', label: 'Bonds made', op: 'sum', inputs: ['g.CO', 'g.OH'], coefs: [2, 4] },
      { id: 'dH', label: 'ΔH = broken − made', op: 'sub', inputs: ['n.broken', 'n.made'] },
    ],
    answer: { node: 'dH', label: 'ΔcH', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [
          { id: 'broken', op: 'sum', inputs: ['g.CH', 'g.OO'], coefs: [4, 2] },
          { id: 'made', op: 'sum', inputs: ['g.CO', 'g.OH'], coefs: [2, 4] },
          { id: 'dH', op: 'sub', inputs: ['n.made', 'n.broken'] },
        ],
        answer: 'dH',
        message: 'ΔH = Σ(bonds broken) − Σ(bonds made). Breaking bonds takes in energy; making them releases it.',
      },
      {
        reference: [
          { id: 'broken', op: 'sum', inputs: ['g.CH', 'g.OO'], coefs: [4, 2] },
          { id: 'made', op: 'sum', inputs: ['g.CO', 'g.OH'], coefs: [2, 2] },
          { id: 'dH', op: 'sub', inputs: ['n.broken', 'n.made'] },
        ],
        answer: 'dH',
        message: 'Each H₂O has two O–H bonds and two H₂O form, so four O–H bonds are made.',
      },
    ],
    wordings: [
      'Use the mean bond enthalpies C–H {CH}, O=O {OO}, C=O {CO} and O–H {OH} to calculate the enthalpy change for CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g).',
      'Estimate ΔcH of methane, with all species gaseous, from these mean bond enthalpies: C–H {CH}, O=O {OO}, C=O {CO}, O–H {OH}.',
    ],
    approachText: 'Combustion of methane (all gases) with mean bond enthalpies for every bond involved.',
    explanation:
      'Bonds broken: 4 C–H and 2 O=O. Bonds made: 2 C=O and 4 O–H. ΔH = Σ broken − Σ made. The answer differs from the data-book ΔcH (−890 kJ mol⁻¹) because mean bond enthalpies are averages over many compounds and because water is a liquid under standard conditions.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-bond-enthalpy-unknown',
    topic: 'thermo',
    title: 'An unknown bond enthalpy from ΔH',
    difficulty: 1,
    params: {
      dH: { unit: 'kJ/mol', min: -190, max: -180, decimals: 0 },
      HH: { unit: 'kJ/mol', min: 434, max: 437, decimals: 0 },
      ClCl: { unit: 'kJ/mol', min: 242, max: 244, decimals: 0 },
    },
    given: [
      { key: 'dH', label: 'ΔrH', from: 'p.dH' },
      { key: 'HH', label: 'H–H', from: 'p.HH' },
      { key: 'ClCl', label: 'Cl–Cl', from: 'p.ClCl' },
    ],
    reference: [{ id: 'HCl', label: 'H–Cl', op: 'sum', inputs: ['g.HH', 'g.ClCl', 'g.dH'], coefs: [0.5, 0.5, -0.5] }],
    answer: { node: 'HCl', label: 'E(H–Cl)', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [{ id: 'HCl', op: 'sum', inputs: ['g.HH', 'g.ClCl', 'g.dH'], coefs: [1, 1, -1] }],
        answer: 'HCl',
        message: 'Two H–Cl bonds form, so the total for bonds made must be shared between two bonds.',
      },
      {
        reference: [{ id: 'HCl', op: 'sum', inputs: ['g.HH', 'g.ClCl', 'g.dH'], coefs: [0.5, 0.5, 0.5] }],
        answer: 'HCl',
        message: 'ΔH = broken − made, so made = broken − ΔH. With ΔH negative, the bonds made total more than the bonds broken.',
      },
    ],
    wordings: [
      'For H₂(g) + Cl₂(g) → 2HCl(g), ΔH = {dH}. Given the bond enthalpies H–H {HH} and Cl–Cl {ClCl}, calculate the H–Cl bond enthalpy.',
      'Hydrogen and chlorine react: H₂(g) + Cl₂(g) → 2HCl(g), ΔrH = {dH}. Use E(H–H) = {HH} and E(Cl–Cl) = {ClCl} to find E(H–Cl).',
    ],
    approachText: 'H₂ + Cl₂ → 2HCl with ΔH and two of the three bond enthalpies known.',
    explanation: 'ΔH = [E(H–H) + E(Cl–Cl)] − 2E(H–Cl), so E(H–Cl) = [E(H–H) + E(Cl–Cl) − ΔH]/2.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-born-haber-nacl',
    topic: 'thermo',
    title: 'Born–Haber cycle: lattice enthalpy of NaCl',
    difficulty: 2,
    params: {
      fH: { unit: 'kJ/mol', min: -413, max: -409, decimals: 0 },
      atNa: { unit: 'kJ/mol', min: 106, max: 109, decimals: 0 },
      ie: { unit: 'kJ/mol', min: 494, max: 498, decimals: 0 },
      atCl: { unit: 'kJ/mol', min: 120, max: 123, decimals: 0 },
      ea: { unit: 'kJ/mol', min: -351, max: -347, decimals: 0 },
    },
    given: [
      { key: 'fH', label: 'ΔfH(NaCl)', from: 'p.fH' },
      { key: 'atNa', label: 'ΔatH(Na)', from: 'p.atNa' },
      { key: 'ie', label: 'IE₁(Na)', from: 'p.ie' },
      { key: 'atCl', label: 'ΔatH(Cl)', from: 'p.atCl' },
      { key: 'ea', label: 'EA₁(Cl)', from: 'p.ea' },
    ],
    reference: [
      { id: 'L', label: 'Lattice formation enthalpy', op: 'sum', inputs: ['g.fH', 'g.atNa', 'g.ie', 'g.atCl', 'g.ea'], coefs: [1, -1, -1, -1, -1] },
    ],
    answer: { node: 'L', label: 'ΔLH (formation)', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [{ id: 'L', op: 'sum', inputs: ['g.fH', 'g.atNa', 'g.ie', 'g.atCl', 'g.ea'], coefs: [-1, 1, 1, 1, 1] }],
        answer: 'L',
        message: 'That is the lattice dissociation enthalpy. Lattice formation (gaseous ions → solid) is exothermic, so it is negative.',
      },
    ],
    wordings: [
      'Use the data to calculate the enthalpy of lattice formation of sodium chloride: ΔfH(NaCl) = {fH}, ΔatH(Na) = {atNa}, first ionisation energy of Na = {ie}, ΔatH(Cl) = {atCl}, first electron affinity of Cl = {ea}.',
      'Construct a Born–Haber cycle for NaCl and find the lattice formation enthalpy. Data: ΔfH(NaCl) {fH}; atomisation of Na {atNa}; IE₁(Na) {ie}; atomisation of chlorine (per mole of Cl atoms) {atCl}; EA₁(Cl) {ea}.',
    ],
    approachText: 'Born–Haber cycle for NaCl with every step except the lattice enthalpy known.',
    explanation:
      'Going round the cycle: ΔfH = ΔatH(Na) + IE₁ + ΔatH(Cl) + EA₁ + ΔLH(formation). Rearranging, ΔLH = ΔfH − (ΔatH(Na) + IE₁ + ΔatH(Cl) + EA₁).',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-born-haber-mgcl2',
    topic: 'thermo',
    title: 'Born–Haber cycle: lattice enthalpy of MgCl₂',
    difficulty: 3,
    params: {
      fH: { unit: 'kJ/mol', min: -644, max: -639, decimals: 0 },
      atMg: { unit: 'kJ/mol', min: 146, max: 150, decimals: 0 },
      ie1: { unit: 'kJ/mol', min: 736, max: 740, decimals: 0 },
      ie2: { unit: 'kJ/mol', min: 1448, max: 1453, decimals: 0 },
      atCl: { unit: 'kJ/mol', min: 120, max: 123, decimals: 0 },
      ea: { unit: 'kJ/mol', min: -351, max: -347, decimals: 0 },
    },
    given: [
      { key: 'fH', label: 'ΔfH(MgCl₂)', from: 'p.fH' },
      { key: 'atMg', label: 'ΔatH(Mg)', from: 'p.atMg' },
      { key: 'ie1', label: 'IE₁(Mg)', from: 'p.ie1' },
      { key: 'ie2', label: 'IE₂(Mg)', from: 'p.ie2' },
      { key: 'atCl', label: 'ΔatH(Cl)', from: 'p.atCl' },
      { key: 'ea', label: 'EA₁(Cl)', from: 'p.ea' },
    ],
    reference: [
      {
        id: 'L',
        label: 'Lattice formation enthalpy',
        op: 'sum',
        inputs: ['g.fH', 'g.atMg', 'g.ie1', 'g.ie2', 'g.atCl', 'g.ea'],
        coefs: [1, -1, -1, -1, -2, -2],
      },
    ],
    answer: { node: 'L', label: 'ΔLH (formation)', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [{ id: 'L', op: 'sum', inputs: ['g.fH', 'g.atMg', 'g.ie1', 'g.ie2', 'g.atCl', 'g.ea'], coefs: [1, -1, -1, -1, -1, -1] }],
        answer: 'L',
        message: 'MgCl₂ has two chloride ions: atomise chlorine twice and add two electron affinities.',
      },
      {
        reference: [{ id: 'L', op: 'sum', inputs: ['g.fH', 'g.atMg', 'g.ie1', 'g.ie2', 'g.atCl', 'g.ea'], coefs: [1, -1, -1, 0, -2, -2] }],
        answer: 'L',
        message: 'Mg²⁺ needs both the first and the second ionisation energies.',
      },
      {
        reference: [{ id: 'L', op: 'sum', inputs: ['g.fH', 'g.atMg', 'g.ie1', 'g.ie2', 'g.atCl', 'g.ea'], coefs: [-1, 1, 1, 1, 2, 2] }],
        answer: 'L',
        message: 'That is the lattice dissociation enthalpy. Lattice formation is exothermic, so it is negative.',
      },
    ],
    wordings: [
      'Calculate the enthalpy of lattice formation of magnesium chloride. ΔfH(MgCl₂) = {fH}; ΔatH(Mg) = {atMg}; first and second ionisation energies of Mg = {ie1} and {ie2}; ΔatH(Cl), per mole of Cl atoms, = {atCl}; first electron affinity of Cl = {ea}.',
      'Use a Born–Haber cycle to find the lattice formation enthalpy of MgCl₂ from: ΔfH {fH}, atomisation of Mg {atMg}, IE₁(Mg) {ie1}, IE₂(Mg) {ie2}, atomisation of Cl (per mole of Cl atoms) {atCl}, EA₁(Cl) {ea}.',
    ],
    approachText: 'Born–Haber cycle for MgCl₂: a 2+ ion and two chloride ions.',
    explanation:
      'ΔLH = ΔfH − [ΔatH(Mg) + IE₁ + IE₂ + 2ΔatH(Cl) + 2EA₁(Cl)]. The ×2 terms are because one formula unit contains two Cl⁻ ions; ΔatH(Cl) is defined per mole of Cl atoms formed.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-entropy-change',
    topic: 'thermo',
    title: 'ΔS from standard entropies',
    difficulty: 1,
    params: {
      // Data books differ slightly; small ranges around N₂ 191.6, H₂ 130.7, NH₃ 192.5.
      SN2: { unit: 'J/(K mol)', min: 191, max: 192.2, decimals: 1 },
      SH2: { unit: 'J/(K mol)', min: 130.4, max: 131, decimals: 1 },
      SNH3: { unit: 'J/(K mol)', min: 192, max: 193, decimals: 1 },
    },
    given: [
      { key: 'SN2', label: 'S(N₂)', from: 'p.SN2' },
      { key: 'SH2', label: 'S(H₂)', from: 'p.SH2' },
      { key: 'SNH3', label: 'S(NH₃)', from: 'p.SNH3' },
    ],
    reference: [{ id: 'dS', label: 'ΔS', op: 'sum', inputs: ['g.SNH3', 'g.SN2', 'g.SH2'], coefs: [2, -1, -3] }],
    answer: { node: 'dS', label: 'ΔS', unit: 'J/(K mol)' },
    misconceptions: [
      {
        reference: [{ id: 'dS', op: 'sum', inputs: ['g.SNH3', 'g.SN2', 'g.SH2'], coefs: [1, -1, -1] }],
        answer: 'dS',
        message: 'Multiply each entropy by its coefficient in the equation: 2 NH₃ and 3 H₂.',
      },
      {
        reference: [{ id: 'dS', op: 'sum', inputs: ['g.SNH3', 'g.SN2', 'g.SH2'], coefs: [2, 0, 0] }],
        answer: 'dS',
        message: 'Unlike ΔfH, the entropy of an element is not zero: N₂ and H₂ must be included.',
      },
    ],
    wordings: [
      'Calculate the entropy change for N₂(g) + 3H₂(g) → 2NH₃(g). S values: N₂ {SN2}, H₂ {SH2}, NH₃ {SNH3}.',
      'Use the standard entropies S(N₂) = {SN2}, S(H₂) = {SH2} and S(NH₃) = {SNH3} to find ΔS for the Haber process, N₂ + 3H₂ → 2NH₃.',
    ],
    approachText: 'Haber process with the standard entropy of each species.',
    explanation:
      'ΔS = ΣS(products) − ΣS(reactants) = 2S(NH₃) − S(N₂) − 3S(H₂). It is negative because four moles of gas become two.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-feasibility-temperature',
    topic: 'thermo',
    title: 'Temperature at which a reaction becomes feasible',
    difficulty: 1,
    params: {
      dH: { unit: 'kJ/mol', min: 175, max: 181, decimals: 1 },
      dS: { unit: 'J/(K mol)', min: 158, max: 165, decimals: 0 },
    },
    given: [
      { key: 'dH', label: 'ΔH', from: 'p.dH' },
      { key: 'dS', label: 'ΔS', from: 'p.dS' },
    ],
    reference: [{ id: 'T', label: 'T where ΔG = 0', formula: 'gibbs', solveFor: 'T', inputs: { dG: '#0@kJ/mol', dH: 'g.dH', dS: 'g.dS' } }],
    answer: { node: 'T', label: 'T', unit: 'K' },
    wordings: [
      'For the thermal decomposition CaCO₃(s) → CaO(s) + CO₂(g), ΔH = {dH} and ΔS = {dS}. Calculate the minimum temperature at which the reaction is feasible.',
      'Calcium carbonate decomposes: CaCO₃ → CaO + CO₂, with ΔH = {dH} and ΔS = {dS}. Above what temperature is the decomposition feasible?',
    ],
    approachText: 'Endothermic decomposition with positive ΔS: find where ΔG changes sign.',
    explanation:
      'A reaction is feasible when ΔG ≤ 0. Setting ΔG = ΔH − TΔS = 0 gives T = ΔH/ΔS. Convert ΔH to J mol⁻¹ first (or ΔS to kJ K⁻¹ mol⁻¹); dividing 178 by 161 directly gives a meaningless 1.1 K.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-dg-from-data',
    topic: 'thermo',
    title: 'ΔG from enthalpies of formation and entropies',
    difficulty: 2,
    params: {
      fSO2: { unit: 'kJ/mol', choices: [-296.8], decimals: 1 },
      fSO3: { unit: 'kJ/mol', choices: [-395.7], decimals: 1 },
      SSO2: { unit: 'J/(K mol)', choices: [248.2], decimals: 1 },
      SO2: { unit: 'J/(K mol)', choices: [205.2], decimals: 1 },
      SSO3: { unit: 'J/(K mol)', choices: [256.8], decimals: 1 },
      T: { unit: 'K', min: 400, max: 1100, decimals: 0 },
    },
    given: [
      { key: 'fSO2', label: 'ΔfH(SO₂)', from: 'p.fSO2' },
      { key: 'fSO3', label: 'ΔfH(SO₃)', from: 'p.fSO3' },
      { key: 'SSO2', label: 'S(SO₂)', from: 'p.SSO2' },
      { key: 'SO2', label: 'S(O₂)', from: 'p.SO2' },
      { key: 'SSO3', label: 'S(SO₃)', from: 'p.SSO3' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    constraint: (v) => Math.abs(v.answer!) > 3000,
    reference: [
      { id: 'dH', label: 'ΔH', op: 'sum', inputs: ['g.fSO3', 'g.fSO2'], coefs: [2, -2] },
      { id: 'dS', label: 'ΔS', op: 'sum', inputs: ['g.SSO3', 'g.SSO2', 'g.SO2'], coefs: [2, -2, -1] },
      { id: 'dG', formula: 'gibbs', solveFor: 'dG', inputs: { dH: 'n.dH', dS: 'n.dS', T: 'g.T' } },
    ],
    answer: { node: 'dG', label: 'ΔG', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [
          { id: 'dH', op: 'sum', inputs: ['g.fSO3', 'g.fSO2'], coefs: [2, -2] },
          { id: 'dS', op: 'sum', inputs: ['g.SSO3', 'g.SSO2'], coefs: [2, -2] },
          { id: 'dG', formula: 'gibbs', solveFor: 'dG', inputs: { dH: 'n.dH', dS: 'n.dS', T: 'g.T' } },
        ],
        answer: 'dG',
        message: 'O₂ has ΔfH = 0 because it is an element, but its entropy is not zero: include S(O₂) in ΔS.',
      },
      {
        reference: [
          { id: 'dH', op: 'sum', inputs: ['g.fSO3', 'g.fSO2'], coefs: [1, -1] },
          { id: 'dS', op: 'sum', inputs: ['g.SSO3', 'g.SSO2', 'g.SO2'], coefs: [1, -1, -1] },
          { id: 'dG', formula: 'gibbs', solveFor: 'dG', inputs: { dH: 'n.dH', dS: 'n.dS', T: 'g.T' } },
        ],
        answer: 'dG',
        message: 'The equation has 2SO₂ and 2SO₃: multiply their values by 2.',
      },
    ],
    wordings: [
      'For 2SO₂(g) + O₂(g) → 2SO₃(g), use ΔfH(SO₂) = {fSO2}, ΔfH(SO₃) = {fSO3}, S(SO₂) = {SSO2}, S(O₂) = {SO2} and S(SO₃) = {SSO3} to calculate ΔG at {T}.',
      'In the Contact process, 2SO₂ + O₂ → 2SO₃. From the data (ΔfH: SO₂ {fSO2}, SO₃ {fSO3}; S: SO₂ {SSO2}, O₂ {SO2}, SO₃ {SSO3}), find ΔG at {T} and decide whether the reaction is feasible there.',
    ],
    approachText: 'Contact process with ΔfH and S tabulated; find ΔG at a given temperature.',
    explanation:
      'ΔH = 2ΔfH(SO₃) − 2ΔfH(SO₂). ΔS = 2S(SO₃) − 2S(SO₂) − S(O₂). Then ΔG = ΔH − TΔS, with ΔS converted to kJ K⁻¹ mol⁻¹. ΔS is negative, so ΔG rises with temperature and becomes positive above about 1050 K.',
    levels: ['alevel'],
    reviewed: false,
  },
];
