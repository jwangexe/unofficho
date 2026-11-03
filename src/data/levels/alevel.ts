import type { LevelScope } from './types';

/** AQA A-level Chemistry (7405). Strictly within the specification. */
export const alevel: LevelScope = {
  id: 'alevel',
  name: 'A-Level (AQA)',
  who: 'Year 12–13 students on AQA A-level Chemistry',
  formulas: [
    'moles-mass', 'concentration', 'mole-ratio', 'dilution', 'ideal-gas', 'particles', 'percentage-yield', 'mass-concentration',
    'heat-mass', 'gibbs',
    'arrhenius', 'arrhenius-two-point',
    'ph', 'p-function', 'weak-acid-approx', 'henderson-hasselbalch',
    'ecell',
  ],
  topics: [
    'stoich', 'thermo', 'kinetics', 'equilibrium', 'electro',
    'physical/thermodynamics', 'physical/kinetics', 'physical/equilibrium', 'physical/electrochemistry',
    'inorganic/periodic-trends', 'inorganic/redox', 'inorganic/coordination',
    'organic/carbonyl', 'organic/substitution-elimination', 'organic/oxidation-reduction', 'organic/reduction', 'organic/oxidation',
    'analytical/titrations', 'analytical/ph-curves', 'analytical/buffers',
    'acids', 'organic/bases', 'inorganic/acid-base', 'lewis-acids', 'organic/nucleophiles', 'solvents',
  ],
  reagents: [
    'nabh4', 'k2cr2o7', 'kmno4', 'tollens', 'h2so4-conc', 'hno3-conc', 'hcl', 'naoh', 'ammonia', 'nacn', 'alcl3',
    'bromine', 'chlorine', 'iodine', 'feso4', 'agno3', 'nahco3', 'hexane',
    'sodium', 'h2-pd-c', 'sncl2', 'zinc', 'na2s2o3', 'febr3',
  ],
  modes: { calc: ['feed', 'exam'], reagents: ['classify', 'fast'] },
  exam: { secondsPerItem: 180, strictUnits: true },
  notation: {
    constants: { R: 8.31, NA: 6.022e23 },
    sigFigs: 'Give answers to the same number of significant figures as the least precise data (usually 3).',
    units: 'SI with dm³ and mol dm⁻³, as on the AQA data sheet.',
  },
  warmUpWeight: 0.3,
  todoVerify: [
    'arrhenius-two-point: AQA covers ln k = −Eₐ/RT + ln A; check two-point questions (k at two temperatures) are fair game.',
    'henderson-hasselbalch: AQA buffer questions use Ka directly; the equation is equivalent but check it is acceptable as a named tool.',
    'Reagents sodium, h2-pd-c (AQA uses Ni for hydrogenation), sncl2 (AQA uses Sn/HCl for nitrobenzene), zinc, na2s2o3 (iodine–thiosulfate titrations), febr3 (benzene halogenation): check each is on the spec.',
    'mass-concentration (g dm⁻³): check it appears as a named quantity.',
  ],
};
