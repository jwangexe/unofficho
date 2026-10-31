import { recordAttempt } from '@/storage/progress';
import { hapticForScore } from '@/ui/haptics';

/** Record an answer (attempt log + review schedule) and give haptic feedback. */
export function answer(a: Parameters<typeof recordAttempt>[0]) {
  hapticForScore(a.score);
  return recordAttempt(a);
}
