import { reagentById } from '@/data';
import type { ReactItem } from '@/data/schemas';
import { itemId } from '@/storage/progress';
import { answer } from '../answer';
import { Structure } from '@/ui/Structure';
import { CardTop } from './ReagentHeader';
import { emptyCard, useReagentStore } from './store';

/** "Will it react?": which groups react, then which product forms. */
export function ReactCard({ cardKey, item, onNext }: { cardKey: string; item: ReactItem; onNext: () => void }) {
  const state = useReagentStore((s) => s.cards[cardKey]) ?? emptyCard;
  const update = useReagentStore.getState().update;
  const reagent = reagentById.get(item.reagentId)!;
  const picked = new Set(state.groups ?? []);
  const groupsRight = item.groups.every((g) => g.reacts === picked.has(g.name));
  const done = state.product !== undefined;
  const productRight = done && item.products[state.product!]!.correct;

  const toggleGroup = (name: string) => {
    if (state.groupsChecked) return;
    const next = new Set(picked);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    update(cardKey, { groups: [...next] });
  };

  const pickProduct = (i: number) => {
    if (done) return;
    update(cardKey, { product: i });
    const score = (groupsRight ? 0.5 : 0) + (item.products[i]!.correct ? 0.5 : 0);
    void answer({
      itemId: itemId.react(item.id),
      section: 'reagents',
      topic: item.topic,
      score,
      mode: 'react',
      meta: { groups: [...picked], product: i },
    });
  };

  return (
    <article className="mx-auto flex h-full max-w-xl flex-col" aria-label={`Will it react: ${item.substrate.name} with ${reagent.name}`}>
      <CardTop topic={item.topic} reviewed={item.reviewed} itemId={itemId.react(item.id)} context="will it react" />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
        <div className="rounded-2xl bg-surface p-3 text-center">
          <Structure smiles={item.substrate.smiles} label={`Structure of ${item.substrate.name}`} width={260} height={130} />
          <p className="font-semibold">{item.substrate.name}</p>
          <p className="mt-2 text-sm">
            + <span className="font-semibold">{reagent.name}</span> ({reagent.formula})
          </p>
          {item.conditions && <p className="text-xs text-muted">{item.conditions}</p>}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">1. Which group(s) react?</p>
          <div className="flex flex-wrap gap-2">
            {item.groups.map((g) => {
              const on = picked.has(g.name);
              const tone = !state.groupsChecked
                ? on
                  ? 'border-accent bg-accent/15'
                  : 'border-border bg-surface-2'
                : g.reacts
                  ? on
                    ? 'border-good bg-good/15'
                    : 'border-good border-dashed'
                  : on
                    ? 'border-bad bg-bad/15'
                    : 'border-border text-muted';
              return (
                <button key={g.name} type="button" aria-pressed={on} onClick={() => toggleGroup(g.name)} className={`min-h-11 rounded-md border px-3 text-sm ${tone}`}>
                  {g.name}
                  {state.groupsChecked && (g.reacts ? ' · reacts' : ' · untouched')}
                </button>
              );
            })}
          </div>
          {state.groupsChecked && (
            <p role="status" className={`animate-pop mt-2 text-sm ${groupsRight ? 'text-good' : 'text-bad'}`}>
              {groupsRight ? '✓ Right groups' : '✗ Not quite: reacting groups are in green'}
            </p>
          )}
        </div>

        {state.groupsChecked && (
          <div>
            <p className="mb-2 text-sm font-semibold">2. Which product forms?</p>
            <ul className="grid grid-cols-2 gap-2">
              {item.products.map((p, i) => {
                const tone = !done ? 'border-border' : p.correct ? 'border-good bg-good/10' : state.product === i ? 'border-bad bg-bad/10' : 'border-border text-muted';
                return (
                  <li key={p.smiles}>
                    <button
                      type="button"
                      onClick={() => pickProduct(i)}
                      aria-label={`${p.label}${done ? (p.correct ? ', correct' : '') : ''}`}
                      className={`flex w-full flex-col items-center rounded-xl border p-2 ${tone}`}
                    >
                      <Structure smiles={p.smiles} label={p.label} width={160} height={100} />
                      <span className="text-xs leading-tight">{p.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {done && (
          <section role="status" className={`animate-pop rounded-2xl border p-4 text-sm leading-relaxed ${productRight ? 'border-good/50' : 'border-bad/50'}`}>
            <p className={`mb-1 font-semibold ${productRight ? 'text-good' : 'text-bad'}`}>{productRight ? '✓ Correct product' : '✗ Not that one'}</p>
            {item.explanation}
          </section>
        )}
      </div>
      <div className="border-t border-border bg-bg px-4 py-2">
        {!state.groupsChecked ? (
          <button
            type="button"
            disabled={picked.size === 0}
            onClick={() => update(cardKey, { groupsChecked: true })}
            className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40"
          >
            Check groups
          </button>
        ) : (
          <button
            type="button"
            disabled={!done}
            onClick={onNext}
            className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40"
          >
            {done ? 'Next ↓' : 'Pick a product'}
          </button>
        )}
      </div>
    </article>
  );
}
