import { create } from 'zustand';
import type { CheckResult } from '@/engine/check';
import type { Quantity } from '@/engine/quantity';
import type { CalcInstance } from '@/engine/template';

export interface Chip {
  id: string;
  label: string;
  q: Quantity;
  sig: number;
  source: 'given' | 'step' | 'const';
}

export interface Step {
  id: string;
  /** What was done, e.g. "ΔG = ΔH − TΔS" (LaTeX) or "ln(K₂/K₁)". */
  latex?: string;
  title: string;
  inputs: string[];
  output: string;
  warnings: string[];
}

export interface CardState {
  chips: Chip[];
  steps: Step[];
  result?: CheckResult;
  /** Recorded once per card: the first submission is what counts for progress. */
  recorded: boolean;
  revealed: boolean;
}

interface Store {
  cards: Record<string, CardState>;
  ensure: (inst: CalcInstance) => void;
  addStep: (key: string, step: Omit<Step, 'id' | 'output'>, chip: Omit<Chip, 'id' | 'source'>) => void;
  undo: (key: string) => void;
  setResult: (key: string, result: CheckResult | undefined) => void;
  markRecorded: (key: string) => void;
  reveal: (key: string) => void;
}

const fresh = (inst: CalcInstance): CardState => ({
  chips: inst.givens.map((g) => ({ id: `g.${g.key}`, label: g.label, q: g.q, sig: g.sig, source: 'given' })),
  steps: [],
  recorded: false,
  revealed: false,
});

export const useCalcStore = create<Store>((set) => ({
  cards: {},
  ensure: (inst) =>
    set((s) => (s.cards[inst.key] ? s : { cards: { ...s.cards, [inst.key]: fresh(inst) } })),
  addStep: (key, step, chip) =>
    set((s) => {
      const card = s.cards[key]!;
      const n = card.steps.length + 1;
      const chipId = `s${n}`;
      return {
        cards: {
          ...s.cards,
          [key]: {
            ...card,
            chips: [...card.chips, { ...chip, id: chipId, source: 'step' }],
            steps: [...card.steps, { ...step, id: `step${n}`, output: chipId }],
          },
        },
      };
    }),
  undo: (key) =>
    set((s) => {
      const card = s.cards[key]!;
      const last = card.steps.at(-1);
      if (!last) return s;
      return {
        cards: {
          ...s.cards,
          [key]: { ...card, steps: card.steps.slice(0, -1), chips: card.chips.filter((c) => c.id !== last.output), result: undefined },
        },
      };
    }),
  setResult: (key, result) => set((s) => ({ cards: { ...s.cards, [key]: { ...s.cards[key]!, result } } })),
  markRecorded: (key) => set((s) => ({ cards: { ...s.cards, [key]: { ...s.cards[key]!, recorded: true } } })),
  reveal: (key) => set((s) => ({ cards: { ...s.cards, [key]: { ...s.cards[key]!, revealed: true } } })),
}));
