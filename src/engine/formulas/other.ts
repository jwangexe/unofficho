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
    id: 'unit-cell-density',
    name: 'Density from a cubic unit cell',
    topic: 'other',
    latex: '\\rho = \\dfrac{ZM}{N_\\mathrm{A}a^3}',
    vars: [
      { sym: 'rho', label: 'ρ', latex: '\\rho', name: 'Density', dim: D.massConcentration, unit: 'g/cm3' },
      dimensionless('Z', 'Z', 'Z', 'Formula units per unit cell', { integer: true, solvable: false }),
      { sym: 'M', label: 'M', latex: 'M', name: 'Molar mass (per formula unit)', dim: D.molarMass, unit: 'g/mol' },
      { sym: 'a', label: 'a', latex: 'a', name: 'Cell edge (lattice parameter)', dim: D.length, unit: 'pm' },
    ],
    relation: (v) => [v.rho! * NA * v.a! ** 3, v.Z! * v.M!],
    rearranged: {
      rho: '\\rho = \\dfrac{ZM}{N_\\mathrm{A}a^3}',
      M: 'M = \\dfrac{\\rho N_\\mathrm{A}a^3}{Z}',
      a: 'a = \\sqrt[3]{\\dfrac{ZM}{\\rho N_\\mathrm{A}}}',
    },
    notes: 'Z: 1 simple cubic, 2 body-centred, 4 face-centred (and 4 NaCl units in rock salt).',
    // Copper, face-centred cubic: a = 361.5 pm gives ρ ≈ 8.93 g cm⁻³.
    examples: [{ Z: 4, M: 63.55, a: 361.5 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'spin-only',
    name: 'Spin-only magnetic moment',
    topic: 'other',
    latex: '\\mu_\\text{so} = \\sqrt{n(n+2)}\\;\\mu_\\mathrm{B}',
    vars: [
      dimensionless('mu', 'μ', '\\mu_\\text{so}', 'Magnetic moment, in Bohr magnetons'),
      dimensionless('n', 'n', 'n', 'Number of unpaired electrons', { sign: 'nonneg' }),
    ],
    relation: (v) => [v.mu! ** 2, v.n! * (v.n! + 2)],
    rearranged: { mu: '\\mu = \\sqrt{n(n+2)}', n: 'n = \\sqrt{1 + \\mu^2} - 1' },
    examples: [{ n: 3 }],
    reviewed: false,
  }),
];
