/**
 * SM-2 spaced repetition, adapted for scores in 0–1 (partial credit) and for a feed where
 * the same item can come round again before it is due.
 */
import type { Section, SrsState } from './db';

export const DAY = 86_400_000;
/** A failed item comes back in the same session, after a short gap. */
export const RELEARN_MS = 10 * 60_000;
const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;

/** SM-2 quality (0–5) from a 0–1 score. Below 3 counts as a lapse. */
export function quality(score: number): number {
  if (score >= 1) return 5;
  if (score >= 0.75) return 4;
  if (score >= 0.5) return 3;
  if (score > 0) return 1;
  return 0;
}

export function newState(itemId: string, section: Section, topic: string, now: number): SrsState {
  return { itemId, section, topic, ease: INITIAL_EASE, intervalDays: 0, due: now, reps: 0, lapses: 0, lastReviewed: 0 };
}

/**
 * Next state after one answer.
 * - A lapse (quality < 3) always resets the item and brings it back after RELEARN_MS.
 * - A pass on an item that is not yet due (met again early in the feed) changes nothing,
 *   so that repeated practice in one sitting does not inflate the interval.
 * - Otherwise standard SM-2: intervals 1, 6, then interval × ease; ease adjusted by quality.
 */
export function review(prev: SrsState, score: number, now: number): SrsState {
  const q = quality(score);
  const base = { ...prev, lastReviewed: now };
  if (q < 3) {
    return { ...base, reps: 0, intervalDays: 0, lapses: prev.reps > 0 ? prev.lapses + 1 : prev.lapses, due: now + RELEARN_MS };
  }
  if (prev.reps > 0 && now < prev.due) return prev;

  const reps = prev.reps + 1;
  const ease = Math.max(MIN_EASE, prev.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  const intervalDays = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(prev.intervalDays * ease);
  return { ...base, reps, ease, intervalDays, due: now + intervalDays * DAY };
}

/** End of the local calendar day containing `now`: "due today" means due before this. */
export function endOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}
