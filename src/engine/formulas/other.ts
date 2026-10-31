import { D } from '../dims';
import { defineFormula } from '../formula';
import { c, h, NA } from '../constants';
import { conc, dimensionless } from './vars';

const lambda = { sym: 'lambda', label: 'λ', latex: '\\lambda', name: 'Wavelength', dim: D.length, unit: 'nm' };

export const other = [
  defineFormula({
    id: 'beer-lambert',
    name: 'Beer–Lambert law',
    topic: 'other',
    latex: 'A = \\varepsilon lc',
    vars: [
      dimensionless('A', 'A', 'A', 'Absorbance'),
      { sym: 'eps', label: 'ε', latex: '\\varepsilon', name: 'Molar absorption coefficient', dim: D.molarAbsorptivity, unit: 'dm3/(mol cm)' },
      { sym: 'l', label: 'l', latex: 'l', name: 'Path length', dim: D.length, unit: 'cm' },
      conc('c', 'c', 'c', 'Concentration'),
    ],
    relation: (v) => [v.A!, v.eps! * v.l! * v.c!],
    rearranged: {
      A: 'A = \\varepsilon lc',
      eps: '\\varepsilon = \\dfrac{A}{lc}',
      l: 'l = \\dfrac{A}{\\varepsilon c}',
      c: 'c = \\dfrac{A}{\\varepsilon l}',
    },
    notes: 'Decadic absorbance, A = log₁₀(I₀/I).',
    examples: [{ eps: 1.2e4, l: 1.0, c: 2.5e-5 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'photon-frequency',
    name: 'Photon energy from frequency',
    topic: 'other',
    latex: 'E = h\\nu',
    vars: [
      { sym: 'E', label: 'E', latex: 'E', name: 'Photon energy', dim: D.energy, unit: 'J' },
      { sym: 'nu', label: 'ν', latex: '\\nu', name: 'Frequency', dim: D.frequency, unit: 'Hz' },
    ],
    relation: (v) => [v.E!, h * v.nu!],
    rearranged: { E: 'E = h\\nu', nu: '\\nu = \\dfrac{E}{h}' },
    examples: [{ nu: 5.0e14 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'photon-wavelength',
    name: 'Photon energy from wavelength',
    topic: 'other',
    latex: 'E = \\dfrac{hc}{\\lambda}',
    vars: [{ sym: 'E', label: 'E', latex: 'E', name: 'Photon energy', dim: D.energy, unit: 'J' }, lambda],
    relation: (v) => [v.E! * v.lambda!, h * c],
    rearranged: { E: 'E = \\dfrac{hc}{\\lambda}', lambda: '\\lambda = \\dfrac{hc}{E}' },
    examples: [{ lambda: 500 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'photon-molar',
    name: 'Energy per mole of photons',
    topic: 'other',
    latex: 'E_\\mathrm{m} = \\dfrac{N_\\mathrm{A}hc}{\\lambda}',
    vars: [
      { sym: 'Em', label: 'E_m', latex: 'E_\\mathrm{m}', name: 'Energy per mole of photons', dim: D.molarEnergy, unit: 'kJ/mol' },
      lambda,
    ],
    relation: (v) => [v.Em! * v.lambda!, NA * h * c],
    rearranged: { Em: 'E_\\mathrm{m} = \\dfrac{N_\\mathrm{A}hc}{\\lambda}', lambda: '\\lambda = \\dfrac{N_\\mathrm{A}hc}{E_\\mathrm{m}}' },
    examples: [{ lambda: 400 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'moles-mass',
    name: 'Moles from mass',
    topic: 'other',
    latex: 'n = \\dfrac{m}{M}',
    vars: [
      { sym: 'n', label: 'n', latex: 'n', name: 'Amount', dim: D.amount, unit: 'mol' },
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
    topic: 'other',
    latex: 'c = \\dfrac{n}{V}',
    vars: [
      conc('c', 'c', 'c', 'Concentration'),
      { sym: 'n', label: 'n', latex: 'n', name: 'Amount', dim: D.amount, unit: 'mol' },
      { sym: 'V', label: 'V', latex: 'V', name: 'Volume', dim: D.volume, unit: 'dm3' },
    ],
    relation: (v) => [v.c! * v.V!, v.n!],
    rearranged: { c: 'c = \\dfrac{n}{V}', n: 'n = cV', V: 'V = \\dfrac{n}{c}' },
    examples: [{ n: 0.0025, V: 0.025 }],
    reviewed: false,
  }),
];
