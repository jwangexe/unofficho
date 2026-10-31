import { useMemo, useState } from 'react';
import { create } from 'zustand';
import { buildOptions, describeNode, judgeChoice, resolveChoice, type ApproachOption, type ChoiceVerdict } from '@/engine/approach';
import { rng, type CalcInstance, type CalcTemplate } from '@/engine/template';
import { db } from '@/storage/db';
import { FlagButton } from '@/ui/FlagButton';
import { Tex } from '@/ui/Tex';
import { TOPIC_TAG } from './topics';

interface ApproachState {
  done: string[];
  /** Steps answered right on the first try. */
  firstTry: number;
  /** Whether the current step has already had a wrong pick. */
  missedThisStep: boolean;
  recorded: boolean;
}

/** Kept outside the component so progress survives scrolling the card off-screen. */
const useApproachStore = create<{ cards: Record<string, ApproachState>; set: (k: string, s: ApproachState) => void }>((set) => ({
  cards: {},
  set: (k, s) => set((st) => ({ cards: { ...st.cards, [k]: s } })),
}));

const fresh: ApproachState = { done: [], firstTry: 0, missedThisStep: false, recorded: false };

const FEEDBACK: Record<Exclude<ChoiceVerdict, 'correct'>, string> = {
  'not-yet': 'Right idea, wrong time: it needs something you have not worked out yet.',
  'not-needed': 'Not needed for this problem.',
};

export function ApproachCard({ inst, template: t, onNext }: { inst: CalcInstance; template: CalcTemplate; onNext: () => void }) {
  const state = useApproachStore((s) => s.cards[inst.key]) ?? fresh;
  const save = useApproachStore.getState().set;
  const [wrong, setWrong] = useState<{ key: string; verdict: ChoiceVerdict } | null>(null);

  const done = useMemo(() => new Set(state.done), [state.done]);
  const total = t.reference.length;
  const finished = state.done.length === total;
  const options = useMemo(
    () => (finished ? [] : buildOptions(t, done, rng(inst.seed + 977 * done.size))),
    [t, done, finished, inst.seed],
  );

  const choose = (o: ApproachOption) => {
    const verdict = judgeChoice(t, done, o);
    if (verdict !== 'correct') {
      setWrong({ key: o.key, verdict });
      save(inst.key, { ...state, missedThisStep: true });
      return;
    }
    setWrong(null);
    const node = resolveChoice(t, done, o)!;
    const next: ApproachState = {
      ...state,
      done: [...state.done, node.id],
      firstTry: state.firstTry + (state.missedThisStep ? 0 : 1),
      missedThisStep: false,
    };
    if (next.done.length === total && !state.recorded) {
      next.recorded = true;
      void db.attempts.add({
        itemId: t.id,
        section: 'calc',
        topic: t.topic,
        ts: Date.now(),
        score: next.firstTry / total,
        mode: 'approach',
        meta: { seed: inst.seed, steps: total, firstTry: next.firstTry },
      });
    }
    save(inst.key, next);
  };

  const doneNodes = state.done.map((id) => t.reference.find((n) => n.id === id)!);

  return (
    <article className="mx-auto flex h-full max-w-xl flex-col" aria-label={`Approach: ${t.title}`}>
      <header className="flex items-center gap-2 px-4 pt-2">
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">{TOPIC_TAG[t.topic] ?? t.topic}</span>
        <span className="text-xs text-muted">
          Step {Math.min(state.done.length + 1, total)} of {total}
        </span>
        <span className="flex-1" />
        <FlagButton itemId={t.id} section="calc" context="approach mode" />
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
        <p className="text-[17px] leading-relaxed">{t.approachText ?? t.title}</p>
        <div className="text-sm">
          <p className="mb-1 text-muted">You know</p>
          <div className="flex flex-wrap gap-1.5">
            {t.given.map((g) => (
              <span key={g.key} className="rounded-full bg-surface-2 px-2.5 py-1">
                {g.label}
              </span>
            ))}
          </div>
          <p className="mt-2 text-muted">
            Find <span className="font-semibold text-text">{t.answer.label}</span>
          </p>
        </div>

        {doneNodes.length > 0 && (
          <ol className="space-y-1.5" aria-label="Steps so far">
            {doneNodes.map((n, i) => {
              const d = describeNode(t, n);
              return (
                <li key={n.id} className="rounded-xl border border-good/40 px-3 py-2 text-sm">
                  <span className="text-good">✓ {i + 1}.</span> {d.caption}
                </li>
              );
            })}
          </ol>
        )}

        {!finished && (
          <div>
            <p className="mb-2 text-sm font-semibold">What comes {state.done.length === 0 ? 'first' : 'next'}?</p>
            <ul className="space-y-2">
              {options.map((o) => {
                const isWrong = wrong?.key === o.key;
                return (
                  <li key={o.key} className={isWrong ? 'animate-shake' : ''}>
                    <button
                      type="button"
                      onClick={() => choose(o)}
                      className={`flex min-h-14 w-full flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left ${
                        isWrong ? 'border-bad' : 'border-border bg-surface-2'
                      }`}
                    >
                      <span className="text-sm">{o.caption}</span>
                      {o.latex && (
                        <span className="max-w-full overflow-x-auto overflow-y-hidden text-sm text-muted">
                          <Tex>{o.latex}</Tex>
                        </span>
                      )}
                    </button>
                    {isWrong && wrong.verdict !== 'correct' && (
                      <p className="mt-1 px-1 text-xs text-bad" role="alert">
                        {FEEDBACK[wrong.verdict]}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {finished && (
          <section role="status" className="rounded-2xl border border-good/50 p-4">
            <p className="mb-1 text-lg font-semibold text-good">Plan complete</p>
            <p className="mb-3 text-sm">
              {state.firstTry} of {total} steps right first time.
            </p>
            <p className="text-sm leading-relaxed text-muted">{t.explanation}</p>
          </section>
        )}
      </div>

      <div className="flex gap-2 border-t border-border bg-bg px-4 py-2">
        <button
          type="button"
          onClick={onNext}
          className={`min-h-12 flex-1 rounded-xl px-4 font-medium ${finished ? 'bg-accent text-accent-ink' : 'bg-surface-2'}`}
        >
          {finished ? 'Next ↓' : 'Skip ↓'}
        </button>
      </div>
    </article>
  );
}
