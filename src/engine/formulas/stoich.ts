/** Everyday stoichiometry: shown first in every question's formula list. */
import { R, NA } from '../constants';
import { D } from '../dims';
import { defineFormula } from '../formula';
import { conc, temp } from './vars';

const amount = (sym = 'n', label = 'n', latex = 'n', name = 'Amount') => ({ sym, label, latex, name, dim: D.amount, unit: 'mol' });
const volume = (sym = 'V', label = 'V', latex = 'V', name = 'Volume') => ({ sym, label, latex, name, dim: D.volume, unit: 'dm3' });

export const stoich = [
  defineFormula({
    id: 'moles-mass',
    name: 'Moles from mass',
    topic: 'stoich',
    latex: 'n = \\dfrac{m}{M}',
    vars: [
      amount(),
      { sym: 'm', label: 'm', latex: 'm', name: 'Mass', dim: D.mass, unit: 'g' },
      { sym: 'M', label: 'M', latex: 'M', name: 'Molar mass', dim: D.molarMass, unit: 'g/mol' },
    ],
    relation: (v) => [v.n! * v.M!, v.m!],
    rearranged: { n: 'n = \\dfrac{m}{M}', m: 'm = nM', M: 'M = \\dfrac{m}{n}' },
    examples: [{ m: 5.85, M: 58.44 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'concentration',
    name: 'Concentration from moles and volume',
    topic: 'stoich',
    latex: 'c = \\dfrac{n}{V}',
    vars: [conc('c', 'c', 'c', 'Concentration'), amount(), volume()],
    relation: (v) => [v.c! * v.V!, v.n!],
    rearranged: { c: 'c = \\dfrac{n}{V}', n: 'n = cV', V: 'V = \\dfrac{n}{c}' },
    examples: [{ n: 0.0025, V: 0.025 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'mole-ratio',
    name: 'Mole ratio from the balanced equation',
    topic: 'stoich',
    latex: 'n_\\mathrm{B} = \\dfrac{b}{a}\\,n_\\mathrm{A}',
    vars: [
      amount('nB', 'n(B)', 'n_\\mathrm{B}', 'Amount of B (wanted)'),
      amount('nA', 'n(A)', 'n_\\mathrm{A}', 'Amount of A (known)'),
      { sym: 'a', label: 'a', latex: 'a', name: 'Coefficient of A', dim: D.none, unit: '1', solvable: false, stepper: { min: 1, max: 12, initial: 1 } },
      { sym: 'b', label: 'b', latex: 'b', name: 'Coefficient of B', dim: D.none, unit: '1', solvable: false, stepper: { min: 1, max: 12, initial: 1 } },
    ],
    relation: (v) => [v.a! * v.nB!, v.b! * v.nA!],
    rearranged: { nB: 'n_\\mathrm{B} = \\dfrac{b}{a}\\,n_\\mathrm{A}', nA: 'n_\\mathrm{A} = \\dfrac{a}{b}\\,n_\\mathrm{B}' },
    notes: 'a A + … → b B + …: coefficients from the balanced equation.',
    // 2KMnO₄ + 5H₂C₂O₄ …: 0.0020 mol MnO₄⁻ reacts with 0.0050 mol oxalate.
    examples: [{ nA: 0.002, a: 2, b: 5 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'dilution',
    name: 'Dilution',
    topic: 'stoich',
    latex: 'c_1V_1 = c_2V_2',
    vars: [
      conc('c1', 'c₁', 'c_1', 'Concentration before'),
      volume('V1', 'V₁', 'V_1', 'Volume before'),
      conc('c2', 'c₂', 'c_2', 'Concentration after'),
      volume('V2', 'V₂', 'V_2', 'Volume after'),
    ],
    relation: (v) => [v.c1! * v.V1!, v.c2! * v.V2!],
    rearranged: {
      c1: 'c_1 = \\dfrac{c_2V_2}{V_1}',
      V1: 'V_1 = \\dfrac{c_2V_2}{c_1}',
      c2: 'c_2 = \\dfrac{c_1V_1}{V_2}',
      V2: 'V_2 = \\dfrac{c_1V_1}{c_2}',
    },
    examples: [{ c1: 1.0, V1: 0.025, V2: 0.25 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'ideal-gas',
    name: 'Ideal gas equation',
    topic: 'stoich',
    latex: 'pV = nRT',
    vars: [{ sym: 'p', label: 'p', latex: 'p', name: 'Pressure', dim: D.pressure, unit: 'kPa' }, volume(), amount(), temp()],
    relation: (v) => [v.p! * v.V!, v.n! * R * v.T!],
    rearranged: {
      p: 'p = \\dfrac{nRT}{V}',
      V: 'V = \\dfrac{nRT}{p}',
      n: 'n = \\dfrac{pV}{RT}',
      T: 'T = \\dfrac{pV}{nR}',
    },
    examples: [{ V: 24.79, n: 1, T: 298.15 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'particles',
    name: 'Number of particles',
    topic: 'stoich',
    latex: 'N = nN_\\mathrm{A}',
    vars: [
      { sym: 'N', label: 'N', latex: 'N', name: 'Number of particles', dim: D.none, unit: '1' },
      amount(),
    ],
    relation: (v) => [v.N!, v.n! * NA],
    rearranged: { N: 'N = nN_\\mathrm{A}', n: 'n = \\dfrac{N}{N_\\mathrm{A}}' },
    examples: [{ n: 0.5 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'percentage-yield',
    name: 'Percentage yield',
    topic: 'stoich',
    latex: 'Y = \\dfrac{\\text{actual}}{\\text{theoretical}}',
    vars: [
      { sym: 'Y', label: 'Y', latex: 'Y', name: 'Percentage yield (%)', dim: D.none, unit: '%' },
      { sym: 'act', label: 'actual', latex: '\\text{actual}', name: 'Actual amount or mass obtained', dim: { any: 'yield' }, unit: 'g' },
      { sym: 'theo', label: 'theoretical', latex: '\\text{theoretical}', name: 'Theoretical amount or mass (same units)', dim: { any: 'yield' }, unit: 'g' },
    ],
    relation: (v) => [v.Y! * v.theo!, v.act!],
    rearranged: {
      Y: 'Y = \\dfrac{\\text{actual}}{\\text{theoretical}} \\times 100\\%',
      act: '\\text{actual} = Y \\times \\text{theoretical}',
      theo: '\\text{theoretical} = \\dfrac{\\text{actual}}{Y}',
    },
    notes: 'Use masses or amounts for both, in the same units.',
    examples: [{ act: 4.2, theo: 5.6 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'mass-concentration',
    name: 'Mass concentration',
    topic: 'stoich',
    latex: '\\rho = cM',
    vars: [
      { sym: 'rho', label: 'ρ', latex: '\\rho', name: 'Mass concentration', dim: D.massConcentration, unit: 'g/dm3' },
      conc('c', 'c', 'c', 'Concentration'),
      { sym: 'M', label: 'M', latex: 'M', name: 'Molar mass', dim: D.molarMass, unit: 'g/mol' },
    ],
    relation: (v) => [v.rho!, v.c! * v.M!],
    rearranged: { rho: '\\rho = cM', c: 'c = \\dfrac{\\rho}{M}', M: 'M = \\dfrac{\\rho}{c}' },
    examples: [{ c: 0.1, M: 58.44 }],
    reviewed: false,
  }),
];
