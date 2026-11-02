import { useState, type ReactNode } from 'react';
import type { QueueItem, ReviewNote } from './reviewLogic';
import { useReview } from './store';

/** Flip `reviewed: true` in the source (dev server) or remember it on this device (live site). */
export async function markReviewed(item: QueueItem): Promise<string> {
  const { mark, markWritten } = useReview.getState();
  if (import.meta.env.DEV) {
    try {
      const res = await fetch('/__unofficho/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: item.kind, id: item.id }),
      });
      const body = (await res.json()) as { file?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      markWritten(item.key);
      return `Marked reviewed in ${body.file}.`;
    } catch (e) {
      mark({ key: item.key, kind: item.kind, id: item.id, title: item.title, at: Date.now() });
      return `Could not edit the source (${e instanceof Error ? e.message : e}), so it is listed in the export instead.`;
    }
  }
  mark({ key: item.key, kind: item.kind, id: item.id, title: item.title, at: Date.now() });
  return 'Marked reviewed on this device; it will be in the export.';
}

/** The three review buttons: correct, problem found (with a note), and an optional extra. */
export function ReviewActions({
  item,
  checked,
  instance,
  extra,
  onDone,
}: {
  item: QueueItem;
  /** e.g. "12/20 checked", shown on the Correct button. */
  checked?: string;
  instance?: ReviewNote['instance'];
  extra?: ReactNode;
  /** `noted`: a problem was recorded and the item stays unreviewed. */
  onDone: (message: string, outcome: 'reviewed' | 'noted') => void;
}) {
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const correct = async () => {
    setBusy(true);
    onDone(await markReviewed(item), 'reviewed');
    setBusy(false);
  };
  const saveNote = () => {
    useReview.getState().addNote({ key: item.key, kind: item.kind, id: item.id, title: item.title, note, createdAt: Date.now(), ...(instance && { instance }) });
    setNote('');
    setNoting(false);
    onDone('Problem noted (it is in the export). Moved to the back of the queue.', 'noted');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={correct} className="min-h-11 flex-1 rounded-xl bg-good/90 px-3 text-sm font-semibold text-bg disabled:opacity-50">
          ✓ Correct, mark reviewed{checked && ` (${checked})`}
        </button>
        <button type="button" aria-expanded={noting} onClick={() => setNoting((x) => !x)} className="min-h-11 rounded-xl border border-bad px-3 text-sm font-semibold text-bad">
          Problem found
        </button>
        {extra}
      </div>
      {noting && (
        <div className="space-y-2 rounded-xl border border-bad/50 p-3">
          <label className="block text-sm">
            <span className="text-muted">What is wrong?</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border bg-surface-2 p-2 text-base text-text" />
          </label>
          <button type="button" onClick={saveNote} disabled={!note.trim()} className="min-h-10 w-full rounded-lg bg-bad px-3 text-sm font-semibold text-bg disabled:opacity-40">
            Save note
          </button>
        </div>
      )}
    </div>
  );
}
