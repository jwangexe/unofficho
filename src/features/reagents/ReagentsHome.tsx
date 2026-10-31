import { useCallback, useRef, useState } from 'react';
import { reactItems, reagents } from '@/data';
import type { ReactItem, Reagent } from '@/data/schemas';
import { Feed, type FeedHandle } from '@/ui/Feed';
import { ClassifyCard, FastCard } from './ClassifyCard';
import { ReactCard } from './ReactCard';

type Mode = 'classify' | 'fast' | 'react';
const MODES: { id: Mode; label: string }[] = [
  { id: 'classify', label: 'Classify' },
  { id: 'fast', label: 'Fast' },
  { id: 'react', label: 'Will it react?' },
];
const MODE_KEY = 'unofficho.reagentMode';

type Item = { key: string; reagent?: Reagent; react?: ReactItem };

function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

let counter = 0;
/** One shuffled pass through the deck; the feed appends another pass when it runs low. */
function deal(mode: Mode): Item[] {
  return mode === 'react'
    ? shuffle(reactItems).map((react) => ({ key: `${react.id}#${counter++}`, react }))
    : shuffle(reagents).map((reagent) => ({ key: `${reagent.id}#${counter++}`, reagent }));
}

function ModeFeed({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<Item[]>(() => deal(mode));
  const feed = useRef<FeedHandle>(null);
  const onIndexChange = useCallback(
    (i: number) => setItems((cur) => (i >= cur.length - 3 ? [...cur, ...deal(mode)] : cur)),
    [mode],
  );
  return (
    <Feed
      ref={feed}
      items={items}
      getKey={(x) => x.key}
      onIndexChange={onIndexChange}
      render={(x, i) => {
        const next = () => feed.current?.scrollTo(i + 1);
        if (x.react) return <ReactCard cardKey={x.key} item={x.react} onNext={next} />;
        return mode === 'fast' ? (
          <FastCard cardKey={x.key} r={x.reagent!} onNext={next} />
        ) : (
          <ClassifyCard cardKey={x.key} r={x.reagent!} onNext={next} />
        );
      }}
    />
  );
}

function readMode(): Mode {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return MODES.some((x) => x.id === m) ? (m as Mode) : 'classify';
  } catch {
    return 'classify';
  }
}

export default function ReagentsHome() {
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
      <nav aria-label="Reagent modes" className="mx-auto flex w-full max-w-xl gap-1 overflow-x-auto px-4 pt-2">
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
