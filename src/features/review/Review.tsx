/**
 * Dev-only content review. Lists every item with `reviewed: false`, with its TODO(verify)
 * notes and any local "flag as wrong" reports. "Mark reviewed" asks the dev server to flip
 * the flag in the item's source file (scripts/review.ts); Vite then reloads the content.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { reactItems, reagents } from '@/data';
import { bookPages } from '@/data/book';
import { MECHANISMS } from '@/data/mechanisms';
import { ALL_TEMPLATES } from '@/data/templates';
import { FORMULAS } from '@/engine/formulas';
import { F, R } from '@/features/book/mdx';
import { focusQuery } from '@/features/focus';
import { db, type Flag } from '@/storage/db';
import { downloadJson } from '@/storage/exportImport';
import { itemId } from '@/storage/itemIds';
import { Page } from '@/ui/Page';
import type { ReviewKind } from '../../../scripts/review';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

interface Row {
  kind: ReviewKind;
  id: string;
  title: string;
  /** Item id used for flags. */
  flagId: string;
  todo: string[];
  view: React.ReactNode;
}

const KIND_LABEL: Record<ReviewKind, string> = {
  book: 'Book pages',
  reagent: 'Reagents',
  react: 'Will it react?',
  formula: 'Formulas',
  template: 'Questions',
  mechanism: 'Mechanisms',
};

const linkCls = 'text-accent underline underline-offset-4';

function unreviewed(): Row[] {
  return [
    ...bookPages
      .filter((p) => !p.reviewed && !p.stub)
      .map((p) => ({ kind: 'book' as const, id: p.id, title: p.title, flagId: `book:${p.id}`, todo: p.todoVerify ?? [], view: <Link className={linkCls} to={`/book/${p.id}`}>Open page</Link> })),
    ...reagents
      .filter((r) => !r.reviewed)
      .map((r) => ({ kind: 'reagent' as const, id: r.id, title: r.name, flagId: itemId.reagent(r.id), todo: r.todoVerify ?? [], view: <R id={r.id}>Open card</R> })),
    ...reactItems
      .filter((x) => !x.reviewed)
      .map((x) => ({
        kind: 'react' as const, id: x.id, title: `${x.substrate.name} + ${x.reagentId}`, flagId: itemId.react(x.id), todo: x.todoVerify ?? [],
        view: <Link className={linkCls} to={`/reagents${focusQuery({ ids: [itemId.react(x.id)] })}`}>Try it</Link>,
      })),
    ...FORMULAS.filter((f) => !f.reviewed).map((f) => ({ kind: 'formula' as const, id: f.id, title: f.name, flagId: f.id, todo: f.todoVerify ?? [], view: <F id={f.id}>Open formula</F> })),
    ...MECHANISMS.filter((m) => !m.reviewed).map((m) => ({
      kind: 'mechanism' as const, id: m.id, title: m.title, flagId: itemId.mech(m.id), todo: m.todoVerify ?? [],
      view: <Link className={linkCls} to={`/calc${focusQuery({ ids: [itemId.mech(m.id)] })}`}>Try it</Link>,
    })),
    ...ALL_TEMPLATES.filter((t) => !t.reviewed).map((t) => ({
      kind: 'template' as const, id: t.id, title: t.title, flagId: itemId.calc(t.id), todo: t.todoVerify ?? [],
      view: <Link className={linkCls} to={`/calc${focusQuery({ ids: [itemId.calc(t.id)] })}`}>Try it</Link>,
    })),
  ];
}

export default function Review() {
  useDocumentTitle('Review content');
  const all = useMemo(unreviewed, []);
  const [kind, setKind] = useState<ReviewKind | 'all'>('all');
  const [onlyTodo, setOnlyTodo] = useState(false);
  const [query, setQuery] = useState('');
  const [flags, setFlags] = useState<Flag[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ kind: ReviewKind; id: string }[]>([]);

  useEffect(() => {
    void db.flags.toArray().then(setFlags);
  }, []);

  // Rows marked here stay hidden until Vite reloads the content, which drops them from `all` itself.
  const doneKeys = new Set(done.map((d) => `${d.kind}:${d.id}`));
  const remaining = all.filter((r) => !doneKeys.has(`${r.kind}:${r.id}`)).length;
  const rows = all.filter(
    (r) =>
      !doneKeys.has(`${r.kind}:${r.id}`) &&
      (kind === 'all' || r.kind === kind) &&
      (!onlyTodo || r.todo.length > 0) &&
      (!query || `${r.title} ${r.id}`.toLowerCase().includes(query.toLowerCase())),
  );
  const flagsFor = (r: Row) => flags.filter((f) => f.itemId === r.flagId || f.itemId.startsWith(`${r.flagId}:`));

  async function mark(r: Row) {
    const key = `${r.kind}:${r.id}`;
    setStatus((s) => ({ ...s, [key]: 'Saving…' }));
    try {
      const res = await fetch('/__unofficho/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: r.kind, id: r.id }) });
      const body = (await res.json()) as { file?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      setDone((d) => [...d, { kind: r.kind, id: r.id }]);
      setStatus((s) => ({ ...s, [key]: `Saved in ${body.file}` }));
    } catch (e) {
      setStatus((s) => ({ ...s, [key]: e instanceof Error ? e.message : String(e) }));
    }
  }

  const counts = Object.fromEntries((Object.keys(KIND_LABEL) as ReviewKind[]).map((k) => [k, all.filter((r) => r.kind === k && !doneKeys.has(`${k}:${r.id}`)).length]));

  return (
    <Page title="Review content">
      <p className="-mt-2 mb-3 text-sm text-muted">
        Dev only. {remaining} items still have <code>reviewed: false</code>. Marking one edits its source file; commit the change as usual.
      </p>
      <nav aria-label="Kinds" className="mb-2 flex gap-1 overflow-x-auto">
        {(['all', ...Object.keys(KIND_LABEL)] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k as ReviewKind | 'all')}
            aria-current={k === kind ? 'page' : undefined}
            className={`min-h-9 shrink-0 rounded-full px-3 text-sm ${k === kind ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}
          >
            {k === 'all' ? 'All' : `${KIND_LABEL[k as ReviewKind]} ${counts[k]}`}
          </button>
        ))}
      </nav>
      <div className="mb-3 flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search items"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3"
        />
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyTodo} onChange={(e) => setOnlyTodo(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          Has TODO
        </label>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => {
          const key = `${r.kind}:${r.id}`;
          const fl = flagsFor(r);
          return (
            <li key={key} className="rounded-2xl bg-surface p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted">
                    {KIND_LABEL[r.kind]} · <code>{r.id}</code> · {r.view}
                  </p>
                </div>
                <button type="button" onClick={() => mark(r)} className="min-h-10 shrink-0 rounded-xl border border-good/60 px-3 text-sm font-medium">
                  Mark reviewed
                </button>
              </div>
              {r.todo.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-xl border border-warn/40 px-3 py-2 text-sm">
                  {r.todo.map((t) => (
                    <li key={t}>
                      <span className="font-semibold text-warn">TODO(verify) </span>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {fl.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-xl border border-bad/40 px-3 py-2 text-sm">
                  {fl.map((f) => (
                    <li key={f.id}>
                      <span className="font-semibold text-bad">Flagged </span>
                      {f.note || '(no note)'}
                    </li>
                  ))}
                </ul>
              )}
              {status[key] && (
                <p className="mt-2 text-xs text-muted" role="status">
                  {status[key]}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && <p className="text-sm text-muted">Nothing to review with these filters.</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-xl bg-surface-2 px-4 text-sm font-medium"
          onClick={() =>
            downloadJson(
              { format: 'unofficho-review', exportedAt: Date.now(), reviewed: done, unreviewed: rows.map(({ kind, id, todo }) => ({ kind, id, todoVerify: todo })) },
              `unofficho-review-${new Date().toISOString().slice(0, 10)}.json`,
            )
          }
        >
          Export review state
        </button>
      </div>
    </Page>
  );
}
