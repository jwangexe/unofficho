import { useCallback, useMemo, useRef, useState } from 'react';
import { reactItems, reagents } from '@/data';
import type { ReactItem, Reagent } from '@/data/schemas';
import { itemId } from '@/storage/progress';
import { Feed, type FeedHandle } from '@/ui/Feed';
import { EmptyFocus, FocusBanner, useDueIds, useFocus, type Focus } from '../focus';
import { ClassifyCard, FastCard } from './ClassifyCard';
import { ReactCard } from './ReactCard';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

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

interface Deck {
  reagents: readonly Reagent[];
  reactItems: readonly ReactItem[];
}

const FULL_DECK: Deck = { reagents, reactItems };

/** The part of the deck a focus selects; due ids come from the SRS store. */
function focusDeck(focus: Focus, due: Set<string> | null): Deck {
  const keep = (id: string, topic: string) =>
    (!focus.topic || topic === focus.topic) && (!focus.ids || focus.ids.includes(id)) && (!focus.due || !!due?.has(id));
  return {
    reagents: reagents.filter((r) => keep(itemId.reagent(r.id), r.topic)),
    reactItems: reactItems.filter((x) => keep(itemId.react(x.id), x.topic)),
  };
}

const deckSize = (deck: Deck, mode: Mode) => (mode === 'react' ? deck.reactItems.length : deck.reagents.length);

let counter = 0;
/** One shuffled pass through the deck; the feed appends another pass when it runs low. */
function deal(mode: Mode, deck: Deck): Item[] {
  return mode === 'react'
    ? shuffle(deck.reactItems).map((react) => ({ key: `${react.id}#${counter++}`, react }))
    : shuffle(deck.reagents).map((reagent) => ({ key: `${reagent.id}#${counter++}`, reagent }));
}

function ModeFeed({ mode, deck }: { mode: Mode; deck: Deck }) {
  const [items, setItems] = useState<Item[]>(() => deal(mode, deck));
  const feed = useRef<FeedHandle>(null);
  const onIndexChange = useCallback(
    (i: number) => setItems((cur) => (i >= cur.length - 3 ? [...cur, ...deal(mode, deck)] : cur)),
    [mode, deck],
  );
  return (
    <Feed
      ref={feed}
      items={items}
      getKey={(x) => x.key}
      onIndexChange={onIndexChange}
      itemLabel={mode === 'react' ? 'Question' : 'Reagent'}
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
  useDocumentTitle('Reagents');
  const [chosen, setMode] = useState<Mode>(readMode);
  const [focus, clearFocus] = useFocus();
  const due = useDueIds('reagents', !!focus?.due);
  const deck = useMemo(() => (focus ? (focus.due && !due ? null : focusDeck(focus, due)) : FULL_DECK), [focus, due]);
  // A focus on "Will it react?" items alone opens that mode (and vice versa) without changing the saved choice.
  const mode: Mode =
    deck && deckSize(deck, chosen) === 0 && focus
      ? chosen === 'react'
        ? 'classify'
        : deck.reactItems.length
          ? 'react'
          : chosen
      : chosen;
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
      {focus && deck && <FocusBanner focus={focus} count={deck.reagents.length + deck.reactItems.length} onClear={clearFocus} />}
      <div className="min-h-0 flex-1">
        {!deck ? null : deckSize(deck, mode) === 0 ? (
          <EmptyFocus
            message={focus?.due ? 'Nothing is due for review in Reagents today.' : 'Nothing in this mode matches the focus.'}
            onClear={clearFocus}
          />
        ) : (
          <ModeFeed key={`${mode}|${focus ? JSON.stringify(focus) : ''}|${due?.size ?? ''}`} mode={mode} deck={deck} />
        )}
      </div>
    </div>
  );
}
