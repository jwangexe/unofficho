import { describe, expect, it } from 'vitest';
import { formulaById } from '@/engine/formulas';
import { displayValue, qty } from '@/engine/quantity';
import { arithmeticRow, divideBySmallest, formulaRow, meanOf, roundRow, rowFromChips, scaleRow, type Cell, type TableRow } from '@/engine/table';

const chip = (id: string, v: number, unit: string) => ({ id, q: qty(v, unit) });
const row = (id: string, cells: Cell[]): TableRow => ({ id, label: id, cells });
const values = (cells: Cell[]) => cells.map((c) => +displayValue(c.q).toFixed(4));
const unwrap = <T,>(r: { ok: true; value: T } | { ok: false; error: { message: string } }): T => {
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};

describe('working tables', () => {
  it('empirical formula: mass → moles → ÷ smallest → round gives C2H6O', () => {
    const mass = row('m', unwrap(rowFromChips([chip('mC', 2.4, 'g'), chip('mH', 0.6, 'g'), chip('mO', 1.6, 'g')])));
    const M = row('M', unwrap(rowFromChips([chip('MC', 12, 'g/mol'), chip('MH', 1, 'g/mol'), chip('MO', 16, 'g/mol')])));
    const n = row('n', unwrap(formulaRow(formulaById.get('moles-mass')!, 'n', { m: { row: mass }, M: { row: M } }, 3)).cells);
    expect(values(n.cells)).toEqual([0.2, 0.6, 0.1]);
    const ratio = row('ratio', unwrap(divideBySmallest(n)));
    expect(values(ratio.cells)).toEqual([2, 6, 1]);
    expect(values(unwrap(roundRow(ratio)))).toEqual([2, 6, 1]);
    // Each value remembers the chips it came from.
    expect(ratio.cells[0]!.deps.sort()).toEqual(['MC', 'MO', 'mC', 'mO']);
  });

  it('a ratio of 1 : 1.5 must be scaled before it can be rounded', () => {
    const r = row('r', [{ q: qty(1, '1'), deps: [] }, { q: qty(1.5, '1'), deps: [] }]);
    expect(roundRow(r).ok).toBe(false);
    expect(values(unwrap(roundRow(row('x2', unwrap(scaleRow(r, 2))))))).toEqual([2, 3]);
  });

  it('titration: final − initial, then the mean of the concordant titres', () => {
    const final = row('final', unwrap(rowFromChips([chip('f1', 24.6, 'cm3'), chip('f2', 24.3, 'cm3'), chip('f3', 48.5, 'cm3')])));
    const initial = row('initial', unwrap(rowFromChips([chip('i1', 0.5, 'cm3'), chip('i2', 0.2, 'cm3'), chip('i3', 24.3, 'cm3')])));
    const titre = unwrap(arithmeticRow('sub', final, { row: initial }));
    expect(values(titre)).toEqual([24.1, 24.1, 24.2]);
    expect(+displayValue(unwrap(meanOf(titre)).q).toFixed(3)).toBe(24.133);
  });

  it('one chip can feed every column, and mixed units in a row are refused', () => {
    const V = row('V', unwrap(rowFromChips([chip('a', 25, 'cm3'), chip('b', 24, 'cm3')])));
    const n = unwrap(formulaRow(formulaById.get('concentration')!, 'n', { c: { chip: chip('c', 0.1, 'mol/dm3') }, V: { row: V } }, 2));
    expect(values(n.cells)).toEqual([0.0025, 0.0024]);
    expect(rowFromChips([chip('a', 1, 'g'), chip('b', 1, 'cm3')]).ok).toBe(false);
  });
});
