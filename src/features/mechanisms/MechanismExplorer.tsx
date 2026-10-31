import { useMemo, useState } from 'react';
import { allChoices, choiceKey, derive, preEquilibriumSpecies, type Choice, type Mechanism } from '@/engine/mechanism';
import { Tex } from '@/ui/Tex';
import { RichText } from '../book/QuickChecks';

function Maths({ children }: { children: string }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden py-1">
      <Tex display>{children}</Tex>
    </div>
  );
}

const chip = (on: boolean) =>
  `min-h-10 rounded-full border px-3 text-sm disabled:opacity-40 ${on ? 'border-accent bg-accent text-accent-ink' : 'border-border bg-surface-2'}`;

/**
 * Pick which intermediates are in steady state and which steps are fast pre-equilibria;
 * the derivation updates as you go.
 */
export function MechanismExplorer({ mech, initial }: { mech: Mechanism; initial?: Choice }) {
  const [choice, setChoice] = useState<Choice>(initial ?? mech.challenges[0] ?? { ss: [], pe: [] });
  const valid = useMemo(() => new Set(allChoices(mech).map(choiceKey)), [mech]);
  const result = useMemo(() => derive(mech, choice), [mech, choice]);

  const peSpecies = new Map(choice.pe.map((i) => [preEquilibriumSpecies(mech, i, choice.ss), i]));
  const reversible = mech.steps.map((s, i) => (s.back ? i : -1)).filter((i) => i >= 0);

  const toggleSS = (sp: string) =>
    setChoice((c) => ({ ...c, ss: c.ss.includes(sp) ? c.ss.filter((x) => x !== sp) : [...c.ss, sp] }));
  /** Turning a pre-equilibrium on takes over its intermediate from the steady state. */
  const nextPE = (c: Choice, i: number): Choice | null => {
    if (c.pe.includes(i)) return { ...c, pe: c.pe.filter((x) => x !== i) };
    const direct = { ...c, pe: [...c.pe, i] };
    if (valid.has(choiceKey(direct))) return direct;
    const sp = preEquilibriumSpecies(mech, i);
    const freed = { ss: c.ss.filter((x) => x !== sp), pe: [...c.pe, i] };
    return valid.has(choiceKey(freed)) ? freed : null;
  };

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Approximations" className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Steady state:</span>
          {mech.intermediates.map((sp) => {
            const by = peSpecies.get(sp);
            return (
              <button
                key={sp}
                type="button"
                aria-pressed={choice.ss.includes(sp)}
                aria-label={`[${sp}]`}
                disabled={by !== undefined}
                title={by !== undefined ? `Set by the pre-equilibrium in step ${by + 1}` : undefined}
                onClick={() => toggleSS(sp)}
                className={chip(choice.ss.includes(sp))}
              >
                <Tex>{`[\\mathrm{${mech.species[sp]}}]`}</Tex>
              </button>
            );
          })}
        </div>
        {reversible.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Pre-equilibrium:</span>
            {reversible.map((i) => {
              const next = nextPE(choice, i);
              return (
                <button key={i} type="button" aria-pressed={choice.pe.includes(i)} disabled={!next} onClick={() => next && setChoice(next)} className={chip(choice.pe.includes(i))}>
                  Step {i + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ol className="space-y-2" aria-label="Derivation">
        {result.steps.map((s, i) => (
          <li key={i} className="rounded-xl bg-surface-2 px-3 py-2">
            <p className="text-xs text-muted">
              <RichText>{s.title}</RichText>
            </p>
            <Maths>{s.tex}</Maths>
          </li>
        ))}
      </ol>

      {result.ok ? (
        <>
          <div className="rounded-xl border border-accent/60 px-3 py-2" aria-live="polite">
            <p className="text-xs font-semibold text-accent">Rate law</p>
            <Maths>{`${result.lhsTex} = ${result.rateTex}`}</Maths>
          </div>
          {result.limits.length > 0 && (
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <p className="text-xs text-muted">Limiting cases</p>
              <ul className="space-y-1">
                {result.limits.map((l) => (
                  <li key={l.when} className="text-sm">
                    <span className="text-muted">If </span>
                    <Tex>{l.when}</Tex>
                    <span className="text-muted">:</span>
                    <Maths>{`${result.lhsTex} \\approx ${l.tex}`}</Maths>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-xl border border-warn/50 px-3 py-2 text-sm" aria-live="polite">
          {result.error}
        </p>
      )}
    </div>
  );
}
