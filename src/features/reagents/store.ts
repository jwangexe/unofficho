import { create } from 'zustand';
import type { Role } from '@/data/schemas';

/** Per-card answers, kept outside the cards so they survive scrolling off-screen. */
export interface ReagentCardState {
  selected: Role[];
  checked: boolean;
  /** Fast mode pick. */
  pick?: Role;
  /** Will-it-react: group picks, whether groups were checked, product pick. */
  groups?: string[];
  groupsChecked?: boolean;
  product?: number;
}

export const useReagentStore = create<{
  cards: Record<string, ReagentCardState>;
  update: (key: string, patch: Partial<ReagentCardState>) => void;
}>((set) => ({
  cards: {},
  update: (key, patch) =>
    set((s) => ({ cards: { ...s.cards, [key]: { ...(s.cards[key] ?? { selected: [], checked: false }), ...patch } } })),
}));

export const emptyCard: ReagentCardState = { selected: [], checked: false };
