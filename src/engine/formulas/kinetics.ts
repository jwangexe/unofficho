import { D } from '../dims';
import { defineFormula } from '../formula';
import { h, kB, R } from '../constants';
import { conc, firstOrderK, molarEnergy, T1, T2, temp, time } from './vars';

const ln = Math.log;

const A = conc('A', '[A]', '[\\mathrm{A}]', 'Concentration at time t');
const A0 = conc('A0', '[A]₀', '[\\mathrm{A}]_0', 'Initial concentration');
const k0 = { sym: 'k', label: 'k', latex: 'k', name: 'Rate constant (zero order)', dim: D.rate, unit: 'mol/(dm3 s)' } as const;
const k2 = { sym: 'k', label: 'k', latex: 'k', name: 'Rate constant (second order)', dim: D.rateConst2, unit: 'dm3/(mol s)' } as const;
const thalf = time('thalf', 't½', 't_{1/2}', { name: 'Half-life' });

export const kinetics = [
  defineFormula({
    id: 'zero-order',
    name: 'Zero-order integrated rate law',
    topic: 'kinetics',
    latex: '[\\mathrm{A}] = [\\mathrm{A}]_0 - kt',
    vars: [A, A0, k0, time()],
    relation: (v) => [v.A!, v.A0! - v.k! * v.t!],
    rearranged: {
      A: '[\\mathrm{A}] = [\\mathrm{A}]_0 - kt',
      A0: '[\\mathrm{A}]_0 = [\\mathrm{A}] + kt',
      k: 'k = \\dfrac{[\\mathrm{A}]_0 - [\\mathrm{A}]}{t}',
      t: 't = \\dfrac{[\\mathrm{A}]_0 - [\\mathrm{A}]}{k}',
    },
    notes: 'Only valid while [A] > 0.',
    examples: [{ A0: 0.5, k: 1.0e-3, t: 200 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'first-order',
    name: 'First-order integrated rate law',
    topic: 'kinetics',
    latex: '\\ln\\dfrac{[\\mathrm{A}]_0}{[\\mathrm{A}]} = kt',
    vars: [
      { ...A, dim: { any: 'amount' }, name: 'Amount at time t (any proportional measure)' },
      { ...A0, dim: { any: 'amount' }, name: 'Initial amount (same units)' },
      firstOrderK(),
      time(),
    ],
    relation: (v) => [ln(v.A0! / v.A!), v.k! * v.t!],
    rearranged: {
      A: '[\\mathrm{A}] = [\\mathrm{A}]_0\\,e^{-kt}',
      A0: '[\\mathrm{A}]_0 = [\\mathrm{A}]\\,e^{kt}',
      k: 'k = \\dfrac{1}{t}\\ln\\dfrac{[\\mathrm{A}]_0}{[\\mathrm{A}]}',
      t: 't = \\dfrac{1}{k}\\ln\\dfrac{[\\mathrm{A}]_0}{[\\mathrm{A}]}',
    },
    notes: 'Any quantity proportional to [A] works (pressure, absorbance, mass), as long as both use the same units.',
    examples: [{ A0: 0.1, k: 2.5e-3, t: 300 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'second-order',
    name: 'Second-order integrated rate law',
    topic: 'kinetics',
    latex: '\\dfrac{1}{[\\mathrm{A}]} = \\dfrac{1}{[\\mathrm{A}]_0} + kt',
    vars: [A, A0, k2, time()],
    relation: (v) => [1 / v.A!, 1 / v.A0! + v.k! * v.t!],
    rearranged: {
      A: '[\\mathrm{A}] = \\dfrac{[\\mathrm{A}]_0}{1 + kt[\\mathrm{A}]_0}',
      A0: '\\dfrac{1}{[\\mathrm{A}]_0} = \\dfrac{1}{[\\mathrm{A}]} - kt',
      k: 'k = \\dfrac{1}{t}\\left(\\dfrac{1}{[\\mathrm{A}]} - \\dfrac{1}{[\\mathrm{A}]_0}\\right)',
      t: 't = \\dfrac{1}{k}\\left(\\dfrac{1}{[\\mathrm{A}]} - \\dfrac{1}{[\\mathrm{A}]_0}\\right)',
    },
    notes: 'For rate = k[A]². (Some texts define rate = −½ d[A]/dt for 2A → P, which doubles the apparent k.)',
    examples: [{ A0: 0.05, k: 0.25, t: 120 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'half-life-zero',
    name: 'Half-life (zero order)',
    topic: 'kinetics',
    latex: 't_{1/2} = \\dfrac{[\\mathrm{A}]_0}{2k}',
    vars: [thalf, A0, k0],
    relation: (v) => [v.thalf!, v.A0! / (2 * v.k!)],
    rearranged: {
      thalf: 't_{1/2} = \\dfrac{[\\mathrm{A}]_0}{2k}',
      A0: '[\\mathrm{A}]_0 = 2kt_{1/2}',
      k: 'k = \\dfrac{[\\mathrm{A}]_0}{2t_{1/2}}',
    },
    examples: [{ A0: 0.4, k: 2.0e-4 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'half-life-first',
    name: 'Half-life (first order)',
    topic: 'kinetics',
    latex: 't_{1/2} = \\dfrac{\\ln 2}{k}',
    vars: [thalf, firstOrderK()],
    relation: (v) => [v.thalf!, Math.LN2 / v.k!],
    rearranged: {
      thalf: 't_{1/2} = \\dfrac{\\ln 2}{k}',
      k: 'k = \\dfrac{\\ln 2}{t_{1/2}}',
    },
    notes: 'Also the decay constant λ for radioactive decay.',
    examples: [{ k: 1.5e-4 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'half-life-second',
    name: 'Half-life (second order)',
    topic: 'kinetics',
    latex: 't_{1/2} = \\dfrac{1}{k[\\mathrm{A}]_0}',
    vars: [thalf, k2, A0],
    relation: (v) => [v.thalf!, 1 / (v.k! * v.A0!)],
    rearranged: {
      thalf: 't_{1/2} = \\dfrac{1}{k[\\mathrm{A}]_0}',
      k: 'k = \\dfrac{1}{t_{1/2}[\\mathrm{A}]_0}',
      A0: '[\\mathrm{A}]_0 = \\dfrac{1}{kt_{1/2}}',
    },
    examples: [{ k: 0.3, A0: 0.02 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'arrhenius',
    name: 'Arrhenius equation',
    topic: 'kinetics',
    latex: 'k = A\\,e^{-E_\\mathrm{a}/RT}',
    vars: [
      { ...firstOrderK(), dim: { any: 'k' } },
      { sym: 'A', label: 'A', latex: 'A', name: 'Pre-exponential factor (same units as k)', dim: { any: 'k' }, unit: '1/s' },
      molarEnergy('Ea', 'Eₐ', 'E_\\mathrm{a}', 'Activation energy', { sign: 'positive' }),
      temp(),
    ],
    relation: (v) => [ln(v.k! / v.A!), -v.Ea! / (R * v.T!)],
    rearranged: {
      k: 'k = A\\,e^{-E_\\mathrm{a}/RT}',
      A: 'A = k\\,e^{E_\\mathrm{a}/RT}',
      Ea: 'E_\\mathrm{a} = RT\\ln\\dfrac{A}{k}',
      T: 'T = \\dfrac{E_\\mathrm{a}}{R\\ln(A/k)}',
    },
    examples: [{ A: 1.0e13, Ea: 80, T: 298 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'arrhenius-two-point',
    name: 'Arrhenius equation (two-point)',
    topic: 'kinetics',
    latex: '\\ln\\dfrac{k_2}{k_1} = -\\dfrac{E_\\mathrm{a}}{R}\\left(\\dfrac{1}{T_2}-\\dfrac{1}{T_1}\\right)',
    vars: [
      { ...firstOrderK('k1', 'k₁', 'k_1'), dim: { any: 'k' }, name: 'Rate constant at T₁' },
      { ...firstOrderK('k2', 'k₂', 'k_2'), dim: { any: 'k' }, name: 'Rate constant at T₂' },
      molarEnergy('Ea', 'Eₐ', 'E_\\mathrm{a}', 'Activation energy', { sign: 'positive' }),
      T1,
      T2,
    ],
    relation: (v) => [ln(v.k2! / v.k1!), (-v.Ea! / R) * (1 / v.T2! - 1 / v.T1!)],
    rearranged: {
      k2: 'k_2 = k_1\\exp\\!\\left[-\\dfrac{E_\\mathrm{a}}{R}\\left(\\dfrac{1}{T_2}-\\dfrac{1}{T_1}\\right)\\right]',
      k1: 'k_1 = k_2\\exp\\!\\left[\\dfrac{E_\\mathrm{a}}{R}\\left(\\dfrac{1}{T_2}-\\dfrac{1}{T_1}\\right)\\right]',
      Ea: 'E_\\mathrm{a} = -\\dfrac{R\\ln(k_2/k_1)}{1/T_2 - 1/T_1}',
      T1: '\\dfrac{1}{T_1} = \\dfrac{1}{T_2} + \\dfrac{R\\ln(k_2/k_1)}{E_\\mathrm{a}}',
      T2: '\\dfrac{1}{T_2} = \\dfrac{1}{T_1} - \\dfrac{R\\ln(k_2/k_1)}{E_\\mathrm{a}}',
    },
    examples: [{ k1: 1.0e-3, T1: 298, T2: 308, Ea: 52 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'eyring',
    name: 'Eyring equation (ΔG‡)',
    topic: 'kinetics',
    latex: 'k = \\dfrac{k_\\mathrm{B}T}{h}\\,e^{-\\Delta G^\\ddagger/RT}',
    vars: [
      firstOrderK(),
      temp(),
      molarEnergy('dGa', 'ΔG‡', '\\Delta G^\\ddagger', 'Gibbs energy of activation', { sign: 'positive' }),
    ],
    relation: (v) => [ln((v.k! * h) / (kB * v.T!)), -v.dGa! / (R * v.T!)],
    rearranged: {
      k: 'k = \\dfrac{k_\\mathrm{B}T}{h}\\,e^{-\\Delta G^\\ddagger/RT}',
      dGa: '\\Delta G^\\ddagger = RT\\ln\\dfrac{k_\\mathrm{B}T}{hk}',
      T: '\\ln\\dfrac{hk}{k_\\mathrm{B}T} = -\\dfrac{\\Delta G^\\ddagger}{RT}\\quad\\text{(solved numerically)}',
    },
    notes: 'First-order (unimolecular) form with transmission coefficient 1. For a bimolecular step k carries a factor (c°)⁻¹.',
    examples: [{ T: 298, dGa: 80 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'eyring-hs',
    name: 'Eyring equation (ΔH‡, ΔS‡)',
    topic: 'kinetics',
    latex: 'k = \\dfrac{k_\\mathrm{B}T}{h}\\,e^{\\Delta S^\\ddagger/R}\\,e^{-\\Delta H^\\ddagger/RT}',
    vars: [
      firstOrderK(),
      temp(),
      molarEnergy('dHa', 'ΔH‡', '\\Delta H^\\ddagger', 'Enthalpy of activation'),
      { sym: 'dSa', label: 'ΔS‡', latex: '\\Delta S^\\ddagger', name: 'Entropy of activation', dim: D.molarEntropy, unit: 'J/(K mol)', sign: 'signed' },
    ],
    relation: (v) => [ln((v.k! * h) / (kB * v.T!)), v.dSa! / R - v.dHa! / (R * v.T!)],
    rearranged: {
      k: 'k = \\dfrac{k_\\mathrm{B}T}{h}\\,e^{\\Delta S^\\ddagger/R}\\,e^{-\\Delta H^\\ddagger/RT}',
      dHa: '\\Delta H^\\ddagger = T\\Delta S^\\ddagger - RT\\ln\\dfrac{hk}{k_\\mathrm{B}T}',
      dSa: '\\Delta S^\\ddagger = \\dfrac{\\Delta H^\\ddagger}{T} + R\\ln\\dfrac{hk}{k_\\mathrm{B}T}',
      T: '\\ln\\dfrac{hk}{k_\\mathrm{B}T} = \\dfrac{\\Delta S^\\ddagger}{R} - \\dfrac{\\Delta H^\\ddagger}{RT}\\quad\\text{(solved numerically)}',
    },
    notes: 'First-order (unimolecular) form with transmission coefficient 1.',
    examples: [{ T: 298, dHa: 75, dSa: -20 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'k-equilibrium',
    name: 'Equilibrium constant from rate constants',
    topic: 'kinetics',
    latex: 'K = \\dfrac{k_\\mathrm{f}}{k_\\mathrm{b}}',
    vars: [
      { sym: 'K', label: 'K', latex: 'K', name: 'Equilibrium constant', dim: D.none, unit: '1' },
      { ...firstOrderK('kf', 'k_f', 'k_\\mathrm{f}'), dim: { any: 'k' }, name: 'Forward rate constant' },
      { ...firstOrderK('kb', 'k_b', 'k_\\mathrm{b}'), dim: { any: 'k' }, name: 'Backward rate constant' },
    ],
    relation: (v) => [v.K!, v.kf! / v.kb!],
    rearranged: {
      K: 'K = \\dfrac{k_\\mathrm{f}}{k_\\mathrm{b}}',
      kf: 'k_\\mathrm{f} = Kk_\\mathrm{b}',
      kb: 'k_\\mathrm{b} = \\dfrac{k_\\mathrm{f}}{K}',
    },
    notes: 'Here kf and kb have the same order. If they differ, K carries units (combine with multiply/divide operations instead).',
    examples: [{ kf: 2.0e3, kb: 50 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'radioactive-decay',
    name: 'Radioactive decay',
    topic: 'kinetics',
    latex: 'N = N_0\\left(\\tfrac{1}{2}\\right)^{t/t_{1/2}}',
    vars: [
      { sym: 'N', label: 'N', latex: 'N', name: 'Amount remaining (any measure)', dim: { any: 'n' }, unit: 'g' },
      { sym: 'N0', label: 'N₀', latex: 'N_0', name: 'Initial amount (same units)', dim: { any: 'n' }, unit: 'g' },
      time('t', 't', 't', { unit: 'yr' }),
      time('thalf', 't½', 't_{1/2}', { name: 'Half-life', unit: 'yr' }),
    ],
    relation: (v) => [ln(v.N0! / v.N!), (Math.LN2 * v.t!) / v.thalf!],
    rearranged: {
      N: 'N = N_0\\left(\\tfrac{1}{2}\\right)^{t/t_{1/2}}',
      N0: 'N_0 = N\\cdot 2^{t/t_{1/2}}',
      t: 't = t_{1/2}\\,\\dfrac{\\ln(N_0/N)}{\\ln 2}',
      thalf: 't_{1/2} = \\dfrac{t\\ln 2}{\\ln(N_0/N)}',
    },
    notes: 'N can be number of nuclei, mass or activity, as long as N and N₀ match.',
    examples: [{ N0: 10.0, t: 11460, thalf: 5730 }],
    reviewed: false,
  }),
];
