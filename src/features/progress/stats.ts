/** Pure progress statistics over the attempt log and SRS states. */
import type { Attempt, Section, SrsState } from '@/storage/db';
import { DAY, endOfDay } from '@/storage/srs';

export interface Tally {
  n: number;
  /** Mean score, 0–1. */
  accuracy: number;
  last: number;
}

export function tallyBy<K>(attempts: readonly Attempt[], keys: (a: Attempt) => K | K[] | undefined): Map<K, Tally> {
  const sums = new Map<K, { n: number; sum: number; last: number }>();
  for (const a of attempts) {
    const k = keys(a);
    for (const key of k === undefined ? [] : Array.isArray(k) ? k : [k]) {
      const s = sums.get(key) ?? { n: 0, sum: 0, last: 0 };
      s.n++;
      s.sum += a.score;
      s.last = Math.max(s.last, a.ts);
      sums.set(key, s);
    }
  }
  return new Map([...sums].map(([k, s]) => [k, { n: s.n, accuracy: s.sum / s.n, last: s.last }]));
}

/** Attempts in the last `days` days: what "recent accuracy" and weak spots are based on. */
export const RECENT_DAYS = 30;
export const recent = (attempts: readonly Attempt[], now: number, days = RECENT_DAYS) =>
  attempts.filter((a) => a.ts > now - days * DAY);

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Consecutive local days with at least one answer. The current streak is still alive if the
 * last answer was yesterday (today is not over yet).
 */
export function streaks(attempts: readonly Attempt[], now: number): { current: number; best: number; today: boolean } {
  const days = new Set(attempts.map((a) => dayKey(a.ts)));
  const prevDay = (ts: number) => {
    const d = new Date(ts);
    d.setDate(d.getDate() - 1);
    return d.getTime();
  };

  const today = days.has(dayKey(now));
  let current = 0;
  for (let t = today ? now : prevDay(now); days.has(dayKey(t)); t = prevDay(t)) current++;

  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const ts of [...new Set(attempts.map((a) => new Date(a.ts).setHours(12, 0, 0, 0)))].sort((a, b) => a - b)) {
    // Noon timestamps differ by ~1 day across consecutive dates, even over DST changes.
    run = prev !== null && Math.round((ts - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = ts;
  }
  return { current, best: Math.max(best, current), today };
}

export function dueToday(srs: readonly SrsState[], now: number): Record<Section, SrsState[]> {
  const cutoff = endOfDay(now);
  const out: Record<Section, SrsState[]> = { book: [], reagents: [], calc: [] };
  for (const s of srs) if (s.due < cutoff) out[s.section].push(s);
  for (const k of Object.keys(out) as Section[]) out[k].sort((a, b) => a.due - b.due);
  return out;
}

export interface WeakSpot<K> {
  key: K;
  tally: Tally;
}

/** Lowest recent accuracy first, among groups with enough answers to mean something. */
export function weakSpots<K>(tallies: Map<K, Tally>, { minAttempts, below = 0.7, limit = 8 }: { minAttempts: number; below?: number; limit?: number }): WeakSpot<K>[] {
  return [...tallies]
    .filter(([, t]) => t.n >= minAttempts && t.accuracy < below)
    .sort(([, a], [, b]) => a.accuracy - b.accuracy || b.n - a.n)
    .slice(0, limit)
    .map(([key, tally]) => ({ key, tally }));
}
