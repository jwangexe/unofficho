/**
 * Working tables: a row of like quantities (masses of C, H and O; three titres) and further
 * rows made from it, a column at a time, by a formula or an arithmetic step. Empirical formulas
 * (mass → moles → ÷ smallest) and titration tables (final − initial → mean) both fit.
 */
import { D, eqDim } from './dims';
import { checkAssignment, solveFormula, type Formula } from './formula';
import * as ops from './ops';
import { qty, type Quantity } from './quantity';
import { fail, ok, type Result } from './result';
import { getUnit } from './units';

export interface Cell {
  q: Quantity;
  /** Workspace chips this value came from. */
  deps: string[];
}

export interface TableRow {
  id: string;
  /** Short name shown at the start of the row, e.g. "n" or "ratio". */
  label: string;
  /** How the row was made, e.g. "n = m/M" (LaTeX). */
  latex?: string;
  cells: Cell[];
}

export interface CalcTable {
  columns: string[];
  rows: TableRow[];
}

/** A value to feed into every column: a whole row, or one chip used for every column. */
export type Source = { row: TableRow } | { chip: { id: string; q: Quantity } };

export const MAX_COLUMNS = 6;

const unitLabel = (q: Quantity) => getUnit(q.unit).symbol || 'no units';
const sameDim = (cells: readonly Cell[]): Result<Cell[]> => {
  const first = cells[0];
  if (!first) return fail('missing', 'The row is empty');
  const odd = cells.find((c) => !eqDim(c.q.dim, first.q.dim));
  return odd
    ? fail('dimension', `Every value in a row needs the same kind of units (${unitLabel(first.q)} vs ${unitLabel(odd.q)})`)
    : ok([...cells]);
};

/** A row of chips, one per column, all with the same kind of units. */
export function rowFromChips(chips: readonly { id: string; q: Quantity }[]): Result<Cell[]> {
  return sameDim(chips.map((c) => ({ q: c.q, deps: [c.id] })));
}

const at = (s: Source, j: number): Cell | undefined => ('row' in s ? s.row.cells[j] : { q: s.chip.q, deps: [s.chip.id] });
const merge = (...cells: (Cell | undefined)[]) => [...new Set(cells.flatMap((c) => c?.deps ?? []))];

/** Run `fn` on every column, stopping at the first column that fails. */
function eachColumn(n: number, fn: (j: number) => Result<Cell>): Result<Cell[]> {
  const out: Cell[] = [];
  for (let j = 0; j < n; j++) {
    const r = fn(j);
    if (!r.ok) return r;
    out.push(r.value);
  }
  return sameDim(out);
}

export type RowOp = 'add' | 'sub' | 'mul' | 'div';

/** row ∘ source, column by column (source is another row or one chip for every column). */
export function arithmeticRow(op: RowOp, a: TableRow, b: Source): Result<Cell[]> {
  return eachColumn(a.cells.length, (j) => {
    const x = a.cells[j]!;
    const y = at(b, j)!;
    const r = ops[op](x.q, y.q);
    return r.ok ? ok({ q: r.value, deps: merge(x, y) }) : r;
  });
}

/** Each value divided by the smallest in the row: the simplest whole-number ratio, before rounding. */
export function divideBySmallest(a: TableRow): Result<Cell[]> {
  const smallest = a.cells.reduce((m, c) => (Math.abs(c.q.value) < Math.abs(m.q.value) ? c : m), a.cells[0]!);
  if (smallest.q.value === 0) return fail('domain', 'The smallest value is zero, so there is nothing to divide by');
  return eachColumn(a.cells.length, (j) => {
    const r = ops.div(a.cells[j]!.q, smallest.q);
    return r.ok ? ok({ q: r.value, deps: merge(a.cells[j], smallest) }) : r;
  });
}

/** Every value times a whole number, e.g. ×2 to clear a ratio of 1 : 1.5. */
export function scaleRow(a: TableRow, n: number): Result<Cell[]> {
  return eachColumn(a.cells.length, (j) => {
    const r = ops.mul(a.cells[j]!.q, qty(n, '1'));
    return r.ok ? ok({ q: r.value, deps: a.cells[j]!.deps }) : r;
  });
}

/** A ratio rounded to whole numbers; refused when a value is not close to one (that needs ×2, ×3…). */
export function roundRow(a: TableRow, tolerance = 0.1): Result<Cell[]> {
  if (a.cells.some((c) => !eqDim(c.q.dim, D.none))) return fail('dimension', 'Round a ratio (no units), not a measured quantity');
  const far = a.cells.find((c) => Math.abs(c.q.value - Math.round(c.q.value)) > tolerance);
  if (far) return fail('domain', `${+far.q.value.toFixed(2)} is not close to a whole number. Multiply the row by a small whole number first.`);
  return ok(a.cells.map((c) => ({ q: qty(Math.round(c.q.value), '1'), deps: c.deps })));
}

/**
 * A formula applied down every column: each input comes from a row (its value in that column)
 * or from one chip used for every column. `fixed` holds values set with steppers.
 */
export function formulaRow(
  f: Formula,
  unknown: string,
  inputs: Record<string, Source>,
  columns: number,
  fixed: Record<string, Quantity> = {},
): Result<{ cells: Cell[]; warnings: string[] }> {
  const warnings = new Set<string>();
  const cells = eachColumn(columns, (j) => {
    const given: Record<string, Quantity> = { ...fixed };
    for (const [sym, s] of Object.entries(inputs)) {
      const cell = at(s, j);
      if (!cell) return fail('missing', 'A row is shorter than the table');
      const check = checkAssignment(f, sym, cell.q, given);
      if (!check.ok) return check;
      given[sym] = cell.q;
    }
    const r = solveFormula(f, unknown, given);
    if (!r.ok) return r;
    r.value.warnings.forEach((w) => warnings.add(w));
    return ok({ q: r.value.quantity, deps: merge(...Object.values(inputs).map((s) => at(s, j))) });
  });
  return cells.ok ? ok({ cells: cells.value, warnings: [...warnings] }) : cells;
}

/** The mean of some cells of one row (e.g. concordant titres). */
export function meanOf(cells: readonly Cell[]): Result<Cell> {
  const r = ops.weightedSum(cells.map((c) => ({ coef: 1 / cells.length, q: c.q })));
  return r.ok ? ok({ q: r.value, deps: merge(...cells) }) : r;
}

/** Every value in a table, for working out which reference steps a student reached. */
export const tableQuantities = (table: CalcTable | undefined): Quantity[] => table?.rows.flatMap((r) => r.cells.map((c) => c.q)) ?? [];
