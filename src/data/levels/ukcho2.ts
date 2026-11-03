import type { LevelScope } from './types';

/** UKChO Round 2 (selection weekend): theory close to IChO preparatory-problem level. */
export const ukcho2: LevelScope = {
  id: 'ukcho2',
  name: 'UKChO Round 2',
  who: 'The ~30 students selected for the UKChO selection weekend',
  formulas: 'all',
  topics: 'all',
  reagents: 'all',
  modes: { calc: ['feed', 'approach', 'multi', 'exam', 'mechanisms'], reagents: ['classify', 'fast', 'react'] },
  exam: { secondsPerItem: 300, strictUnits: true },
  notation: {
    constants: { R: 8.314, NA: 6.022e23, F: 96485 },
    sigFigs: '3 significant figures unless the question says otherwise.',
    units: 'SI.',
  },
  warmUpWeight: 0.6,
};
