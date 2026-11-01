import { useState } from 'react';
import { useLocation } from 'react-router';
import { create } from 'zustand';
import { LIMITS, SUGGESTION_KIND_LABEL, SUGGESTION_KINDS, type SuggestionKind } from '../../../worker/suggestions';
import { SuggestIcon } from '@/ui/icons';
import { Rad } from '@/ui/Rad';
import { Sheet } from '@/ui/Sheet';

/** Open state for the one suggestion sheet, so any link in the app can open it. */
export const useSuggest = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

/** The header button. */
export function SuggestButton() {
  return (
    <button
      type="button"
      onClick={() => useSuggest.getState().setOpen(true)}
      aria-label="Send a suggestion"
      title="Send a suggestion"
      className="grid size-11 place-items-center text-muted"
    >
      <SuggestIcon />
    </button>
  );
}

/** Suggestions go to the site's own database (Cloudflare D1); see DEPLOY.md for reading them. */
export function SuggestSheet() {
  const { open, setOpen } = useSuggest();
  const { pathname } = useLocation();
  const [kind, setKind] = useState<SuggestionKind>('idea');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const close = () => {
    setOpen(false);
    if (status.kind === 'sent') {
      setMessage('');
      setStatus({ kind: 'idle' });
    }
  };

  const send = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus({ kind: 'error', message: 'You are offline. Your message is kept here: send it when you are back online.' });
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, message, name, page: pathname, website }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `The server said ${res.status}.`);
      }
      setStatus({ kind: 'sent' });
    } catch (e) {
      setStatus({ kind: 'error', message: `Could not send: ${e instanceof Error ? e.message : String(e)} Your message is kept here.` });
    }
  };

  const tooShort = message.trim().length < 3;

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Send a suggestion"
      footer={
        status.kind === 'sent' ? (
          <button type="button" onClick={close} className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink">
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={tooShort || status.kind === 'sending'}
            className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-40"
          >
            {status.kind === 'sending' ? 'Sending…' : 'Send'}
          </button>
        )
      }
    >
      {status.kind === 'sent' ? (
        <div className="flex flex-col items-center py-4 text-center" role="status">
          <Rad pose="celebrating" size={120} />
          <p className="mt-2 text-lg font-semibold">Thank you!</p>
          <p className="mt-1 text-sm text-muted">Your suggestion has been sent. It really helps.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          <p className="text-sm text-muted">Spotted a mistake, have an idea, or found something confusing? Tell me here.</p>
          <div role="radiogroup" aria-label="What is it about?" className="grid grid-cols-2 gap-2">
            {SUGGESTION_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={`min-h-11 rounded-xl border text-sm ${kind === k ? 'border-accent bg-accent/15 font-semibold' : 'border-border bg-surface-2'}`}
              >
                {SUGGESTION_KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="text-muted">Your suggestion</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, LIMITS.message))}
              rows={5}
              required
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 p-3 text-base text-text"
            />
            <span className="block text-right text-xs text-muted tabular-nums">
              {message.length}/{LIMITS.message}
            </span>
          </label>
          <label className="block text-sm">
            <span className="text-muted">Name or contact (optional, if you'd like a reply)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, LIMITS.name))}
              autoComplete="off"
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text"
            />
          </label>
          {/* Honeypot: hidden from people, often filled in by spam bots. */}
          <input
            type="text"
            tabIndex={-1}
            aria-hidden
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] size-px opacity-0"
            name="website"
          />
          <p className="text-xs text-muted">
            Sent with it: the page you are on ({pathname}). Nothing else, and no progress data.
          </p>
          {status.kind === 'error' && (
            <p className="text-sm text-bad" role="alert">
              {status.message}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}
