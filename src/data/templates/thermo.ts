import type { CalcTemplate } from '@/engine/template';

const T = { unit: 'K', min: 273, max: 800, decimals: 0, displayUnits: ['K', 'K', 'degC'] };

export const thermoTemplates: CalcTemplate[] = [
  {
    id: 'calc-gibbs-dg',
    topic: 'thermo',
    title: 'ΔG from ΔH and ΔS',
    difficulty: 1,
    params: {
      dH: { unit: 'kJ/mol', min: -250, max: 250 },
      dS: { unit: 'J/(K mol)', min: -250, max: 250 },
      T: { ...T, max: 1000 },
    },
    given: [
      { key: 'dH', label: 'ΔH', from: 'p.dH' },
      { key: 'dS', label: 'ΔS', from: 'p.dS' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    constraint: (v) => Math.abs(v.answer!) > 2000,
    reference: [{ id: 'dG', formula: 'gibbs', solveFor: 'dG', inputs: { dH: 'g.dH', dS: 'g.dS', T: 'g.T' } }],
    answer: { node: 'dG', label: 'ΔG', unit: 'kJ/mol' },
    wordings: [
      'A reaction has ΔH = {dH} and ΔS = {dS}. Calculate ΔG at {T}.',
      'For a process with ΔH = {dH} and ΔS = {dS}, find the Gibbs energy change at {T}.',
      'At {T}, what is ΔG for a reaction with ΔH = {dH} and ΔS = {dS}?',
    ],
    explanation:
      'ΔG = ΔH − TΔS. ΔH is usually in kJ mol⁻¹ and ΔS in J K⁻¹ mol⁻¹, so put them in the same units before combining, and use T in kelvin.',
    levels: ['alevel', 'c3l6', 'ukcho1', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-k-from-dg0',
    topic: 'thermo',
    title: 'K from ΔG°',
    difficulty: 1,
    params: {
      dG0: { unit: 'kJ/mol', min: -60, max: 60 },
      T: { ...T, max: 500 },
    },
    given: [
      { key: 'dG0', label: 'ΔG°', from: 'p.dG0' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    constraint: (v) => Math.abs(v.dG0!) > 1000,
    reference: [{ id: 'K', formula: 'gibbs-k', solveFor: 'K', inputs: { dG0: 'g.dG0', T: 'g.T' } }],
    answer: { node: 'K', label: 'K', unit: '1' },
    misconceptions: [
      {
        reference: [
          { id: 'RT', op: 'mul', inputs: ['c.R', 'g.T'] },
          { id: 'x', op: 'div', inputs: ['g.dG0', 'n.RT'] },
          { id: 'mx', op: 'scale', inputs: ['n.x'], coef: -1 },
          { id: 'K10', op: 'pow10', inputs: ['n.mx'] },
        ],
        answer: 'K10',
        message: 'That is 10^(−ΔG°/RT). ΔG° = −RT ln K uses the natural log, so K = e^(−ΔG°/RT).',
      },
    ],
    wordings: [
      'ΔG° for a reaction is {dG0} at {T}. Calculate the equilibrium constant K.',
      'Find K at {T} for a reaction with ΔG° = {dG0}.',
      'A reaction has a standard Gibbs energy change of {dG0} at {T}. What is K?',
    ],
    explanation: 'Rearrange ΔG° = −RT ln K to K = exp(−ΔG°/RT), with ΔG° in J mol⁻¹ and T in kelvin.',
    levels: ['ukcho1', 'ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-dg0-from-k',
    topic: 'thermo',
    title: 'ΔG° from K',
    difficulty: 1,
    params: {
      K: { unit: '1', min: 1e-10, max: 1e10, log: true, sig: 2 },
      T: { ...T, max: 450 },
    },
    given: [
      { key: 'K', label: 'K', from: 'p.K' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    constraint: (v) => Math.abs(Math.log(v.K!)) > 0.5,
    reference: [{ id: 'dG0', formula: 'gibbs-k', solveFor: 'dG0', inputs: { K: 'g.K', T: 'g.T' } }],
    answer: { node: 'dG0', label: 'ΔG°', unit: 'kJ/mol' },
    wordings: [
      'The equilibrium constant of a reaction is {K} at {T}. Calculate ΔG°.',
      'At {T}, K = {K}. What is the standard Gibbs energy change?',
    ],
    explanation: 'ΔG° = −RT ln K. A K above 1 gives a negative ΔG°.',
    levels: ['ukcho1', 'ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-k-from-dh-ds',
    topic: 'thermo',
    title: 'K from ΔH° and ΔS°',
    difficulty: 2,
    params: {
      dH: { unit: 'kJ/mol', min: -150, max: 150 },
      dS: { unit: 'J/(K mol)', min: -200, max: 200 },
      T: T,
    },
    given: [
      { key: 'dH', label: 'ΔH°', from: 'p.dH' },
      { key: 'dS', label: 'ΔS°', from: 'p.dS' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    constraint: (v) => v.answer! > 1e-15 && v.answer! < 1e15 && Math.abs(Math.log(v.answer!)) > 0.5,
    reference: [
      { id: 'dG', formula: 'gibbs', solveFor: 'dG', inputs: { dH: 'g.dH', dS: 'g.dS', T: 'g.T' } },
      { id: 'K', formula: 'gibbs-k', solveFor: 'K', inputs: { dG0: 'n.dG', T: 'g.T' } },
    ],
    answer: { node: 'K', label: 'K', unit: '1' },
    wordings: [
      'For a reaction, ΔH° = {dH} and ΔS° = {dS}. Calculate K at {T}, assuming both are independent of temperature.',
      'Estimate the equilibrium constant at {T} for a reaction with ΔH° = {dH} and ΔS° = {dS}.',
    ],
    explanation: 'Two steps: ΔG° = ΔH° − TΔS°, then K = exp(−ΔG°/RT).',
    levels: ['ukcho1', 'ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-vant-hoff',
    topic: 'thermo',
    title: "van 't Hoff: K at a new temperature",
    difficulty: 2,
    params: {
      K1: { unit: '1', min: 1e-4, max: 1e4, log: true },
      T1: { unit: 'K', min: 290, max: 310, decimals: 0 },
      T2: { unit: 'K', min: 330, max: 600, decimals: 0 },
      dH0: { unit: 'kJ/mol', min: -120, max: 120 },
    },
    given: [
      { key: 'K1', label: 'K₁', from: 'p.K1' },
      { key: 'T1', label: 'T₁', from: 'p.T1' },
      { key: 'T2', label: 'T₂', from: 'p.T2' },
      { key: 'dH0', label: 'ΔH°', from: 'p.dH0' },
    ],
    constraint: (v) => Math.abs(v.dH0!) > 10000,
    reference: [
      { id: 'K2', formula: 'vant-hoff', solveFor: 'K2', inputs: { K1: 'g.K1', T1: 'g.T1', T2: 'g.T2', dH0: 'g.dH0' } },
    ],
    answer: { node: 'K2', label: 'K₂', unit: '1' },
    misconceptions: [
      {
        reference: [
          { id: 'mdH', op: 'scale', inputs: ['g.dH0'], coef: -1 },
          { id: 'K2', formula: 'vant-hoff', solveFor: 'K2', inputs: { K1: 'g.K1', T1: 'g.T1', T2: 'g.T2', dH0: 'n.mdH' } },
        ],
        answer: 'K2',
        message: "Sign slip in the van 't Hoff exponent: for an endothermic reaction K must increase with temperature.",
      },
    ],
    wordings: [
      'K = {K1} at {T1}, and ΔH° = {dH0}. Estimate K at {T2}.',
      'A reaction with ΔH° = {dH0} has K = {K1} at {T1}. What is K at {T2}, assuming ΔH° is constant?',
    ],
    explanation: "ln(K₂/K₁) = −(ΔH°/R)(1/T₂ − 1/T₁). Raising T favours the endothermic direction.",
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
];
