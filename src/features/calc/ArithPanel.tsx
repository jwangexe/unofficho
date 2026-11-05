import { useState } from 'react';
import { runOp, type ArithOp } from '@/engine/graph';
import { unitsForDim } from '@/engine/units';
import { ChipButton } from './ChipButton';
import { ChipTray } from './ChipTray';
import type { ComputeOutput } from './FormulaPanel';
import type { Chip } from './store';

export interface ArithDef {
  op: ArithOp;
  symbol: string;
  name: string;
  arity: 1 | 2 | 'n';
}

export const ARITH: ArithDef[] = [
  { op: 'add', symbol: '+', name: 'Add', arity: 2 },
  { op: 'sub', symbol: '−', name: 'Subtract', arity: 2 },
  { op: 'mul', symbol: '×', name: 'Multiply', arity: 2 },
  { op: 'div', symbol: '÷', name: 'Divide', arity: 2 },
  { op: 'ln', symbol: 'ln', name: 'Natural log', arity: 1 },
  { op: 'log10', symbol: 'log₁₀', name: 'Log base 10', arity: 1 },
  { op: 'exp', symbol: 'eˣ', name: 'Exponential', arity: 1 },
  { op: 'pow10', symbol: '10ˣ', name: 'Ten to the power', arity: 1 },
  { op: 'pow', symbol: 'xⁿ', name: 'Power / root', arity: 1 },
  { op: 'scale', symbol: '×ν', name: 'Multiply by a coefficient', arity: 1 },
  { op: 'sum', symbol: 'Σνx', name: "Weighted sum (Hess's law)", arity: 'n' },
  { op: 'convert', symbol: '⇄', name: 'Convert units', arity: 1 },
];

const short = (s: string) => (s.length > 14 ? `${s.slice(0, 13)}…` : s);

function resultLabel(op: ArithOp, labels: string[], param: string): string {
  const [a = '?', b = '?'] = labels;
  switch (op) {
    case 'add': return short(`${a}+${b}`);
    case 'sub': return short(`${a}−${b}`);
    case 'mul': return short(`${a}·${b}`);
    case 'div': return short(`${a}/${b}`);
    case 'ln': return short(`ln ${a}`);
    case 'log10': return short(`log ${a}`);
    case 'exp': return short(`e^${a}`);
    case 'pow10': return short(`10^${a}`);
    case 'pow': return short(`${a}^${param}`);
    case 'scale': return short(`${param}·${a}`);
    case 'sum': return 'Σ';
    case 'convert': return a;
  }
}

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace('−', '-')));
const field = 'min-h-11 w-24 rounded-lg border border-border bg-surface-2 px-2 text-base';

export function ArithPanel({
  def,
  chips,
  initial,
  strictUnits = false,
  onCompute,
}: {
  def: ArithDef;
  chips: Chip[];
  initial?: Chip;
  /** Exam mode: adding quantities in different units is your job to fix first. */
  strictUnits?: boolean;
  onCompute: (out: ComputeOutput) => void;
}) {
  const initialCount = def.arity === 'n' ? 3 : def.arity;
  const [slots, setSlots] = useState<(Chip | null)[]>(() =>
    Array.from({ length: initialCount }, (_, i) => (i === 0 ? (initial ?? null) : null)),
  );
  const [coefs, setCoefs] = useState<string[]>(() => Array(initialCount).fill('1'));
  const [active, setActive] = useState(initial ? 1 : 0);
  const [param, setParam] = useState(def.op === 'pow' ? '2' : '1');
  const [unit, setUnit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = (chip: Chip) => {
    const next = [...slots];
    const target = active < next.length ? active : next.findIndex((s) => !s);
    if (target < 0) return;
    next[target] = chip;
    setSlots(next);
    const empty = next.findIndex((s, i) => i > target && !s);
    setActive(empty >= 0 ? empty : next.findIndex((s) => !s));
    setError(null);
    if (def.op === 'convert') setUnit(null);
  };

  const filled = slots.filter((s): s is Chip => !!s);
  const ready =
    def.arity === 'n' ? filled.length >= 1 : filled.length === slots.length && (def.op !== 'convert' || !!unit);

  const compute = () => {
    const used = def.arity === 'n' ? slots.map((s, i) => [s, i] as const).filter(([s]) => s) : slots.map((s, i) => [s, i] as const);
    const qs = used.map(([s]) => s!.q);
    if (strictUnits && ['add', 'sub', 'sum'].includes(def.op) && new Set(qs.map((q) => q.unit)).size > 1) {
      setError('Exam mode: convert these to the same units first.');
      return;
    }
    const p = Number.isFinite(num(param)) ? num(param) : 1;
    const res = runOp(def.op, qs, {
      exponent: p,
      coef: p,
      coefs: used.map(([, i]) => (Number.isFinite(num(coefs[i]!)) ? num(coefs[i]!) : 1)),
      ...(unit && { unit }),
    });
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    const labels = used.map(([s]) => s!.label);
    onCompute({
      step: { title: def.name, inputs: used.map(([s]) => s!.id), warnings: [] },
      chip: { label: resultLabel(def.op, labels, param), q: res.value, sig: 4 },
    });
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {slots.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            {def.arity === 'n' && (
              <input
                className={field}
                inputMode="decimal"
                value={coefs[i]}
                aria-label={`Coefficient ${i + 1}`}
                onChange={(e) => setCoefs((c) => c.map((x, j) => (j === i ? e.target.value : x)))}
              />
            )}
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              aria-label={`Input ${i + 1}${s ? `, ${s.label}` : ', empty'}`}
              className={`flex min-h-12 min-w-0 flex-1 items-center rounded-xl border px-3 text-left ${active === i ? 'border-accent bg-accent/10' : 'border-border'}`}
            >
              {s ? <ChipButton chip={s} /> : <span className="text-sm text-muted">{active === i ? 'Tap a chip' : `Input ${i + 1}`}</span>}
            </button>
            {def.arity === 2 && i === 0 && <span className="w-6 text-center text-lg">{def.symbol}</span>}
          </li>
        ))}
      </ul>

      {def.arity === 'n' && (
        <button
          type="button"
          className="min-h-11 text-sm text-accent"
          onClick={() => {
            setSlots((s) => [...s, null]);
            setCoefs((c) => [...c, '1']);
            setActive(slots.length);
          }}
        >
          + Add term
        </button>
      )}

      {(def.op === 'pow' || def.op === 'scale') && (
        <label className="flex items-center gap-3 text-sm">
          {def.op === 'pow' ? 'Exponent n (0.5 for a square root)' : 'Coefficient ν'}
          <input className={field} inputMode="decimal" value={param} onChange={(e) => setParam(e.target.value)} />
        </label>
      )}

      {def.op === 'convert' && slots[0] && (
        <div>
          <p className="mb-1 text-xs text-muted">Convert to</p>
          <div className="flex flex-wrap gap-2">
            {unitsForDim(slots[0].q.dim)
              .filter((u) => u.symbol)
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  aria-pressed={unit === u.id}
                  onClick={() => setUnit(u.id)}
                  className={`min-h-11 rounded-md px-3 text-sm ${unit === u.id ? 'bg-accent text-accent-ink' : 'bg-surface-2'}`}
                >
                  {u.symbol}
                </button>
              ))}
          </div>
        </div>
      )}

      <ChipTray chips={chips} onPick={pick} />

      {error && (
        <p className="text-sm text-bad" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={!ready}
        onClick={compute}
        className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40"
      >
        Compute
      </button>
    </div>
  );
}
