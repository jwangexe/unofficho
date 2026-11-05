/**
 * Targeted feeds. Progress links to /calc or /reagents with a focus in the query string:
 *   ?topic=kinetics        one topic
 *   ?formula=nernst        templates whose solution uses this formula (calc only)
 *   ?ids=calc:a,calc:b     specific items (namespaced item ids)
 *   ?due=1                 items due for review today
 * The feed narrows its pool to match and shows a banner to clear the focus.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { db, type Section } from '@/storage/db';
import { endOfDay } from '@/storage/srs';

export interface Focus {
  topic?: string;
  formula?: string;
  ids?: string[];
  due?: boolean;
  /** Human-readable description for the banner. */
  label?: string;
}

export function focusQuery(f: Focus): string {
  const p = new URLSearchParams();
  if (f.topic) p.set('topic', f.topic);
  if (f.formula) p.set('formula', f.formula);
  if (f.ids?.length) p.set('ids', f.ids.join(','));
  if (f.due) p.set('due', '1');
  if (f.label) p.set('label', f.label);
  return `?${p}`;
}

export function useFocus(): [Focus | null, () => void] {
  const [params, setParams] = useSearchParams();
  const key = params.toString();
  const focus = useMemo<Focus | null>(() => {
    const f: Focus = {
      topic: params.get('topic') ?? undefined,
      formula: params.get('formula') ?? undefined,
      ids: params.get('ids')?.split(',').filter(Boolean),
      due: params.get('due') === '1',
      label: params.get('label') ?? undefined,
    };
    return f.topic || f.formula || f.ids?.length || f.due ? f : null;
  }, [key]);
  return [focus, () => setParams({}, { replace: true })];
}

/** Item ids due today in one section, read once when the focused feed opens (null while loading). */
export function useDueIds(section: Section, enabled: boolean): Set<string> | null {
  const [ids, setIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    void db.srs
      .where('due')
      .below(endOfDay(Date.now()))
      .filter((s) => s.section === section)
      .primaryKeys()
      .then((keys) => live && setIds(new Set(keys)));
    return () => {
      live = false;
    };
  }, [section, enabled]);
  return enabled ? ids : null;
}

export function FocusBanner({ focus, count, onClear }: { focus: Focus; count: number; onClear: () => void }) {
  const what = focus.label ?? (focus.due ? 'Due for review' : focus.topic ?? focus.formula ?? 'Selected items');
  return (
    <div className="mx-auto mt-2 flex w-full max-w-xl items-center gap-2 px-4">
      <p className="min-w-0 flex-1 truncate rounded-md bg-accent/15 px-3 py-1.5 text-sm text-accent">
        <span className="font-semibold">Focus:</span> {what} · {count} {count === 1 ? 'item' : 'items'}
      </p>
      <button type="button" onClick={onClear} className="min-h-9 shrink-0 rounded-md bg-surface-2 px-3 text-sm text-muted">
        Clear
      </button>
    </div>
  );
}

export function EmptyFocus({ message, onClear }: { message: string; onClear: () => void }) {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-muted">{message}</p>
      <button type="button" onClick={onClear} className="min-h-11 rounded-xl bg-accent px-4 font-semibold text-accent-ink">
        Back to the full feed
      </button>
    </div>
  );
}
