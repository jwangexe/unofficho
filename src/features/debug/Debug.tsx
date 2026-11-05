import { useMemo, useState } from 'react';
import { reagents } from '@/data';
import { FORMULAS, formulaById } from '@/engine/formulas';
import { solveFormula, type Formula, type VarSpec } from '@/engine/formula';
import { formatQuantity, qty, type Quantity } from '@/engine/quantity';
import { getUnit, UNITS } from '@/engine/units';
import { D, eqDim } from '@/engine/dims';
import { Page } from '@/ui/Page';
import { Tex } from '@/ui/Tex';

/** Units offered in a slot's dropdown. */
function unitChoices(spec: VarSpec): string[] {
  const dims = [getUnit(spec.unit).dim, ...(spec.flexUnit ? [getUnit(spec.flexUnit).dim] : [])];
  if (!Array.isArray(spec.dim)) {
    // "any" group: the default dimension plus the usual alternatives.
    dims.push(D.pressure, D.mass, D.amount, D.concentration, D.none, D.frequency, D.rateConst2);
  }
  return UNITS.filter((u) => dims.some((d) => eqDim(d, u.dim))).map((u) => u.id);
}

interface Entry {
  value: string;
  unit: string;
}

function initialEntries(f: Formula): Record<string, Entry> {
  const ex = f.examples[0] ?? {};
  return Object.fromEntries(f.vars.map((v) => [v.sym, { value: ex[v.sym]?.toString() ?? '', unit: v.unit }]));
}

const field = 'min-h-11 min-w-0 w-full rounded-lg border border-border bg-surface-2 px-2 text-sm';

/** Dev-only formula explorer: pick a formula and an unknown, fill the rest, solve. */
export default function Debug() {
  const [formulaId, setFormulaId] = useState(FORMULAS[0]!.id);
  const f = formulaById.get(formulaId)!;
  const firstMissing = (x: Formula) =>
    x.vars.find((v) => v.solvable !== false && !(v.sym in (x.examples[0] ?? {})))?.sym ?? x.vars[0]!.sym;
  const [unknown, setUnknown] = useState(firstMissing(f));
  const [entries, setEntries] = useState(() => initialEntries(f));

  const pick = (id: string) => {
    const next = formulaById.get(id)!;
    setFormulaId(id);
    setUnknown(firstMissing(next));
    setEntries(initialEntries(next));
  };

  const result = useMemo(() => {
    const assigned: Record<string, Quantity> = {};
    for (const v of f.vars) {
      if (v.sym === unknown) continue;
      const e = entries[v.sym];
      const n = Number(e?.value);
      if (e && e.value.trim() !== '' && Number.isFinite(n)) assigned[v.sym] = qty(n, e.unit, v.kind);
    }
    return solveFormula(f, unknown, assigned);
  }, [f, unknown, entries]);

  const topics = [...new Set(FORMULAS.map((x) => x.topic))];

  return (
    <Page title="Formula engine">
      <select className={`${field} mb-3`} value={formulaId} onChange={(e) => pick(e.target.value)} aria-label="Formula">
        {topics.map((t) => (
          <optgroup key={t} label={t}>
            {FORMULAS.filter((x) => x.topic === t).map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="mb-3 overflow-x-auto overflow-y-hidden rounded-xl bg-surface p-3">
        <Tex display>{f.latex}</Tex>
        {f.notes && <p className="mt-2 text-xs text-muted">{f.notes}</p>}
      </div>

      <p className="mb-1 text-xs text-muted">Solve for</p>
      <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Unknown">
        {f.vars
          .filter((v) => v.solvable !== false)
          .map((v) => (
            <button
              key={v.sym}
              role="radio"
              aria-checked={unknown === v.sym}
              onClick={() => setUnknown(v.sym)}
              className={`min-h-11 min-w-11 rounded-md px-3 ${unknown === v.sym ? 'bg-accent text-accent-ink' : 'bg-surface-2'}`}
            >
              <Tex>{v.latex}</Tex>
            </button>
          ))}
      </div>

      <div className="mb-3 space-y-2">
        {f.vars
          .filter((v) => v.sym !== unknown)
          .map((v) => {
            const e = entries[v.sym]!;
            const set = (patch: Partial<Entry>) => setEntries((s) => ({ ...s, [v.sym]: { ...e, ...patch } }));
            return (
              <label key={v.sym} className="grid grid-cols-[3.5rem_1fr_7.5rem] items-center gap-2">
                <span className="text-right">
                  <Tex>{v.latex}</Tex>
                </span>
                <input className={field} inputMode="decimal" value={e.value} onChange={(ev) => set({ value: ev.target.value })} aria-label={v.name} />
                <select className={field} value={e.unit} onChange={(ev) => set({ unit: ev.target.value })} aria-label={`${v.name} unit`}>
                  {unitChoices(v).map((u) => (
                    <option key={u} value={u}>
                      {getUnit(u).symbol || '—'}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
      </div>

      <div className="rounded-xl bg-surface p-3" role="status">
        <div className="mb-2 overflow-x-auto overflow-y-hidden text-sm">
          <Tex>{f.rearranged[unknown] ?? ''}</Tex>
        </div>
        {result.ok ? (
          <>
            <p className="text-lg font-semibold">
              {f.vars.find((v) => v.sym === unknown)!.label} = {formatQuantity(result.value.quantity, 4)}
            </p>
            {result.value.warnings.map((w) => (
              <p key={w} className="mt-1 text-sm text-warn">
                {w}
              </p>
            ))}
            {result.value.otherRoots.length > 0 && (
              <p className="mt-1 text-xs text-muted">Other roots (SI): {result.value.otherRoots.map((r) => r.toPrecision(4)).join(', ')}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-bad">{result.error.message}</p>
        )}
      </div>

      <p className="mt-6 text-xs text-muted">
        {FORMULAS.length} formulas · {UNITS.length} units · {reagents.length} reagents
      </p>
    </Page>
  );
}
