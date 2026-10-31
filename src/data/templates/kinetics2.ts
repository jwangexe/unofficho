/** Steady-state, pre-equilibrium and other kinetics feed templates. */
import type { CalcTemplate } from '@/engine/template';

export const kineticsTemplates2: CalcTemplate[] = [
  {
    id: 'calc-ssa-keff',
    topic: 'kinetics',
    title: 'Steady state: A ⇌ I → P',
    difficulty: 2,
    params: {
      k1: { unit: '1/s', min: 1e-3, max: 10, log: true, sig: 2 },
      km1: { unit: '1/s', min: 10, max: 1e4, log: true, sig: 2 },
      r: { unit: '1', min: 0.2, max: 5, log: true },
    },
    setup: [{ id: 'k2', op: 'mul', inputs: ['p.r', 'p.km1'] }],
    given: [
      { key: 'k1', label: 'k₁', from: 'p.k1' },
      { key: 'km1', label: 'k₋₁', from: 'p.km1' },
      { key: 'k2', label: 'k₂', from: 'n.k2', sig: 2 },
    ],
    reference: [{ id: 'keff', formula: 'ssa-consecutive', solveFor: 'keff', inputs: { k1: 'g.k1', km1: 'g.km1', k2: 'g.k2' } }],
    answer: { node: 'keff', label: 'k_eff', unit: '1/s' },
    misconceptions: [
      {
        reference: [{ id: 'kobs', formula: 'pre-equilibrium', solveFor: 'kobs', inputs: { k1: 'g.k1', km1: 'g.km1', k2: 'g.k2' } }],
        answer: 'kobs',
        message: 'That is the pre-equilibrium result k₁k₂/k₋₁, which needs k₋₁ ≫ k₂. Here they are comparable: use the steady-state expression.',
      },
      {
        reference: [{ id: 'k', op: 'scale', inputs: ['g.k1'], coef: 1 }],
        answer: 'k',
        message: 'That takes the first step as rate-determining, which only holds when k₂ ≫ k₋₁.',
      },
    ],
    wordings: [
      'For A ⇌ I → P, k₁ = {k1}, k₋₁ = {km1} and k₂ = {k2}. Using the steady-state approximation for I, find the effective first-order rate constant for loss of A.',
      'A reacts through an intermediate: A ⇌ I (k₁ = {k1}, k₋₁ = {km1}), then I → P (k₂ = {k2}). Apply the steady-state approximation to I and find k_eff.',
    ],
    approachText: 'A ⇌ I → P with all three rate constants known; steady state on I.',
    explanation: 'Steady state on I: k₁[A] = (k₋₁ + k₂)[I], so rate = k₂[I] = k₁k₂[A]/(k₋₁ + k₂).',
    reviewed: false,
  },
  {
    id: 'calc-pre-eq-half-life',
    topic: 'kinetics',
    title: 'Pre-equilibrium then half-life',
    difficulty: 2,
    params: {
      k1: { unit: '1/s', min: 1e-2, max: 1e2, log: true, sig: 2 },
      km1: { unit: '1/s', min: 1e3, max: 1e6, log: true, sig: 2 },
      r: { unit: '1', min: 1e-4, max: 1e-2, log: true },
    },
    setup: [{ id: 'k2', op: 'mul', inputs: ['p.r', 'p.km1'] }],
    given: [
      { key: 'k1', label: 'k₁', from: 'p.k1' },
      { key: 'km1', label: 'k₋₁', from: 'p.km1' },
      { key: 'k2', label: 'k₂', from: 'n.k2', sig: 2 },
    ],
    reference: [
      { id: 'kobs', formula: 'pre-equilibrium', solveFor: 'kobs', inputs: { k1: 'g.k1', km1: 'g.km1', k2: 'g.k2' } },
      { id: 'thalf', formula: 'half-life-first', solveFor: 'thalf', inputs: { k: 'n.kobs' } },
    ],
    answer: { node: 'thalf', label: 't½', unit: 's' },
    misconceptions: [
      {
        reference: [{ id: 'thalf', formula: 'half-life-first', solveFor: 'thalf', inputs: { k: 'g.k2' } }],
        answer: 'thalf',
        message: 'k₂ alone ignores how little I is present: the observed constant is K₁k₂ = k₁k₂/k₋₁.',
      },
    ],
    wordings: [
      'In the mechanism A ⇌ I (fast; k₁ = {k1}, k₋₁ = {km1}) followed by I → P (slow; k₂ = {k2}), use the pre-equilibrium approximation to find the half-life of A.',
      'A rapidly equilibrates with I (k₁ = {k1}, k₋₁ = {km1}); I slowly gives P with k₂ = {k2}. What is the half-life of A?',
    ],
    approachText: 'A ⇌ I fast pre-equilibrium, then slow I → P; all rate constants known. Find the half-life of A.',
    explanation: 'Pre-equilibrium: [I] = K₁[A] with K₁ = k₁/k₋₁, so rate = k₂K₁[A] is first order with k_obs = k₁k₂/k₋₁; then t½ = ln 2/k_obs.',
    reviewed: false,
  },
  {
    id: 'calc-lindemann',
    topic: 'kinetics',
    title: 'Lindemann–Hinshelwood fall-off',
    difficulty: 2,
    params: {
      k1: { unit: 'dm3/(mol s)', min: 1e5, max: 1e8, log: true, sig: 2 },
      km1: { unit: 'dm3/(mol s)', min: 1e9, max: 1e10, log: true, sig: 2 },
      k2: { unit: '1/s', min: 1e5, max: 1e9, log: true, sig: 2 },
      M: { unit: 'mol/dm3', min: 1e-5, max: 1e-1, log: true, sig: 2 },
    },
    given: [
      { key: 'k1', label: 'k₁', from: 'p.k1' },
      { key: 'km1', label: 'k₋₁', from: 'p.km1' },
      { key: 'k2', label: 'k₂', from: 'p.k2' },
      { key: 'M', label: '[M]', from: 'p.M' },
    ],
    // Keep to the fall-off region, where neither limit applies.
    constraint: (v) => (v.km1! * v.M!) / v.k2! > 0.1 && (v.km1! * v.M!) / v.k2! < 10,
    reference: [
      { id: 'kuni', formula: 'lindemann', solveFor: 'kuni', inputs: { k1: 'g.k1', km1: 'g.km1', k2: 'g.k2', M: 'g.M' } },
    ],
    answer: { node: 'kuni', label: 'k_uni', unit: '1/s' },
    misconceptions: [
      {
        reference: [
          { id: 'k12', op: 'mul', inputs: ['g.k1', 'g.k2'] },
          { id: 'kinf', op: 'div', inputs: ['n.k12', 'g.km1'] },
        ],
        answer: 'kinf',
        message: 'That is the high-pressure limit k₁k₂/k₋₁. At this [M], deactivation and reaction of A* compete.',
      },
      {
        reference: [{ id: 'k0', op: 'mul', inputs: ['g.k1', 'g.M'] }],
        answer: 'k0',
        message: 'That is the low-pressure limit k₁[M]. At this [M], deactivation of A* is not negligible.',
      },
    ],
    wordings: [
      'A unimolecular reaction follows the Lindemann mechanism with k₁ = {k1}, k₋₁ = {km1}, k₂ = {k2}. Find k_uni when [M] = {M}.',
      'For A + M ⇌ A* + M (k₁ = {k1}, k₋₁ = {km1}), A* → P (k₂ = {k2}), calculate the effective first-order rate constant at [M] = {M}.',
    ],
    approachText: 'Lindemann mechanism with k₁, k₋₁, k₂ and [M] known; find the effective unimolecular rate constant.',
    explanation: 'Steady state on A*: k_uni = k₁k₂[M]/(k₋₁[M] + k₂). It tends to k₁k₂/k₋₁ at high [M] and k₁[M] at low [M].',
    reviewed: false,
  },
  {
    id: 'calc-michaelis',
    topic: 'kinetics',
    title: 'Michaelis–Menten rate',
    difficulty: 1,
    params: {
      Vmax: { unit: 'mol/(dm3 s)', min: 1e-6, max: 1e-3, log: true, sig: 2 },
      Km: { unit: 'mol/dm3', min: 1e-5, max: 1e-2, log: true, sig: 2 },
      r: { unit: '1', min: 0.1, max: 10, log: true },
    },
    setup: [{ id: 'S', op: 'mul', inputs: ['p.r', 'p.Km'] }],
    given: [
      { key: 'Vmax', label: 'V_max', from: 'p.Vmax' },
      { key: 'Km', label: 'K_M', from: 'p.Km' },
      { key: 'S', label: '[S]', from: 'n.S', sig: 2 },
    ],
    reference: [{ id: 'v', formula: 'michaelis-menten', solveFor: 'v', inputs: { Vmax: 'g.Vmax', Km: 'g.Km', S: 'g.S' } }],
    answer: { node: 'v', label: 'v', unit: 'mol/(dm3 s)' },
    misconceptions: [
      {
        reference: [
          { id: 'VS', op: 'mul', inputs: ['g.Vmax', 'g.S'] },
          { id: 'v', op: 'div', inputs: ['n.VS', 'g.Km'] },
        ],
        answer: 'v',
        message: 'That ignores saturation: v = V_max[S]/(K_M + [S]), not V_max[S]/K_M.',
      },
    ],
    wordings: [
      'An enzyme has V_max = {Vmax} and K_M = {Km}. What is the initial rate at [S] = {S}?',
      'Find the initial rate of an enzyme-catalysed reaction at [S] = {S}, given K_M = {Km} and V_max = {Vmax}.',
    ],
    explanation: 'v = V_max[S]/(K_M + [S]). At [S] = K_M the rate is exactly half of V_max.',
    reviewed: false,
  },
  {
    id: 'calc-radioactive-time',
    topic: 'kinetics',
    title: 'Radioactive decay: elapsed time',
    difficulty: 1,
    params: {
      thalf: { unit: 'yr', min: 1, max: 1e4, log: true, sig: 3 },
      N0: { unit: 'mg', min: 1, max: 100, sig: 3 },
      f: { unit: '1', min: 0.05, max: 0.9 },
    },
    setup: [{ id: 'N', op: 'mul', inputs: ['p.f', 'p.N0'] }],
    given: [
      { key: 'thalf', label: 't½', from: 'p.thalf' },
      { key: 'N0', label: 'N₀', from: 'p.N0' },
      { key: 'N', label: 'N', from: 'n.N', sig: 3 },
    ],
    reference: [{ id: 't', formula: 'radioactive-decay', solveFor: 't', inputs: { N: 'g.N', N0: 'g.N0', thalf: 'g.thalf' } }],
    answer: { node: 't', label: 't', unit: 'yr' },
    wordings: [
      'A sample initially contains {N0} of a radioisotope with t½ = {thalf}. How long until only {N} remains?',
      'A radioisotope (half-life {thalf}) decays from {N0} to {N}. How much time has passed?',
    ],
    explanation: 't = t½ · ln(N₀/N) / ln 2.',
    reviewed: false,
  },
  {
    id: 'calc-eyring-dg',
    topic: 'kinetics',
    title: 'ΔG‡ from a rate constant',
    difficulty: 2,
    params: {
      k: { unit: '1/s', min: 1e-4, max: 1e3, log: true, sig: 2 },
      T: { unit: 'K', min: 273, max: 373, decimals: 0 },
    },
    given: [
      { key: 'k', label: 'k', from: 'p.k' },
      { key: 'T', label: 'T', from: 'p.T' },
    ],
    reference: [{ id: 'dGa', formula: 'eyring', solveFor: 'dGa', inputs: { k: 'g.k', T: 'g.T' } }],
    answer: { node: 'dGa', label: 'ΔG‡', unit: 'kJ/mol' },
    wordings: [
      'A unimolecular reaction has k = {k} at {T}. Use the Eyring equation to find ΔG‡.',
      'What is the Gibbs energy of activation for a first-order process with k = {k} at {T}?',
    ],
    explanation: 'ΔG‡ = RT ln(k_BT / hk). At 298 K, k_BT/h ≈ 6.2 × 10¹² s⁻¹.',
    reviewed: false,
  },
];
