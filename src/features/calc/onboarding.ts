/**
 * First-time help in Calculations: three hints from Rad on the first question (select a chip,
 * apply an operation, submit), and the "Tap a chip…" line, shown until the first operation.
 */
import { create } from 'zustand';
import { db } from '@/storage/db';
import { markTutorialSeen, tutorialSeen } from '@/ui/Tutorial';

/** Kept in the Dexie `settings` table, so it travels with progress export/import. */
export const FIRST_OP_KEY = 'firstOpDone';
const HINTS = 'calc';

export type HintStage = 'select' | 'operate' | 'submit';

interface Onboarding {
  /** The hints are showing (the first question, until submitted or dismissed). */
  hints: boolean;
  stage: HintStage;
  /** The student has applied an operation at least once. */
  firstOpDone: boolean;
  load: () => Promise<void>;
  /** Move the hints on; never back. */
  reach: (stage: HintStage) => void;
  finishHints: () => void;
  replayHints: () => void;
  markFirstOp: () => void;
}

const ORDER: HintStage[] = ['select', 'operate', 'submit'];

export const useOnboarding = create<Onboarding>((set, get) => ({
  hints: !tutorialSeen(HINTS),
  stage: 'select',
  // Assume done until loaded, so returning students never see the line flash.
  firstOpDone: true,
  load: async () => {
    const v = await db.settings.get(FIRST_OP_KEY).catch(() => undefined);
    set({ firstOpDone: v?.value === true });
  },
  reach: (stage) => {
    if (ORDER.indexOf(stage) > ORDER.indexOf(get().stage)) set({ stage });
  },
  finishHints: () => {
    markTutorialSeen(HINTS);
    set({ hints: false });
  },
  replayHints: () => {
    try {
      localStorage.removeItem(`unofficho.tutorial.${HINTS}`);
      localStorage.removeItem('unofficho.tutorial.mechanisms');
    } catch {
      // Nothing stored; nothing to clear.
    }
    set({ hints: true, stage: 'select' });
  },
  markFirstOp: () => {
    if (get().firstOpDone) return;
    set({ firstOpDone: true });
    void db.settings.put({ key: FIRST_OP_KEY, value: true }).catch(() => {});
  },
}));

export const HINT_TEXT: Record<HintStage, { title: string; text: string }> = {
  select: { title: '1 of 3: your data', text: 'Each given value is a chip with its unit. Tap one to select it.' },
  operate: {
    title: '2 of 3: apply an operation',
    text: 'Tap + Operation and pick a formula or some maths, then fill it with chips. (Tap ✕ first if a chip is selected.)',
  },
  submit: { title: '3 of 3: submit', text: 'Your result is a new chip. Tap the one with the answer and press Submit.' },
};
