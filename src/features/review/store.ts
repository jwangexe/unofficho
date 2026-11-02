import { create } from 'zustand';
import type { LocalMark, ReviewNote } from './reviewLogic';

const KEY = 'unofficho.review';

interface Saved {
  notes: ReviewNote[];
  /** Marked reviewed on a device that cannot edit the source (the live site), for the export. */
  marks: LocalMark[];
}

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    return { notes: s?.notes ?? [], marks: s?.marks ?? [] };
  } catch {
    return { notes: [], marks: [] };
  }
}

function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked: notes stay for this visit only.
  }
}

/**
 * Review notes and marks, kept in this browser. `written` holds items marked reviewed in the
 * source files this session (dev server), so they leave the queue before the reload lands.
 */
export const useReview = create<
  Saved & {
    written: string[];
    addNote: (n: ReviewNote) => void;
    removeNote: (createdAt: number) => void;
    mark: (m: LocalMark) => void;
    markWritten: (key: string) => void;
    clear: () => void;
  }
>((set, get) => {
  const persist = () => save({ notes: get().notes, marks: get().marks });
  return {
    ...load(),
    written: [],
    addNote: (n) => {
      set((s) => ({ notes: [...s.notes, n] }));
      persist();
    },
    removeNote: (createdAt) => {
      set((s) => ({ notes: s.notes.filter((n) => n.createdAt !== createdAt) }));
      persist();
    },
    mark: (m) => {
      set((s) => ({ marks: [...s.marks.filter((x) => x.key !== m.key), m] }));
      persist();
    },
    markWritten: (key) => set((s) => ({ written: [...s.written, key] })),
    clear: () => {
      set({ notes: [], marks: [] });
      persist();
    },
  };
});
