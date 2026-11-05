import { useMemo } from 'react';
import { create } from 'zustand';
import { challengeOptions, describeChoice, symbolTex, type Mechanism } from '@/engine/mechanism';
import { rng } from '@/engine/template';
import { CardTop } from '@/features/reagents/ReagentHeader';
import { itemId } from '@/storage/progress';
import { Tex } from '@/ui/Tex';
import { texToSpeech } from '@/ui/texSpeech';
import { answer } from '../answer';
import { RichText } from '../book/QuickChecks';
import { MechanismDerive } from './MechanismDerive';
import { MechanismExplorer } from './MechanismExplorer';
import { MechanismScheme } from './MechanismScheme';

type Style = 'pick' | 'derive';
const STYLE_KEY = 'unofficho.mechStyle';
const readStyle = (): Style => {
  try {
    return localStorage.getItem(STYLE_KEY) === 'pick' ? 'pick' : 'derive';
  } catch {
    return 'derive';
  }
};

/** Answers per card (kept outside the cards so they survive scrolling off-screen), plus the preferred style. */
const usePicks = create<{
  picks: Record<string, number>;
  derived: Record<string, boolean>;
  style: Style;
  pick: (key: string, i: number) => void;
  finishDerive: (key: string) => void;
  setStyle: (s: Style) => void;
}>((set) => ({
  picks: {},
  derived: {},
  style: readStyle(),
  pick: (key, i) => set((s) => ({ picks: { ...s.picks, [key]: i } })),
  finishDerive: (key) => set((s) => ({ derived: { ...s.derived, [key]: true } })),
  setStyle: (style) => {
    try {
      localStorage.setItem(STYLE_KEY, style);
    } catch {
      // Not persisted in private mode; fine.
    }
    set({ style });
  },
}));

export interface MechanismItem {
  key: string;
  mech: Mechanism;
  challenge: number;
  seed: number;
}

/** "Which rate law follows?" for one mechanism and approximation, then the full derivation. */
export function MechanismCard({ item, onNext }: { item: MechanismItem; onNext: () => void }) {
  const { mech, key } = item;
  const choice = mech.challenges[item.challenge]!;
  const options = useMemo(() => challengeOptions(mech, choice, rng(item.seed)) ?? [], [mech, choice, item.seed]);
  const picked = usePicks((s) => s.picks[key]);
  const derived = usePicks((s) => !!s.derived[key]);
  const style = usePicks((s) => s.style);
  const done = picked !== undefined || derived;
  const right = picked !== undefined && options[picked]!.correct;
  const tex = symbolTex(mech);
  const target = tex(`[${mech.rate.species}]`);
  const lhs = `${mech.rate.sign === -1 ? '-' : ''}\\frac{\\mathrm{d}${target}}{\\mathrm{d}t}`;

  const choose = (i: number) => {
    if (done) return;
    usePicks.getState().pick(key, i);
    void answer({
      itemId: itemId.mech(mech.id),
      section: 'calc',
      topic: mech.topic,
      score: options[i]!.correct ? 1 : 0,
      mode: 'mechanisms',
      meta: { challenge: item.challenge, pick: i },
    });
  };

  const finishDerive = (score: number, meta: Record<string, unknown>) => {
    usePicks.getState().finishDerive(key);
    void answer({ itemId: itemId.mech(mech.id), section: 'calc', topic: mech.topic, score, mode: 'mechanisms-derive', meta: { challenge: item.challenge, ...meta } });
  };

  return (
    <article className="mx-auto flex h-full max-w-xl flex-col" aria-label={`Mechanism: ${mech.title}`}>
      <CardTop topic="kinetics/mechanisms" reviewed={mech.reviewed} itemId={itemId.mech(mech.id)} context={`challenge ${item.challenge}`} section="calc" />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
        <div>
          <h2 className="text-lg leading-snug font-semibold">{mech.title}</h2>
          <p className="text-sm text-muted">{mech.blurb}</p>
        </div>
        <div className="rounded-2xl bg-surface p-3" data-tour="scheme">
          <MechanismScheme mech={mech} />
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1" role="group" aria-label="How to answer" data-tour="style">
          {(['derive', 'pick'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={style === s}
              disabled={picked !== undefined || derived}
              onClick={() => usePicks.getState().setStyle(s)}
              className={`min-h-10 rounded-lg text-sm font-medium disabled:opacity-60 ${style === s ? 'bg-accent text-accent-ink' : 'text-muted'}`}
            >
              {s === 'derive' ? 'Derive it' : 'Pick the rate law'}
            </button>
          ))}
        </div>
        <p className="leading-relaxed">
          Take <RichText>{describeChoice(mech, choice)}</RichText>.{' '}
          {style === 'pick' ? (
            <>
              Which expression is <Tex>{lhs}</Tex>?
            </>
          ) : (
            <>
              Derive <Tex>{lhs}</Tex>.
            </>
          )}
        </p>
        {style === 'derive' && picked === undefined && <MechanismDerive cardKey={key} mech={mech} choice={choice} seed={item.seed} onFinish={finishDerive} />}
        {style === 'pick' && (
        <div className="grid gap-2" role="group" aria-label="Rate laws">
          {options.map((o, i) => {
            const tone = !done ? 'border-border bg-surface-2' : o.correct ? 'border-good bg-good/10' : picked === i ? 'border-bad bg-bad/10' : 'border-border bg-surface-2 text-muted';
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                aria-disabled={done}
                aria-label={`${texToSpeech(`${lhs} = ${o.tex}`)}${done && o.correct ? ' (correct)' : done && picked === i ? ' (your answer, incorrect)' : ''}`}
                className={`min-h-14 overflow-x-auto rounded-xl border px-3 py-2 text-left ${tone}`}>
                <Tex>{`${lhs} = ${o.tex.replace(/\\dfrac/g, '\\frac')}`}</Tex>
              </button>
            );
          })}
        </div>
        )}
        {picked !== undefined && (
          <section role="status" className={`animate-pop space-y-2 rounded-2xl border p-4 text-sm leading-relaxed ${right ? 'border-good/50' : 'border-bad/50'}`}>
            <p className={`font-semibold ${right ? 'text-good' : 'text-bad'}`}>{right ? '✓ Correct' : '✗ Not quite'}</p>
            {!right && options[picked]!.why && (
              <p>
                <RichText>{options[picked]!.why}</RichText>
              </p>
            )}
            <p>
              <RichText>{mech.explanation}</RichText>
            </p>
          </section>
        )}
        {done && (
          <section aria-label="Derivation" className="rounded-2xl bg-surface p-3">
            <h3 className="mb-2 font-semibold">{derived ? 'Explore' : 'Derivation'}</h3>
            <p className="mb-3 text-xs text-muted">Change the approximations to see how the rate law changes.</p>
            <MechanismExplorer mech={mech} initial={choice} />
          </section>
        )}
      </div>
      <div className="border-t border-border bg-bg px-4 py-2">
        <button type="button" disabled={!done} onClick={onNext} className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40">
          {done ? 'Next ↓' : style === 'derive' ? 'Derive the rate law' : 'Pick a rate law'}
        </button>
      </div>
    </article>
  );
}
