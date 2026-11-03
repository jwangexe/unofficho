import { useCallback, useMemo, useRef, useState } from 'react';
import { reactItems, reagents } from '@/data';
import type { ReactItem, Reagent } from '@/data/schemas';
import { itemId } from '@/storage/progress';
import { Feed, type FeedHandle } from '@/ui/Feed';
import { EmptyFocus, FocusBanner, useDueIds, useFocus, type Focus } from '../focus';
import { useSavedMode } from '../useSavedMode';
import { ClassifyCard, FastCard } from './ClassifyCard';
import { ReactCard } from './ReactCard';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { TITLES } from '@/app/seo';
import { LEVELS } from '@/data/levels';
import { weightedPass, weightedPool, type LevelPrefs, type Weighted } from '@/data/levels/pool';
import { LevelChip } from '../level/LevelChip';
import { useLevelPrefs } from '../level/store';

type Mode = 'classify' | 'fast' | 'react';
const MODES: { id: Mode; label: string }[] = [
  { id: 'classify', label: 'Classify' },
  { id: 'fast', label: 'Fast' },
  { id: 'react', label: 'Will it react?' },
];
const MODE_KEY = 'unofficho.reagentMode';

type Item = { key: string; reagent?: Reagent; react?: ReactItem };

interface Deck {
  reagents: readonly Weighted<Reagent>[];
  reactItems: readonly Weighted<ReactItem>[];
}

/** The deck at a level: core items, plus warm-ups from easier levels if that is on. */
const levelDeck = (prefs: LevelPrefs): Deck => ({ reagents: weightedPool(reagents, prefs), reactItems: weightedPool(reactItems, prefs) });

/**
 * The part of the deck a focus selects; due ids come from the SRS store. A topic focus stays
 * within the level; due items and specific items are the student's own, so any level.
 */
function focusDeck(focus: Focus, due: Set<string> | null, prefs: LevelPrefs): Deck {
  const all = <T,>(xs: readonly T[]) => xs.map((item) => ({ item, weight: 1 }));
  const deck = focus.ids || focus.due ? { reagents: all(reagents), reactItems: all(reactItems) } : levelDeck(prefs);
  const keep = (id: string, topic: string) =>
    (!focus.topic || topic === focus.topic) && (!focus.ids || focus.ids.includes(id)) && (!focus.due || !!due?.has(id));
  return {
    reagents: deck.reagents.filter(({ item: r }) => keep(itemId.reagent(r.id), r.topic)),
    reactItems: deck.reactItems.filter(({ item: x }) => keep(itemId.react(x.id), x.topic)),
  };
}

const deckSize = (deck: Deck, mode: Mode) => (mode === 'react' ? deck.reactItems.length : deck.reagents.length);

let counter = 0;
/** One shuffled pass through the deck; the feed appends another pass when it runs low. */
function deal(mode: Mode, deck: Deck): Item[] {
  return mode === 'react'
    ? weightedPass(deck.reactItems, Math.random).map((react) => ({ key: `${react.id}#${counter++}`, react }))
    : weightedPass(deck.reagents, Math.random).map((reagent) => ({ key: `${reagent.id}#${counter++}`, reagent }));
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

export default function ReagentsHome() {
  useDocumentTitle(TITLES.reagents);
  const [chosen, pick] = useSavedMode<Mode>(MODE_KEY, MODES.map((m) => m.id), 'classify');
  const prefs = useLevelPrefs();
  const modes = MODES.filter((m) => LEVELS[prefs.level].modes.reagents.includes(m.id));
  const [focus, clearFocus] = useFocus();
  const due = useDueIds('reagents', !!focus?.due);
  const deck = useMemo(() => (focus ? (focus.due && !due ? null : focusDeck(focus, due, prefs)) : levelDeck(prefs)), [focus, due, prefs]);
  // A mode the level does not have (saved from another level) falls back to the level's first.
  const levelMode = modes.some((m) => m.id === chosen) ? chosen : modes[0]!.id;
  // A focus on "Will it react?" items alone opens that mode (and vice versa) without changing the saved choice.
  const mode: Mode =
    deck && deckSize(deck, levelMode) === 0 && focus
      ? levelMode === 'react'
        ? 'classify'
        : deck.reactItems.length
          ? 'react'
          : levelMode
      : levelMode;
  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-xl items-center gap-1 px-4 pt-2">
        <nav aria-label="Reagent modes" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {modes.map((m) => (
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
        <LevelChip />
      </div>
      {focus && deck && <FocusBanner focus={focus} count={deck.reagents.length + deck.reactItems.length} onClear={clearFocus} />}
      <div className="min-h-0 flex-1">
        {!deck ? null : deckSize(deck, mode) === 0 ? (
          <EmptyFocus
            message={focus?.due ? 'Nothing is due for review in Reagents today.' : 'Nothing in this mode matches the focus.'}
            onClear={clearFocus}
          />
        ) : (
          <ModeFeed key={`${mode}|${prefs.level}|${prefs.includeEasier}|${focus ? JSON.stringify(focus) : ''}|${due?.size ?? ''}`} mode={mode} deck={deck} />
        )}
      </div>
    </div>
  );
}
