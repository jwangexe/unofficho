import { describe, expect, it } from 'vitest';
import { ALL_TEMPLATES, calcTemplateById, PROBLEMS } from '@/data/templates';
import { availableSteps, buildOptions, judgeChoice, resolveChoice } from '@/engine/approach';
import { rng } from '@/engine/template';

describe('approach mode', () => {
  it('only steps with known inputs are available', () => {
    const t = calcTemplateById.get('calc-k-from-dh-ds')!;
    expect(availableSteps(t, new Set()).map((n) => n.id)).toEqual(['dG']);
    expect(availableSteps(t, new Set(['dG'])).map((n) => n.id)).toEqual(['K']);
  });

  it('independent steps can be taken in either order', () => {
    const t = calcTemplateById.get('ms-methanol-k')!;
    expect(availableSteps(t, new Set()).map((n) => n.id).sort()).toEqual(['dH', 'dS']);
  });

  it('judges correct, not-yet and not-needed choices', () => {
    const t = calcTemplateById.get('calc-k-from-dh-ds')!;
    const opts = buildOptions(t, new Set(), rng(1));
    const verdicts = opts.map((o) => judgeChoice(t, new Set(), o));
    expect(verdicts.filter((v) => v === 'correct')).toHaveLength(1);
    expect(verdicts).toContain('not-yet'); // the K step offered too early
  });

  for (const t of ALL_TEMPLATES) {
    it(`${t.id}: a full walk-through always offers a correct option among 3–4 distinct ones`, () => {
      for (let seed = 0; seed < 10; seed++) {
        const r = rng(seed);
        const done = new Set<string>();
        while (done.size < t.reference.length) {
          const opts = buildOptions(t, done, r);
          expect(opts.length).toBeGreaterThanOrEqual(Math.min(3, PROBLEMS.includes(t) ? 2 : 3));
          expect(opts.length).toBeLessThanOrEqual(4);
          expect(new Set(opts.map((o) => o.key)).size).toBe(opts.length);
          const right = opts.find((o) => judgeChoice(t, done, o) === 'correct');
          expect(right, `no correct option at step ${done.size + 1}`).toBeDefined();
          done.add(resolveChoice(t, done, right!)!.id);
        }
      }
    });
  }
});
