import type { LevelScope } from './types';

/** International Chemistry Olympiad candidates. */
export const icho: LevelScope = {
  id: 'icho',
  name: 'IChO',
  who: 'IChO candidates',
  formulas: 'all',
  topics: 'all',
  reagents: 'all',
  modes: { calc: ['feed', 'approach', 'multi', 'exam', 'mechanisms'], reagents: ['classify', 'fast', 'react'] },
  exam: { secondsPerItem: 300, strictUnits: true },
  notation: {
    constants: {},
    sigFigs: 'As the question requires.',
    units: 'SI; CODATA constants.',
  },
  warmUpWeight: 0.6,
};
