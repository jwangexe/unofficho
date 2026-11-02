import { describe, expect, it } from 'vitest';
import { calcTemplateById, CALC_TEMPLATES, PROBLEMS } from '@/data/templates';
import { displayValue, qty } from '@/engine/quantity';
import { instantiate, type CalcTemplate } from '@/engine/template';
import { allItems, compareAnswer, exportMarkdown, flagOutliers, parseAnswer, parseUnit, progressBySection, sampleAnswers } from '@/features/review/reviewLogic';

describe('typed units', () => {
  it.each([
    ['kJ/mol', 'kJ/mol'],
    ['kJ mol-1', 'kJ/mol'],
    ['kJ mol⁻¹', 'kJ/mol'],
    ['kJ mol^-1', 'kJ/mol'],
    ['J K-1 mol-1', 'J/(K mol)'],
    ['mol dm^-3', 'mol/dm3'],
    ['mol/L', 'mol/dm3'],
    ['M', 'mol/dm3'],
    ['dm³ mol⁻¹ s⁻¹', 'dm3/(mol s)'],
    ['s^-1', '1/s'],
    ['°C', 'degC'],
    ['µmol', 'umol'],
    ['%', '%'],
    ['', '1'],
  ])('%s → %s', (text, id) => {
    expect(parseUnit(text)?.id).toBe(id);
  });

  it('rejects nonsense', () => {
    expect(parseUnit('furlongs per fortnight')).toBeNull();
  });
});

describe('typed answers', () => {
  it('reads plain, scientific and ×10 notation, with unicode minus and superscripts', () => {
    const v = (s: string) => {
      const r = parseAnswer(s, 'kJ/mol');
      if (!r.ok) throw new Error(r.error);
      return displayValue(r.q);
    };
    expect(v('-56.3 kJ/mol')).toBeCloseTo(-56.3, 10);
    expect(v('−56.3 kJ mol⁻¹')).toBeCloseTo(-56.3, 10);
    expect(v('1.2e-3 kJ/mol')).toBeCloseTo(1.2e-3, 15);
    expect(v('1.2×10^-3 kJ/mol')).toBeCloseTo(1.2e-3, 15);
    expect(v('1.2 x 10⁻³ kJ/mol')).toBeCloseTo(1.2e-3, 15);
  });

  it('assumes the question’s unit when none is typed', () => {
    const r = parseAnswer('42', 's');
    expect(r.ok && [r.q.unit, r.assumedUnit]).toEqual(['s', true]);
  });

  it('explains what went wrong', () => {
    expect(parseAnswer('about forty', 's')).toMatchObject({ ok: false, error: expect.stringMatching(/number/) });
    expect(parseAnswer('42 widgets', 's')).toMatchObject({ ok: false, error: expect.stringMatching(/Unknown unit/) });
  });
});

describe('comparing with the reference', () => {
  const t = calcTemplateById.get('calc-second-order-half-life')!;
  const inst = (() => {
    const r = instantiate(t, 7);
    if (!r.ok) throw new Error(r.error.message);
    return r.value;
  })();
  const ref = inst.expected.value; // seconds (SI)

  it('agrees within the app’s tolerance, in any unit of the right dimension', () => {
    expect(compareAnswer(t, inst, qty(ref, 's'))).toMatchObject({ dimOk: true, agrees: true, relDiff: 0, absDiff: 0 });
    expect(compareAnswer(t, inst, qty(ref / 60, 'min')).agrees).toBe(true);
    expect(compareAnswer(t, inst, qty(ref * 1.005, 's')).agrees).toBe(true);
  });

  it('flags a different value or the wrong kind of quantity', () => {
    const off = compareAnswer(t, inst, qty(ref * 1.1, 's'));
    expect(off.agrees).toBe(false);
    expect(off.relDiff).toBeCloseTo(0.1, 6);
    expect(compareAnswer(t, inst, qty(ref, 'mol'))).toEqual({ dimOk: false, agrees: false, relDiff: null, absDiff: null });
  });

  it('uses an absolute tolerance where the template has one (e.g. pH)', () => {
    const pH = [...CALC_TEMPLATES, ...PROBLEMS].find((x) => typeof x.tolerance === 'object')!;
    const r = instantiate(pH, 3);
    if (!r.ok) throw new Error(r.error.message);
    const abs = (pH.tolerance as { abs: number }).abs;
    expect(compareAnswer(pH, r.value, qty(displayValue(r.value.expected) + abs * 0.9, pH.answer.unit)).agrees).toBe(true);
    expect(compareAnswer(pH, r.value, qty(displayValue(r.value.expected) + abs * 1.5, pH.answer.unit)).agrees).toBe(false);
  });
});

describe('sampling instances for range problems', () => {
  const base = (overrides: Partial<CalcTemplate>): CalcTemplate => ({
    id: 'test',
    topic: 'kinetics',
    title: 'Test',
    difficulty: 1,
    params: { x: { unit: 's', min: 1, max: 2 } },
    given: [{ key: 'x', label: 'x', from: 'p.x' }],
    reference: [{ id: 'y', op: 'scale', inputs: ['g.x'], coef: 1 }],
    answer: { node: 'y', label: 'y', unit: 's' },
    wordings: ['{x}'],
    explanation: '',
    reviewed: false,
    ...overrides,
  });

  it('finds nothing to flag in a well-behaved template', () => {
    const s = sampleAnswers(base({}));
    expect(s).toHaveLength(20);
    expect(s.flatMap((x) => x.flags)).toEqual([]);
  });

  it('flags a stray value but not a uniformly wide spread', () => {
    expect(flagOutliers([1, 1.1, 0.9, 1.05, 0.95, 1.02, 1000])).toEqual([false, false, false, false, false, false, true]);
    const wide = Array.from({ length: 20 }, (_, i) => 10 ** (-8 + (16 * i) / 19));
    expect(flagOutliers(wide).some(Boolean)).toBe(false);
  });

  it('flags numbers too extreme to read', () => {
    const huge = base({ params: { x: { unit: 's', min: 1e13, max: 1e14, log: true } } });
    expect(sampleAnswers(huge)[0]!.flags).toContain('extreme number (beyond 10^±12)');
  });

  it('flags physically impossible answers', () => {
    const negative = base({
      params: { x: { unit: 'mol/dm3', min: 0.1, max: 0.2 } },
      reference: [{ id: 'y', op: 'scale', inputs: ['g.x'], coef: -1 }],
      answer: { node: 'y', label: 'c', unit: 'mol/dm3' },
    });
    expect(sampleAnswers(negative)[0]!.flags[0]).toMatch(/negative/);
  });

  it('runs on every real template without throwing', () => {
    for (const t of [...CALC_TEMPLATES, ...PROBLEMS]) expect(sampleAnswers(t, 5)).toHaveLength(5);
  });
});

describe('queue and progress', () => {
  it('starts with the easiest feed questions and covers every section', () => {
    const items = allItems();
    expect(items[0]!.section).toBe('feed');
    expect(items[0]!.difficulty).toBe(1);
    expect(new Set(items.map((i) => i.section))).toEqual(new Set(['feed', 'multi', 'mechanisms', 'reagents', 'book', 'formulas']));
    expect(new Set(items.map((i) => i.key)).size).toBe(items.length);
  });

  it('counts marks made on this device as reviewed', () => {
    const items = allItems();
    const first = items.find((i) => i.section === 'mechanisms')!;
    const before = progressBySection(items, new Set()).find((p) => p.section === 'mechanisms')!;
    const after = progressBySection(items, new Set([first.key])).find((p) => p.section === 'mechanisms')!;
    expect(after.reviewed - before.reviewed).toBe(first.reviewed ? 0 : 1);
  });
});

describe('markdown export', () => {
  it('lists problems with their instance, then items marked reviewed on this device', () => {
    const md = exportMarkdown(
      [
        {
          key: 'template:calc-x',
          kind: 'template',
          id: 'calc-x',
          title: 'Second-order half-life',
          note: 'Answer is\nout by a factor of 2',
          createdAt: 0,
          instance: { seed: 42, question: 'k = 0.5 … find t½', myAnswer: '4.0 s', reference: '2.0 s', agreed: false },
        },
        { key: 'reagent:nabh4', kind: 'reagent', id: 'nabh4', title: 'Sodium borohydride', note: 'pKaH missing', createdAt: 0 },
      ],
      [{ key: 'mechanism:mech-ozone', kind: 'mechanism', id: 'mech-ozone', title: 'Decomposition of ozone', at: 0 }],
      new Date('2026-11-02T12:00:00Z'),
    );
    expect(md).toBe(
      [
        '# UnoffIChO review notes (2026-11-02)',
        '',
        '## Problems found (2)',
        '',
        '- **Second-order half-life** (`template` `calc-x`)',
        '  - Note: Answer is out by a factor of 2',
        '  - Instance: seed 42: k = 0.5 … find t½',
        '  - my answer 4.0 s; reference 2.0 s (DISAGREED)',
        '- **Sodium borohydride** (`reagent` `nabh4`)',
        '  - Note: pKaH missing',
        '',
        '## Marked reviewed here, not yet in the source (1)',
        '',
        '- `mechanism` `mech-ozone`: Decomposition of ozone → set `reviewed: true`',
        '',
      ].join('\n'),
    );
  });

  it('says so when there is nothing to report', () => {
    expect(exportMarkdown([], [], new Date('2026-11-02'))).toContain('## Problems found (0)\n\nNone.');
  });
});
