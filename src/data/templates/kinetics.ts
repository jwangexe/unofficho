import type { CalcTemplate } from '@/engine/template';

export const kineticsTemplates: CalcTemplate[] = [
  {
    id: 'calc-first-order-remaining',
    topic: 'kinetics',
    title: 'First order: concentration after time t',
    difficulty: 2,
    params: {
      thalf: { unit: 'min', min: 2, max: 60, sig: 2 },
      t: { unit: 'min', min: 5, max: 150, sig: 2, displayUnits: ['min', 'min', 's'] },
      A0: { unit: 'mol/dm3', min: 0.02, max: 0.5, sig: 2 },
    },
    given: [
      { key: 'thalf', label: 't½', from: 'p.thalf' },
      { key: 't', label: 't', from: 'p.t' },
      { key: 'A0', label: '[A]₀', from: 'p.A0' },
    ],
    constraint: (v) => v.t! / v.thalf! < 6 && v.t! / v.thalf! > 0.3,
    reference: [
      { id: 'k', formula: 'half-life-first', solveFor: 'k', inputs: { thalf: 'g.thalf' } },
      { id: 'A', formula: 'first-order', solveFor: 'A', inputs: { A0: 'g.A0', k: 'n.k', t: 'g.t' } },
    ],
    answer: { node: 'A', label: '[A]', unit: 'mol/dm3' },
    misconceptions: [
      {
        reference: [
          { id: 'k0', formula: 'half-life-zero', solveFor: 'k', inputs: { thalf: 'g.thalf', A0: 'g.A0' } },
          { id: 'A', formula: 'zero-order', solveFor: 'A', inputs: { A0: 'g.A0', k: 'n.k0', t: 'g.t' } },
        ],
        answer: 'A',
        message: 'That is the zero-order result. A constant half-life is the signature of first-order kinetics.',
      },
      {
        reference: [
          { id: 'k2', formula: 'half-life-second', solveFor: 'k', inputs: { thalf: 'g.thalf', A0: 'g.A0' } },
          { id: 'A', formula: 'second-order', solveFor: 'A', inputs: { A0: 'g.A0', k: 'n.k2', t: 'g.t' } },
        ],
        answer: 'A',
        message: 'That is the second-order result. The question says first order: use [A] = [A]₀e^(−kt).',
      },
    ],
    wordings: [
      'A first-order reaction has a half-life of {thalf}. Starting from [A]₀ = {A0}, what is [A] after {t}?',
      'The decomposition of A is first order with t½ = {thalf}. If [A]₀ = {A0}, find [A] at t = {t}.',
    ],
    explanation: 'k = ln 2 / t½, then [A] = [A]₀ e^(−kt). Keep k and t in the same time units.',
    reviewed: false,
  },
  {
    id: 'calc-arrhenius-ea',
    topic: 'kinetics',
    title: 'Activation energy from two rate constants',
    difficulty: 2,
    params: {
      Ea: { unit: 'kJ/mol', min: 40, max: 150 },
      T1: { unit: 'K', min: 280, max: 320, decimals: 0 },
      dT: { unit: 'K', kind: 'delta-temp', min: 10, max: 50, decimals: 0 },
      k1: { unit: '1/s', min: 1e-5, max: 1e2, log: true },
    },
    setup: [
      { id: 'T2', op: 'add', inputs: ['p.T1', 'p.dT'] },
      { id: 'k2', formula: 'arrhenius-two-point', solveFor: 'k2', inputs: { k1: 'p.k1', T1: 'p.T1', T2: 'n.T2', Ea: 'p.Ea' } },
    ],
    given: [
      { key: 'k1', label: 'k₁', from: 'p.k1' },
      { key: 'T1', label: 'T₁', from: 'p.T1', decimals: 0, displayUnits: ['K', 'K', 'degC'] },
      { key: 'k2', label: 'k₂', from: 'n.k2', sig: 3 },
      { key: 'T2', label: 'T₂', from: 'n.T2', decimals: 0, displayUnits: ['K', 'K', 'degC'] },
    ],
    reference: [
      { id: 'Ea', formula: 'arrhenius-two-point', solveFor: 'Ea', inputs: { k1: 'g.k1', k2: 'g.k2', T1: 'g.T1', T2: 'g.T2' } },
    ],
    answer: { node: 'Ea', label: 'Eₐ', unit: 'kJ/mol' },
    tolerance: 0.02,
    wordings: [
      'A rate constant is {k1} at {T1} and {k2} at {T2}. Calculate the activation energy.',
      'k rises from {k1} at {T1} to {k2} at {T2}. Find Eₐ.',
    ],
    explanation: 'ln(k₂/k₁) = −(Eₐ/R)(1/T₂ − 1/T₁). Use the natural log and temperatures in kelvin.',
    reviewed: false,
  },
  {
    id: 'calc-second-order-half-life',
    topic: 'kinetics',
    title: 'Second-order half-life',
    difficulty: 1,
    params: {
      k: { unit: 'dm3/(mol s)', min: 1e-3, max: 10, log: true, sig: 2 },
      A0: { unit: 'mol/dm3', min: 0.01, max: 1, sig: 2 },
    },
    given: [
      { key: 'k', label: 'k', from: 'p.k' },
      { key: 'A0', label: '[A]₀', from: 'p.A0' },
    ],
    reference: [{ id: 'thalf', formula: 'half-life-second', solveFor: 'thalf', inputs: { k: 'g.k', A0: 'g.A0' } }],
    answer: { node: 'thalf', label: 't½', unit: 's' },
    misconceptions: [
      {
        reference: [
          { id: 'kk', op: 'mul', inputs: ['g.k', 'g.A0'] },
          { id: 'thalf', op: 'div', inputs: ['#0.6931471805599453', 'n.kk'] },
        ],
        answer: 'thalf',
        message: 'ln 2 belongs to the first-order half-life. For second order, t½ = 1/(k[A]₀).',
      },
    ],
    wordings: [
      'A second-order reaction (rate = k[A]²) has k = {k}. What is the first half-life when [A]₀ = {A0}?',
      'For 2A → products with rate = k[A]², k = {k} and [A]₀ = {A0}. Find t½.',
    ],
    explanation: 't½ = 1/(k[A]₀). Unlike first order, it depends on the starting concentration.',
    reviewed: false,
  },
];
