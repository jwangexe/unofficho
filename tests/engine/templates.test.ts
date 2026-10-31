import { describe, expect, it } from 'vitest';
import { ALL_TEMPLATES, PROBLEMS, calcTemplateById } from '@/data/templates';
import { instantiate, type CalcInstance } from '@/engine/template';
import { checkAnswer, compareRoute } from '@/engine/check';
import { evaluateGraph } from '@/engine/graph';
import { formulaById } from '@/engine/formulas';
import { solveFormula } from '@/engine/formula';
import { displayValue, qty, type Quantity } from '@/engine/quantity';
import { getUnit } from '@/engine/units';
import * as ops from '@/engine/ops';

const inst = (id: string, seed = 1): CalcInstance => {
  const r = instantiate(calcTemplateById.get(id)!, seed);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};
const given = (i: CalcInstance, key: string) => i.givens.find((g) => g.key === key)!.q;
const scaled = (q: Quantity, k: number): Quantity => ({ ...q, value: q.value * k });

describe('every template', () => {
  for (const t of ALL_TEMPLATES) {
    it(`${t.id}: 150 instances generate, with rounded givens and a finite answer`, () => {
      const texts = new Set<string>();
      for (let seed = 0; seed < 150; seed++) {
        const r = instantiate(t, seed);
        if (!r.ok) throw new Error(`seed ${seed}: ${r.error.message}`);
        const i = r.value;
        expect(Number.isFinite(i.expected.value)).toBe(true);
        expect(i.text).not.toMatch(/\{\w+\}/);
        texts.add(i.text);
        for (const g of i.givens) {
          // The value on screen is exactly the value used.
          const d = displayValue(g.q);
          expect(Number(d.toPrecision(g.sig))).toBeCloseTo(d, 9);
        }
        // Following the reference route is marked correct.
        const res = checkAnswer(t, i, i.expected, Object.values(i.referenceValues));
        expect(res.correct).toBe(true);
        expect(res.missed).toEqual([]);
      }
      // Problems with fixed tabulated data vary less than feed templates.
      expect(texts.size).toBeGreaterThan(PROBLEMS.includes(t) ? 20 : 100);
    });

    it(`${t.id}: well-formed`, () => {
      expect(() => getUnit(t.answer.unit)).not.toThrow();
      expect(t.wordings.length).toBeGreaterThan(1);
      const keys = new Set(t.given.map((g) => g.key));
      for (const w of t.wordings) for (const [, k] of w.matchAll(/\{(\w+)\}/g)) expect(keys.has(k!), `{${k}} in ${t.id}`).toBe(true);
      expect(new Set(t.reference.map((n) => n.id)).size).toBe(t.reference.length);
      for (const n of t.reference) if ('formula' in n) expect(formulaById.has(n.formula), n.formula).toBe(true);
    });
  }

  it('the same seed always gives the same question', () => {
    for (const t of ALL_TEMPLATES) {
      const a = instantiate(t, 42);
      const b = instantiate(t, 42);
      expect(a.ok && b.ok && a.value.text === b.value.text && a.value.expected.value === b.value.expected.value).toBe(true);
    }
  });
});

describe('answer checking', () => {
  const t = calcTemplateById.get('calc-k-from-dh-ds')!;
  const i = inst('calc-k-from-dh-ds', 3);

  it('accepts within 1 % and rejects outside', () => {
    expect(checkAnswer(t, i, scaled(i.expected, 1.009), []).correct).toBe(true);
    expect(checkAnswer(t, i, scaled(i.expected, 1.02), []).correct).toBe(false);
  });

  it('rejects the right number with the wrong dimension', () => {
    const res = checkAnswer(t, i, { ...i.expected, dim: qty(1, 'J').dim, unit: 'J' }, []);
    expect(res.correct).toBe(false);
    expect(res.diagnoses[0]).toMatch(/units/);
  });

  it('compares routes by value, so an equivalent route counts', () => {
    // Build ΔG by hand (ΔH − T·ΔS with arithmetic ops) instead of using the gibbs formula.
    const TdS = ops.mul(given(i, 'T'), given(i, 'dS'));
    if (!TdS.ok) throw new Error();
    const dG = ops.sub(given(i, 'dH'), TdS.value);
    if (!dG.ok) throw new Error();
    const route = compareRoute(i, [TdS.value, dG.value]);
    expect(route.matched).toContain('dG');
    expect(route.missed).toEqual(['K']);
  });
});

describe('diagnosis', () => {
  it('spots a missing square root in a weak-acid pH', () => {
    const t = calcTemplateById.get('calc-weak-acid-ph')!;
    const i = inst(t.id, 7);
    const wrong = evaluateGraph(t.misconceptions![0]!.reference, Object.fromEntries(i.givens.map((g) => [`g.${g.key}`, g.q])));
    if (!wrong.ok) throw new Error();
    const res = checkAnswer(t, i, wrong.value['n.pH']!, []);
    expect(res.correct).toBe(false);
    expect(res.diagnoses[0]).toMatch(/square root/);
  });

  it('spots the wrong rate-law order', () => {
    const t = calcTemplateById.get('calc-first-order-remaining')!;
    for (let seed = 0; seed < 20; seed++) {
      const i = inst(t.id, seed);
      const second = i.misconceptionValues.find((m) => /second-order/.test(m.message));
      if (!second) continue;
      expect(checkAnswer(t, i, second.q, []).diagnoses[0]).toMatch(/second-order/);
      return;
    }
    throw new Error('no instance with a distinguishable second-order answer');
  });

  it('spots a kJ/J slip on ΔS', () => {
    const t = calcTemplateById.get('calc-gibbs-dg')!;
    const i = inst(t.id, 11);
    // ΔS taken as kJ instead of J: the TΔS term is 1000× too big.
    const f = formulaById.get('gibbs')!;
    const wrong = solveFormula(f, 'dG', { dH: given(i, 'dH'), T: given(i, 'T'), dS: scaled(given(i, 'dS'), 1000) });
    if (!wrong.ok) throw new Error();
    expect(checkAnswer(t, i, wrong.value.quantity, []).diagnoses.join(' ')).toMatch(/ΔS.*1000/);
  });

  it('spots ln vs log₁₀', () => {
    const t = calcTemplateById.get('calc-dg0-from-k')!;
    const i = inst(t.id, 5);
    expect(checkAnswer(t, i, scaled(i.expected, 1 / Math.LN10), []).diagnoses[0]).toMatch(/ln and log/);
  });

  it('spots a missing factor of n', () => {
    const t = calcTemplateById.get('calc-gibbs-emf')!;
    for (let seed = 0; seed < 30; seed++) {
      const i = inst(t.id, seed);
      const n = displayValue(given(i, 'n'));
      if (n === 1) continue;
      expect(checkAnswer(t, i, scaled(i.expected, 1 / n), []).diagnoses[0]).toMatch(new RegExp(`factor of ${n}`));
      return;
    }
  });

  it('spots swapped temperatures as a sign error', () => {
    const t = calcTemplateById.get('calc-arrhenius-ea')!;
    const i = inst(t.id, 2);
    expect(checkAnswer(t, i, scaled(i.expected, -1), []).diagnoses.join(' ')).toMatch(/sign/);
  });
});
