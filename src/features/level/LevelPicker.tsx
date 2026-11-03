import { useEffect, useMemo, useRef, useState } from 'react';
import { LEVEL_IDS, LEVEL_LIST, LEVELS, levelRank, type LevelId } from '@/data/levels';
import { Rad, type RadPose } from '@/ui/Rad';
import { buildPlacement, recommend } from './placement';
import { DEFAULT_LEVEL, useLevelStore } from './store';

/** Five steps, filled up to the level: how hard it is relative to the others. */
export function LevelLadder({ level, className = '' }: { level: LevelId; className?: string }) {
  const rank = levelRank(level);
  return (
    <span aria-hidden className={`inline-flex items-end gap-0.5 ${className}`}>
      {LEVEL_IDS.map((l, i) => (
        <span key={l} className={`w-1.5 rounded-sm ${i <= rank ? 'bg-accent' : 'bg-border'}`} style={{ height: `${6 + i * 3}px` }} />
      ))}
    </span>
  );
}

const ladderText = (l: LevelId) => `difficulty ${levelRank(l) + 1} of ${LEVEL_IDS.length}`;

/** The five level cards; one is selected at a time. */
export function LevelCards({ selected, onSelect }: { selected: LevelId | null; onSelect: (l: LevelId) => void }) {
  return (
    <ul className="space-y-2" aria-label="Levels">
      {LEVEL_LIST.map((s) => {
        const on = s.id === selected;
        return (
          <li key={s.id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(s.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-surface px-4 py-3 text-left ${on ? 'border-accent' : 'border-transparent'}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{s.name}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted">{s.who}</span>
                <span className="sr-only">, {ladderText(s.id)}</span>
              </span>
              <LevelLadder level={s.id} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Placement({ onDone, onCancel }: { onDone: (l: LevelId) => void; onCancel: () => void }) {
  const questions = useMemo(() => buildPlacement(Math.floor(Math.random() * 2 ** 32)), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<{ level: LevelId; correct: boolean }[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), [i]);

  if (i >= questions.length) {
    const rec = recommend(results);
    return <PlacementResult recommended={rec} score={results.filter((r) => r.correct).length} total={questions.length} onAccept={onDone} onCancel={onCancel} />;
  }
  const q = questions[i]!;
  const answered = picked !== null;
  const next = () => {
    setResults((r) => [...r, { level: q.level, correct: picked === q.answer }]);
    setPicked(null);
    setI(i + 1);
  };
  const pose: RadPose = !answered ? 'thinking' : picked === q.answer ? 'correct' : 'wrong';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Rad pose={pose} size={64} />
        <div className="min-w-0">
          <p className="text-xs text-muted">
            Question {i + 1} of {questions.length}
          </p>
          <h2 ref={heading} tabIndex={-1} className="font-semibold outline-none">
            {q.template.title}
          </h2>
        </div>
      </div>
      <p className="leading-relaxed">{q.inst.text}</p>
      <p className="text-sm text-muted">Find {q.template.answer.label}. A rough estimate is fine.</p>
      <ul className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2" aria-label="Options">
        {q.options.map((o, k) => {
          const state = !answered ? '' : k === q.answer ? 'border-good bg-good/15' : k === picked ? 'border-bad' : 'opacity-60';
          return (
            <li key={o}>
              <button
                type="button"
                disabled={answered}
                aria-pressed={picked === k}
                onClick={() => setPicked(k)}
                className={`min-h-12 w-full rounded-xl border-2 border-transparent bg-surface px-3 py-2 text-center font-medium tabular-nums ${state}`}
              >
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      <p role="status" className="min-h-6 text-sm">
        {answered && (picked === q.answer ? 'Right.' : `Not quite: it is ${q.options[q.answer]}.`)}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-xl bg-surface-2 px-4 text-sm font-medium">
          Back to levels
        </button>
        <button
          type="button"
          onClick={answered ? next : () => setPicked(-1)}
          className="min-h-11 flex-1 rounded-xl bg-accent px-4 font-semibold text-accent-ink"
        >
          {answered ? (i === questions.length - 1 ? 'See my level' : 'Next') : 'I don’t know'}
        </button>
      </div>
    </div>
  );
}

function PlacementResult({
  recommended,
  score,
  total,
  onAccept,
  onCancel,
}: {
  recommended: LevelId;
  score: number;
  total: number;
  onAccept: (l: LevelId) => void;
  onCancel: () => void;
}) {
  const [choice, setChoice] = useState<LevelId>(recommended);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Rad pose="celebrating" size={64} />
        <div>
          <p className="text-xs text-muted">
            {score} of {total} right
          </p>
          <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">
            I’d start you on {LEVELS[recommended].name}
          </h2>
        </div>
      </div>
      <p className="text-sm text-muted">That is the hardest level you answered correctly. Keep it, or pick another; you can change it any time in Settings.</p>
      <LevelCards selected={choice} onSelect={setChoice} />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="min-h-11 rounded-xl bg-surface-2 px-4 text-sm font-medium">
          Back
        </button>
        <button type="button" onClick={() => onAccept(choice)} className="min-h-11 flex-1 rounded-xl bg-accent px-4 font-semibold text-accent-ink">
          Start with {LEVELS[choice].name}
        </button>
      </div>
    </div>
  );
}

/** First launch: "What are you preparing for?", full screen until a level is chosen or skipped. */
export function LevelPicker() {
  const setLevel = useLevelStore((s) => s.setLevel);
  const [selected, setSelected] = useState<LevelId | null>(null);
  const [quiz, setQuiz] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!quiz) heading.current?.focus();
  }, [quiz]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="level-picker-title" className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-4 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {quiz ? (
          <>
            <h1 id="level-picker-title" className="sr-only">
              Placement quiz
            </h1>
            <Placement onDone={(l) => void setLevel(l)} onCancel={() => setQuiz(false)} />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Rad pose="pointing" size={72} />
              <div>
                <h1 id="level-picker-title" ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">
                  What are you preparing for?
                </h1>
                <p className="text-sm text-muted">I’ll pick questions, reagents and pages to match.</p>
              </div>
            </div>
            <LevelCards selected={selected} onSelect={setSelected} />
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && void setLevel(selected)}
              className="min-h-12 rounded-xl bg-accent px-4 font-semibold text-accent-ink disabled:opacity-50"
            >
              {selected ? `Start with ${LEVELS[selected].name}` : 'Choose a level to start'}
            </button>
            <button type="button" onClick={() => setQuiz(true)} className="min-h-11 rounded-xl bg-surface-2 px-4 text-sm font-medium">
              Not sure? Take a 5-question placement quiz
            </button>
            <button type="button" onClick={() => void setLevel(DEFAULT_LEVEL)} className="mx-auto min-h-11 px-3 text-sm text-muted underline underline-offset-4">
              Skip for now ({LEVELS[DEFAULT_LEVEL].name})
            </button>
          </>
        )}
      </div>
    </div>
  );
}
