import type { CalcTemplate } from '@/engine/template';

/**
 * UKChO Round 1, first batch: deduction from analytical data, redox titrations, solubility,
 * kinetics beyond A-level, the links between E°, ΔG° and K, and a solution-enthalpy cycle.
 */
export const ukcho1Batch1Templates: CalcTemplate[] = [
  {
    id: 'calc-r1-combustion-analysis',
    topic: 'stoich',
    title: 'Oxygen content from combustion analysis',
    difficulty: 3,
    params: {
      nc: { unit: '1', choices: [2, 3, 4, 5, 6], decimals: 0 },
      nh: { unit: '1', choices: [4, 6, 8, 10, 12], decimals: 0 },
      no: { unit: '1', choices: [1, 2, 3], decimals: 0 },
      m: { unit: 'g', min: 0.1, max: 0.4, decimals: 4 },
      MC: { unit: 'g/mol', choices: [12.01], decimals: 2 },
      MH: { unit: 'g/mol', choices: [1.008], decimals: 3 },
      MO: { unit: 'g/mol', choices: [16.0], decimals: 2 },
      MCO2: { unit: 'g/mol', choices: [44.01], decimals: 2 },
      MH2O: { unit: 'g/mol', choices: [18.02], decimals: 2 },
    },
    setup: [
      { id: 'a', op: 'mul', inputs: ['p.nc', 'p.MC'] },
      { id: 'b', op: 'mul', inputs: ['p.nh', 'p.MH'] },
      { id: 'c', op: 'mul', inputs: ['p.no', 'p.MO'] },
      { id: 'M', op: 'sum', inputs: ['n.a', 'n.b', 'n.c'], coefs: [1, 1, 1] },
      { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'p.m', M: 'n.M' } },
      { id: 'nCO2', op: 'mul', inputs: ['n.n', 'p.nc'] },
      { id: 'mCO2', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nCO2', M: 'p.MCO2' } },
      { id: 'nH', op: 'mul', inputs: ['n.n', 'p.nh'] },
      { id: 'nH2O', op: 'scale', inputs: ['n.nH'], coef: 0.5 },
      { id: 'mH2O', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nH2O', M: 'p.MH2O' } },
    ],
    given: [
      { key: 'm', label: 'm(sample)', from: 'p.m' },
      { key: 'mCO2', label: 'm(CO₂)', from: 'n.mCO2', unit: 'g', decimals: 4 },
      { key: 'mH2O', label: 'm(H₂O)', from: 'n.mH2O', unit: 'g', decimals: 4 },
      { key: 'MC', label: 'M(C)', from: 'p.MC' },
      { key: 'MH', label: 'M(H)', from: 'p.MH' },
      { key: 'MCO2', label: 'M(CO₂)', from: 'p.MCO2' },
      { key: 'MH2O', label: 'M(H₂O)', from: 'p.MH2O' },
    ],
    reference: [
      { id: 'nC', label: 'n(C) = n(CO₂)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mCO2', M: 'g.MCO2' } },
      { id: 'mC', label: 'm(C)', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nC', M: 'g.MC' } },
      { id: 'nW', label: 'n(H₂O)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mH2O', M: 'g.MH2O' } },
      { id: 'nH', label: 'n(H) = 2n(H₂O)', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nW', a: '#1', b: '#2' } },
      { id: 'mH', label: 'm(H)', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nH', M: 'g.MH' } },
      { id: 'mO', label: 'm(O) by difference', op: 'sum', inputs: ['g.m', 'n.mC', 'n.mH'], coefs: [1, -1, -1] },
      { id: 'P', label: 'O by mass', op: 'div', inputs: ['n.mO', 'g.m'] },
    ],
    answer: { node: 'P', label: 'O by mass', unit: '%' },
    misconceptions: [
      {
        reference: [
          { id: 'nC', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mCO2', M: 'g.MCO2' } },
          { id: 'mC', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nC', M: 'g.MC' } },
          { id: 'nW', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mH2O', M: 'g.MH2O' } },
          { id: 'mH', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nW', M: 'g.MH' } },
          { id: 'mO', op: 'sum', inputs: ['g.m', 'n.mC', 'n.mH'], coefs: [1, -1, -1] },
          { id: 'P', op: 'div', inputs: ['n.mO', 'g.m'] },
        ],
        answer: 'P',
        message: 'Each H₂O contains two hydrogen atoms: n(H) = 2 × n(H₂O).',
      },
    ],
    wordings: [
      'Complete combustion of {m} of an organic compound containing only C, H and O gave {mCO2} of CO₂ and {mH2O} of H₂O. Calculate the percentage by mass of oxygen in the compound. M(C) = {MC}, M(H) = {MH}, M(CO₂) = {MCO2}, M(H₂O) = {MH2O}.',
      'A {m} sample of a C, H, O compound burns completely to give {mCO2} of carbon dioxide and {mH2O} of water. What percentage of its mass is oxygen? Use M(C) = {MC}, M(H) = {MH}, M(CO₂) = {MCO2} and M(H₂O) = {MH2O}.',
    ],
    approachText: 'Combustion analysis of a C, H, O compound; oxygen is found by difference.',
    explanation:
      'All the carbon ends up in CO₂ and all the hydrogen in H₂O. n(C) = n(CO₂) and n(H) = 2n(H₂O); convert each to a mass. Oxygen is what is left: m(O) = m(sample) − m(C) − m(H). The same data give the empirical formula from the mole ratio C : H : O.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-permanganate-iron',
    topic: 'stoich',
    title: 'Iron in a tablet by permanganate titration',
    difficulty: 3,
    params: {
      m: { unit: 'g', min: 0.8, max: 1.2, decimals: 3 },
      frac: { unit: '1', min: 0.12, max: 0.18 },
      c: { unit: 'mol/dm3', choices: [0.002], sig: 3 },
      Vf: { unit: 'cm3', choices: [250], decimals: 1 },
      Va: { unit: 'cm3', choices: [25], decimals: 2 },
      M: { unit: 'g/mol', choices: [55.85], decimals: 2 },
    },
    setup: [
      { id: 'mFe', op: 'mul', inputs: ['p.m', 'p.frac'] },
      { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'n.mFe', M: 'p.M' } },
      { id: 'nal', op: 'scale', inputs: ['n.n'], coef: 0.1 },
      { id: 'nMn', op: 'scale', inputs: ['n.nal'], coef: 0.2 },
      { id: 'V', formula: 'concentration', solveFor: 'V', inputs: { n: 'n.nMn', c: 'p.c' } },
    ],
    given: [
      { key: 'm', label: 'm(tablet)', from: 'p.m' },
      { key: 'Vf', label: 'made up to', from: 'p.Vf' },
      { key: 'Va', label: 'portion titrated', from: 'p.Va' },
      { key: 'c', label: 'c(KMnO₄)', from: 'p.c' },
      { key: 'V', label: 'titre', from: 'n.V', unit: 'cm3', decimals: 2 },
      { key: 'M', label: 'M(Fe)', from: 'p.M' },
    ],
    reference: [
      { id: 'nMn', label: 'n(MnO₄⁻)', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.c', V: 'g.V' } },
      { id: 'nFe', label: 'n(Fe²⁺) in the portion', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nMn', a: '#1', b: '#5' } },
      { id: 'ratio', label: 'Flask volume ÷ portion', op: 'div', inputs: ['g.Vf', 'g.Va'] },
      { id: 'nAll', label: 'n(Fe²⁺) in the tablet', op: 'mul', inputs: ['n.nFe', 'n.ratio'] },
      { id: 'mFe', label: 'm(Fe)', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nAll', M: 'g.M' } },
      { id: 'P', label: 'Fe by mass', op: 'div', inputs: ['n.mFe', 'g.m'] },
    ],
    answer: { node: 'P', label: 'Fe by mass', unit: '%' },
    misconceptions: [
      {
        reference: [
          { id: 'nMn', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.c', V: 'g.V' } },
          { id: 'ratio', op: 'div', inputs: ['g.Vf', 'g.Va'] },
          { id: 'nAll', op: 'mul', inputs: ['n.nMn', 'n.ratio'] },
          { id: 'mFe', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nAll', M: 'g.M' } },
          { id: 'P', op: 'div', inputs: ['n.mFe', 'g.m'] },
        ],
        answer: 'P',
        message: 'MnO₄⁻ + 8H⁺ + 5Fe²⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O: each permanganate oxidises five Fe²⁺.',
      },
      {
        reference: [
          { id: 'nMn', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.c', V: 'g.V' } },
          { id: 'nFe', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nMn', a: '#1', b: '#5' } },
          { id: 'mFe', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nFe', M: 'g.M' } },
          { id: 'P', op: 'div', inputs: ['n.mFe', 'g.m'] },
        ],
        answer: 'P',
        message: 'Only one portion of the solution was titrated: scale up by the flask volume ÷ the portion volume.',
      },
    ],
    wordings: [
      'An iron tablet of mass {m} was dissolved in dilute sulfuric acid and made up to {Vf}. A {Va} portion needed {V} of {c} potassium manganate(VII) to reach the end point. Calculate the percentage by mass of iron in the tablet. M(Fe) = {M}.',
      'A {m} iron supplement was dissolved in acid (all the iron as Fe²⁺) and made up to {Vf}. Titrating {Va} portions with {c} KMnO₄ gave a mean titre of {V}. Find the percentage of iron by mass (M(Fe) = {M}).',
    ],
    approachText: 'Fe²⁺ titrated with acidified permanganate; one portion of a made-up solution titrated.',
    explanation:
      'n(MnO₄⁻) = cV. The half-equations (MnO₄⁻ gains 5e⁻, Fe²⁺ loses 1e⁻) give n(Fe²⁺) = 5n(MnO₄⁻) in the portion. Multiply by flask volume ÷ portion volume for the whole tablet, then convert to a mass and a percentage.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-iodometric-copper',
    topic: 'stoich',
    title: 'Copper(II) by iodometric titration',
    difficulty: 2,
    params: {
      Va: { unit: 'cm3', choices: [10, 20, 25], decimals: 2 },
      cCu: { unit: 'mol/dm3', min: 0.05, max: 0.15 },
      cs: { unit: 'mol/dm3', choices: [0.1], decimals: 3 },
    },
    setup: [
      { id: 'nCu', formula: 'concentration', solveFor: 'n', inputs: { c: 'p.cCu', V: 'p.Va' } },
      { id: 'V', formula: 'concentration', solveFor: 'V', inputs: { n: 'n.nCu', c: 'p.cs' } },
    ],
    given: [
      { key: 'Va', label: 'V(Cu²⁺ solution)', from: 'p.Va' },
      { key: 'cs', label: 'c(S₂O₃²⁻)', from: 'p.cs' },
      { key: 'Vt', label: 'titre', from: 'n.V', unit: 'cm3', decimals: 2 },
    ],
    constraint: (v) => v.Vt! > 8e-6 && v.Vt! < 45e-6,
    reference: [
      { id: 'nS', label: 'n(S₂O₃²⁻)', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cs', V: 'g.Vt' } },
      { id: 'nI2', label: 'n(I₂)', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nS', a: '#2', b: '#1' } },
      { id: 'nCu', label: 'n(Cu²⁺)', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nI2', a: '#1', b: '#2' } },
      { id: 'c', label: 'c(Cu²⁺)', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nCu', V: 'g.Va' } },
    ],
    answer: { node: 'c', label: 'c(Cu²⁺)', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [
          { id: 'nS', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cs', V: 'g.Vt' } },
          { id: 'nI2', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nS', a: '#2', b: '#1' } },
          { id: 'c', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nI2', V: 'g.Va' } },
        ],
        answer: 'c',
        message: 'Two Cu²⁺ make one I₂ (2Cu²⁺ + 4I⁻ → 2CuI + I₂), so n(Cu²⁺) = 2n(I₂) = n(S₂O₃²⁻).',
      },
    ],
    wordings: [
      'Excess potassium iodide was added to {Va} of a copper(II) sulfate solution: 2Cu²⁺ + 4I⁻ → 2CuI + I₂. The iodine released needed {Vt} of {cs} sodium thiosulfate: I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻. Calculate the concentration of Cu²⁺.',
      'In an iodometric titration, {Va} of Cu²⁺(aq) was treated with excess KI, and the I₂ formed was titrated with {cs} Na₂S₂O₃, needing {Vt}. Find [Cu²⁺] in the original solution.',
    ],
    approachText: 'Copper(II) releases iodine from iodide; the iodine is titrated with thiosulfate.',
    explanation:
      'n(S₂O₃²⁻) = cV. Each I₂ needs two thiosulfate, and each I₂ came from two Cu²⁺, so the twos cancel: n(Cu²⁺) = n(S₂O₃²⁻). Divide by the volume of copper solution.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-ksp-from-mass-solubility',
    topic: 'equilibrium',
    title: 'Ksp from a solubility in g dm⁻³',
    difficulty: 2,
    params: {
      M: { unit: 'g/mol', min: 100, max: 500, decimals: 1 },
      rho: { unit: 'g/dm3', min: 0.01, max: 2, log: true, sig: 3 },
    },
    given: [
      { key: 'rho', label: 'solubility', from: 'p.rho' },
      { key: 'M', label: 'M(MX₂)', from: 'p.M' },
    ],
    reference: [
      { id: 's', label: 'Molar solubility', formula: 'mass-concentration', solveFor: 'c', inputs: { rho: 'g.rho', M: 'g.M' } },
      { id: 'K', label: 'Ksp = 4s³', formula: 'ksp-solubility', solveFor: 'Ksp', inputs: { s: 'n.s', x: '#1', y: '#2' } },
    ],
    answer: { node: 'K', label: 'Ksp', unit: '1' },
    misconceptions: [
      {
        reference: [
          { id: 's', formula: 'mass-concentration', solveFor: 'c', inputs: { rho: 'g.rho', M: 'g.M' } },
          { id: 'K', formula: 'ksp-solubility', solveFor: 'Ksp', inputs: { s: 'n.s', x: '#1', y: '#1' } },
        ],
        answer: 'K',
        message: 'MX₂ ⇌ M²⁺ + 2X⁻: [X⁻] = 2s, so Ksp = s × (2s)² = 4s³, not s².',
      },
    ],
    wordings: [
      'The solubility of a salt MX₂ (M = {M}) in water is {rho}. Calculate its solubility product, Ksp.',
      'A saturated aqueous solution of MX₂ contains {rho} of the salt (molar mass {M}). Find Ksp.',
    ],
    approachText: 'Mass solubility and molar mass of an MX₂ salt; find Ksp.',
    explanation:
      'Convert to a molar solubility: s = (g dm⁻³) ÷ M. Each formula unit gives one M²⁺ and two X⁻, so Ksp = [M²⁺][X⁻]² = s(2s)² = 4s³ (with concentrations in mol dm⁻³).',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-common-ion',
    topic: 'equilibrium',
    title: 'Solubility with a common ion',
    difficulty: 2,
    params: {
      Ksp: { unit: '1', min: 1.5e-10, max: 1.8e-10, sig: 2 },
      cCl: { unit: 'mol/dm3', min: 1e-4, max: 0.1, log: true, sig: 2 },
    },
    given: [
      { key: 'Ksp', label: 'Ksp(AgCl)', from: 'p.Ksp' },
      { key: 'cCl', label: 'c(NaCl)', from: 'p.cCl' },
    ],
    reference: [
      {
        id: 's',
        label: 'Solubility of AgCl',
        formula: 'ice',
        solveFor: 'xi',
        inputs: { K: 'g.Ksp', nu1: '#1', X01: '#0@mol/dm3', nu2: '#1', X02: 'g.cCl' },
      },
    ],
    answer: { node: 's', label: 's(AgCl)', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [{ id: 's', formula: 'ksp-solubility', solveFor: 's', inputs: { Ksp: 'g.Ksp', x: '#1', y: '#1' } }],
        answer: 's',
        message: 'That is the solubility in pure water. The chloride already in solution suppresses dissolving: s ≈ Ksp ÷ [Cl⁻].',
      },
    ],
    wordings: [
      'Ksp(AgCl) = {Ksp}. Calculate the solubility of silver chloride, in mol dm⁻³, in {cCl} sodium chloride solution.',
      'How much AgCl (Ksp = {Ksp}) dissolves, in mol dm⁻³, in a solution that is already {cCl} in NaCl?',
    ],
    approachText: 'Sparingly soluble salt dissolving in a solution that already contains one of its ions.',
    explanation:
      'AgCl(s) ⇌ Ag⁺ + Cl⁻ with [Ag⁺] = s and [Cl⁻] = c + s. Then Ksp = s(c + s). Because s is tiny compared with c, s ≈ Ksp ÷ c: far less than the √Ksp in pure water.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-second-order-time',
    topic: 'kinetics',
    title: 'Time for a second-order reaction to reach a concentration',
    difficulty: 2,
    params: {
      k: { unit: 'dm3/(mol s)', min: 0.3, max: 0.8, sig: 2 },
      A0: { unit: 'mol/dm3', min: 0.01, max: 0.1, sig: 2 },
      frac: { unit: '1', min: 0.15, max: 0.6 },
    },
    setup: [{ id: 'A', op: 'mul', inputs: ['p.A0', 'p.frac'] }],
    given: [
      { key: 'k', label: 'k', from: 'p.k' },
      { key: 'A0', label: '[NO₂]₀', from: 'p.A0' },
      { key: 'A', label: '[NO₂]', from: 'n.A', unit: 'mol/dm3', sig: 2 },
    ],
    reference: [{ id: 't', label: 't', formula: 'second-order', solveFor: 't', inputs: { A: 'g.A', A0: 'g.A0', k: 'g.k' } }],
    answer: { node: 't', label: 't', unit: 's' },
    wordings: [
      'Nitrogen dioxide decomposes, 2NO₂ → 2NO + O₂, with rate = k[NO₂]² and k = {k}. Starting from {A0}, how long does it take for [NO₂] to fall to {A}?',
      'For the second-order decomposition of NO₂ (rate = k[NO₂]², k = {k}), find the time for the concentration to drop from {A0} to {A}.',
    ],
    approachText: 'Second-order decay with k known; find the time to reach a given concentration.',
    explanation:
      'Integrating rate = k[A]² gives 1/[A] = 1/[A]₀ + kt, so t = (1/[A] − 1/[A]₀) ÷ k. Unlike first order, the time to halve gets longer as the concentration falls.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-n2o5-pressure',
    topic: 'kinetics',
    title: 'Rate constant from total pressure',
    difficulty: 3,
    params: {
      p0: { unit: 'kPa', min: 30, max: 60, sig: 3 },
      k: { unit: '1/s', min: 3e-4, max: 8e-4 },
      t: { unit: 'min', min: 10, max: 40, decimals: 0 },
    },
    setup: [
      { id: 'pA', formula: 'first-order', solveFor: 'A', inputs: { A0: 'p.p0', k: 'p.k', t: 'p.t' } },
      { id: 'pt', op: 'sum', inputs: ['p.p0', 'n.pA'], coefs: [2.5, -1.5] },
    ],
    given: [
      { key: 'p0', label: 'p(N₂O₅) at start', from: 'p.p0' },
      { key: 'pt', label: 'p(total)', from: 'n.pt', unit: 'kPa', sig: 3 },
      { key: 't', label: 't', from: 'p.t' },
    ],
    reference: [
      { id: 'pA', label: 'p(N₂O₅) at time t = (5p₀ − 2p)/3', op: 'sum', inputs: ['g.p0', 'g.pt'], coefs: [5 / 3, -2 / 3] },
      { id: 'k', label: 'k', formula: 'first-order', solveFor: 'k', inputs: { A0: 'g.p0', A: 'n.pA', t: 'g.t' } },
    ],
    answer: { node: 'k', label: 'k', unit: '1/s' },
    misconceptions: [
      {
        reference: [
          { id: 'pA', op: 'sub', inputs: ['g.pt', 'g.p0'] },
          { id: 'k', formula: 'first-order', solveFor: 'k', inputs: { A0: 'g.p0', A: 'n.pA', t: 'g.t' } },
        ],
        answer: 'k',
        message: 'The rise in pressure is not the N₂O₅ left. If x kPa of N₂O₅ react, the total rises by 1.5x, so p(N₂O₅) = p₀ − (p − p₀)/1.5.',
      },
    ],
    wordings: [
      'Dinitrogen pentoxide decomposes in the gas phase by a first-order reaction: 2N₂O₅(g) → 4NO₂(g) + O₂(g). In a sealed vessel at constant temperature, pure N₂O₅ at {p0} gives a total pressure of {pt} after {t}. Calculate the rate constant.',
      'Pure N₂O₅ ({p0}) decomposes at constant volume and temperature: 2N₂O₅ → 4NO₂ + O₂ (first order). After {t} the total pressure is {pt}. Find k in s⁻¹.',
    ],
    approachText: 'Gas-phase first-order decomposition followed by total pressure; deduce the reactant pressure first.',
    explanation:
      'If x of N₂O₅ has reacted, the mixture holds p₀ − x of N₂O₅, 2x of NO₂ and x/2 of O₂: total p = p₀ + 1.5x. So p(N₂O₅) = p₀ − x = (5p₀ − 2p)/3. Partial pressures are proportional to concentrations at constant V and T, so k = ln(p₀/p(N₂O₅)) ÷ t.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-k-from-ecell',
    topic: 'electro',
    title: 'Equilibrium constant from E°cell',
    difficulty: 2,
    params: {
      E: { unit: 'V', min: 0.05, max: 0.5, decimals: 3 },
      z: { unit: '1', choices: [1, 2], decimals: 0 },
      T: { unit: 'K', choices: [298], decimals: 0 },
    },
    given: [
      { key: 'E', label: 'E°cell', from: 'p.E' },
      { key: 'z', label: 'n (electrons)', from: 'p.z' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    reference: [
      { id: 'dG', label: 'ΔG°', formula: 'gibbs-emf', solveFor: 'dG0', inputs: { n: 'g.z', E0: 'g.E' } },
      { id: 'K', label: 'K', formula: 'gibbs-k', solveFor: 'K', inputs: { dG0: 'n.dG', T: 'g.T' } },
    ],
    answer: { node: 'K', label: 'K', unit: '1' },
    misconceptions: [
      {
        reference: [
          { id: 'dG', formula: 'gibbs-emf', solveFor: 'dG0', inputs: { n: '#1', E0: 'g.E' } },
          { id: 'K', formula: 'gibbs-k', solveFor: 'K', inputs: { dG0: 'n.dG', T: 'g.T' } },
        ],
        answer: 'K',
        message: 'ΔG° = −nFE°: include the number of electrons transferred in the balanced equation.',
      },
    ],
    wordings: [
      'A cell reaction transferring {z} electron(s) per formula equation has E°cell = {E} at {T}. Calculate the equilibrium constant for the reaction.',
      'Find K at {T} for a redox reaction with E°cell = {E} and n = {z}.',
    ],
    approachText: 'Standard cell potential and electrons transferred known; find K.',
    explanation:
      'ΔG° = −nFE°, then K = exp(−ΔG°/RT). Combined: ln K = nFE°/RT, so even a few tenths of a volt give a very large K.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-nernst-iron',
    topic: 'electro',
    title: 'Electrode potential away from standard conditions',
    difficulty: 2,
    params: {
      E0: { unit: 'V', choices: [0.77], decimals: 2 },
      c3: { unit: 'mol/dm3', min: 0.001, max: 0.5, log: true, sig: 2 },
      c2: { unit: 'mol/dm3', min: 0.001, max: 0.5, log: true, sig: 2 },
      T: { unit: 'K', choices: [298], decimals: 0 },
    },
    given: [
      { key: 'E0', label: 'E°(Fe³⁺/Fe²⁺)', from: 'p.E0' },
      { key: 'c3', label: '[Fe³⁺]', from: 'p.c3' },
      { key: 'c2', label: '[Fe²⁺]', from: 'p.c2' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    constraint: (v) => Math.abs(Math.log(v.c2! / v.c3!)) > 0.7,
    reference: [
      { id: 'Q', label: 'Q = [Fe²⁺]/[Fe³⁺]', op: 'div', inputs: ['g.c2', 'g.c3'] },
      { id: 'E', label: 'E', formula: 'nernst', solveFor: 'E', inputs: { E0: 'g.E0', T: 'g.T', n: '#1', Q: 'n.Q' } },
    ],
    answer: { node: 'E', label: 'E', unit: 'V' },
    tolerance: { abs: 0.003 },
    misconceptions: [
      {
        reference: [
          { id: 'Q', op: 'div', inputs: ['g.c3', 'g.c2'] },
          { id: 'E', formula: 'nernst', solveFor: 'E', inputs: { E0: 'g.E0', T: 'g.T', n: '#1', Q: 'n.Q' } },
        ],
        answer: 'E',
        message: 'For the reduction Fe³⁺ + e⁻ → Fe²⁺, Q = [Fe²⁺]/[Fe³⁺] (product over reactant). More Fe³⁺ makes E more positive.',
      },
    ],
    wordings: [
      'Calculate the electrode potential at {T} of a platinum electrode in a solution with [Fe³⁺] = {c3} and [Fe²⁺] = {c2}. E°(Fe³⁺/Fe²⁺) = {E0}.',
      'A Pt wire dips into a solution that is {c3} in Fe³⁺ and {c2} in Fe²⁺. With E° = {E0}, what is the electrode potential at {T}?',
    ],
    approachText: 'Fe³⁺/Fe²⁺ half-cell at non-standard concentrations.',
    explanation:
      'For Fe³⁺ + e⁻ → Fe²⁺: E = E° − (RT/F) ln([Fe²⁺]/[Fe³⁺]). At 298 K, RT/F = 0.0257 V, so each tenfold change in the ratio shifts E by 59 mV.',
    levels: ['ukcho1'],
    reviewed: false,
  },
  {
    id: 'calc-r1-enthalpy-of-solution',
    topic: 'thermo',
    title: 'Enthalpy of solution from a thermodynamic cycle',
    difficulty: 2,
    params: {
      L: { unit: 'kJ/mol', min: 2000, max: 2600, decimals: 0 },
      hM: { unit: 'kJ/mol', min: -2000, max: -1500, decimals: 0 },
      hX: { unit: 'kJ/mol', min: -400, max: -300, decimals: 0 },
    },
    given: [
      { key: 'L', label: 'ΔLH (dissociation)', from: 'p.L' },
      { key: 'hM', label: 'ΔhydH(M²⁺)', from: 'p.hM' },
      { key: 'hX', label: 'ΔhydH(X⁻)', from: 'p.hX' },
    ],
    constraint: (v) => Math.abs(v.answer!) > 5000 && Math.abs(v.answer!) < 150000,
    reference: [{ id: 'dH', label: 'ΔsolH', op: 'sum', inputs: ['g.L', 'g.hM', 'g.hX'], coefs: [1, 1, 2] }],
    answer: { node: 'dH', label: 'ΔsolH', unit: 'kJ/mol' },
    misconceptions: [
      {
        reference: [{ id: 'dH', op: 'sum', inputs: ['g.L', 'g.hM', 'g.hX'], coefs: [1, 1, 1] }],
        answer: 'dH',
        message: 'MX₂ releases two X⁻ ions: include 2 × ΔhydH(X⁻).',
      },
      {
        reference: [{ id: 'dH', op: 'sum', inputs: ['g.L', 'g.hM', 'g.hX'], coefs: [-1, 1, 2] }],
        answer: 'dH',
        message: 'Dissolving first breaks the lattice apart (endothermic, +ΔLH dissociation), then hydrates the gaseous ions.',
      },
    ],
    wordings: [
      'For a salt MX₂, the lattice dissociation enthalpy is {L}, and the hydration enthalpies are {hM} for M²⁺ and {hX} for X⁻. Calculate the enthalpy of solution of MX₂.',
      'Use a thermodynamic cycle to find ΔsolH of MX₂(s), given ΔLH(dissociation) = {L}, ΔhydH(M²⁺) = {hM} and ΔhydH(X⁻) = {hX}.',
    ],
    approachText: 'Lattice and hydration enthalpies for an MX₂ salt; find the enthalpy of solution.',
    explanation:
      'MX₂(s) → M²⁺(g) + 2X⁻(g) → M²⁺(aq) + 2X⁻(aq). So ΔsolH = ΔLH(dissociation) + ΔhydH(M²⁺) + 2ΔhydH(X⁻). It is a small difference between large numbers, which is why solubility is hard to predict from these data alone.',
    levels: ['ukcho1'],
    reviewed: false,
  },
];
