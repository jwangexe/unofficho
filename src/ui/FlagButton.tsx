import { useState } from 'react';
import { db, type Section } from '@/storage/db';
import { Sheet } from './Sheet';

/** "Flag as wrong": saves a note to the local flagged list (exportable from Progress). */
export function FlagButton({ itemId, section, context }: { itemId: string; section: Section; context?: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [flagged, setFlagged] = useState(false);

  const save = async () => {
    await db.flags.add({ itemId, section, note: context ? `${note}\n\n[${context}]`.trim() : note, createdAt: Date.now() });
    setFlagged(true);
    setOpen(false);
    setNote('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={flagged ? 'Flagged as wrong (flag again)' : 'Flag as wrong'}
        className={`grid size-11 place-items-center ${flagged ? 'text-warn' : 'text-muted'}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={flagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M5 21V4h11l-1.5 4L16 12H5" strokeLinejoin="round" />
        </svg>
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Flag as wrong"
        footer={
          <button type="button" onClick={save} className="min-h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink">
            Save flag
          </button>
        }
      >
        <label className="block text-sm text-muted">
          What looks wrong? (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-border bg-surface-2 p-3 text-base text-text"
          />
        </label>
        <p className="mt-2 text-xs text-muted">Saved on this device. Export the flagged list from Progress.</p>
      </Sheet>
    </>
  );
}
