import { describe, expect, it } from 'vitest';
import { CASE_PARTS, CASE_STUDIES, calcTemplateById } from '@/data/templates';
import { instantiateCase } from '@/engine/caseStudy';
import { checkAnswer } from '@/engine/check';
import { displayValue } from '@/engine/quantity';

describe('case studies', () => {
  it('have unique part ids that start with the case id, and at least two wordings per part', () => {
    const ids = CASE_PARTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CASE_STUDIES) {
      expect(c.parts.length, c.id).toBeGreaterThanOrEqual(2);
      c.parts.forEach((t, i) => {
        expect(t.id.startsWith(`${c.id}-`), t.id).toBe(true);
        expect(t.id.startsWith('case-'), t.id).toBe(true);
        expect(t.caseStudy).toMatchObject({ id: c.id, part: i + 1, parts: c.parts.length });
        expect(t.wordings.length, t.id).toBeGreaterThan(1);
        expect(calcTemplateById.get(t.id)).toBe(t);
      });
    }
  });

  for (const c of CASE_STUDIES) {
    it(`${c.id}: every part shows the same numbers, and the reference route is marked correct`, () => {
      const stems = new Set<string>();
      for (let seed = 1; seed <= 100; seed++) {
        const insts = instantiateCase(c, seed);
        expect(insts).toHaveLength(c.parts.length);
        const intro = insts[0]!.intro!;
        expect(intro, c.id).not.toMatch(/\{\w+\}/);
        stems.add(intro);
        insts.forEach((inst, i) => {
          const t = c.parts[i]!;
          expect(inst.intro).toBe(intro);
          expect(inst.text).not.toMatch(/\{\w+\}/);
          expect(Number.isFinite(displayValue(inst.expected)), t.id).toBe(true);
          const res = checkAnswer(t, inst, inst.expected, Object.values(inst.referenceValues));
          expect(res.correct, `${t.id} seed ${seed}`).toBe(true);
        });
      }
      // Fresh numbers each time.
      expect(stems.size).toBeGreaterThan(50);
    });
  }

  it('hand later parts an earlier answer that matches it', () => {
    // Carried-forward values come from the unrounded setup, so they agree with the earlier
    // part's own answer to within rounding.
    for (const c of CASE_STUDIES) {
      for (let seed = 1; seed <= 20; seed++) {
        const insts = instantiateCase(c, seed);
        insts.forEach((inst, i) => {
          for (const g of inst.givens.slice(c.shared)) {
            const from = /from \(([a-z])\)/.exec(g.label)?.[1];
            if (!from) continue;
            const earlier = insts[from.charCodeAt(0) - 97]!;
            expect(i, `${c.id}: ${g.label}`).toBeGreaterThan(from.charCodeAt(0) - 97);
            const rel = Math.abs(g.q.value - earlier.expected.value) / Math.abs(earlier.expected.value);
            expect(rel, `${c.id} seed ${seed}: ${g.label}`).toBeLessThan(0.02);
          }
        });
      }
    }
  });
});
