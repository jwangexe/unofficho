/**
 * Review mode (/review, not linked anywhere): check every item still marked `reviewed: false`.
 *
 * - On the dev server it opens directly, and "Correct, mark reviewed" edits the source file.
 * - On the live site it asks for the owner's password (ADMIN_TOKEN, checked by the Worker),
 *   and marks are kept on this device and included in the export.
 *
 * Calculation templates are solved blind; everything else is checked against a checklist.
 * "Problem found" notes are exported as a markdown list to paste back to Claude.
 */
import { useEffect, useMemo, useState } from 'react';
import { Page } from '@/ui/Page';
import { useDocumentTitle } from '@/ui/useDocumentTitle';
import { CalcReview } from './CalcReview';
import { ChecklistReview } from './ChecklistReview';
import { allItems, exportMarkdown, progressBySection, SECTION_LABEL, SECTIONS, type ReviewSection } from './reviewLogic';
import { useReview } from './store';

const TOKEN_KEY = 'unofficho.inboxToken';
const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
};

/** The dev server needs no password; the live site checks it with the Worker. */
function useGate(): [boolean | null, (token: string) => Promise<string | null>] {
  const [ok, setOk] = useState<boolean | null>(import.meta.env.DEV ? true : null);
  const check = async (token: string) => {
    try {
      const res = await fetch('/api/admin/check', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 204) {
        try {
          localStorage.setItem(TOKEN_KEY, token);
        } catch {
          // Kept for this visit only.
        }
        setOk(true);
        return null;
      }
      setOk(false);
      return res.status === 503 ? 'Set the ADMIN_TOKEN secret on Cloudflare first.' : 'Wrong password.';
    } catch {
      setOk(false);
      return 'Could not reach the server.';
    }
  };
  useEffect(() => {
    if (import.meta.env.DEV) return;
    const t = readToken();
    if (t) void check(t);
    else setOk(false);
  }, []);
  return [ok, check];
}

function Gate({ check }: { check: (t: string) => Promise<string | null> }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const submit = async () => setError((await check(draft)) ?? '');
  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-bad" role="alert">
          {error}
        </p>
      )}
      <label className="block text-sm">
        <span className="text-muted">Password (the same ADMIN_TOKEN as the suggestions inbox)</span>
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && draft && void submit()}
          autoComplete="current-password"
          className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text"
        />
      </label>
      <button type="button" onClick={submit} disabled={!draft} className="min-h-11 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40">
        Open review mode
      </button>
    </div>
  );
}

function Notes() {
  const { notes, marks, removeNote, clear } = useReview();
  const [copied, setCopied] = useState(false);
  const md = exportMarkdown(notes, marks);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `unofficho-review-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="rounded-2xl border border-border p-4" aria-label="Notes">
      <h2 className="font-semibold">
        Notes: {notes.length} {notes.length === 1 ? 'problem' : 'problems'}
        {marks.length > 0 && `, ${marks.length} marked here`}
      </h2>
      <p className="mt-1 text-xs text-muted">Kept in this browser. Export them and paste the list to Claude to fix in one batch.</p>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm">
          {notes.map((n) => (
            <li key={n.createdAt} className="flex items-start gap-2 rounded-lg bg-surface-2 px-2 py-1">
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{n.title}</span>: {n.note}
              </span>
              <button type="button" onClick={() => removeNote(n.createdAt)} aria-label={`Delete note on ${n.title}`} className="shrink-0 px-1 text-muted">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="min-h-10 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-ink">
          {copied ? 'Copied ✓' : 'Copy as markdown'}
        </button>
        <button type="button" onClick={download} className="min-h-10 rounded-xl bg-surface-2 px-3 text-sm">
          Download .md
        </button>
        {(notes.length > 0 || marks.length > 0) && (
          <button type="button" onClick={() => window.confirm('Delete all notes and marks in this browser?') && clear()} className="min-h-10 px-2 text-sm text-muted">
            Clear
          </button>
        )}
      </div>
    </section>
  );
}

export default function Review() {
  useDocumentTitle('Review mode');
  const [ok, check] = useGate();
  const { marks, written } = useReview();
  const [section, setSection] = useState<ReviewSection | 'all'>('all');
  const [topic, setTopic] = useState('all');
  const [current, setCurrent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);

  const items = useMemo(allItems, []);
  const done = useMemo(() => new Set([...marks.map((m) => m.key), ...written]), [marks, written]);
  const progress = progressBySection(items, done);
  const topics = [...new Set(items.filter((i) => section === 'all' || i.section === section).map((i) => i.topic))].sort();
  const queue = items.filter((i) => !i.reviewed && !done.has(i.key) && (section === 'all' || i.section === section) && (topic === 'all' || i.topic === topic));
  // Skipped items go to the back of the queue.
  const ordered = [...queue.filter((i) => !skipped.includes(i.key)), ...skipped.map((k) => queue.find((i) => i.key === k)).filter((i) => !!i)];
  const item = ordered.find((i) => i.key === current) ?? ordered[0];

  if (ok === null) return <Page title="Review mode">Checking…</Page>;
  if (!ok) {
    return (
      <Page title="Review mode">
        <Gate check={check} />
      </Page>
    );
  }

  const next = (msg: string, outcome: 'reviewed' | 'noted') => {
    setMessage(msg);
    if (outcome === 'noted' && item) setSkipped((s) => [...s.filter((k) => k !== item.key), item.key]);
    setCurrent(null);
    document.querySelector('main')?.scrollTo(0, 0);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10">
      <h1 className="text-2xl font-semibold">Review mode</h1>
      <p className="mt-1 text-sm text-muted">
        {import.meta.env.DEV ? 'Dev server: marking an item reviewed edits its source file.' : 'Live site: marks are kept on this device and listed in the export.'}
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Progress">
        {progress.map((p) => (
          <li key={p.section} className="rounded-xl bg-surface p-3">
            <p className="text-xs text-muted">{SECTION_LABEL[p.section]}</p>
            <p className="font-semibold tabular-nums">
              {p.reviewed} / {p.total}
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-accent/15" role="meter" aria-label={`${SECTION_LABEL[p.section]} reviewed`} aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.reviewed}>
              <div className="h-full rounded-full bg-accent" style={{ width: `${p.total ? (100 * p.reviewed) / p.total : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Section">
          {(['all', ...SECTIONS] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={section === s}
              onClick={() => {
                setSection(s);
                setTopic('all');
                setCurrent(null);
              }}
              className={`min-h-9 rounded-full px-3 text-sm ${section === s ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}
            >
              {s === 'all' ? 'All' : SECTION_LABEL[s]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Topic</span>
          <select
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setCurrent(null);
            }}
            className="min-h-9 rounded-lg border border-border bg-surface-2 px-2 text-text"
          >
            <option value="all">All</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message && (
        <p className="mt-3 rounded-xl bg-accent/15 px-3 py-2 text-sm" role="status">
          {message}
        </p>
      )}

      {!item ? (
        <p className="mt-6 text-muted">Nothing left to review with these filters. 🎉</p>
      ) : (
        <section className="mt-4" aria-label="Current item">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{item.title}</h2>
            <span className="shrink-0 text-xs text-muted">
              {SECTION_LABEL[item.section]} · {item.topic} · {ordered.length} left
            </span>
            <button
              type="button"
              onClick={() => {
                setSkipped((s) => [...s.filter((k) => k !== item.key), item.key]);
                setCurrent(null);
                setMessage('');
              }}
              className="min-h-9 shrink-0 rounded-lg bg-surface-2 px-3 text-sm"
            >
              Skip →
            </button>
          </div>
          {item.kind === 'template' ? <CalcReview key={item.key} item={item} onDone={next} /> : <ChecklistReview key={item.key} item={item} onDone={next} />}
        </section>
      )}

      {ordered.length > 1 && (
        <details className="mt-6 rounded-2xl bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold">Up next ({ordered.length - 1})</summary>
          <ol className="mt-2 max-h-80 space-y-1 overflow-y-auto text-sm">
            {ordered.slice(1).map((i) => (
              <li key={i.key}>
                <button type="button" onClick={() => setCurrent(i.key)} className="w-full rounded-lg px-2 py-1 text-left hover:bg-surface-2">
                  {i.title} <span className="text-xs text-muted">· {SECTION_LABEL[i.section]}{i.difficulty ? ` · d${i.difficulty}` : ''}</span>
                </button>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="mt-6">
        <Notes />
      </div>
    </div>
  );
}
