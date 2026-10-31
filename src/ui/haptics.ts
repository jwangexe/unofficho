/**
 * A short vibration on answering, where the device supports it (Android; iOS Safari ignores
 * the Vibration API). Off when the user prefers reduced motion.
 */
import { prefersReducedMotion } from './Feed';

export function hapticForScore(score: number) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator) || prefersReducedMotion()) return;
  try {
    navigator.vibrate(score >= 1 ? 15 : score > 0 ? [15, 60, 15] : [40, 50, 40]);
  } catch {
    // Some browsers throw without a user gesture; silence is fine.
  }
}
