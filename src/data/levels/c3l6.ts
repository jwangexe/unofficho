import { alevel } from './alevel';
import type { LevelScope } from './types';

/**
 * Cambridge Chemistry Challenge Lower Sixth: A-level foundations taken well beyond the
 * syllabus, with anything unfamiliar explained in the question.
 */
export const c3l6: LevelScope = {
  id: 'c3l6',
  name: 'C3L6',
  who: 'Year 12 and below, preparing for the Cambridge Chemistry Challenge Lower Sixth',
  formulas: [
    ...(alevel.formulas as string[]),
    'heat-molar', 'gibbs-k',
    'zero-order', 'first-order', 'half-life-first', 'radioactive-decay',
    'kp-kc', 'ice', 'ksp-solubility', 'poh', 'pkw', 'ka-kb', 'weak-acid-exact', 'weak-base-approx',
    'charge', 'faraday',
    'beer-lambert', 'photon-frequency', 'photon-wavelength', 'photon-molar',
  ],
  topics: [...(alevel.topics as string[]), 'other', 'inorganic/main-group'],
  reagents: [...(alevel.reagents as string[]), 'lialh4', 'h2o2', 'naocl', 'so2', 'fluorine', 'k2co3', 'naoet'],
  modes: { calc: ['feed', 'multi', 'case', 'exam'], reagents: ['classify', 'fast'] },
  exam: { secondsPerItem: 240, strictUnits: true },
  notation: {
    constants: { R: 8.314, NA: 6.022e23 },
    sigFigs: '3 significant figures unless the question says otherwise.',
    units: 'SI with dm³ and mol dm⁻³.',
  },
  warmUpWeight: 0.4,
};
