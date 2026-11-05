import { useMemo } from 'react';
import { create } from 'zustand';
import { polyTex, ratTex } from '@/engine/algebra';
import {
  applySolve,
  checkEquation,
  checkSolve,
  equationTargets,
  finalRate,
  massBalanceTarget,
  solveStep,
  startWork,
  stepTerms,
  type Chip,
  type TermIssue,
} from '@/engine/derive';
import { challengeOptions, speciesMath, symbolOrder, symbolTex, type Choice, type Mechanism } from '@/engine/mechanism';
import { rng } from '@/engine/template';
import { Tex } from '@/ui/Tex';
import { texToSpeech } from '@/ui/texSpeech';
import { RichText } from '../book/QuickChecks';

type Place = Chip['place'];

interface DeriveState {
  coeffs: Record<string, number[]>;
  issues: Record<string, TermIssue[]>;
  equationsDone: boolean;
  mb: number[];
  mbWrong: boolean;
  mbDone: boolean;
  /** Intermediates solved so far, in order ([X] symbols). */
  solved: string[];
  current?: string;
  placed: Record<string, Place>;
  misplaced: string[];
  mistakes: number;
  finalPick?: number;
}

const empty = (n: number, targets: string[], mbParts: number): DeriveState => ({
  coeffs: Object.fromEntries(targets.map((t) => [t, Array(n).fill(0)])),
  issues: {},
  equationsDone: false,
  mb: Array(mbParts).fill(0),
  mbWrong: false,
  mbDone: mbParts === 0,
  solved: [],
  placed: {},
  misplaced: [],
  mistakes: 0,
});

/** Derivation progress per card, kept outside the card so it survives scrolling away. */
const useDerive = create<{ cards: Record<string, DeriveState>; set: (key: string, s: DeriveState) => void }>((set) => ({
  cards: {},
  set: (key, s) => set((st) => ({ cards: { ...st.cards, [key]: s } })),
}));

const seg = (on: boolean, tone = 'accent') =>
  `min-h-9 min-w-9 rounded-lg border px-2 text-sm ${on ? (tone === 'bad' ? 'border-bad bg-bad/15' : 'border-accent bg-accent text-accent-ink') : 'border-border bg-surface-2'}`;

function Maths({ children }: { children: string }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden py-1">
      <Tex display>{children}</Tex>
    </div>
  );
}

/** A coefficient picker: −, 0, + and ×2. */
function Coefficient({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const sign = Math.sign(value);
  const two = Math.abs(value) === 2;
  return (
    <div className="flex shrink-0 gap-1" role="group" aria-label={`Coefficient of ${label}`}>
      {([-1, 0, 1] as const).map((s) => (
        <button key={s} type="button" aria-pressed={sign === s} onClick={() => onChange(s * (two ? 2 : 1))} className={seg(sign === s)}>
          {s < 0 ? '−' : s > 0 ? '+' : '0'}
        </button>
      ))}
      <button type="button" aria-pressed={two} disabled={sign === 0} onClick={() => onChange(sign * (two ? 1 : 2))} className={`${seg(two)} disabled:opacity-40`}>
        ×2
      </button>
    </div>
  );
}

const signed = (terms: { c: number; tex: string }[]) =>
  terms
    .filter((t) => t.c !== 0)
    .map((t, i) => `${t.c < 0 ? (i ? ' - ' : '-') : i ? ' + ' : ''}${Math.abs(t.c) === 1 ? '' : Math.abs(t.c)}${t.tex}`)
    .join('') || '0';

/**
 * Derive the rate law yourself: write the steady-state / pre-equilibrium equations from term
 * chips, apply the mass balance, then solve for each intermediate by sorting chips into a
 * fraction; the app substitutes each result into what is left.
 */
export function MechanismDerive({
  cardKey,
  mech,
  choice,
  seed,
  onFinish,
}: {
  cardKey: string;
  mech: Mechanism;
  choice: Choice;
  seed: number;
  onFinish: (score: number, meta: Record<string, unknown>) => void;
}) {
  const terms = useMemo(() => stepTerms(mech), [mech]);
  const targets = useMemo(() => equationTargets(mech, choice), [mech, choice]);
  const mbTarget = useMemo(() => massBalanceTarget(mech), [mech]);
  const tex = symbolTex(mech);
  const order = symbolOrder(mech);
  const saved = useDerive((s) => s.cards[cardKey]);
  const initial = () => empty(terms.length, targets.map((t) => t.species), mbTarget?.parts.length ?? 0);
  const st = saved ?? initial();
  // Merge into the latest stored state, not this render's copy, so quick taps never overwrite each other.
  const save = (patch: Partial<DeriveState> | ((s: DeriveState) => Partial<DeriveState>)) => {
    const latest = useDerive.getState().cards[cardKey] ?? initial();
    useDerive.getState().set(cardKey, { ...latest, ...(typeof patch === 'function' ? patch(latest) : patch) });
  };

  // Rebuild the working state from the solves made so far (chip order is seeded, so stable).
  const { work, steps } = useMemo(() => {
    let w = startWork(mech, choice);
    const done = [];
    for (const [i, x] of st.solved.entries()) {
      const step = solveStep(mech, w, x, rng(seed * 31 + i))!;
      done.push(step);
      w = applySolve(w, step);
    }
    return { work: w, steps: done };
  }, [mech, choice, seed, st.solved]);
  const current = st.current ? solveStep(mech, work, st.current, rng(seed * 31 + st.solved.length)) : null;
  const options = useMemo(() => challengeOptions(mech, choice, rng(seed)) ?? [], [mech, choice, seed]);
  const solving = st.equationsDone && st.mbDone;
  const allSolved = solving && work.equations.size === 0;
  const lhs = `${mech.rate.sign === -1 ? '-' : ''}\\frac{\\mathrm{d}${tex(`[${mech.rate.species}]`)}}{\\mathrm{d}t}`;
  const xTex = (x: string, power = 1) => `${tex(x)}${power === 1 ? '' : `^{${power}}`}`;

  const checkEquations = () => {
    const latest = useDerive.getState().cards[cardKey] ?? st;
    const issues = Object.fromEntries(targets.map((t) => [t.species, checkEquation(mech, t, latest.coeffs[t.species]!)]));
    const ok = Object.values(issues).every((i) => i.length === 0);
    save((s) => ({ issues, equationsDone: ok, mistakes: s.mistakes + (ok ? 0 : 1) }));
  };
  const checkMassBalance = () => {
    const latest = useDerive.getState().cards[cardKey] ?? st;
    const ok = mbTarget!.coefficients.every((c, i) => c === latest.mb[i]);
    save((s) => ({ mbDone: ok, mbWrong: !ok, mistakes: s.mistakes + (ok ? 0 : 1) }));
  };
  const checkChips = () => {
    if (!current) return;
    const wrong = checkSolve(current, (useDerive.getState().cards[cardKey] ?? st).placed);
    if (wrong.length === 0) save({ solved: [...st.solved, current.species], current: undefined, placed: {}, misplaced: [] });
    else save((s) => ({ misplaced: wrong.map((c) => c.key), mistakes: s.mistakes + 1 }));
  };
  const pickFinal = (i: number) => {
    if (st.finalPick !== undefined) return;
    const right = options[i]!.correct;
    const score = Math.max(0, 1 - 0.2 * (st.mistakes + (right ? 0 : 2)));
    save({ finalPick: i });
    onFinish(score, { derive: true, mistakes: st.mistakes, finalRight: right });
  };

  const fraction = (place: Place) =>
    current!.chips.filter((c) => st.placed[c.key] === place).map((c) => ({ c: Math.sign(c.term.c), tex: c.tex }));

  return (
    <div className="space-y-4">
      {/* 1. Equations */}
      <section aria-label="Write the equations" className="space-y-3" data-tour="equations">
        <h3 className="font-semibold">1. Write the equations</h3>
        {targets.map((t) => {
          const coeffs = st.coeffs[t.species]!;
          const issues = st.issues[t.species] ?? [];
          // An empty equation shows a box, not "0 = 0".
          const built = coeffs.some((c) => c !== 0) ? signed(coeffs.map((c, i) => ({ c, tex: terms[i]!.tex }))) : '\\square';
          return (
            <div key={t.species} className="rounded-xl bg-surface-2 p-3">
              <p className="text-sm">
                {t.kind === 'ss' ? (
                  <RichText>{`Steady state on ${speciesMath(mech, t.species)}: give each step's rate term its coefficient.`}</RichText>
                ) : (
                  <RichText>{`Pre-equilibrium in step ${t.step! + 1}: forward rate = backward rate.`}</RichText>
                )}
              </p>
              <ul className="mt-2 space-y-1.5">
                {terms.map((term, i) => {
                  const issue = issues.find((x) => x.index === i);
                  return (
                    <li key={i}>
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-muted">{term.label}</span>
                          <span className="block overflow-x-auto overflow-y-hidden">
                            <Tex>{term.tex}</Tex>
                          </span>
                        </span>
                        <Coefficient
                          value={coeffs[i]!}
                          label={texToSpeech(term.tex)}
                          onChange={(v) =>
                            !st.equationsDone &&
                            save((s) => ({
                              coeffs: { ...s.coeffs, [t.species]: s.coeffs[t.species]!.map((c, j) => (j === i ? v : c)) },
                              issues: { ...s.issues, [t.species]: (s.issues[t.species] ?? []).filter((x) => x.index !== i) },
                            }))
                          }
                        />
                      </div>
                      {issue && (
                        <p className="mt-0.5 text-xs text-bad">
                          <RichText>{issue.message}</RichText>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Maths>{t.kind === 'ss' ? `\\frac{\\mathrm{d}${tex(`[${t.species}]`)}}{\\mathrm{d}t} = ${built} = 0` : `${built} = 0`}</Maths>
            </div>
          );
        })}
        {!st.equationsDone ? (
          <button type="button" onClick={checkEquations} className="min-h-11 w-full rounded-xl border border-accent font-medium">
            Check equations
          </button>
        ) : (
          <p className="animate-pop text-sm text-good" role="status">
            ✓ Equations right
          </p>
        )}
      </section>

      {/* 2. Mass balance */}
      {st.equationsDone && mbTarget && (
        <section aria-label="Mass balance" className="space-y-2">
          <h3 className="font-semibold">2. Mass balance</h3>
          <p className="text-sm">
            Free <Tex>{tex(mbTarget.free)}</Tex> is unknown. Write it in terms of the total:
          </p>
          <ul className="space-y-1.5 rounded-xl bg-surface-2 p-3">
            {mbTarget.parts.map((p, i) => (
              <li key={p} className="flex items-center gap-2">
                <span className="flex-1">
                  <Tex>{tex(p)}</Tex>
                </span>
                <div className="flex gap-1" role="group" aria-label={`Coefficient of ${texToSpeech(tex(p))}`}>
                  {([-1, 0, 1] as const).map((s) => (
                    <button key={s} type="button" aria-pressed={st.mb[i] === s} onClick={() => !st.mbDone && save((x) => ({ mb: x.mb.map((c, j) => (j === i ? s : c)), mbWrong: false }))} className={seg(st.mb[i] === s)}>
                      {s < 0 ? '−' : s > 0 ? '+' : '0'}
                    </button>
                  ))}
                </div>
              </li>
            ))}
            <li>
              <Maths>{`${tex(mbTarget.free)} = ${signed(mbTarget.parts.map((p, i) => ({ c: st.mb[i]!, tex: tex(p) })))}`}</Maths>
            </li>
          </ul>
          {st.mbWrong && <p className="text-sm text-bad">The total is shared between the free species and every complex it forms.</p>}
          {!st.mbDone ? (
            <button type="button" onClick={checkMassBalance} className="min-h-11 w-full rounded-xl border border-accent font-medium">
              Check mass balance
            </button>
          ) : (
            <p className="animate-pop text-sm text-good" role="status">
              ✓ Substituted into the equations
            </p>
          )}
        </section>
      )}

      {/* 3. Solve by substitution */}
      {solving && (
        <section aria-label="Solve by substitution" className="space-y-2">
          <h3 className="font-semibold">{mbTarget ? '3' : '2'}. Solve by substitution</h3>
          {steps.map((s) => (
            <div key={s.species} className="rounded-xl border border-good/50 px-3 py-1">
              <Maths>{`${xTex(s.species, s.power)} = ${ratTex(s.truth, tex, order)}`}</Maths>
            </div>
          ))}
          {work.equations.size > 0 && (
            <>
              <p className="text-sm text-muted">{steps.length ? 'Substituted into what is left:' : 'Equations to solve:'}</p>
              {[...work.equations].map(([x, eq]) => (
                <div key={x} className="rounded-xl bg-surface-2 px-3 py-1">
                  <Maths>{`0 = ${polyTex(eq, tex, order)}`}</Maths>
                </div>
              ))}
              {!current ? (
                <div className="flex flex-wrap gap-2">
                  {[...work.equations.keys()].map((x) => {
                    const can = !!solveStep(mech, work, x, rng(0));
                    return (
                      <button key={x} type="button" disabled={!can} onClick={() => save({ current: x, placed: {}, misplaced: [] })} className="min-h-11 rounded-xl border border-accent px-3 text-sm disabled:opacity-40">
                        Solve for <Tex>{tex(x)}</Tex>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 rounded-xl bg-surface-2 p-3">
                  <p className="text-sm">
                    Tap each term to put it on top, underneath, or leave it out (tap again to cycle). Common factors have already been cancelled.
                  </p>
                  <Maths>{`${xTex(current.species, current.power)} = \\dfrac{${fraction('top').length ? signed(fraction('top')) : '\\square'}}{${fraction('bottom').length ? signed(fraction('bottom')) : '1'}}`}</Maths>
                  <div className="flex flex-wrap gap-2">
                    {current.chips.map((c) => {
                      const place = st.placed[c.key] ?? 'none';
                      const wrong = st.misplaced.includes(c.key);
                      const next: Record<Place, Place> = { none: 'top', top: 'bottom', bottom: 'none' };
                      return (
                        <button
                          key={c.key}
                          type="button"
                          aria-label={`${texToSpeech(c.tex)}: ${place === 'none' ? 'not used' : place === 'top' ? 'numerator' : 'denominator'}`}
                          onClick={() => save((s) => ({ placed: { ...s.placed, [c.key]: next[s.placed[c.key] ?? 'none'] }, misplaced: s.misplaced.filter((k) => k !== c.key) }))}
                          className={`min-h-11 rounded-md border px-3 text-sm ${wrong ? 'border-bad ring-2 ring-bad' : place === 'none' ? 'border-border bg-surface' : 'border-accent bg-accent/15'}`}
                        >
                          <span className="mr-1 text-xs text-muted">{place === 'top' ? '↑' : place === 'bottom' ? '↓' : '·'}</span>
                          <Tex>{`${c.term.c < 0 ? '-' : ''}${c.tex}`}</Tex>
                        </button>
                      );
                    })}
                  </div>
                  {st.misplaced.length > 0 && (
                    <p className="text-sm text-bad">
                      Not quite: the circled terms are in the wrong place. Terms without <Tex>{tex(current.species)}</Tex> go on top; its coefficient goes underneath.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => save({ current: undefined, placed: {}, misplaced: [] })} className="min-h-11 rounded-xl bg-surface font-medium">
                      Back
                    </button>
                    <button type="button" onClick={checkChips} className="min-h-11 rounded-xl border border-accent font-medium">
                      Check
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* 4. The rate law */}
      {allSolved && (
        <section aria-label="The rate law" className="space-y-2">
          <h3 className="font-semibold">{mbTarget ? '4' : '3'}. Substitute into the rate</h3>
          <p className="text-sm">
            Put {steps.length > 1 ? 'these' : 'this'} into <Tex>{`${lhs} = ${polyTex(work.rate.num, tex, order)}`}</Tex> and simplify. Which is it?
          </p>
          <div className="grid gap-2" role="group" aria-label="Rate laws">
            {options.map((o, i) => {
              const done = st.finalPick !== undefined;
              const tone = !done ? 'border-border bg-surface-2' : o.correct ? 'border-good bg-good/10' : st.finalPick === i ? 'border-bad bg-bad/10' : 'border-border bg-surface-2 text-muted';
              return (
                <button key={i} type="button" aria-disabled={done} aria-label={texToSpeech(`${lhs} = ${o.tex}`)} onClick={() => pickFinal(i)} className={`min-h-14 overflow-x-auto rounded-xl border px-3 py-2 text-left ${tone}`}>
                  <Tex>{`${lhs} = ${o.tex.replace(/\\dfrac/g, '\\frac')}`}</Tex>
                </button>
              );
            })}
          </div>
          {st.finalPick !== undefined && (
            <div className={`animate-pop rounded-xl border p-3 text-sm ${options[st.finalPick]!.correct ? 'border-good/50' : 'border-bad/50'}`} role="status">
              <p className={`font-semibold ${options[st.finalPick]!.correct ? 'text-good' : 'text-bad'}`}>
                {options[st.finalPick]!.correct ? '✓ Derived' : '✗ Not quite: the highlighted one is right'}
                {st.mistakes > 0 && <span className="font-normal text-muted"> · {st.mistakes} {st.mistakes === 1 ? 'slip' : 'slips'} on the way</span>}
              </p>
              <Maths>{`${lhs} = ${ratTex(finalRate(mech, work), tex, order)}`}</Maths>
              <p>
                <RichText>{mech.explanation}</RichText>
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

