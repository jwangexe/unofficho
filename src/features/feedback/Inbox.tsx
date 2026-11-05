/**
 * Private suggestion inbox at /inbox (not linked anywhere). Reads from the Worker with the
 * owner's password (the ADMIN_TOKEN secret); the password is kept on this device only.
 */
import { useCallback, useEffect, useState } from 'react';
import { SUGGESTION_KIND_LABEL, SUGGESTION_KINDS, type SuggestionKind } from '../../../worker/suggestions';
import { Page } from '@/ui/Page';
import { useDocumentTitle } from '@/ui/useDocumentTitle';

interface Row {
  id: number;
  created_at: string;
  kind: SuggestionKind;
  message: string;
  name: string | null;
  page: string | null;
}

const TOKEN_KEY = 'unofficho.inboxToken';

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
};

function toCsv(rows: Row[]): string {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [['id', 'created_at', 'kind', 'message', 'name', 'page'], ...rows.map((r) => [r.id, r.created_at, r.kind, r.message, r.name, r.page])]
    .map((r) => r.map(cell).join(','))
    .join('\n');
}

export default function Inbox() {
  useDocumentTitle('Suggestions inbox');
  const [token, setToken] = useState(readToken);
  const [draft, setDraft] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<SuggestionKind | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suggestions', { headers: { Authorization: `Bearer ${t}` } });
      const body = (await res.json().catch(() => null)) as { suggestions?: Row[]; error?: string } | null;
      if (!res.ok || !body?.suggestions) throw new Error(body?.error ?? `The server said ${res.status}.`);
      setRows(body.suggestions);
    } catch (e) {
      setRows(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  const signIn = () => {
    try {
      localStorage.setItem(TOKEN_KEY, draft);
    } catch {
      // Kept for this visit only.
    }
    setToken(draft);
  };
  const signOut = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing stored.
    }
    setToken('');
    setRows(null);
  };

  const download = () => {
    const blob = new Blob([toCsv(rows ?? [])], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unofficho-suggestions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shown = (rows ?? []).filter((r) => filter === 'all' || r.kind === filter);

  return (
    <Page title="Suggestions">
      {!token || (error && !rows) ? (
        <div className="space-y-3">
          {error && (
            <p className="text-sm text-bad" role="alert">
              {error}
            </p>
          )}
          <label className="block text-sm">
            <span className="text-muted">Inbox password (the ADMIN_TOKEN you set)</span>
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && draft && signIn()}
              autoComplete="current-password"
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text"
            />
          </label>
          <button type="button" onClick={signIn} disabled={!draft} className="min-h-11 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40">
            Open inbox
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(['all', ...SUGGESTION_KINDS] as const).map((k) => {
              const n = k === 'all' ? (rows?.length ?? 0) : (rows ?? []).filter((r) => r.kind === k).length;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={filter === k}
                  onClick={() => setFilter(k)}
                  className={`min-h-9 rounded-md px-3 text-sm ${filter === k ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'}`}
                >
                  {k === 'all' ? 'All' : SUGGESTION_KIND_LABEL[k]} {n}
                </button>
              );
            })}
          </div>
          <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => load(token)} className="min-h-10 rounded-xl bg-surface-2 px-3 text-sm">
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button type="button" onClick={download} disabled={!rows?.length} className="min-h-10 rounded-xl bg-surface-2 px-3 text-sm disabled:opacity-40">
              Download CSV
            </button>
            <span className="flex-1" />
            <button type="button" onClick={signOut} className="min-h-10 px-2 text-sm text-muted">
              Sign out
            </button>
          </div>
          {rows && shown.length === 0 && <p className="text-sm text-muted">No suggestions yet.</p>}
          <ul className="space-y-2">
            {shown.map((r) => (
              <li key={r.id} className="rounded-2xl bg-surface p-4">
                <p className="flex flex-wrap gap-x-2 text-xs text-muted">
                  <span className="font-semibold text-accent">{SUGGESTION_KIND_LABEL[r.kind] ?? r.kind}</span>
                  <span>{new Date(`${r.created_at.replace(' ', 'T')}Z`).toLocaleString()}</span>
                  {r.page && <span>on {r.page}</span>}
                </p>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                {r.name && <p className="mt-1 text-sm text-muted">— {r.name}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  );
}
