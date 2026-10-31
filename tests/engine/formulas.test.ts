/**
 * Generic tests over the whole formula library:
 * every example is solved for its missing variable, then every other solvable variable
 * is recovered from the rest (round trip), and every LaTeX string must render.
 */
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { FORMULAS } from '@/engine/formulas';
import { formulaForSymbols, solveFormula, type Formula } from '@/engine/formula';
import { qty, type Quantity } from '@/engine/quantity';
import { getUnit } from '@/engine/units';
import { normalised } from '@/engine/solver';

const close = (a: number, b: number, rel = 1e-6) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b)) + 1e-300;

function assignedFrom(f: Formula, values: Record<string, number>): Record<string, Quantity> {
  const out: Record<string, Quantity> = {};
  for (const spec of f.vars) {
    const v = values[spec.sym];
    if (v !== undefined) out[spec.sym] = qty(v, spec.unit, spec.kind);
  }
  return out;
}

describe('formula library integrity', () => {
  it('has unique ids', () => {
    const ids = FORMULAS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const f of FORMULAS) {
    it(`${f.id}: well-formed`, () => {
      const syms = f.vars.map((v) => v.sym);
      expect(new Set(syms).size).toBe(syms.length);
      for (const v of f.vars) {
        expect(() => getUnit(v.unit)).not.toThrow();
        if (v.flexUnit) expect(() => getUnit(v.flexUnit!)).not.toThrow();
        if (v.solvable !== false) expect(f.rearranged[v.sym], `rearranged form for ${v.sym}`).toBeTruthy();
      }
      expect(f.examples.length).toBeGreaterThan(0);
    });

    it(`${f.id}: all LaTeX renders`, () => {
      const strings = [f.latex, ...Object.values(f.rearranged), ...f.vars.map((v) => v.latex)];
      for (const s of strings) expect(() => katex.renderToString(s, { throwOnError: true }), s).not.toThrow();
    });
  }
});

describe('formula round trips', () => {
  for (const base of FORMULAS) {
    let f = base;
    f.examples.forEach((example, i) => {
      it(`${f.id} example ${i + 1}: solve the missing variable, then recover every other`, () => {
        // Formulas with a species group are checked with as many species as the example uses.
        f = formulaForSymbols(base, Object.keys(example));
        const missing = f.vars.filter((v) => v.solvable !== false && !(v.sym in example));
        expect(missing.map((v) => v.sym), 'exactly one solvable variable omitted').toHaveLength(1);
        const target = missing[0]!;

        const assigned = assignedFrom(f, example);
        const solved = solveFormula(f, target.sym, assigned);
        if (!solved.ok) throw new Error(solved.error.message);
        const full: Record<string, Quantity> = { ...assigned, [target.sym]: solved.value.quantity };

        const si = Object.fromEntries(Object.entries(full).map(([k, q]) => [k, q.value]));
        expect(Math.abs(normalised(f.relation(si)))).toBeLessThan(1e-9);

        for (const spec of f.vars) {
          if (spec.solvable === false) continue;
          const { [spec.sym]: expected, ...rest } = full;
          const res = solveFormula(f, spec.sym, rest);
          if (!res.ok) throw new Error(`${spec.sym}: ${res.error.message}`);
          expect(close(res.value.quantity.value, expected!.value), `${spec.sym}: ${res.value.quantity.value} vs ${expected!.value}`).toBe(true);
        }
      });
    });
  }
});
