import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_TEMPLATES, CALC_TEMPLATES, calcTemplateById, PROBLEMS, templateFormulas } from '@/data/templates';
import { instantiate, type CalcInstance, type CalcTemplate } from '@/engine/template';
import { itemId } from '@/storage/progress';
import { EmptyFocus, FocusBanner, useDueIds, useFocus, type Focus } from '../focus';
import { Feed, type FeedHandle } from '@/ui/Feed';
import { MECHANISMS } from '@/data/mechanisms';
import type { Mechanism } from '@/engine/mechanism';
import { MechanismCard, type MechanismItem } from '../mechanisms/MechanismCard';
import { ApproachCard } from './ApproachCard';
import { QuestionCard } from './QuestionCard';
import { useCalcStore } from './store';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { useSavedMode } from '../useSavedMode';

type Mode = 'feed' | 'approach' | 'multi' | 'exam' | 'mechanisms';

const MODES: { id: Mode; label: string; pool: readonly CalcTemplate[] }[] = [
  { id: 'feed', label: 'Feed', pool: CALC_TEMPLATES },
  // Planning only means something when there is more than one step.
  { id: 'approach', label: 'Approach', pool: ALL_TEMPLATES.filter((t) => t.reference.length >= 2) },
  { id: 'multi', label: 'Multi-step', pool: PROBLEMS },
  { id: 'exam', label: 'Exam', pool: [...CALC_TEMPLATES.filter((t) => t.difficulty >= 2), ...PROBLEMS] },
  // Steady-state and pre-equilibrium derivations; this mode deals mechanisms, not templates.
  { id: 'mechanisms', label: 'Mechanisms', pool: [] },
];

/** Mechanisms matching a focus (only topic, item and due focuses apply). */
function focusMechanisms(focus: Focus | null, due: Set<string> | null): Mechanism[] {
  if (!focus) return [...MECHANISMS];
  if (focus.formula) return [];
  return MECHANISMS.filter(
    (m) =>
      (!focus.topic || m.topic === focus.topic) &&
      (!focus.ids || focus.ids.includes(itemId.mech(m.id))) &&
      (!focus.due || !!due?.has(itemId.mech(m.id))),
  );
}

let mechCounter = 0;
/** One shuffled pass over the mechanisms, each with a random challenge. */
function dealMechanisms(pool: readonly Mechanism[]): MechanismItem[] {
  return pool
    .map((mech) => ({ mech, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ mech }) => ({ key: `${mech.id}#${mechCounter++}`, mech, challenge: Math.floor(Math.random() * mech.challenges.length), seed: randomSeed() }));
}

function MechanismFeed({ pool }: { pool: readonly Mechanism[] }) {
  const [items, setItems] = useState<MechanismItem[]>(() => dealMechanisms(pool));
  const feed = useRef<FeedHandle>(null);
  const onIndexChange = useCallback((i: number) => setItems((cur) => (i >= cur.length - 3 ? [...cur, ...dealMechanisms(pool)] : cur)), [pool]);
  return (
    <Feed
      ref={feed}
      items={items}
      getKey={(x) => x.key}
      itemLabel="Mechanism"
      onIndexChange={onIndexChange}
      render={(x, i) => <MechanismCard item={x} onNext={() => feed.current?.scrollTo(i + 1)} />}
    />
  );
}

const MODE_KEY = 'unofficho.calcMode';

/**
 * Templates matching a focus within a mode. A focused feed draws from every template,
 * multi-step problems included, since a weak spot may be one.
 */
function focusPool(mode: Mode, focus: Focus, due: Set<string> | null): CalcTemplate[] {
  const base = mode === 'feed' ? ALL_TEMPLATES : MODES.find((m) => m.id === mode)!.pool;
  return base.filter(
    (t) =>
      (!focus.topic || t.topic === focus.topic) &&
      (!focus.formula || templateFormulas(t).includes(focus.formula)) &&
      (!focus.ids || focus.ids.includes(itemId.calc(t.id))) &&
      (!focus.due || !!due?.has(itemId.calc(t.id))),
  );
}

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

function ModeFeed({ mode, pool }: { mode: Mode; pool: readonly CalcTemplate[] }) {
  const [items, setItems] = useState<CalcInstance[]>(() => generate(pool, 5));
  const [locked, setLocked] = useState(false);
  const feed = useRef<FeedHandle>(null);

  const onIndexChange = useCallback(
    (i: number) => {
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
        itemLabel="Question"
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
    </>
  );
}

export default function CalcHome() {
  useDocumentTitle('Calculations');
  const [chosen, pick] = useSavedMode<Mode>(MODE_KEY, MODES.map((m) => m.id), 'feed');

  const [focus, clearFocus] = useFocus();
  const due = useDueIds('calc', !!focus?.due);
  // A focus on mechanisms only (e.g. a weak spot) opens Mechanisms mode without changing the saved choice.
  const mode: Mode = focus?.ids?.length && focus.ids.every((id) => id.startsWith('mech:')) ? 'mechanisms' : chosen;
  const waiting = !!focus?.due && !due;
  const mechPool = useMemo(() => (mode === 'mechanisms' && !waiting ? focusMechanisms(focus, due) : []), [mode, focus, due, waiting]);
  const pool = useMemo(
    () =>
      waiting || mode === 'mechanisms' ? null : focus ? focusPool(mode, focus, due) : MODES.find((m) => m.id === mode)!.pool,
    [focus, due, mode, waiting],
  );
  const count = mode === 'mechanisms' ? mechPool.length : (pool?.length ?? 0);

  // Five modes overflow a phone's width: keep the active one in view.
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [mode]);
  const ready = mode === 'mechanisms' ? !waiting : !!pool;

  return (
    <div className="flex h-full flex-col">
      <nav ref={nav} aria-label="Calculation modes" className="mx-auto flex w-full max-w-xl gap-1 overflow-x-auto px-4 pt-2">
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
      {focus && ready && <FocusBanner focus={focus} count={count} onClear={clearFocus} />}
      <div className="min-h-0 flex-1">
        {!ready ? null : count === 0 ? (
          <EmptyFocus
            message={focus?.due ? 'Nothing is due for review in Calculations today.' : 'No questions in this mode match the focus. Try another mode.'}
            onClear={clearFocus}
          />
        ) : mode === 'mechanisms' ? (
          <MechanismFeed key={`mech|${mechPool.map((m) => m.id).join(',')}`} pool={mechPool} />
        ) : (
          <ModeFeed key={`${mode}|${pool!.map((t) => t.id).join(',')}`} mode={mode as Exclude<Mode, 'mechanisms'>} pool={pool!} />
        )}
      </div>
    </div>
  );
}
