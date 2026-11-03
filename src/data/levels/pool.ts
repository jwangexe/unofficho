/**
 * Choosing content for a level. An item is "core" at the levels it is tagged with (weight 1).
 * With "Include easier levels" on, items tagged only with lower levels come in as warm-ups at
 * the chosen level's `warmUpWeight`. Items only tagged with higher levels never appear.
 */
import { LEVELS, levelRank } from './index';
import type { LevelId } from './types';

export interface LevelPrefs {
  level: LevelId;
  includeEasier: boolean;
}

export interface Weighted<T> {
  item: T;
  weight: number;
}

/** 1 for a core item, the warm-up weight for an easier one, 0 if it does not belong. */
export function levelWeight(itemLevels: readonly LevelId[], { level, includeEasier }: LevelPrefs): number {
  if (itemLevels.includes(level)) return 1;
  if (includeEasier && itemLevels.some((l) => levelRank(l) < levelRank(level))) return LEVELS[level].warmUpWeight;
  return 0;
}

/** The items that belong at a level, with their weights. */
export function weightedPool<T extends { levels: readonly LevelId[] }>(items: readonly T[], prefs: LevelPrefs): Weighted<T>[] {
  return items.flatMap((item) => {
    const weight = levelWeight(item.levels, prefs);
    return weight > 0 ? [{ item, weight }] : [];
  });
}

/** Whether an item is shown at all at a level (core or warm-up). */
export const inLevel = (itemLevels: readonly LevelId[], prefs: LevelPrefs) => levelWeight(itemLevels, prefs) > 0;

/** One weighted random pick. `avoid` is skipped when anything else is available. */
export function pickWeighted<T>(pool: readonly Weighted<T>[], rand: () => number, avoid?: (item: T) => boolean): T {
  const choices = avoid && pool.some((x) => !avoid(x.item)) ? pool.filter((x) => !avoid(x.item)) : pool;
  const total = choices.reduce((s, x) => s + x.weight, 0);
  let r = rand() * total;
  for (const x of choices) {
    r -= x.weight;
    if (r < 0) return x.item;
  }
  return choices.at(-1)!.item;
}

/**
 * One shuffled pass through a deck: core items always, each warm-up with probability equal to
 * its weight. Never empty unless the pool is.
 */
export function weightedPass<T>(pool: readonly Weighted<T>[], rand: () => number): T[] {
  let picked = pool.filter((x) => x.weight >= 1 || rand() < x.weight).map((x) => x.item);
  if (picked.length === 0) picked = pool.map((x) => x.item);
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picked[i], picked[j]] = [picked[j]!, picked[i]!];
  }
  return picked;
}
