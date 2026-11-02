import type { CalcTemplate } from '@/engine/template';

export const equilibriumTemplates: CalcTemplate[] = [
  {
    id: 'calc-weak-acid-ph',
    topic: 'equilibrium',
    title: 'pH of a weak acid',
    difficulty: 2,
    params: {
      Ka: { unit: '1', min: 1e-6, max: 1e-3, log: true, sig: 2 },
      c: { unit: 'mol/dm3', min: 0.01, max: 0.5, sig: 2 },
    },
    given: [
      { key: 'Ka', label: 'Kₐ', from: 'p.Ka' },
      { key: 'c', label: 'c', from: 'p.c' },
    ],
    // Keep the x ≪ c approximation valid (under 5 % dissociation).
    constraint: (v) => v.Ka! / (v.c! / 1000) < 0.0025,
    reference: [
      { id: 'H', formula: 'weak-acid-approx', solveFor: 'H', inputs: { Ka: 'g.Ka', c: 'g.c' } },
      { id: 'pH', formula: 'ph', solveFor: 'pH', inputs: { H: 'n.H' } },
    ],
    answer: { node: 'pH', label: 'pH', unit: '1' },
    tolerance: { abs: 0.02 },
    misconceptions: [
      {
        reference: [
          { id: 'Kc', op: 'mul', inputs: ['g.Ka', 'g.c'] },
          { id: 'pH', formula: 'ph', solveFor: 'pH', inputs: { H: 'n.Kc' } },
        ],
        answer: 'pH',
        message: 'You forgot the square root: [H⁺] ≈ √(Kₐc).',
      },
      {
        reference: [{ id: 'pH', formula: 'ph', solveFor: 'pH', inputs: { H: 'g.c' } }],
        answer: 'pH',
        message: 'That treats HA as a strong acid ([H⁺] = c). A weak acid is only slightly dissociated.',
      },
    ],
    wordings: [
      'Calculate the pH of a {c} solution of a weak acid HA (Kₐ = {Ka}).',
      'A weak monoprotic acid has Kₐ = {Ka}. What is the pH of a {c} solution?',
    ],
    explanation: '[H⁺] ≈ √(Kₐc) when dissociation is small (check: [H⁺]/c < 5 %), then pH = −log₁₀[H⁺].',
    reviewed: false,
  },
  {
    id: 'calc-buffer-ph',
    topic: 'equilibrium',
    title: 'Buffer pH (Henderson–Hasselbalch)',
    difficulty: 1,
    params: {
      pKa: { unit: '1', min: 3, max: 10, decimals: 2 },
      nA: { unit: 'mmol', min: 5, max: 100, sig: 2 },
      nHA: { unit: 'mmol', min: 5, max: 100, sig: 2 },
    },
    given: [
      { key: 'pKa', label: 'pKₐ', from: 'p.pKa' },
      { key: 'nA', label: 'n(A⁻)', from: 'p.nA' },
      { key: 'nHA', label: 'n(HA)', from: 'p.nHA' },
    ],
    constraint: (v) => v.nA! / v.nHA! > 0.1 && v.nA! / v.nHA! < 10 && Math.abs(Math.log10(v.nA! / v.nHA!)) > 0.05,
    reference: [
      { id: 'pH', formula: 'henderson-hasselbalch', solveFor: 'pH', inputs: { pKa: 'g.pKa', Am: 'g.nA', HA: 'g.nHA' } },
    ],
    answer: { node: 'pH', label: 'pH', unit: '1' },
    tolerance: { abs: 0.02 },
    misconceptions: [
      {
        reference: [
          { id: 'pH', formula: 'henderson-hasselbalch', solveFor: 'pH', inputs: { pKa: 'g.pKa', Am: 'g.nHA', HA: 'g.nA' } },
        ],
        answer: 'pH',
        message: 'The ratio is upside down: pH = pKₐ + log₁₀([A⁻]/[HA]).',
      },
    ],
    wordings: [
      'A buffer contains {nA} of NaA and {nHA} of HA (pKₐ = {pKa}) in the same solution. What is its pH?',
      'Find the pH of a solution made from {nHA} of a weak acid (pKₐ = {pKa}) and {nA} of its sodium salt.',
    ],
    explanation: 'Both species share one volume, so the mole ratio equals the concentration ratio: pH = pKₐ + log₁₀(n(A⁻)/n(HA)).',
    reviewed: true,
  },
  {
    id: 'calc-ideal-gas-n',
    topic: 'thermo',
    title: 'Moles of an ideal gas',
    difficulty: 1,
    params: {
      p: { unit: 'kPa', min: 50, max: 500, displayUnits: ['kPa', 'bar', 'atm'] },
      V: { unit: 'dm3', min: 0.1, max: 50, displayUnits: ['dm3', 'dm3', 'cm3'] },
      T: { unit: 'K', min: 250, max: 600, decimals: 0, displayUnits: ['K', 'degC'] },
    },
    given: [
      { key: 'p', label: 'p', from: 'p.p' },
      { key: 'V', label: 'V', from: 'p.V' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    reference: [{ id: 'n', formula: 'ideal-gas', solveFor: 'n', inputs: { p: 'g.p', V: 'g.V', T: 'g.T' } }],
    answer: { node: 'n', label: 'n', unit: 'mol' },
    wordings: [
      'How many moles of an ideal gas occupy {V} at {p} and {T}?',
      'A sample of gas fills {V} at {T} and {p}. Calculate the amount in moles.',
    ],
    explanation: 'n = pV/RT in SI units: Pa × m³ (or kPa × dm³, which also gives J) and T in kelvin.',
    reviewed: false,
  },
];
