import { useState } from 'react';
import { eqDim, isDimensionless } from '@/engine/dims';
import { formatNumber } from '@/engine/format';
import { checkAssignment, type Formula } from '@/engine/formula';
import { fromSI, qty } from '@/engine/quantity';
import type { Result } from '@/engine/result';
import {
  arithmeticRow,
  divideBySmallest,
  formulaRow,
  MAX_COLUMNS,
  meanOf,
  roundRow,
  rowFromChips,
  scaleRow,
  type CalcTable,
  type Cell,
  type RowOp,
  type Source,
  type TableRow,
} from '@/engine/table';
import { getUnit } from '@/engine/units';
import { Tex } from '@/ui/Tex';
import { ChipButton } from './ChipButton';
import { ChipTray } from './ChipTray';
import type { ComputeOutput } from './FormulaPanel';
import type { Chip } from './store';

type Adding = 'chips' | 'formula' | 'arith';
/** Steps on the last row that need nothing else, so they add a row in one tap. */
type Quick = 'smallest' | 'x2' | 'x3' | 'round';

const QUICK_BUTTONS: { kind: Quick; label: string }[] = [
  { kind: 'smallest', label: '÷ smallest' },
  { kind: 'x2', label: '× 2' },
  { kind: 'x3', label: '× 3' },
  { kind: 'round', label: 'Round' },
];

const OPS: { op: RowOp; symbol: string }[] = [
  { op: 'add', symbol: '+' },
  { op: 'sub', symbol: '−' },
  { op: 'mul', symbol: '×' },
  { op: 'div', symbol: '÷' },
];

const field = 'min-h-11 rounded-lg border border-border bg-surface-2 px-2 text-base';
const pill = (on: boolean) => `min-h-11 rounded-md px-3 text-sm ${on ? 'bg-accent text-accent-ink' : 'bg-surface-2'}`;
const primary = 'min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40';
const short = (s: string) => (s.length > 14 ? `${s.slice(0, 13)}…` : s);

/** A row's display unit: its first cell's. */
const rowUnit = (row: TableRow) => row.cells[0]!.q.unit;
/** A rounded ratio (unitless, every value whole) reads 5 : 10 : 1; anything else keeps 3 s.f. (12.0 g mol⁻¹, 4.00). */
const isWholeRow = (row: TableRow) => row.cells.every((c) => isDimensionless(c.q.dim) && Number.isInteger(c.q.value));
const cellText = (c: Cell, unit: string, whole: boolean) => (whole ? String(c.q.value) : formatNumber(fromSI(c.q.value, unit, c.q.kind), 3));

/** "m(C)" → "m": a row label from the first chip's label. */
const stem = (label: string) => label.replace(/\s*\(.*\)\s*$/, '').trim() || label;
/** "m(C)" → "C": the column a chip belongs in. */
const part = (label: string) => /\(([^)]*)\)\s*$/.exec(label)?.[1]?.trim() || undefined;

/** Chips named alike, such as m(C), m(H), m(O): a ready-made row, one chip per column. */
function chipGroups(chips: Chip[]): { stem: string; chips: Chip[] }[] {
  const byStem = new Map<string, Chip[]>();
  for (const c of chips) {
    if (c.source === 'const' || !part(c.label)) continue;
    byStem.set(stem(c.label), [...(byStem.get(stem(c.label)) ?? []), c]);
  }
  return [...byStem]
    .filter(([, cs]) => cs.length >= 2 && cs.length <= MAX_COLUMNS && cs.every((c) => eqDim(c.q.dim, cs[0]!.q.dim)))
    .map(([name, cs]) => ({ stem: name, chips: cs }));
}

/** A group's chips in the table's column order, or nothing if it does not cover every column. */
function inColumnOrder(group: Chip[], columns: string[]): Chip[] | undefined {
  const ordered = columns.map((col) => group.find((c) => part(c.label) === col));
  return ordered.every((c): c is Chip => !!c) ? ordered : undefined;
}

/** Where each of a formula's inputs could come from: the latest row that fits, or the only chip that does. */
function guessSources(f: Formula, rows: TableRow[], chips: Chip[]): Record<string, Source> {
  const out: Record<string, Source> = {};
  for (const v of f.vars) {
    if (v.stepper) continue;
    const fits = (q: Cell['q']) => checkAssignment(f, v.sym, q, {}).ok;
    const row = [...rows].reverse().find((r) => fits(r.cells[0]!.q));
    const fitting = chips.filter((c) => c.source !== 'const' && fits(c.q));
    if (row) out[v.sym] = { row };
    else if (fitting.length === 1) out[v.sym] = { chip: fitting[0]! };
  }
  return out;
}

/** The one variable nothing in the table or question supplies: what the formula should solve for. */
function guessUnknown(f: Formula, sources: Record<string, Source>): string | null {
  const open = f.vars.filter((v) => !v.stepper && !sources[v.sym]);
  return open.length === 1 && open[0]!.solvable !== false ? open[0]!.sym : null;
}

function RowPicker({ rows, value, onChange, label }: { rows: TableRow[]; value: string | null; onChange: (id: string) => void; label: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {rows.map((r) => (
          <button key={r.id} type="button" role="radio" aria-checked={value === r.id} onClick={() => onChange(r.id)} className={pill(value === r.id)}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Pick a row or one chip: the value fed into every column. */
function SourcePicker({
  rows,
  chips,
  value,
  onChange,
  label,
}: {
  rows: TableRow[];
  chips: Chip[];
  value: Source | null;
  onChange: (s: Source) => void;
  label: string;
}) {
  const [chipMode, setChipMode] = useState(!!value && 'chip' in value);
  const rowId = value && 'row' in value ? value.row.id : null;
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-sm">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`${label}: source`}>
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={rowId === r.id}
            onClick={() => {
              setChipMode(false);
              onChange({ row: r });
            }}
            className={pill(rowId === r.id)}
          >
            Row {r.label}
          </button>
        ))}
        <button type="button" role="radio" aria-checked={chipMode} onClick={() => setChipMode(true)} className={pill(chipMode)}>
          One chip
        </button>
      </div>
      {chipMode && (
        <>
          {value && 'chip' in value && (
            <p className="text-xs text-muted">
              Every column uses <ChipButton chip={value.chip as Chip} />
            </p>
          )}
          <ChipTray chips={chips} onPick={(c) => onChange({ chip: c })} hint="The same chip is used in every column" />
        </>
      )}
    </div>
  );
}

export function TablePanel({
  table,
  onChange,
  chips,
  formulas,
  onCompute,
}: {
  table: CalcTable | undefined;
  onChange: (table: CalcTable | undefined) => void;
  chips: Chip[];
  /** Formulas that can fill a row (those listed for the student's level). */
  formulas: Formula[];
  onCompute: (out: ComputeOutput) => void;
}) {
  const [columns, setColumns] = useState(['1', '2', '3']);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [selected, setSelected] = useState<{ row: string; cols: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Row builders' state.
  const [slots, setSlots] = useState<(Chip | null)[]>([]);
  const [label, setLabel] = useState('');
  const [rowA, setRowA] = useState<string | null>(null);
  const [op, setOp] = useState<RowOp>('div');
  const [source, setSource] = useState<Source | null>(null);
  const [formulaId, setFormulaId] = useState<string | null>(null);
  const [unknown, setUnknown] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, Source>>({});
  const [steps, setSteps] = useState<Record<string, number>>({});

  const startAdding = (kind: Adding, n = table?.columns.length ?? 0) => {
    setAdding(kind);
    setError(null);
    setWarnings([]);
    setSelected(null);
    setSlots(Array(n).fill(null));
    setLabel('');
    setRowA(table?.rows.at(-1)?.id ?? null);
    setSource(null);
    setFormulaId(null);
    setUnknown(null);
    setInputs({});
  };

  const groups = chipGroups(chips);
  const newRow = (cells: Cell[], rowLabel: string, latex?: string, n = table?.rows.length ?? 0): TableRow => ({
    id: `r${n + 1}-${Date.now().toString(36)}`,
    label: short(rowLabel.trim() || `Row ${n + 1}`),
    latex,
    cells,
  });

  if (!table) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          Put like quantities side by side, such as the masses of each element or each titration, then make each new row from the
          ones above: mass → moles → ÷ smallest.
        </p>
        {groups.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted">Start from the question</p>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => {
                const cols = g.chips.map((c) => part(c.label)!);
                return (
                  <button
                    key={g.stem}
                    type="button"
                    onClick={() => {
                      const made = rowFromChips(g.chips);
                      if (made.ok) onChange({ columns: cols, rows: [newRow(made.value, g.stem)] });
                    }}
                    className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-ink"
                  >
                    {g.stem}: {cols.join(', ')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <p className="mb-1 text-xs text-muted">Columns</p>
          {/* The table's own header row, ready to fill in from left to right. */}
          <div className="flex items-stretch gap-1 overflow-x-auto rounded-xl border border-border bg-surface-2 p-1">
            {columns.map((c, i) => (
              <div key={i} className="flex min-w-11 flex-1 flex-col items-stretch">
                <input
                  className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-1 text-center text-base font-semibold"
                  value={c}
                  aria-label={`Column ${i + 1} name`}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setColumns(columns.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button
                  type="button"
                  aria-label={`Remove column ${i + 1}`}
                  disabled={columns.length <= 2}
                  onClick={() => setColumns(columns.filter((_, j) => j !== i))}
                  className="min-h-11 text-muted disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            {columns.length < MAX_COLUMNS && (
              <button
                type="button"
                aria-label="Add column"
                onClick={() => setColumns([...columns, String(columns.length + 1)])}
                className="min-h-11 min-w-11 self-start rounded-lg text-xl text-accent"
              >
                +
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">Name them after what they hold, e.g. C, H, O or Rough, 1, 2.</p>
        </div>
        <button
          type="button"
          className={primary}
          onClick={() => {
            onChange({ columns: columns.map((c, i) => c.trim() || String(i + 1)), rows: [] });
            startAdding('chips', columns.length);
          }}
        >
          {groups.length > 0 ? 'Or start with these columns' : 'Start with a row of chips'}
        </button>
      </div>
    );
  }

  const rows = table.rows;
  const rowById = (id: string | null) => rows.find((r) => r.id === id);
  const formula = formulas.find((f) => f.id === formulaId);

  const addRow = (made: Result<Cell[]>, rowLabel: string, latex?: string, extra: string[] = []) => {
    if (!made.ok) {
      setError(made.error.message);
      return;
    }
    onChange({ ...table, rows: [...rows, newRow(made.value, rowLabel, latex)] });
    setAdding(null);
    setError(null);
    setWarnings(extra);
  };

  const a = rowById(rowA);

  const build = () => {
    switch (adding) {
      case 'chips': {
        const filled = slots.filter((s): s is Chip => !!s);
        if (filled.length < slots.length) return setError('Fill every column first');
        return addRow(rowFromChips(filled), label || stem(filled[0]!.label));
      }
      case 'arith': {
        if (!a || !source) return setError('Choose both inputs');
        const sym = OPS.find((o) => o.op === op)!.symbol;
        const other = 'row' in source ? source.row.label : (source.chip as Chip).label;
        return addRow(arithmeticRow(op, a, source), label || `${a.label}${sym}${other}`, `\\text{${a.label}} ${sym} \\text{${other}}`);
      }
      case 'formula': {
        if (!formula || !unknown) return setError('Choose a formula and what to solve for');
        const needed = formula.vars.filter((v) => v.sym !== unknown && !v.stepper);
        const missing = needed.find((v) => !inputs[v.sym]);
        if (missing) return setError(`Choose where ${missing.label} comes from`);
        const fixed = Object.fromEntries(formula.vars.filter((v) => v.stepper).map((v) => [v.sym, qty(steps[v.sym] ?? v.stepper!.initial, '1')]));
        const r = formulaRow(formula, unknown, inputs, table.columns.length, fixed);
        const spec = formula.vars.find((v) => v.sym === unknown)!;
        return addRow(r.ok ? { ok: true, value: r.value.cells } : r, label || stem(spec.label), formula.rearranged[unknown], r.ok ? r.value.warnings : []);
      }
    }
  };

  const quick = (kind: Quick) => {
    const last = rows.at(-1);
    if (!last) return;
    setSelected(null);
    if (kind === 'smallest') return addRow(divideBySmallest(last), 'ratio', `\\text{${last.label}} \\div \\text{smallest}`);
    if (kind === 'round') return addRow(roundRow(last), 'whole', `\\text{round}(\\text{${last.label}})`);
    const n = kind === 'x2' ? 2 : 3;
    return addRow(scaleRow(last, n), `${n}×${last.label}`, `${n} \\times \\text{${last.label}}`);
  };

  /** Rows of the question's chips that fit the columns and are not in the table yet: one tap each. */
  const readyRows = groups
    .map((g) => ({ stem: g.stem, chips: inColumnOrder(g.chips, table.columns) }))
    .filter((g): g is { stem: string; chips: Chip[] } => !!g.chips && !rows.some((r) => r.cells[0]!.deps.join() === g.chips![0]!.id));

  const chooseFormula = (f: Formula) => {
    const sources = guessSources(f, rows, chips);
    const u = guessUnknown(f, sources);
    setFormulaId(f.id);
    setSteps(Object.fromEntries(f.vars.filter((v) => v.stepper).map((v) => [v.sym, v.stepper!.initial])));
    setUnknown(u);
    setInputs(u ? Object.fromEntries(Object.entries(sources).filter(([k]) => k !== u)) : {});
  };
  // Formulas the table can feed straight away come first.
  const sortedFormulas = adding === 'formula' ? [...formulas].sort((x, y) => +!guessUnknown(x, guessSources(x, rows, chips)) - +!guessUnknown(y, guessSources(y, rows, chips))) : formulas;

  const tap = (rowId: string, col: number) => {
    setError(null);
    if (!selected || selected.row !== rowId) return setSelected({ row: rowId, cols: [col] });
    const cols = selected.cols.includes(col) ? selected.cols.filter((c) => c !== col) : [...selected.cols, col].sort();
    setSelected(cols.length ? { row: rowId, cols } : null);
  };

  const exportSelection = () => {
    const row = rowById(selected?.row ?? null);
    if (!row || !selected) return;
    const names = selected.cols.map((c) => table.columns[c]!);
    setSelected(null);
    if (selected.cols.length === 1) {
      const cell = row.cells[selected.cols[0]!]!;
      onCompute({
        step: { title: `Table: ${row.label}, ${names[0]}`, latex: row.latex, inputs: cell.deps, warnings: [] },
        chip: { label: short(`${row.label}(${names[0]})`), q: cell.q, sig: 4 },
      });
      return;
    }
    const mean = meanOf(selected.cols.map((c) => row.cells[c]!));
    if (!mean.ok) return setError(mean.error.message);
    onCompute({
      step: { title: `Table: mean ${row.label} of ${names.join(', ')}`, inputs: mean.value.deps, warnings: [] },
      chip: { label: short(`mean ${row.label}`), q: mean.value.q, sig: 4 },
    });
  };

  const selectedRow = rowById(selected?.row ?? null);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2">
              <th scope="col" className="px-2 py-2 text-left font-normal text-muted">
                <span className="sr-only">Row</span>
              </th>
              {table.columns.map((c, i) => (
                <th key={i} scope="col" className="px-2 py-2 text-right font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length + 1} className="px-3 py-3 text-center text-muted">
                  No rows yet
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const unit = rowUnit(r);
              const whole = isWholeRow(r);
              const symbol = getUnit(unit).symbol;
              return (
                <tr key={r.id} className="border-t border-border">
                  <th scope="row" className="px-2 py-1 text-left font-normal">
                    <span className="block">{r.label}</span>
                    {symbol && <span className="block text-xs text-muted">{symbol}</span>}
                  </th>
                  {r.cells.map((c, j) => {
                    const on = selected?.row === r.id && selected.cols.includes(j);
                    return (
                      <td key={j} className="p-1 text-right">
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${r.label}, ${table.columns[j]}: ${cellText(c, unit, whole)} ${symbol}`}
                          onClick={() => tap(r.id, j)}
                          className={`min-h-11 w-full rounded-lg px-2 text-right tabular-nums ${on ? 'bg-accent text-accent-ink' : 'bg-surface'}`}
                        >
                          {cellText(c, unit, whole)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRow && selected && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportSelection} className="min-h-11 flex-1 rounded-xl bg-accent px-3 font-semibold text-accent-ink">
            {selected.cols.length === 1 ? 'Use as a chip' : `Use the mean of ${selected.cols.length} as a chip`}
          </button>
          <button type="button" onClick={() => setSelected(null)} className="min-h-11 rounded-xl bg-surface-2 px-3" aria-label="Clear selection">
            ✕
          </button>
        </div>
      )}
      {!selected && rows.length > 0 && !adding && (
        <p className="text-xs text-muted">Tap a value to use it as a chip; tap several in one row for their mean.</p>
      )}
      {warnings.map((w) => (
        <p key={w} className="text-xs text-warn">
          {w}
        </p>
      ))}

      {!adding && (
        <div>
          <p className="mb-1 text-xs text-muted">Add a row</p>
          <div className="flex flex-wrap gap-2">
            {readyRows.map((g) => (
              <button
                key={g.stem}
                type="button"
                onClick={() => {
                  setSelected(null);
                  addRow(rowFromChips(g.chips), g.stem);
                }}
                className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-ink"
              >
                Row {g.stem}
              </button>
            ))}
            {rows.length > 0 && (
              <button type="button" onClick={() => startAdding('formula')} className="min-h-11 rounded-md bg-surface-2 px-3 text-sm">
                Formula
              </button>
            )}
            {rows.length > 0 && (
              <button type="button" onClick={() => startAdding('arith')} className="min-h-11 rounded-md bg-surface-2 px-3 text-sm">
                + − × ÷
              </button>
            )}
            {rows.length > 0 &&
              QUICK_BUTTONS.map((b) => (
                <button
                  key={b.kind}
                  type="button"
                  onClick={() => quick(b.kind)}
                  aria-label={`${b.label} on row ${rows.at(-1)!.label}`}
                  className="min-h-11 rounded-md bg-surface-2 px-3 text-sm"
                >
                  {b.label}
                </button>
              ))}
            <button type="button" onClick={() => startAdding('chips')} className="min-h-11 rounded-md bg-surface-2 px-3 text-sm">
              Row of chips
            </button>
          </div>
          {rows.length > 0 && <p className="mt-1 text-xs text-muted">÷ smallest, × and Round act on the last row.</p>}
          <div className="mt-3 flex gap-4 text-sm">
            {rows.length > 0 && (
              <button
                type="button"
                className="min-h-11 text-muted"
                onClick={() => {
                  setSelected(null);
                  onChange({ ...table, rows: rows.slice(0, -1) });
                }}
              >
                Delete last row
              </button>
            )}
            <button type="button" className="min-h-11 text-muted" onClick={() => onChange(undefined)}>
              Start again
            </button>
          </div>
        </div>
      )}

      {adding && (
        <section className="space-y-3 rounded-2xl bg-surface p-3" aria-label="New row">
          {adding === 'chips' && (
            <>
              <p className="text-sm">One chip per column, all with the same kind of units.</p>
              <ul className="space-y-2">
                {slots.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 truncate text-right text-sm text-muted">{table.columns[i]}</span>
                    <span className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border border-border px-2">
                      {s ? <ChipButton chip={s} onClick={() => setSlots(slots.map((x, j) => (j === i ? null : x)))} /> : <span className="text-sm text-muted">Empty</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <ChipTray
                chips={chips}
                onPick={(c) => {
                  const i = slots.findIndex((x) => !x);
                  if (i >= 0) setSlots(slots.map((x, j) => (j === i ? c : x)));
                }}
                hint="Tap chips in column order; tap a placed chip to remove it"
              />
            </>
          )}

          {adding === 'arith' && (
            <>
              <RowPicker rows={rows} value={rowA} onChange={setRowA} label="Start from row" />
              <div className="flex gap-2" role="radiogroup" aria-label="Operation">
                {OPS.map((o) => (
                  <button key={o.op} type="button" role="radio" aria-checked={op === o.op} onClick={() => setOp(o.op)} className={`${pill(op === o.op)} min-w-11 text-lg`}>
                    {o.symbol}
                  </button>
                ))}
              </div>
              <SourcePicker rows={rows} chips={chips} value={source} onChange={setSource} label="By" />
            </>
          )}

          {adding === 'formula' && !formula && (
            <ul className="max-h-72 space-y-2 overflow-y-auto" aria-label="Formulas">
              {sortedFormulas.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => chooseFormula(f)}
                    className="flex min-h-12 w-full flex-col items-start rounded-xl bg-surface-2 px-3 py-2 text-left"
                  >
                    <span className="text-sm">{f.name}</span>
                    <span className="max-w-full overflow-hidden text-sm text-muted">
                      <Tex>{f.latex}</Tex>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {adding === 'formula' && formula && (
            <>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-xl bg-surface-2 p-2 text-center">
                  <Tex>{unknown ? (formula.rearranged[unknown] ?? formula.latex) : formula.latex}</Tex>
                </div>
                <button type="button" onClick={() => setFormulaId(null)} className="min-h-11 px-2 text-sm text-muted">
                  Change
                </button>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted">Solve for</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Solve for">
                  {formula.vars
                    .filter((v) => v.solvable !== false && !v.stepper)
                    .map((v) => (
                      <button
                        key={v.sym}
                        type="button"
                        role="radio"
                        aria-checked={unknown === v.sym}
                        aria-label={`Solve for ${v.name}`}
                        onClick={() => {
                          setUnknown(v.sym);
                          // Keep inputs already chosen; guess the rest.
                          const guessed = { ...guessSources(formula, rows, chips), ...inputs };
                          setInputs(Object.fromEntries(Object.entries(guessed).filter(([k]) => k !== v.sym)));
                        }}
                        className={`${pill(unknown === v.sym)} min-w-11`}
                      >
                        <Tex>{v.latex}</Tex>
                      </button>
                    ))}
                </div>
              </div>
              {unknown &&
                formula.vars
                  .filter((v) => v.stepper)
                  .map((v) => {
                    const n = steps[v.sym] ?? v.stepper!.initial;
                    const set = (x: number) => setSteps({ ...steps, [v.sym]: Math.min(v.stepper!.max, Math.max(v.stepper!.min, x)) });
                    return (
                      <div key={v.sym} className="flex items-center gap-2" role="group" aria-label={v.name}>
                        <Tex>{v.latex}</Tex>
                        <span className="min-w-0 flex-1 text-sm text-muted">{v.name}</span>
                        <button type="button" aria-label={`Decrease ${v.name}`} disabled={n <= v.stepper!.min} onClick={() => set(n - 1)} className="min-h-10 min-w-10 rounded-lg bg-surface-2 disabled:opacity-40">
                          −
                        </button>
                        <span className="w-6 text-center tabular-nums">{n}</span>
                        <button type="button" aria-label={`Increase ${v.name}`} disabled={n >= v.stepper!.max} onClick={() => set(n + 1)} className="min-h-10 min-w-10 rounded-lg bg-surface-2 disabled:opacity-40">
                          +
                        </button>
                      </div>
                    );
                  })}
              {unknown &&
                formula.vars
                  .filter((v) => v.sym !== unknown && !v.stepper)
                  .map((v) => (
                    <SourcePicker
                      key={v.sym}
                      rows={rows}
                      chips={chips}
                      value={inputs[v.sym] ?? null}
                      onChange={(s) => setInputs({ ...inputs, [v.sym]: s })}
                      label={v.name}
                    />
                  ))}
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            Row name
            <input className={`${field} min-w-0 flex-1`} value={label} placeholder="Automatic" onChange={(e) => setLabel(e.target.value)} />
          </label>
          {error && (
            <p className="text-sm text-bad" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={build} className={primary}>
              Add row
            </button>
            {rows.length > 0 && (
              <button type="button" onClick={() => setAdding(null)} className="min-h-12 rounded-xl bg-surface-2 px-4">
                Cancel
              </button>
            )}
          </div>
        </section>
      )}
      {error && !adding && (
        <p className="text-sm text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
