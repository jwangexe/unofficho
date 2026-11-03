import { alevel } from './alevel';
import { c3l6 } from './c3l6';
import { icho } from './icho';
import { LEVEL_IDS, type LevelId, type LevelScope } from './types';
import { ukcho1 } from './ukcho1';
import { ukcho2 } from './ukcho2';

export * from './types';

export const LEVELS: Record<LevelId, LevelScope> = { alevel, c3l6, ukcho1, ukcho2, icho };
export const LEVEL_LIST: readonly LevelScope[] = LEVEL_IDS.map((id) => LEVELS[id]);

/** Position on the ladder, 0 = A-level. */
export const levelRank = (id: LevelId) => LEVEL_IDS.indexOf(id);

const allows = (list: readonly string[] | 'all', id: string) => list === 'all' || list.includes(id);

export const formulaInScope = (level: LevelId, formula: string) => allows(LEVELS[level].formulas, formula);
export const reagentInScope = (level: LevelId, reagent: string) => allows(LEVELS[level].reagents, reagent);
export function topicInScope(level: LevelId, topic: string) {
  const t = LEVELS[level].topics;
  return t === 'all' || t.some((p) => topic === p || topic.startsWith(`${p}/`));
}

/** A reagent's levels: every level whose scope lists it. */
export const reagentLevels = (reagent: string): LevelId[] => LEVEL_IDS.filter((l) => reagentInScope(l, reagent));
