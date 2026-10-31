import type { Reagent, Role } from '@/data/schemas';

export interface ClassifyResult {
  score: number;
  /** Required roles you picked. */
  hit: Role[];
  /** Required roles you missed. */
  missed: Role[];
  /** Roles you picked that are wrong. */
  wrong: Role[];
  /** Defensible extras you picked (no penalty). */
  extra: Role[];
}

/**
 * Partial credit for a multi-select answer: (hits − wrong picks) / required roles,
 * clamped to 0–1. Picks in `alsoAccept` are neutral.
 */
export function scoreClassification(r: Reagent, selected: ReadonlySet<Role>): ClassifyResult {
  const accept = new Set(r.alsoAccept ?? []);
  const hit = r.roles.filter((x) => selected.has(x));
  const missed = r.roles.filter((x) => !selected.has(x));
  const wrong = [...selected].filter((x) => !r.roles.includes(x) && !accept.has(x));
  const extra = [...selected].filter((x) => accept.has(x));
  const score = Math.max(0, Math.min(1, (hit.length - wrong.length) / r.roles.length));
  return { score, hit, missed, wrong, extra };
}

/** Fast mode: one tap for the primary role. Another listed role earns half. */
export function scoreFast(r: Reagent, pick: Role): { score: number; verdict: 'primary' | 'secondary' | 'wrong' } {
  if (pick === r.primaryRole) return { score: 1, verdict: 'primary' };
  if (r.roles.includes(pick) || r.alsoAccept?.includes(pick)) return { score: 0.5, verdict: 'secondary' };
  return { score: 0, verdict: 'wrong' };
}
