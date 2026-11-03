/**
 * The placement quiz: one real Calculations question per level, easiest first, as a
 * four-option multiple choice. Wrong options are the question's own misconceptions where it
 * has them, then near misses (a factor of 10, a sign, ±1 for a log scale).
 */
import { LEVEL_IDS, levelRank, type LevelId } from '@/data/levels';
import { CALC_TEMPLATES } from '@/data/templates';
import { convert, displayValue, formatQuantity, toSI, type Quantity } from '@/engine/quantity';
import { getUnit } from '@/engine/units';
import { instantiate, rng, type CalcInstance, type CalcTemplate } from '@/engine/template';

export interface PlacementQuestion {
  level: LevelId;
  template: CalcTemplate;
  inst: CalcInstance;
  options: string[];
  answer: number;
}

/** Templates whose easiest level is `level`: answering one right says something about that level. */
export function placementCandidates(level: LevelId): CalcTemplate[] {
  return CALC_TEMPLATES.filter((t) => Math.min(...t.levels.map(levelRank)) === levelRank(level));
}

/** Near-miss values in the answer's display unit. */
function nearMisses(x: number, logScale: boolean): number[] {
  if (logScale) return [x + 1, x - 1, x + 2, x - 2, 14 - x];
  return [x * 10, x / 10, ...(x < 0 ? [-x] : []), x * 2, x / 2, x * 1000];
}

export function buildQuestion(level: LevelId, t: CalcTemplate, seed: number): PlacementQuestion | null {
  const res = instantiate(t, seed);
  if (!res.ok) return null;
  const inst = res.value;
  const r = rng(seed ^ 0x9e3779b9);
  const fmt = (q: Quantity) => formatQuantity(q, 3);
  const right = fmt(inst.expected);
  const seen = new Set([right]);
  const wrong: string[] = [];
  const add = (s: string) => {
    if (wrong.length < 3 && !seen.has(s)) {
      seen.add(s);
      wrong.push(s);
    }
  };
  for (const m of inst.misconceptionValues) {
    const c = convert(m.q, inst.expected.unit);
    if (c.ok) add(fmt(c.value));
  }
  const x = displayValue(inst.expected);
  // A dimensionless answer between 0 and 14 is probably a log scale (pH, pKa): near misses are additive.
  const logScale = getUnit(inst.expected.unit).symbol === '' && x > 0 && x < 14;
  for (const v of nearMisses(x, logScale)) add(fmt({ ...inst.expected, value: toSI(v, inst.expected.unit, inst.expected.kind) }));
  if (wrong.length < 3) return null;

  const options = [right, ...wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  return { level, template: t, inst, options, answer: options.indexOf(right) };
}

/** One question per level, easiest first. Prefers questions with built-in misconceptions. */
export function buildPlacement(seed: number): PlacementQuestion[] {
  const r = rng(seed);
  return LEVEL_IDS.flatMap((level) => {
    const shuffled = placementCandidates(level)
      .map((t) => ({ t, k: r() }))
      .sort((a, b) => a.k - b.k)
      .map(({ t }) => t);
    const prefer = [...shuffled.filter((t) => t.misconceptions?.length), ...shuffled.filter((t) => !t.misconceptions?.length)];
    for (const t of prefer) {
      for (let k = 0; k < 5; k++) {
        const q = buildQuestion(level, t, Math.floor(r() * 2 ** 32));
        if (q) return [q];
      }
    }
    return [];
  });
}

/** The highest level answered correctly; A-level if none were. */
export function recommend(results: readonly { level: LevelId; correct: boolean }[]): LevelId {
  let best: LevelId = 'alevel';
  for (const x of results) if (x.correct && levelRank(x.level) > levelRank(best)) best = x.level;
  return best;
}
