import { describe, expect, it } from 'vitest';
import { dueToday, recent, streaks, tallyBy, weakSpots } from '@/features/progress/stats';
import type { Attempt, SrsState } from '@/storage/db';
import { DAY } from '@/storage/srs';

const noon = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();
const att = (itemId: string, ts: number, score: number, topic = 'kinetics'): Attempt => ({ itemId, section: 'calc', topic, ts, score });

describe('tallies', () => {
  it('averages scores per key, including multi-key attempts', () => {
    const t = tallyBy([att('a', 1, 1), att('a', 2, 0), att('b', 3, 0.5)], (a) => [a.itemId, 'all']);
    expect(t.get('a')).toEqual({ n: 2, accuracy: 0.5, last: 2 });
    expect(t.get('all')?.n).toBe(3);
  });

  it('keeps only recent attempts', () => {
    const now = noon(2026, 9, 31);
    expect(recent([att('a', now - 31 * DAY, 1), att('a', now - DAY, 1)], now)).toHaveLength(1);
  });
});

describe('streaks', () => {
  const now = noon(2026, 9, 31);
  it('counts consecutive days ending today', () => {
    const a = [noon(2026, 9, 29), noon(2026, 9, 30, 23), noon(2026, 9, 31, 8)].map((ts) => att('x', ts, 1));
    expect(streaks(a, now)).toEqual({ current: 3, best: 3, today: true });
  });

  it('keeps the streak alive until today ends', () => {
    const a = [noon(2026, 9, 29), noon(2026, 9, 30)].map((ts) => att('x', ts, 1));
    expect(streaks(a, now)).toMatchObject({ current: 2, today: false });
  });

  it('breaks after a missed day but remembers the best run', () => {
    const a = [noon(2026, 9, 20), noon(2026, 9, 21), noon(2026, 9, 22), noon(2026, 9, 29)].map((ts) => att('x', ts, 1));
    expect(streaks(a, now)).toEqual({ current: 0, best: 3, today: false });
  });

  it('handles a month boundary and the end of summer time', () => {
    const a = [noon(2026, 9, 24), noon(2026, 9, 25), noon(2026, 9, 26), noon(2026, 9, 27)].map((ts) => att('x', ts, 1));
    expect(streaks(a, noon(2026, 9, 27)).best).toBe(4);
    expect(streaks([noon(2026, 8, 30), noon(2026, 9, 1)].map((ts) => att('x', ts, 1)), noon(2026, 9, 1)).current).toBe(2);
  });
});

describe('due today and weak spots', () => {
  it('groups SRS states due before midnight by section', () => {
    const now = noon(2026, 9, 31);
    const s = (itemId: string, section: SrsState['section'], due: number): SrsState => ({ itemId, section, topic: 't', ease: 2.5, intervalDays: 1, due, reps: 1, lapses: 0, lastReviewed: 0 });
    const d = dueToday([s('a', 'calc', now - DAY), s('b', 'calc', now + 6 * 3_600_000), s('c', 'book', now + DAY)], now);
    expect(d.calc.map((x) => x.itemId)).toEqual(['a', 'b']);
    expect(d.book).toEqual([]);
  });

  it('ranks by lowest accuracy and ignores thin or strong groups', () => {
    const t = tallyBy(
      [att('a', 1, 0), att('a', 2, 0.5), att('b', 3, 0.2), att('c', 4, 0), att('c', 5, 0), att('c', 6, 0), att('d', 7, 1), att('d', 8, 1)],
      (a) => a.itemId,
    );
    expect(weakSpots(t, { minAttempts: 2 }).map((w) => w.key)).toEqual(['c', 'a']);
  });
});
