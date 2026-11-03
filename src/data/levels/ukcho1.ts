import { c3l6 } from './c3l6';
import type { LevelScope } from './types';

/** RSC UK Chemistry Olympiad Round 1: beyond the post-16 curriculum. */
export const ukcho1: LevelScope = {
  id: 'ukcho1',
  name: 'UKChO Round 1',
  who: 'Students preparing for the UK Chemistry Olympiad Round 1 (late January)',
  formulas: [
    ...(c3l6.formulas as string[]),
    'gibbs-q', 'first-law', 'work-pv', 'dh-du', 'entropy-heating', 'entropy-qrev',
    'second-order', 'half-life-zero', 'half-life-second',
    'weak-base-exact',
    'gibbs-emf', 'nernst',
  ],
  topics: [...(c3l6.topics as string[]), 'organic/protecting-groups', 'organic/carbohydrates', 'analytical'],
  reagents: [
    ...(c3l6.reagents as string[]),
    'pcc', 'jones', 'memgbr', 'kotbu', 'ozone', 'oso4', 'mcpba', 'nai-acetone', 'tsoh', 'pyridine', 'net3', 'dcm', 'toluene', 'nbs', 'pph3', 'can',
  ],
  modes: { calc: ['feed', 'approach', 'multi', 'exam'], reagents: ['classify', 'fast', 'react'] },
  exam: { secondsPerItem: 240, strictUnits: true },
  notation: {
    constants: { R: 8.314, NA: 6.022e23, F: 96485 },
    sigFigs: '3 significant figures unless the question says otherwise.',
    units: 'SI; concentrations in mol dm⁻³.',
  },
  warmUpWeight: 0.5,
};
