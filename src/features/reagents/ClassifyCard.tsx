import { ROLE_LABELS, ROLES, type Reagent, type Role } from '@/data/schemas';
import { itemId, recordAttempt as record } from '@/storage/progress';
import { CardDisclaimer } from '@/ui/Footer';
import { ReagentExplanation } from './Explanation';
import { CardTop, ReagentIdentity } from './ReagentHeader';
import { scoreClassification, scoreFast } from './scoring';
import { emptyCard, useReagentStore } from './store';

const recordAttempt = (r: Reagent, score: number, mode: string, meta: Record<string, unknown>) =>
  void record({ itemId: itemId.reagent(r.id), section: 'reagents', topic: r.topic, score, mode, meta });

/** Multi-select classification: tap categories, then Check. */
export function ClassifyCard({ cardKey, r, onNext }: { cardKey: string; r: Reagent; onNext: () => void }) {
  const state = useReagentStore((s) => s.cards[cardKey]) ?? emptyCard;
  const update = useReagentStore.getState().update;
  const selected = new Set(state.selected);
  const result = state.checked ? scoreClassification(r, selected) : null;

  const toggle = (role: Role) => {
    if (state.checked) return;
    const next = new Set(selected);
    if (next.has(role)) next.delete(role);
    else {
      // "None of these" excludes everything else, and vice versa.
      if (role === 'none') next.clear();
      else next.delete('none');
      next.add(role);
    }
    update(cardKey, { selected: [...next] });
  };

  const check = () => {
    const res = scoreClassification(r, selected);
    update(cardKey, { checked: true });
    recordAttempt(r, res.score, 'classify', { selected: [...selected] });
  };

  const chipClass = (role: Role) => {
    if (!result) return selected.has(role) ? 'border-accent bg-accent/15 text-text' : 'border-border bg-surface-2';
    if (result.hit.includes(role)) return 'border-good bg-good/15';
    if (result.missed.includes(role)) return 'border-good border-dashed';
    if (result.wrong.includes(role)) return 'border-bad bg-bad/15';
    if (result.extra.includes(role)) return 'border-border bg-surface-2';
    return 'border-border opacity-50';
  };
  const chipNote = (role: Role) =>
    !result ? '' : result.missed.includes(role) ? ' · missed' : result.wrong.includes(role) ? ' · no' : result.extra.includes(role) ? ' · also OK' : '';

  // The chip grid sits in the thumb zone while answering, then moves up into the
  // scrolling area (graded) so the explanation has room.
  const grid = (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Categories">
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          aria-pressed={selected.has(role)}
          onClick={() => toggle(role)}
          className={`min-h-11 rounded-xl border px-2 text-sm ${role === 'none' ? 'col-span-2' : ''} ${chipClass(role)}`}
        >
          {ROLE_LABELS[role]}
          {chipNote(role)}
        </button>
      ))}
    </div>
  );

  return (
    <article className="mx-auto flex h-full max-w-xl flex-col" aria-label={`Classify ${r.name}`}>
      <CardTop topic={r.topic} reviewed={r.reviewed} itemId={itemId.reagent(r.id)} context="classify" />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
        <ReagentIdentity r={r} />
        {result && (
          <>
            <p role="status" className={`text-center text-lg font-semibold ${result.score === 1 ? 'text-good' : result.score > 0 ? 'text-warn' : 'text-bad'}`}>
              {result.score === 1 ? '✓ All correct' : `${Math.round(result.score * 100)}% — partial credit`}
            </p>
            {grid}
            <ReagentExplanation r={r} />
          </>
        )}
        <CardDisclaimer />
      </div>
      <div className="border-t border-border bg-bg px-4 pt-2 pb-2">
        {!result && (
          <>
            <p className="mb-2 text-xs text-muted">Choose every role that fits</p>
            {grid}
          </>
        )}
        <button
          type="button"
          disabled={!result && selected.size === 0}
          onClick={result ? onNext : check}
          className="mt-2 min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40"
        >
          {result ? 'Next ↓' : 'Check'}
        </button>
      </div>
    </article>
  );
}

/** Fast mode: one tap on the thumb grid for the main role. */
export function FastCard({ cardKey, r, onNext }: { cardKey: string; r: Reagent; onNext: () => void }) {
  const state = useReagentStore((s) => s.cards[cardKey]) ?? emptyCard;
  const update = useReagentStore.getState().update;
  const verdict = state.pick ? scoreFast(r, state.pick) : null;

  const pick = (role: Role) => {
    if (state.pick) return;
    update(cardKey, { pick: role });
    recordAttempt(r, scoreFast(r, role).score, 'fast', { pick: role });
  };

  return (
    <article className="mx-auto flex h-full max-w-xl flex-col" aria-label={`Main role of ${r.name}`}>
      <CardTop topic={r.topic} reviewed={r.reviewed} itemId={itemId.reagent(r.id)} context="fast" />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
        <ReagentIdentity r={r} compact />
        {verdict && (
          <>
            <p role="status" className={`text-center text-lg font-semibold ${verdict.verdict === 'primary' ? 'text-good' : verdict.verdict === 'secondary' ? 'text-warn' : 'text-bad'}`}>
              {verdict.verdict === 'primary'
                ? '✓ Main role'
                : verdict.verdict === 'secondary'
                  ? `Partly: its main role is ${ROLE_LABELS[r.primaryRole]}`
                  : `✗ Main role: ${ROLE_LABELS[r.primaryRole]}`}
            </p>
            <ReagentExplanation r={r} />
          </>
        )}
        <CardDisclaimer />
      </div>
      <div className="border-t border-border bg-bg px-4 py-2">
        {verdict ? (
          <button type="button" onClick={onNext} className="min-h-14 w-full rounded-xl bg-accent font-semibold text-accent-ink">
            Next ↓
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Main role">
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => pick(role)}
                className={`min-h-14 rounded-xl bg-surface-2 px-2 text-sm font-medium active:bg-accent/30 ${role === 'none' ? 'col-span-2' : ''}`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
