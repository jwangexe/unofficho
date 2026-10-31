import { D } from '../dims';
import { defineFormula } from '../formula';
import { F, R } from '../constants';
import { dimensionless, molarEnergy, potential, temp, time } from './vars';

const ln = Math.log;
const nElectrons = dimensionless('n', 'n', 'n', 'Electrons transferred', { integer: true, typical: 2 });

export const electro = [
  defineFormula({
    id: 'gibbs-emf',
    name: 'Gibbs energy and cell potential',
    topic: 'electro',
    latex: '\\Delta G^\\circ = -nFE^\\circ',
    vars: [
      molarEnergy('dG0', 'ΔG°', '\\Delta G^\\circ', 'Standard Gibbs energy change'),
      nElectrons,
      potential('E0', 'E°', 'E^\\circ', 'Standard cell potential'),
    ],
    relation: (v) => [v.dG0!, -v.n! * F * v.E0!],
    rearranged: {
      dG0: '\\Delta G^\\circ = -nFE^\\circ',
      n: 'n = -\\dfrac{\\Delta G^\\circ}{FE^\\circ}',
      E0: 'E^\\circ = -\\dfrac{\\Delta G^\\circ}{nF}',
    },
    notes: 'Also holds without the ° signs for non-standard conditions.',
    examples: [{ n: 2, E0: 1.1 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'nernst',
    name: 'Nernst equation',
    topic: 'electro',
    latex: 'E = E^\\circ - \\dfrac{RT}{nF}\\ln Q',
    vars: [
      potential('E', 'E', 'E', 'Cell potential'),
      potential('E0', 'E°', 'E^\\circ', 'Standard cell potential'),
      temp(),
      nElectrons,
      dimensionless('Q', 'Q', 'Q', 'Reaction quotient'),
    ],
    relation: (v) => [v.E!, v.E0! - ((R * v.T!) / (v.n! * F)) * ln(v.Q!)],
    rearranged: {
      E: 'E = E^\\circ - \\dfrac{RT}{nF}\\ln Q',
      E0: 'E^\\circ = E + \\dfrac{RT}{nF}\\ln Q',
      T: 'T = \\dfrac{nF(E^\\circ - E)}{R\\ln Q}',
      n: 'n = \\dfrac{RT\\ln Q}{F(E^\\circ - E)}',
      Q: 'Q = \\exp\\!\\left(\\dfrac{nF(E^\\circ - E)}{RT}\\right)',
    },
    notes: 'At 25 °C, RT/F · ln 10 = 0.0592 V.',
    examples: [{ E0: 1.1, T: 298.15, n: 2, Q: 0.01 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'ecell',
    name: 'Cell potential from half-cells',
    topic: 'electro',
    latex: 'E^\\circ_\\mathrm{cell} = E^\\circ_\\mathrm{cathode} - E^\\circ_\\mathrm{anode}',
    vars: [
      potential('Ecell', 'E°cell', 'E^\\circ_\\mathrm{cell}', 'Standard cell potential'),
      potential('Ecat', 'E°cathode', 'E^\\circ_\\mathrm{cathode}', 'Reduction potential at the cathode'),
      potential('Ean', 'E°anode', 'E^\\circ_\\mathrm{anode}', 'Reduction potential at the anode'),
    ],
    relation: (v) => [v.Ecell!, v.Ecat! - v.Ean!],
    rearranged: {
      Ecell: 'E^\\circ_\\mathrm{cell} = E^\\circ_\\mathrm{cathode} - E^\\circ_\\mathrm{anode}',
      Ecat: 'E^\\circ_\\mathrm{cathode} = E^\\circ_\\mathrm{cell} + E^\\circ_\\mathrm{anode}',
      Ean: 'E^\\circ_\\mathrm{anode} = E^\\circ_\\mathrm{cathode} - E^\\circ_\\mathrm{cell}',
    },
    notes: 'Both are standard REDUCTION potentials; do not flip the sign of the anode value first.',
    examples: [{ Ecat: 0.34, Ean: -0.76 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'charge',
    name: 'Charge from current and time',
    topic: 'electro',
    latex: 'Q = It',
    vars: [
      { sym: 'Q', label: 'Q', latex: 'Q', name: 'Charge', dim: D.charge, unit: 'C' },
      { sym: 'I', label: 'I', latex: 'I', name: 'Current', dim: D.current, unit: 'A' },
      time(),
    ],
    relation: (v) => [v.Q!, v.I! * v.t!],
    rearranged: { Q: 'Q = It', I: 'I = \\dfrac{Q}{t}', t: 't = \\dfrac{Q}{I}' },
    examples: [{ I: 0.5, t: 3600 }],
    reviewed: false,
  }),

  defineFormula({
    id: 'faraday',
    name: 'Moles from charge (Faraday)',
    topic: 'electro',
    latex: 'n = \\dfrac{Q}{zF}',
    vars: [
      { sym: 'n', label: 'n', latex: 'n', name: 'Amount of substance', dim: D.amount, unit: 'mol' },
      { sym: 'Q', label: 'Q', latex: 'Q', name: 'Charge', dim: D.charge, unit: 'C' },
      dimensionless('z', 'z', 'z', 'Electrons per formula unit', { integer: true, typical: 2 }),
    ],
    relation: (v) => [v.n! * v.z! * F, v.Q!],
    rearranged: { n: 'n = \\dfrac{Q}{zF}', Q: 'Q = nzF', z: 'z = \\dfrac{Q}{nF}' },
    examples: [{ Q: 1800, z: 2 }],
    reviewed: false,
  }),
];
