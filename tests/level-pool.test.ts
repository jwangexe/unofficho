import { describe, expect, it } from 'vitest';
import { LEVEL_IDS, LEVELS } from '@/data/levels';
import { levelWeight, pickWeighted, weightedPass, weightedPool } from '@/data/levels/pool';
import { buildPlacement, recommend } from '@/features/level/placement';
import { rng } from '@/engine/template';

describe('level weights', () => {
  it('core items weigh 1, easier ones the warm-up weight, harder ones 0', () => {
    expect(levelWeight(['ukcho1', 'icho'], { level: 'ukcho1', includeEasier: true })).toBe(1);
    expect(levelWeight(['alevel'], { level: 'ukcho1', includeEasier: true })).toBe(LEVELS.ukcho1.warmUpWeight);
    expect(levelWeight(['alevel'], { level: 'ukcho1', includeEasier: false })).toBe(0);
    expect(levelWeight(['icho'], { level: 'ukcho1', includeEasier: true })).toBe(0);
  });

  it('weightedPool drops what does not belong', () => {
    const items = [
      { id: 'a', levels: ['alevel' as const] },
      { id: 'b', levels: ['c3l6' as const] },
      { id: 'c', levels: ['icho' as const] },
    ];
    expect(weightedPool(items, { level: 'c3l6', includeEasier: true }).map((x) => [x.item.id, x.weight])).toEqual([
      ['a', LEVELS.c3l6.warmUpWeight],
      ['b', 1],
    ]);
    expect(weightedPool(items, { level: 'c3l6', includeEasier: false }).map((x) => x.item.id)).toEqual(['b']);
  });

  it('pickWeighted follows the weights and avoids a repeat when it can', () => {
    const pool = [
      { item: 'core', weight: 1 },
      { item: 'warm', weight: 0.25 },
    ];
    const r = rng(1);
    const counts = { core: 0, warm: 0 };
    for (let i = 0; i < 5000; i++) counts[pickWeighted(pool, r) as 'core' | 'warm']++;
    expect(counts.warm / 5000).toBeGreaterThan(0.15);
    expect(counts.warm / 5000).toBeLessThan(0.25);
    for (let i = 0; i < 50; i++) expect(pickWeighted(pool, r, (x) => x === 'core')).toBe('warm');
    expect(pickWeighted([{ item: 'only', weight: 1 }], r, (x) => x === 'only')).toBe('only');
  });

  it('weightedPass keeps every core item and is never empty', () => {
    const r = rng(2);
    const pass = weightedPass(
      [
        { item: 1, weight: 1 },
        { item: 2, weight: 1 },
        { item: 3, weight: 0.3 },
      ],
      r,
    );
    expect(pass).toContain(1);
    expect(pass).toContain(2);
    expect(weightedPass([{ item: 'w', weight: 0.0001 }], r)).toEqual(['w']);
  });
});

describe('placement quiz', () => {
  it('has one question per level, easiest first, each with four distinct options', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const qs = buildPlacement(seed);
      expect(qs.map((q) => q.level)).toEqual([...LEVEL_IDS]);
      for (const q of qs) {
        expect(new Set(q.options).size, `${q.template.id}: ${q.options.join(' | ')}`).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.template.levels).toContain(q.level);
      }
    }
  });

  it('recommends the highest level answered correctly', () => {
    const r = (c: boolean[]) => recommend(LEVEL_IDS.map((level, i) => ({ level, correct: c[i]! })));
    expect(r([false, false, false, false, false])).toBe('alevel');
    expect(r([true, true, false, false, false])).toBe('c3l6');
    expect(r([true, false, true, false, false])).toBe('ukcho1');
    expect(r([false, false, false, false, true])).toBe('icho');
  });
});
