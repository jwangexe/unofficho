import type { CalcTemplate } from '@/engine/template';

export const electroTemplates: CalcTemplate[] = [
  {
    id: 'calc-gibbs-emf',
    topic: 'electro',
    title: 'ΔG° from E°',
    difficulty: 1,
    params: {
      n: { unit: '1', choices: [1, 2, 3, 4, 6], decimals: 0 },
      E0: { unit: 'V', min: -1.5, max: 2.5, decimals: 2 },
    },
    given: [
      { key: 'n', label: 'n', from: 'p.n' },
      { key: 'E0', label: 'E°', from: 'p.E0' },
    ],
    constraint: (v) => Math.abs(v.E0!) >= 0.05,
    reference: [{ id: 'dG0', formula: 'gibbs-emf', solveFor: 'dG0', inputs: { n: 'g.n', E0: 'g.E0' } }],
    answer: { node: 'dG0', label: 'ΔG°', unit: 'kJ/mol' },
    wordings: [
      'A cell reaction transfers {n} electrons and has E° = {E0}. Calculate ΔG°.',
      'For a redox reaction with n = {n} and E°cell = {E0}, what is ΔG°?',
    ],
    explanation: 'ΔG° = −nFE°. A positive E° means a spontaneous cell (negative ΔG°).',
    levels: ['ukcho1', 'ukcho2', 'icho'],
    reviewed: false,
  },
  {
    id: 'calc-nernst',
    topic: 'electro',
    title: 'Nernst equation',
    difficulty: 2,
    params: {
      E0: { unit: 'V', min: -1.0, max: 2.0, decimals: 2 },
      n: { unit: '1', choices: [1, 2, 3], decimals: 0 },
      Q: { unit: '1', min: 1e-4, max: 1e4, log: true, sig: 2 },
      T: { unit: 'K', choices: [298], decimals: 0 },
    },
    given: [
      { key: 'E0', label: 'E°', from: 'p.E0' },
      { key: 'n', label: 'n', from: 'p.n' },
      { key: 'Q', label: 'Q', from: 'p.Q' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    constraint: (v) => Math.abs(Math.log10(v.Q!)) > 0.5,
    reference: [{ id: 'E', formula: 'nernst', solveFor: 'E', inputs: { E0: 'g.E0', n: 'g.n', Q: 'g.Q', T: 'g.T' } }],
    answer: { node: 'E', label: 'E', unit: 'V' },
    tolerance: { abs: 0.005 },
    misconceptions: [
      {
        reference: [{ id: 'E', formula: 'nernst', solveFor: 'E', inputs: { E0: 'g.E0', n: '#1', Q: 'g.Q', T: 'g.T' } }],
        answer: 'E',
        message: 'n seems to be missing: the correction is (RT/nF) ln Q.',
      },
      {
        reference: [
          { id: 'invQ', op: 'div', inputs: ['#1', 'g.Q'] },
          { id: 'E', formula: 'nernst', solveFor: 'E', inputs: { E0: 'g.E0', n: 'g.n', Q: 'n.invQ', T: 'g.T' } },
        ],
        answer: 'E',
        message: 'Sign slip: E = E° − (RT/nF) ln Q, so a larger Q lowers E.',
      },
    ],
    wordings: [
      'A cell has E° = {E0} with n = {n}. Find E at {T} when Q = {Q}.',
      'For a cell reaction with n = {n} and E° = {E0}, calculate the cell potential at {T} if Q = {Q}.',
    ],
    explanation: 'E = E° − (RT/nF) ln Q. At 298 K that is E° − (0.0592/n) log₁₀ Q.',
    levels: ['ukcho2', 'icho'],
    reviewed: false,
  },
];
