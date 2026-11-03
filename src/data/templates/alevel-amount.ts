import type { CalcTemplate } from '@/engine/template';

/**
 * A-Level (AQA) amount of substance: reacting masses, percentage yield, atom economy,
 * titrations, the ideal gas equation and water of crystallisation. Written in the style of
 * A-level exam questions, within the specification.
 */
export const alevelAmountTemplates: CalcTemplate[] = [
  {
    id: 'calc-al-reacting-mass',
    topic: 'stoich',
    title: 'Reacting masses: iron from iron(III) oxide',
    difficulty: 1,
    params: {
      m: { unit: 'g', min: 10, max: 500, sig: 3 },
      Mox: { unit: 'g/mol', choices: [159.6], decimals: 1 },
      MFe: { unit: 'g/mol', choices: [55.8], decimals: 1 },
    },
    given: [
      { key: 'm', label: 'm(Fe₂O₃)', from: 'p.m' },
      { key: 'Mox', label: 'M(Fe₂O₃)', from: 'p.Mox' },
      { key: 'MFe', label: 'M(Fe)', from: 'p.MFe' },
    ],
    reference: [
      { id: 'nox', label: 'n(Fe₂O₃)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.Mox' } },
      { id: 'nFe', label: 'n(Fe)', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nox', a: '#1', b: '#2' } },
      { id: 'mFe', label: 'm(Fe)', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nFe', M: 'g.MFe' } },
    ],
    answer: { node: 'mFe', label: 'm(Fe)', unit: 'g' },
    misconceptions: [
      {
        reference: [
          { id: 'nox', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.Mox' } },
          { id: 'mFe', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nox', M: 'g.MFe' } },
        ],
        answer: 'mFe',
        message: 'Each Fe₂O₃ gives two Fe atoms: n(Fe) = 2 × n(Fe₂O₃).',
      },
    ],
    wordings: [
      'In a blast furnace, Fe₂O₃ + 3CO → 2Fe + 3CO₂. Calculate the maximum mass of iron that can be made from {m} of iron(III) oxide. M(Fe₂O₃) = {Mox}, M(Fe) = {MFe}.',
      'Iron(III) oxide is reduced by carbon monoxide: Fe₂O₃ + 3CO → 2Fe + 3CO₂. What mass of iron forms from {m} of Fe₂O₃? Use M(Fe₂O₃) = {Mox} and M(Fe) = {MFe}.',
    ],
    approachText: 'Mass of a reactant known; find the mass of product from the balanced equation.',
    explanation: 'n(Fe₂O₃) = m/M. The equation gives 2 mol Fe per mol Fe₂O₃, so n(Fe) = 2n(Fe₂O₃). Then m(Fe) = n(Fe) × M(Fe).',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-percentage-yield',
    topic: 'stoich',
    title: 'Percentage yield of an ester',
    difficulty: 2,
    params: {
      m: { unit: 'g', min: 5, max: 30, sig: 3 },
      Ma: { unit: 'g/mol', choices: [60.0], decimals: 1 },
      Me: { unit: 'g/mol', choices: [88.0], decimals: 1 },
      Y: { unit: '%', min: 40, max: 85 },
    },
    setup: [
      { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'p.m', M: 'p.Ma' } },
      { id: 'theo', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.n', M: 'p.Me' } },
      { id: 'act', formula: 'percentage-yield', solveFor: 'act', inputs: { Y: 'p.Y', theo: 'n.theo' } },
    ],
    given: [
      { key: 'm', label: 'm(acid)', from: 'p.m' },
      { key: 'act', label: 'm(ester) obtained', from: 'n.act', unit: 'g', sig: 3 },
      { key: 'Ma', label: 'M(CH₃COOH)', from: 'p.Ma' },
      { key: 'Me', label: 'M(CH₃COOC₂H₅)', from: 'p.Me' },
    ],
    reference: [
      { id: 'n', label: 'n(acid)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.Ma' } },
      { id: 'theo', label: 'Theoretical mass of ester', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.n', M: 'g.Me' } },
      { id: 'Y', formula: 'percentage-yield', solveFor: 'Y', inputs: { act: 'g.act', theo: 'n.theo' } },
    ],
    answer: { node: 'Y', label: 'Percentage yield', unit: '%' },
    misconceptions: [
      {
        reference: [{ id: 'Y', formula: 'percentage-yield', solveFor: 'Y', inputs: { act: 'g.act', theo: 'g.m' } }],
        answer: 'Y',
        message: 'Compare like with like: the theoretical yield is the mass of ester the acid could make, not the mass of acid.',
      },
    ],
    wordings: [
      'Ethyl ethanoate is made from ethanoic acid and excess ethanol: CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O. {m} of ethanoic acid gave {act} of ester. Calculate the percentage yield. M(CH₃COOH) = {Ma}, M(CH₃COOC₂H₅) = {Me}.',
      'A student reacted {m} of ethanoic acid (M = {Ma}) with excess ethanol and collected {act} of ethyl ethanoate (M = {Me}). What was the percentage yield?',
    ],
    approachText: 'Esterification with the acid limiting; mass of ester obtained known.',
    explanation:
      'n(acid) = m/M. The reaction is 1 : 1, so the theoretical mass of ester is n × M(ester). Percentage yield = actual mass ÷ theoretical mass × 100. The yield is well below 100% partly because esterification is an equilibrium.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-atom-economy',
    topic: 'stoich',
    title: 'Atom economy',
    difficulty: 1,
    params: {
      MA: { unit: 'g/mol', min: 60, max: 200, decimals: 1 },
      MB: { unit: 'g/mol', min: 20, max: 100, decimals: 1 },
      MC: { unit: 'g/mol', min: 30, max: 150, decimals: 1 },
    },
    setup: [
      // Mass is conserved: M(A) + 2M(B) = 2M(C) + M(D).
      { id: 'MD', op: 'sum', inputs: ['p.MA', 'p.MB', 'p.MC'], coefs: [1, 2, -2] },
    ],
    given: [
      { key: 'MA', label: 'Mr(A)', from: 'p.MA' },
      { key: 'MB', label: 'Mr(B)', from: 'p.MB' },
      { key: 'MC', label: 'Mr(C)', from: 'p.MC' },
      { key: 'MD', label: 'Mr(D)', from: 'n.MD', unit: 'g/mol', decimals: 1 },
    ],
    // D must be a real substance, and C a sizeable share of the products.
    constraint: (v) => v.MD! > 0.015 && v.answer! > 0.2 && v.answer! < 0.95,
    reference: [
      { id: 'want', label: 'Mass of desired product', op: 'scale', inputs: ['g.MC'], coef: 2 },
      { id: 'all', label: 'Total mass of reactants', op: 'sum', inputs: ['g.MA', 'g.MB'], coefs: [1, 2] },
      { id: 'AE', label: 'Atom economy', op: 'div', inputs: ['n.want', 'n.all'] },
    ],
    answer: { node: 'AE', label: 'Atom economy', unit: '%' },
    misconceptions: [
      {
        reference: [
          { id: 'all', op: 'sum', inputs: ['g.MA', 'g.MB'], coefs: [1, 1] },
          { id: 'AE', op: 'div', inputs: ['g.MC', 'n.all'] },
        ],
        answer: 'AE',
        message: 'Use the equation’s coefficients: 2 × Mr(C) over Mr(A) + 2 × Mr(B).',
      },
      {
        reference: [
          { id: 'want', op: 'scale', inputs: ['g.MC'], coef: 2 },
          { id: 'AE', op: 'div', inputs: ['n.want', 'g.MD'] },
        ],
        answer: 'AE',
        message: 'Atom economy compares the desired product with all the reactants (equivalently, all the products), not with the by-product.',
      },
    ],
    wordings: [
      'Product C is made by the reaction A + 2B → 2C + D. The relative formula masses are A {MA}, B {MB}, C {MC} and D {MD}. Calculate the percentage atom economy for making C.',
      'For A + 2B → 2C + D (Mr: A {MA}, B {MB}, C {MC}, D {MD}), what is the atom economy of the process if C is the only useful product?',
    ],
    approachText: 'Balanced equation with relative formula masses of every species; C is the desired product.',
    explanation:
      'Atom economy = (mass of desired product ÷ total mass of reactants) × 100, using the coefficients: 2Mr(C) ÷ [Mr(A) + 2Mr(B)]. Because mass is conserved, the bottom line also equals 2Mr(C) + Mr(D).',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-titration-diprotic',
    topic: 'stoich',
    title: 'Titration: sodium hydroxide against sulfuric acid',
    difficulty: 1,
    params: {
      Vb: { unit: 'cm3', choices: [20, 25], decimals: 1 },
      ca: { unit: 'mol/dm3', min: 0.05, max: 0.15, decimals: 3 },
      Va: { unit: 'cm3', min: 15, max: 35, decimals: 2 },
    },
    given: [
      { key: 'Vb', label: 'V(NaOH)', from: 'p.Vb' },
      { key: 'ca', label: 'c(H₂SO₄)', from: 'p.ca' },
      { key: 'Va', label: 'titre of H₂SO₄', from: 'p.Va' },
    ],
    reference: [
      { id: 'na', label: 'n(H₂SO₄)', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.ca', V: 'g.Va' } },
      { id: 'nb', label: 'n(NaOH)', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.na', a: '#1', b: '#2' } },
      { id: 'cb', label: 'c(NaOH)', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.nb', V: 'g.Vb' } },
    ],
    answer: { node: 'cb', label: 'c(NaOH)', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [
          { id: 'na', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.ca', V: 'g.Va' } },
          { id: 'cb', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.na', V: 'g.Vb' } },
        ],
        answer: 'cb',
        message: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O: each mole of sulfuric acid neutralises two moles of NaOH.',
      },
    ],
    wordings: [
      '{Vb} of sodium hydroxide solution was titrated with {ca} sulfuric acid. The mean titre was {Va}. Calculate the concentration of the sodium hydroxide.',
      'A {Vb} portion of NaOH(aq) needed {Va} of {ca} H₂SO₄ for neutralisation. Find the concentration of the NaOH.',
    ],
    approachText: 'Titration of a base of unknown concentration with a diprotic acid of known concentration.',
    explanation: 'n(H₂SO₄) = c × V (volume in dm³). The equation H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O gives n(NaOH) = 2n(H₂SO₄). Then c(NaOH) = n ÷ V(NaOH).',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-back-titration',
    topic: 'stoich',
    title: 'Back titration: purity of calcium carbonate',
    difficulty: 3,
    params: {
      mS: { unit: 'g', min: 0.6, max: 1.5, decimals: 3 },
      purity: { unit: '%', min: 85, max: 99 },
      VH: { unit: 'cm3', choices: [50], decimals: 1 },
      cH: { unit: 'mol/dm3', choices: [1.0], decimals: 2 },
      // 1.00 mol dm⁻³ keeps the titre between about 20 and 40 cm³: it must fit in one 50 cm³ burette.
      cN: { unit: 'mol/dm3', choices: [1.0], decimals: 2 },
      M: { unit: 'g/mol', choices: [100.1], decimals: 1 },
    },
    setup: [
      { id: 'mC', op: 'mul', inputs: ['p.mS', 'p.purity'] },
      { id: 'nC', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'n.mC', M: 'p.M' } },
      { id: 'nR', op: 'scale', inputs: ['n.nC'], coef: 2 },
      { id: 'n0', formula: 'concentration', solveFor: 'n', inputs: { c: 'p.cH', V: 'p.VH' } },
      { id: 'nX', op: 'sub', inputs: ['n.n0', 'n.nR'] },
      { id: 'VN', formula: 'concentration', solveFor: 'V', inputs: { n: 'n.nX', c: 'p.cN' } },
    ],
    given: [
      { key: 'mS', label: 'm(sample)', from: 'p.mS' },
      { key: 'VH', label: 'V(HCl)', from: 'p.VH' },
      { key: 'cH', label: 'c(HCl)', from: 'p.cH' },
      { key: 'cN', label: 'c(NaOH)', from: 'p.cN' },
      { key: 'VN', label: 'titre of NaOH', from: 'n.VN', unit: 'cm3', decimals: 2 },
      { key: 'M', label: 'M(CaCO₃)', from: 'p.M' },
    ],
    reference: [
      { id: 'n0', label: 'n(HCl) added', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cH', V: 'g.VH' } },
      { id: 'nX', label: 'n(HCl) left over = n(NaOH)', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cN', V: 'g.VN' } },
      { id: 'nR', label: 'n(HCl) that reacted with CaCO₃', op: 'sub', inputs: ['n.n0', 'n.nX'] },
      { id: 'nC', label: 'n(CaCO₃)', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nR', a: '#2', b: '#1' } },
      { id: 'mC', label: 'm(CaCO₃)', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nC', M: 'g.M' } },
      { id: 'P', label: 'Purity', op: 'div', inputs: ['n.mC', 'g.mS'] },
    ],
    answer: { node: 'P', label: 'Percentage purity', unit: '%' },
    misconceptions: [
      {
        reference: [
          { id: 'n0', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cH', V: 'g.VH' } },
          { id: 'nX', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cN', V: 'g.VN' } },
          { id: 'nR', op: 'sub', inputs: ['n.n0', 'n.nX'] },
          { id: 'mC', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nR', M: 'g.M' } },
          { id: 'P', op: 'div', inputs: ['n.mC', 'g.mS'] },
        ],
        answer: 'P',
        message: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂: halve the moles of HCl that reacted to get moles of CaCO₃.',
      },
      {
        reference: [
          { id: 'nX', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.cN', V: 'g.VN' } },
          { id: 'nC', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.nX', a: '#2', b: '#1' } },
          { id: 'mC', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.nC', M: 'g.M' } },
          { id: 'P', op: 'div', inputs: ['n.mC', 'g.mS'] },
        ],
        answer: 'P',
        message: 'The NaOH measures the HCl left over. The HCl that reacted with the carbonate is the amount added minus the amount left over.',
      },
    ],
    wordings: [
      'A {mS} sample of impure calcium carbonate was added to {VH} of {cH} hydrochloric acid (an excess). When the reaction was complete, the remaining acid needed {VN} of {cN} sodium hydroxide for neutralisation. Calculate the percentage purity of the calcium carbonate. M(CaCO₃) = {M}.',
      'Limestone ({mS}) was dissolved in {VH} of {cH} HCl. The excess HCl was titrated with {cN} NaOH, needing {VN}. Assuming the impurities do not react with acid, find the percentage by mass of CaCO₃ in the limestone (M = {M}).',
    ],
    approachText: 'Back titration: excess acid added to a carbonate, then the leftover acid titrated with alkali.',
    explanation:
      'n(HCl) added = cV. The NaOH titre gives the HCl left over (1 : 1). The difference is the HCl that reacted, and CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂ halves it to n(CaCO₃). Multiply by M for the mass, then divide by the sample mass.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-gas-volume',
    topic: 'stoich',
    title: 'Volume of gas from a reacting mass',
    difficulty: 2,
    params: {
      m: { unit: 'g', min: 0.5, max: 5, sig: 3 },
      M: { unit: 'g/mol', choices: [100.1], decimals: 1 },
      T: { unit: 'K', min: 290, max: 305, decimals: 0 },
      p: { unit: 'Pa', min: 98000, max: 103000, sig: 3 },
    },
    given: [
      { key: 'm', label: 'm(CaCO₃)', from: 'p.m' },
      { key: 'M', label: 'M(CaCO₃)', from: 'p.M' },
      { key: 'T', label: 'T', from: 'p.T' },
      { key: 'p', label: 'p', from: 'p.p' },
    ],
    reference: [
      { id: 'n', label: 'n(CaCO₃) = n(CO₂)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.M' } },
      { id: 'V', label: 'V(CO₂)', formula: 'ideal-gas', solveFor: 'V', inputs: { p: 'g.p', n: 'n.n', T: 'g.T' } },
    ],
    answer: { node: 'V', label: 'V(CO₂)', unit: 'cm3' },
    wordings: [
      'Calcium carbonate decomposes on heating: CaCO₃ → CaO + CO₂. Calculate the volume, in cm³, of carbon dioxide formed from {m} of CaCO₃ (M = {M}), measured at {T} and {p}.',
      'What volume of CO₂ is released when {m} of calcium carbonate (M = {M}) is heated strongly? Measure the gas at {p} and {T}.',
    ],
    approachText: 'Mass of a carbonate decomposed; find the volume of gas at a stated temperature and pressure.',
    explanation:
      'n(CO₂) = n(CaCO₃) = m/M (1 : 1). Then V = nRT/p. In SI units p is in Pa and V comes out in m³; multiply by 10⁶ for cm³.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-mr-volatile-liquid',
    topic: 'stoich',
    title: 'Relative molecular mass of a volatile liquid',
    difficulty: 2,
    params: {
      V: { unit: 'cm3', min: 60, max: 150, decimals: 1 },
      T: { unit: 'K', min: 350, max: 380, decimals: 0 },
      p: { unit: 'Pa', min: 99000, max: 103000, sig: 3 },
      Mtrue: { unit: 'g/mol', min: 46, max: 150 },
    },
    setup: [
      { id: 'n', formula: 'ideal-gas', solveFor: 'n', inputs: { p: 'p.p', V: 'p.V', T: 'p.T' } },
      { id: 'm', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.n', M: 'p.Mtrue' } },
    ],
    given: [
      { key: 'm', label: 'm(liquid)', from: 'n.m', unit: 'g', decimals: 3 },
      { key: 'V', label: 'V(vapour)', from: 'p.V' },
      { key: 'T', label: 'T', from: 'p.T' },
      { key: 'p', label: 'p', from: 'p.p' },
    ],
    reference: [
      { id: 'n', label: 'n(vapour)', formula: 'ideal-gas', solveFor: 'n', inputs: { p: 'g.p', V: 'g.V', T: 'g.T' } },
      { id: 'M', label: 'M', formula: 'moles-mass', solveFor: 'M', inputs: { m: 'g.m', n: 'n.n' } },
    ],
    answer: { node: 'M', label: 'M', unit: 'g/mol' },
    wordings: [
      'A sample of a volatile liquid with mass {m} was injected into a gas syringe and vaporised. The vapour occupied {V} at {T} and {p}. Calculate the relative molecular mass of the liquid.',
      '{m} of a liquid evaporates completely to give {V} of vapour at {T} and {p}. Find its Mr.',
    ],
    approachText: 'Mass of a liquid and the volume of its vapour at known temperature and pressure.',
    explanation: 'n = pV/RT, with p in Pa, V in m³ and T in K. Then M = m/n; Mr is the same number without units.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-water-of-crystallisation',
    topic: 'stoich',
    title: 'Water of crystallisation',
    difficulty: 2,
    params: {
      mh: { unit: 'g', min: 2, max: 6, decimals: 2 },
      Mh: { unit: 'g/mol', choices: [246.4], decimals: 1 },
      Ma: { unit: 'g/mol', choices: [120.4], decimals: 1 },
      Mw: { unit: 'g/mol', choices: [18.0], decimals: 1 },
    },
    setup: [
      { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'p.mh', M: 'p.Mh' } },
      { id: 'ma', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.n', M: 'p.Ma' } },
    ],
    given: [
      { key: 'mh', label: 'm(hydrated salt)', from: 'p.mh' },
      { key: 'ma', label: 'm(after heating)', from: 'n.ma', unit: 'g', decimals: 2 },
      { key: 'Ma', label: 'M(MgSO₄)', from: 'p.Ma' },
      { key: 'Mw', label: 'M(H₂O)', from: 'p.Mw' },
    ],
    reference: [
      { id: 'mw', label: 'm(water lost)', op: 'sub', inputs: ['g.mh', 'g.ma'] },
      { id: 'nw', label: 'n(H₂O)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'n.mw', M: 'g.Mw' } },
      { id: 'na', label: 'n(MgSO₄)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.ma', M: 'g.Ma' } },
      { id: 'x', label: 'x = n(H₂O) ÷ n(MgSO₄)', op: 'div', inputs: ['n.nw', 'n.na'] },
    ],
    answer: { node: 'x', label: 'x', unit: '1' },
    tolerance: 0.02,
    misconceptions: [
      {
        reference: [
          { id: 'mw', op: 'sub', inputs: ['g.mh', 'g.ma'] },
          { id: 'nw', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'n.mw', M: 'g.Mw' } },
          { id: 'na', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.mh', M: 'g.Ma' } },
          { id: 'x', op: 'div', inputs: ['n.nw', 'n.na'] },
        ],
        answer: 'x',
        message: 'The moles of MgSO₄ come from the anhydrous mass left after heating, not the starting mass of the hydrate.',
      },
    ],
    wordings: [
      'A student heated {mh} of hydrated magnesium sulfate, MgSO₄·xH₂O, to constant mass. The anhydrous MgSO₄ left weighed {ma}. Calculate x. M(MgSO₄) = {Ma}, M(H₂O) = {Mw}.',
      'Heating {mh} of MgSO₄·xH₂O drove off all the water, leaving {ma} of MgSO₄. Using M(MgSO₄) = {Ma} and M(H₂O) = {Mw}, find the value of x.',
    ],
    approachText: 'Mass of a hydrated salt before and after heating to constant mass.',
    explanation:
      'Mass of water lost = mass before − mass after. Convert both the water and the anhydrous salt to moles; x is their ratio. Heating to constant mass makes sure all the water has gone.',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-standard-solution-dilution',
    topic: 'stoich',
    title: 'Making and diluting a standard solution',
    difficulty: 2,
    params: {
      m: { unit: 'g', min: 1, max: 3, decimals: 3 },
      M: { unit: 'g/mol', choices: [106.0], decimals: 1 },
      Vf: { unit: 'cm3', choices: [250], decimals: 1 },
      V1: { unit: 'cm3', choices: [10, 25], decimals: 1 },
      V2: { unit: 'cm3', choices: [100, 250], decimals: 1 },
    },
    given: [
      { key: 'm', label: 'm(Na₂CO₃)', from: 'p.m' },
      { key: 'M', label: 'M(Na₂CO₃)', from: 'p.M' },
      { key: 'Vf', label: 'volumetric flask', from: 'p.Vf' },
      { key: 'V1', label: 'portion taken', from: 'p.V1' },
      { key: 'V2', label: 'diluted to', from: 'p.V2' },
    ],
    reference: [
      { id: 'n', label: 'n(Na₂CO₃)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.M' } },
      { id: 'c1', label: 'c of the standard solution', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.n', V: 'g.Vf' } },
      { id: 'c2', label: 'c after dilution', formula: 'dilution', solveFor: 'c2', inputs: { c1: 'n.c1', V1: 'g.V1', V2: 'g.V2' } },
    ],
    answer: { node: 'c2', label: 'c(diluted)', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [
          { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.M' } },
          { id: 'c1', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.n', V: 'g.Vf' } },
        ],
        answer: 'c1',
        message: 'That is the concentration in the flask. The portion was then diluted, which lowers it by V₁/V₂.',
      },
    ],
    wordings: [
      '{m} of anhydrous sodium carbonate (M = {M}) was dissolved and made up to {Vf} in a volumetric flask. A {V1} portion was then diluted to {V2} with distilled water. Calculate the concentration of the diluted solution.',
      'A standard solution was made by dissolving {m} of Na₂CO₃ (M = {M}) in water and making it up to {Vf}. {V1} of it was transferred to another volumetric flask and made up to {V2}. What is the final concentration?',
    ],
    approachText: 'Standard solution made from a weighed solid, then a portion diluted.',
    explanation: 'n = m/M; c = n/V with V in dm³. Diluting a portion: c₂ = c₁V₁/V₂ (the moles in the portion are unchanged).',
    levels: ['alevel'],
    reviewed: false,
  },
  {
    id: 'calc-al-number-of-atoms',
    topic: 'stoich',
    title: 'Number of atoms in a mass of compound',
    difficulty: 1,
    params: {
      m: { unit: 'g', min: 0.5, max: 50, sig: 3, log: true },
      M: { unit: 'g/mol', choices: [30.0], decimals: 1 },
    },
    given: [
      { key: 'm', label: 'm(C₂H₆)', from: 'p.m' },
      { key: 'M', label: 'M(C₂H₆)', from: 'p.M' },
    ],
    reference: [
      { id: 'n', label: 'n(C₂H₆)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.M' } },
      { id: 'N', label: 'Molecules', formula: 'particles', solveFor: 'N', inputs: { n: 'n.n' } },
      { id: 'H', label: 'H atoms (6 per molecule)', op: 'scale', inputs: ['n.N'], coef: 6 },
    ],
    answer: { node: 'H', label: 'Number of H atoms', unit: '1' },
    misconceptions: [
      {
        reference: [
          { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.m', M: 'g.M' } },
          { id: 'N', formula: 'particles', solveFor: 'N', inputs: { n: 'n.n' } },
        ],
        answer: 'N',
        message: 'That is the number of molecules. Each C₂H₆ molecule contains six hydrogen atoms.',
      },
    ],
    wordings: [
      'Calculate the number of hydrogen atoms in {m} of ethane, C₂H₆ (M = {M}). Use the Avogadro constant, 6.022 × 10²³ mol⁻¹.',
      'How many hydrogen atoms are there in {m} of ethane (C₂H₆, M = {M})?',
    ],
    approachText: 'Mass of a molecular compound; count the atoms of one element in it.',
    explanation: 'n = m/M, then molecules = n × N_A. Each ethane molecule has six H atoms, so multiply by 6.',
    levels: ['alevel'],
    reviewed: false,
  },
];
