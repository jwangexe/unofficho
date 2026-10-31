import { useMemo, useState } from 'react';
import { checkAssignment, solveFormula, type Formula, type VarSpec } from '@/engine/formula';
import type { Quantity } from '@/engine/quantity';
import { getUnit } from '@/engine/units';
import { Tex } from '@/ui/Tex';
import { ChipButton } from './ChipButton';
import { ChipTray } from './ChipTray';
import type { Chip, Step } from './store';

export interface ComputeOutput {
  step: Omit<Step, 'id' | 'output'>;
  chip: Omit<Chip, 'id' | 'source'>;
}

/** Note shown when a chip's unit differs from the slot's natural unit (converted for you). */
function conversionNote(spec: VarSpec, q: Quantity, form: 'base' | 'flex'): string | undefined {
  if (!Array.isArray(spec.dim)) return undefined;
  const slotUnit = form === 'flex' && spec.flexUnit ? spec.flexUnit : spec.unit;
  if (q.unit === slotUnit) return undefined;
  const from = getUnit(q.unit);
  const to = getUnit(slotUnit);
  if (!from.symbol || !to.symbol || (from.factor === to.factor && !from.offset)) return undefined;
  return `${from.symbol} → ${to.symbol}, converted for you`;
}

export function FormulaPanel({
  formula: f,
  chips,
  strictUnits = false,
  onCompute,
}: {
  formula: Formula;
  chips: Chip[];
  /** Exam mode: unit mismatches are rejected instead of converted. */
  strictUnits?: boolean;
  onCompute: (out: ComputeOutput) => void;
}) {
  const [unknown, setUnknown] = useState<string | null>(null);
  const [filled, setFilled] = useState<Record<string, Chip>>({});
  const [active, setActive] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [shake, setShake] = useState<string | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  const inputs = useMemo(() => f.vars.filter((v) => v.sym !== unknown), [f, unknown]);
  const firstEmpty = (except?: string, state = filled) => inputs.find((v) => v.sym !== except && !state[v.sym])?.sym ?? null;

  const chooseUnknown = (sym: string) => {
    setUnknown(sym);
    setSolveError(null);
    const next = { ...filled };
    delete next[sym];
    setFilled(next);
    setActive(f.vars.find((v) => v.sym !== sym && !next[v.sym])?.sym ?? null);
  };

  const fill = (chip: Chip) => {
    if (!unknown) return;
    const target = active ?? firstEmpty();
    if (!target) return;
    const spec = f.vars.find((v) => v.sym === target)!;
    const others = Object.fromEntries(Object.entries(filled).filter(([k]) => k !== target).map(([k, c]) => [k, c.q]));
    const res = checkAssignment(f, target, chip.q, others);
    let error = res.ok ? undefined : res.error.message;
    let note: string | undefined;
    if (res.ok) {
      note = conversionNote(spec, chip.q, res.value.form);
      if (note && strictUnits) {
        error = `${spec.label} must be in ${getUnit(res.value.form === 'flex' ? spec.flexUnit! : spec.unit).symbol}. Convert the chip first.`;
        note = undefined;
      }
    }
    if (error) {
      setErrors((e) => ({ ...e, [target]: error }));
      setShake(null);
      requestAnimationFrame(() => setShake(target));
      return;
    }
    const next = { ...filled, [target]: chip };
    setFilled(next);
    setErrors((e) => ({ ...e, [target]: '' }));
    setNotes((n) => ({ ...n, [target]: note ?? '' }));
    setActive(firstEmpty(target, next));
    setSolveError(null);
  };

  const ready = unknown !== null && inputs.every((v) => filled[v.sym]);

  const compute = () => {
    if (!unknown) return;
    const res = solveFormula(f, unknown, Object.fromEntries(Object.entries(filled).map(([k, c]) => [k, c.q])));
    if (!res.ok) {
      setSolveError(res.error.message);
      return;
    }
    const spec = f.vars.find((v) => v.sym === unknown)!;
    onCompute({
      step: {
        title: f.name,
        latex: f.rearranged[unknown],
        inputs: Object.values(filled).map((c) => c.id),
        warnings: res.value.warnings,
      },
      chip: { label: spec.label, q: res.value.quantity, sig: 4 },
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto overflow-y-hidden rounded-xl bg-surface-2 p-3 text-center">
        <Tex>{unknown ? (f.rearranged[unknown] ?? f.latex) : f.latex}</Tex>
      </div>

      <div>
        <p className="mb-1 text-xs text-muted">Solve for</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Solve for">
          {f.vars
            .filter((v) => v.solvable !== false)
            .map((v) => (
              <button
                key={v.sym}
                type="button"
                role="radio"
                aria-checked={unknown === v.sym}
                aria-label={`Solve for ${v.name}`}
                onClick={() => chooseUnknown(v.sym)}
                className={`min-h-11 min-w-11 rounded-full px-3 ${unknown === v.sym ? 'bg-accent text-accent-ink' : 'bg-surface-2'}`}
              >
                <Tex>{v.latex}</Tex>
              </button>
            ))}
        </div>
      </div>

      {unknown && (
        <ul className="space-y-2" aria-label="Inputs">
          {inputs.map((v) => {
            const chip = filled[v.sym];
            const isActive = active === v.sym;
            return (
              <li key={v.sym} className={shake === v.sym ? 'animate-shake' : ''} onAnimationEnd={() => setShake(null)}>
                <button
                  type="button"
                  onClick={() => setActive(v.sym)}
                  aria-label={`${v.name} slot${chip ? `, filled with ${chip.label}` : ', empty'}`}
                  aria-pressed={isActive}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 text-left ${
                    isActive ? 'border-accent bg-accent/10' : errors[v.sym] ? 'border-bad' : 'border-border'
                  }`}
                >
                  <span className="w-14 shrink-0 text-right">
                    <Tex>{v.latex}</Tex>
                  </span>
                  <span className="min-w-0 flex-1">
                    {chip ? (
                      <ChipButton chip={chip} />
                    ) : (
                      <span className="text-sm text-muted">{isActive ? 'Tap a chip below' : v.name}</span>
                    )}
                  </span>
                </button>
                {errors[v.sym] && (
                  <p className="mt-1 px-1 text-xs text-bad" role="alert">
                    {errors[v.sym]}
                  </p>
                )}
                {notes[v.sym] && <p className="mt-1 px-1 text-xs text-muted">{notes[v.sym]}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {unknown && <ChipTray chips={chips} onPick={fill} hint={active ? undefined : 'Tap a slot, then a chip'} />}

      {solveError && (
        <p className="text-sm text-bad" role="alert">
          {solveError}
        </p>
      )}
      <button
        type="button"
        disabled={!ready}
        onClick={compute}
        className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40"
      >
        {unknown ? 'Compute' : 'Choose what to solve for'}
      </button>
    </div>
  );
}
