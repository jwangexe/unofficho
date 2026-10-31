import { useMemo, useState } from 'react';
import { checkAssignment, solveFormula, withSpecies, type Formula, type VarSpec } from '@/engine/formula';
import { qty, type Quantity } from '@/engine/quantity';
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

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const isZeroChip = (c: Chip) => c.id.startsWith('zero:');

/** Next coefficient up or down, skipping 0 (a species with ν = 0 is not in the reaction). */
const stepNu = (nu: number, d: 1 | -1) => {
  const n = nu + d;
  return n === 0 ? n + d : Math.max(-6, Math.min(6, n));
};

export function FormulaPanel({
  formula: base,
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

  // Formulas over any number of species (e.g. ICE): coefficients come from steppers, not chips.
  const group = base.species;
  const [nus, setNus] = useState<number[]>(() => (group ? [-1, 1] : []));
  const f = useMemo(() => (group ? withSpecies(base, nus.length) : base), [base, group, nus.length]);
  // Small whole numbers (e.g. a and b in a mole ratio) are set with −/+ rather than chips.
  const stepperVars = f.vars.filter((v) => v.stepper);
  const [steps, setSteps] = useState<Record<string, number>>(() => Object.fromEntries(stepperVars.map((v) => [v.sym, v.stepper!.initial])));
  const coefficients: Record<string, Quantity> = {
    ...(group ? Object.fromEntries(nus.map((nu, i) => [group.coefficient(i + 1), qty(nu, '1')])) : {}),
    ...Object.fromEntries(stepperVars.map((v) => [v.sym, qty(steps[v.sym] ?? v.stepper!.initial, '1')])),
  };

  const inputs = useMemo(() => f.vars.filter((v) => v.sym !== unknown && !(v.sym in coefficients)), [f, unknown, coefficients]);
  const firstEmpty = (except?: string, state = filled) => inputs.find((v) => v.sym !== except && !state[v.sym])?.sym ?? null;

  const chooseUnknown = (sym: string) => {
    setUnknown(sym);
    setSolveError(null);
    const next = { ...filled };
    delete next[sym];
    setFilled(next);
    setActive(f.vars.find((v) => v.sym !== sym && !(v.sym in coefficients) && !next[v.sym])?.sym ?? null);
  };

  const fill = (chip: Chip) => {
    if (!unknown) return;
    const target = active ?? firstEmpty();
    if (target) place(target, chip);
  };

  const place = (target: string, chip: Chip) => {
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
    const given = Object.fromEntries(Object.entries(filled).filter(([k]) => inputs.some((v) => v.sym === k)).map(([k, c]) => [k, c.q]));
    const res = solveFormula(f, unknown, { ...given, ...coefficients });
    if (!res.ok) {
      setSolveError(res.error.message);
      return;
    }
    const spec = f.vars.find((v) => v.sym === unknown)!;
    onCompute({
      step: {
        title: f.name,
        latex: group ? (unknown === 'xi' ? `\\text{Solve } ${group.latexFor(nus)} \\text{ for } \\xi` : group.latexFor(nus)) : f.rearranged[unknown],
        inputs: Object.values(filled)
          .filter((c) => !isZeroChip(c))
          .map((c) => c.id),
        warnings: res.value.warnings,
      },
      chip: { label: spec.label, q: res.value.quantity, sig: 4 },
    });
  };

  /** Remove species i (1-based): later species move down one place, keeping their chips. */
  const removeSpecies = (i: number) => {
    if (!group) return;
    const next: Record<string, Chip> = {};
    for (const [k, c] of Object.entries(filled)) {
      const own = (j: number) => group.vars(j).findIndex((v) => v.sym === k);
      let moved = false;
      for (let j = 1; j <= nus.length; j++) {
        const pos = own(j);
        if (pos === -1) continue;
        moved = true;
        if (j < i) next[k] = c;
        else if (j > i) next[group.vars(j - 1)[pos]!.sym] = c;
      }
      if (!moved) next[k] = c;
    }
    setFilled(next);
    setNus(nus.filter((_, j) => j !== i - 1));
    setActive(null);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto overflow-y-hidden rounded-xl bg-surface-2 p-3 text-center">
        <Tex>{group ? group.latexFor(nus) : unknown ? (f.rearranged[unknown] ?? f.latex) : f.latex}</Tex>
      </div>

      {group && (
        <div>
          <p className="mb-1 text-xs text-muted">Species in K: ν is negative for reactants, positive for products. Leave out solids, pure liquids and the solvent.</p>
          <ul className="space-y-1.5" aria-label="Species">
            {nus.map((nu, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-14 shrink-0">
                  <Tex>{`\\mathrm{X}_{${i + 1}}`}</Tex>
                </span>
                <span className="text-xs text-muted">{nu < 0 ? 'reactant' : 'product'}</span>
                <span className="flex-1" />
                <div className="flex items-center gap-1" role="group" aria-label={`Coefficient ν${SUB[i + 1]}`}>
                  <button type="button" aria-label="Decrease" onClick={() => setNus(nus.map((x, j) => (j === i ? stepNu(x, -1) : x)))} className="min-h-10 min-w-10 rounded-lg bg-surface-2">
                    −
                  </button>
                  <span className="w-9 text-center tabular-nums" aria-live="polite">
                    {nu > 0 ? `+${nu}` : `−${-nu}`}
                  </span>
                  <button type="button" aria-label="Increase" onClick={() => setNus(nus.map((x, j) => (j === i ? stepNu(x, 1) : x)))} className="min-h-10 min-w-10 rounded-lg bg-surface-2">
                    +
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Remove X${SUB[i + 1]}`}
                  disabled={nus.length <= group.min}
                  onClick={() => removeSpecies(i + 1)}
                  className="grid min-h-10 min-w-10 place-items-center text-muted disabled:opacity-30"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          {nus.length < group.max && (
            <button type="button" onClick={() => setNus([...nus, 1])} className="mt-2 min-h-10 rounded-full bg-surface-2 px-3 text-sm">
              + Add species
            </button>
          )}
        </div>
      )}

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

      {unknown && stepperVars.length > 0 && (
        <ul className="space-y-2" aria-label="Coefficients">
          {stepperVars.map((v) => {
            const n = steps[v.sym] ?? v.stepper!.initial;
            const set = (x: number) => setSteps((s) => ({ ...s, [v.sym]: Math.min(v.stepper!.max, Math.max(v.stepper!.min, x)) }));
            return (
              <li key={v.sym} className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3">
                <span className="w-14 shrink-0 text-right">
                  <Tex>{v.latex}</Tex>
                </span>
                <span className="min-w-0 flex-1 text-sm text-muted">{v.name}</span>
                <div className="flex items-center gap-1" role="group" aria-label={v.name}>
                  <button type="button" aria-label={`Decrease ${v.name}`} disabled={n <= v.stepper!.min} onClick={() => set(n - 1)} className="min-h-10 min-w-10 rounded-lg bg-surface-2 disabled:opacity-40">
                    −
                  </button>
                  <span className="w-7 text-center tabular-nums" aria-live="polite">
                    {n}
                  </span>
                  <button type="button" aria-label={`Increase ${v.name}`} disabled={n >= v.stepper!.max} onClick={() => set(n + 1)} className="min-h-10 min-w-10 rounded-lg bg-surface-2 disabled:opacity-40">
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

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
                {!chip && v.sign === 'nonneg' && (
                  <button
                    type="button"
                    onClick={() => place(v.sym, { id: `zero:${v.sym}`, label: v.label, q: qty(0, v.unit, v.kind), sig: 1, source: 'const' })}
                    className="mt-1 ml-1 min-h-9 rounded-full bg-surface-2 px-3 text-xs text-muted"
                  >
                    Starts at 0
                  </button>
                )}
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
