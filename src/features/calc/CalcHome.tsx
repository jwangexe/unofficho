import { useCallback, useRef, useState } from 'react';
import { ALL_TEMPLATES, CALC_TEMPLATES, calcTemplateById, PROBLEMS } from '@/data/templates';
import { instantiate, type CalcInstance, type CalcTemplate } from '@/engine/template';
import { Feed, type FeedHandle } from '@/ui/Feed';
import { ApproachCard } from './ApproachCard';
import { QuestionCard } from './QuestionCard';
import { useCalcStore } from './store';

type Mode = 'feed' | 'approach' | 'multi' | 'exam';

const MODES: { id: Mode; label: string; pool: readonly CalcTemplate[] }[] = [
  { id: 'feed', label: 'Feed', pool: CALC_TEMPLATES },
  // Planning only means something when there is more than one step.
  { id: 'approach', label: 'Approach', pool: ALL_TEMPLATES.filter((t) => t.reference.length >= 2) },
  { id: 'multi', label: 'Multi-step', pool: PROBLEMS },
  { id: 'exam', label: 'Exam', pool: [...CALC_TEMPLATES.filter((t) => t.difficulty >= 2), ...PROBLEMS] },
];

const MODE_KEY = 'unofficho.calcMode';

const randomSeed = () => {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0]!;
  } catch {
    return Math.floor(Math.random() * 2 ** 32);
  }
};

/** Generate `n` more cards from `pool`, never repeating the template of the card before. */
function generate(pool: readonly CalcTemplate[], n: number, lastTemplate?: string): CalcInstance[] {
  const out: CalcInstance[] = [];
  let last = lastTemplate;
  while (out.length < n) {
    const choices = pool.length > 1 ? pool.filter((t) => t.id !== last) : pool;
    const t = choices[Math.floor(Math.random() * choices.length)]!;
    const res = instantiate(t, randomSeed());
    if (!res.ok) continue;
    useCalcStore.getState().ensure(res.value);
    out.push(res.value);
    last = t.id;
  }
  return out;
}

function ModeFeed({ mode }: { mode: Mode }) {
  const pool = MODES.find((m) => m.id === mode)!.pool;
  const [items, setItems] = useState<CalcInstance[]>(() => generate(pool, 5));
  const [locked, setLocked] = useState(false);
  const [index, setIndex] = useState(0);
  const feed = useRef<FeedHandle>(null);

  const onIndexChange = useCallback(
    (i: number) => {
      setIndex(i);
      setItems((cur) => (i >= cur.length - 3 ? [...cur, ...generate(pool, 5, cur.at(-1)?.templateId)] : cur));
    },
    [pool],
  );

  return (
    <>
      <Feed
        ref={feed}
        items={items}
        getKey={(i) => i.key}
        locked={locked}
        onIndexChange={onIndexChange}
        render={(inst, i, active) => {
          const t = calcTemplateById.get(inst.templateId)!;
          const next = () => feed.current?.scrollTo(i + 1);
          return mode === 'approach' ? (
            <ApproachCard inst={inst} template={t} onNext={next} />
          ) : (
            <QuestionCard inst={inst} template={t} mode={mode} exam={mode === 'exam'} active={active} onNext={next} onSheetChange={setLocked} />
          );
        }}
      />
      <span className="sr-only" aria-live="polite">
        Question {index + 1}
      </span>
    </>
  );
}

function readMode(): Mode {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return MODES.some((x) => x.id === m) ? (m as Mode) : 'feed';
  } catch {
    return 'feed';
  }
}

export default function CalcHome() {
  const [mode, setMode] = useState<Mode>(readMode);
  const pick = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // Not persisted in private mode; fine.
    }
  };

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Calculation modes" className="mx-auto flex w-full max-w-xl gap-1 overflow-x-auto px-4 pt-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m.id)}
            aria-current={m.id === mode ? 'page' : undefined}
            className={`min-h-9 shrink-0 rounded-full px-3 text-sm ${m.id === mode ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1">
        <ModeFeed key={mode} mode={mode} />
      </div>
    </div>
  );
}
